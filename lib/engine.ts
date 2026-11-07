import { geometry, graph, mermaid, scene3d, scientific } from "./artifacts";
import { evaluate, parse } from "mathjs";
import { findTopic, relatedTopics, topics, type Topic } from "./knowledge";
import type { AIResponse, Artifact, EngineContext, PlotSeries, SceneConfig } from "./types";
import { uid } from "./utils";

const PALETTE = ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"];

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

function base(content: string, artifacts: Artifact[], followUps: string[]): AIResponse {
  return {
    id: uid("res"),
    content,
    artifacts,
    followUps: followUps.slice(0, 4),
    meta: { source: "local", model: "Axiom Engine v2", latency: 0 },
  };
}

/* ------------------------------------------------------------------ */
/* Capability / meta handling                                          */
/* ------------------------------------------------------------------ */

const CAPABILITIES = `### I turn questions into things you can see
I'm **Axiom**, your visual study engine. Type any concept, and I'll render the right kind of visual automatically:

- **2D graphs** — functions, curves, parametric plots with zoom, pan and a live cursor read-out.
- **3D scenes** — crystal lattices (FCC/BCC/SC), an electrolytic cell, a solenoid, atomic shells. All draggable.
- **Scientific plots** — P–V diagrams, SHM, photoelectric, Maxwell–Boltzmann, Raoult's law, Arrhenius, Ellingham and more.
- **Flowcharts & mind maps** — for processes, hierarchies, comparisons.
- **Geometric patterns** — procedural mandalas and spirals.
- **Explanations and tables** — with math typeset in LaTeX.

Try: *"Show FCC, highlight face diagonal"*, *"Plot vapor pressure vs mole fraction for an ideal solution"*, or *"Explain the photoelectric effect with graphs."*

> **Tip** — once a 3D scene is open you can talk to it: *"change to BCC"*, *"highlight body diagonal"*, *"stop rotating"*.`;

function isGreeting(prompt: string) {
  return /^(hi|hey|hello|yo|namaste|good (morning|evening|afternoon)|thanks|thank you|who are you|what can you do|help|how do you work)\b/i.test(
    prompt.trim()
  );
}

/* ------------------------------------------------------------------ */
/* Direct function plotting                                            */
/* ------------------------------------------------------------------ */

function cleanExpression(raw: string) {
  let expr = raw.trim();
  expr = expr.replace(/^(plot|graph|draw|sketch)\s+/i, "");
  expr = expr.replace(/^y\s*=\s*/i, "");
  expr = expr.replace(/^f\s*\(\s*x\s*\)\s*=\s*/i, "");
  expr = expr.split(/[.;]\s*$/)[0];
  expr = expr.trim();
  // "{x}" is the standard fractional-part notation
  expr = expr.replace(/\{\s*x\s*\}/g, "(x - floor(x))");
  return expr;
}

const FUNCTION_SCOPE = { t: 1, e: Math.E, pi: Math.PI, tau: Math.PI * 2 };

function isPlottable(expression: string) {
  if (!expression || expression.length > 90) return false;

  const words = expression.match(/[A-Za-z]{2,}/g) ?? [];
  const allowedWords = new Set([
    "x", "t", "e", "pi", "tau",
    "sin", "cos", "tan", "asin", "acos", "atan", "sinh", "cosh", "tanh",
    "sqrt", "cbrt", "log", "log10", "log2", "exp", "abs", "floor", "ceil",
    "round", "sign", "mod",
  ]);
  const unknownWords = words.filter((word) => !allowedWords.has(word.toLowerCase()));
  if (unknownWords.length > 0) return false;

  try {
    parse(expression);
  } catch {
    return false;
  }

  for (const x of [-1.7, -0.4, 0.6, 2.3]) {
    try {
      const value = evaluate(expression, { ...FUNCTION_SCOPE, x });
      if (typeof value === "number" && Number.isFinite(value)) return true;
    } catch {
      // keep probing
    }
  }
  return false;
}

function looksLikeFunctionPrompt(prompt: string) {
  const p = normalize(prompt);
  const explicit = /^\s*(plot|graph|draw|sketch)?\s*(y|f\s*\(x\))\s*=/.test(p);
  if (!explicit && /(explain|why|what|derive|difference|prove|quiz|test|plan|versus|\bvs\b)/.test(p)) return false;
  if (/^(plot|graph|draw|sketch)\b/.test(p)) return true;
  if (/^y\s*=/.test(p)) return true;
  if (/(sin|cos|tan|sqrt|log|exp|abs|floor)\s*\(/.test(p) && /=/.test(p)) return true;
  return false;
}

function buildFunctionResponse(prompt: string): AIResponse | null {
  const raw = cleanExpression(prompt);
  if (!raw || raw.length > 90) return null;
  if (!isPlottable(raw)) return null;

  // Parametric helper: "x = 3cos(t), y = 3sin(t)"
  const parametric = raw.match(/x\s*=\s*([^,]+),\s*y\s*=\s*(.+)/i);
  let series: PlotSeries[];
  if (parametric) {
    series = [
      {
        expression: parametric[1].trim(),
        yExpression: parametric[2].trim(),
        mode: "parametric",
        tRange: [0, 6.2832],
        label: "parametric curve",
      },
    ];
  } else {
    series = [{ expression: raw }];
  }

  const safeLabel = raw.replace(/\s+/g, "");
  return base(
    `### Plotted: $y = ${prettyExpression(raw)}$
Here is the live graph. Drag to pan, scroll or pinch to zoom, and hover to read the cursor coordinates.

**Try these moves**
- Zoom into a region to inspect curvature, roots or asymptotes.
- Hover along the curve — the read-out shows the exact (x, y) at your cursor.
- Use the example chips in the Grapher to compare related functions.

${expressionNotes(raw)}`,
    [
      graph(`y = ${raw}`, series, {
        xRange: [-10, 10],
        caption: `Interactive plot of ${safeLabel}. Scroll to zoom, drag to pan.`,
      }),
    ],
    ["Plot its derivative", "Compare with a related function", "Show the same function enlarged"]
  );
}

function expressionNotes(expr: string): string {
  const notes: string[] = [];
  if (/\{x\}|floor/.test(expr)) notes.push("The fractional part has period 1 and a jump at every integer.");
  if (/sin|cos|tan/.test(expr)) notes.push("Trigonometric functions repeat — the visible window shows about three periods.");
  if (/x\s*\^\s*2|x\^2/.test(expr)) notes.push("A quadratic produces a parabola; its vertex is where the slope is zero.");
  if (/1\s*\/\s*x|\\frac\{1\}\{x\}/.test(expr)) notes.push("Watch the asymptote near x = 0 — the curve is undefined there.");
  if (/abs|sqrt/.test(expr)) notes.push("The domain is limited: values that make the radicand negative are undefined.");
  return notes.join(" ");
}

function dedupeArtifacts(artifacts: Artifact[]): Artifact[] {
  const seen = new Set<string>();
  return artifacts.filter((artifact) => {
    const key =
      artifact.type === "scientific"
        ? `scientific:${artifact.preset}`
        : artifact.type === "mermaid"
          ? `mermaid:${artifact.title}`
          : artifact.type === "scene3d"
            ? `scene3d:${artifact.config.type}`
            : `${artifact.type}:${artifact.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function prettyExpression(raw: string) {
  if (raw.replace(/\s+/g, "") === "(x-floor(x))") return "\\{x\\}";
  if (raw.replace(/\s+/g, "") === "x-floor(x)") return "\\{x\\}";
  return escapeLatex(raw);
}

function escapeLatex(input: string) {
  return input.replace(/\\/g, "\\backslash ").replace(/\$/g, "\\$");
}

/* ------------------------------------------------------------------ */
/* Scene mutations                                                     */
/* ------------------------------------------------------------------ */

const SCENE_VERBS = /(change|switch|make|set|toggle|highlight|show|hide|turn|stop|rotate|spin|bigger|smaller|increase|decrease|now|instead|remove|add|convert|morph)/;

function mutateScene(prompt: string, lastScene: SceneConfig): { scene: SceneConfig; note: string } | null {
  const p = normalize(prompt);
  if (!SCENE_VERBS.test(p)) return null;

  if (lastScene.type === "crystal") {
    const scene: SceneConfig = { ...lastScene };
    if (/\bbcc\b|body.?cent/ .test(p)) {
      scene.lattice = "bcc";
      if (/highlight|diagonal/.test(p) || /change|switch|morph|convert|now/.test(p)) {
        scene.highlight = "body-diagonal";
        scene.showHighlight = true;
      }
      return { scene, note: "Morphed to **body-centred cubic (BCC)**. Atoms sit at the corners plus one at the body centre, with $\\sqrt3 a = 4r$." };
    }
    if (/\bfcc\b|face.?cent|ccp/.test(p)) {
      scene.lattice = "fcc";
      if (/highlight|diagonal/.test(p) || /change|switch|morph|convert|now/.test(p)) {
        scene.highlight = "face-diagonal";
        scene.showHighlight = true;
      }
      return { scene, note: "Switched to **face-centred cubic (FCC)** — the closest-packed lattice (74%)." };
    }
    if (/simple cubic|\bsc\b/.test(p)) {
      scene.lattice = "sc";
      scene.highlight = "edge";
      scene.showHighlight = true;
      return { scene, note: "Now showing **simple cubic (SC)**. Atoms touch along the edge, $a = 2r$, packing 52.4%." };
    }
    if (/hide.*(highlight|diagonal)|remove.*(highlight|diagonal)/.test(p)) {
      return { scene: { ...scene, showHighlight: false }, note: "Diagonal highlight hidden." };
    }
    if (/face.?diag/.test(p)) return { scene: { ...scene, highlight: "face-diagonal", showHighlight: true }, note: "Highlighting the **face diagonal** — length $\\sqrt2 a$." };
    if (/body.?diag/.test(p)) return { scene: { ...scene, highlight: "body-diagonal", showHighlight: true }, note: "Highlighting the **body diagonal** — length $\\sqrt3 a$." };
    if (/hide.*(cell|box|edge)|remove.*(cell|box|edge)/.test(p)) return { scene: { ...scene, showCell: false }, note: "Unit cell outline hidden." };
    if (/show.*(cell|box|edge)/.test(p)) return { scene: { ...scene, showCell: true }, note: "Unit cell outline visible." };
    if (/smaller/.test(p)) return { scene: { ...scene, atomScale: Math.max(0.3, (scene.atomScale ?? 0.62) - 0.1) }, note: "Atoms made smaller so the lattice is clearer." };
    if (/bigger|larger/.test(p)) return { scene: { ...scene, atomScale: Math.min(1, (scene.atomScale ?? 0.62) + 0.1) }, note: "Atoms made larger." };
    if (/stop|pause|freeze/.test(p)) return { scene: { ...scene, autoRotate: false }, note: "Rotation paused — drag to orbit manually." };
    if (/rotat|spin|auto/.test(p)) return { scene: { ...scene, autoRotate: !scene.autoRotate }, note: scene.autoRotate ? "Manual orbit only." : "Auto-rotation enabled." };
  }

  if (lastScene.type === "electrolytic") {
    const scene: SceneConfig = { ...lastScene };
    if (/hide.*label|remove.*label/.test(p)) return { scene: { ...scene, showLabels: false }, note: "Labels hidden — try labelling the anode and cathode yourself." };
    if (/show.*label|add.*label/.test(p)) return { scene: { ...scene, showLabels: true }, note: "Labels restored." };
    if (/stop.*(flow|electron)|hide.*flow/.test(p)) return { scene: { ...scene, showFlow: false }, note: "Electron flow animation paused." };
    if (/show.*flow|electron flow|animate/.test(p)) return { scene: { ...scene, showFlow: true }, note: "Electron flow running: anode → wire → cathode." };
    if (/stop|pause/.test(p)) return { scene: { ...scene, autoRotate: false }, note: "Rotation paused." };
    if (/rotat|spin/.test(p)) return { scene: { ...scene, autoRotate: true }, note: "Auto-rotation enabled." };
  }

  if (lastScene.type === "solenoid") {
    const scene: SceneConfig = { ...lastScene };
    if (/hide.*(field|line)/.test(p)) return { scene: { ...scene, showField: false }, note: "Field lines hidden to show the coil alone." };
    if (/show.*(field|line)|magnetic field/.test(p)) return { scene: { ...scene, showField: true }, note: "Field lines visible: parallel inside, looping outside." };
    if (/hide.*current|stop.*current/.test(p)) return { scene: { ...scene, showCurrent: false }, note: "Current animation stopped." };
    if (/show.*current|current/.test(p)) return { scene: { ...scene, showCurrent: true }, note: "Current flowing through the turns." };
    if (/stop|pause/.test(p)) return { scene: { ...scene, autoRotate: false }, note: "Rotation paused." };
    if (/rotat|spin/.test(p)) return { scene: { ...scene, autoRotate: true }, note: "Auto-rotation enabled." };
  }

  if (lastScene.type === "atom") {
    const scene: SceneConfig = { ...lastScene };
    if (/hide.*electron/.test(p)) return { scene: { ...scene, showElectrons: false }, note: "Electron shell animation hidden." };
    if (/show.*electron|add.*electron/.test(p)) return { scene: { ...scene, showElectrons: true }, note: "Electrons orbiting in their shells." };
    if (/stop|pause/.test(p)) return { scene: { ...scene, autoRotate: false }, note: "Rotation paused." };
    if (/rotat|spin/.test(p)) return { scene: { ...scene, autoRotate: true }, note: "Auto-rotation enabled." };
  }

  return null;
}

function switchScene(prompt: string, context?: EngineContext): AIResponse | null {
  const p = normalize(prompt);
  if (!context?.lastScene) return null;
  if (!SCENE_VERBS.test(p)) return null;
  if (!/(bcc|fcc|simple cubic|\bsc\b|diagonal|electron|field|label|rotat|spin|atom|smaller|bigger|cell|flow|current)/.test(p)) return null;

  const result = mutateScene(prompt, context.lastScene);
  if (!result) return null;

  return base(
    `${result.note}\n\nThe scene has been updated in place — drag to orbit, scroll to zoom, or keep refining it with words.`,
    [
      scene3d(sceneTitle(result.scene), result.scene, {
        description: "Live 3D scene — updates apply instantly",
      }),
    ],
    ["Change to BCC", "Highlight the body diagonal", "Show an electrolytic cell in 3D", "Stop rotating"]
  );
}

function sceneTitle(scene: SceneConfig) {
  switch (scene.type) {
    case "crystal":
      return `${scene.lattice.toUpperCase()} lattice — 3D`;
    case "electrolytic":
      return "Electrolytic cell — 3D";
    case "solenoid":
      return "Solenoid with field lines — 3D";
    case "atom":
      return "Atomic shells — 3D";
  }
}

/* ------------------------------------------------------------------ */
/* Requests for diagrams, patterns and quizzes                          */
/* ------------------------------------------------------------------ */

function wantsDiagram(prompt: string) {
  return /(flowchart|flow chart|mind ?map|concept map|diagram|process|steps|hierarchy|chart)/i.test(prompt);
}

function wantsPattern(prompt: string) {
  return /(pattern|mandala|spirograph|geometric|geometry pattern|rangoli|symmetry design|visual pattern)/i.test(prompt);
}

function wantsQuiz(prompt: string) {
  return /(quiz|test me|practice questions|questions on|mcqs?|ask me|solve these)/i.test(prompt);
}

function parseNumber(prompt: string, fallback: number) {
  const match = prompt.match(/(\d{1,2})\s*(petals|sides|points|fold)?/);
  if (!match) return fallback;
  const value = Number(match[1]);
  return value >= 3 && value <= 24 ? value : fallback;
}

function patternResponse(prompt: string): AIResponse {
  const p = normalize(prompt);
  const petals = parseNumber(prompt, 12);
  const kind = /spiral|spiro/.test(p) ? "spiral" : /wave/.test(p) ? "wave" : /polygon|hexagon|star|geometr/.test(p) ? "polygon" : "mandala";
  const layers = kind === "mandala" ? 5 : 4;

  return base(
    `### A little geometry you can read like music
Here is a procedural **${kind}** with ${petals} folds of symmetry. It's generated from polar geometry:

$$r = R\\cos\\left(\\frac{p}{2}\\theta\\right)$$

where $p$ controls the number of petals and the phase offset creates the layered symmetry.

Geometric patterns like this aren't decoration — they illustrate symmetry, periodicity and rotational invariance, the same ideas behind **crystal lattices**, **wave interference** and **rotational symmetry** in coordinate geometry.

- **Rotational symmetry** of order ${petals}: rotate by 360°/${petals} and it maps onto itself.
- **Reflective symmetry:** axes through the centre.
- **Periodicity:** the pattern repeats exactly at fixed angular intervals.

${examNoteLine("JEE/NEET connection: rotational symmetry describes crystal systems and molecular geometry. Counting symmetry elements is a fast way to classify structures.")}`,
    [
      geometry(`${kind[0].toUpperCase()}${kind.slice(1)} — ${petals}-fold symmetry`, {
        kind,
        petals,
        layers,
        caption: `${petals}-fold rotational symmetry generated from a polar curve.`,
      }),
    ],
    ["Show a 6-petal version", "Draw a crystal lattice", "Explain symmetry elements"]
  );
}

function examNoteLine(text: string) {
  return `> **Connection** — ${text}`;
}

function quizResponse(topic: Topic): AIResponse {
  const questions = topic.quiz ?? [
    { q: `State the core idea of ${topic.title}.`, a: "Open the concept card in the explanation above and try again with the book closed." },
    { q: `Give one formula or graph associated with ${topic.chapter}.`, a: "Use the visual attached to this topic as a memory hook." },
  ];

  const content = `### Quick check — ${topic.title}
Answer in your head before reading the key. Five minutes of retrieval beats thirty minutes of re-reading.

**Questions**

${questions.map((item, index) => `${index + 1}. ${item.q}`).join("\n\n")}

**Answer key**

${questions.map((item, index) => `${index + 1}. ${item.a}`).join("\n\n")}

Want a harder set? Ask for a **"harder quiz on ${topic.title}"**, or connect an LLM key in Settings for unlimited generated questions.`;

  return base(content, topic.build(topic.title).artifacts.slice(0, 2), [
    "Explain the answer to question 1",
    `Show a diagram for ${topic.title}`,
    "Give me a harder question",
  ]);
}

/* ------------------------------------------------------------------ */
/* Concept map generation                                              */
/* ------------------------------------------------------------------ */

function conceptMap(topic: Topic, extra?: string): string {
  const map = topic.diagram;
  if (map) return map;
  const related = relatedTopics(topic, 2);
  return `mindmap
  root((${topic.title}))
    Definition
      ${topic.chapter}
    Key ideas
      Formulas
      Graphs
      Units
    Applications
      ${related[0]?.title ?? "Problem solving"}
      ${related[1]?.title ?? "Exam questions"}
    Revision
      Visualise
      Practice
      Recall`;
}

function diagramResponse(topic: Topic, prompt: string): AIResponse {
  const code = conceptMap(topic, prompt);
  return base(
    `### ${topic.title} — mapped
Here is the structure of the chapter as a **flow/mind map**. Start at the top and read outward: each branch is one idea you should be able to explain without notes.

**How to use this map**
1. Cover the diagram and redraw it from memory.
2. For each node, say one formula or example aloud.
3. Mark any node you hesitate on, then ask me about it specifically.

${examNoteLine("Diagrams like this compress a whole chapter into a single glance — ideal for the last week before an exam.")}`,
    [
      mermaid(`${topic.title} — concept map`, code),
      ...topic.build(prompt).artifacts.filter((a) => a.type === "graph" || a.type === "scientific").slice(0, 1),
    ],
    [`Explain ${topic.title} simply`, "Give me a quiz on this", "Show the 3D version"]
  );
}

/* ------------------------------------------------------------------ */
/* Fallback                                                            */
/* ------------------------------------------------------------------ */

function fallbackResponse(prompt: string): AIResponse {
  const clean = prompt.replace(/[?.!]+$/, "").trim();
  const suggestions = topics.slice(0, 6).map((topic) => topic.title);

  return base(
    `### Here's how to attack "${clean}"
My built-in visual library is deep but bounded — it covers the core JEE, NEET and Board chapters rather than every topic. While I don't have a dedicated visual for this one, here is the framework that works for **any** concept:

1. **Define it in one sentence** — no formula allowed. If you can't, that's your first gap.
2. **Find the governing relation** — the formula that connects what changes to what's measured.
3. **Draw the graph** — what happens at the limits (0 and ∞)? Where is it zero, maximum or undefined?
4. **Connect it to a known chapter** — most "new" problems are old ones in disguise.

You can also connect an **OpenAI-compatible API key** in Settings and Axiom will route free-form questions through an LLM while keeping the same visual components.

**My library covers:** ${suggestions.join(" · ")} and more — open the Tools carousel to browse.

${examNoteLine(`If this is from a specific chapter, ask it like "${clean} — explain with a graph" and I'll match the nearest visual engine.`)}`,
    [
      mermaid("A universal study loop", `flowchart TD
    A["Read the question"] --> B["Identify the concept"]
    B --> C["Write the governing relation"]
    C --> D["Draw the situation or graph"]
    D --> E["Substitute values"]
    E --> F["Check units & limits"]
    F --> G["Explain the result aloud"]
    G --> A`),
      geometry("Symmetry study card", { kind: "mandala", petals: 10, layers: 4, caption: "Use the pattern as a visual anchor: return to it when you revise this topic." }),
    ],
    ["Explain the photoelectric effect", "Show FCC with face diagonal", "Plot a P–V diagram", "Give me a study plan"]
  );
}

/* ------------------------------------------------------------------ */
/* Main entry                                                          */
/* ------------------------------------------------------------------ */

export function runEngine(prompt: string, context: EngineContext = {}): AIResponse {
  const raw = prompt.trim();
  if (!raw) {
    return base("Ask me anything from JEE, NEET or Boards — I'll answer with a visual.", [], [
      "Show FCC in 3D",
      "Plot the photoelectric effect graph",
      "Explain Raoult's law",
    ]);
  }

  if (isGreeting(raw) && raw.length < 60) {
    return base(CAPABILITIES, [], [
      "Show FCC, highlight face diagonal",
      "Plot SHM displacement, velocity, acceleration",
      "Explain the Nernst equation",
      "Draw a flowchart of electrolysis",
    ]);
  }

  if (wantsPattern(raw)) return patternResponse(raw);

  if (looksLikeFunctionPrompt(raw)) {
    const functionResponse = buildFunctionResponse(raw);
    if (functionResponse) return functionResponse;
  }

  const matched = findTopic(raw);
  const topic = matched?.topic;

  // Scene refinement commands take priority when a 3D scene is open.
  const sceneUpdate = switchScene(raw, context);
  if (sceneUpdate && (!topic || matched!.score < 3)) return sceneUpdate;

  if (/^(show|visuali[sz]e|draw|generate|create)\b/.test(normalize(raw)) && /(electrolytic|galvanic|cell|solenoid|atom|fcc|bcc|lattice|unit cell)/.test(normalize(raw)) && !topic) {
    // handled by topics below
  }

  if (!topic) {
    if (/(study|revision|timetable|plan|focus|motivat)/.test(normalize(raw))) {
      const studyTopic = topics.find((t) => t.id === "study")!;
      return finish(studyTopic, raw, context);
    }
    if (wantsQuiz(raw)) {
      const quizCandidates = topics.filter((t) => t.quiz?.length);
      const pick =
        quizCandidates.find((t) => t.id === context.topic) ??
        quizCandidates[Math.floor(Math.random() * quizCandidates.length)];
      return quizResponse(pick);
    }
    if (wantsDiagram(raw)) {
      const guessed = topics.find((topicItem) =>
        topicItem.keywords.some((keyword) => normalize(raw).includes(keyword))
      );
      if (guessed) return diagramResponse(guessed, raw);
    }
    return fallbackResponse(raw);
  }

  const response = finish(topic, raw, context);

  if (wantsQuiz(raw) && topic.quiz) return quizResponse(topic);
  if (wantsDiagram(raw) && !/graph|plot/.test(normalize(raw))) return diagramResponse(topic, raw);

  return response;
}

function finish(topic: Topic, prompt: string, context: EngineContext): AIResponse {
  const built = topic.build(prompt);
  const artifacts = [...built.artifacts];

  // Smart additions based on intent.
  if (wantsQuiz(prompt) && topic.quiz) {
    const quiz = quizResponse(topic);
    return quiz;
  }

  if (wantsDiagram(prompt)) {
    const code = conceptMap(topic, prompt);
    if (!artifacts.some((artifact) => artifact.type === "mermaid")) {
      artifacts.push(mermaid(`${topic.title} — concept map`, code));
    }
  }



  // Always offer the chapter's supporting visual when the topic supports it.
  let content = built.content;

  if (context.exam && context.exam !== "general") {
    const examLabel = context.exam === "jee" ? "JEE" : context.exam === "neet" ? "NEET" : "Board exams";
    content += `\n\n> **${examLabel} focus** — this concept is frequently examined in ${examLabel} through mixed concept + calculation questions.`;
  }

  const response = base(content, dedupeArtifacts(artifacts), built.followUps);
  return response;
}

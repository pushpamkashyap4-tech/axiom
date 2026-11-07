import { sciPresets } from "./presets";
import type { AIConfig, Artifact, EngineContext, SceneConfig } from "./types";
import { uid } from "./utils";

type ChatTurn = { role: "user" | "assistant"; content: string };

export type LLMRequest = {
  prompt: string;
  history?: ChatTurn[];
  context?: EngineContext;
  engine?: AIConfig;
};

const ENDPOINTS: Record<Exclude<AIConfig["provider"], "local">, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  groq: "https://api.groq.com/openai/v1/chat/completions",
  // Google AI Studio exposes an OpenAI-compatible surface for Gemini models.
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  custom: "",
};

function resolveEngine(engine?: AIConfig): { config: AIConfig; key: string } | null {
  const envProvider = (process.env.AI_PROVIDER as AIConfig["provider"] | undefined) ?? undefined;
  const envKey =
    process.env.AI_API_KEY ??
    process.env.OPENAI_API_KEY ??
    process.env.OPENROUTER_API_KEY ??
    process.env.GROQ_API_KEY ??
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY;
  const envModel = process.env.AI_MODEL;
  const envBase = process.env.AI_BASE_URL;

  if (engine && engine.provider !== "local" && engine.apiKey) {
    return { config: engine, key: engine.apiKey };
  }
  if (envKey && envProvider && envProvider !== "local") {
    return {
      config: {
        provider: envProvider,
        apiKey: envKey,
        model: envModel ?? (envProvider === "gemini" ? "gemini-3.5-flash" : "gpt-4o-mini"),
        baseUrl: envBase,
      },
      key: envKey,
    };
  }
  return null;
}

const SYSTEM_PROMPT = `You are Axiom, a visual study assistant for Indian students preparing for JEE, NEET and Board exams.

You must answer with a STRICT JSON object (no markdown fences) of this shape:
{
  "content": "markdown explanation with headings, **bold**, bullet lists, $$LaTeX$$ blocks and markdown tables",
  "artifacts": [ ...visual descriptors... ],
  "followUps": ["short follow-up question", "..."]
}

Available artifact descriptors (choose 1-3 relevant ones, never invent types):

1. Graph (2D function plotter; expressions use mathjs syntax):
{ "type": "graph", "title": "string", "expressions": [{ "expression": "sin(x)", "label": "y = sin x", "color": "#22d3ee" }], "xRange": [-10, 10], "xLabel": "x", "yLabel": "y", "caption": "insight" }
Optional marker: "markers": [{"x": 2, "label": "x-intercept"}] — use for key points.
Parametric curve: { "expression": "3*cos(t)", "yExpression": "3*sin(t)", "mode": "parametric", "tRange": [0, 6.2832] }.
The variable is x; t is available for animation/parametric. Keep expressions valid mathjs (^ for powers, log10 for base 10).

2. Scientific preset plot — prefer this for known JEE/NEET charts. Use exactly one of these preset keys:
${sciPresets.map((preset) => `   - "${preset.key}" (${preset.subject}: ${preset.title})`).join("\n")}
{ "type": "scientific", "title": "string", "preset": "pv-isothermal-adiabatic", "caption": "insight" }

3. 3D scene:
{ "type": "scene3d", "title": "string", "config": { "type": "crystal", "lattice": "fcc" | "bcc" | "sc", "highlight": "face-diagonal" | "body-diagonal" | "edge" | null, "showCell": true, "showHighlight": true, "autoRotate": true } }
or { "type": "scene3d", "config": { "type": "electrolytic", "showLabels": true, "showFlow": true } }
or { "type": "scene3d", "config": { "type": "solenoid", "turns": 12, "showField": true, "showCurrent": true } }
or { "type": "scene3d", "config": { "type": "atom", "element": "H" | "C" | "O" | "Na", "showElectrons": true } }

4. Mermaid diagram (flowchart/mindmap/sequenceDiagram; NEVER include markdown fences):
{ "type": "mermaid", "title": "string", "code": "flowchart TD\\n  A[Start] --> B[End]" }

5. Geometric pattern:
{ "type": "geometry", "title": "string", "pattern": { "kind": "mandala" | "spiral" | "wave" | "polygon" | "fractal", "petals": 12 } }

Rules:
- content must be self-contained, exam-focused, accurate and concise (120-220 words). Use Indian exam context (JEE Main/Advanced, NEET, CBSE).
- Always include at least one artifact when the question is conceptual or asks to see/plot/visualise something.
- For pure text questions, an empty artifacts array is allowed.
- No HTML. Use markdown tables for comparisons. Use $...$ for inline math and $$...$$ for display math.
- followUps: 2-4 short natural next actions (max 60 chars each).
- Never mention that you are returning JSON.`;

function buildUserPrompt({ prompt, history, context }: LLMRequest) {
  const contextLines: string[] = [];
  if (context?.lastScene) {
    contextLines.push(`Currently open 3D scene: ${JSON.stringify(context.lastScene)}. If the user asks to modify the scene ("change to bcc", "highlight", "rotate", "hide labels"), return the full updated scene3d config.`);
  }
  if (context?.exam) contextLines.push(`Student exam focus: ${context.exam}.`);
  const historyLines = (history ?? [])
    .slice(-6)
    .map((turn) => `${turn.role}: ${turn.content.slice(0, 800)}`)
    .join("\n");

  return `${contextLines.join("\n")}\n\n${historyLines ? `Conversation so far:\n${historyLines}\n\n` : ""}Student: ${prompt}`;
}

export async function callLLM(request: LLMRequest): Promise<{
  content: string;
  artifacts: Artifact[];
  followUps: string[];
  model: string;
}> {
  const resolved = resolveEngine(request.engine);
  if (!resolved) throw new Error("No LLM credentials configured");
  const { config, key } = resolved;

  const endpoint =
    config.provider === "custom"
      ? `${(config.baseUrl ?? "").replace(/\/$/, "")}/chat/completions`
      : ENDPOINTS[config.provider as Exclude<AIConfig["provider"], "local">];

  if (!endpoint) throw new Error("Missing base URL for custom provider");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    ...(config.provider === "openrouter"
      ? { "HTTP-Referer": "https://axiom.app", "X-Title": "Axiom Visual AI" }
      : {}),
  };

  const body: Record<string, unknown> = {
    model: config.model || "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(request) },
    ],
    response_format: { type: "json_object" },
  };

  const send = (payload: Record<string, unknown>) =>
    fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45000),
    });

  let response = await send(body);

  // Some gateways reject `response_format`; retry once without it.
  if (!response.ok && response.status === 400) {
    const { response_format: _dropped, ...loose } = body;
    response = await send(loose);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`LLM provider error ${response.status}: ${text.slice(0, 180)}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    model?: string;
  };
  const raw = payload.choices?.[0]?.message?.content ?? "";
  const parsed = JSON.parse(stripFences(raw)) as {
    content?: string;
    artifacts?: unknown[];
    followUps?: unknown[];
  };

  return {
    content: typeof parsed.content === "string" ? parsed.content : "",
    artifacts: sanitizeArtifacts(parsed.artifacts),
    followUps: Array.isArray(parsed.followUps)
      ? parsed.followUps.filter((item): item is string => typeof item === "string").slice(0, 4)
      : [],
    model: payload.model ?? config.model,
  };
}

function stripFences(raw: string) {
  const trimmed = raw.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1] : trimmed;
}

function sanitizeArtifacts(input: unknown): Artifact[] {
  if (!Array.isArray(input)) return [];
  const artifacts: Artifact[] = [];

  for (const item of input.slice(0, 4)) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Record<string, unknown>;
    const type = candidate.type;
    const title = typeof candidate.title === "string" ? candidate.title.slice(0, 120) : "Visualization";
    const caption = typeof candidate.caption === "string" ? candidate.caption.slice(0, 400) : undefined;

    if (type === "graph" && Array.isArray(candidate.expressions) && candidate.expressions.length) {
      const expressions = candidate.expressions
        .filter((expression): expression is Record<string, unknown> => Boolean(expression) && typeof expression === "object")
        .slice(0, 5)
        .map((expression) => ({
          expression: String(expression.expression ?? "").slice(0, 200),
          label: typeof expression.label === "string" ? expression.label.slice(0, 80) : undefined,
          color: typeof expression.color === "string" ? expression.color : undefined,
          mode: expression.mode === "parametric" ? ("parametric" as const) : undefined,
          yExpression: typeof expression.yExpression === "string" ? expression.yExpression.slice(0, 200) : undefined,
          tRange: Array.isArray(expression.tRange) ? (expression.tRange as [number, number]) : undefined,
        }))
        .filter((expression) => expression.expression.length > 0);

      if (!expressions.length) continue;
      artifacts.push({
        id: uid("graph"),
        type: "graph",
        title,
        expressions,
        xRange: Array.isArray(candidate.xRange) ? (candidate.xRange as [number, number]) : undefined,
        yRange: Array.isArray(candidate.yRange) ? (candidate.yRange as [number, number]) : undefined,
        xLabel: typeof candidate.xLabel === "string" ? candidate.xLabel : undefined,
        yLabel: typeof candidate.yLabel === "string" ? candidate.yLabel : undefined,
        markers: Array.isArray(candidate.markers)
          ? candidate.markers.slice(0, 6).map((marker) => {
              const m = marker as Record<string, unknown>;
              return {
                x: typeof m.x === "number" ? m.x : undefined,
                y: typeof m.y === "number" ? m.y : undefined,
                label: String(m.label ?? "").slice(0, 40),
                color: typeof m.color === "string" ? m.color : undefined,
              };
            })
          : undefined,
        caption,
      });
      continue;
    }

    if (type === "scientific" && typeof candidate.preset === "string") {
      if (!sciPresets.some((preset) => preset.key === candidate.preset)) continue;
      artifacts.push({
        id: uid("sci"),
        type: "scientific",
        title,
        preset: candidate.preset,
        caption,
      });
      continue;
    }

    if (type === "scene3d") {
      const config = candidate.config as Record<string, unknown> | undefined;
      if (!config || typeof config.type !== "string") continue;
      const sceneConfig = sanitizeScene(config);
      if (!sceneConfig) continue;
      artifacts.push({ id: uid("scene"), type: "scene3d", title, config: sceneConfig, caption });
      continue;
    }

    if (type === "mermaid" && typeof candidate.code === "string") {
      artifacts.push({
        id: uid("mmd"),
        type: "mermaid",
        title,
        code: candidate.code.slice(0, 4000),
        caption,
      });
      continue;
    }

    if (type === "geometry") {
      const pattern = candidate.pattern as Record<string, unknown> | undefined;
      const kind = pattern?.kind;
      if (!["mandala", "spiral", "wave", "polygon", "fractal"].includes(String(kind))) continue;
      artifacts.push({
        id: uid("geo"),
        type: "geometry",
        title,
        pattern: {
          kind: kind as "mandala",
          petals: Math.min(24, Math.max(3, Number(pattern?.petals) || 12)),
          layers: Math.min(8, Math.max(2, Number(pattern?.layers) || 5)),
          caption,
        },
        caption,
      });
    }
  }

  return artifacts;
}

function sanitizeScene(config: Record<string, unknown>): SceneConfig | null {
  const type = config.type;
  if (type === "crystal") {
    const lattice = config.lattice === "bcc" || config.lattice === "sc" ? config.lattice : "fcc";
    const highlight =
      config.highlight === "body-diagonal" || config.highlight === "edge"
        ? config.highlight
        : config.highlight === null
          ? null
          : "face-diagonal";
    return {
      type: "crystal",
      lattice,
      highlight,
      showCell: config.showCell !== false,
      showHighlight: config.showHighlight !== false,
      atomScale: typeof config.atomScale === "number" ? Math.min(1, Math.max(0.3, config.atomScale)) : 0.52,
      autoRotate: Boolean(config.autoRotate),
    };
  }
  if (type === "electrolytic") {
    return {
      type: "electrolytic",
      showLabels: config.showLabels !== false,
      showFlow: config.showFlow !== false,
      autoRotate: Boolean(config.autoRotate),
    };
  }
  if (type === "solenoid") {
    return {
      type: "solenoid",
      turns: Math.min(18, Math.max(5, Number(config.turns) || 11)),
      showField: config.showField !== false,
      showCurrent: config.showCurrent !== false,
      autoRotate: Boolean(config.autoRotate),
    };
  }
  if (type === "atom") {
    const element = ["H", "C", "O", "Na"].includes(String(config.element)) ? (config.element as "H") : "C";
    return {
      type: "atom",
      element,
      showElectrons: config.showElectrons !== false,
      autoRotate: Boolean(config.autoRotate),
    };
  }
  return null;
}

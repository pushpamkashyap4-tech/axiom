"use client";

import { Check, Code2, Copy, Download, Shapes, Sparkles, Workflow, X } from "lucide-react";
import { useMemo, useState } from "react";
import { MermaidBlock } from "@/components/viz/mermaid-block";
import { PatternSvg } from "@/components/viz/pattern-svg";
import { useToast } from "@/components/ui/toast";
import { runEngine } from "@/lib/engine";
import type { PatternKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    name: "Flowchart",
    kind: "flowchart" as const,
    description: "Processes and decisions",
    code: `flowchart TD
    A["Read the question"] --> B{"Which concept?"}
    B -->|"motion"| C["Kinematics equations"]
    B -->|"forces"| D["Free-body diagram"]
    C --> E["Solve and check units"]
    D --> E
    E --> F["Reflect on the method"]`,
  },
  {
    name: "Mind map",
    kind: "mindmap" as const,
    description: "Chapter structure at a glance",
    code: `mindmap
  root((Thermodynamics))
    Laws
      Zeroth
      First
      Second
    Processes
      Isothermal
      Adiabatic
      Isobaric
    Cycles
      Carnot
      Efficiency
    Formulas
      PV work
      Entropy`,
  },
  {
    name: "Sequence",
    kind: "sequence" as const,
    description: "Order of events",
    code: `sequenceDiagram
    participant P as Photon
    participant M as Metal
    participant E as Electron
    P->>M: energy hν
    M->>M: compare with work function φ
    alt hν ≥ φ
        M->>E: eject photoelectron
        E->>E: K = hν − φ
    else hν < φ
        M->>P: no emission
    end`,
  },
  {
    name: "Loop diagram",
    kind: "flowchart" as const,
    description: "Revision cycles",
    code: `flowchart LR
    A["Learn"] --> B["Retrieve"]
    B --> C["Space"]
    C --> D["Interleave"]
    D --> E["Test"]
    E --> A`,
  },
  {
    name: "Comparison tree",
    kind: "mindmap" as const,
    description: "Ideal vs real",
    code: `mindmap
  root((Solutions))
    Ideal
      Raoult law
      Zero enthalpy change
    Positive deviation
      Weaker A-B forces
      Minimum boiling azeotrope
    Negative deviation
      Stronger A-B forces
      Maximum boiling azeotrope`,
  },
  {
    name: "Electrolysis flow",
    kind: "flowchart" as const,
    description: "Cell mechanism",
    code: `flowchart LR
    B["Battery"] -->|"electrons out"| AN["Anode (+)"]
    AN -->|"oxidation"| ION["Ions in electrolyte"]
    ION -->|"migration"| CA["Cathode (−)"]
    CA -->|"reduction"| P["Product"]
    P -->|"electrons back"| B`,
  },
];

const PATTERN_KINDS: { kind: PatternKind; label: string }[] = [
  { kind: "mandala", label: "Mandala" },
  { kind: "spiral", label: "Spiral" },
  { kind: "wave", label: "Wave" },
  { kind: "polygon", label: "Star polygon" },
  { kind: "fractal", label: "Fractal" },
];

export function DiagramsScreen() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"diagram" | "pattern">("diagram");
  const [code, setCode] = useState(TEMPLATES[0].code);
  const [prompt, setPrompt] = useState("");
  const [patternKind, setPatternKind] = useState<PatternKind>("mandala");
  const [petals, setPetals] = useState(12);
  const [layers, setLayers] = useState(5);
  const [copied, setCopied] = useState(false);

  const explain = useMemo(() => {
    if (tab === "pattern") {
      return `Rotational symmetry of order ${petals}. Every ${Math.round(360 / petals)}° rotation maps the figure onto itself — the same idea used to classify crystal systems and molecular geometries.`;
    }
    return "Edit the Mermaid code and the diagram re-renders instantly. Ask Axiom for a diagram and it will fill the editor for you.";
  }, [tab, petals]);

  const generate = () => {
    const clean = prompt.trim();
    if (!clean) return;
    const result = runEngine(`${clean} diagram`, { exam: "jee" });
    const diagram = result.artifacts.find((artifact) => artifact.type === "mermaid");
    if (diagram && diagram.type === "mermaid") {
      setCode(diagram.code);
      setTab("diagram");
      toast("Diagram generated from your prompt", "success");
      setPrompt("");
      return;
    }
    const geometry = result.artifacts.find((artifact) => artifact.type === "geometry");
    if (geometry && geometry.type === "geometry") {
      setPatternKind(geometry.pattern.kind);
      setPetals(geometry.pattern.petals ?? petals);
      setTab("pattern");
      toast("geometric pattern", "success");
      setPrompt("");
      return;
    }
    toast("No diagram found for that prompt. Try a chapter name like “chemical bonding”.", "error");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("Clipboard is blocked here.", "error");
    }
  };

  const download = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "axiom-diagram.mmd";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-3 pb-10 pt-4 sm:px-6 lg:px-8 lg:pt-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-label">
            <span className="h-px w-4 bg-amber-400/70" /> Visual tool
          </p>
          <h1 className="mt-1.5 font-display text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">
            Diagram & Pattern Studio
          </h1>
          <p className="mt-1 text-[12px] text-slate-500">
            Mermaid flowcharts, mind maps and sequence diagrams — plus procedural geometry.
          </p>
        </div>
        <div className="flex rounded-xl border border-white/[.07] bg-white/[.03] p-1">
          {[
            { id: "diagram" as const, label: "Diagrams", icon: Workflow },
            { id: "pattern" as const, label: "Patterns", icon: Shapes },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition",
                  tab === item.id ? "bg-white/[.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)]" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Icon size={12} /> {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* prompt bar */}
      <div className="glass mb-3 flex flex-wrap items-center gap-2 rounded-2xl p-2.5 sm:flex-nowrap">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.04]">
          <Sparkles size={14} className="text-amber-300" />
        </span>
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") generate();
          }}
          placeholder={tab === "diagram" ? "Describe a diagram — e.g. “electrolysis flowchart” or “mind map of chemical bonding”" : "Ask for a pattern — e.g. “16 petal mandala”"}
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[12px] text-slate-100 outline-none placeholder:text-slate-600"
        />
        <button type="button" onClick={generate} className="btn-primary h-9 px-3.5 text-[11.5px]">
          Generate
        </button>
      </div>

      {tab === "diagram" ? (
        <div className="grid gap-3 lg:grid-cols-[360px_1fr]">
          <div className="order-2 flex flex-col gap-3 lg:order-1">
            <div className="glass-panel p-3">
              <p className="label flex items-center gap-1.5">
                <Workflow size={10} /> Templates
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => setCode(template.code)}
                    className={cn(
                      "rounded-xl border border-white/[.06] bg-white/[.02] p-2.5 text-left transition hover:border-amber-300/25 hover:bg-amber-400/[.04]",
                      code === template.code && "border-amber-300/30 bg-amber-400/[.06]"
                    )}
                  >
                    <span className="block text-[10.5px] font-semibold text-slate-200">{template.name}</span>
                    <span className="mt-0.5 block text-[9px] leading-snug text-slate-600">{template.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[.06] px-3 py-2">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <Code2 size={11} /> Mermaid source
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={copy}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-white/[.06] hover:text-white"
                    aria-label="Copy diagram code"
                  >
                    {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                  <button
                    type="button"
                    onClick={download}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-white/[.06] hover:text-white"
                    aria-label="Download diagram code"
                  >
                    <Download size={11} />
                  </button>
                </div>
              </div>
              <textarea
                value={code}
                onChange={(event) => setCode(event.target.value)}
                spellCheck={false}
                className="min-h-[260px] flex-1 resize-none bg-[#05080f]/60 p-3 font-mono text-[10.5px] leading-relaxed text-slate-300 outline-none"
              />
            </div>
          </div>

          <div className="order-1 flex flex-col gap-3 lg:order-2">
            <div className="glass flex min-h-[420px] flex-col overflow-hidden rounded-3xl">
              <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="accent-dot h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <p className="text-[11px] font-semibold text-slate-200">Live preview</p>
                </div>
                <span className="text-[9px] text-slate-600">auto-renders as you type</span>
              </div>
              <div className="flex-1 overflow-auto p-3">
                <MermaidBlock code={code} />
              </div>
            </div>
            <div className="glass-panel flex items-start gap-2.5 p-3.5">
              <Sparkles size={12} className="mt-0.5 shrink-0 text-amber-300" />
              <p className="text-[10.5px] leading-relaxed text-slate-500">{explain}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[330px_1fr]">
          <div className="glass-panel order-2 flex flex-col gap-4 p-4 lg:order-1">
            <div>
              <p className="label">Pattern type</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PATTERN_KINDS.map((item) => (
                  <button
                    key={item.kind}
                    type="button"
                    onClick={() => setPatternKind(item.kind)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-[10.5px] font-semibold transition",
                      patternKind === item.kind
                        ? "border-rose-300/35 bg-rose-400/10 text-rose-200"
                        : "border-white/[.06] bg-white/[.02] text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="label flex items-center justify-between">
                <span>Petals / folds</span>
                <span className="font-mono text-[10px] normal-case tracking-normal text-rose-300">{petals}</span>
              </div>
              <input type="range" className="nova-range" min={4} max={24} step={1} value={petals} onChange={(event) => setPetals(Number(event.target.value))} />
            </div>
            <div>
              <div className="label flex items-center justify-between">
                <span>Layers</span>
                <span className="font-mono text-[10px] normal-case tracking-normal text-cyan-300">{layers}</span>
              </div>
              <input type="range" className="nova-range" min={3} max={8} step={1} value={layers} onChange={(event) => setLayers(Number(event.target.value))} />
            </div>
            <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Geometry notes</p>
              <ul className="mt-2 flex flex-col gap-1.5 text-[10.5px] leading-relaxed text-slate-500">
                <li>• Rotational symmetry: <span className="text-slate-300">{petals}-fold</span></li>
                <li>• Smallest rotation: <span className="text-slate-300">{Math.round(360 / petals)}°</span></li>
                <li>• Mirror axes: <span className="text-slate-300">{petals}</span></li>
                <li>• Generated from polar curves, no image assets</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                setPetals(Math.floor(Math.random() * 17) + 8);
                setLayers(Math.floor(Math.random() * 4) + 3);
                toast("New geometry seeded", "success");
              }}
              className="btn-ghost w-full justify-center"
            >
              <Shapes size={12} /> Randomise symmetry
            </button>
          </div>

          <div className="order-1 flex flex-col gap-3 lg:order-2">
            <div className="glass relative flex min-h-[440px] items-center justify-center overflow-hidden rounded-3xl p-4">
              <PatternSvg pattern={{ kind: patternKind, petals, layers }} />
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <span className="accent-dot h-1.5 w-1.5 rounded-full bg-rose-400" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">SVG pattern engine</p>
              </div>
            </div>
            <div className="glass-panel flex items-start gap-2.5 p-3.5">
              <Sparkles size={12} className="mt-0.5 shrink-0 text-rose-300" />
              <p className="text-[10.5px] leading-relaxed text-slate-500">{explain}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Atom,
  Boxes,
  FlaskConical,
  Magnet,
  Maximize2,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { runEngine } from "@/lib/engine";
import type { SceneConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

const SceneCanvas = dynamic(() => import("@/components/viz/scene-canvas").then((mod) => mod.SceneCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border border-slate-700 border-t-violet-400" />
        Booting 3D engine…
      </div>
    </div>
  ),
});

const SceneLegend = dynamic(() => import("@/components/viz/scene-canvas").then((mod) => mod.SceneLegend), {
  ssr: false,
  loading: () => null,
});

const PRESETS: { label: string; icon: typeof Boxes; config: SceneConfig; hint: string }[] = [
  {
    label: "FCC lattice",
    icon: Boxes,
    config: { type: "crystal", lattice: "fcc", highlight: "face-diagonal", showCell: true, showHighlight: true, autoRotate: true },
    hint: "Face-centred cubic — closest packing, 74% efficiency.",
  },
  {
    label: "BCC lattice",
    icon: Boxes,
    config: { type: "crystal", lattice: "bcc", highlight: "body-diagonal", showCell: true, showHighlight: true, autoRotate: true },
    hint: "Body-centred cubic — 68% packing, atoms touch along √3a.",
  },
  {
    label: "Simple cubic",
    icon: Boxes,
    config: { type: "crystal", lattice: "sc", highlight: "edge", showCell: true, showHighlight: true, autoRotate: true },
    hint: "Simple cubic — 52.4% packing, a = 2r.",
  },
  {
    label: "Electrolytic cell",
    icon: FlaskConical,
    config: { type: "electrolytic", electrolyte: "CuSO₄ solution", showLabels: true, showFlow: true, autoRotate: false },
    hint: "Anode oxidises, cathode reduces; electrons travel only through the wire.",
  },
  {
    label: "Solenoid",
    icon: Magnet,
    config: { type: "solenoid", turns: 12, showField: true, showCurrent: true, autoRotate: true },
    hint: "Uniform field inside: B = μ₀nI.",
  },
  {
    label: "Atom",
    icon: Atom,
    config: { type: "atom", element: "C", showElectrons: true, autoRotate: true },
    hint: "Electron shells — try H, C, O or Na.",
  },
];

function sameScene(a: SceneConfig, b: SceneConfig) {
  if (a.type !== b.type) return false;
  if (a.type === "crystal" && b.type === "crystal") return a.lattice === b.lattice;
  return true;
}

const PROMPT_EXAMPLES = [
  "Show FCC, highlight face diagonal",
  "Change to BCC",
  "Show an electrolytic cell",
  "Highlight body diagonal",
  "Make atoms bigger",
  "Show a solenoid with field lines",
];

export function Lab3DScreen() {
  const { toast } = useToast();
  const [config, setConfig] = useState<SceneConfig>(PRESETS[0].config);
  const [prompt, setPrompt] = useState("");
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<string[]>(["Loaded FCC lattice with face-diagonal highlight."]);

  const activePreset = useMemo(
    () => PRESETS.find((preset) => sameScene(preset.config, config)) ?? PRESETS[0],
    [config]
  );

  const applyPrompt = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    const result = runEngine(clean, { lastScene: config, exam: "jee" });
    const scene = result.artifacts.find((artifact) => artifact.type === "scene3d");
    if (scene && scene.type === "scene3d") {
      setConfig(scene.config);
      setLog((prev) => [`“${clean}” → ${scene.title}`, ...prev].slice(0, 4));
      toast("Scene updated from your description", "success");
      setPrompt("");
    } else {
      const fallback = runEngine(clean, { lastScene: undefined, exam: "jee" });
      const alternative = fallback.artifacts.find((artifact) => artifact.type === "scene3d");
      if (alternative && alternative.type === "scene3d") {
        setConfig(alternative.config);
        toast("Loaded the closest 3D scene", "info");
        setPrompt("");
        return;
      }
      toast("Try naming a lattice (FCC/BCC), a cell, a solenoid or an atom.", "error");
    }
  };

  const facts = useMemo(() => {
    if (config.type === "crystal") {
      return {
        title: `${config.lattice.toUpperCase()} unit cell`,
        rows: [
          ["Atoms per cell", config.lattice === "sc" ? "1" : config.lattice === "bcc" ? "2" : "4"],
          ["Radius relation", config.lattice === "sc" ? "a = 2r" : config.lattice === "bcc" ? "√3a = 4r" : "√2a = 4r"],
          ["Packing", config.lattice === "sc" ? "52.4%" : config.lattice === "bcc" ? "68%" : "74%"],
          ["Coordination", config.lattice === "sc" ? "6" : config.lattice === "bcc" ? "8" : "12"],
        ],
      };
    }
    if (config.type === "electrolytic") {
      return {
        title: "Electrolytic cell",
        rows: [
          ["Anode", "oxidation, +"],
          ["Cathode", "reduction, −"],
          ["Charge carriers", "ions in solution"],
          ["External circuit", "electrons"],
        ],
      };
    }
    if (config.type === "solenoid") {
      return {
        title: "Solenoid field",
        rows: [
          ["Inside", "B = μ₀nI"],
          ["At the ends", "≈ μ₀nI / 2"],
          ["Outside", "dipolar, like a bar magnet"],
          ["n", "turns per unit length"],
        ],
      };
    }
    return {
      title: "Atomic shells",
      rows: [
        ["Shell capacity", "2n²"],
        ["K shell", "2 electrons"],
        ["L shell", "8 electrons"],
        ["Valence", "outermost shell"],
      ],
    };
  }, [config]);

  return (
    <div className="mx-auto max-w-[1400px] px-3 pb-10 pt-4 sm:px-6 lg:px-8 lg:pt-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-label">
            <span className="h-px w-4 bg-violet-400/70" /> Visual tool
          </p>
          <h1 className="mt-1.5 font-display text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">
            3D Visualisation Lab
          </h1>
          <p className="mt-1 text-[12px] text-slate-500">
            Lattices, cells and fields you can rotate. Describe a change and the scene morphs live.
          </p>
        </div>
        <span className="badge badge-accent h-8 px-3">
          <Zap size={10} /> WebGL · real-time
        </span>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="glass overflow-hidden rounded-3xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[.06] px-3 py-2.5 sm:px-4">
            <div className="flex items-center gap-2">
              <span className="accent-dot h-1.5 w-1.5 rounded-full bg-violet-400" />
              <p className="text-[11px] font-semibold text-slate-200">
                {config.type === "crystal"
                  ? `${config.lattice.toUpperCase()} lattice`
                  : config.type === "electrolytic"
                    ? "Electrolytic cell"
                    : config.type === "solenoid"
                      ? "Solenoid"
                      : "Atomic shells"}
              </p>
              <span className="hidden rounded border border-white/[.07] bg-white/[.03] px-1.5 py-0.5 text-[9px] text-slate-500 sm:inline">
                360° orbit
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setConfig(PRESETS[0].config)}
                className="flex h-7 items-center gap-1.5 rounded-lg border border-white/[.07] bg-white/[.03] px-2 text-[10px] text-slate-400 transition hover:text-white"
              >
                <RotateCcw size={10} /> Reset scene
              </button>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex h-7 items-center gap-1.5 rounded-lg border border-white/[.07] bg-white/[.03] px-2 text-[10px] text-slate-400 transition hover:text-white"
              >
                <Maximize2 size={10} /> Fullscreen
              </button>
            </div>
          </div>

          <div className="h-[54vh] min-h-[380px] w-full xl:h-[calc(100dvh-275px)]">
            <SceneCanvas config={config} onChange={setConfig} />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/[.06] px-4 py-2.5">
            <SceneLegend type={config.type} />
            <span className="hidden text-[9px] text-slate-600 sm:inline">drag · scroll · right-drag to pan</span>
          </div>
        </div>

        {/* aside */}
        <div className="flex flex-col gap-3">
          <div className="glass-panel p-4">
            <p className="label">Scene presets</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                const active = sameScene(preset.config, config);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setConfig(preset.config);
                      setLog((prev) => [`Loaded ${preset.label.toLowerCase()}.`, ...prev].slice(0, 4));
                    }}
                    className={cn(
                      "flex flex-col items-start gap-1.5 rounded-xl border p-2.5 text-left transition",
                      active
                        ? "border-violet-300/35 bg-violet-400/10 text-white shadow-[0_0_24px_-10px_rgba(167,139,250,.7)]"
                        : "border-white/[.06] bg-white/[.02] text-slate-400 hover:border-white/15 hover:text-slate-200"
                    )}
                  >
                    <Icon size={14} className={active ? "text-violet-300" : "text-slate-500"} />
                    <span className="text-[10.5px] font-semibold leading-tight">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-panel p-4">
            <p className="label flex items-center gap-1.5">
              <Sparkles size={10} className="text-cyan-300" /> Describe a scene
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                applyPrompt(prompt);
              }}
              className="flex items-center gap-2 rounded-xl border border-white/[.08] bg-black/25 px-2.5 py-1.5 focus-within:border-violet-300/40"
            >
              <input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="e.g. change to BCC…"
                className="min-w-0 flex-1 bg-transparent py-1.5 text-[11.5px] text-slate-100 outline-none placeholder:text-slate-600"
              />
              <button
                type="submit"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-300 to-cyan-300 text-[#0b0713] transition hover:brightness-110"
                aria-label="Apply scene prompt"
              >
                <Play size={11} fill="currentColor" />
              </button>
            </form>
            <div className="mt-2 flex flex-wrap gap-1">
              {PROMPT_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => applyPrompt(example)}
                  className="rounded-md border border-white/[.06] bg-white/[.025] px-1.5 py-1 text-[9.5px] text-slate-500 transition hover:border-violet-300/25 hover:text-slate-200"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel p-4">
            <p className="label">{facts.title}</p>
            <div className="flex flex-col">
              {facts.rows.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between border-b border-white/[.04] py-1.5 last:border-0">
                  <span className="text-[10.5px] text-slate-500">{key}</span>
                  <span className="font-mono text-[10.5px] text-slate-200">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel flex-1 p-4">
            <p className="label">Activity</p>
            <div className="flex flex-col gap-2">
              {log.map((entry, index) => (
                <motion.div
                  key={`${entry}-${index}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 text-[10px] leading-relaxed text-slate-500"
                >
                  <span className={cn("mt-1.5 h-1 w-1 shrink-0 rounded-full", index === 0 ? "bg-violet-400" : "bg-slate-700")} />
                  {entry}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="3D Visualisation Lab"
        subtitle={activePreset.hint}
        size="full"
      >
        <div className="h-[70vh] overflow-hidden rounded-2xl border border-white/[.07]">
          <SceneCanvas config={config} onChange={setConfig} />
        </div>
      </Modal>
    </div>
  );
}

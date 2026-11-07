"use client";

import { Plus, Sparkles, Trash2, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GraphCanvas } from "@/components/viz/graph-canvas";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import type { PlotSeries } from "@/lib/types";

const COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"];

const EXAMPLES = [
  { label: "y = sin(x)", expression: "sin(x)" },
  { label: "y = x²", expression: "x^2" },
  { label: "y = {x}", expression: "x - floor(x)" },
  { label: "y = 1/x", expression: "1/x" },
  { label: "y = tan(x)", expression: "tan(x)" },
  { label: "y = sin(x)·cos(2x)", expression: "sin(x)*cos(2*x)" },
  { label: "y = √(4−x²)", expression: "sqrt(4-x^2)" },
  { label: "y = |x| − [x]", expression: "abs(x) - floor(x)" },
  { label: "y = e^(−x²)", expression: "exp(-x^2)" },
  { label: "y = sin(x − t) live", expression: "sin(x - t)" },
  { label: "Circle (parametric)", expression: "3*cos(t)", yExpression: "3*sin(t)", parametric: true },
];

type Entry = PlotSeries & { id: string };

let counter = 0;

export function GrapherScreen() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const initial = searchParams.get("expr");

  const [entries, setEntries] = useState<Entry[]>(() => [
    { id: `f${counter++}`, expression: initial || "sin(x)", color: COLORS[0], label: `y = ${initial || "sin(x)"}` },
  ]);
  const [draft, setDraft] = useState("");
  const [animate, setAnimate] = useState(false);
  const [xRange, setXRange] = useState<[number, number]>([-10, 10]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setEntries([{ id: `f${counter++}`, expression: initial, color: COLORS[0], label: `y = ${initial}` }]);
    }
  }, [initial]);

  const series = useMemo(
    () =>
      entries.map((entry) => ({
        expression: entry.expression,
        yExpression: entry.yExpression,
        mode: entry.mode,
        tRange: entry.tRange,
        color: entry.color,
        label: entry.label,
        jumps: /floor|sign/.test(entry.expression),
      })),
    [entries]
  );

  const addExpression = (expression: string, parametric = false, yExpression?: string) => {
    const clean = expression.trim();
    if (!clean) return;
    const next: Entry = {
      id: `f${counter++}`,
      expression: clean,
      yExpression,
      mode: parametric ? "parametric" : undefined,
      tRange: parametric ? [0, 6.2832] : undefined,
      color: COLORS[counter % COLORS.length],
      label: parametric ? `(${clean}, ${yExpression ?? ""})` : `y = ${clean}`,
      jumps: /floor|sign/.test(clean),
    };
    setEntries((prev) => [...prev, next].slice(0, 6));
    setDraft("");
    setError(null);
    toast(`Plotted ${parametric ? "parametric curve" : `y = ${clean}`}`, "success");
  };

  const updateEntry = (id: string, expression: string) => {
    if (!expression.trim()) {
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      return;
    }
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? { ...entry, expression, label: `y = ${expression}`, jumps: /floor|sign/.test(expression) }
          : entry
      )
    );
  };

  return (
    <div className="mx-auto max-w-[1400px] px-3 pb-10 pt-4 sm:px-6 lg:px-8 lg:pt-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-label">
            <span className="h-px w-4 bg-[rgb(var(--accent))]/60" /> Visual tool
          </p>
          <h1 className="mt-1.5 font-display text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">
            2D Function Grapher
          </h1>
          <p className="mt-1 text-[12px] text-slate-500">
            Plot up to six functions live — scroll to zoom, drag to pan, hover for exact coordinates.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/[.07] bg-white/[.03] px-3 py-2">
          <span className="text-[10.5px] text-slate-400">Animate t</span>
          <Switch checked={animate} onChange={(value) => setAnimate(value)} label="Animate parameter t" />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[310px_1fr]">
        {/* controls */}
        <div className="glass-panel order-2 flex flex-col gap-4 p-4 lg:order-1">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="label mb-0">Functions</p>
              <span className="text-[9.5px] text-slate-600">{entries.length}/6</span>
            </div>
            <div className="flex flex-col gap-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="group flex items-center gap-2 rounded-xl border border-white/[.06] bg-black/25 px-2.5 py-1.5 transition focus-within:border-cyan-300/30"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const colors = COLORS.filter((color) => color !== entry.color);
                      const color = colors[Math.floor(Math.random() * colors.length)];
                      setEntries((prev) => prev.map((item) => (item.id === entry.id ? { ...item, color } : item)));
                    }}
                    className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/10 transition hover:scale-125"
                    style={{ background: entry.color, boxShadow: `0 0 12px ${entry.color}80` }}
                    aria-label="Change curve colour"
                  />
                  <span className="shrink-0 font-mono text-[11px] text-slate-500">
                    {entry.mode === "parametric" ? "⟨x,y⟩" : "y ="}
                  </span>
                  <input
                    defaultValue={entry.expression}
                    onBlur={(event) => updateEntry(entry.id, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") (event.target as HTMLInputElement).blur();
                    }}
                    spellCheck={false}
                    className="min-w-0 flex-1 bg-transparent py-1 font-mono text-[11.5px] text-slate-100 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setEntries((prev) => prev.filter((item) => item.id !== entry.id))}
                    className="shrink-0 text-slate-600 opacity-60 transition hover:text-rose-300 group-hover:opacity-100"
                    aria-label="Remove function"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            <form
              className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-white/[.09] bg-white/[.015] px-2.5 py-1.5 focus-within:border-cyan-300/35"
              onSubmit={(event) => {
                event.preventDefault();
                addExpression(draft);
              }}
            >
              <span className="font-mono text-[11px] text-slate-500">y =</span>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="type a function…"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent py-1 font-mono text-[11.5px] text-slate-100 outline-none placeholder:font-sans placeholder:text-slate-600"
              />
              <button
                type="submit"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-40"
                disabled={!draft.trim()}
                aria-label="Add function"
              >
                <Plus size={12} />
              </button>
            </form>
          </div>

          <div>
            <p className="label">Examples</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => addExpression(example.expression, example.parametric, example.yExpression)}
                  className="rounded-lg border border-white/[.07] bg-white/[.03] px-2 py-1 font-mono text-[10px] text-slate-400 transition hover:border-cyan-300/25 hover:bg-cyan-400/[.06] hover:text-cyan-100"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label">Window</p>
            <div className="grid grid-cols-2 gap-2">
              {(["xMin", "xMax"] as const).map((key, index) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-[9.5px] uppercase tracking-wider text-slate-600">{key}</span>
                  <input
                    type="number"
                    value={xRange[index]}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (!Number.isFinite(value)) return;
                      setXRange((prev) => {
                        const next: [number, number] = [...prev];
                        next[index] = value;
                        return next[0] < next[1] ? next : prev;
                      });
                    }}
                    className="field py-1.5 font-mono text-[11px]"
                  />
                </label>
              ))}
            </div>
            {error && <p className="mt-2 text-[10.5px] text-rose-300">{error}</p>}
          </div>

          <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/[.04] p-3">
            <p className="flex items-center gap-1.5 text-[10.5px] font-semibold text-cyan-200">
              <Sparkles size={11} /> Pro move
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
              Use <span className="font-mono text-cyan-200/80">t</span> inside any expression and toggle{" "}
              <span className="text-slate-300">Animate t</span> to watch waves travel. Try{" "}
              <span className="font-mono text-cyan-200/80">sin(x - t)</span>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEntries([{ id: `f${counter++}`, expression: "sin(x)", color: COLORS[0], label: "y = sin(x)" }]);
              toast("Canvas reset", "info");
            }}
            className="btn-ghost mt-auto w-full justify-center text-[11px]"
          >
            <Trash2 size={11.5} /> Clear canvas
          </button>
        </div>

        {/* canvas */}
        <div className="order-1 lg:order-2">
          <div className="glass relative overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="accent-dot h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))]" />
                <p className="text-[11px] font-semibold text-slate-200">Plot canvas</p>
                <span className="hidden text-[9.5px] text-slate-600 sm:inline">· live rendering</span>
              </div>
              <div className="flex items-center gap-1.5 text-[9.5px] text-slate-500">
                <span className="rounded border border-white/[.07] bg-white/[.03] px-1.5 py-0.5">drag to pan</span>
                <span className="hidden rounded border border-white/[.07] bg-white/[.03] px-1.5 py-0.5 sm:inline">
                  scroll to zoom
                </span>
              </div>
            </div>
            <div className="h-[58vh] min-h-[380px] w-full lg:h-[calc(100dvh-235px)]">
              <GraphCanvas
                series={series}
                xRange={xRange}
                animate={animate}
                autoPlay={animate}
                onError={(message) => setError(message)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-white/[.06] px-4 py-2.5 text-[9.5px] text-slate-500">
              <span className={error ? "flex items-center gap-1.5 text-rose-300" : "flex items-center gap-1.5"}>
                <span className={error ? "h-1 w-1 rounded-full bg-rose-400" : "h-1 w-1 rounded-full bg-emerald-400"} />
                {error ? "syntax error" : "engine ready"}
              </span>
              <span className="text-slate-700">|</span>
              <span className="font-mono">y = f(x)</span>
              <span>powered by mathjs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

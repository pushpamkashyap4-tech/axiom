"use client";

import { motion } from "framer-motion";
import {
  Atom,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  FlaskConical,
  Lightbulb,
  Search,
  Sigma,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScientificPlot } from "@/components/viz/scientific-plot";
import {
  SUBJECT_ORDER,
  catalogStats,
  presetsBySubject,
  searchPresets,
  type SciPreset,
  type SciSubject,
} from "@/lib/presets";
import { cn } from "@/lib/utils";

const SUBJECT_META: Record<SciSubject, { icon: typeof Atom; tone: string; dot: string }> = {
  Physics: { icon: Atom, tone: "text-cyan-300", dot: "bg-cyan-400" },
  Chemistry: { icon: FlaskConical, tone: "text-emerald-300", dot: "bg-emerald-400" },
  Mathematics: { icon: Sigma, tone: "text-violet-300", dot: "bg-violet-400" },
};

export function ScientificScreen() {
  const [subject, setSubject] = useState<SciSubject | "All">("All");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState(presetsBySubject("Physics")[0].key);
  const detailRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const base = subject === "All" ? searchPresets(query) : searchPresets(query, subject);
    return base;
  }, [subject, query]);

  const chapters = useMemo(() => {
    const map = new Map<string, SciPreset[]>();
    for (const preset of results) {
      const bucket = map.get(preset.chapter) ?? [];
      bucket.push(preset);
      map.set(preset.chapter, bucket);
    }
    return [...map.entries()];
  }, [results]);

  const selected = useMemo(() => {
    const inResults = results.find((preset) => preset.key === selectedKey);
    if (inResults) return inResults;
    if (results.length) return results[0];
    return presetsBySubject("Physics")[0];
  }, [results, selectedKey]);

  useEffect(() => {
    setSelectedKey((prev) => (results.some((item) => item.key === prev) ? prev : results[0]?.key ?? prev));
  }, [results]);

  const counts = catalogStats.bySubject;

  return (
    <div className="mx-auto max-w-[1440px] px-3 pb-10 pt-4 sm:px-6 lg:px-8 lg:pt-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-label">
            <span className="h-px w-4 bg-emerald-400/70" /> Visual tool
          </p>
          <h1 className="mt-1.5 font-display text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">
            Graph Library
          </h1>
          <p className="mt-1 text-[12px] text-slate-500">
            {catalogStats.total} exam-ready plots across {catalogStats.chapters} chapters — every curve interactive.
          </p>
        </div>
        <div className="badge badge-accent h-8 px-3">
          <BarChart3 size={10} /> JEE · NEET · Boards
        </div>
      </div>

      {/* subject tabs */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSubject("All")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
            subject === "All"
              ? "border-white/20 bg-white/[.08] text-white"
              : "border-white/[.07] bg-white/[.02] text-slate-400 hover:text-slate-200"
          )}
        >
          <Sparkles size={11} /> All
          <span className="rounded-full bg-white/10 px-1.5 text-[9.5px] text-slate-300">{catalogStats.total}</span>
        </button>
        {SUBJECT_ORDER.map((item) => {
          const meta = SUBJECT_META[item];
          const Icon = meta.icon;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setSubject(item)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
                subject === item
                  ? "border-white/20 bg-white/[.08] text-white"
                  : "border-white/[.07] bg-white/[.02] text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon size={11} className={meta.tone} /> {item}
              <span className="rounded-full bg-white/10 px-1.5 text-[9.5px] text-slate-300">{counts[item]}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
        {/* library rail */}
        <div className="glass-panel order-2 flex max-h-[74vh] flex-col overflow-hidden lg:order-1">
          <div className="border-b border-white/[.06] p-3">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search plots, chapters, keywords…"
                className="field py-2 pl-8 pr-8 text-[11.5px]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-white"
                  aria-label="Clear search"
                >
                  <X size={11} />
                </button>
              )}
            </div>
            <p className="mt-2 text-[9.5px] text-slate-600">
              {results.length} {results.length === 1 ? "plot" : "plots"}
              {query && ` matching “${query.slice(0, 24)}”`}
            </p>
          </div>

          <div className="scrollbar-none flex-1 overflow-y-auto p-2">
            {chapters.length === 0 && (
              <p className="px-2 py-6 text-center text-[11px] text-slate-500">No plot matches that search.</p>
            )}
            {chapters.map(([chapter, plots]) => {
              const meta = SUBJECT_META[plots[0].subject];
              const Icon = meta.icon;
              return (
                <div key={chapter} className="mb-1.5">
                  <div className="flex items-center gap-1.5 px-2 py-1.5">
                    <Icon size={10} className={meta.tone} />
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {chapter}
                    </span>
                  </div>
                  {plots.map((plot) => {
                    const active = plot.key === selected.key;
                    return (
                      <button
                        key={plot.key}
                        type="button"
                        onClick={() => {
                          setSelectedKey(plot.key);
                          if (window.innerWidth < 1024) {
                            detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }}
                        className={cn(
                          "group mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] transition",
                          active
                            ? "bg-[rgb(var(--accent))]/12 font-medium text-white"
                            : "text-slate-400 hover:bg-white/[.04] hover:text-slate-200"
                        )}
                      >
                        <span className={cn("h-1 w-1 shrink-0 rounded-full", active ? meta.dot : "bg-slate-600")} />
                        <span className="truncate">{plot.title}</span>
                        <ChevronRight
                          size={10}
                          className={cn("ml-auto shrink-0 transition", active ? "opacity-100" : "opacity-0 group-hover:opacity-60")}
                        />
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* detail */}
        <div ref={detailRef} className="order-1 flex flex-col gap-3 lg:order-2">
          <div className="glass-panel overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[.06] px-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-semibold",
                      selected.subject === "Physics" && "border-cyan-300/25 bg-cyan-400/10 text-cyan-200",
                      selected.subject === "Chemistry" && "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
                      selected.subject === "Mathematics" && "border-violet-300/25 bg-violet-400/10 text-violet-200"
                    )}
                  >
                    {selected.subject}
                  </span>
                  <span className="rounded-full border border-white/[.08] bg-white/[.03] px-2 py-0.5 text-[9.5px] text-slate-400">
                    {selected.chapter}
                  </span>
                  {selected.exam && (
                    <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2 py-0.5 text-[9.5px] font-semibold text-amber-200">
                      {selected.exam}
                    </span>
                  )}
                </div>
                <h2 className="mt-1.5 font-display text-[16px] font-semibold text-white sm:text-[17px]">
                  {selected.title}
                </h2>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{selected.blurb}</p>
              </div>
              <Link
                href={`/chat?q=${encodeURIComponent(`Explain the ${selected.title} graph`)}`}
                className="btn-ghost h-8 shrink-0 px-2.5 text-[10.5px]"
              >
                Ask Axiom <ArrowUpRight size={11} />
              </Link>
            </div>

            <motion.div
              key={selected.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="h-[46vh] min-h-[320px] w-full sm:h-[52vh] lg:h-[calc(100dvh-330px)] lg:min-h-[420px]"
            >
              <ScientificPlot artifact={{ id: selected.key, type: "scientific", title: selected.title, preset: selected.key }} />
            </motion.div>

            <div className="border-t border-white/[.06] px-4 py-3">
              <div className="flex items-start gap-2">
                <Lightbulb size={12} className="mt-0.5 shrink-0 text-amber-300/80" />
                <p className="text-[11px] leading-relaxed text-slate-400">{selected.insight}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="glass-soft rounded-2xl px-3 py-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">x-axis</p>
              <p className="mt-0.5 text-[11.5px] text-slate-300">{selected.xLabel}</p>
            </div>
            <div className="glass-soft rounded-2xl px-3 py-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">y-axis</p>
              <p className="mt-0.5 text-[11.5px] text-slate-300">{selected.yLabel}</p>
            </div>
            <div className="glass-soft rounded-2xl px-3 py-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">Curves</p>
              <p className="mt-0.5 text-[11.5px] text-slate-300">
                {selected.series.filter((item) => item.label).length} traced
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, FlaskConical, Lightbulb, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ScientificPlot } from "@/components/viz/scientific-plot";
import { sciPresets, type SciPreset } from "@/lib/presets";
import { cn } from "@/lib/utils";

const SUBJECTS: (SciPreset["subject"] | "All")[] = ["All", "Physics", "Chemistry", "Mathematics"];

const SUBJECT_TONE: Record<string, string> = {
  Physics: "text-cyan-300 border-cyan-300/20 bg-cyan-400/10",
  Chemistry: "text-emerald-300 border-emerald-300/20 bg-emerald-400/10",
  Mathematics: "text-violet-300 border-violet-300/20 bg-violet-400/10",
};

export function ScientificScreen() {
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("All");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState(sciPresets[0].key);

  const filtered = useMemo(
    () =>
      sciPresets.filter((preset) => {
        const matchesSubject = subject === "All" || preset.subject === subject;
        const matchesQuery =
          !query.trim() ||
          `${preset.title} ${preset.chapter} ${preset.blurb}`.toLowerCase().includes(query.toLowerCase());
        return matchesSubject && matchesQuery;
      }),
    [subject, query]
  );

  const selected = sciPresets.find((preset) => preset.key === selectedKey) ?? sciPresets[0];

  return (
    <div className="mx-auto max-w-[1400px] px-3 pb-10 pt-4 sm:px-6 lg:px-8 lg:pt-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-label">
            <span className="h-px w-4 bg-emerald-400/70" /> Visual tool
          </p>
          <h1 className="mt-1.5 font-display text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">
            Scientific Graph Generator
          </h1>
          <p className="mt-1 text-[12px] text-slate-500">
            {sciPresets.length} exam-ready plots across Physics, Chemistry and Mathematics.
          </p>
        </div>
        <div className="badge badge-accent h-8 px-3">
          <FlaskConical size={10} /> JEE · NEET · Boards
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
        {/* library */}
        <div className="glass-panel order-2 flex max-h-[70vh] flex-col overflow-hidden lg:order-1">
          <div className="border-b border-white/[.06] p-3">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search plots…"
                className="field py-2 pl-8 text-[11.5px]"
              />
            </div>
            <div className="mt-2 flex gap-1">
              {SUBJECTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSubject(item)}
                  className={cn(
                    "flex-1 rounded-lg border px-1 py-1.5 text-[9.5px] font-semibold transition",
                    subject === item
                      ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-200"
                      : "border-white/[.06] bg-white/[.02] text-slate-500 hover:text-slate-300"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="scrollbar-none flex-1 overflow-y-auto p-2">
            {filtered.length === 0 && (
              <p className="p-4 text-center text-[11px] text-slate-600">No plots match that search.</p>
            )}
            {filtered.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => setSelectedKey(preset.key)}
                className={cn(
                  "group mb-1 flex w-full flex-col gap-1 rounded-xl border px-3 py-2.5 text-left transition",
                  preset.key === selectedKey
                    ? "border-emerald-300/30 bg-emerald-400/[.07]"
                    : "border-transparent hover:border-white/[.07] hover:bg-white/[.03]"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("rounded border px-1.5 py-[1px] text-[8px] font-bold uppercase tracking-wider", SUBJECT_TONE[preset.subject])}>
                    {preset.subject.slice(0, 4)}
                  </span>
                  {preset.exam && <span className="text-[8.5px] text-slate-600">{preset.exam}</span>}
                </div>
                <span className={cn("text-[11.5px] font-medium leading-snug", preset.key === selectedKey ? "text-white" : "text-slate-300")}>
                  {preset.title}
                </span>
                <span className="text-[9.5px] text-slate-600">{preset.chapter}</span>
              </button>
            ))}
          </div>
        </div>

        {/* plot */}
        <div className="order-1 flex flex-col gap-3 lg:order-2">
          <motion.div
            key={selected.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass overflow-hidden rounded-3xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[.06] px-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-[14.5px] font-semibold text-white">{selected.title}</h2>
                  <span className={cn("rounded border px-1.5 py-[1px] text-[8px] font-bold uppercase tracking-wider", SUBJECT_TONE[selected.subject])}>
                    {selected.subject}
                  </span>
                  {selected.exam && <span className="badge py-0.5 text-[8.5px]">{selected.exam}</span>}
                </div>
                <p className="mt-0.5 text-[10.5px] text-slate-500">
                  {selected.chapter} · {selected.blurb}
                </p>
              </div>
              <Link
                href={`/chat?q=${encodeURIComponent(`Explain ${selected.title} with this graph`)}`}
                className="btn-ghost h-8 shrink-0 px-2.5 text-[10.5px]"
              >
                Discuss <ArrowUpRight size={11} />
              </Link>
            </div>
            <div className="h-[46vh] min-h-[340px] w-full lg:h-[calc(100dvh-340px)]">
              <ScientificPlot artifact={{ id: selected.key, type: "scientific", title: selected.title, preset: selected.key }} />
            </div>
            <div className="grid gap-2 border-t border-white/[.06] px-4 py-3 sm:grid-cols-2">
              <div className="flex items-start gap-2 rounded-xl border border-white/[.05] bg-white/[.02] p-2.5">
                <Lightbulb size={12} className="mt-0.5 shrink-0 text-amber-300/80" />
                <p className="text-[10.5px] leading-relaxed text-slate-400">{selected.insight}</p>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-emerald-300/10 bg-emerald-400/[.03] p-2.5">
                <Sparkles size={12} className="mt-0.5 shrink-0 text-emerald-300/80" />
                <p className="text-[10.5px] leading-relaxed text-slate-400">
                  Expand <span className="text-slate-200">Parameters</span> under the plot to change the
                  constants and watch the curve respond — perfect for “what if” questions.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="glass-panel p-3.5">
            <p className="section-label mb-2">
              <span className="h-px w-3 bg-[rgb(var(--accent))]/60" /> More in {selected.subject}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sciPresets
                .filter((preset) => preset.subject === selected.subject && preset.key !== selected.key)
                .slice(0, 3)
                .map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setSelectedKey(preset.key)}
                    className="group flex items-center justify-between gap-2 rounded-xl border border-white/[.06] bg-white/[.02] px-3 py-2.5 text-left transition hover:border-emerald-300/25 hover:bg-emerald-400/[.04]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[10.5px] font-medium text-slate-300 group-hover:text-white">
                        {preset.title}
                      </span>
                      <span className="block text-[9px] text-slate-600">{preset.chapter}</span>
                    </span>
                    <ArrowUpRight size={11} className="shrink-0 text-slate-600 group-hover:text-emerald-300" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

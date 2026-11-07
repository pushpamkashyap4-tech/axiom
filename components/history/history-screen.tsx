"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Boxes,
  FlaskConical,
  History,
  LineChart,
  MessageSquare,
  Search,
  Sparkles,
  Trash2,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { clearSessions, deleteSession, loadSessions, subscribeSessions } from "@/lib/sessions";
import type { Artifact, ChatSession } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const ICONS: Record<Artifact["type"], typeof LineChart> = {
  graph: LineChart,
  scientific: FlaskConical,
  scene3d: Boxes,
  mermaid: Workflow,
  geometry: Sparkles,
};

function groupLabel(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  if (today.getTime() - timestamp < 7 * 864e5) return "This week";
  return "Earlier";
}

export function HistoryScreen() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [query, setQuery] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    setSessions(loadSessions());
    return subscribeSessions(() => setSessions(loadSessions()));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return sessions;
    const lower = query.toLowerCase();
    return sessions.filter((session) =>
      `${session.title} ${session.messages.map((message) => message.content).join(" ")}`.toLowerCase().includes(lower)
    );
  }, [sessions, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, ChatSession[]>();
    for (const session of filtered) {
      const label = groupLabel(session.updatedAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(session);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const totalVisuals = sessions.reduce(
    (total, session) => total + session.messages.reduce((count, message) => count + (message.artifacts?.length ?? 0), 0),
    0
  );

  const remove = (id: string) => {
    setRemoving(id);
    setTimeout(() => {
      deleteSession(id);
      setSessions(loadSessions());
      setRemoving(null);
      toast("Session removed from this device.", "success");
    }, 180);
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-12 pt-5 sm:px-6 lg:px-9 lg:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">
            <span className="h-px w-4 bg-[rgb(var(--accent))]/60" /> Your workspace
          </p>
          <h1 className="mt-1.5 font-display text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">
            Learning history
          </h1>
          <p className="mt-1 text-[12px] text-slate-500">
            Every explanation and visual is saved locally on this device — nothing leaves your browser
            unless you connect an LLM.
          </p>
        </div>
        <Link href="/chat?new=1" className="btn-primary h-9 px-4 text-[11.5px]">
          <Sparkles size={13} /> New session
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {[
          { label: "Sessions", value: sessions.length },
          { label: "Visuals", value: totalVisuals },
          { label: "Messages", value: sessions.reduce((total, session) => total + session.messages.length, 0) },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel px-4 py-3">
            <p className="font-display text-[22px] font-semibold leading-none text-white">{stat.value}</p>
            <p className="mt-1 text-[9.5px] uppercase tracking-[0.16em] text-slate-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sessions, prompts, topics…"
            className="field py-2.5 pl-9 text-[12px]"
          />
        </div>
        {sessions.length > 0 && (
          <button type="button" onClick={() => setConfirmClear(true)} className="btn-ghost h-10 px-3 text-[11px] hover:border-rose-400/30 hover:text-rose-300">
            <Trash2 size={12} /> Clear all
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="glass-panel mt-5 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/[.08] bg-white/[.03]">
            <History size={22} className="text-slate-500" />
          </div>
          <h2 className="mt-4 font-display text-[17px] font-semibold text-white">No sessions yet</h2>
          <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-slate-500">
            Ask Axiom a question and your chat, graphs and 3D scenes will appear here for quick revision.
          </p>
          <Link href="/chat" className="btn-primary mt-5 h-9 px-4 text-[11.5px]">
            <MessageSquare size={13} /> Start a session
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 text-center text-[12px] text-slate-500">No sessions match “{query}”.</div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {grouped.map(([label, items]) => (
            <div key={label}>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <span className="h-px flex-1 bg-white/[.06]" />
                <span className="text-[9.5px] text-slate-600">{items.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {items.map((session) => {
                    const lastAssistant = [...session.messages].reverse().find((message) => message.role === "assistant");
                    const artifacts = lastAssistant?.artifacts ?? [];
                    const types = Array.from(new Set(artifacts.map((artifact) => artifact.type)));
                    const firstPrompt = session.messages.find((message) => message.role === "user")?.content ?? "";
                    return (
                      <motion.div
                        key={session.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: removing === session.id ? 0 : 1, y: 0, x: removing === session.id ? -12 : 0 }}
                        exit={{ opacity: 0 }}
                        className="glass glass-hover group relative rounded-2xl p-3.5"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[.07] bg-white/[.04] text-slate-400">
                            <MessageSquare size={15} />
                          </span>
                          <Link href={`/chat?session=${session.id}`} className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-[12.5px] font-semibold text-slate-100 group-hover:text-white">
                                {session.title}
                              </p>
                              <span className="text-[9px] text-slate-600">{timeAgo(session.updatedAt)}</span>
                            </div>
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                              {firstPrompt || "Empty session"}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-[9.5px] text-slate-600">
                                {session.messages.length} messages
                              </span>
                              {types.map((type) => {
                                const Icon = ICONS[type];
                                return (
                                  <span
                                    key={type}
                                    className="flex items-center gap-1 rounded border border-white/[.06] bg-white/[.03] px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider text-slate-500"
                                  >
                                    <Icon size={8.5} /> {type}
                                  </span>
                                );
                              })}
                            </div>
                          </Link>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => remove(session.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 opacity-60 transition hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100"
                              aria-label={`Delete ${session.title}`}
                            >
                              <Trash2 size={13} />
                            </button>
                            <Link
                              href={`/chat?session=${session.id}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[.06] hover:text-white"
                              aria-label="Open session"
                            >
                              <ArrowUpRight size={14} />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear all history?"
        subtitle="This removes every session and visual from this device. It cannot be undone."
        size="md"
      >
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-400/15 bg-rose-500/[.04] p-4">
          <p className="text-[11.5px] leading-relaxed text-slate-400">
            You have <span className="font-semibold text-rose-200">{sessions.length}</span> saved sessions and{" "}
            <span className="font-semibold text-rose-200">{totalVisuals}</span> visuals. Export a copy first if
            you want to keep them.
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setConfirmClear(false)} className="btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              clearSessions();
              setSessions([]);
              setConfirmClear(false);
              toast("All history cleared.", "success");
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-2 text-[12px] font-semibold text-rose-200 transition hover:bg-rose-500/25"
            )}
          >
            <Trash2 size={13} /> Clear everything
          </button>
        </div>
      </Modal>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Atom,
  Boxes,
  Flame,
  FlaskConical,
  History,
  LineChart,
  MessageSquare,
  Shapes,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadSessions, subscribeSessions, visualCount } from "@/lib/sessions";
import { EXAM_LABELS, loadSettings, subscribeSettings, type Settings } from "@/lib/settings";
import { topics } from "@/lib/knowledge";
import { cn, getGreeting, timeAgo } from "@/lib/utils";

/* --------------------------------- mini art -------------------------------- */

function SineArt() {
  return (
    <svg viewBox="0 0 120 60" className="h-full w-full" fill="none">
      <defs>
        <linearGradient id="sine-grad" x1="0" y1="0" x2="120" y2="0">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={`v${i}`} x1={i * 24} y1="0" x2={i * 24} y2="60" stroke="white" strokeOpacity=".05" />
      ))}
      {[0, 1, 2].map((i) => (
        <line key={`h${i}`} x1="0" y1={15 + i * 15} x2="120" y2={15 + i * 15} stroke="white" strokeOpacity=".05" />
      ))}
      <path d="M0 30 H120" stroke="white" strokeOpacity=".14" strokeDasharray="2 4" />
      <path d="M2 30 C 14 8, 26 8, 38 30 S 62 52, 74 30 S 98 8, 118 30" stroke="url(#sine-grad)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="74" cy="30" r="2.3" fill="#67e8f9" />
    </svg>
  );
}

function CubeArt() {
  return (
    <svg viewBox="0 0 120 60" className="h-full w-full" fill="none">
      <defs>
        <linearGradient id="cube-grad" x1="30" y1="10" x2="90" y2="55">
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <g transform="translate(60 30) scale(.62)">
        <path d="M0 -26 L23 -13 L23 13 L0 26 L-23 13 L-23 -13 Z" stroke="url(#cube-grad)" strokeWidth="1.5" opacity=".8" />
        <path d="M0 -26 L0 0 M-23 -13 L0 0 M23 -13 L0 0 M0 26 L0 0" stroke="url(#cube-grad)" strokeWidth="1.2" opacity=".45" />
        {[[0, -26], [23, -13], [23, 13], [0, 26], [-23, 13], [-23, -13]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4.2" fill="#67e8f9" fillOpacity=".85" />
        ))}
        <circle cx="0" cy="0" r="4.2" fill="#c4b5fd" />
      </g>
    </svg>
  );
}

function NodesArt() {
  return (
    <svg viewBox="0 0 120 60" className="h-full w-full" fill="none">
      <defs>
        <linearGradient id="node-grad" x1="20" y1="10" x2="100" y2="50">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path d="M30 30 H52 M68 30 H88 M60 22 V12 M60 38 V48" stroke="url(#node-grad)" strokeWidth="1.2" opacity=".5" />
      <rect x="14" y="22" width="16" height="16" rx="5" stroke="url(#node-grad)" strokeWidth="1.4" fill="#34d399" fillOpacity=".09" />
      <rect x="52" y="22" width="16" height="16" rx="5" stroke="url(#node-grad)" strokeWidth="1.4" fill="#22d3ee" fillOpacity=".09" />
      <rect x="88" y="22" width="16" height="16" rx="5" stroke="url(#node-grad)" strokeWidth="1.4" fill="#a78bfa" fillOpacity=".09" />
      <circle cx="60" cy="10" r="4.5" stroke="url(#node-grad)" strokeWidth="1.3" />
      <circle cx="60" cy="50" r="4.5" stroke="url(#node-grad)" strokeWidth="1.3" />
    </svg>
  );
}

function MandalaArt() {
  const petals = 10;
  const paths = Array.from({ length: petals }).map((_, index) => {
    const angle = (index / petals) * Math.PI * 2;
    const x = 60 + Math.cos(angle) * 22;
    const y = 30 + Math.sin(angle) * 22;
    return <ellipse key={index} cx={x} cy={y} rx="9" ry="4" transform={`rotate(${(angle * 180) / Math.PI} ${x} ${y})`} stroke="#fb7185" strokeOpacity=".55" strokeWidth=".9" fill="none" />;
  });
  return (
    <svg viewBox="0 0 120 60" className="h-full w-full" fill="none">
      {paths}
      <circle cx="60" cy="30" r="8" stroke="#22d3ee" strokeOpacity=".6" strokeWidth="1.1" />
      <circle cx="60" cy="30" r="2" fill="#67e8f9" />
    </svg>
  );
}

function ChatArt() {
  return (
    <svg viewBox="0 0 120 60" className="h-full w-full" fill="none">
      <defs>
        <linearGradient id="chat-grad" x1="20" y1="10" x2="100" y2="50">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <rect x="18" y="14" width="56" height="22" rx="8" stroke="url(#chat-grad)" strokeWidth="1.3" fill="#22d3ee" fillOpacity=".06" />
      <rect x="46" y="26" width="56" height="22" rx="8" stroke="url(#chat-grad)" strokeWidth="1.3" fill="#a78bfa" fillOpacity=".08" />
      <path d="M28 22 H58 M28 29 H48" stroke="#67e8f9" strokeOpacity=".5" strokeWidth="1.1" />
      <path d="M56 34 H94 M56 41 H82" stroke="#c4b5fd" strokeOpacity=".55" strokeWidth="1.1" />
      <circle cx="100" cy="16" r="5" fill="#22d3ee" fillOpacity=".15" stroke="#22d3ee" strokeOpacity=".5" />
    </svg>
  );
}

/* ---------------------------------- data ---------------------------------- */

const TOOLS = [
  {
    href: "/chat",
    title: "AI Chat",
    description: "Ask anything — get explanations, tables and visuals in one answer.",
    icon: MessageSquare,
    art: ChatArt,
    tone: "from-cyan-400/18",
    accent: "text-cyan-300",
    tag: "Core",
  },
  {
    href: "/tools/grapher",
    title: "2D Grapher",
    description: "Plot functions instantly with zoom, pan and a live cursor read-out.",
    icon: LineChart,
    art: SineArt,
    tone: "from-sky-400/18",
    accent: "text-sky-300",
    tag: "Interactive",
  },
  {
    href: "/tools/3d",
    title: "3D Lab",
    description: "FCC, BCC, electrolytic cells and solenoids — rotate and morph them.",
    icon: Boxes,
    art: CubeArt,
    tone: "from-violet-400/18",
    accent: "text-violet-300",
    tag: "New",
  },
  {
    href: "/tools/scientific",
    title: "Graph Library",
    description: "109 plots — conics, kinetics, blackbody, LCR resonance and more.",
    icon: FlaskConical,
    art: SineArt,
    tone: "from-emerald-400/18",
    accent: "text-emerald-300",
    tag: "JEE · NEET",
  },
  {
    href: "/tools/diagrams",
    title: "Diagrams",
    description: "Turn processes into flowcharts, sequence diagrams and mind maps.",
    icon: Workflow,
    art: NodesArt,
    tone: "from-amber-400/16",
    accent: "text-amber-300",
    tag: "Mermaid",
  },
  {
    href: "/tools/diagrams?tab=patterns",
    title: "Geometric Patterns",
    description: "Procedural mandalas and spirals that visualise symmetry.",
    icon: Shapes,
    art: MandalaArt,
    tone: "from-rose-400/16",
    accent: "text-rose-300",
    tag: "SVG",
  },
];

const QUICK_PROMPTS = [
  "Show FCC, highlight face diagonal",
  "Plot PV isothermal vs adiabatic",
  "Explain photoelectric effect with graphs",
  "Mind map of chemical bonding",
  "Vapor pressure vs mole fraction ideal solution",
  "SHM displacement, velocity, acceleration",
];

/* -------------------------------- composer -------------------------------- */

export function PromptComposer({
  autoFocus,
  placeholder = "Ask anything — “explain the photoelectric effect with graphs”",
  compact = false,
}: {
  autoFocus?: boolean;
  placeholder?: string;
  compact?: boolean;
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const submit = () => {
    const prompt = value.trim();
    if (!prompt) return;
    router.push(`/chat?q=${encodeURIComponent(prompt)}`);
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl transition-all duration-300",
        focused ? "shadow-[0_0_0_1px_rgba(var(--accent),.28),0_20px_70px_-30px_rgba(var(--accent),.5)]" : ""
      )}
    >
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-400/25 via-violet-400/20 to-emerald-400/20 opacity-60 blur-[6px]" />
      <div className="glass-strong relative rounded-2xl p-2">
        <div className="flex items-end gap-2">
          <div className="mb-1 ml-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.04]">
            <Sparkles size={15} className="text-[rgb(var(--accent))]" />
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={placeholder}
            className={cn(
              "min-h-[38px] flex-1 resize-none bg-transparent py-2 text-[13.5px] leading-relaxed text-slate-100 outline-none placeholder:text-slate-500 sm:text-sm",
              compact && "text-[13px]"
            )}
          />
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim()}
            className={cn(
              "mb-0.5 flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[12px] font-semibold transition-all duration-200",
              value.trim()
                ? "bg-gradient-to-r from-cyan-300 to-violet-300 text-[#041014] shadow-[0_6px_22px_-6px_rgba(34,211,238,.6)] hover:brightness-110"
                : "border border-white/[.07] bg-white/[.035] text-slate-600"
            )}
            aria-label="Send prompt"
          >
            <span className="hidden sm:inline">Visualize</span>
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between px-2 pb-0.5">
          <div className="flex items-center gap-2 text-[9.5px] text-slate-600">
            <span className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-emerald-400 accent-dot" />
              Visual engine ready
            </span>
            <span className="hidden sm:inline">· graphs, 3D, diagrams, tables</span>
          </div>
          <div className="hidden items-center gap-1 sm:flex">
            <kbd className="kbd">↵</kbd>
            <span className="text-[9px] text-slate-600">to generate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */

export function HomeContent() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sessions, setSessions] = useState(loadSessions());
  const [visuals, setVisuals] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setSettings(loadSettings());
    setSessions(loadSessions());
    setVisuals(visualCount());
    const unsubSettings = subscribeSettings(() => setSettings(loadSettings()));
    const unsubSessions = subscribeSessions(() => {
      setSessions(loadSessions());
      setVisuals(visualCount());
    });
    return () => {
      unsubSettings();
      unsubSessions();
    };
  }, []);

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    []
  );

  const examLabel = EXAM_LABELS[settings?.exam ?? "jee"];

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-12 pt-5 sm:px-6 lg:px-9 lg:pt-8">
      {/* top row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-slate-500">{dateLabel}</p>
          <h1 className="mt-1.5 font-display text-[22px] font-semibold tracking-tight text-white sm:text-[25px]">
            {getGreeting()}
            {settings?.name?.trim() ? `, ${settings.name.trim().split(" ")[0]}` : ""}
            <span className="ml-2 inline-block align-middle text-[15px]">👋</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="badge h-8 gap-1.5 px-3">
            <Zap size={11} className="text-amber-300" />
            <span className="text-slate-300">{examLabel} focus</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="text-slate-500">{settings?.targetYear ?? "2027"}</span>
          </div>
          <Link
            href="/history"
            className="hidden h-8 items-center gap-1.5 rounded-full border border-white/[.08] bg-white/[.04] px-3 text-[11px] font-medium text-slate-300 transition hover:border-white/15 hover:text-white sm:flex"
          >
            <History size={11.5} /> History
          </Link>
        </div>
      </div>

      {/* hero */}
      <div className="relative mt-5 sm:mt-12">
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[560px] max-w-full -translate-x-1/2 rounded-full bg-cyan-500/[.07] blur-[70px]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/[.09] bg-white/[.035] px-3 py-1.5 backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
            </span>
            <span className="text-[10.5px] font-medium tracking-wide text-slate-300">
              Axiom Engine v2 · natural language → visuals
            </span>
            <Sparkles size={10.5} className="text-cyan-300/70" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-4 font-display text-[29px] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:mt-5 sm:text-[46px] lg:text-[52px]"
          >
            See the concept.
            <br className="hidden sm:block" />
            <span className="gradient-text"> Not just the formula.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mx-auto mt-3 max-w-xl text-[12.5px] leading-relaxed text-slate-400 sm:mt-4 sm:text-[14px]"
          >
            Type a question. Axiom builds the graph, the 3D model, the flowchart — and explains it
            like a tutor who can draw.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-5 text-left sm:mt-7"
          >
            <PromptComposer autoFocus />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="scrollbar-none mt-4 flex snap-x gap-2 overflow-x-auto pb-1 text-left sm:flex-wrap sm:justify-center sm:overflow-visible"
          >
            {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => router.push(`/chat?q=${encodeURIComponent(prompt)}`)}
                className="group flex shrink-0 snap-start items-center gap-1.5 rounded-full border border-white/[.075] bg-white/[.03] px-3 py-1.5 text-[10.5px] font-medium text-slate-400 transition hover:border-cyan-300/25 hover:bg-cyan-400/[.06] hover:text-cyan-100"
              >
                <Sparkles size={9.5} className="text-slate-600 transition group-hover:text-cyan-300" />
                {prompt}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* tools */}
      <div className="mt-9 sm:mt-16">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="section-label">
              <span className="h-px w-4 bg-[rgb(var(--accent))]/60" /> Visual toolkit
            </p>
            <h3 className="mt-1.5 font-display text-[17px] font-semibold tracking-tight text-white">
              Everything you need to study
            </h3>
          </div>
          <Link
            href="/tools/scientific"
            className="group flex items-center gap-1 text-[11px] font-medium text-slate-500 transition hover:text-slate-200"
          >
            Browse all
            <ArrowUpRight size={12} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {TOOLS.map((tool, index) => {
            const Icon = tool.icon;
            const Art = tool.art;
            return (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * index }}
              >
                <Link href={tool.href} className="tool-card noise group block h-full overflow-hidden p-4">
                  <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-70", tool.tone)} />

                  <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl border border-white/[.08] bg-white/[.05] backdrop-blur", tool.accent)}>
                        <Icon size={16} strokeWidth={2} />
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold text-white">{tool.title}</p>
                        <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-slate-500">{tool.tag}</p>
                      </div>
                    </div>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[.06] bg-white/[.03] text-slate-500 transition group-hover:border-[rgba(var(--accent),.3)] group-hover:text-[rgb(var(--accent))]">
                      <ArrowUpRight size={12} />
                    </span>
                  </div>
                  <p className="relative mt-3 min-h-[32px] text-[11px] leading-relaxed text-slate-400">{tool.description}</p>
                  <div className="tool-art relative mt-3 h-[64px] overflow-hidden rounded-xl border border-white/[.05]">
                    <div className="absolute inset-0 opacity-70 transition duration-500 group-hover:opacity-100 group-hover:scale-[1.04]">
                      <Art />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* lower row */}
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="tool-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="section-label">
              <History size={11.5} /> Continue learning
            </p>
            {sessions.length > 0 && (
              <Link href="/history" className="text-[10.5px] text-slate-500 transition hover:text-white">
                View all
              </Link>
            )}
          </div>
          {sessions.length === 0 ? (
            <div className="mt-3 flex items-center gap-4 rounded-2xl border border-dashed border-white/[.08] p-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/[.07]">
                <Sparkles size={18} className="text-cyan-300" />
              </div>
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium text-slate-200">Your first visualisation is one sentence away</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  Ask for a lattice, a plot or a mind map. Everything you generate is saved on this device.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {sessions.slice(0, 4).map((session) => (
                <Link
                  key={session.id}
                  href={`/chat?session=${session.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3 transition hover:border-white/[.12] hover:bg-white/[.04]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[.07] bg-white/[.04] text-slate-400 group-hover:text-[rgb(var(--accent))]">
                    <MessageSquare size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-medium text-slate-200">{session.title}</p>
                    <p className="text-[9.5px] text-slate-600">
                      {session.messages.length} messages · {timeAgo(session.updatedAt)}
                    </p>
                  </div>
                  <ArrowUpRight size={12} className="shrink-0 text-slate-600 transition group-hover:text-white" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="tool-card relative overflow-hidden p-4">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/15 blur-2xl" />
          <p className="section-label">
            <Flame size={11.5} className="text-amber-300" /> This device
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="font-display text-[26px] font-semibold leading-none text-white">{visuals}</p>
              <p className="mt-1 text-[10px] text-slate-500">visuals generated</p>
            </div>
            <div>
              <p className="font-display text-[26px] font-semibold leading-none text-white">{topics.length}</p>
              <p className="mt-1 text-[10px] text-slate-500">chapters mapped</p>
            </div>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {["Graphs", "3D", "Diagrams", "Tables", "Patterns"].map((tag) => (
              <span key={tag} className="rounded-full border border-white/[.07] bg-white/[.03] px-2 py-0.5 text-[9px] text-slate-500">
                {tag}
              </span>
            ))}
          </div>
          <Link href="/tools/scientific" className="btn-ghost mt-3.5 w-full justify-center py-2 text-[11px]">
            <Atom size={12} /> Open a scientific plot
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center text-[10px] text-slate-600">
        Built for JEE · NEET · Boards — works offline, upgrades with your own LLM key.
      </p>
    </div>
  );
}

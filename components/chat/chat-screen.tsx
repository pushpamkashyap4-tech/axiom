"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  MessageSquarePlus,
  RefreshCw,
  Sparkles,
  SquarePen,
  Trash2,
  Zap,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArtifactCard } from "@/components/viz/artifact-card";
import { Markdown } from "@/components/chat/markdown";
import { ChatComposer } from "@/components/chat/chat-composer";
import { useToast } from "@/components/ui/toast";
import { deleteSession, loadSessions, saveSession } from "@/lib/sessions";
import { loadSettings, type Settings } from "@/lib/settings";
import type { Artifact, ChatMessage, ChatSession, EngineContext, SceneConfig } from "@/lib/types";
import { cn, formatTime, titleFromPrompt, uid } from "@/lib/utils";

const THINKING_STAGES = [
  "Parsing your question",
  "Selecting the visual engine",
  "Composing explanation & scene",
];

const EMPTY_SUGGESTIONS = [
  { title: "Crystal lattices", prompt: "Show FCC, highlight face diagonal", icon: "◇" },
  { title: "Thermodynamics", prompt: "Plot a P–V diagram: isothermal vs adiabatic", icon: "◈" },
  { title: "Photoelectric effect", prompt: "Explain the photoelectric effect with graphs", icon: "✦" },
  { title: "Organic visual", prompt: "Mind map of chemical bonding", icon: "⌘" },
];

export function ChatScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<ChatSession>(() => ({
    id: uid("chat"),
    title: "New visual session",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const handledQuery = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  /* load settings + recent sessions */
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  /* hydrate from URL */
  useEffect(() => {
    if (handledQuery.current) return;
    const sessionId = searchParams.get("session");
    if (sessionId) {
      const existing = loadSessions().find((item) => item.id === sessionId);
      if (existing) {
        setSession(existing);
        handledQuery.current = true;
        return;
      }
      toast("That session is no longer on this device.", "info");
    }
    handledQuery.current = true;
  }, [searchParams, toast]);

  useEffect(() => {
    if (!thinking) {
      setThinkingStage(0);
      return;
    }
    const interval = setInterval(() => {
      setThinkingStage((stage) => Math.min(stage + 1, THINKING_STAGES.length - 1));
    }, 460);
    return () => clearInterval(interval);
  }, [thinking]);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
  }, []);

  useEffect(() => {
    if (session.messages.length === 0) {
      scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.messages.length, thinking]);

  const persist = useCallback((next: ChatSession) => {
    setSession(next);
    if (next.messages.length > 0) saveSession({ ...next, updatedAt: Date.now() });
  }, []);

  const context = useMemo<EngineContext>(() => {
    const lastAssistant = [...session.messages].reverse().find((message) => message.role === "assistant");
    const lastScene = lastAssistant?.artifacts?.find((artifact) => artifact.type === "scene3d");
    return {
      lastScene: lastScene && lastScene.type === "scene3d" ? lastScene.config : undefined,
      exam: settings?.exam ?? "jee",
    };
  }, [session.messages, settings]);

  const send = useCallback(
    async (prompt: string) => {
      const clean = prompt.trim();
      if (!clean || busy) return;
      setBusy(true);
      setThinking(true);

      const userMessage: ChatMessage = {
        id: uid("msg"),
        role: "user",
        content: clean,
        createdAt: Date.now(),
      };

      let workingSession = session;
      if (workingSession.messages.length === 0) {
        workingSession = {
          ...workingSession,
          title: titleFromPrompt(clean),
          createdAt: Date.now(),
        };
      }

      const withUser: ChatSession = {
        ...workingSession,
        messages: [...workingSession.messages, userMessage],
        updatedAt: Date.now(),
      };
      persist(withUser);
      setThinkingStage(0);

      const controller = new AbortController();
      abortRef.current = controller;
      const started = performance.now();
      const minimumDelay = new Promise((resolve) => setTimeout(resolve, 620));

      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: clean,
            context: {
              ...context,
              exam: settings?.exam ?? "jee",
            },
            history: workingSession.messages.slice(-6).map((message) => ({
              role: message.role,
              content: message.content,
            })),
            engine: settings?.engine,
          }),
          signal: controller.signal,
        });
        await minimumDelay;
        if (!response.ok) throw new Error("The engine could not process that request.");
        const data = (await response.json()) as {
          content: string;
          artifacts: Artifact[];
          followUps: string[];
          meta?: ChatMessage["meta"];
        };

        const assistantMessage: ChatMessage = {
          id: uid("msg"),
          role: "assistant",
          content: data.content,
          artifacts: data.artifacts ?? [],
          followUps: data.followUps ?? [],
          meta: {
            source: data.meta?.source ?? "local",
            model: data.meta?.model,
            latency: Math.round(performance.now() - started),
          },
          createdAt: Date.now(),
        };

        persist({
          ...withUser,
          messages: [...withUser.messages, assistantMessage],
          updatedAt: Date.now(),
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast(
            error instanceof Error ? error.message : "Something went wrong. Try rephrasing.",
            "error"
          );
          const fallbackMessage: ChatMessage = {
            id: uid("msg"),
            role: "assistant",
            content:
              "I hit a snag processing that. Try a shorter prompt, or ask for one of the built-in visual engines — for example **“show FCC in 3D”** or **“plot a P–V diagram”**.",
            followUps: ["Show FCC in 3D", "Plot a P–V diagram", "Explain Raoult's law"],
            createdAt: Date.now(),
          };
          persist({
            ...withUser,
            messages: [...withUser.messages, fallbackMessage],
            updatedAt: Date.now(),
          });
        }
      } finally {
        setBusy(false);
        setThinking(false);
        abortRef.current = null;
      }
    },
    [busy, context, persist, session, settings, toast]
  );

  /* send query from home (depends on send) */
  const queryHandled = useRef(false);
  useEffect(() => {
    const query = searchParams.get("q");
    if (!query || queryHandled.current) return;
    queryHandled.current = true;
    void send(query);
    router.replace("/chat");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, send]);

  const updateArtifact = (messageId: string, artifactId: string, config: SceneConfig) => {
    const next: ChatSession = {
      ...session,
      messages: session.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              artifacts: message.artifacts?.map((artifact) =>
                artifact.id === artifactId && artifact.type === "scene3d"
                  ? { ...artifact, config }
                  : artifact
              ),
            }
          : message
      ),
    };
    persist(next);
  };

  const copyMessage = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      toast("Clipboard is blocked in this preview.", "error");
    }
  };

  const regenerate = (message: ChatMessage) => {
    const index = session.messages.findIndex((item) => item.id === message.id);
    if (index < 0) return;
    const previousUser = [...session.messages.slice(0, index)].reverse().find((item) => item.role === "user");
    if (!previousUser) return;
    const trimmed: ChatSession = {
      ...session,
      messages: session.messages.slice(0, index),
    };
    setSession(trimmed);
    saveSession(trimmed);
    void send(previousUser.content);
  };

  const startNew = () => {
    const fresh: ChatSession = {
      id: uid("chat"),
      title: "New visual session",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSession(fresh);
    router.replace("/chat");
    scrollToBottom(false);
  };

  const removeSession = () => {
    deleteSession(session.id);
    toast("Session deleted from this device.", "success");
    startNew();
  };

  const engineLabel =
    settings?.engine.provider && settings.engine.provider !== "local"
      ? settings.engine.model || "Custom LLM"
      : "Axiom Engine v2";

  return (
    <div className="flex h-[calc(100dvh-134px)] flex-col lg:h-[100dvh]">
      {/* header */}
      <div className="shrink-0 border-b border-white/[.055] bg-[#05080f]/50 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/15 to-violet-500/15">
              <Sparkles size={16} className="text-cyan-300" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#05080f] bg-emerald-400" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-[14px] font-semibold tracking-tight text-white">
                {session.messages.length ? session.title : "Axiom AI"}
              </h1>
              <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Zap size={9} className="text-cyan-400/70" />
                {engineLabel}
                <span className="text-slate-700">·</span>
                <span className="text-emerald-400/80">ready</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {session.messages.length > 0 && (
              <button
                onClick={removeSession}
                className="icon-btn hidden sm:flex"
                title="Delete session"
                aria-label="Delete session"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={startNew} className="btn-ghost h-9 px-3 text-[11.5px]">
              <SquarePen size={12.5} /> New
            </button>
          </div>
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-2 sm:px-6">
        <div className="mx-auto max-w-4xl">
          {session.messages.length === 0 && !thinking && (
            <div className="flex min-h-[44vh] flex-col items-center justify-center py-6 text-center sm:min-h-[52vh] sm:py-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative mb-5"
              >
                <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />
                <div className="relative grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/20 via-sky-500/10 to-violet-500/20 backdrop-blur">
                  <Sparkles size={24} className="text-cyan-200" />
                </div>
              </motion.div>
              <h2 className="font-display text-[21px] font-semibold tracking-tight text-white sm:text-[25px]">
                Ask anything. <span className="gradient-text">See everything.</span>
              </h2>
              <p className="mt-2 max-w-md text-[12px] leading-relaxed text-slate-500">
                Axiom reads your question, picks the right visual engine, and answers with a live
                graph, 3D scene, diagram or table.
              </p>

              <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                {EMPTY_SUGGESTIONS.map((suggestion, index) => (
                  <motion.button
                    key={suggestion.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * index + 0.1 }}
                    onClick={() => void send(suggestion.prompt)}
                    className="group flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.025] p-3 text-left transition hover:border-cyan-300/20 hover:bg-cyan-400/[.04]"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[.07] bg-white/[.035] text-[13px] text-cyan-300">
                      {suggestion.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11.5px] font-semibold text-slate-200">{suggestion.title}</span>
                      <span className="block truncate text-[10px] text-slate-500">{suggestion.prompt}</span>
                    </span>
                    <MessageSquarePlus size={13} className="ml-auto shrink-0 text-slate-600 transition group-hover:text-cyan-300" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-5 py-5">
            {session.messages.map((message) => (
              <MessageBlock
                key={message.id}
                message={message}
                copied={copiedId === message.id}
                onCopy={() => copyMessage(message)}
                onRegenerate={() => regenerate(message)}
                onFollowUp={(text) => void send(text)}
                onArtifactChange={(artifactId, config) => updateArtifact(message.id, artifactId, config)}
                busy={busy}
              />
            ))}

            <AnimatePresence>
              {thinking && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-start gap-3"
                >
                  <AxiomAvatar />
                  <div className="glass flex items-center gap-3 rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          className="h-1.5 w-1.5 rounded-full bg-cyan-300"
                          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
                          transition={{ duration: 1.1, repeat: Infinity, delay: dot * 0.18 }}
                        />
                      ))}
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={thinkingStage}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        className="text-[11.5px] text-slate-400"
                      >
                        {THINKING_STAGES[thinkingStage]}…
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} className="h-1" />
          </div>
        </div>
      </div>

      {/* composer */}
      <div className="shrink-0 border-t border-white/[.05] bg-gradient-to-t from-[#05080f] via-[#05080f]/92 to-transparent px-4 pb-3 pt-3 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <ChatComposer
            onSend={(value) => void send(value)}
            busy={busy}
            onStop={() => {
              abortRef.current?.abort();
              setBusy(false);
              setThinking(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function AxiomAvatar() {
  return (
    <span className="relative mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/20 via-sky-400/10 to-violet-500/20 shadow-[0_0_24px_-8px_rgba(34,211,238,.5)]">
      <Sparkles size={14} className="text-cyan-200" />
    </span>
  );
}

function MessageBlock({
  message,
  copied,
  busy,
  onCopy,
  onRegenerate,
  onFollowUp,
  onArtifactChange,
}: {
  message: ChatMessage;
  copied: boolean;
  busy: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  onFollowUp: (text: string) => void;
  onArtifactChange: (artifactId: string, config: SceneConfig) => void;
}) {
  if (message.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[86%] rounded-2xl rounded-tr-md border border-white/[.08] bg-gradient-to-br from-white/[.075] to-white/[.03] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] sm:max-w-[70%]">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-100">{message.content}</p>
          <p className="mt-1 text-right text-[9px] text-slate-500">{formatTime(message.createdAt)}</p>
        </div>
      </motion.div>
    );
  }

  const artifacts = message.artifacts ?? [];
  const gridArtifacts = artifacts.length > 1 && artifacts.every((a) => a.type === "graph" || a.type === "scientific");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex items-start gap-3">
      <AxiomAvatar />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[11.5px] font-semibold text-slate-200">Axiom</span>
          <span className="rounded-full border border-white/[.07] bg-white/[.03] px-1.5 py-px text-[8.5px] font-medium uppercase tracking-wider text-slate-500">
            {message.meta?.source === "llm" ? message.meta.model ?? "LLM" : "Local engine"}
          </span>
          <span className="text-[9.5px] text-slate-600">{formatTime(message.createdAt)}</span>
          {message.meta?.latency ? (
            <span className="text-[9px] text-slate-700">· {(message.meta.latency / 1000).toFixed(1)}s</span>
          ) : null}
        </div>

        <div className="glass relative rounded-2xl rounded-tl-md px-4 py-3.5 sm:px-5">
          <Markdown content={message.content} />
        </div>

        {artifacts.length > 0 && (
          <div className={cn("mt-3 grid gap-3", gridArtifacts && "xl:grid-cols-2")}>
            {artifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                onSceneChange={(config) => onArtifactChange(artifact.id, config)}
              />
            ))}
          </div>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-medium text-slate-500 transition hover:bg-white/[.05] hover:text-slate-200"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={10.5} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-medium text-slate-500 transition hover:bg-white/[.05] hover:text-slate-200 disabled:opacity-40"
          >
            <RefreshCw size={10.5} /> Regenerate
          </button>
          {message.followUps && message.followUps.length > 0 && (
            <div className="flex w-full flex-wrap gap-1.5 pt-1.5">
              {message.followUps.map((followUp) => (
                <button
                  key={followUp}
                  type="button"
                  onClick={() => onFollowUp(followUp)}
                  disabled={busy}
                  className="group flex items-center gap-1.5 rounded-full border border-white/[.07] bg-white/[.025] px-2.5 py-1 text-[10px] font-medium text-slate-400 transition hover:border-cyan-300/25 hover:bg-cyan-400/[.05] hover:text-cyan-100 disabled:opacity-40"
                >
                  <Sparkles size={8.5} className="text-slate-600 transition group-hover:text-cyan-300" />
                  {followUp}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import {
  Check,
  CircleUser,
  Database,
  Download,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { clearSessions, loadSessions } from "@/lib/sessions";
import {
  DEFAULT_SETTINGS,
  EXAM_LABELS,
  applySettings,
  loadSettings,
  saveSettings,
  type AccentTheme,
  type ExamFocus,
  type Settings,
} from "@/lib/settings";
import { cn } from "@/lib/utils";

const ACCENTS: { id: AccentTheme; label: string; color: string }[] = [
  { id: "cyan", label: "Cyan", color: "#22d3ee" },
  { id: "violet", label: "Violet", color: "#a78bfa" },
  { id: "emerald", label: "Emerald", color: "#34d399" },
];

const PROVIDERS = [
  { id: "local", label: "Built-in engine", hint: "Offline · no key required" },
  { id: "openai", label: "OpenAI", hint: "api.openai.com" },
  { id: "openrouter", label: "OpenRouter", hint: "many models, one key" },
  { id: "groq", label: "Groq", hint: "very fast inference" },
  { id: "custom", label: "Custom", hint: "any OpenAI-compatible API" },
] as const;

function Section({
  icon: Icon,
  title,
  description,
  children,
  tone = "cyan",
}: {
  icon: typeof Palette;
  title: string;
  description: string;
  children: React.ReactNode;
  tone?: "cyan" | "violet" | "emerald" | "amber";
}) {
  const tones = {
    cyan: "text-cyan-300 border-cyan-300/20 bg-cyan-400/10",
    violet: "text-violet-300 border-violet-300/20 bg-violet-400/10",
    emerald: "text-emerald-300 border-emerald-300/20 bg-emerald-400/10",
    amber: "text-amber-300 border-amber-300/20 bg-amber-400/10",
  };
  return (
    <section className="glass-panel overflow-hidden">
      <div className="flex items-start gap-3 border-b border-white/[.06] p-4 sm:p-5">
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl border", tones[tone])}>
          <Icon size={16} />
        </span>
        <div>
          <h2 className="font-display text-[14px] font-semibold text-white">{title}</h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function SettingsScreen() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (patch.accent && patch.accent !== prev.accent) {
        applySettings({ accent: patch.accent, reduceMotion: next.reduceMotion });
      }
      return next;
    });
    setSaveState("idle");
  };

  const updateEngine = (patch: Partial<Settings["engine"]>) => {
    setSettings((prev) => ({ ...prev, engine: { ...prev.engine, ...patch } }));
    setTestStatus("idle");
    setSaveState("idle");
  };

  const save = () => {
    saveSettings(settings);
    applySettings({ accent: settings.accent, reduceMotion: settings.reduceMotion });
    toast("Settings saved to this device.", "success");
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  };

  const testConnection = async () => {
    if (settings.engine.provider === "local") {
      toast("The built-in engine is always available offline.", "info");
      return;
    }
    if (!settings.engine.apiKey) {
      toast("Add an API key first.", "error");
      return;
    }
    setTestStatus("testing");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Reply with the single word: ready",
          engine: settings.engine,
          context: { exam: settings.exam },
        }),
      });
      const data = (await response.json()) as { meta?: { source?: string } };
      if (data.meta?.source === "llm") {
        setTestStatus("ok");
        toast("LLM connection verified.", "success");
      } else {
        setTestStatus("fail");
        toast("Provider unreachable — falling back to the local engine. Check key, model and CORS settings.", "error");
      }
    } catch {
      setTestStatus("fail");
      toast("Test failed. Check your network and key.", "error");
    }
  };

  const exportData = () => {
    const sessions = loadSessions();
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), sessions }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `axiom-history-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${sessions.length} sessions.`, "success");
  };

  return (
    <div className="mx-auto max-w-[980px] px-4 pb-12 pt-5 sm:px-6 lg:px-9 lg:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">
            <span className="h-px w-4 bg-[rgb(var(--accent))]/60" /> Preferences
          </p>
          <h1 className="mt-1.5 font-display text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">
            Settings
          </h1>
          <p className="mt-1 text-[12px] text-slate-500">
            Personalise Axiom and optionally connect a language model for free-form explanations.
          </p>
        </div>
        <button type="button" onClick={save} className="btn-primary h-9 px-4 text-[11.5px]">
          {saveState === "saved" ? <Check size={13} /> : <Save size={13} />}
          {saveState === "saved" ? "Saved" : "Save changes"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Section icon={CircleUser} title="Study profile" description="Used to tag explanations for your exam." tone="cyan">
            <div className="flex flex-col gap-3.5">
              <label className="block">
                <span className="label">Display name</span>
                <input
                  value={settings.name}
                  onChange={(event) => update({ name: event.target.value.slice(0, 28) })}
                  placeholder="Your name (optional)"
                  className="field"
                />
              </label>
              <div>
                <span className="label">Exam focus</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["jee", "neet", "boards", "general"] as ExamFocus[]).map((exam) => (
                    <button
                      key={exam}
                      type="button"
                      onClick={() => update({ exam })}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-[10.5px] font-semibold transition",
                        settings.exam === exam
                          ? "border-cyan-300/35 bg-cyan-400/10 text-cyan-200"
                          : "border-white/[.06] bg-white/[.02] text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {EXAM_LABELS[exam]}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="label">Target year</span>
                <select
                  value={settings.targetYear}
                  onChange={(event) => update({ targetYear: event.target.value })}
                  className="field appearance-none"
                >
                  {["2026", "2027", "2028", "2029"].map((year) => (
                    <option key={year} value={year} className="bg-[#0b1220]">
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Section>

          <Section icon={Palette} title="Appearance" description="Accent, motion and contrast preferences." tone="violet">
            <div className="flex flex-col gap-4">
              <div>
                <span className="label">Accent colour</span>
                <div className="grid grid-cols-3 gap-2">
                  {ACCENTS.map((accent) => (
                    <button
                      key={accent.id}
                      type="button"
                      onClick={() => update({ accent: accent.id })}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-medium transition",
                        settings.accent === accent.id
                          ? "border-white/20 bg-white/[.06] text-white"
                          : "border-white/[.06] bg-white/[.02] text-slate-400 hover:border-white/15"
                      )}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ background: accent.color, boxShadow: `0 0 14px ${accent.color}99` }}
                      />
                      {accent.label}
                      {settings.accent === accent.id && <Check size={11} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11.5px] font-medium text-slate-200">Reduce motion</p>
                  <p className="text-[10px] text-slate-500">Disable ambient animations and auto-orbit.</p>
                </div>
                <Switch checked={settings.reduceMotion} onChange={(value) => update({ reduceMotion: value })} />
              </div>
            </div>
          </Section>

          <Section icon={Info} title="About Axiom" description="Build details and privacy stance." tone="amber">
            <div className="flex flex-col gap-2 text-[11px] text-slate-500">
              <div className="flex items-center justify-between border-b border-white/[.05] py-1.5">
                <span>Version</span>
                <span className="font-mono text-slate-300">2.0.0 · Next.js 15</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[.05] py-1.5">
                <span>Visual engines</span>
                <span className="text-slate-300">Canvas 2D · WebGL · Mermaid · SVG</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>Data storage</span>
                <span className="text-slate-300">local to this browser</span>
              </div>
              <p className="mt-1 leading-relaxed text-slate-600">
                Axiom is an independent study tool. If you connect an LLM key, prompts are sent to that
                provider through this app&apos;s server proxy. Without a key, everything runs offline.
              </p>
            </div>
          </Section>
        </div>

        <div className="flex flex-col gap-3">
          <Section
            icon={KeyRound}
            title="AI engine"
            description="The built-in engine renders core chapters instantly. Add an LLM key for unlimited free-form answers."
            tone="emerald"
          >
            <div className="flex flex-col gap-3.5">
              <div>
                <span className="label">Provider</span>
                <div className="flex flex-col gap-1.5">
                  {PROVIDERS.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => updateEngine({ provider: provider.id })}
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-3 py-2 text-left transition",
                        settings.engine.provider === provider.id
                          ? "border-emerald-300/30 bg-emerald-400/[.07]"
                          : "border-white/[.06] bg-white/[.02] hover:border-white/12"
                      )}
                    >
                      <span>
                        <span className={cn("block text-[11.5px] font-medium", settings.engine.provider === provider.id ? "text-emerald-100" : "text-slate-300")}>
                          {provider.label}
                        </span>
                        <span className="block text-[9.5px] text-slate-600">{provider.hint}</span>
                      </span>
                      {settings.engine.provider === provider.id && <Check size={12} className="text-emerald-300" />}
                    </button>
                  ))}
                </div>
              </div>

              {settings.engine.provider !== "local" && (
                <>
                  <label className="block">
                    <span className="label">Model</span>
                    <input
                      value={settings.engine.model}
                      onChange={(event) => updateEngine({ model: event.target.value })}
                      placeholder="gpt-4o-mini"
                      className="field font-mono text-[11.5px]"
                    />
                  </label>
                  {settings.engine.provider === "custom" && (
                    <label className="block">
                      <span className="label">Base URL</span>
                      <input
                        value={settings.engine.baseUrl ?? ""}
                        onChange={(event) => updateEngine({ baseUrl: event.target.value })}
                        placeholder="https://api.example.com/v1"
                        className="field font-mono text-[11.5px]"
                      />
                    </label>
                  )}
                  <label className="block">
                    <span className="label">API key</span>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        value={settings.engine.apiKey}
                        onChange={(event) => updateEngine({ apiKey: event.target.value })}
                        placeholder="sk-…"
                        autoComplete="off"
                        className="field pr-10 font-mono text-[11.5px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((value) => !value)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition hover:bg-white/[.06] hover:text-white"
                        aria-label={showKey ? "Hide API key" : "Show API key"}
                      >
                        {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[9.5px] leading-relaxed text-slate-600">
                      Stored only in this browser. Requests are proxied by the app server so provider keys
                      never appear in client network calls to third parties.
                    </p>
                  </label>
                  <button
                    type="button"
                    onClick={testConnection}
                    disabled={testStatus === "testing"}
                    className="btn-ghost w-full justify-center"
                  >
                    <Zap size={12} />
                    {testStatus === "testing"
                      ? "Testing…"
                      : testStatus === "ok"
                        ? "Connection verified"
                        : testStatus === "fail"
                          ? "Retry connection test"
                          : "Test connection"}
                  </button>
                </>
              )}

              <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <Sparkles size={10} className="text-emerald-300" /> Server-side alternative
                </p>
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
                  Deploying Axiom? Set <span className="font-mono text-slate-400">AI_PROVIDER</span>,{" "}
                  <span className="font-mono text-slate-400">AI_API_KEY</span> and{" "}
                  <span className="font-mono text-slate-400">AI_MODEL</span> environment variables and every student
                  gets the LLM without needing a key.
                </p>
              </div>
            </div>
          </Section>

          <Section icon={Database} title="Your data" description="Everything is stored locally. Export or clear it anytime." tone="violet">
            <div className="flex flex-col gap-2">
              <button type="button" onClick={exportData} className="btn-ghost w-full justify-start">
                <Download size={13} /> Export history as JSON
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="btn-ghost w-full justify-start hover:border-rose-400/25 hover:text-rose-300"
              >
                <Trash2 size={13} /> Clear all history
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettings(DEFAULT_SETTINGS);
                  saveSettings(DEFAULT_SETTINGS);
                  applySettings({ accent: DEFAULT_SETTINGS.accent, reduceMotion: false });
                  toast("Preferences reset to defaults.", "info");
                }}
                className="btn-ghost w-full justify-start"
              >
                <RotateCcw size={13} /> Reset preferences
              </button>
            </div>
          </Section>
        </div>
      </div>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear history?"
        subtitle="All saved chats and generated visuals will be removed from this browser."
        size="md"
      >
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => setConfirmClear(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-2 text-[12px] font-semibold text-rose-200 transition hover:bg-rose-500/25"
            onClick={() => {
              clearSessions();
              setConfirmClear(false);
              toast("History cleared.", "success");
            }}
          >
            <Trash2 size={13} /> Clear history
          </button>
        </div>
      </Modal>
    </div>
  );
}

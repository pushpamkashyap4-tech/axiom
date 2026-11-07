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
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  Sun,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { PROVIDERS, defaultModel, providerById } from "@/lib/providers";
import { clearSessions, loadSessions } from "@/lib/sessions";
import {
  DEFAULT_SETTINGS,
  EXAM_LABELS,
  applySettings,
  loadSettings,
  saveSettings,
  type AccentTheme,
  type ColorMode,
  type ExamFocus,
  type Settings,
} from "@/lib/settings";
import { cn } from "@/lib/utils";

const ACCENTS: { id: AccentTheme; label: string; color: string }[] = [
  { id: "cyan", label: "Cyan", color: "#22d3ee" },
  { id: "violet", label: "Violet", color: "#a78bfa" },
  { id: "emerald", label: "Emerald", color: "#34d399" },
];

const THEMES: { id: ColorMode; label: string; hint: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", hint: "Daylight surfaces", icon: Sun },
  { id: "dark", label: "Dark", hint: "Midnight glass", icon: Moon },
  { id: "system", label: "System", hint: "Follows your device", icon: Monitor },
];

function Section({
  icon: Icon,
  title,
  description,
  children,
  tone = "cyan",
  actions,
}: {
  icon: typeof Palette;
  title: string;
  description: string;
  children: React.ReactNode;
  tone?: "cyan" | "violet" | "emerald" | "amber";
  actions?: React.ReactNode;
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
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[14px] font-semibold text-white">{title}</h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{description}</p>
        </div>
        {actions}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function SettingsScreen() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showKey, setShowKey] = useState(false);
  const [customModel, setCustomModel] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const stored = loadSettings();
    setSettings(stored);
    const spec = providerById[stored.engine.provider];
    setCustomModel(Boolean(spec?.models.length) && !spec.models.some((m) => m.id === stored.engine.model));
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      // Theme and accent preview instantly so the choice is visible while choosing.
      if (patch.theme || patch.accent || patch.reduceMotion !== undefined) {
        applySettings({ accent: next.accent, reduceMotion: next.reduceMotion, theme: next.theme });
      }
      return next;
    });
    setSaveState("idle");
  };

  const updateEngine = (patch: Partial<Settings["engine"]>) => {
    setSettings((prev) => ({ ...prev, engine: { ...prev.engine, ...patch } }));
    setTestStatus("idle");
    setTestMessage("");
    setSaveState("idle");
  };

  const save = () => {
    saveSettings(settings);
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
    setTestMessage("");
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
      const data = (await response.json()) as { meta?: { source?: string; model?: string } };
      if (data.meta?.source === "llm") {
        setTestStatus("ok");
        setTestMessage(`Connected · ${data.meta.model ?? settings.engine.model}`);
        toast("Model connection verified.", "success");
      } else {
        setTestStatus("fail");
        setTestMessage("Provider did not answer — running on the local engine instead.");
        toast("Provider unreachable. Check the key and model id.", "error");
      }
    } catch {
      setTestStatus("fail");
      setTestMessage("Network error while reaching the provider.");
      toast("Test failed. Check your connection and key.", "error");
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

  const spec = providerById[settings.engine.provider];
  const modelIsListed = spec.models.some((model) => model.id === settings.engine.model);

  return (
    <div className="mx-auto max-w-[1020px] px-4 pb-12 pt-5 sm:px-6 lg:px-9 lg:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">
            <span className="h-px w-4 bg-[rgb(var(--accent))]/60" /> Preferences
          </p>
          <h1 className="mt-1.5 font-display text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">
            Settings
          </h1>
          <p className="mt-1 text-[12px] text-slate-500">
            Personalise Axiom and connect a language model for free-form explanations.
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
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Section>

          <Section icon={Palette} title="Appearance" description="Theme, accent and motion preferences." tone="violet">
            <div className="flex flex-col gap-4">
              {/* Theme — directly below the Appearance heading */}
              <div>
                <span className="label">Theme</span>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Colour theme">
                  {THEMES.map((theme) => {
                    const Icon = theme.icon;
                    const active = settings.theme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => update({ theme: theme.id })}
                        className={cn(
                          "group flex flex-col items-start gap-1.5 rounded-xl border p-2.5 text-left transition",
                          active
                            ? "border-[rgb(var(--accent))]/45 bg-[rgb(var(--accent))]/10"
                            : "border-white/[.07] bg-white/[.02] hover:border-white/20"
                        )}
                      >
                        <span className="flex w-full items-center justify-between">
                          <Icon size={15} className={active ? "accent-text" : "text-slate-400"} />
                          {active && <Check size={12} className="accent-text" />}
                        </span>
                        <span className={cn("text-[11.5px] font-semibold", active ? "text-white" : "text-slate-300")}>
                          {theme.label}
                        </span>
                        <span className="text-[9.5px] leading-tight text-slate-500">{theme.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

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
                <span className="font-mono text-slate-300">2.1.0 · Next.js 15</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[.05] py-1.5">
                <span>Visual engines</span>
                <span className="text-slate-300">Canvas 2D · WebGL · Mermaid · SVG</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[.05] py-1.5">
                <span>Graph library</span>
                <span className="text-slate-300">109 plots · 52 chapters</span>
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
            description="The built-in engine renders 109 exam plots instantly. Connect a model for unlimited free-form answers."
            tone="emerald"
          >
            <div className="flex flex-col gap-3.5">
              <div>
                <span className="label">Provider</span>
                <div className="flex flex-col gap-1.5">
                  {PROVIDERS.map((provider) => {
                    const active = settings.engine.provider === provider.id;
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => {
                          updateEngine({ provider: provider.id, model: defaultModel(provider.id) });
                          setCustomModel(false);
                        }}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition",
                          active
                            ? "border-emerald-300/30 bg-emerald-400/[.07]"
                            : "border-white/[.06] bg-white/[.02] hover:border-white/12"
                        )}
                      >
                        <span className="min-w-0">
                          <span
                            className={cn(
                              "block text-[11.5px] font-medium",
                              active ? "text-emerald-100" : "text-slate-300"
                            )}
                          >
                            {provider.label}
                          </span>
                          <span className="block truncate text-[9.5px] text-slate-600">{provider.hint}</span>
                        </span>
                        {active && <Check size={12} className="shrink-0 text-emerald-300" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {settings.engine.provider !== "local" && (
                <>
                  {spec.models.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="label mb-0">Model</span>
                        <button
                          type="button"
                          onClick={() => setCustomModel((value) => !value)}
                          className="text-[9.5px] font-medium text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
                        >
                          {customModel ? "choose from list" : "enter id manually"}
                        </button>
                      </div>
                      {customModel || !modelIsListed ? (
                        <input
                          value={settings.engine.model}
                          onChange={(event) => updateEngine({ model: event.target.value })}
                          placeholder={spec.models[0]?.id}
                          className="field mt-1.5 font-mono text-[11.5px]"
                        />
                      ) : (
                        <select
                          value={settings.engine.model}
                          onChange={(event) => updateEngine({ model: event.target.value })}
                          className="field mt-1.5 appearance-none text-[11.5px]"
                        >
                          {spec.models.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.label} — {model.id}
                            </option>
                          ))}
                        </select>
                      )}
                      <p className="mt-1 text-[9.5px] leading-relaxed text-slate-600">
                        {spec.models.find((model) => model.id === settings.engine.model)?.note ??
                          "Endpoint id must be one your key can access."}
                      </p>
                    </div>
                  )}

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
                        onChange={(event) => updateEngine({ apiKey: event.target.value.trim() })}
                        placeholder={spec.keyPrefix ? `${spec.keyPrefix}…` : "your API key"}
                        autoComplete="off"
                        spellCheck={false}
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
                      Kept in this browser only and sent through the app&apos;s own server proxy.{" "}
                      {spec.keyUrl && (
                        <a
                          href={spec.keyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="accent-text underline underline-offset-2"
                        >
                          Get a key →
                        </a>
                      )}
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
                  {testMessage && (
                    <p
                      className={cn(
                        "rounded-lg border px-2.5 py-2 text-[10px] leading-relaxed",
                        testStatus === "ok"
                          ? "border-emerald-400/25 bg-emerald-400/[.07] text-emerald-200"
                          : "border-rose-400/25 bg-rose-400/[.07] text-rose-200"
                      )}
                    >
                      {testMessage}
                    </p>
                  )}
                </>
              )}

              <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <Sparkles size={10} className="text-emerald-300" /> Server-side alternative
                </p>
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
                  Deploying Axiom? Set <span className="font-mono text-slate-400">AI_PROVIDER</span>,{" "}
                  <span className="font-mono text-slate-400">AI_API_KEY</span> and{" "}
                  <span className="font-mono text-slate-400">AI_MODEL</span> environment variables and every
                  student gets the model without needing their own key.
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
                  applySettings({
                    accent: DEFAULT_SETTINGS.accent,
                    reduceMotion: false,
                    theme: DEFAULT_SETTINGS.theme,
                  });
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

import type { AIConfig } from "./types";
import { readStored, writeStored } from "./storage";

export type AccentTheme = "cyan" | "violet" | "emerald";
export type ExamFocus = "jee" | "neet" | "boards" | "general";
export type ColorMode = "dark" | "light" | "system";

export type Settings = {
  name: string;
  exam: ExamFocus;
  targetYear: string;
  accent: AccentTheme;
  theme: ColorMode;
  reduceMotion: boolean;
  showGrid: boolean;
  engine: AIConfig;
};

export const DEFAULT_SETTINGS: Settings = {
  name: "",
  exam: "jee",
  targetYear: "2027",
  accent: "cyan",
  theme: "dark",
  reduceMotion: false,
  showGrid: true,
  engine: { provider: "local", apiKey: "", model: "gpt-oss-120b", baseUrl: "" },
};

const KEY = "axiom.settings.v1";
const EVENT = "axiom:settings";

const MODES: ColorMode[] = ["dark", "light", "system"];
const ACCENTS: AccentTheme[] = ["cyan", "violet", "emerald"];
const EXAMS: ExamFocus[] = ["jee", "neet", "boards", "general"];

export function loadSettings(): Settings {
  const stored = readStored<Partial<Settings>>(KEY, {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    // Never let a stale or hand-edited value blank out the UI.
    theme: MODES.includes(stored.theme as ColorMode) ? (stored.theme as ColorMode) : DEFAULT_SETTINGS.theme,
    accent: ACCENTS.includes(stored.accent as AccentTheme) ? (stored.accent as AccentTheme) : DEFAULT_SETTINGS.accent,
    exam: EXAMS.includes(stored.exam as ExamFocus) ? (stored.exam as ExamFocus) : DEFAULT_SETTINGS.exam,
    engine: { ...DEFAULT_SETTINGS.engine, ...(stored.engine ?? {}) },
  };
}

export function saveSettings(settings: Settings) {
  writeStored(KEY, settings);
  applySettings(settings);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT, { detail: settings }));
}

/** Resolve "system" against the OS preference. */
export function resolvedTheme(mode: ColorMode): "dark" | "light" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applySettings(settings: Pick<Settings, "accent" | "reduceMotion" | "theme">) {
  if (typeof document === "undefined") return;
  const theme = resolvedTheme(settings.theme ?? "dark");
  document.documentElement.dataset.accent = settings.accent;
  document.documentElement.dataset.reduceMotion = settings.reduceMotion ? "true" : "false";
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#f4f6fb" : "#05070c");
}

export function subscribeSettings(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => callback();
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export const EXAM_LABELS: Record<ExamFocus, string> = {
  jee: "JEE",
  neet: "NEET",
  boards: "Boards",
  general: "General",
};

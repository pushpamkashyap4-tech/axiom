import type { AIConfig } from "./types";
import { readStored, writeStored } from "./storage";

export type AccentTheme = "cyan" | "violet" | "emerald";
export type ExamFocus = "jee" | "neet" | "boards" | "general";

export type Settings = {
  name: string;
  exam: ExamFocus;
  targetYear: string;
  accent: AccentTheme;
  reduceMotion: boolean;
  showGrid: boolean;
  engine: AIConfig;
};

export const DEFAULT_SETTINGS: Settings = {
  name: "",
  exam: "jee",
  targetYear: "2027",
  accent: "cyan",
  reduceMotion: false,
  showGrid: true,
  engine: { provider: "local", apiKey: "", model: "gpt-4o-mini", baseUrl: "" },
};

const KEY = "axiom.settings.v1";
const EVENT = "axiom:settings";

export function loadSettings(): Settings {
  const stored = readStored<Partial<Settings>>(KEY, {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    engine: { ...DEFAULT_SETTINGS.engine, ...(stored.engine ?? {}) },
  };
}

export function saveSettings(settings: Settings) {
  writeStored(KEY, settings);
  applySettings(settings);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT, { detail: settings }));
}

export function applySettings(settings: Pick<Settings, "accent" | "reduceMotion">) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.accent = settings.accent;
  document.documentElement.dataset.reduceMotion = settings.reduceMotion ? "true" : "false";
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

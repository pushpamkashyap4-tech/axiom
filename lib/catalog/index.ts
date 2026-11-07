import { chemistryPlots } from "./chemistry";
import { corePresets } from "./core";
import { mathsPlots } from "./maths";
import { physicsPlots } from "./physics";
import type { SciPreset, SciSubject } from "./types";

export { C } from "./types";
export type { SciPreset, SciSubject } from "./types";

/** Every plot in the library, grouped by subject then chapter in the UI. */
export const sciPresets: SciPreset[] = [
  ...corePresets,
  ...mathsPlots,
  ...chemistryPlots,
  ...physicsPlots,
];

export const presetByKey: Record<string, SciPreset> = Object.fromEntries(
  sciPresets.map((preset) => [preset.key, preset])
);

export const SUBJECT_ORDER: SciSubject[] = ["Physics", "Chemistry", "Mathematics"];

export function presetsBySubject(subject: SciSubject) {
  return sciPresets.filter((preset) => preset.subject === subject);
}

/** Subject → chapter → plots, in a stable display order. */
export function catalogTree(subject?: SciSubject) {
  const source = subject ? presetsBySubject(subject) : sciPresets;
  const chapters = new Map<string, SciPreset[]>();
  for (const preset of source) {
    const bucket = chapters.get(preset.chapter) ?? [];
    bucket.push(preset);
    chapters.set(preset.chapter, bucket);
  }
  return [...chapters.entries()].map(([chapter, plots]) => ({
    chapter,
    subject: plots[0].subject,
    plots,
  }));
}

const normalized = sciPresets.map((preset) => ({
  preset,
  haystack: [preset.title, preset.chapter, preset.blurb, preset.insight, preset.subject, ...(preset.keywords ?? [])]
    .join(" ")
    .toLowerCase(),
}));

export function searchPresets(query: string, subject?: SciSubject) {
  const q = query.trim().toLowerCase();
  const base = subject ? presetsBySubject(subject) : sciPresets;
  if (!q) return base;
  const terms = q.split(/\s+/).filter(Boolean);
  return normalized
    .filter((entry) => !subject || entry.preset.subject === subject)
    .map((entry) => ({
      preset: entry.preset,
      score: terms.reduce((total, term) => (entry.haystack.includes(term) ? total + 1 : total), 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.preset);
}

export const catalogStats = {
  total: sciPresets.length,
  bySubject: SUBJECT_ORDER.reduce<Record<string, number>>((acc, subject) => {
    acc[subject] = sciPresets.filter((preset) => preset.subject === subject).length;
    return acc;
  }, {}),
  chapters: new Set(sciPresets.map((preset) => preset.chapter)).size,
};

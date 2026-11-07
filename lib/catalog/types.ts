import type { PlotMarker, PlotParam, PlotSeries } from "../types";

export type SciSubject = "Physics" | "Chemistry" | "Mathematics";

export type SciPreset = {
  key: string;
  title: string;
  subject: SciSubject;
  chapter: string;
  blurb: string;
  xLabel: string;
  yLabel: string;
  xRange: [number, number];
  yRange?: [number, number];
  series: PlotSeries[];
  markers?: PlotMarker[];
  params?: PlotParam[];
  animate?: boolean;
  insight: string;
  exam?: string;
  /** Extra search terms so natural-language prompts resolve here. */
  keywords?: string[];
};

export const C = {
  cyan: "#22d3ee",
  violet: "#a78bfa",
  emerald: "#34d399",
  amber: "#fbbf24",
  rose: "#fb7185",
  sky: "#38bdf8",
  lime: "#a3e635",
  orange: "#fb923c",
  slate: "#64748b",
};

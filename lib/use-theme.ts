"use client";

import { useEffect, useState } from "react";
import { loadSettings, resolvedTheme, subscribeSettings } from "./settings";

/** Live resolved colour mode (never returns "system"). */
export function useColorMode(): "dark" | "light" {
  const [mode, setMode] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const sync = () => setMode(resolvedTheme(loadSettings().theme));
    sync();
    const unsubscribe = subscribeSettings(sync);
    const media = window.matchMedia?.("(prefers-color-scheme: light)");
    media?.addEventListener?.("change", sync);
    return () => {
      unsubscribe();
      media?.removeEventListener?.("change", sync);
    };
  }, []);

  return mode;
}

/** Chart ink for the active theme. */
export function plotPalette(mode: "dark" | "light") {
  return mode === "light"
    ? {
        grid: "rgba(15,23,42,0.09)",
        gridMinor: "rgba(15,23,42,0.035)",
        axis: "rgba(15,23,42,0.28)",
        tick: "rgba(51,65,85,0.9)",
        label: "rgba(15,23,42,0.75)",
        chipBg: "rgba(255,255,255,0.94)",
        chipText: "rgba(15,23,42,0.9)",
        zeroLine: "rgba(15,23,42,0.22)",
      }
    : {
        grid: "rgba(148,163,184,0.13)",
        gridMinor: "rgba(148,163,184,0.05)",
        axis: "rgba(148,163,184,0.32)",
        tick: "rgba(148,163,184,0.78)",
        label: "rgba(148,163,184,0.85)",
        chipBg: "rgba(6,10,18,0.82)",
        chipText: "rgba(226,232,240,0.95)",
        zeroLine: "rgba(148,163,184,0.3)",
      };
}

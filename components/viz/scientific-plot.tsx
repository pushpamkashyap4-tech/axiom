"use client";

import { useMemo } from "react";
import { presetByKey } from "@/lib/presets";
import type { ScientificArtifact } from "@/lib/types";
import { GraphCanvas } from "./graph-canvas";

export function ScientificPlot({
  artifact,
  compact,
  onExpand,
}: {
  artifact: ScientificArtifact;
  compact?: boolean;
  onExpand?: () => void;
}) {
  const preset = presetByKey[artifact.preset];

  const series = useMemo(() => {
    if (!preset) return [];
    return preset.series;
  }, [preset]);

  if (!preset) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-[11px] text-slate-500">
        This preset is not available in the local library.
      </div>
    );
  }

  return (
    <GraphCanvas
      series={series}
      xRange={preset.xRange}
      yRange={preset.yRange}
      xLabel={preset.xLabel}
      yLabel={preset.yLabel}
      markers={preset.markers}
      params={preset.params}
      animate={preset.animate}
      autoPlay={Boolean(preset.animate)}
      compact={compact}
      onExpand={onExpand}
    />
  );
}

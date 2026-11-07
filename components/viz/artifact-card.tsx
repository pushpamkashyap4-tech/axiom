"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  ChevronsUpDown,
  FlaskConical,
  Lightbulb,
  LineChart,
  Maximize2,
  Shapes,
  Sparkles,
  X,
  Workflow,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { MermaidBlock } from "./mermaid-block";
import { PatternSvg } from "./pattern-svg";
import { ScientificPlot } from "./scientific-plot";
import { GraphCanvas } from "./graph-canvas";
import { presetByKey } from "@/lib/presets";
import type { Artifact, SceneConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

const SceneCanvas = dynamic(() => import("./scene-canvas").then((mod) => mod.SceneCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <span className="h-3 w-3 animate-spin rounded-full border border-slate-600 border-t-violet-400" />
        Preparing 3D engine…
      </div>
    </div>
  ),
});

const SceneLegend = dynamic(() => import("./scene-canvas").then((mod) => mod.SceneLegend), {
  ssr: false,
  loading: () => null,
});

const TYPE_META: Record<
  Artifact["type"],
  { label: string; icon: typeof LineChart; tone: string; ring: string }
> = {
  graph: { label: "2D Graph", icon: LineChart, tone: "text-cyan-300", ring: "border-cyan-400/20 bg-cyan-400/10" },
  scientific: { label: "Scientific Plot", icon: FlaskConical, tone: "text-emerald-300", ring: "border-emerald-400/20 bg-emerald-400/10" },
  scene3d: { label: "3D Scene", icon: Boxes, tone: "text-violet-300", ring: "border-violet-400/20 bg-violet-400/10" },
  mermaid: { label: "Diagram", icon: Workflow, tone: "text-amber-300", ring: "border-amber-400/20 bg-amber-400/10" },
  geometry: { label: "Geometry", icon: Shapes, tone: "text-rose-300", ring: "border-rose-400/20 bg-rose-400/10" },
};

function Body({
  artifact,
  compact,
  expanded,
  onExpand,
  onSceneChange,
}: {
  artifact: Artifact;
  compact?: boolean;
  expanded?: boolean;
  onExpand?: () => void;
  onSceneChange?: (config: SceneConfig) => void;
}) {
  if (artifact.type === "graph") {
    return (
      <GraphCanvas
        series={artifact.expressions}
        xRange={artifact.xRange}
        yRange={artifact.yRange}
        xLabel={artifact.xLabel}
        yLabel={artifact.yLabel}
        markers={artifact.markers}
        animate={artifact.animate}
        autoPlay={artifact.animate}
        compact={compact && !expanded}
        onExpand={onExpand}
      />
    );
  }
  if (artifact.type === "scientific") {
    return <ScientificPlot artifact={artifact} compact={compact && !expanded} onExpand={onExpand} />;
  }
  if (artifact.type === "scene3d") {
    return (
      <SceneCanvas
        config={artifact.config}
        compact={compact && !expanded}
        onChange={onSceneChange}
      />
    );
  }
  if (artifact.type === "mermaid") {
    return <MermaidBlock code={artifact.code} />;
  }
  return <PatternSvg pattern={artifact.pattern} />;
}

export function ArtifactCard({
  artifact,
  compact = true,
  onSceneChange,
  onDismiss,
}: {
  artifact: Artifact;
  compact?: boolean;
  onSceneChange?: (config: SceneConfig) => void;
  onDismiss?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const meta = TYPE_META[artifact.type];
  const Icon = meta.icon;
  const [config, setConfig] = useState<SceneConfig | null>(
    artifact.type === "scene3d" ? artifact.config : null
  );
  const { toast } = useToast();
  const [canvasError, setCanvasError] = useState<string | null>(null);

  useEffect(() => {
    if (artifact.type === "scene3d") setConfig(artifact.config);
  }, [artifact]);

  const preset = artifact.type === "scientific" ? presetByKey[artifact.preset] : undefined;

  const heights: Record<Artifact["type"], string> = {
    graph: compact ? "h-[290px] sm:h-[320px]" : "h-[440px]",
    scientific: compact ? "h-[290px] sm:h-[320px]" : "h-[460px]",
    scene3d: compact ? "h-[330px] sm:h-[360px]" : "h-[520px]",
    mermaid: "",
    geometry: compact ? "h-[260px]" : "h-[420px]",
  };

  const handleSceneChange = (next: SceneConfig) => {
    setConfig(next);
    onSceneChange?.(next);
  };

  const shownConfig = artifact.type === "scene3d" ? config ?? artifact.config : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className="glass group/artifact overflow-hidden rounded-2xl"
      >
        <div className="flex items-center gap-2.5 border-b border-white/[.06] px-3.5 py-2.5">
          <span className={cn("flex h-6 w-6 items-center justify-center rounded-lg border", meta.ring, meta.tone)}>
            <Icon size={12.5} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[12.5px] font-semibold text-slate-100">{artifact.title}</p>
            </div>
            <p className="truncate text-[10px] uppercase tracking-[0.14em] text-slate-500">
              {meta.label}
              {preset ? ` · ${preset.subject} · ${preset.chapter}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[.06] hover:text-white"
              aria-label="Expand visualization"
            >
              <Maximize2 size={12.5} />
            </button>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"
                aria-label="Remove visualization"
              >
                <X size={12.5} />
              </button>
            )}
          </div>
        </div>

        <div
          className={cn(
            "relative w-full",
            heights[artifact.type],
            artifact.type === "mermaid" && "max-h-[420px] overflow-y-auto bg-[#070b12]/40"
          )}
        >
          {artifact.type === "scene3d" && shownConfig ? (
            <SceneCanvas
              config={shownConfig}
              compact={compact}
              onChange={handleSceneChange}
            />
          ) : artifact.type === "graph" ? (
            <GraphCanvas
              series={artifact.expressions}
              xRange={artifact.xRange}
              yRange={artifact.yRange}
              xLabel={artifact.xLabel}
              yLabel={artifact.yLabel}
              markers={artifact.markers}
              animate={artifact.animate}
              autoPlay={artifact.animate}
              compact={compact}
              onExpand={() => setOpen(true)}
              onError={(message) => {
                setCanvasError(message);
                if (message) toast(message, "error");
              }}
            />
          ) : artifact.type === "scientific" ? (
            <ScientificPlot artifact={artifact} compact={compact} onExpand={() => setOpen(true)} />
          ) : (
            <Body artifact={artifact} compact={compact} onExpand={() => setOpen(true)} />
          )}
        </div>

        {(artifact.caption || (preset && preset.exam) || artifact.type === "scene3d") && (
          <div className="flex flex-col gap-2 border-t border-white/[.06] px-3.5 py-2.5">
            {artifact.type === "scene3d" && shownConfig && (
              <SceneLegend type={shownConfig.type} />
            )}
            {artifact.caption && (
              <div className="flex items-start gap-2">
                <Lightbulb size={11.5} className="mt-0.5 shrink-0 text-amber-300/70" />
                <p className="text-[10.5px] leading-relaxed text-slate-500">{artifact.caption}</p>
              </div>
            )}
            {preset?.exam && (
              <span className="badge badge-accent w-fit">
                <Sparkles size={9} /> {preset.exam}
              </span>
            )}
          </div>
        )}
      </motion.div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={artifact.title}
        subtitle={artifact.description ?? preset?.blurb}
        size="xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              {preset ? preset.insight : artifact.caption ?? "Interactive visual — everything updates live."}
            </p>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              <ChevronsUpDown size={12} /> Close
            </button>
          </div>
        }
      >
        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-white/[.07] bg-[#060a12]/40",
            artifact.type === "mermaid" ? "max-h-[62vh]" : "h-[52vh] min-h-[320px] sm:h-[58vh]"
          )}
        >
          {artifact.type === "scene3d" && shownConfig ? (
            <SceneCanvas config={shownConfig} onChange={handleSceneChange} />
          ) : (
            <Body
              artifact={artifact}
              expanded
              onSceneChange={handleSceneChange}
              onExpand={() => setOpen(false)}
            />
          )}
        </div>
        {canvasError && (
          <p className="mt-2 text-[11px] text-rose-300/80">Fix the expression: {canvasError}</p>
        )}
      </Modal>

      <AnimatePresence />
    </>
  );
}

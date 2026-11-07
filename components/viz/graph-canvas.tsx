"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Maximize2, Minimize2, Pause, Play, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { compile, type EvalFunction } from "mathjs";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn, prettifyNumber } from "@/lib/utils";
import { plotPalette, useColorMode } from "@/lib/use-theme";
import type { PlotMarker, PlotParam, PlotSeries } from "@/lib/types";

type View = { x0: number; x1: number; y0: number; y1: number };

type SamplePoint = { x: number; y: number };

type SeriesSamples = {
  series: PlotSeries;
  color: string;
  segments: SamplePoint[][];
  error?: string;
};

type HoverState = {
  px: number;
  py: number;
  x: number;
  y: number;
  values: { label: string; value: number; color: string }[];
};

export type GraphCanvasProps = {
  series: PlotSeries[];
  xRange?: [number, number];
  yRange?: [number, number];
  xLabel?: string;
  yLabel?: string;
  markers?: PlotMarker[];
  params?: PlotParam[];
  animate?: boolean;
  autoPlay?: boolean;
  compact?: boolean;
  className?: string;
  onError?: (message: string | null) => void;
  onExpand?: () => void;
  onViewChange?: (view: View) => void;
};

const COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#fb7185", "#38bdf8"];

function niceStep(span: number, targetPx: number, pxPerUnit: number) {
  const raw = span / Math.max(2, targetPx / pxPerUnit);
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const fraction = raw / power;
  const nice = fraction >= 5 ? 5 : fraction >= 2 ? 2 : 1;
  return nice * power;
}

function formatTick(value: number, step: number) {
  if (Math.abs(value) < step / 1000) return "0";
  if (Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001)) {
    return value.toExponential(1);
  }
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  return Number(value.toFixed(Math.min(decimals + 1, 4))).toString();
}

export function GraphCanvas({
  series,
  xRange = [-10, 10],
  yRange,
  xLabel,
  yLabel,
  markers,
  params,
  animate = false,
  autoPlay = false,
  compact = false,
  className,
  onError,
  onExpand,
  onViewChange,
}: GraphCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ x0: xRange[0], x1: xRange[1], y0: -10, y1: 10 });
  const [hover, setHover] = useState<HoverState | null>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [t, setT] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, number>>(() =>
    Object.fromEntries((params ?? []).map((param) => [param.key, param.value]))
  );
  const [showParams, setShowParams] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = wrapRef.current?.parentElement;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      // ignore unsupported environments
    }
  };
  const [ready, setReady] = useState(false);
  const dragRef = useRef<{ active: boolean; moved: boolean; sx: number; sy: number; view: View } | null>(null);
  const pinchRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{ dist: number; view: View; cx: number; cy: number } | null>(null);
  const animRef = useRef<number | null>(null);
  const seriesSignature = useMemo(() => JSON.stringify(series.map((s) => [s.expression, s.yExpression, s.mode])), [series]);
  const colorMode = useColorMode();
  const palette = useMemo(() => plotPalette(colorMode), [colorMode]);

  useEffect(() => {
    setParamValues(Object.fromEntries((params ?? []).map((param) => [param.key, param.value])));
  }, [params]);

  /* ------------------------- compiled expressions ------------------------ */
  const compiled = useMemo(() => {
    return series.map((item) => {
      try {
        const fn: EvalFunction = compile(item.expression);
        const fy: EvalFunction | null =
          item.mode === "parametric" ? compile(item.yExpression ?? item.expression) : null;
        return { item, fn, fy, error: null as string | null };
      } catch (err) {
        return { item, fn: null, fy: null, error: err instanceof Error ? err.message : "Invalid expression" };
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesSignature]);

  useEffect(() => {
    const compileError = compiled.find((entry) => entry.error);
    const message = compileError ? `${compileError.item.expression}: ${compileError.error}` : null;
    setError(message);
    onError?.(message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compiled]);

  /* ------------------------------- sizing -------------------------------- */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setSize({ w: rect.width, h: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /** Even sweep of a parametric curve, in the same scope used for drawing. */
  const paramPoints = useCallback(
    (item: PlotSeries, count = 240) => {
      if (item.mode !== "parametric") return [] as { x: number; y: number }[];
      try {
        const fx = compile(item.expression);
        const fy = compile(item.yExpression ?? item.expression);
        const [ta, tb] = item.tRange ?? [0, Math.PI * 2];
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i <= count; i++) {
          const tv = ta + ((tb - ta) * i) / count;
          const scope = { pi: Math.PI, e: Math.E, tau: Math.PI * 2, t: tv, ...paramValues };
          const x = Number(fx.evaluate(scope));
          const y = Number(fy.evaluate(scope));
          if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
        }
        return points;
      } catch {
        return [];
      }
    },
    [paramValues]
  );

  const scopeBase = useMemo(
    () => ({ pi: Math.PI, e: Math.E, tau: Math.PI * 2, ...paramValues }),
    [paramValues]
  );

  /* ------------------------------- sampling ------------------------------ */
  const sampleView = useCallback(
    (targetView: View, time: number, pixelWidth: number): SeriesSamples[] => {
      const count = Math.max(240, Math.min(1200, Math.floor(pixelWidth * (playing ? 0.7 : 1.2))));
      const span = targetView.y1 - targetView.y0;

      return compiled.map(({ item, fn, fy }, index) => {
        const color = item.color ?? COLORS[index % COLORS.length];
        if (!fn) return { series: item, color, segments: [], error: "Could not parse expression" };

        const segments: SamplePoint[][] = [];
        let current: SamplePoint[] = [];
        let evaluationError: string | undefined;

        const push = (x: number, y: number, prev?: SamplePoint) => {
          if (!Number.isFinite(y) || !Number.isFinite(x)) {
            if (current.length) {
              segments.push(current);
              current = [];
            }
            return;
          }
          const bigJump = prev ? Math.abs(y - prev.y) > span * 6 : false;
          const asymptote = prev ? bigJump && Math.sign(prev.y) !== Math.sign(y) : false;
          const stepJump = prev && item.jumps ? Math.abs(y - prev.y) > span * 0.4 : false;
          if (asymptote || stepJump) {
            if (current.length) segments.push(current);
            current = [];
          }
          current.push({ x, y });
        };

        try {
          if (item.mode === "parametric") {
            const [ta, tb] = item.tRange ?? [0, Math.PI * 2];
            let prev: SamplePoint | undefined;
            for (let i = 0; i <= count; i++) {
              const tv = ta + ((tb - ta) * i) / count;
              const scope = { ...scopeBase, t: tv };
              const x = Number(fn.evaluate(scope));
              const y = Number(fy!.evaluate(scope));
              push(x, y, prev);
              if (Number.isFinite(x) && Number.isFinite(y)) prev = { x, y };
            }
          } else {
            const [da, db] = item.domain ?? [targetView.x0, targetView.x1];
            const start = Math.max(da, targetView.x0);
            const end = Math.min(db, targetView.x1);
            if (end > start) {
              let prev: SamplePoint | undefined;
              for (let i = 0; i <= count; i++) {
                const x = start + ((end - start) * i) / count;
                const y = Number(fn.evaluate({ ...scopeBase, x, t: time }));
                push(x, y, prev);
                if (Number.isFinite(y)) prev = { x, y };
              }
            }
          }
        } catch (err) {
          evaluationError = err instanceof Error ? err.message.replace(/^Error:\s*/, "") : "Evaluation failed";
        }

        if (current.length) segments.push(current);
        return { series: item, color, segments, error: evaluationError };
      });
    },
    [compiled, playing, scopeBase]
  );

  const autoY = useCallback(
    (targetView: View) => {
      const sampled = sampleView({ ...targetView, y0: -1e9, y1: 1e9 }, t, Math.max(size.w, 400));
      const values: number[] = [];
      for (const group of sampled) {
        for (const segment of group.segments) {
          for (const point of segment) {
            if (point.x >= targetView.x0 && point.x <= targetView.x1 && Math.abs(point.y) < 1e6) {
              values.push(point.y);
            }
          }
        }
        if (group.series.mode === "parametric") {
          for (const point of group.segments.flat()) values.push(point.y);
        }
      }
      if (!values.length) return { y0: -10, y1: 10 };
      values.sort((a, b) => a - b);
      const lo = values[Math.floor(values.length * 0.01)];
      const hi = values[Math.floor(values.length * 0.99)];
      let y0 = Math.min(lo, 0);
      let y1 = Math.max(hi, 0);
      if (y1 - y0 < 0.5) {
        y0 -= 1;
        y1 += 1;
      }
      const pad = (y1 - y0) * 0.12;
      return { y0: y0 - pad, y1: y1 + pad };
    },
    [sampleView, size.w, t]
  );

  const resetView = useCallback(() => {
    const base: View = {
      x0: xRange[0],
      x1: xRange[1],
      y0: yRange?.[0] ?? -10,
      y1: yRange?.[1] ?? 10,
    };

    // Parametric curves describe their own extent — fit the box around them.
    const swept = series.flatMap((item) => paramPoints(item));
    if (swept.length > 8) {
      const xs = swept.map((point) => point.x);
      const ys = swept.map((point) => point.y);
      const padX = (Math.max(...xs) - Math.min(...xs)) * 0.1 || 1;
      const padY = (Math.max(...ys) - Math.min(...ys)) * 0.1 || 1;
      const fitted: View = {
        x0: Math.min(...xs) - padX,
        x1: Math.max(...xs) + padX,
        y0: Math.min(...ys) - padY,
        y1: Math.max(...ys) + padY,
      };
      setView(fitted);
      onViewChange?.(fitted);
      return;
    }

    const resolved = yRange ? base : { ...base, ...autoY(base) };
    setView(resolved);
    onViewChange?.(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xRange, yRange, autoY, paramPoints]);

  const initialised = useRef(false);
  useEffect(() => {
    if (initialised.current && size.w === 0) return;
    initialised.current = true;
    resetView();
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesSignature, xRange?.[0], xRange?.[1], yRange?.[0], yRange?.[1], size.w > 0]);

  /* ------------------------------ animation ------------------------------ */
  useEffect(() => {
    if (!playing || !animate) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setT((prev) => (prev + dt * 1.7) % (Math.PI * 200));
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [playing, animate]);

  /* -------------------------------- drawing ------------------------------ */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w < 10 || size.h < 10) return;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.floor(size.w * dpr);
    canvas.height = Math.floor(size.h * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    const { w, h } = size;
    const { x0, x1, y0, y1 } = view;
    const xSpan = x1 - x0;
    const ySpan = y1 - y0;
    if (xSpan <= 0 || ySpan <= 0) return;

    const sx = (x: number) => ((x - x0) / xSpan) * w;
    const sy = (y: number) => h - ((y - y0) / ySpan) * h;

    // Grid
    const stepX = niceStep(xSpan, Math.max(64, Math.min(104, w / 6.5)), w / xSpan);
    const stepY = niceStep(ySpan, Math.max(46, Math.min(64, h / 5)), h / ySpan);
    ctx.lineWidth = 1;

    ctx.strokeStyle = palette.grid;
    ctx.beginPath();
    for (let x = Math.ceil(x0 / stepX) * stepX; x <= x1; x += stepX) {
      const px = Math.round(sx(x)) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
    }
    for (let y = Math.ceil(y0 / stepY) * stepY; y <= y1; y += stepY) {
      const py = Math.round(sy(y)) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
    }
    ctx.stroke();

    // Minor subdivisions
    ctx.strokeStyle = palette.gridMinor;
    ctx.beginPath();
    for (let x = Math.ceil(x0 / (stepX / 5)) * (stepX / 5); x <= x1; x += stepX / 5) {
      const px = Math.round(sx(x)) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
    }
    for (let y = Math.ceil(y0 / (stepY / 5)) * (stepY / 5); y <= y1; y += stepY / 5) {
      const py = Math.round(sy(y)) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
    }
    ctx.stroke();

    // Axes
    const axisY = sy(Math.min(Math.max(0, y0), y1));
    const axisX = sx(Math.min(Math.max(0, x0), x1));
    ctx.strokeStyle = palette.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (0 >= y0 && 0 <= y1) {
      ctx.moveTo(0, Math.round(axisY) + 0.5);
      ctx.lineTo(w, Math.round(axisY) + 0.5);
    }
    if (0 >= x0 && 0 <= x1) {
      ctx.moveTo(Math.round(axisX) + 0.5, 0);
      ctx.lineTo(Math.round(axisX) + 0.5, h);
    }
    ctx.stroke();

    // Tick labels
    ctx.fillStyle = palette.tick;
    ctx.font = "10px 'Plus Jakarta Sans Variable', ui-sans-serif, system-ui";
    ctx.textBaseline = "middle";
    const labelY = 0 >= y0 && 0 <= y1 ? Math.min(h - 10, Math.max(12, axisY)) : h - 10;
    const labelX = 0 >= x0 && 0 <= x1 ? Math.min(w - 12, Math.max(18, axisX)) : 18;
    ctx.textAlign = "center";
    for (let x = Math.ceil(x0 / stepX) * stepX; x <= x1; x += stepX) {
      if (Math.abs(x) < stepX / 1000) continue;
      const px = sx(x);
      if (px < 20 || px > w - 20) continue;
      ctx.fillText(formatTick(x, stepX), px, labelY + (labelY > h - 30 ? -10 : 12));
    }
    ctx.textAlign = "left";
    for (let y = Math.ceil(y0 / stepY) * stepY; y <= y1; y += stepY) {
      if (Math.abs(y) < stepY / 1000) continue;
      const py = sy(y);
      if (py < 10 || py > h - 10) continue;
      ctx.fillText(formatTick(y, stepY), labelX + 6, py);
    }

    // Markers
    if (markers?.length) {
      for (const marker of markers) {
        const color = marker.color ?? "#fbbf24";
        ctx.save();
        ctx.strokeStyle = color;
        ctx.setLineDash([4, 5]);
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        if (marker.x !== undefined) {
          ctx.moveTo(sx(marker.x), 0);
          ctx.lineTo(sx(marker.x), h);
        }
        if (marker.y !== undefined) {
          ctx.moveTo(0, sy(marker.y));
          ctx.lineTo(w, sy(marker.y));
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.font = "600 9px 'Plus Jakarta Sans Variable', sans-serif";
        const textWidth = ctx.measureText(marker.label).width;
        const px = marker.x !== undefined ? sx(marker.x) : w - textWidth - 22;
        const py = marker.y !== undefined ? sy(marker.y) : 14;
        const chipX = Math.min(w - textWidth - 12, Math.max(6, px + 5));
        const chipY = Math.max(4, Math.min(h - 20, py - 8));
        ctx.fillStyle = palette.chipBg;
        ctx.strokeStyle = `${color}55`;
        const chipW = textWidth + 10;
        const chipH = 15;
        roundRect(ctx, chipX, chipY, chipW, chipH, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fillText(marker.label, chipX + 5, chipY + 8);
        ctx.restore();
      }
    }

    const samples = sampleView(view, t, w);

    // Shaded regions (area under a curve, or between two curves)
    for (const group of samples) {
      const spec = group.series.fill;
      if (!spec || !group.segments.length) continue;
      const tint = spec.color ?? group.color;
      const baseline = spec.baseline ?? 0;
      const otherEntry = spec.between
        ? compiled.find((entry) => entry.item.expression === spec.between)
        : null;

      ctx.save();
      ctx.globalAlpha = spec.opacity ?? 0.16;
      ctx.fillStyle = tint;
      for (const segment of group.segments) {
        const lower: { x: number; y: number }[] = [];
        const upper: { x: number; y: number }[] = [];
        for (const point of segment) {
          let top: number | null = point.y;
          let bottom: number | null = baseline;
          if (otherEntry?.fn) {
            try {
              const value = Number(otherEntry.fn.evaluate({ ...scopeBase, x: point.x, t }));
              if (Number.isFinite(value)) {
                top = Math.max(point.y, value);
                bottom = Math.min(point.y, value);
              } else {
                top = null;
              }
            } catch {
              top = null;
            }
          }
          if (top === null || bottom === null) continue;
          upper.push({ x: point.x, y: top });
          lower.push({ x: point.x, y: bottom });
        }
        if (upper.length < 2) continue;
        ctx.beginPath();
        upper.forEach((point, index) => {
          const px = sx(point.x);
          const py = sy(point.y);
          if (index === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        for (let index = lower.length - 1; index >= 0; index--) {
          ctx.lineTo(sx(lower[index].x), sy(lower[index].y));
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Curves
    for (const group of samples) {
      if (!group.segments.length) continue;
      ctx.save();
      ctx.strokeStyle = group.color;
      ctx.lineWidth = group.series.width ?? (compact ? 2 : 2.3);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      if (group.series.dashed) ctx.setLineDash([5, 6]);
      ctx.shadowColor = group.color;
      ctx.shadowBlur = group.series.dashed ? 0 : compact ? 6 : 10;
      for (const segment of group.segments) {
        ctx.beginPath();
        segment.forEach((point, index) => {
          const px = sx(point.x);
          const py = sy(point.y);
          if (index === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }
      ctx.restore();
    }

    // Crosshair
    if (hover) {
      ctx.save();
      ctx.strokeStyle = "rgba(226,240,255,0.28)";
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hover.px, 0);
      ctx.lineTo(hover.px, h);
      ctx.moveTo(0, hover.py);
      ctx.lineTo(w, hover.py);
      ctx.stroke();
      ctx.setLineDash([]);
      for (const value of hover.values) {
        const py = sy(value.value);
        if (py < -10 || py > h + 10) continue;
        ctx.fillStyle = value.color;
        ctx.shadowColor = value.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sx(hover.x), py, compact ? 3 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(5,8,14,.9)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [size, view, sampleView, t, markers, compact, hover, palette, compiled, scopeBase, playing]);

  useEffect(() => {
    if (!ready || size.w < 10) return;
    draw();
    const frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [draw, ready, size.w, size.h]);

  /* ------------------------------ interactions --------------------------- */
  const pointerToMath = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const x = view.x0 + (px / rect.width) * (view.x1 - view.x0);
      const y = view.y1 - (py / rect.height) * (view.y1 - view.y0);
      return { px, py, x, y, rect };
    },
    [view]
  );

  const updateHover = useCallback(
    (clientX: number, clientY: number) => {
      const math = pointerToMath(clientX, clientY);
      if (!math) return;
      const samples = sampleView(view, t, Math.max(size.w, 400));
      const values: HoverState["values"] = [];
      for (const group of samples) {
        if (!group.segments.length) continue;
        let best: SamplePoint | null = null;
        let bestDist = Infinity;
        if (group.series.mode === "parametric") {
          for (const segment of group.segments) {
            for (const point of segment) {
              const d = (point.x - math.x) ** 2 + (point.y - math.y) ** 2;
              if (d < bestDist) {
                bestDist = d;
                best = point;
              }
            }
          }
        } else {
          for (const segment of group.segments) {
            for (const point of segment) {
              const d = Math.abs(point.x - math.x);
              if (d < bestDist) {
                bestDist = d;
                best = point;
              }
            }
          }
        }
        if (best && bestDist < (view.x1 - view.x0) * 0.12) {
          values.push({
            label: group.series.label ?? group.series.expression,
            value: best.y,
            color: group.color,
          });
        }
      }
      setHover({ px: math.px, py: math.py, x: math.x, y: math.y, values });
    },
    [pointerToMath, sampleView, view, t, size.w]
  );

  const zoomAt = useCallback(
    (factor: number, anchorX?: number, anchorY?: number) => {
      setView((current) => {
        const xSpan = current.x1 - current.x0;
        const ySpan = current.y1 - current.y0;
        const ax = anchorX ?? (current.x0 + current.x1) / 2;
        const ay = anchorY ?? (current.y0 + current.y1) / 2;
        const nx0 = ax - (ax - current.x0) * factor;
        const nx1 = ax + (current.x1 - ax) * factor;
        const ny0 = ay - (ay - current.y0) * factor;
        const ny1 = ay + (current.y1 - ay) * factor;
        if (nx1 - nx0 < 1e-6 || ny1 - ny0 < 1e-6) return current;
        const next = { x0: nx0, x1: nx1, y0: ny0, y1: ny1 };
        onViewChange?.(next);
        return next;
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [onViewChange]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const math = pointerToMath(event.clientX, event.clientY);
      const factor = event.deltaY > 0 ? 1.14 : 0.88;
      zoomAt(factor, math?.x, math?.y);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [pointerToMath, zoomAt]);

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    pinchRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinchRef.current.size === 2) {
      const points = Array.from(pinchRef.current.values());
      pinchStartRef.current = {
        dist: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
        view,
        cx: (points[0].x + points[1].x) / 2,
        cy: (points[0].y + points[1].y) / 2,
      };
      dragRef.current = null;
      return;
    }
    dragRef.current = { active: true, moved: false, sx: event.clientX, sy: event.clientY, view };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pinchRef.current.has(event.pointerId)) {
      pinchRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (pinchRef.current.size === 2 && pinchStartRef.current) {
      const points = Array.from(pinchRef.current.values());
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      if (dist > 0 && pinchStartRef.current.dist > 0) {
        const ratio = pinchStartRef.current.dist / dist;
        const rect = canvasRef.current?.getBoundingClientRect();
        const start = pinchStartRef.current;
        if (rect) {
          const ax = start.view.x0 + ((start.cx - rect.left) / rect.width) * (start.view.x1 - start.view.x0);
          const ay = start.view.y1 - ((start.cy - rect.top) / rect.height) * (start.view.y1 - start.view.y0);
          const factor = Math.min(1.6, Math.max(0.625, ratio));
          const next = {
            x0: ax - (ax - start.view.x0) * factor,
            x1: ax + (start.view.x1 - ax) * factor,
            y0: ay - (ay - start.view.y0) * factor,
            y1: ay + (start.view.y1 - ay) * factor,
          };
          setView(next);
          onViewChange?.(next);
        }
      }
      return;
    }

    if (dragRef.current?.active) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = event.clientX - dragRef.current.sx;
      const dy = event.clientY - dragRef.current.sy;
      if (Math.abs(dx) + Math.abs(dy) > 2) dragRef.current.moved = true;
      const start = dragRef.current.view;
      const xSpan = start.x1 - start.x0;
      const ySpan = start.y1 - start.y0;
      const next = {
        x0: start.x0 - (dx / rect.width) * xSpan,
        x1: start.x1 - (dx / rect.width) * xSpan,
        y0: start.y0 + (dy / rect.height) * ySpan,
        y1: start.y1 + (dy / rect.height) * ySpan,
      };
      setView(next);
      onViewChange?.(next);
      return;
    }

    updateHover(event.clientX, event.clientY);
  };

  const endPointer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    pinchRef.current.delete(event.pointerId);
    if (pinchRef.current.size < 2) pinchStartRef.current = null;
    if (dragRef.current) dragRef.current = { ...dragRef.current, active: false };
  };

  /* -------------------------------- render ------------------------------- */
  const legend = series.filter((item) => item.label);

  return (
    <div className={cn("relative flex h-full w-full flex-col overflow-hidden", className)}>
      <div ref={wrapRef} className="relative min-h-[200px] flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={() => {
            setHover(null);
            dragRef.current = null;
          }}
          onDoubleClick={() => resetView()}
          aria-label="Interactive function graph. Drag to pan, scroll to zoom."
        />

        {/* Legend */}
        {legend.length > 0 && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[70%]">
            <div className="glass-soft flex flex-col gap-1.5 rounded-xl px-3 py-2">
              {legend.slice(0, compact ? 3 : 5).map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                  <span
                    className="h-[3px] w-4 shrink-0 rounded-full"
                    style={{
                      background: item.color ?? COLORS[series.indexOf(item) % COLORS.length],
                      boxShadow: `0 0 8px ${item.color ?? COLORS[series.indexOf(item) % COLORS.length]}88`,
                    }}
                  />
                  <span className="truncate text-[10.5px] font-medium text-slate-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Axis labels */}
        {xLabel && (
          <div className="plot-axis-label pointer-events-none absolute bottom-2.5 left-1/2 z-10 max-w-[42%] -translate-x-1/2 truncate rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm">
            {xLabel}
          </div>
        )}
        {yLabel && (
          <div
            className={cn(
              "plot-axis-label pointer-events-none absolute z-10 max-w-[46%] truncate rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm",
              xLabel ? "bottom-12 right-3" : "top-2.5 right-3"
            )}
          >
            {yLabel}
          </div>
        )}

        {/* Cursor readout */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-10">
          <div className="glass-soft flex items-center gap-3 rounded-xl px-3 py-2 font-mono text-[10.5px]">
            <span className="text-slate-500">
              x <span className="ml-1 text-slate-200">{hover ? prettifyNumber(hover.x, 3) : "—"}</span>
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="text-slate-500">
              y <span className="ml-1 text-slate-200">{hover ? prettifyNumber(hover.y, 3) : "—"}</span>
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
          {animate && (
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              className="glass-soft flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:text-[rgb(var(--accent))]"
              aria-label={playing ? "Pause animation" : "Play animation"}
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
          )}
          <div className="glass-soft flex items-center overflow-hidden rounded-lg">
            <button
              type="button"
              onClick={() => zoomAt(0.75)}
              className="flex h-8 w-8 items-center justify-center text-slate-300 transition hover:bg-white/5 hover:text-white"
              aria-label="Zoom in"
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              onClick={() => zoomAt(1.35)}
              className="flex h-8 w-8 items-center justify-center border-l border-white/5 text-slate-300 transition hover:bg-white/5 hover:text-white"
              aria-label="Zoom out"
            >
              <ZoomOut size={13} />
            </button>
            <button
              type="button"
              onClick={resetView}
              className="flex h-8 w-8 items-center justify-center border-l border-white/5 text-slate-300 transition hover:bg-white/5 hover:text-white"
              aria-label="Reset view"
            >
              <RotateCcw size={12} />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center border-l border-white/5 text-slate-300 transition hover:bg-white/5 hover:text-white"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen graph"}
            >
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
            {onExpand && (
              <button
                type="button"
                onClick={onExpand}
                className="flex h-8 w-8 items-center justify-center border-l border-white/5 text-slate-300 transition hover:bg-white/5 hover:text-white"
                aria-label="Expand graph"
              >
                <ArrowUpRight size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hover && hover.values.length > 0 && !dragRef.current?.active && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="plot-tooltip"
              style={{
                left: Math.min(Math.max(hover.px, 70), Math.max(70, size.w - 70)),
                top: Math.max(hover.py - 14, 40),
              }}
            >
              <div className="mb-1 font-mono text-[10px] text-slate-400">
                ({prettifyNumber(hover.x, 3)}, {prettifyNumber(hover.y, 3)})
              </div>
              {hover.values.slice(0, 3).map((value, index) => (
                <div key={index} className="flex items-center gap-1.5 text-[10.5px]">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: value.color }} />
                  <span className="max-w-[140px] truncate text-slate-400">{value.label}</span>
                  <span className="ml-auto font-mono text-slate-200">{prettifyNumber(value.value, 3)}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-3 top-3 z-20 flex items-start gap-2 rounded-xl border border-rose-400/25 bg-[#1a0c12]/90 px-3 py-2 text-[11px] text-rose-200 backdrop-blur"
            >
              <span className="font-semibold text-rose-400">Syntax</span>
              <span className="flex-1 leading-relaxed">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Parameter sliders */}
      {params && params.length > 0 && (
        <div className="border-t border-white/[.06] px-3 py-2">
          <button
            type="button"
            onClick={() => setShowParams((value) => !value)}
            className="flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-300"
          >
            Parameters
            <span className="text-[9px] normal-case tracking-normal text-slate-600">
              {showParams ? "hide" : "show sliders"}
            </span>
          </button>
          <AnimatePresence initial={false}>
            {showParams && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid gap-3 pt-3 sm:grid-cols-2">
                  {params.map((param) => {
                    const value = paramValues[param.key] ?? param.value;
                    return (
                      <label key={param.key} className="block">
                        <span className="mb-1.5 flex items-center justify-between text-[10.5px] text-slate-400">
                          {param.label}
                          <span className="font-mono text-[10px] text-[rgb(var(--accent))]">
                            {value}
                            {param.unit ? ` ${param.unit}` : ""}
                          </span>
                        </span>
                        <input
                          type="range"
                          className="nova-range"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={value}
                          onChange={(event) =>
                            setParamValues((prev) => ({ ...prev, [param.key]: Number(event.target.value) }))
                          }
                        />
                      </label>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

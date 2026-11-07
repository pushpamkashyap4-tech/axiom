"use client";

import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { GeometryArtifact } from "@/lib/types";

type Props = {
  pattern: GeometryArtifact["pattern"];
  className?: string;
  animate?: boolean;
};

const COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"];

function polar(cx: number, cy: number, r: number, angle: number) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
}

function rosePath(petals: number, radius: number, steps = 720) {
  const k = petals / 2;
  let path = "";
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 4;
    const r = radius * Math.cos(k * theta) * 0.62 + radius * 0.36;
    const [x, y] = polar(0, 0, Math.abs(r), theta);
    path += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)} `;
  }
  return path;
}

function spiralPath(arms: number, radius: number, turns = 3.2) {
  const paths: string[] = [];
  for (let arm = 0; arm < arms; arm++) {
    let path = "";
    for (let i = 0; i <= 500; i++) {
      const theta = (i / 500) * Math.PI * 2 * turns;
      const r = (i / 500) * radius;
      const [x, y] = polar(0, 0, r, theta + (arm * Math.PI * 2) / arms);
      path += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)} `;
    }
    paths.push(path);
  }
  return paths;
}

function waveLines(petals: number, radius: number) {
  const paths: string[] = [];
  for (let layer = 0; layer < 6; layer++) {
    let path = "";
    const base = radius * (0.3 + layer * 0.12);
    for (let i = 0; i <= 480; i++) {
      const theta = (i / 480) * Math.PI * 2;
      const r = base + Math.sin(theta * petals) * 16 * Math.cos(layer * 0.7);
      const [x, y] = polar(0, 0, r, theta);
      path += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)} `;
    }
    paths.push(path);
  }
  return paths;
}

function starPolygon(n: number, radius: number, step: number) {
  let path = "";
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const points = n / gcd(n, step);
  for (let i = 0; i <= points; i++) {
    const angle = (i * step * Math.PI * 2) / n - Math.PI / 2;
    const [x, y] = polar(0, 0, radius, angle);
    path += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)} `;
  }
  return path + "Z";
}

function sierpinski(depth: number, size: number, triangles: string[] = [], cx = 0, cy = 0) {
  if (depth === 0) {
    const h = (Math.sqrt(3) / 2) * size;
    const points = [
      `${cx},${(cy - h / 1.5).toFixed(2)}`,
      `${(cx - size / 2).toFixed(2)},${(cy + h / 3).toFixed(2)}`,
      `${(cx + size / 2).toFixed(2)},${(cy + h / 3).toFixed(2)}`,
    ];
    triangles.push(`M${points.join("L")}Z`);
    return triangles;
  }
  const next = size / 2;
  const h = (Math.sqrt(3) / 2) * next;
  sierpinski(depth - 1, next, triangles, cx, cy - h * 0.66);
  sierpinski(depth - 1, next, triangles, cx - next / 2, cy + h * 0.33);
  sierpinski(depth - 1, next, triangles, cx + next / 2, cy + h * 0.33);
  return triangles;
}

export function PatternSvg({ pattern, className, animate = true }: Props) {
  const id = useId().replace(/[:]/g, "");
  const { kind, petals = 12, layers = 5 } = pattern;

  const shapes = useMemo(() => {
    const paths: { d: string; color: string; opacity: number; width: number }[] = [];
    const radius = 170;

    if (kind === "mandala") {
      for (let layer = 0; layer < layers; layer++) {
        const scale = 1 - layer * 0.145;
        paths.push({
          d: rosePath(Math.max(4, petals - layer), radius * scale),
          color: COLORS[layer % COLORS.length],
          opacity: 0.9 - layer * 0.12,
          width: 1.5,
        });
      }
      for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2;
        const [x1, y1] = polar(0, 0, radius * 0.22, angle);
        const [x2, y2] = polar(0, 0, radius * 0.95, angle);
        paths.push({ d: `M${x1},${y1}L${x2},${y2}`, color: "#22d3ee", opacity: 0.12, width: 0.8 });
      }
      [0.2, 0.42, 0.66, 0.9].forEach((fraction, index) => {
        paths.push({ d: `M${radius * fraction},0A${radius * fraction},${radius * fraction} 0 1,1 ${-radius * fraction},0A${radius * fraction},${radius * fraction} 0 1,1 ${radius * fraction},0`, color: COLORS[(index + 1) % COLORS.length], opacity: 0.22, width: 0.9 });
      });
    } else if (kind === "spiral") {
      spiralPath(Math.max(3, Math.min(petals, 16)), radius, 3).forEach((d, index) => {
        paths.push({ d, color: COLORS[index % COLORS.length], opacity: 0.85, width: 1.3 });
      });
      for (let ring = 1; ring <= 4; ring++) {
        paths.push({ d: `M${ring * 42},0A${ring * 42},${ring * 42} 0 1,1 ${-ring * 42},0A${ring * 42},${ring * 42} 0 1,1 ${ring * 42},0`, color: "#94a3b8", opacity: 0.1, width: 0.7 });
      }
    } else if (kind === "wave") {
      waveLines(Math.max(4, petals), radius).forEach((d, index) => {
        paths.push({ d, color: COLORS[index % COLORS.length], opacity: 0.75, width: 1.2 });
      });
    } else if (kind === "polygon") {
      const n = Math.max(5, petals);
      paths.push({ d: starPolygon(n, radius, Math.max(2, Math.floor(n / 2))), color: COLORS[0], opacity: 0.9, width: 1.4 });
      paths.push({ d: starPolygon(n, radius * 0.78, Math.max(2, Math.floor(n / 3))), color: COLORS[1], opacity: 0.7, width: 1.1 });
      for (let i = 0; i < n; i++) {
        const [x, y] = polar(0, 0, radius, (i / n) * Math.PI * 2 - Math.PI / 2);
        paths.push({ d: `M${x},${y}L0,0`, color: "#64748b", opacity: 0.12, width: 0.7 });
      }
    } else {
      sierpinski(4, 300).forEach((d, index) => {
        paths.push({ d, color: COLORS[index % COLORS.length], opacity: 0.22 + (index % 5) * 0.1, width: 1 });
      });
    }

    return paths;
  }, [kind, petals, layers]);

  return (
    <div className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,.10),transparent_62%)]" />
      <svg
        viewBox="-220 -220 440 440"
        className={cn("h-full max-h-[340px] w-full max-w-[440px]", animate && "transition-transform duration-700 hover:rotate-6 hover:scale-105")}
        role="img"
        aria-label={`${kind} geometric pattern with ${petals} fold symmetry`}
      >
        <defs>
          <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id={`fade-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.14" />
            <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle r="212" fill={`url(#fade-${id})`} />
        <g filter={`url(#glow-${id})`}>
          {shapes.map((shape, index) => (
            <path
              key={index}
              d={shape.d}
              fill="none"
              stroke={shape.color}
              strokeOpacity={shape.opacity}
              strokeWidth={shape.width}
              strokeLinecap="round"
            />
          ))}
        </g>
        <circle r="3" fill="#e0f2fe" opacity="0.9" />
      </svg>
      <div className="pointer-events-none absolute bottom-2 left-3 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
        {kind} · {petals}×
      </div>
    </div>
  );
}

"use client";

import { Html, Line, OrbitControls, Sparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Pause, Play, RotateCw, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { SceneConfig } from "@/lib/types";

type Props = {
  config: SceneConfig;
  onChange?: (config: SceneConfig) => void;
  className?: string;
  compact?: boolean;
};

const ACCENT = "#22d3ee";
const VIOLET = "#a78bfa";
const EMERALD = "#34d399";
const ATOM_CYAN = "#67e8f9";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const damp = THREE.MathUtils.damp;

function Label({
  position,
  children,
  tone = "cyan",
}: {
  position: [number, number, number];
  children: React.ReactNode;
  tone?: "cyan" | "violet" | "emerald" | "amber" | "rose";
}) {
  const tones: Record<string, string> = {
    cyan: "border-cyan-300/25 bg-cyan-400/10 text-cyan-100",
    violet: "border-violet-300/25 bg-violet-400/10 text-violet-100",
    emerald: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
    amber: "border-amber-300/25 bg-amber-400/10 text-amber-100",
    rose: "border-rose-300/25 bg-rose-400/10 text-rose-100",
  };
  return (
    <Html position={position} center distanceFactor={8} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div
        className={cn(
          "whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide backdrop-blur-sm",
          tones[tone]
        )}
        style={{ transform: "translateZ(0)" }}
      >
        {children}
      </div>
    </Html>
  );
}

function Arrow({
  start,
  end,
  color = "#fbbf24",
  dashed = true,
  label,
  tone = "amber",
}: {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  dashed?: boolean;
  label?: string;
  tone?: "cyan" | "violet" | "emerald" | "amber" | "rose";
}) {
  const { mid, quaternion } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const dir = new THREE.Vector3().subVectors(e, s);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { mid: s.clone().add(e).multiplyScalar(0.5), quaternion: q };
  }, [start, end]);

  return (
    <group>
      <Line points={[start, end]} color={color} lineWidth={1.6} dashed={dashed} dashSize={0.08} gapSize={0.06} transparent opacity={0.95} />
      <mesh position={end} quaternion={quaternion}>
        <coneGeometry args={[0.045, 0.14, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {label && <Label position={[mid.x, mid.y + 0.14, mid.z]} tone={tone}>{label}</Label>}
      <Line points={[start, end]} color={color} lineWidth={4} transparent opacity={0.06} />
    </group>
  );
}

type OrbitLike = { target: THREE.Vector3; update: () => void };

function CameraRig({ type, resetKey }: { type: SceneConfig["type"]; resetKey: number }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as unknown as OrbitLike | null;

  useEffect(() => {
    const positions: Record<SceneConfig["type"], [number, number, number]> = {
      crystal: [4.3, 3.6, 5.0],
      electrolytic: [5.2, 3.6, 6.0],
      solenoid: [5.4, 3.4, 6.2],
      atom: [3.4, 2.7, 4.4],
    };
    camera.position.set(...positions[type]);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, resetKey]);

  return null;
}

/* ------------------------------------------------------------------ */
/* Crystal lattice                                                     */
/* ------------------------------------------------------------------ */

const A = 2;
const CORNERS: [number, number, number][] = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
].map(([x, y, z]) => [x * (A / 2), y * (A / 2), z * (A / 2)]);

const FACES: [number, number, number][] = [
  [A / 2, 0, 0], [-A / 2, 0, 0], [0, A / 2, 0], [0, -A / 2, 0], [0, 0, A / 2], [0, 0, -A / 2],
];

const EDGES: [number, number, number][][] = [
  [[-1, -1, -1], [1, -1, -1]], [[1, -1, -1], [1, 1, -1]], [[1, 1, -1], [-1, 1, -1]], [[-1, 1, -1], [-1, -1, -1]],
  [[-1, -1, 1], [1, -1, 1]], [[1, -1, 1], [1, 1, 1]], [[1, 1, 1], [-1, 1, 1]], [[-1, 1, 1], [-1, -1, 1]],
  [[-1, -1, -1], [-1, -1, 1]], [[1, -1, -1], [1, -1, 1]], [[1, 1, -1], [1, 1, 1]], [[-1, 1, -1], [-1, 1, 1]],
].map((pair) => pair.map(([x, y, z]) => [x * (A / 2), y * (A / 2), z * (A / 2)]) as [number, number, number][]);

function Atom({
  position,
  visible,
  radius,
  color,
}: {
  position: [number, number, number];
  visible: boolean;
  radius: number;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const current = useRef(visible ? radius : 0);

  useFrame((_, delta) => {
    const target = visible ? radius : 0.0001;
    current.current = damp(current.current, target, 9, delta);
    if (ref.current) {
      ref.current.scale.setScalar(current.current);
      ref.current.visible = current.current > 0.004;
    }
  });

  return (
    <mesh ref={ref} position={position} castShadow>
      <sphereGeometry args={[1, 28, 22]} />
      <meshStandardMaterial
        color={color}
        roughness={0.24}
        metalness={0.42}
        emissive={color}
        emissiveIntensity={0.14}
      />
    </mesh>
  );
}

function CrystalScene({ config }: { config: Extract<SceneConfig, { type: "crystal" }> }) {
  const { lattice, showCell = true, showHighlight = true, highlight = "face-diagonal", atomScale = 0.52 } = config;
  const scRadius = 0.5 * A;
  const bccRadius = (Math.sqrt(3) * A) / 4;
  const fccRadius = (Math.sqrt(2) * A) / 4;
  const cornerRadius = (lattice === "sc" ? scRadius : lattice === "bcc" ? bccRadius : fccRadius) * atomScale;

  const highlightGeometry = useMemo(() => {
    if (highlight === "face-diagonal") {
      return { start: [-A / 2, -A / 2, A / 2] as [number, number, number], end: [A / 2, A / 2, A / 2] as [number, number, number], label: "face diagonal = √2a" };
    }
    if (highlight === "body-diagonal") {
      return { start: [-A / 2, -A / 2, -A / 2] as [number, number, number], end: [A / 2, A / 2, A / 2] as [number, number, number], label: "body diagonal = √3a" };
    }
    return { start: [-A / 2, -A / 2, A / 2] as [number, number, number], end: [A / 2, -A / 2, A / 2] as [number, number, number], label: "edge = a" };
  }, [highlight]);

  return (
    <group>
      {CORNERS.map((position, index) => (
        <Atom key={`c-${index}`} position={position} visible radius={cornerRadius} color={ATOM_CYAN} />
      ))}
      {FACES.map((position, index) => (
        <Atom key={`f-${index}`} position={position} visible={lattice === "fcc"} radius={fccRadius * atomScale} color={VIOLET} />
      ))}
      <Atom position={[0, 0, 0]} visible={lattice === "bcc"} radius={bccRadius * atomScale} color={EMERALD} />

      {showCell &&
        EDGES.map((points, index) => (
          <Line key={`e-${index}`} points={points} color="#7dd3fc" lineWidth={1} transparent opacity={0.42} />
        ))}

      {showHighlight && (
        <Arrow
          start={highlightGeometry.start}
          end={highlightGeometry.end}
          color="#fbbf24"
          label={highlightGeometry.label}
          tone="amber"
        />
      )}

      <Sparkles count={22} scale={3.4} size={1.1} speed={0.18} opacity={0.22} color="#67e8f9" />

      <Html position={[0, -A / 2 - 0.62, 0]} center distanceFactor={7} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div className="rounded-full border border-white/10 bg-[#080d16]/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400 backdrop-blur">
          <span className="sm:hidden">{lattice.toUpperCase()}</span>
          <span className="hidden sm:inline">{lattice.toUpperCase()} · a = 2 units</span>
        </div>
      </Html>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Electrolytic cell                                                   */
/* ------------------------------------------------------------------ */

const WirePath = ({ points, color = "#f97316" }: { points: [number, number, number][]; color?: string }) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), [points]);
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 64, 0.035, 8, false), [curve]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
    </mesh>
  );
};

function FlowDots({ path, active }: { path: [number, number, number][]; active: boolean }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(path.map((p) => new THREE.Vector3(...p))), [path]);
  const refs = useRef<THREE.Mesh[]>([]);
  const offset = useRef(0);

  useFrame((_, delta) => {
    if (active) offset.current = (offset.current + delta * 0.16) % 1;
    refs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const u = (offset.current + index / 5) % 1;
      const point = curve.getPointAt(u);
      mesh.position.copy(point);
      mesh.visible = active;
    });
  });

  return (
    <>
      {[0, 1, 2, 3, 4].map((index) => (
        <mesh
          key={index}
          ref={(el) => {
            if (el) refs.current[index] = el;
          }}
        >
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={1.6} />
        </mesh>
      ))}
    </>
  );
}

function ElectrolyticScene({ config }: { config: Extract<SceneConfig, { type: "electrolytic" }> }) {
  const { showLabels = true, showFlow = true } = config;
  const anodePath: [number, number, number][] = [
    [-0.72, 1.35, 0],
    [-0.72, 1.75, 0],
    [-1.5, 2.1, 0],
    [-0.6, 2.35, 0],
  ];
  const cathodePath: [number, number, number][] = [
    [0.72, 1.35, 0],
    [0.72, 1.75, 0],
    [1.5, 2.1, 0],
    [0.6, 2.35, 0],
  ];

  return (
    <group position={[0, -0.35, 0]}>
      {/* beaker glass */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1.55, 1.42, 2.2, 64, 1, true]} />
        <meshPhysicalMaterial
          color="#7dd3fc"
          transparent
          opacity={0.14}
          roughness={0.05}
          metalness={0.1}
          side={THREE.DoubleSide}
          clearcoat={1}
        />
      </mesh>
      <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 1.42, 64]} />
        <meshStandardMaterial color="#0b2136" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.53, 1.58, 64]} />
        <meshStandardMaterial color="#67e8f9" transparent opacity={0.55} />
      </mesh>

      {/* electrolyte */}
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[1.43, 1.34, 1.55, 64]} />
        <meshStandardMaterial color="#0ea5e9" transparent opacity={0.2} roughness={0.15} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.43, 64]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      {/* electrodes */}
      <mesh position={[-0.72, 0.1, 0]}>
        <boxGeometry args={[0.16, 2.1, 0.5]} />
        <meshStandardMaterial color="#fb923c" metalness={0.85} roughness={0.28} emissive="#7c2d12" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0.72, 0.1, 0]}>
        <boxGeometry args={[0.16, 2.1, 0.5]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.32} />
      </mesh>

      {/* wires and battery */}
      <WirePath points={anodePath} />
      <WirePath points={cathodePath} />
      <mesh position={[0, 2.35, 0]}>
        <boxGeometry args={[1.1, 0.4, 0.34]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[-0.44, 2.35, 0]}>
        <boxGeometry args={[0.16, 0.12, 0.36]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.75} />
      </mesh>
      <mesh position={[0.44, 2.35, 0]}>
        <boxGeometry args={[0.16, 0.12, 0.36]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>

      {showFlow && (
        <>
          <FlowDots path={[...anodePath, [0.6, 2.35, 0], [0.44, 2.35, 0]]} active />
          <FlowDots path={[[-0.44, 2.35, 0], [0.6, 2.35, 0], ...cathodePath.slice().reverse()]} active />
        </>
      )}

      {showLabels && (
        <>
          <Label position={[-0.72, 1.5, 0.4]} tone="rose">ANODE (+) oxidation</Label>
          <Label position={[0.72, 1.5, 0.4]} tone="cyan">CATHODE (−) reduction</Label>
          <Label position={[0, -0.75, 1.1]} tone="emerald">
            {config.electrolyte ?? "electrolyte"}
          </Label>
          <Label position={[0, 2.85, 0]} tone="amber">battery</Label>
          <Label position={[-1.35, 2.15, 0]} tone="violet">e⁻ →</Label>
        </>
      )}

      <Sparkles count={18} scale={[3, 2.2, 2]} size={1.2} speed={0.35} opacity={0.3} color="#7dd3fc" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Solenoid                                                            */
/* ------------------------------------------------------------------ */

function SolenoidScene({ config }: { config: Extract<SceneConfig, { type: "solenoid" }> }) {
  const { showField = true, showCurrent = true } = config;
  const turns = config.turns ?? 11;
  const length = 4.2;
  const radius = 1.05;

  const helixPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const steps = turns * 26;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const angle = u * turns * Math.PI * 2;
      points.push(new THREE.Vector3(-length / 2 + u * length, Math.cos(angle) * radius, Math.sin(angle) * radius));
    }
    return points;
  }, [turns]);

  const helixGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(helixPoints);
    return new THREE.TubeGeometry(curve, helixPoints.length, 0.045, 8, false);
  }, [helixPoints]);

  const dots = useRef<THREE.Mesh[]>([]);
  const offset = useRef(0);
  const fieldCurves = useMemo(() => {
    const curves: [number, number, number][][] = [];
    for (let k = 0; k < 3; k++) {
      const r = 0.28 + k * 0.26;
      const angle = (k / 3) * Math.PI * 2;
      const y = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      curves.push([
        [-3.1, y, z],
        [3.1, y, z],
        [3.9, y * 1.7, z * 1.7],
        [4.5, 0, 0],
        [3.9, -y * 1.7, -z * 1.7],
        [3.1, -y, -z],
        [-3.1, -y, -z],
        [-3.9, -y * 1.7, -z * 1.7],
        [-4.5, 0, 0],
        [-3.9, y * 1.7, z * 1.7],
        [-3.1, y, z],
      ]);
    }
    return curves;
  }, []);

  useFrame((_, delta) => {
    if (showCurrent) offset.current = (offset.current + delta * 0.1) % 1;
    dots.current.forEach((mesh, index) => {
      if (!mesh) return;
      const u = (offset.current + index / 7) % 1;
      const point = new THREE.Vector3().lerpVectors(helixPoints[0], helixPoints[helixPoints.length - 1], u);
      const angle = u * turns * Math.PI * 2;
      point.y = Math.cos(angle) * radius;
      point.z = Math.sin(angle) * radius;
      mesh.position.copy(point);
    });
  });

  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh geometry={helixGeometry}>
        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.25} emissive="#7c2d12" emissiveIntensity={0.2} />
      </mesh>

      {Array.from({ length: 7 }).map((_, index) => (
        <mesh
          key={index}
          ref={(el) => {
            if (el) dots.current[index] = el;
          }}
          visible={showCurrent}
        >
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={1.8} />
        </mesh>
      ))}

      {showField && (
        <>
          {fieldCurves.map((curve, index) => (
            <Line
              key={index}
              points={curve}
              color={index === 0 ? "#22d3ee" : index === 1 ? "#a78bfa" : "#34d399"}
              lineWidth={index === 0 ? 1.6 : 1.2}
              transparent
              opacity={0.55}
            />
          ))}
          <Arrow start={[-1.6, 0, 0]} end={[1.6, 0, 0]} color="#fbbf24" dashed={false} label="B inside = μ₀nI" />
        </>
      )}

      <Html position={[0, 1.75, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-100 backdrop-blur">
          N pole
        </div>
      </Html>
      <Html position={[0, -1.75, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-violet-100 backdrop-blur">
          S pole
        </div>
      </Html>
      <Sparkles count={20} scale={[6, 3, 3]} size={1} speed={0.15} opacity={0.22} color="#a78bfa" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Atom                                                                */
/* ------------------------------------------------------------------ */

const SHELLS: Record<string, { shells: number[]; color: string; label: string }> = {
  H: { shells: [1], color: "#f9a8d4", label: "Hydrogen · 1e⁻" },
  C: { shells: [2, 4], color: "#67e8f9", label: "Carbon · 2,4" },
  O: { shells: [2, 6], color: "#fb7185", label: "Oxygen · 2,6" },
  Na: { shells: [2, 8, 1], color: "#fbbf24", label: "Sodium · 2,8,1" },
};

function Shell({ radius, count, color, speed, showElectrons }: { radius: number; count: number; color: string; speed: number; showElectrons: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const tilt = useMemo(() => [Math.random() * 0.6 + 0.5, Math.random() * Math.PI, Math.random() * 0.7 + 0.4] as [number, number, number], []);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * speed;
  });

  return (
    <group rotation={tilt}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.008, 8, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      <group ref={group}>
        {Array.from({ length: count }).map((_, index) => {
          const angle = (index / count) * Math.PI * 2;
          return (
            <mesh
              key={index}
              position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
              visible={showElectrons}
            >
              <sphereGeometry args={[0.075, 14, 14]} />
              <meshStandardMaterial color="#e0f2fe" emissive={color} emissiveIntensity={1.8} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function AtomScene({ config }: { config: Extract<SceneConfig, { type: "atom" }> }) {
  const element = config.element ?? "C";
  const model = SHELLS[element] ?? SHELLS.C;
  const nucleusPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const n = 6;
    for (let i = 0; i < n; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      positions.push([Math.cos(theta) * Math.sin(phi) * 0.16, Math.cos(phi) * 0.16, Math.sin(theta) * Math.sin(phi) * 0.16]);
    }
    return positions;
  }, []);

  return (
    <group>
      {nucleusPositions.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? "#fb7185" : "#a78bfa"}
            emissive={index % 2 === 0 ? "#fb7185" : "#a78bfa"}
            emissiveIntensity={0.7}
            roughness={0.25}
          />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.26, 24, 24]} />
        <meshStandardMaterial color="#fda4af" emissive="#fb7185" emissiveIntensity={0.25} transparent opacity={0.18} />
      </mesh>
      {model.shells.map((count, index) => (
        <Shell
          key={index}
          radius={0.85 + index * 0.6}
          count={count}
          color={["#67e8f9", "#a78bfa", "#34d399"][index % 3]}
          speed={0.5 / (index + 1)}
          showElectrons={config.showElectrons ?? true}
        />
      ))}
      <Html position={[0, -1.9, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div className="rounded-full border border-white/10 bg-[#080d16]/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-300 backdrop-blur">
          {model.label}
        </div>
      </Html>
      <Sparkles count={30} scale={5} size={1.2} speed={0.1} opacity={0.35} color="#a78bfa" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Controls panel                                                      */
/* ------------------------------------------------------------------ */

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-[10.5px] font-semibold transition",
        active
          ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100 shadow-[0_0_20px_-6px_rgba(34,211,238,.5)]"
          : "border-white/[.07] bg-white/[.035] text-slate-400 hover:border-white/15 hover:text-slate-200"
      )}
    >
      {children}
    </button>
  );
}

function SceneControls({
  config,
  onChange,
  onReset,
}: {
  config: SceneConfig;
  onChange?: (config: SceneConfig) => void;
  onReset: () => void;
}) {
  const update = (patch: Partial<typeof config>) => onChange?.({ ...config, ...patch } as SceneConfig);

  return (
    <div className="flex flex-col gap-3">
      {config.type === "crystal" && (
        <>
          <div>
            <p className="label">Lattice</p>
            <div className="flex gap-1.5">
              {(["sc", "bcc", "fcc"] as const).map((lattice) => (
                <Chip key={lattice} active={config.lattice === lattice} onClick={() => update({ lattice, highlight: lattice === "sc" ? "edge" : lattice === "bcc" ? "body-diagonal" : "face-diagonal", showHighlight: true })}>
                  {lattice.toUpperCase()}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Highlight</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                ["face-diagonal", "Face diag"],
                ["body-diagonal", "Body diag"],
                ["edge", "Edge"],
              ].map(([value, label]) => (
                <Chip
                  key={value}
                  active={config.showHighlight && config.highlight === value}
                  onClick={() => update({ highlight: value as "face-diagonal", showHighlight: true })}
                >
                  {label}
                </Chip>
              ))}
              <Chip active={!config.showHighlight} onClick={() => update({ showHighlight: false })}>
                None
              </Chip>
            </div>
          </div>
          <div>
            <div className="label flex items-center justify-between">
              <span>Atom size</span>
              <span className="font-mono text-[10px] normal-case tracking-normal text-cyan-300">
                {Math.round((config.atomScale ?? 0.52) * 100)}%
              </span>
            </div>
            <input
              type="range"
              className="nova-range"
              min={0.3}
              max={1}
              step={0.02}
              value={config.atomScale ?? 0.52}
              onChange={(event) => update({ atomScale: Number(event.target.value) })}
            />
          </div>
        </>
      )}

      {config.type === "electrolytic" && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] text-slate-300">Show labels</span>
            <Switch checked={config.showLabels ?? true} onChange={(value) => update({ showLabels: value })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] text-slate-300">Electron flow</span>
            <Switch checked={config.showFlow ?? true} onChange={(value) => update({ showFlow: value })} />
          </div>
        </>
      )}

      {config.type === "solenoid" && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] text-slate-300">Field lines</span>
            <Switch checked={config.showField ?? true} onChange={(value) => update({ showField: value })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] text-slate-300">Current flow</span>
            <Switch checked={config.showCurrent ?? true} onChange={(value) => update({ showCurrent: value })} />
          </div>
          <div>
            <div className="label flex items-center justify-between">
              <span>Turns</span>
              <span className="font-mono text-[10px] normal-case tracking-normal text-cyan-300">{config.turns ?? 11}</span>
            </div>
            <input
              type="range"
              className="nova-range"
              min={5}
              max={18}
              step={1}
              value={config.turns ?? 11}
              onChange={(event) => update({ turns: Number(event.target.value) })}
            />
          </div>
        </>
      )}

      {config.type === "atom" && (
        <>
          <div>
            <p className="label">Element</p>
            <div className="flex gap-1.5">
              {(["H", "C", "O", "Na"] as const).map((element) => (
                <Chip key={element} active={config.element === element} onClick={() => update({ element })}>
                  {element}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] text-slate-300">Electrons</span>
            <Switch checked={config.showElectrons ?? true} onChange={(value) => update({ showElectrons: value })} />
          </div>
        </>
      )}

      <div className="divider" />
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] text-slate-300">Auto-rotate</span>
        <Switch checked={config.autoRotate ?? false} onChange={(value) => update({ autoRotate: value })} />
      </div>
      <button type="button" className="btn-ghost w-full" onClick={onReset}>
        <RotateCw size={12} /> Reset view
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main canvas                                                         */
/* ------------------------------------------------------------------ */

export function SceneCanvas({ config, onChange, className, compact = false }: Props) {
  const [resetKey, setResetKey] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(config.autoRotate ?? false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setAutoRotate(config.autoRotate ?? false);
  }, [config.autoRotate]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1200) {
      setPanelOpen(!compact);
    }
  }, [compact]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(34,211,238,.09),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,.1),transparent_50%)]" />
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [4.3, 3.6, 5.0], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <CameraRig type={config.type} resetKey={resetKey} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 9, 6]} intensity={2.1} color="#e0f7ff" />
        <directionalLight position={[-6, -3, -5]} intensity={0.6} color="#a78bfa" />
        <pointLight position={[-4, 2, 4]} intensity={22} distance={14} color="#22d3ee" />
        <pointLight position={[4, -3, -4]} intensity={18} distance={14} color="#8b5cf6" />

        {config.type === "crystal" && <CrystalScene config={config} />}
        {config.type === "electrolytic" && <ElectrolyticScene config={config} />}
        {config.type === "solenoid" && <SolenoidScene config={config} />}
        {config.type === "atom" && <AtomScene config={config} />}

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          autoRotate={autoRotate && !paused}
          autoRotateSpeed={1.1}
          minDistance={2.8}
          maxDistance={14}
          enablePan={!compact}
        />
        <fog attach="fog" args={["#05080f", 9, 20]} />
      </Canvas>

      {/* top-left badge */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2">
        <div className="glass-soft flex items-center gap-1.5 rounded-lg px-2.5 py-1.5">
          <span className="accent-dot h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))]" />
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-300">Live 3D</span>
        </div>
        <span className="hidden text-[9.5px] text-slate-500 sm:inline">drag · scroll · right-drag to pan</span>
      </div>

      {/* quick actions */}
      <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            const next = !autoRotate;
            setAutoRotate(next);
            onChange?.({ ...config, autoRotate: next } as SceneConfig);
          }}
          className={cn(
            "glass-soft flex h-8 w-8 items-center justify-center rounded-lg transition",
            autoRotate ? "text-[rgb(var(--accent))]" : "text-slate-400 hover:text-white"
          )}
          aria-label="Toggle auto rotate"
        >
          <RotateCw size={13} className={autoRotate && !paused ? "animate-spin-slow" : ""} />
        </button>
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className="glass-soft flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:text-white"
          aria-label={paused ? "Resume animations" : "Pause animations"}
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
        </button>
        <button
          type="button"
          onClick={() => setPanelOpen((value) => !value)}
          className="glass-soft flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold text-slate-300 transition hover:text-white"
        >
          <SlidersHorizontal size={12} /> <span className="hidden sm:inline">Controls</span>
        </button>
      </div>

      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            className="glass-strong absolute bottom-3 right-3 z-30 max-h-[72%] w-[188px] overflow-y-auto rounded-2xl p-3 sm:w-[220px] sm:p-3.5"
          >
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Scene controls</p>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/10 hover:text-white"
                aria-label="Close controls"
              >
                <X size={11} />
              </button>
            </div>
            <SceneControls config={config} onChange={onChange} onReset={() => setResetKey((key) => key + 1)} />
          </motion.div>
        )}
      </AnimatePresence>

      {!panelOpen && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-lg border border-white/[.07] bg-black/30 px-2 py-1 text-[9.5px] text-slate-500 backdrop-blur">
          <Box size={10} /> 360° orbit enabled
        </div>
      )}

      {paused && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-300 backdrop-blur">
            paused
          </div>
        </div>
      )}
    </div>
  );
}

export function SceneLegend({
  type,
  lattice,
}: {
  type: SceneConfig["type"];
  lattice?: "fcc" | "bcc" | "sc";
}) {
  const items =
    type === "crystal"
      ? [
          { color: ATOM_CYAN, label: "corner atoms" },
          ...(lattice === undefined || lattice === "fcc"
            ? [{ color: VIOLET, label: "face-centred atoms" }]
            : []),
          ...(lattice === undefined || lattice === "bcc"
            ? [{ color: EMERALD, label: "body-centred atom" }]
            : []),
          { color: "#fbbf24", label: "highlight" },
        ]
      : type === "electrolytic"
        ? [
            { color: "#fb923c", label: "anode (+)" },
            { color: "#94a3b8", label: "cathode (−)" },
            { color: "#38bdf8", label: "electrolyte" },
            { color: "#fbbf24", label: "electrons" },
          ]
        : type === "solenoid"
          ? [
              { color: "#f59e0b", label: "copper coil" },
              { color: "#22d3ee", label: "field lines" },
              { color: "#fbbf24", label: "B axis" },
            ]
          : [
              { color: "#fb7185", label: "protons" },
              { color: "#a78bfa", label: "neutrons" },
              { color: "#e0f2fe", label: "electrons" },
            ];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

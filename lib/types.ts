export type PlotSeries = {
  expression: string;
  label?: string;
  color?: string;
  mode?: "explicit" | "parametric";
  yExpression?: string;
  tRange?: [number, number];
  domain?: [number, number];
  dashed?: boolean;
  width?: number;
  jumps?: boolean;
  /** Shade the region under this curve (to `baseline`) or between it and `between`. */
  fill?: {
    baseline?: number;
    between?: string;
    opacity?: number;
    color?: string;
  };
};

export type PlotMarker = {
  x?: number;
  y?: number;
  label: string;
  color?: string;
};

export type PlotParam = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit?: string;
};

export type GraphArtifact = {
  id: string;
  type: "graph";
  title: string;
  description?: string;
  expressions: PlotSeries[];
  xRange?: [number, number];
  yRange?: [number, number];
  xLabel?: string;
  yLabel?: string;
  markers?: PlotMarker[];
  params?: PlotParam[];
  animate?: boolean;
  caption?: string;
  preset?: string;
};

export type CrystalLattice = "fcc" | "bcc" | "sc";
export type CrystalHighlight = "face-diagonal" | "body-diagonal" | "edge" | null;

export type SceneConfig =
  | {
      type: "crystal";
      lattice: CrystalLattice;
      highlight?: CrystalHighlight;
      showCell?: boolean;
      showHighlight?: boolean;
      atomScale?: number;
      autoRotate?: boolean;
    }
  | {
      type: "electrolytic";
      electrolyte?: string;
      showLabels?: boolean;
      showFlow?: boolean;
      autoRotate?: boolean;
    }
  | {
      type: "solenoid";
      turns?: number;
      showField?: boolean;
      showCurrent?: boolean;
      autoRotate?: boolean;
    }
  | {
      type: "atom";
      element?: "H" | "C" | "O" | "Na";
      showElectrons?: boolean;
      autoRotate?: boolean;
    };

export type SceneArtifact = {
  id: string;
  type: "scene3d";
  title: string;
  description?: string;
  config: SceneConfig;
  caption?: string;
};

export type ScientificArtifact = {
  id: string;
  type: "scientific";
  title: string;
  description?: string;
  preset: string;
  caption?: string;
};

export type MermaidArtifact = {
  id: string;
  type: "mermaid";
  title: string;
  description?: string;
  code: string;
  caption?: string;
};

export type PatternKind = "mandala" | "spiral" | "wave" | "polygon" | "fractal";

export type GeometryArtifact = {
  id: string;
  type: "geometry";
  title: string;
  description?: string;
  pattern: {
    kind: PatternKind;
    petals?: number;
    layers?: number;
    caption?: string;
  };
  caption?: string;
};

export type Artifact =
  | GraphArtifact
  | SceneArtifact
  | ScientificArtifact
  | MermaidArtifact
  | GeometryArtifact;

export type AIResponse = {
  id: string;
  content: string;
  artifacts: Artifact[];
  followUps: string[];
  topic?: string;
  meta?: {
    source: "local" | "llm";
    model?: string;
    latency?: number;
  };
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  artifacts?: Artifact[];
  followUps?: string[];
  meta?: AIResponse["meta"];
  createdAt: number;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  subject?: string;
};

export type EngineContext = {
  lastScene?: SceneConfig;
  lastPreset?: string;
  topic?: string;
  exam?: "jee" | "neet" | "boards" | "general";
};

export type AIConfig = {
  provider: "local" | "openai" | "openrouter" | "groq" | "gemini" | "custom";
  apiKey: string;
  model: string;
  baseUrl?: string;
};

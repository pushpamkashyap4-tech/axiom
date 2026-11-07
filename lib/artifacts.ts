import { presetByKey } from "./presets";
import type {
  Artifact,
  GeometryArtifact,
  GraphArtifact,
  MermaidArtifact,
  PlotSeries,
  SceneArtifact,
  SceneConfig,
  ScientificArtifact,
} from "./types";
import { uid } from "./utils";

type GraphOpts = Omit<GraphArtifact, "id" | "type" | "title" | "expressions">;

export function graph(
  title: string,
  expressions: PlotSeries[],
  opts: GraphOpts = {}
): GraphArtifact {
  return { id: uid("graph"), type: "graph", title, expressions, ...opts };
}

export function scientific(preset: string, caption?: string, titleOverride?: string): ScientificArtifact {
  const presetData = presetByKey[preset];
  return {
    id: uid("sci"),
    type: "scientific",
    title: titleOverride ?? presetData?.title ?? "Scientific plot",
    description: presetData?.blurb,
    preset,
    caption: caption ?? presetData?.insight,
  };
}

export function scene3d(title: string, config: SceneConfig, opts: Partial<SceneArtifact> = {}): SceneArtifact {
  return { id: uid("scene"), type: "scene3d", title, config, ...opts };
}

export function mermaid(title: string, code: string, opts: Partial<MermaidArtifact> = {}): MermaidArtifact {
  return { id: uid("mmd"), type: "mermaid", title, code, ...opts };
}

export function geometry(
  title: string,
  pattern: GeometryArtifact["pattern"],
  opts: Partial<GeometryArtifact> = {}
): GeometryArtifact {
  return { id: uid("geo"), type: "geometry", title, pattern, ...opts };
}

export function byId(artifacts: Artifact[], id: string) {
  return artifacts.find((artifact) => artifact.id === id);
}

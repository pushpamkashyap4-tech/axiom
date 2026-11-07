import { sciPresets, type SciPreset } from "./catalog";

/**
 * Lightweight retrieval over the plot catalogue: turns "compressibility
 * factor vs pressure" into the right preset without an LLM.
 */

const STOP = new Set([
  "the", "a", "an", "of", "for", "and", "or", "vs", "versus", "with", "without",
  "graph", "graphs", "plot", "plots", "show", "draw", "explain", "me", "please",
  "between", "curve", "curves", "diagram", "chart", "in", "on", "at", "to", "from",
  "how", "does", "do", "is", "are", "what", "why", "give", "sketch", "make",
]);

function flatten(text: string) {
  return text
    .toLowerCase()
    .replace(/[⁻¹²³⁴]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(text: string) {
  return (flatten(text).match(/[a-z0-9]+/g) ?? []).filter((token) => !STOP.has(token));
}


/**
 * Curated synonyms. The catalogue titles are precise but students type
 * differently ("g vs altitude", "arcsin", "boyle temperature"), so ambiguous
 * plots get an explicit vocabulary. Keyed by preset key.
 */
const EXTRA_KEYWORDS: Record<string, string[]> = {
  "photoelectric-kmax": ["photoelectric effect", "kmax", "maximum kinetic energy", "einstein equation"],
  photocurrent: ["photocurrent", "saturation current", "intensity", "stopping potential graph"],
  arrhenius: ["arrhenius", "activation energy", "ln k", "rate constant temperature"],
  ellingham: ["ellingham", "metallurgy", "reducing agent", "delta g vs temperature"],
  "heating-curve": ["heating curve", "latent heat", "phase change", "water heating", "plateau"],
  projectile: ["projectile trajectory", "projectile trajectories", "trajectory", "range of projectile", "path of projectile"],
  "half-life": ["half life", "radioactive decay", "decay law", "activity vs time"],
  "gravitation-g": ["g vs altitude", "gravitational field intensity", "acceleration due to gravity", "variation of g"],
  "normal-distribution": ["normal distribution", "gaussian", "bell curve", "probability density"],
  "fractional-signum": ["fractional part and signum", "greatest integer and fractional"],
  "m-cubic": ["cubic", "cubic curve", "x cubed", "cubic polynomial"],
  "m-modulus": ["modulus", "modulus function", "absolute value", "absolute value function"],
  "m-identity": ["identity", "identity function", "y = x line"],
  "m-quadratic": ["quadratic", "parabola y = ax2", "vertex form"],
  "m-gif": ["greatest integer", "floor", "step function", "gif"],
  "m-fractional": ["fractional part", "sawtooth"],
  "m-exponential": ["exponential", "growth decay", "a^x"],
  "m-logarithm": ["logarithm", "log graph", "log base a"],
  "m-inverse-sin-cos": ["inverse sine", "sin inverse", "arcsin", "inverse cosine", "arccos", "principal value"],
  "m-inverse-tan-cot": ["inverse tangent", "arctan", "inverse cotangent", "arccot"],
  "m-inverse-sec-cosec": ["inverse secant", "arcsec", "inverse cosecant", "arccosec", "boundary transformation"],
  "m-hyperbola": ["hyperbola", "conjugate hyperbola", "asymptotes of hyperbola"],
  "m-rect-hyperbola": ["rectangular hyperbola", "xy = c2", "xy=c^2"],
  "c-radial-distribution-d": ["2p 3p 3d", "penetration", "d orbital radial", "3d radial"],
  "c-compressibility-temperature": ["boyle temperature", "isotherm real gas", "z vs p temperature"],
  "p-stress-strain": ["stress strain", "young modulus", "yield point", "elastic limit", "fracture point"],
  "p-electrostatics-point": ["point charge", "field of point charge"],
  "p-electrostatics-sphere": ["conducting sphere", "non conducting sphere", "solid sphere", "field inside sphere", "uniformly charged sphere"],
  "p-electrostatics-shell": ["spherical shell", "thin shell", "field inside shell", "potential of shell"],
  "p-electrostatics-line-sheet": ["infinite line charge", "infinite sheet", "line charge", "charged sheet"],
  "c-raoult-positive": ["positive deviation", "raoult positive", "non ideal positive"],
  "c-raoult-negative": ["negative deviation", "raoult negative", "non ideal negative"],
  "c-clausius-clapeyron": ["vapour pressure vs temperature", "clausius clapeyron"],
  "c-bp-elevation": ["boiling point elevation", "elevation of boiling point", "colligative boiling"],
  "c-fp-depression": ["freezing point depression", "depression of freezing point", "colligative freezing"],
  "m-area-parabola-line": ["area under curve", "area bounded", "bounded by parabola", "area between parabola and line"],
  "m-area-trig": ["area between sin and cos", "area bounded by trigonometric", "area enclosed trig"],
};

const index = sciPresets.map((preset) => ({
  preset,
  titleTokens: tokens(preset.title),
  chapterTokens: tokens(preset.chapter),
  phrases: [...(preset.keywords ?? []), ...(EXTRA_KEYWORDS[preset.key] ?? [])].map(flatten),
}));

export type CatalogMatch = { preset: SciPreset; score: number };

export function matchCatalog(prompt: string): CatalogMatch | null {
  const haystack = flatten(prompt);
  const promptTokens = new Set(tokens(prompt));
  let best: CatalogMatch | null = null;

  for (const entry of index) {
    let score = 0;

    for (const phrase of entry.phrases) {
      if (phrase.includes(" ") ? haystack.includes(phrase) : promptTokens.has(phrase)) {
        score += phrase.includes(" ") ? 3.2 : 1.8;
      }
    }
    for (const token of entry.titleTokens) if (promptTokens.has(token)) score += 1;
    for (const token of entry.chapterTokens) if (promptTokens.has(token)) score += 0.7;

    if (!best || score > best.score) best = { preset: entry.preset, score };
  }

  if (!best || best.score < 2.4) return null;
  return best;
}

/** Strong signal that the student wants a picture, not prose. */
export function hasPlotIntent(prompt: string) {
  return /\b(plot|graph|curve|sketch|draw|show|visuali[sz]e|vs\.?|versus|variation|bounded|area under|area between|how does .* (vary|change))\b/i.test(
    prompt
  );
}

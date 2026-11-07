# Axiom — Visual AI for JEE, NEET & Boards

> "See the concept. Not just the formula."

Axiom is a glassmorphic study workspace — **light and dark** — that turns natural language into **interactive 2D graphs, 3D scenes, scientific plots, Mermaid diagrams and geometric patterns**. It ships with a complete offline visual engine (108 exam plots), and can optionally route free-form questions through Groq, Google AI Studio (Gemini), OpenAI, OpenRouter or any OpenAI-compatible endpoint.

![Stack](https://img.shields.io/badge/Next.js-15-black) ![TS](https://img.shields.io/badge/TypeScript-5-blue) ![Three](https://img.shields.io/badge/three.js-r187-purple)

**Live:** https://axiom-two-inky.vercel.app  ·  **Deploys from:** this repo, branch `main` (every push to `main` ships to production automatically)

---

## ✨ What's inside

| Area | Details |
| --- | --- |
| **Home** | Glass sidebar, hero prompt bar, 6 tool cards, recent sessions, device stats |
| **AI Chat** | Markdown + KaTeX + tables, streamed-feel staged rendering, artifact cards, follow-up chips, regenerate, copy, sessions saved locally |
| **2D Grapher** | Custom canvas engine (no heavyweight deps): up to 6 functions, zoom/pan/pinch, wheel zoom to cursor, live x/y read-out, curve legend, animated parameter `t`, parametric curves, syntax errors surfaced as toasts + inline state |
| **3D Lab** | react-three-fiber scenes: **FCC / BCC / SC lattices** with face/body/edge diagonal arrows, **electrolytic cell** (anode, cathode, electrolyte, live electron flow), **solenoid** (helix + field lines + current dots), **atomic shells**. Orbit/zoom controls, glass control panel, atom-size slider, auto-rotate, pause |
| **Natural language → 3D** | "Show FCC, highlight face diagonal" → scene; then "change to BCC", "highlight body diagonal", "make atoms bigger", "stop rotating" mutate the open scene in place |
| **Graph library** | **108 plots across 52 chapters**, grouped by subject and chapter with search: kinematics (x–t, v–t, v²–x), projectile velocity & energy, friction, potential-energy curves, gravitation, rotation, stress–strain, terminal velocity, efflux, SHM energy, viscosity, isobaric/isochoric, Otto cycle, blackbody & Wien, point charge / sphere / shell / line-sheet fields, RC & LR circuits, Lenz–Faraday, LCR resonance, mirror & lens formula, prism deviation, YDSE, single slit, grating, stopping potential, binding energy; radial ψ(r), ψ²(r) and 4πr²ψ² for 1s–3d, compressibility Z–P at several temperatures, zero/first-order kinetics, Arrhenius, Gibbs vs extent, Clausius–Clapeyron, Raoult ± deviations, boiling-point elevation, freezing-point depression, Kohlrausch, Freundlich & Langmuir, periodic IE/radius/electron-gain trends, distillation & azeotropes; linear/quadratic/cubic, modulus, signum, GIF, fractional part, exponential & log, all six trig and inverse-trig curves, conics (circle, radical axis, parabola forms, shifted parabola, ellipse, hyperbola, rectangular hyperbola), areas bounded by curves and curve sketching with f′/f″. Shaded regions, parametric auto-fit and parameter sliders where relevant |
| **Diagrams** | Mermaid flowcharts / mind maps / sequence diagrams with live editing, templates, zoom + copy, auto-generation from prompts |
| **Patterns** | Procedural SVG mandala / spiral / wave / star-polygon / Sierpinski generator with symmetry controls |
| **History** | Local persistence, search, grouping (today/yesterday/week), per-session delete, clear-all with confirmation |
| **Settings** | Profile, exam focus, **theme picker directly under Appearance (Light / Dark / System)** applied instantly without a flash, accent colour (cyan/violet/emerald), reduce motion, BYO LLM key (Groq / Google AI Studio / OpenAI / OpenRouter / custom) with model picker and connection test, JSON export |
| **Responsive** | Collapsible desktop sidebar, mobile drawer, bottom tab bar, safe-area padding, touch pinch-zoom on graphs |

## 🧠 Architecture

```
app/
  layout.tsx            Root shell (fonts, KaTeX CSS, toasts, sidebar)
  page.tsx              Home
  chat/                 AI chat screen (Suspense-wrapped)
  tools/grapher|3d|scientific|diagrams
  history/ settings/
  api/ai/route.ts       Server proxy: local engine ⇄ LLM (sanitised JSON)
components/
  app/                  Sidebar, mobile nav, logo, shell
  chat/                 Chat screen, composer, markdown renderer
  viz/                  graph-canvas, scene-canvas, mermaid-block,
                        pattern-svg, scientific-plot, artifact-card
  tools/                Grapher, 3D lab, scientific, diagram screens
  ui/                   Modal (❌ glass close), toast, switch
lib/
  engine.ts             Intent router + natural-language → artifact planner
  knowledge.ts          21 exam topics with explanations, diagrams, quizzes (Physics, Chemistry, Maths + study strategy)
  presets.ts            re-export of the catalogue
  catalog/              108 plot definitions split by subject (+ shared types)
  providers.ts          LLM provider + model catalogues
  use-theme.ts          live colour-mode hook and chart palette
  llm.ts                Provider adapters + strict JSON schema + sanitisation
  artifacts.ts types.ts settings.ts sessions.ts storage.ts utils.ts
```

### How a prompt becomes a visual

1. **Chat → `/api/ai`** with prompt, context (open 3D scene, exam focus) and history.
2. **Local engine** (`lib/engine.ts`) scores the prompt against topic keywords and intent rules (function plot? scene mutation? diagram? quiz? concept?).
3. It emits the same typed JSON shape an LLM would: `{ content, artifacts[], followUps[] }`.
4. `artifacts` map 1:1 to React components (`graph`, `scientific`, `scene3d`, `mermaid`, `geometry`).
5. If an LLM key exists (browser-provided or env), the route asks the model for the same schema, validates/sanitises it, and falls back to the local engine on any failure.

Because both engines share one schema, every visual component works with either brain.

## 🚀 Run it

```bash
npm install
npm run dev        # http://localhost:3000  (turbopack)
# or
npm run build && npm start
```

Optional LLM (server-side):

```bash
cp .env.example .env.local
AI_PROVIDER=openai AI_API_KEY=sk-... AI_MODEL=gpt-4o-mini npm start
```

Students can also paste a key at **Settings → AI engine** (stored in `localStorage`, proxied by the server so it never appears in third-party requests from the browser tab).

Supported providers, all through their OpenAI-compatible chat endpoints:

| Provider | Default model | Get a key |
| --- | --- | --- |
| Groq | `openai/gpt-oss-120b` (also `gpt-oss-20b`, `qwen/qwen3.8-27b`) | console.groq.com/keys |
| Google AI Studio | `gemini-3.5-flash` (also 3.5-flash-lite, 3.1-pro-preview, pro-latest…) | aistudio.google.com/apikey |
| OpenAI | `gpt-4o-mini` | platform.openai.com/api-keys |
| OpenRouter | `openai/gpt-4o-mini` + many others | openrouter.ai/keys |
| Custom | any model id | your own base URL |

Any model id can be typed manually if it is newer than this build.

## 🎨 Design system

- **Glassmorphism**: layered `linear-gradient` surfaces, 1px inner highlights, 22–32px blur, deep navy base (`#05070c`).
- **Accents**: cyan (default), violet, emerald switchable at runtime through CSS variables (`--accent`).
- **Type**: Space Grotesk (display) + Plus Jakarta Sans (UI), bundled locally via Fontsource — no network fonts.
- **Motion**: Framer Motion for entrances, shared layout indicators in nav; respects `prefers-reduced-motion` and the in-app reduce-motion switch.
- **Icons**: Lucide, rendered inside glass chips; modals use a distinct circular ❌ close with rose hover glow.

## 📱 Preview notes

The sandboxed in-app preview runs the production server. 3D scenes need WebGL — supported in all modern browsers; in headless CI environments software rendering (`--enable-unsafe-swiftshader`) is required.

## ✅ Verification

- `npx tsc --noEmit` — clean
- `next build` — 12 routes, static pages + one API route
- Playwright smoke tests: home, grapher, 3D lab, scientific, diagrams, history, settings, mobile home/chat/3D, chat → "Show FCC…" → "Change to BCC" (scene mutates, no console errors)

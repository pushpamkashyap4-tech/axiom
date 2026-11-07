# Axiom — Visual AI for JEE, NEET & Boards

> "See the concept. Not just the formula."

Axiom is a glassmorphic, dark-first study workspace that turns natural language into **interactive 2D graphs, 3D scenes, scientific plots, Mermaid diagrams and geometric patterns**. It ships with a complete offline visual engine, and can optionally route free-form questions through any OpenAI-compatible LLM.

![Stack](https://img.shields.io/badge/Next.js-15-black) ![TS](https://img.shields.io/badge/TypeScript-5-blue) ![Three](https://img.shields.io/badge/three.js-r187-purple)

---

## ✨ What's inside

| Area | Details |
| --- | --- |
| **Home** | Glass sidebar, hero prompt bar, 6 tool cards, recent sessions, device stats |
| **AI Chat** | Markdown + KaTeX + tables, streamed-feel staged rendering, artifact cards, follow-up chips, regenerate, copy, sessions saved locally |
| **2D Grapher** | Custom canvas engine (no heavyweight deps): up to 6 functions, zoom/pan/pinch, wheel zoom to cursor, live x/y read-out, curve legend, animated parameter `t`, parametric curves, syntax errors surfaced as toasts + inline state |
| **3D Lab** | react-three-fiber scenes: **FCC / BCC / SC lattices** with face/body/edge diagonal arrows, **electrolytic cell** (anode, cathode, electrolyte, live electron flow), **solenoid** (helix + field lines + current dots), **atomic shells**. Orbit/zoom controls, glass control panel, atom-size slider, auto-rotate, pause |
| **Natural language → 3D** | "Show FCC, highlight face diagonal" → scene; then "change to BCC", "highlight body diagonal", "make atoms bigger", "stop rotating" mutate the open scene in place |
| **Scientific plots** | 26 curated presets: P–V isothermal vs adiabatic, SHM x/v/a, photoelectric (Kmax–ν, photocurrent), Maxwell–Boltzmann, Raoult ideal/±deviation, Arrhenius, first-order kinetics (both plots), Ellingham, Nernst, heating curve, inverse trig, fractional part & signum, conics, projectile, standing & progressive waves, AC phasors, half-life, Bohr levels, lens formula, diode I–V, g vs altitude, normal distribution, solenoid axial field + more. Interactive parameter sliders on many presets |
| **Diagrams** | Mermaid flowcharts / mind maps / sequence diagrams with live editing, templates, zoom + copy, auto-generation from prompts |
| **Patterns** | Procedural SVG mandala / spiral / wave / star-polygon / Sierpinski generator with symmetry controls |
| **History** | Local persistence, search, grouping (today/yesterday/week), per-session delete, clear-all with confirmation |
| **Settings** | Profile, exam focus, accent theme (cyan/violet/emerald), reduce motion, BYO LLM key (OpenAI / OpenRouter / Groq / custom), connection test, JSON export |
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
  presets.ts            26 scientific plot definitions
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

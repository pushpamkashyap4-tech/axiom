import { geometry, graph, mermaid, scene3d, scientific } from "./artifacts";
import type { Artifact, CrystalHighlight, CrystalLattice } from "./types";

export type TopicBuildResult = {
  content: string;
  artifacts: Artifact[];
  followUps: string[];
};

export type Topic = {
  id: string;
  title: string;
  subject: "Physics" | "Chemistry" | "Mathematics" | "Study Skills";
  chapter: string;
  keywords: string[];
  strength?: number;
  build: (prompt: string) => TopicBuildResult;
  quiz?: { q: string; a: string }[];
  diagram?: string;
  hasGraph?: boolean;
  hasScene?: boolean;
};

const examNote = (text: string) => `> **Exam lens** — ${text}`;

/* ------------------------------------------------------------------ */
/* Shared diagrams                                                     */
/* ------------------------------------------------------------------ */

const studyLoop = `flowchart TD
    Q["Read the question"] --> ID["Identify the concept"]
    ID --> F["Write the governing formula"]
    F --> D["Draw / visualise the situation"]
    D --> S["Substitute and solve"]
    S --> C["Check units & limits"]
    C --> R["Reflect: what changed?"]
    R --> Q`;

const photoelectricDiagram = `flowchart LR
    L["Light photon\\nhν"] --> M["Metal surface"]
    M -->|"ν ≥ ν₀"| E["Photoelectron\\nK = hν − φ"]
    M -->|"ν < ν₀"| N["No emission"]
    E --> A["Anode / collector"]
    A --> I["Photocurrent"]`;

const cellDiagram = `flowchart LR
    subgraph EXT["External circuit"]
        E1["e⁻"] --> W["Wire"] --> E2["e⁻"]
    end
    subgraph CELL["Electrolytic cell"]
        AN["Anode (+)\noxidation"] -->|"ions migrate"| CA["Cathode (−)\nreduction"]
    end
    W --> AN
    E2 --> CA`;

const crystalDiagram = `flowchart TD
    U["Unit cell"] --> S["Simple cubic<br/>1 atom"]
    U --> B["BCC<br/>2 atoms"]
    U --> F["FCC / ccp<br/>4 atoms"]
    B --> BD["Body diagonal = √3a"]
    F --> FD["Face diagonal = √2a"]
    S --> ED["Edge = a"]`;

const vseprDiagram = `mindmap
  root((Molecular shape))
    Two pairs
      Linear
      CO2
    Three pairs
      Trigonal planar
      BF3
    Four pairs
      Tetrahedral
      CH4
    Five pairs
      Trigonal bipyramidal
      PCl5
    Six pairs
      Octahedral
      SF6`;

const thermoDiagram = `flowchart LR
    A["Thermodynamic process"] --> B{"Heat exchanged?"}
    B -->|"yes, slowly"| C["Isothermal<br/>ΔT = 0, PV = k"]
    B -->|"no"| D["Adiabatic<br/>Q = 0, PV^γ = k"]
    C --> C1["W = nRT ln(V2/V1)"]
    D --> D1["W = (P1V1 − P2V2)/(γ−1)"]`;

const solutionDiagram = `flowchart TD
    S["Binary solution"] --> I{"A–B interactions"}
    I -->|"similar to A–A, B–B"| ID["Ideal<br/>Raoult's law obeyed"]
    I -->|"weaker"| P["Positive deviation<br/>higher vapour pressure"]
    I -->|"stronger"| N["Negative deviation<br/>lower vapour pressure"]
    ID --> C["Colligative properties"]`;

const kinematicsDiagram = `flowchart LR
    Q["Motion problem"] --> A{"Constant acceleration?"}
    A -->|"yes"| E["Use v = u + at<br/>s = ut + ½at²<br/>v² = u² + 2as"]
    A -->|"no"| G["Use graphs<br/>area under v–t"]
    E --> S["Split into axes"]
    G --> S
    S --> C["Check signs and units"]`;

/* ------------------------------------------------------------------ */
/* Topics                                                              */
/* ------------------------------------------------------------------ */

export const topics: Topic[] = [
  {
    id: "crystal",
    title: "Crystal Lattices & Unit Cells",
    subject: "Chemistry",
    chapter: "Solid State",
    keywords: ["fcc", "bcc", "sc", "unit cell", "lattice", "crystal", "face diagonal", "body diagonal", "packing", "atom sphere", "lattice parameter"],
    strength: 3,
    hasScene: true,
    diagram: crystalDiagram,
    build: (prompt) => {
      const p = prompt.toLowerCase();
      const lattice: CrystalLattice = /bcc|body.?cent/.test(p) ? "bcc" : /simple cubic|\bsc\b/.test(p) ? "sc" : "fcc";
      const highlight: CrystalHighlight = /body.?diag/.test(p) || lattice === "bcc" ? "body-diagonal" : /edge/.test(p) || lattice === "sc" ? "edge" : "face-diagonal";

      const latticeInfo = {
        fcc: {
          title: "Face-centred cubic lattice",
          label: "FCC",
          atoms: "4 atoms / cell — 8 corners × ⅛ + 6 faces × ½",
          along: "the face diagonal",
          relation: "$4r = \\sqrt{2}\\,a \\Rightarrow r = \\dfrac{a}{2\\sqrt{2}} \\approx 0.354\\,a$",
          packing: "74%",
          example: "Cu, Ag, Au, Al",
        },
        bcc: {
          title: "Body-centred cubic lattice",
          label: "BCC",
          atoms: "2 atoms / cell — 8 corners × ⅛ + 1 body centre",
          along: "the body diagonal",
          relation: "$4r = \\sqrt{3}\\,a \\Rightarrow r = \\dfrac{\\sqrt{3}}{4}\\,a \\approx 0.433\\,a$",
          packing: "68%",
          example: "Fe at room temperature, Cr, W, Na",
        },
        sc: {
          title: "Simple cubic lattice",
          label: "SC",
          atoms: "1 atom / cell — 8 corners × ⅛",
          along: "the cell edge",
          relation: "$a = 2r \\Rightarrow r = \\dfrac{a}{2} = 0.5\\,a$",
          packing: "52.4%",
          example: "Po (the only element that adopts it)",
        },
      }[lattice];

      const highlightInfo = {
        "face-diagonal": {
          caption: "Face diagonal = √2·a. Corner and face-centre atoms touch along it, giving r = a/(2√2).",
          note: "The **face diagonal** of the cube is $d = \\sqrt{a^2+a^2} = \\sqrt{2}\\,a$.",
        },
        "body-diagonal": {
          caption: "Body diagonal = √3·a. The corner atoms touch the body-centre atom along it, giving r = √3a/4.",
          note: "The **body diagonal** of the cube is $d = \\sqrt{a^2+a^2+a^2} = \\sqrt{3}\\,a$.",
        },
        edge: {
          caption: "Edge = 2r. Adjacent corner atoms touch along the cell edge, giving r = a/2.",
          note: "Atoms touch along the **cell edge**, so $d = a$.",
        },
        null: { caption: "", note: "" },
      }[highlight ?? "face-diagonal"];

      return {
        content: `### ${latticeInfo.label} — ${latticeInfo.title}
A unit cell is the **smallest repeating block** of a crystal. In **${latticeInfo.label}** it contains ${latticeInfo.atoms}, and atoms touch along *${latticeInfo.along}*.

${highlightInfo.note} Setting it equal to the sum of touching radii gives

$$${latticeInfo.relation}$$

so the packing fraction is **${latticeInfo.packing}**. Typical examples: ${latticeInfo.example}.

| Lattice | Atoms / cell | Atoms touch along | Packing fraction |
| --- | --- | --- | --- |
| Simple cubic (SC) | 1 | edge, $a = 2r$ | 52.4% |
| Body-centred (BCC) | 2 | body diagonal, $\\sqrt{3}a = 4r$ | 68% |
| Face-centred (FCC / ccp) | 4 | face diagonal, $\\sqrt{2}a = 4r$ | 74% |

The 3D model below is live — drag to orbit it, open the controls to switch lattice type, toggle the diagonal highlight and change the lattice parameter.

${examNote("FCC has the highest packing efficiency (74%) and is the structure of Cu, Ag, Au. BCC (68%) is Fe at room temperature; SC (52.4%) is rare and only Po adopts it.")}`,
        artifacts: [
          scene3d(
            latticeInfo.title,
            { type: "crystal", lattice, highlight, showCell: true, showHighlight: true, atomScale: 0.52, autoRotate: true },
            {
              description: "Drag to orbit · scroll to zoom · toggle a diagonal to see how atoms touch",
              caption: highlightInfo.caption,
            }
          ),
          mermaid("Lattice classification", crystalDiagram),
        ],
        followUps: ["Change to BCC and highlight the body diagonal", "Show an electrolytic cell in 3D", "Why is FCC packing 74% and not 100%?"],
      };
    },
    quiz: [
      { q: "How many atoms are effectively present in one FCC unit cell?", a: "4 atoms (8 corners × ⅛ + 6 faces × ½)." },
      { q: "For BCC, what is the relation between atomic radius r and edge a?", a: "√3·a = 4r, so r = √3a/4." },
      { q: "Which lattice has the highest packing efficiency?", a: "FCC (74%), followed by BCC (68%) and SC (52.4%)." },
    ],
  },
  {
    id: "electrolytic",
    title: "Electrolytic Cell",
    subject: "Chemistry",
    chapter: "Electrochemistry",
    keywords: ["electrolytic", "electrolysis", "electrochemical cell", "galvanic", "daniel cell", "anode", "cathode", "salt bridge", "electron flow"],
    strength: 2,
    hasScene: true,
    diagram: cellDiagram,
    build: () => ({
      content: `### Inside an electrolytic cell
An electrolytic cell uses an **external power source** to force a non-spontaneous redox reaction. The battery pulls electrons out of the anode and pushes them into the cathode.

| Part | Charge | Reaction | Sign (electrolytic) |
| --- | --- | --- | --- |
| Anode | Oxidation | e.g. $2Cl^- \\rightarrow Cl_2 + 2e^-$ | Positive |
| Cathode | Reduction | e.g. $Cu^{2+} + 2e^- \\rightarrow Cu$ | Negative |

Electrons travel **only through the wire** (anode → battery → cathode). Inside the electrolyte, charge is carried by *ions*, not electrons — that is the single most common exam trap.

Faraday's first law: $m = \\dfrac{ZIt}{F}$, with $Z = M/n$.

The 3D cell below shows electrodes, electrolyte, wires and the live electron flow. Rotate it and toggle the labels to label the parts yourself.

${examNote("In a galvanic cell the anode is negative; in an electrolytic cell the anode is positive. Always fix the cell type before assigning signs.")}`,
      artifacts: [
        scene3d(
          "Electrolytic cell — 3D",
          { type: "electrolytic", electrolyte: "CuSO₄ solution", showLabels: true, showFlow: true, autoRotate: false },
          { description: "Battery drives electrons from anode to cathode through the wire", caption: "Anode (+): oxidation. Cathode (−): reduction. Ions carry current inside the solution." }
        ),
        mermaid("Electron and ion flow", cellDiagram),
      ],
      followUps: ["Show FCC in 3D", "Explain Faraday's laws with a worked example", "What is the Nernst equation?"],
    }),
  },
  {
    id: "magnetism",
    title: "Solenoid & Magnetic Field",
    subject: "Physics",
    chapter: "Moving Charges and Magnetism",
    keywords: ["solenoid", "magnetic field", "field line", "ampere", "biot", "current carrying", "inductor", "magnetism", "bar magnet"],
    strength: 2,
    hasGraph: true,
    hasScene: true,
    build: (prompt) => {
      const wants3d = /3d|model|show\b/.test(prompt.toLowerCase());
      const artifacts: Artifact[] = [
        scene3d(
          "Solenoid with field lines — 3D",
          { type: "solenoid", turns: 12, showField: true, showCurrent: true, autoRotate: true },
          { description: "Field lines are parallel inside and loop outside like a bar magnet", caption: "B_inside = μ₀nI, independent of the radius of the solenoid." }
        ),
        scientific("solenoid-field", "B is nearly constant inside a long solenoid and falls to half its central value at the ends."),
      ];
      if (!wants3d) {
        artifacts.reverse();
      }
      return {
        content: `### The solenoid, from wire to field
A solenoid is a helix of wire. Each loop behaves like a tiny magnetic dipole; their fields add up to give a **uniform interior field** along the axis.

- Inside (far from ends): $B = \\mu_0 n I$, where $n = N/L$ is turns per unit length.
- At either end: $B \\approx \\dfrac{\\mu_0 n I}{2}$.
- Outside: the lines spread out just like a bar magnet — north at one end, south at the other.

**Ampère's law** gives this instantly: take a rectangular loop straddling the wall, only the inside segment contributes, so $B\\ell = \\mu_0 n \\ell I$.

| Location | Field |
| --- | --- |
| Deep inside | $\\mu_0 n I$ (uniform) |
| At the end | $\\mu_0 n I / 2$ |
| Far outside | ≈ 0 |

${examNote("A long solenoid is used as a standard for uniform magnetic fields — the field does not depend on position inside, only on n and I.")}`,
        artifacts,
        followUps: ["Show the field along the axis as a graph", "Magnetic field of a toroid", "Explain electromagnetic induction"],
      };
    },
    quiz: [
      { q: "Write the magnetic field inside a long solenoid.", a: "B = μ₀nI, directed along the axis." },
      { q: "What is B at the end of a long solenoid?", a: "Approximately μ₀nI/2, half the central value." },
    ],
  },
  {
    id: "photoelectric",
    title: "Photoelectric Effect",
    subject: "Physics",
    chapter: "Dual Nature of Radiation and Matter",
    keywords: ["photoelectric", "photoelectron", "work function", "threshold", "stopping potential", "dual nature", "einstein equation", "photocell"],
    strength: 3,
    hasGraph: true,
    diagram: photoelectricDiagram,
    build: () => ({
      content: `### One photon, one electron
Light of frequency $\\nu$ arrives as photons of energy $E = h\\nu$. If a photon gives all its energy to one electron, the electron escapes with at most

$$K_{max} = h\\nu - \\phi = h\\nu - h\\nu_0$$

where $\\phi$ is the **work function** and $\\nu_0 = \\phi/h$ the **threshold frequency**. A more intense beam carries more photons, so the *current* grows — but each electron still gets the same $h\\nu$, so $K_{max}$ stays the same.

| Observation | Classical wave theory | Photon picture |
| --- | --- | --- |
| Threshold frequency | ✗ cannot explain | ✓ one photon = one electron |
| Instant emission | ✗ needs build-up time | ✓ |
| $K_{max}$ independent of intensity | ✗ | ✓ |

The **stopping potential** satisfies $eV_0 = K_{max}$, so $V_0$ grows linearly with $\\nu$ and is independent of intensity.

${examNote("Slope of the V₀–ν line is h/e for every metal. The x-intercept gives ν₀; the y-intercept magnitude gives φ/e.")}`,
      artifacts: [
        graph(
          "K_max vs frequency — threshold cut-off",
          [
            { expression: "0.414*(x-5)", label: "Metal 1 (φ = 2.07 eV)", color: "#22d3ee" },
            { expression: "0.414*(x-11)", label: "Metal 2 (φ = 4.55 eV)", color: "#a78bfa" },
          ],
          {
            xRange: [0, 20],
            yRange: [-3, 9],
            xLabel: "ν (×10¹⁴ Hz)",
            yLabel: "K_max (eV)",
            markers: [
              { x: 5, label: "ν₀₁", color: "#22d3ee" },
              { x: 11, label: "ν₀₂", color: "#a78bfa" },
            ],
            caption: "Straight lines, same slope h — different intercepts because work functions differ.",
          }
        ),
        scientific("photocurrent", "Intensity changes saturation current; frequency (through V₀) shifts the stopping potential."),
        mermaid("Photon → electron", photoelectricDiagram),
      ],
      followUps: ["Plot photocurrent vs potential", "Show the UV catastrophe and Planck's law", "Solve a photoelectric numerical"],
    }),
    quiz: [
      { q: "Photoelectric current is proportional to what?", a: "Intensity of incident light (for ν > ν₀)." },
      { q: "Stopping potential depends on which quantity?", a: "Frequency of the incident light, not intensity." },
      { q: "Given φ = 2 eV and ν = 1.5×10¹⁵ Hz, find Kmax.", a: "E = hν = 6.2 eV, so Kmax = 6.2 − 2 ≈ 4.2 eV." },
    ],
  },
  {
    id: "thermodynamics",
    title: "Thermodynamics & P–V Processes",
    subject: "Physics",
    chapter: "Thermodynamics",
    keywords: ["thermodynamic", "isothermal", "adiabatic", "p-v", "pv diagram", "first law", "heat engine", "carnot", "entropy", "polytropic", "gas process", "work done by gas"],
    strength: 2,
    hasGraph: true,
    diagram: thermoDiagram,
    build: () => ({
      content: `### Same gas, two different paths
On a P–V diagram, **work is the area under the curve**, so the *path* matters — not just the endpoints.

- **Isothermal** (ΔT = 0): $PV = nRT = k$, curve $P \\propto 1/V$; $W = nRT\\ln(V_2/V_1)$; ΔU = 0, so Q = W.
- **Adiabatic** (Q = 0): $PV^\\gamma = k$, steeper by a factor $\\gamma$; $W = \\dfrac{P_1V_1 - P_2V_2}{\\gamma - 1}$; the gas cools on expansion.

| Feature | Isothermal | Adiabatic |
| --- | --- | --- |
| Temperature | constant | changes |
| Heat | exchanged | zero |
| Slope of P–V curve | $-P/V$ | $-\\gamma P/V$ |
| Speed | very slow | very fast / insulated |

Because $\\gamma > 1$, the adiabatic curve falls faster. Both curves start together in the plot (same state) and separate immediately.

${examNote("If a process is both slow and insulated — impossible. Slow means heat exchange with surroundings; insulated means no heat exchange. Processes are ideal limits.")}`,
      artifacts: [
        scientific("pv-isothermal-adiabatic", "Drag the sliders: higher γ makes the adiabatic curve steeper."),
        mermaid("Choosing the right process", thermoDiagram),
      ],
      followUps: ["Draw a Carnot cycle on the P–V diagram", "Explain entropy with a diagram", "Show the heating curve of water"],
    }),
    quiz: [
      { q: "For an adiabatic process, Q is…", a: "Zero, so ΔU = −W." },
      { q: "Which curve is steeper on a P–V diagram, isothermal or adiabatic?", a: "Adiabatic, because the slope is γ times the isothermal slope." },
    ],
  },
  {
    id: "shm",
    title: "Simple Harmonic Motion",
    subject: "Physics",
    chapter: "Oscillations",
    keywords: ["shm", "simple harmonic", "oscillation", "pendulum", "displacement velocity acceleration", "spring mass", "amplitude", "time period", "phase difference"],
    strength: 3,
    hasGraph: true,
    build: () => ({
      content: `### x, v and a — the SHM trio
For SHM with amplitude $A$ and angular frequency $\\omega$:

$$x = A\\sin\\omega t,\\quad v = A\\omega\\cos\\omega t,\\quad a = -A\\omega^2\\sin\\omega t = -\\omega^2 x$$

So **velocity leads displacement by π/2** and **acceleration is anti-phase (π)**. This is why the three curves interleave the way they do.

| At position | x | v | a |
| --- | --- | --- | --- |
| Mean (x = 0) | 0 | ±Aω (max) | 0 |
| Extreme (x = ±A) | ±A | 0 | ∓Aω² (max) |

Useful relations: $v = \\omega\\sqrt{A^2 - x^2}$, $T = 2\\pi\\sqrt{m/k}$ for a spring, and $T = 2\\pi\\sqrt{L/g}$ for a pendulum.

${examNote("The graphs of x, v and a are three sinusoids of the same frequency but scaled by ω and ω². In a graph question, check the phase offset before the amplitude.")}`,
      artifacts: [
        scientific("shm", "Change A and ω with the sliders — notice how the velocity and acceleration amplitudes scale."),
      ],
      followUps: ["Show energy in SHM", "Plot a damped oscillation", "Show a standing wave"],
    }),
    quiz: [
      { q: "At the mean position, which quantity is maximum?", a: "Velocity is maximum; acceleration is zero." },
      { q: "What is the phase difference between x and a in SHM?", a: "π (anti-phase)." },
    ],
  },
  {
    id: "electrostatics",
    title: "Electrostatics & Coulomb's Law",
    subject: "Physics",
    chapter: "Electric Charges and Fields",
    keywords: ["electrostatic", "coulomb", "electric field", "gauss", "dipole", "electric potential", "charge", "flux", "capacitor"],
    strength: 2,
    hasGraph: true,
    build: () => ({
      content: `### Field vs potential — two different personalities
Coulomb's law says $F = \\dfrac{1}{4\\pi\\varepsilon_0}\\dfrac{q_1q_2}{r^2}$. The field of a point charge is $E = kq/r^2$ (vector), and the potential is $V = kq/r$ (scalar).

| Quantity | Falls off as | Type | Superposition |
| --- | --- | --- | --- |
| Field $E$ | $1/r^2$ | vector | vector sum |
| Potential $V$ | $1/r$ | scalar | simple sum |

Because $E = -dV/dr$, the field is the **slope** of the potential graph. Both curves below share the same $1/r$ DNA, but the field decays faster and flips sign direction with charge.

Gauss's law: $\\oint \\vec{E}\\cdot d\\vec{A} = \\dfrac{q_{enc}}{\\varepsilon_0}$ — choose surfaces that match the symmetry: sphere for a point charge, cylinder for a line, pillbox for a sheet.

${examNote("Inside a conductor in electrostatic equilibrium, E = 0 and V is constant everywhere — a very frequent assertion–reason question.")}`,
      artifacts: [
        graph(
          "E and V around a point charge (normalised)",
          [
            { expression: "5/x^2", label: "Field ∝ 1/r²", color: "#fb7185" },
            { expression: "5/x", label: "Potential ∝ 1/r", color: "#22d3ee" },
          ],
          { xRange: [0.4, 8], xLabel: "distance r", yLabel: "magnitude (a.u.)", caption: "The potential's slope at any r gives the field there." }
        ),
        mermaid("Electrostatics toolkit", `mindmap
  root((Electrostatics))
    Charges
      Coulomb force
      Superposition
    Field
      Point charge 1/r2
      Dipole
    Potential
      Scalar 1/r
      Equipotentials
    Gauss law
      Sphere
      Cylinder
      Sheet`),
      ],
      followUps: ["Derive the field of a dipole", "Show a capacitor and dielectrics", "Explain Gauss's law with a diagram"],
    }),
  },
  {
    id: "capacitor",
    title: "Capacitance & Dielectrics",
    subject: "Physics",
    chapter: "Electrostatic Potential and Capacitance",
    keywords: ["capacitor", "capacitance", "dielectric", "parallel plate", "energy stored", "series capacitor", "parallel capacitor"],
    strength: 2,
    hasGraph: true,
    build: () => ({
      content: `### Store charge, store energy
A capacitor stores charge $Q = CV$ and energy $U = \\tfrac12 CV^2 = \\tfrac12 QV = \\dfrac{Q^2}{2C}$.

For a parallel-plate capacitor: $C = \\dfrac{\\varepsilon_0 A}{d}$, and with a dielectric slab of constant $K$, $C = \\dfrac{K\\varepsilon_0 A}{d}$.

| Combination | Equivalent C | Charge | Voltage |
| --- | --- | --- | --- |
| Series | $1/C = \\sum 1/C_i$ | same on each | adds up |
| Parallel | $C = \\sum C_i$ | adds up | same on each |

The Q–V graph is a straight line of slope C: steeper line = larger capacitance. Energy is the area under it.

${examNote("Inserting a dielectric at constant voltage raises charge (battery supplies work); at constant charge, the voltage drops. Read the question carefully for which one is held fixed.")}`,
      artifacts: [
        graph(
          "Charge vs voltage for different capacitances",
          [
            { expression: "2*x", label: "C = 2 μF", color: "#22d3ee" },
            { expression: "4*x", label: "C = 4 μF", color: "#a78bfa" },
            { expression: "6*x", label: "C = 6 μF", color: "#34d399" },
          ],
          { xRange: [0, 10], yRange: [0, 65], xLabel: "Voltage V (V)", yLabel: "Charge Q (μC)", caption: "Slope = C. Energy stored is the triangular area under each line." }
        ),
      ],
      followUps: ["Explain what happens when a dielectric is inserted", "Derive energy stored in a capacitor", "Show a Gauss's law application"],
    }),
  },
  {
    id: "current",
    title: "Current Electricity",
    subject: "Physics",
    chapter: "Current Electricity",
    keywords: ["current electricity", "ohm", "resistance", "resistivity", "drift velocity", "kirchhoff", "wheatstone", "potentiometer", "circuit", "emf", "internal resistance"],
    strength: 1.5,
    hasGraph: true,
    build: () => ({
      content: `### Ohm's law has a graph you can read
$V = IR$ is straight through the origin — slope = resistance. A **non-ohmic** device (diode, filament lamp) bends.

Drift velocity $v_d = \\dfrac{I}{neA}$ is tiny (mm/s), yet the signal travels near light speed because the *field* is established almost instantly. Resistivity: $\\rho = \\dfrac{m}{ne^2\\tau}$, and $R = \\rho L/A$.

| Element | Behaviour |
| --- | --- |
| Ohmic conductor | linear, constant R |
| Filament lamp | R increases as it heats |
| Diode | negligible reverse current, exponential forward |

Kirchhoff: junction rule (charge conservation), loop rule (energy conservation). Wheatstone bridge balances when $P/Q = R/S$; the potentiometer compares emfs without drawing current.

${examNote("Ammeter in series (low resistance), voltmeter in parallel (high resistance). Reversing a battery in a meter question flips the sign, not the magnitude.")}`,
      artifacts: [
        graph(
          "V–I characteristics: ohmic vs non-ohmic",
          [
            { expression: "2*x", label: "Ohmic resistor", color: "#22d3ee" },
            { expression: "0.08*x^2 + 0.4*x", label: "Filament lamp", color: "#fbbf24" },
            { expression: "x < 0 ? -0.02 : 0.03*(exp(6*x)-1)", label: "Diode", color: "#34d399" },
          ],
          { xRange: [0, 4], yRange: [0, 14], xLabel: "Current I (A)", yLabel: "Voltage V (V)", caption: "Slope at a point = dynamic resistance. The lamp's resistance rises with temperature." }
        ),
        mermaid("Circuit problem strategy", `flowchart TD
    A["Simplify the circuit"] --> B["Series / parallel reduction"]
    B --> C{"More than one battery?"}
    C -->|"yes"| D["Kirchhoff loops"]
    C -->|"no"| E["Ohm's law per branch"]
    D --> F["Solve simultaneous equations"]
    E --> F
    F --> G["Check power balance"]`),
      ],
      followUps: ["Explain a Wheatstone bridge", "Plot a potentiometer experiment", "Show the electrolytic cell"],
    }),
  },
  {
    id: "emi-ac",
    title: "Electromagnetic Induction & AC",
    subject: "Physics",
    chapter: "EMI and Alternating Current",
    keywords: ["emi", "faraday", "lenz", "induced emf", "motional emf", "alternating current", "ac circuit", "ac waveform", "transformer", "impedance", "reactance", "resonance", "lc circuit", "phasor"],
    strength: 2,
    hasGraph: true,
    build: () => ({
      content: `### Change is what matters
Faraday's law: $\\varepsilon = -\\dfrac{d\\Phi}{dt}$. Lenz's sign says the induced current **opposes the change** that created it — nature's inertia.

A coil rotating in a field produces $\\varepsilon = NBA\\omega\\sin\\omega t$ — sinusoidal AC. For an inductor, current lags voltage; for a capacitor, current leads. The impedance triangle gives $Z = \\sqrt{R^2 + (X_L - X_C)^2}$.

| Circuit | Phase of current |
| --- | --- |
| Pure R | in phase |
| Pure L | lags by 90° |
| Pure C | leads by 90° |
| Series RLC at resonance | in phase, $X_L = X_C$ |

At resonance $f = \\dfrac{1}{2\\pi\\sqrt{LC}}$, impedance is minimum and current is maximum — the basis of tuning circuits.

${examNote("Lenz's law is just energy conservation in disguise: to produce electrical energy, mechanical work must be done against the opposing magnetic force.")}`,
      artifacts: [
        scientific("ac-waveform", "In an RL circuit current lags by φ = tan⁻¹(X_L/R)."),
        mermaid("Induction decision tree", `flowchart TD
    C["Flux changes"] --> E["Induced emf = −dΦ/dt"]
    E --> L["Lenz: opposes the change"]
    E --> M{"What changes?"}
    M -->|"B"| B["Coil in varying field"]
    M -->|"Area"| A["Motional emf Blv"]
    M -->|"Orientation"| R["Rotating coil: NBAω sin ωt"]`),
      ],
      followUps: ["Explain a transformer", "Show AC through an inductor", "Derive motional emf"],
    }),
  },
  {
    id: "optics",
    title: "Ray Optics: Lenses & Mirrors",
    subject: "Physics",
    chapter: "Ray Optics and Optical Instruments",
    keywords: ["lens", "mirror", "refraction", "ray optics", "magnification", "focal length", "prism", "total internal reflection", "optical instrument", "snell"],
    strength: 2,
    hasGraph: true,
    build: () => ({
      content: `### Thin lens, thick consequences
The lens formula $\\dfrac{1}{v} - \\dfrac{1}{u} = \\dfrac{1}{f}$ and magnification $m = \\dfrac{v}{u}$ hold with a **sign convention**: distances measured against the incident light are negative.

| Object position | Image (convex lens) |
| --- | --- |
| Beyond 2f | real, inverted, diminished |
| At 2f | real, inverted, same size |
| Between f and 2f | real, inverted, magnified |
| At f | at infinity |
| Inside f | virtual, erect, magnified |

Snell's law: $n_1\\sin i = n_2\\sin r$. Total internal reflection occurs beyond the critical angle $\\sin C = 1/n$ — the mechanism behind optical fibres and mirage.

${examNote("For a convex lens, v is positive for real images (opposite side) and negative for virtual images (same side). Never plug in signs without drawing the diagram first.")}`,
      artifacts: [
        scientific("lens-image", "Notice the vertical asymptote at u = f: the image runs off to infinity."),
        mermaid("Image formation steps", `flowchart TD
    A["Ray from object top"] --> B["Parallel ray → through focus"]
    A --> C["Through optical centre → undeviated"]
    B --> D["Intersection"]
    C --> D
    D --> E["Image position & nature"]`),
      ],
      followUps: ["Show the lens formula graph", "Explain total internal reflection", "Show the human eye as an optical instrument"],
    }),
  },
  {
    id: "atom",
    title: "Atomic Structure & Bohr Model",
    subject: "Physics",
    chapter: "Atoms",
    keywords: ["bohr", "atom", "hydrogen spectrum", "energy level", "quantum number", "orbital", "electron configuration", "rydberg", "de broglie", "spectral line"],
    strength: 2,
    hasGraph: true,
    hasScene: true,
    build: () => ({
      content: `### Quantised, not continuous
Bohr's model gives hydrogen energy levels $E_n = -\\dfrac{13.6}{n^2}\\ \text{eV}$ and radii $r_n = 0.529\\,n^2\\ \text{Å}$.

Transitions emit $h\\nu = E_{n_2} - E_{n_1}$, giving the spectral series (Lyman in UV, Balmer in visible, Paschen and beyond in IR). The levels crowd toward $E = 0$ as n grows — that's why the series limits converge.

| Series | Transition to | Region |
| --- | --- | --- |
| Lyman | n = 1 | UV |
| Balmer | n = 2 | visible |
| Paschen | n = 3 | IR |

This model explains spectra but fails for multi-electron atoms — that requires orbitals, quantum numbers and Pauli's exclusion principle.

${examNote("In Bohr's model, angular momentum is quantised: mvr = nh/2π. It is a *postulate*, not derived — be careful when asked to 'prove' it.")}`,
      artifacts: [
        scientific("bohr-levels", "Energy converges to zero as n → ∞. Ionisation from n = 1 needs 13.6 eV."),
        scene3d("Carbon atom — shells in 3D", { type: "atom", element: "C", showElectrons: true, autoRotate: true }, { caption: "2, 4 electron configuration: 2 in K shell, 4 in L shell." }),
      ],
      followUps: ["Show an orbital diagram", "Explain the photoelectric effect", "Show the hydrogen spectral series"],
    }),
  },
  {
    id: "nuclear",
    title: "Nuclei & Radioactivity",
    subject: "Physics",
    chapter: "Nuclei",
    keywords: ["nuclear", "radioactive", "half life", "decay", "fission", "fusion", "binding energy", "mass defect", "alpha decay", "beta decay", "gamma"],
    strength: 2,
    hasGraph: true,
    build: () => ({
      content: `### Decay is a probability, not a schedule
$N = N_0 e^{-\\lambda t}$, and the half-life is $t_{1/2} = \\dfrac{0.693}{\\lambda}$. Activity $A = \\lambda N$ follows the same exponential.

Binding energy per nucleon peaks near **Fe-56** (~8.8 MeV). Fusion of light nuclei and fission of heavy nuclei both climb toward that peak, releasing energy — the curve is the single most important graph in nuclear physics.

| Decay | Change in A | Change in Z |
| --- | --- | --- |
| α | −4 | −2 |
| β⁻ | 0 | +1 |
| γ | 0 | 0 |

Mass defect $\\Delta m$ converts to energy via $E = \\Delta m c^2$; 1 u ≈ 931.5 MeV.

${examNote("Half-life is independent of temperature, pressure or chemical state — a favourite trick question. It is a nuclear property, not an atomic one.")}`,
      artifacts: [
        scientific("half-life", "After each half-life the remaining nuclei halve; the curve approaches zero asymptotically."),
      ],
      followUps: ["Plot binding energy per nucleon", "Explain alpha decay with a diagram", "Calculate energy released in fission"],
    }),
  },
  {
    id: "kinematics",
    title: "Kinematics & Projectile Motion",
    subject: "Physics",
    chapter: "Motion in a Straight Line / Plane",
    keywords: ["kinematic", "projectile", "motion", "velocity", "acceleration", "displacement", "free fall", "equation of motion", "trajectory", "relative velocity"],
    strength: 1.5,
    hasGraph: true,
    diagram: kinematicsDiagram,
    build: () => ({
      content: `### Three equations, endless questions
For uniform acceleration:

$$v = u + at,\\quad s = ut + \\tfrac12 at^2,\\quad v^2 = u^2 + 2as$$

A projectile is **two independent motions**: uniform along x, uniformly accelerated along y.

$$y = x\\tan\\theta - \\frac{gx^2}{2u^2\\cos^2\\theta},\\quad R = \\frac{u^2\\sin 2\\theta}{g},\\quad H = \\frac{u^2\\sin^2\\theta}{2g}$$

| Key point | Formula |
| --- | --- |
| Time of flight | $2u\\sin\\theta / g$ |
| Max range | $u^2/g$ at 45° |
| Complement angles | same range |

${examNote("Resolve before you substitute. Most lost marks in kinematics come from mixing signs across axes — choose a positive direction once, and stick to it.")}`,
      artifacts: [
        scientific("projectile", "Drag the angle slider: watch the range peak at 45° while height keeps growing with angle."),
        mermaid("Solving motion problems", kinematicsDiagram),
      ],
      followUps: ["Show v–t and a–t graphs", "Explain relative velocity with a diagram", "Show equations of motion as graphs"],
    }),
    quiz: [
      { q: "At what angle is range maximum for a given speed?", a: "45°, giving R = u²/g." },
      { q: "A body's v–t graph is a straight line. What is the acceleration?", a: "Constant — equal to the slope of the line." },
    ],
  },
  {
    id: "newton",
    title: "Laws of Motion & Friction",
    subject: "Physics",
    chapter: "Laws of Motion",
    keywords: ["newton", "friction", "free body", "incline", "tension", "pulley", "normal force", "laws of motion", "pseudo force", "banking"],
    strength: 1.5,
    build: () => ({
      content: `### Draw the body, free it, then apply F = ma
The recipe that never fails:

1. Isolate each body and draw **every** force acting **on** it.
2. Pick axes along the acceleration.
3. Write $\\sum F = ma$ per axis.
4. Use constraints for connected bodies (same string ⇒ same magnitude of acceleration).

Friction: static friction is self-adjusting up to $f_s^{max} = \\mu_s N$; kinetic friction is fixed at $f_k = \\mu_k N$ and always opposes relative sliding.

On an incline: $mg\\sin\\theta$ down the slope, $N = mg\\cos\\theta$. Banking angle for no friction: $\\tan\\theta = v^2/rg$.

| Force | Direction |
| --- | --- |
| Normal | ⊥ to surface |
| Friction | along surface, opposes relative motion |
| Tension | along string, away from body |

${examNote("A body at rest can still have balanced forces. F = ma does not mean motion is needed; it means unbalanced force is needed to change motion.")}`,
      artifacts: [
        mermaid("Free-body method", `flowchart TD
    A["Sketch situation"] --> B["Pick one body"]
    B --> C["Draw all forces"]
    C --> D["Choose axes along a"]
    D --> E["ΣF = ma per axis"]
    E --> F["Apply constraints"]
    F --> G["Solve, check limits"]`),
        graph(
          "Friction vs applied force",
          [
            { expression: "x < 8 ? x : 6", label: "Friction (static then kinetic)", color: "#fbbf24", jumps: true },
            { expression: "0.75*x", label: "Applied force", color: "#22d3ee", dashed: true },
          ],
          { xRange: [0, 14], yRange: [0, 12], xLabel: "Applied force (N)", yLabel: "Friction (N)", caption: "Static friction rises to a maximum (μ_s·N), then drops to constant kinetic friction." }
        ),
      ],
      followUps: ["Explain banking of roads", "Show a pulley system free-body diagram", "Explain work–energy theorem"],
    }),
  },
  {
    id: "work-energy",
    title: "Work, Energy & Power",
    subject: "Physics",
    chapter: "Work, Energy and Power",
    keywords: ["work energy", "power", "kinetic energy", "potential energy", "conservation of energy", "spring energy", "collision", "elastic collision", "work done"],
    strength: 1.5,
    hasGraph: true,
    build: () => ({
      content: `### Track the energy, skip the details
Work–energy theorem: $W_{net} = \\Delta K$. For conservative forces, define $U$ with $F = -dU/dx$, so mechanical energy is conserved: $K + U = \\text{const}$.

Spring: $U = \\tfrac12 kx^2$ (a parabola). Power: $P = dW/dt = F\\cdot v$.

| Collision | Momentum | Kinetic energy |
| --- | --- | --- |
| Elastic | conserved | conserved |
| Inelastic | conserved | lost |
| Perfectly inelastic | conserved | maximum loss |

${examNote("Momentum is conserved whenever no external impulse acts — even in inelastic collisions. Kinetic energy is not.")}`,
      artifacts: [
        graph(
          "Spring potential energy — a parabola",
          [
            { expression: "0.5*0.8*x^2", label: "U = ½kx²  (k = 0.8)", color: "#a78bfa" },
            { expression: "0.5*0.8*x^2 + 2", label: "U + E_other", color: "#22d3ee", dashed: true },
          ],
          { xRange: [-5, 5], yRange: [0, 14], xLabel: "Extension x (m)", yLabel: "Energy (J)", caption: "Force is the negative slope: F = −kx. The bowl shape explains stable equilibrium." }
        ),
      ],
      followUps: ["Explain a perfectly inelastic collision", "Show power vs velocity", "Explain conservative forces"],
    }),
  },
  {
    id: "waves",
    title: "Waves & Sound",
    subject: "Physics",
    chapter: "Waves and Oscillations",
    keywords: ["wave", "sound", "standing wave", "doppler", "beats", "organ pipe", "resonance tube", "wavelength", "frequency", "superposition", "interference"],
    strength: 1.5,
    hasGraph: true,
    build: () => ({
      content: `### A wave is a travelling disturbance
For a progressive wave: $y = A\\sin(kx - \\omega t)$, with $v = \\omega/k = f\\lambda$.

Two identical waves moving in opposite directions superpose into a **standing wave**:

$$y = 2A\\sin(kx)\\cos(\\omega t)$$

Nodes stay fixed; antinodes oscillate with amplitude 2A. The distance between adjacent nodes is $\\lambda/2$.

| Pipe | Fixed end / open end | Harmonics |
| --- | --- | --- |
| Closed organ pipe | node at closed end | odd only: f, 3f, 5f… |
| Open organ pipe | antinodes at both ends | all: f, 2f, 3f… |

Beats: two nearby frequencies produce $f_{beat} = |f_1 - f_2|$. Doppler shift for a source moving toward a stationary listener: $f' = f\\dfrac{v}{v - v_s}$.

${examNote("In a standing wave, energy does not propagate — it oscillates between kinetic and elastic potential. In a progressive wave, energy does propagate.")}`,
      artifacts: [
        scientific("standing-wave", "Press play to animate the standing wave; the dashed envelope shows the maximum displacement."),
        scientific("wave-progressive", "For a progressive wave, the whole profile slides forward with speed v = ω/k."),
      ],
      followUps: ["Show the Doppler effect", "Explain beats with a graph", "Show a closed vs open organ pipe"],
    }),
  },
  {
    id: "semiconductor",
    title: "Semiconductors & p–n Junction",
    subject: "Physics",
    chapter: "Semiconductor Electronics",
    keywords: ["semiconductor", "diode", "transistor", "p-n", "pn junction", "zener", "rectifier", "doping", "holes", "forward bias", "reverse bias"],
    strength: 2,
    hasGraph: true,
    build: () => ({
      content: `### Doped silicon does controlled imbalance
Adding pentavalent (P, As) atoms gives **n-type** (majority electrons); trivalent (B, Al) gives **p-type** (majority holes). The junction forms a depletion layer with a built-in potential barrier (~0.7 V for Si).

| Bias | Barrier | Depletion width | Current |
| --- | --- | --- | --- |
| Forward | lowered | narrow | large, exponential |
| Reverse | raised | wide | tiny leakage |

The diode I–V curve is flat in reverse and exponential in forward. A half-wave rectifier uses one diode; a full-wave bridge uses four.

Transistor (CE configuration): small base current controls a large collector current, $I_C = \\beta I_B$. Used for amplification and switching.

${examNote("Holes are absence of electrons, not positive particles. Both electrons and holes contribute to current, moving in opposite directions.")}`,
      artifacts: [
        scientific("diode", "The knee at ~0.7 V marks the cut-in voltage; beyond it current rises exponentially."),
      ],
      followUps: ["Explain a full-wave rectifier", "Show band gaps of conductors, semiconductors and insulators", "Explain the transistor as an amplifier"],
    }),
  },
  {
    id: "gravitation",
    title: "Gravitation",
    subject: "Physics",
    chapter: "Gravitation",
    keywords: ["gravitation", "gravity", "orbital velocity", "escape velocity", "kepler", "satellite", "g variation", "geostationary", "altitude", "variation of g", "acceleration due to gravity"],
    strength: 1.5,
    hasGraph: true,
    build: () => ({
      content: `### One law, from apple to orbit
Newton: $F = \\dfrac{Gm_1m_2}{r^2}$. Near Earth's surface $g = GM/R^2$; at height h, $g' = g\\left(\\dfrac{R}{R+h}\\right)^2$.

Orbital velocity: $v_o = \\sqrt{GM/r}$; escape velocity: $v_e = \\sqrt{2GM/R} = \\sqrt{2}\\,v_o$ (≈11.2 km/s at Earth's surface).

Kepler's laws: elliptical orbits, equal areas in equal times, and $T^2 \\propto a^3$.

| Quantity | Depends on |
| --- | --- |
| g at height h | decreases as 1/(R+h)² |
| Orbital speed | 1/√r |
| Time period | r^(3/2) |

${examNote("A satellite in orbit is in free fall — astronauts feel weightless because both they and the spacecraft accelerate equally, not because gravity is zero.")}`,
      artifacts: [
        scientific("gravitation-g", "At h = R, g drops to ¼ of its surface value."),
        mermaid("Orbits mind map", `mindmap
  root((Gravitation))
    Newton's law
      Inverse square
    Variational g
      Height
      Depth
      Latitude
    Orbits
      Orbital velocity
      Escape velocity
    Kepler
      Ellipse
      Equal areas
      T2 proportional a3`),
      ],
      followUps: ["Explain a geostationary orbit", "Derive escape velocity", "Show variation of g with depth"],
    }),
  },
  {
    id: "solutions",
    title: "Solutions & Raoult's Law",
    subject: "Chemistry",
    chapter: "Solutions",
    keywords: ["solution", "raoult", "vapour pressure", "colligative", "osmotic", "mole fraction", "ideal solution", "azeotrope", "henry", "molality", "non-ideal"],
    strength: 3,
    hasGraph: true,
    diagram: solutionDiagram,
    build: () => ({
      content: `### Raoult's law: the straight line benchmark
For an ideal binary solution, each component's partial pressure is proportional to its mole fraction:

$$P_A = P_A^\\circ x_A,\\quad P_B = P_B^\\circ x_B,\\quad P_{total} = P_B^\\circ + (P_A^\\circ - P_B^\\circ)x_A$$

Ideal solutions obey this line. Real solutions deviate:

- **Positive deviation** — A–B forces weaker than A–A/B–B ⇒ higher vapour pressure, minimum-boiling azeotrope (ethanol–water).
- **Negative deviation** — A–B forces stronger ⇒ lower vapour pressure, maximum-boiling azeotrope (acetone–chloroform).

Colligative properties depend only on the **number of solute particles**: relative lowering of vapour pressure, boiling-point elevation $\\Delta T_b = iK_b m$, freezing-point depression $\\Delta T_f = iK_f m$, and osmotic pressure $\\pi = iCRT$.

${examNote("van't Hoff factor i = 1 for non-electrolytes, 2 for NaCl, 3 for CaCl₂ (if fully dissociated). Association gives i < 1.")}`,
      artifacts: [
        scientific("raoult-ideal", "The straight line is ideal; the curves show positive and negative deviation."),
        mermaid("Deviations decision map", solutionDiagram),
      ],
      followUps: ["Explain osmosis with a diagram", "Derive boiling point elevation", "What are azeotropes?"],
    }),
    quiz: [
      { q: "State Raoult's law for a binary solution.", a: "Partial vapour pressure of each component is proportional to its mole fraction: P_A = P°_A x_A." },
      { q: "Which colligative property is used to find molar mass of polymers?", a: "Osmotic pressure, because it is measurable at low concentrations." },
    ],
  },
  {
    id: "electrochem",
    title: "Electrochemistry & Nernst Equation",
    subject: "Chemistry",
    chapter: "Electrochemistry",
    keywords: ["electrochemistry", "nernst", "cell potential", "emf", "faraday", "conductance", "kohlrausch", "electrode potential", "galvanic", "salt bridge"],
    strength: 2,
    hasGraph: true,
    hasScene: true,
    diagram: cellDiagram,
    build: () => ({
      content: `### Cell EMF and the Nernst equation
For a cell, $E_{cell}^\\circ = E_{cathode}^\\circ - E_{anode}^\\circ$. Under non-standard conditions:

$$E = E^\\circ - \\frac{0.059}{n}\\log Q$$

At 298 K this is the Nernst equation; $\\Delta G^\\circ = -nFE^\\circ$ links thermodynamics and electricity.

Conductance: $G = 1/R$, conductivity $\\kappa = G(l/A)$, molar conductivity $\\Lambda_m = \\kappa/c$. Kohlrausch's law lets you compute $\\Lambda_m^\\circ$ for weak electrolytes from strong ones.

| Law | Statement |
| --- | --- |
| Faraday I | m ∝ It |
| Faraday II | same charge ⇒ equivalent masses |
| Kohlrausch | Λ° is a sum of ionic contributions |

${examNote("The Nernst equation predicts that diluting the ions changes cell emf — even reversing the reaction direction if Q becomes large enough.")}`,
      artifacts: [
        scientific("nernst", "Each 10× dilution of Cu²⁺ lowers the Cu electrode potential by 29.5 mV."),
        scene3d("Electrolytic cell — 3D", { type: "electrolytic", electrolyte: "CuSO₄(aq)", showLabels: true, showFlow: true }, { caption: "Anode: oxidation. Cathode: reduction. Ions complete the circuit inside the solution." }),
      ],
      followUps: ["Show a galvanic cell in 3D", "Explain Faraday's laws", "Derive ΔG = −nFE"],
    }),
  },
  {
    id: "kinetics",
    title: "Chemical Kinetics",
    subject: "Chemistry",
    chapter: "Chemical Kinetics",
    keywords: ["kinetics", "rate law", "order of reaction", "activation energy", "arrhenius", "rate constant", "half life", "integrated rate", "zero order", "first order", "pseudo first", "maxwell-boltzmann", "maxwell boltzmann", "molecular speed", "distribution curve", "collision theory"],
    strength: 2,
    hasGraph: true,
    build: (prompt) => {
      if (/maxwell|molecular speed|distribution/.test(prompt.toLowerCase())) {
        return {
          content: `### Molecular speeds are distributed, not fixed
Gas molecules do not all move at the same speed — they follow the **Maxwell–Boltzmann distribution**:

$$f(v) = 4\pi\left(\frac{m}{2\pi k_BT}\right)^{3/2} v^2 e^{-mv^2/2k_BT}$$

Three characteristic speeds:

| Speed | Expression | Meaning |
| --- | --- | --- |
| Most probable $v_{mp}$ | $\sqrt{2RT/M}$ | peak of the curve |
| Average $\bar v$ | $\sqrt{8RT/\pi M}$ | mean |
| RMS $v_{rms}$ | $\sqrt{3RT/M}$ | used in kinetic energy |

Notice $v_{rms} > \bar v > v_{mp}$. As temperature rises the whole curve flattens and shifts right, but the **area stays 1** — every molecule has *some* speed.

This is why reactions speed up with temperature: a much larger fraction of molecules now exceeds the activation energy.

${examNote("The area under the curve beyond Ea is the fraction of molecules able to react. A small temperature rise creates a disproportionate increase in that tail area — the reason for Arrhenius behaviour.")}`,
          artifacts: [
            scientific("maxwell-boltzmann", "Higher temperature flattens the curve and shifts the peak right — the fast-molecule fraction grows sharply."),
            scientific("arrhenius", "The steep ln k vs 1/T line is the macroscopic consequence of that growing tail."),
          ],
          followUps: ["Explain the Arrhenius equation", "What is collision theory?", "Show a first-order kinetics graph"],
        };
      }
      return {
      content: `### Rate laws tell you the order
For $aA \\to$ products, $rate = k[A]^n$. The integrated forms are the shapes you must recognise instantly:

| Order | Rate law | Integrated | Linear plot | Half-life |
| --- | --- | --- | --- | --- |
| 0 | $k[A]^0$ | $[A] = [A]_0 - kt$ | [A] vs t | $[A]_0/2k$ |
| 1 | $k[A]$ | $[A] = [A]_0e^{-kt}$ | ln[A] vs t | $0.693/k$ |
| 2 | $k[A]^2$ | $1/[A] = 1/[A]_0 + kt$ | 1/[A] vs t | $1/(k[A]_0)$ |

Arrhenius: $k = Ae^{-E_a/RT}$, so $\\ln k = \\ln A - \\dfrac{E_a}{RT}$ — a straight line when you plot ln k against 1/T, with slope $-E_a/R$.

${examNote("Half-life independent of initial concentration ⇒ first order. That single sentence solves most 'identify the order' questions.")}`,
      artifacts: [
        scientific("first-order", "First order decay: each half-life cuts concentration in half."),
        scientific("first-order-ln", "The ln[A]–t line is how k is extracted experimentally."),
        scientific("arrhenius", "Steeper ln k vs 1/T line ⇒ higher activation energy."),
      ],
      followUps: ["Explain collision theory", "Compare zero, first and second order graphs", "Explain a catalyst with an energy diagram"],
      };
    },
    quiz: [
      { q: "For a first-order reaction, how does half-life depend on [A]₀?", a: "It doesn't — t½ = 0.693/k." },
      { q: "What does the slope of ln k vs 1/T give?", a: "−Ea/R." },
    ],
  },
  {
    id: "bonding",
    title: "Chemical Bonding & VSEPR",
    subject: "Chemistry",
    chapter: "Chemical Bonding and Molecular Structure",
    keywords: ["bonding", "vsepr", "hybridisation", "hybridization", "molecular geometry", "bond angle", "sigma", "pi bond", "molecular orbital", "lone pair", "dipole moment", "resonance"],
    strength: 2,
    diagram: vseprDiagram,
    hasGraph: false,
    build: () => ({
      content: `### Count electron pairs, predict the shape
VSEPR: electron pairs arrange to minimise repulsion. Lone pairs repel more than bond pairs, squeezing bond angles.

| Pairs (bond + lone) | Shape | Example |
| --- | --- | --- |
| 2 + 0 | linear | BeCl₂ (sp) |
| 3 + 0 | trigonal planar | BF₃ (sp²) |
| 4 + 0 | tetrahedral | CH₄ (sp³) |
| 4 + 1 | trigonal pyramidal | NH₃ (107°) |
| 4 + 2 | bent | H₂O (104.5°) |
| 5 + 0 | trigonal bipyramidal | PCl₅ |
| 6 + 0 | octahedral | SF₆ |

Sigma bonds are head-on overlaps and define the framework; pi bonds are sideways overlaps, weaker and more exposed to attack. Molecular orbital theory explains magnetic behaviour (O₂ is paramagnetic) that VSEPR cannot.

${examNote("Hybridisation = number of electron domains: 2 → sp, 3 → sp², 4 → sp³, 5 → sp³d, 6 → sp³d². Count lone pairs as domains.")}`,
      artifacts: [
        mermaid("VSEPR decision map", vseprDiagram),
        graph(
          "Bond angle comparison",
          [
            { expression: "104.5 - 0*x", label: "H₂O (bent)", color: "#22d3ee", dashed: true },
            { expression: "107 - 0*x", label: "NH₃ (pyramidal)", color: "#a78bfa", dashed: true },
            { expression: "109.5 - 0*x", label: "CH₄ (tetrahedral)", color: "#34d399", dashed: true },
          ],
          { xRange: [0, 4], yRange: [100, 112], xLabel: "Compare", yLabel: "Bond angle (°)", caption: "Lone pairs compress the angle below the ideal 109.5°." }
        ),
      ],
      followUps: ["Explain molecular orbital theory", "Why is water bent but CO₂ linear?", "Show hybridisation with a diagram"],
    }),
    quiz: [
      { q: "Why is the H–O–H angle less than 109.5°?", a: "Two lone pairs on oxygen repel the bond pairs more strongly, compressing the angle to 104.5°." },
      { q: "What is the hybridisation of carbon in benzene?", a: "sp² for each carbon; the remaining p orbitals form the delocalised π system." },
    ],
  },
  {
    id: "mole",
    title: "Mole Concept & Stoichiometry",
    subject: "Chemistry",
    chapter: "Some Basic Concepts of Chemistry",
    keywords: ["mole", "stoichiometry", "limiting reagent", "empirical formula", "molar mass", "avogadro", "concentration", "molarity", "normality", "percentage yield"],
    strength: 1.5,
    build: () => ({
      content: `### Everything routes through the mole
1 mol = $6.022\\times10^{23}$ particles = molar mass in grams = 22.4 L of ideal gas at STP.

**The universal flow:** write a balanced equation → convert given mass/volume to moles → use coefficients → convert back.

Limiting reagent is decided by the *smallest* equivalent ratio (moles ÷ coefficient), not the smallest mass.

| Term | Expression |
| --- | --- |
| Molarity | mol solute / L solution |
| Molality | mol solute / kg solvent |
| Mole fraction | $n_i / \\sum n$ |
| % yield | actual / theoretical × 100 |

${examNote("Molarity changes with temperature (volume expands); molality does not. That is why molality is preferred for colligative properties.")}`,
      artifacts: [
        mermaid("Stoichiometry pipeline", `flowchart LR
    A["Balanced equation"] --> B["Moles of given"]
    B --> C["Mole ratio"]
    C --> D["Moles of required"]
    D --> E["Mass / volume / particles"]
    A --> F["Limiting reagent check"]
    F --> C`),
      ],
      followUps: ["Give me a limiting reagent quiz", "Explain concentration terms", "Show a titration curve"],
    }),
    quiz: [
      { q: "How many molecules are in 1 mole of CO₂?", a: "6.022 × 10²³ molecules." },
      { q: "How do you identify the limiting reagent?", a: "Divide moles of each reactant by its stoichiometric coefficient — the smallest ratio is limiting." },
    ],
  },
  {
    id: "equilibrium",
    title: "Chemical & Ionic Equilibrium",
    subject: "Chemistry",
    chapter: "Equilibrium",
    keywords: ["equilibrium", "le chatelier", "kc", "kp", "acid base", "ph", "buffer", "solubility product", "ksp", "common ion", "salt hydrolysis"],
    strength: 1.5,
    hasGraph: true,
    build: () => ({
      content: `### Equilibrium is dynamic, not static
At equilibrium the forward and reverse rates are equal, so concentrations stop changing — both reactions continue. $K_c = \\dfrac{[C]^c[D]^d}{[A]^a[B]^b}$; for gases, $K_p = K_c(RT)^{\\Delta n}$.

**Le Chatelier:** the system shifts to oppose any stress.

| Stress | Shift |
| --- | --- |
| Add reactant | forward |
| Increase pressure | toward fewer moles of gas |
| Increase temperature | endothermic direction |
| Catalyst | no shift, faster only |

Ionic: $pH = -\\log[H^+]$, $K_w = 10^{-14}$, buffer (Henderson–Hasselbalch) $pH = pK_a + \\log\\dfrac{[salt]}{[acid]}$, and $K_{sp}$ controls precipitation.

${examNote("A catalyst changes equilibrium rate, never the equilibrium constant. Temperature is the only factor that changes K.")}`,
      artifacts: [
        mermaid("Le Chatelier decision map", `flowchart TD
    S["Stress applied"] --> C{"Which stress?"}
    C -->|"concentration"| X["Shift to consume added species"]
    C -->|"pressure"| Y["Shift to fewer gas moles"]
    C -->|"temperature"| Z["Shift in endothermic direction"]
    X --> N["New equilibrium"]
    Y --> N
    Z --> N`),
      ],
      followUps: ["Explain buffer solutions", "Derive the pH of a weak acid", "Explain solubility product"],
    }),
  },
  {
    id: "thermo-chem",
    title: "Chemical Thermodynamics & Ellingham",
    subject: "Chemistry",
    chapter: "Thermodynamic Chemistry",
    keywords: ["chemical thermodynamic", "enthalpy", "hess", "gibbs", "ellingham", "entropy", "spontaneous", "metallurgy", "calorimetry", "internal energy", "heating curve", "latent heat", "phase change"],
    strength: 1.5,
    hasGraph: true,
    build: () => ({
      content: `### ΔG decides direction
$\\Delta G = \\Delta H - T\\Delta S$. Negative ΔG means the process is spontaneous.

| ΔH | ΔS | Spontaneous? |
| --- | --- | --- |
| − | + | always |
| − | − | below a temperature |
| + | + | above a temperature |
| + | − | never |

Hess's law: enthalpy change is path-independent. Calorimetry: $q = mc\\Delta T$.

**Ellingham diagrams** plot $\\Delta G^\\circ$ of oxide formation against temperature. A metal whose line lies below another's can reduce that oxide. The C → CO line slopes downward because of the entropy increase, making carbon a universal reducing agent above ~700 °C.

${examNote("At equilibrium ΔG = 0. Above the crossover temperature in an Ellingham diagram, the reaction becomes feasible — this is how the extraction temperature is chosen.")}`,
      artifacts: [
        scientific("ellingham", "Lower lines mean more stable oxides. Carbon's downward slope makes coke the key reducing agent in metallurgy."),
        scientific("heating-curve", "Latent heat plateaus: energy goes into phase change, not temperature."),
      ],
      followUps: ["Explain Hess's law with an example", "Show a Born–Haber cycle", "Explain the thermodynamics of a phase change"],
    }),
  },
  {
    id: "atomic-chem",
    title: "Atomic Structure (Chemistry)",
    subject: "Chemistry",
    chapter: "Structure of Atom",
    keywords: ["atomic structure", "quantum number", "orbital shape", "aufbau", "hund", "pauli", "electronic configuration", "photoelectric chemistry", "de broglie chemistry"],
    strength: 1.2,
    hasGraph: true,
    hasScene: true,
    build: () => ({
      content: `### Orbitals are probability clouds
Schrödinger's equation gives wavefunctions; $|\\psi|^2$ gives electron probability density. Three quantum numbers describe an orbital, a fourth describes the electron's spin.

| Quantum number | Symbol | Values | Tells you |
| --- | --- | --- | --- |
| Principal | n | 1, 2, 3… | size / shell |
| Azimuthal | l | 0 to n−1 | shape (s, p, d, f) |
| Magnetic | m | −l to +l | orientation |
| Spin | mₛ | ±½ | spin state |

Filling rules: Aufbau (lowest energy first), Pauli (max two electrons per orbital), Hund (parallel spins before pairing).

Heisenberg: $\\Delta x\\Delta p \\ge h/4\\pi$ — you cannot know both perfectly. This is why Bohr's neat orbits are replaced by probability densities.

${examNote("Number of orbitals in a shell = n²; maximum electrons = 2n². For n = 3: 3s + 3p + 3d = 1+3+5 = 9 orbitals → 18 electrons.")}`,
      artifacts: [
        scene3d("Carbon atom in 3D", { type: "atom", element: "C", showElectrons: true, autoRotate: true }, { caption: "Energy shells K (2) and L (4) for carbon." }),
        scientific("bohr-levels", "Hydrogen energy levels converge as n increases."),
      ],
      followUps: ["Explain the shapes of orbitals", "Tell me about the photoelectric effect", "Explain periodic trends"],
    }),
  },
  {
    id: "inverse-trig",
    title: "Inverse Trigonometric Functions",
    subject: "Mathematics",
    chapter: "Inverse Trigonometry",
    keywords: ["inverse trig", "inverse trigonometric", "arcsin", "arccos", "arctan", "principal value", "asin", "acos", "atan", "domain and range"],
    strength: 3,
    hasGraph: true,
    build: () => ({
      content: `### Inverse functions need restricted domains
To make trig functions invertible, we restrict their domains. That produces the principal-value branches:

| Function | Domain | Range (principal) |
| --- | --- | --- |
| $\\sin^{-1}x$ | [−1, 1] | $[-\\pi/2, \\pi/2]$ |
| $\\cos^{-1}x$ | [−1, 1] | $[0, \\pi]$ |
| $\\tan^{-1}x$ | ℝ | $(-\\pi/2, \\pi/2)$ |

Key identities:
$$\\sin^{-1}x + \\cos^{-1}x = \\frac{\\pi}{2},\\quad \\tan^{-1}x + \\cot^{-1}x = \\frac{\\pi}{2}$$

Note that $\\sin^{-1}(\\sin x) = x$ only when x is inside the principal range; otherwise it reflects into the branch.

${examNote("cos⁻¹x decreases from π to 0 — it is a decreasing function, unlike sin⁻¹ and tan⁻¹. That single fact flips many inequality answers.")}`,
      artifacts: [
        scientific("inverse-trig", "Each function is drawn only on its principal branch — the curves are reflections of the trig graphs across y = x."),
      ],
      followUps: ["Show the graph of y = sin⁻¹(sin x)", "Solve sin⁻¹x + cos⁻¹x = π/2 geometrically", "Show domain and range of all inverse functions"],
    }),
    quiz: [
      { q: "Domain and principal range of tan⁻¹x?", a: "Domain ℝ; range (−π/2, π/2)." },
      { q: "Evaluate sin⁻¹(1/2) + cos⁻¹(1/2).", a: "π/6 + π/3 = π/2." },
    ],
  },
  {
    id: "functions",
    title: "Functions: Modulus, Fractional Part, Signum",
    subject: "Mathematics",
    chapter: "Relations and Functions",
    keywords: ["fractional part", "signum", "modulus", "greatest integer", "floor", "function graph", "domain range", "even odd", "periodic", "piecewise"],
    strength: 2.5,
    hasGraph: true,
    build: () => ({
      content: `### Four graphs every aspirant should know cold
| Function | Definition | Range | Period |
| --- | --- | --- | --- |
| $|x|$ | x if x ≥ 0, −x otherwise | [0, ∞) | — |
| $[x]$ | greatest integer ≤ x | ℤ | 1 |
| $\\{x\\}$ | x − [x] | [0, 1) | 1 |
| sgn(x) | −1, 0, 1 for x < 0, = 0, > 0 | {−1, 0, 1} | — |

$\\{x\\}$ is a sawtooth: each integer jump discards the whole part. sgn(x) has a break at zero. Both are good tests of whether you understand graphs rather than formulas.

Compositions: $\\{x\\} + \\{-x\\}$ is 0 for integers and 1 otherwise; $[x] + \\{-x\\} = 0$.

${examNote("Discontinuities matter in MCQs: sgn(x) and {x} are discontinuous at integers, yet {x} is continuous from the right at integers.")}`,
      artifacts: [
        scientific("fractional-signum", "The vertical strokes mark jump discontinuities — where the function is undefined in the limit sense."),
        graph(
          "Greatest integer function",
          [
            { expression: "floor(x)", label: "y = [x]", color: "#fbbf24", jumps: true },
            { expression: "x - floor(x)", label: "y = {x}", color: "#22d3ee", jumps: true },
          ],
          { xRange: [-4, 4], yRange: [-2, 4], xLabel: "x", yLabel: "y", caption: "Step functions are constant between integers, then jump." }
        ),
      ],
      followUps: ["Show the graph of y = {x} + {−x}", "Explain domain and range", "Show invertible functions"],
    }),
  },
  {
    id: "conics",
    title: "Conic Sections",
    subject: "Mathematics",
    chapter: "Coordinate Geometry",
    keywords: ["conic", "parabola", "ellipse", "hyperbola", "circle", "eccentricity", "focus", "directrix", "tangent", "normal", "coordinate geometry"],
    strength: 2,
    hasGraph: true,
    build: () => ({
      content: `### Four curves, one cone
Conics are defined by distance conditions from a focus and directrix, with $e$ the eccentricity:

| Conic | Standard form | Eccentricity |
| --- | --- | --- |
| Circle | $x^2 + y^2 = r^2$ | e = 0 |
| Parabola | $y^2 = 4ax$ | e = 1 |
| Ellipse | $x^2/a^2 + y^2/b^2 = 1$ | 0 < e < 1 |
| Hyperbola | $x^2/a^2 - y^2/b^2 = 1$ | e > 1 |

For an ellipse, $b^2 = a^2(1 - e^2)$ and foci are at (±ae, 0). For a hyperbola, $b^2 = a^2(e^2 - 1)$ with the asymptotes $y = \\pm \\frac{b}{a}x$.

Parametric forms are the secret weapon: ellipse $(a\\cos\\theta, b\\sin\\theta)$, hyperbola $(a\\sec\\theta, b\\tan\\theta)$ or $(a\\cosh t, b\\sinh t)$.

${examNote("The tangent at any point on a parabola bisects the angle between the focal radius and the axis — the reflective property behind satellite dishes. It's a common application question.")}`,
      artifacts: [
        scientific("conic-ellipse", "Circle, ellipse and hyperbola drawn with parametric equations — note the hyperbola's branches."),
        graph(
          "Parabola family: y² = 4ax",
          [
            { expression: "sqrt(4*0.5*x)", label: "a = 0.5 (upper)", color: "#22d3ee" },
            { expression: "-sqrt(4*0.5*x)", label: "a = 0.5 (lower)", color: "#22d3ee" },
            { expression: "sqrt(4*2*x)", label: "a = 2 (upper)", color: "#a78bfa" },
            { expression: "-sqrt(4*2*x)", label: "a = 2 (lower)", color: "#a78bfa" },
          ],
          { xRange: [-2, 10], yRange: [-7, 7], xLabel: "x", yLabel: "y", caption: "Larger a opens the parabola wider. Domain here needs x ≥ 0." }
        ),
      ],
      followUps: ["Derive the eccentricity of an ellipse", "Show a hyperbola with asymptotes", "Explain tangent to a parabola"],
    }),
    quiz: [
      { q: "For an ellipse x²/25 + y²/9 = 1, find e.", a: "a = 5, b = 3, b² = a²(1 − e²) ⇒ e = 4/5." },
      { q: "What is the eccentricity of a parabola?", a: "e = 1." },
    ],
  },
  {
    id: "quadratic",
    title: "Quadratic Equations",
    subject: "Mathematics",
    chapter: "Complex Numbers and Quadratic Equations",
    keywords: ["quadratic", "quadratic formula", "discriminant", "roots of equation", "parabola roots", "sum and product of roots", "nature of roots"],
    strength: 2,
    hasGraph: true,
    build: () => ({
      content: `### The discriminant decides everything
For $ax^2 + bx + c = 0$:

$$x = \frac{-b \pm \sqrt{D}}{2a},\quad D = b^2 - 4ac$$

| Discriminant | Roots | Graph of y = ax² + bx + c |
| --- | --- | --- |
| $D > 0$ | two distinct real | cuts the x-axis twice |
| $D = 0$ | one repeated real | touches the x-axis |
| $D < 0$ | complex conjugates | never meets the x-axis |

Sum and product: $\alpha + \beta = -b/a$, $\alpha\beta = c/a$. So you can build the equation from its roots: $x^2 - (\alpha+\beta)x + \alpha\beta = 0$.

The plot below shows three parabolas with the same leading coefficient but different discriminants — the geometry *is* the algebra.

${examNote("If a > 0 the parabola opens upward and the minimum value is at x = −b/2a. If a < 0 it opens downward. Signs of a, and D are usually enough to eliminate three of four options in an MCQ.")}`,
      artifacts: [
        graph(
          "Parabolas by discriminant",
          [
            { expression: "x^2 - 4", label: "D > 0 (two roots)", color: "#22d3ee" },
            { expression: "x^2", label: "D = 0 (one root)", color: "#34d399" },
            { expression: "x^2 + 4", label: "D < 0 (no real root)", color: "#a78bfa" },
          ],
          {
            xRange: [-5, 5],
            yRange: [-8, 12],
            xLabel: "x",
            yLabel: "y",
            markers: [
              { x: -2, label: "root", color: "#22d3ee" },
              { x: 2, label: "root", color: "#22d3ee" },
            ],
            caption: "Same shape, different vertical shift — the discriminant is the geometry of where the curve meets y = 0.",
          }
        ),
      ],
      followUps: ["Show the sum and product of roots", "Explain complex roots geometrically", "Give me a quadratic quiz"],
    }),
    quiz: [
      { q: "For x² − 5x + 6 = 0, find the roots.", a: "Factors to (x−2)(x−3), so x = 2 or 3." },
      { q: "What does D = 0 mean graphically?", a: "The parabola touches the x-axis at exactly one point (repeated root)." },
      { q: "If α, β are roots of ax² + bx + c = 0, find α² + β².", a: "(α+β)² − 2αβ = b²/a² − 2c/a." },
    ],
  },
  {
    id: "calculus",
    title: "Calculus: Derivatives & Integrals",
    subject: "Mathematics",
    chapter: "Differential and Integral Calculus",
    keywords: ["calculus", "derivative", "integral", "differentiate", "integrate", "limit", "tangent line", "area under curve", "maxima", "minima", "continuity", "differentiability", "slope", "integral of", "derivative of", "integration by parts", "chain rule"],
    strength: 2,
    hasGraph: true,
    build: () => ({
      content: `### Calculus is the geometry of change
Derivative = slope of the tangent; integral = area under the curve. They are inverse operations (Fundamental Theorem).

$$\\frac{d}{dx}x^n = nx^{n-1},\\quad \\int x^n dx = \\frac{x^{n+1}}{n+1} + C\\ (n \\ne -1)$$

The graph below plots $f(x) = x^3/3 - x$ and its derivative $f'(x) = x^2 - 1$. Notice:

- Where $f' = 0$, the curve has **turning points** (here x = ±1).
- Where $f' > 0$, f is increasing; where $f' < 0$, decreasing.
- The area under f' between two x-values equals the net change in f.

Maxima/minima: solve $f'(x) = 0$, then check $f''(x)$ — negative ⇒ maximum, positive ⇒ minimum.

${examNote("For a function to be differentiable it must be continuous, but continuity does not guarantee differentiability (|x| at x = 0 is the classic counterexample).")}`,
      artifacts: [
        graph(
          "f and its derivative f′",
          [
            { expression: "x^3/3 - x", label: "f(x) = x³/3 − x", color: "#22d3ee" },
            { expression: "x^2 - 1", label: "f′(x) = x² − 1", color: "#fb7185", dashed: true },
            { expression: "0*x", label: "slope zero line", color: "#64748b", dashed: true, width: 1 },
          ],
          { xRange: [-3, 3], yRange: [-4, 4], xLabel: "x", yLabel: "y", caption: "Turning points of f occur exactly where f′ crosses zero." }
        ),
      ],
      followUps: ["Show the area under a curve (integration)", "Explain Rolle's theorem graphically", "Show a function that is continuous but not differentiable"],
    }),
  },
  {
    id: "vectors",
    title: "Vectors & 3D Geometry",
    subject: "Mathematics",
    chapter: "Vector Algebra",
    keywords: ["vector", "dot product", "cross product", "3d geometry", "direction cosine", "plane", "line in space", "triple product", "unit vector", "projection"],
    strength: 1.5,
    hasGraph: false,
    build: () => ({
      content: `### Direction plus magnitude
$\\vec{a}\\cdot\\vec{b} = |a||b|\\cos\\theta$ (scalar, measures alignment); $\\vec{a}\\times\\vec{b} = |a||b|\\sin\\theta\\,\\hat{n}$ (vector, perpendicular to both, area of parallelogram).

| Operation | Formula | Geometry |
| --- | --- | --- |
| Dot product | $a_1b_1 + a_2b_2 + a_3b_3$ | projection / angle |
| Cross product | determinant i j k | normal / area |
| Scalar triple product | $\\vec{a}\\cdot(\\vec{b}\\times\\vec{c})$ | volume |

Plane through point $\\vec{a}$ with normal $\\vec{n}$: $(\\vec{r} - \\vec{a})\\cdot\\vec{n} = 0$. Line: $\\vec{r} = \\vec{a} + \\lambda\\vec{b}$.

Shortest distance between skew lines: $\\dfrac{|(\\vec{b_1}\\times\\vec{b_2})\\cdot(\\vec{a_2}-\\vec{a_1})|}{|\\vec{b_1}\\times\\vec{b_2}|}$.

${examNote("If a·b = 0 the vectors are perpendicular; if a×b = 0 they are parallel. These two checks answer a surprising share of vector MCQs.")}`,
      artifacts: [
        mermaid("Vector toolkit", `mindmap
  root((Vectors))
    Products
      Dot
        Projection
        Angle
      Cross
        Normal
        Area
    Geometry
      Line
      Plane
    Triple product
      Volume
      Coplanarity`),
      ],
      followUps: ["Show a 3D vector scene", "Explain the shortest distance between lines", "Explain direction cosines"],
    }),
  },
  {
    id: "probability",
    title: "Probability & Statistics",
    subject: "Mathematics",
    chapter: "Probability",
    keywords: ["probability", "bayes", "binomial", "random variable", "mean", "variance", "standard deviation", "normal distribution", "permutation", "combination", "conditional", "dice", "coin toss"],
    strength: 1.5,
    hasGraph: true,
    build: () => ({
      content: `### Counting first, probability second
$P(A) = \\dfrac{n(A)}{n(S)}$ for equally likely outcomes; $P(A|B) = \\dfrac{P(A\\cap B)}{P(B)}$; Bayes' theorem reverses the conditioning.

Binomial distribution for n trials with success probability p:

$$P(X = r) = \\binom{n}{r}p^r(1-p)^{n-r},\\quad \\mu = np,\\quad \\sigma^2 = np(1-p)$$

For large n the binomial approaches the normal curve — the Central Limit Theorem in miniature.

| Measure | Formula |
| --- | --- |
| Mean of X | $\\sum x_iP(x_i)$ |
| Variance | $E(X^2) - [E(X)]^2$ |
| Standard deviation | √variance |

${examNote("Independent events: P(A∩B) = P(A)P(B). Mutually exclusive events: P(A∩B) = 0. Confusing these two is the most common probability error in JEE.")}`,
      artifacts: [
        scientific("normal-distribution", "68% of the area lies within ±1σ, 95% within ±2σ."),
        mermaid("Which probability tool?", `flowchart TD
    Q["Counting problem"] --> A{"Order matters?"}
    A -->|"yes"| P["Permutation nPr"]
    A -->|"no"| C["Combination nCr"]
    Q --> B{"Repeated trials?"}
    B -->|"fixed n, two outcomes"| BI["Binomial distribution"]
    B -->|"reverse conditioning"| BY["Bayes theorem"]`),
      ],
      followUps: ["Explain Bayes' theorem with an example", "Show a binomial distribution graph", "Explain permutations vs combinations"],
    }),
  },
  {
    id: "study",
    title: "Study Strategy & Revision",
    subject: "Study Skills",
    chapter: "Learning Science",
    keywords: ["study plan", "revision", "timetable", "how to prepare", "motivation", "focus", "strategy", "exam tips", "time management", "notes", "mistake"],
    strength: 1.2,
    diagram: studyLoop,
    build: () => ({
      content: `### Study less, retrieve more
The biggest gains come from **active recall** and **spaced repetition**, not re-reading.

- **Retrieve before revising:** close the book, draw the concept map, then check it.
- **Space it out:** revisit after 1 day, 3 days, 1 week, 3 weeks.
- **Interleave:** mix chapters in a session so the brain must choose the method, not just execute it.
- **Work in 25–45 minute blocks** with short movement breaks.
- **Track errors, not hours:** a mistake notebook beats a highlight reel.

A useful weekly loop: concept → solve 5 problems → visualise the process → teach it aloud → revisit weak points.

${examNote("For JEE/NEET, past-paper practice under timed conditions is the highest-yield activity in the final months. Analyse every wrong answer for the *reason*, not just the correct option.")}`,
      artifacts: [mermaid("The learning loop", studyLoop)],
      followUps: ["Make me a one-week revision plan", "How do I stop silly mistakes?", "Explain active recall"],
    }),
  },
];

export const topicById = Object.fromEntries(topics.map((topic) => [topic.id, topic]));

const keywordPatternCache = new Map<string, RegExp>();

function keywordPattern(keyword: string) {
  const cached = keywordPatternCache.get(keyword);
  if (cached) return cached;
  const escaped = keyword
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/-/g, "[- ]?"))
    .join("\\s+");
  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([a-z]{0,3})?([^a-z0-9]|$)`, "i");
  keywordPatternCache.set(keyword, pattern);
  return pattern;
}

export function findTopic(prompt: string): { topic: Topic; score: number } | null {
  const lower = prompt.toLowerCase().replace(/\s+/g, " ");
  let best: { topic: Topic; score: number } | null = null;

  for (const topic of topics) {
    let hits = 0;
    for (const keyword of topic.keywords) {
      if (keywordPattern(keyword).test(lower)) {
        hits += keyword.includes(" ") ? 2.5 : 1;
      }
    }
    if (hits === 0) continue;
    // Title words are a strong signal ("Nernst equation", "Raoult's law")
    const titleWords = topic.title.toLowerCase().split(/[^a-z]+/).filter((word) => word.length > 4);
    for (const word of titleWords) {
      if (new RegExp(`(^|[^a-z])${word}`, "i").test(lower)) hits += 1.5;
    }
    const score = hits * (topic.strength ?? 1);
    if (!best || score > best.score) best = { topic, score };
  }
  return best;
}

export function relatedTopics(topic: Topic, limit = 3): Topic[] {
  return topics
    .filter((candidate) => candidate.id !== topic.id && candidate.subject === topic.subject)
    .slice(0, limit);
}

export const allChapters = topics.reduce<Record<string, string[]>>((acc, topic) => {
  if (!acc[topic.subject]) acc[topic.subject] = [];
  if (!acc[topic.subject].includes(topic.chapter)) acc[topic.subject].push(topic.chapter);
  return acc;
}, {});

export { studyLoop, photoelectricDiagram, cellDiagram, crystalDiagram, vseprDiagram };

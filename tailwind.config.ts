import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05070c",
          900: "#080b13",
          850: "#0b0f19",
          800: "#101624",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans Variable", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk Variable", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glass: "0 24px 70px -20px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.06)",
        glow: "0 0 40px -8px rgba(34,211,238,.35)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(0,-16px,0) scale(1.03)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: ".45" },
          "50%": { opacity: ".9" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 9s ease-in-out infinite",
        shimmer: "shimmer 2.8s linear infinite",
        "spin-slow": "spin-slow 18s linear infinite",
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
        "fade-up": "fade-up .5s cubic-bezier(.2,.8,.2,1) both",
      },
      backgroundImage: {
        "mesh-radial":
          "radial-gradient(1200px 600px at 15% -10%, rgba(34,211,238,.10), transparent 50%), radial-gradient(900px 550px at 90% 5%, rgba(139,92,246,.12), transparent 55%), radial-gradient(800px 600px at 60% 100%, rgba(16,185,129,.06), transparent 55%)",
      },
    },
  },
  plugins: [],
};

export default config;

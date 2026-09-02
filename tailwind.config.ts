import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ]
      },
      // Había ocho valores de tracking distintos para tres conceptos, y esa
      // deriva es la razón de que la jerarquía visual cambie sutilmente entre
      // páginas. Se consolidan en cuatro tokens con nombre.
      letterSpacing: {
        eyebrow: "0.24em",
        "eyebrow-wide": "0.3em",
        display: "0.08em",
        hero: "0.06em"
      },
      colors: {
        ink: "#0a0a0a",
        steel: "#141414",
        mist: "#A1A1AA",
        line: "#27272A",
        neon: "#DC2626",
        ember: "#EF4444",
        sand: "#FFFFFF",
        success: "#22c55e"
      },
      boxShadow: {
        premium: "0 24px 80px rgba(0, 0, 0, 0.35)"
      },
      backgroundImage: {
        hero:
          "radial-gradient(circle at top left, rgba(220,38,38,0.10), transparent 36%), linear-gradient(180deg, #0a0a0a 0%, #120404 48%, #0a0a0a 100%)"
      }
    }
  },
  plugins: []
};

export default config;


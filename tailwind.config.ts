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
        // Escala de superficies: cada nivel se despega del anterior. Antes
        // había un solo tono de tarjeta casi idéntico al fondo, y por eso todo
        // se veía plano.
        surface: {
          DEFAULT: "#15161A",
          raised: "#1C1E23",
          sunken: "#0E0F12"
        },
        hairline: "#2A2D34",
        mist: "#A1A1AA",
        line: "#27272A",
        neon: "#DC2626",
        ember: "#EF4444",
        sand: "#FFFFFF",
        success: "#22c55e"
      },
      keyframes: {
        // El gorila del logo grita solo, cada tanto.
        //
        // El ciclo es casi todo reposo: el grito ocupa el último 20% y arranca
        // con un envión hacia atrás —encoge un poco— antes de estallar, que es
        // lo que lo hace leer como un grito y no como un latido.
        //
        // `scream` y `scream-wave` comparten el ciclo y la onda lleva su espera
        // adentro de los keyframes, no en un animation-delay: así salen juntas
        // sin importar cuándo se monte el componente.
        scream: {
          "0%, 78%, 100%": { transform: "scale(1) rotate(0deg)" },
          "82%": { transform: "scale(0.93) rotate(4deg)" },
          "86%": { transform: "scale(1.22) rotate(-7deg)" },
          "89%": { transform: "scale(1.09) rotate(5deg)" },
          "92%": { transform: "scale(1.17) rotate(-4deg)" },
          "96%": { transform: "scale(1.04) rotate(2deg)" }
        },
        "scream-wave": {
          "0%, 84%": { transform: "scale(1)", opacity: "0" },
          "87%": { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(2.3)", opacity: "0" }
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" }
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.85" }
        }
      },
      animation: {
        // Dos ritmos del mismo grito: pausado para el header, donde vive
        // permanentemente, y más seguido para los estados de carga, que duran
        // poco y necesitan mostrar actividad.
        scream: "scream 7s ease-in-out infinite",
        "scream-wave": "scream-wave 7s ease-out infinite",
        "scream-quick": "scream 2.6s ease-in-out infinite",
        "scream-wave-quick": "scream-wave 2.6s ease-out infinite",
        marquee: "marquee 38s linear infinite",
        "pulse-glow": "pulse-glow 6s ease-in-out infinite"
      },
      boxShadow: {
        premium: "0 24px 80px rgba(0, 0, 0, 0.35)",
        // El brillo interior superior es lo que da sensación de material: sugiere
        // una fuente de luz arriba y despega la tarjeta del fondo.
        card: "inset 0 1px 0 0 rgba(255,255,255,0.055), 0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -12px rgba(0,0,0,0.7)",
        "card-hover":
          "inset 0 1px 0 0 rgba(255,255,255,0.09), 0 2px 4px rgba(0,0,0,0.4), 0 16px 40px -16px rgba(0,0,0,0.85)",
        glow: "0 0 0 1px rgba(220,38,38,0.35), 0 12px 40px -12px rgba(220,38,38,0.45)"
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


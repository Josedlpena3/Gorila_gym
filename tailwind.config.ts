import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0B0D",
        steel: "#171A20",
        mist: "#9EA4B5",
        line: "#252A35",
        neon: "#B7FF39",
        ember: "#FF7A18",
        sand: "#F5F1E8"
      },
      boxShadow: {
        premium: "0 24px 80px rgba(0, 0, 0, 0.28)"
      },
      backgroundImage: {
        hero:
          "radial-gradient(circle at top left, rgba(183,255,57,0.18), transparent 32%), radial-gradient(circle at 80% 20%, rgba(255,122,24,0.18), transparent 26%), linear-gradient(180deg, #0A0B0D 0%, #10131A 48%, #0A0B0D 100%)"
      }
    }
  },
  plugins: []
};

export default config;


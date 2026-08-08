import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand yellow (Lodes) - single accent, locked
        primary: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#facc15", // brand yellow
          600: "#eab308",
          700: "#ca8a04",
          800: "#a16207",
          900: "#854d0e",
        },
        // Warm off-black ink scale (no pure black)
        ink: {
          50: "#f7f7f5",
          100: "#eeeeeb",
          200: "#ddddd7",
          300: "#b9b9ae",
          400: "#8b8b80",
          500: "#63635a",
          600: "#46463f",
          700: "#2e2e2a",
          800: "#1d1d1a",
          900: "#141412",
          950: "#0c0c0b",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Tinted shadows (warm hue), no pure-black drops
        card: "0 1px 2px 0 rgb(20 20 18 / 0.04), 0 4px 16px -4px rgb(20 20 18 / 0.08)",
        lift: "0 2px 4px 0 rgb(20 20 18 / 0.05), 0 12px 32px -8px rgb(20 20 18 / 0.14)",
        glow: "0 0 0 1px rgb(250 204 21 / 0.25), 0 4px 24px -6px rgb(250 204 21 / 0.35)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};
export default config;

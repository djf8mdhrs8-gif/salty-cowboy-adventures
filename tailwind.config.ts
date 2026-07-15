import type { Config } from "tailwindcss";

/**
 * Salty Cowboy Adventures brand palette:
 * coastal + western — muted navy, weathered tan, cream, coastal blue,
 * seafoam accents. Premium and rugged, never cartoonish.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#fdfbf5",
          100: "#faf5e8",
          200: "#f3ead3",
        },
        navy: {
          50: "#eef2f7",
          100: "#d5dfeb",
          200: "#aabfd6",
          300: "#7e9dc0",
          400: "#547ba7",
          500: "#3c5f88",
          600: "#2e4a6c",
          700: "#243a56",
          800: "#1b2c42",
          900: "#131f30",
          950: "#0c1420",
        },
        coastal: {
          50: "#f0f7f9",
          100: "#d9ecf1",
          200: "#b3d9e3",
          300: "#83bfd0",
          400: "#569fb6",
          500: "#3d829b",
          600: "#336a81",
          700: "#2d5769",
          800: "#294a58",
          900: "#263e4b",
        },
        tan: {
          50: "#faf7f2",
          100: "#f2ebdd",
          200: "#e3d4bb",
          300: "#d1b892",
          400: "#bd9a6c",
          500: "#ad8452",
          600: "#997046",
          700: "#7f5a3c",
          800: "#684a35",
          900: "#563e2e",
        },
        seafoam: {
          50: "#f2f8f6",
          100: "#dcece7",
          200: "#bcd9d0",
          300: "#92bfb3",
          400: "#6aa192",
          500: "#4f8577",
          600: "#3d6a60",
          700: "#34564f",
          800: "#2d4641",
          900: "#283b37",
        },
        rope: "#c8a878",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "texture-grain":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.035 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        card: "0 1px 3px rgba(19, 31, 48, 0.08), 0 8px 24px rgba(19, 31, 48, 0.08)",
        "card-hover":
          "0 2px 6px rgba(19, 31, 48, 0.10), 0 16px 40px rgba(19, 31, 48, 0.14)",
      },
      maxWidth: {
        content: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;

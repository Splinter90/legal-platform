import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Marca principal: teal
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
          DEFAULT: "#14b8a6",
        },
        // Acento premium: amber
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          DEFAULT: "#fbbf24",
        },
        // Compatibilidad con paneles existentes (no romper)
        gold: {
          50: "#fdf8ef",
          100: "#f9edd4",
          200: "#f3d9a8",
          300: "#ebc072",
          400: "#e2a43e",
          500: "#d4952e",
          600: "#b87a22",
          700: "#9a5f1e",
          800: "#7d4c1f",
          900: "#673f1c",
          DEFAULT: "#c9a96e",
        },
        dark: {
          50: "#f6f6f6",
          100: "#e7e7e7",
          200: "#d1d1d1",
          300: "#b0b0b0",
          400: "#888888",
          500: "#6d6d6d",
          600: "#5d5d5d",
          700: "#4f4f4f",
          800: "#3d3d3d",
          900: "#2d2d2d",
          950: "#1a1a1a",
          DEFAULT: "#1e1e1e",
        },
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        playfair: ["'Playfair Display'", "Georgia", "serif"],
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(to right, #14b8a6, #0d9488)",
        "gradient-accent": "linear-gradient(to right, #fbbf24, #f59e0b)",
        "gradient-hero":
          "linear-gradient(180deg, #0f172a 0%, #042f2e 50%, #0f172a 100%)",
        "sunburst":
          "radial-gradient(ellipse at center top, rgba(20, 184, 166, 0.15), transparent 50%), radial-gradient(ellipse at center bottom, rgba(245, 158, 11, 0.08), transparent 60%)",
      },
      boxShadow: {
        "glow-brand": "0 10px 30px -10px rgba(20, 184, 166, 0.5)",
        "glow-accent": "0 10px 30px -10px rgba(251, 191, 36, 0.5)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-slow": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out forwards",
        "fade-in-slow": "fade-in-slow 1.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;

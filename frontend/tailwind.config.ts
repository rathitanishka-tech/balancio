import type { Config } from "tailwindcss";
import path from "path";

/**
 * Liquid Obsidian design tokens.
 *
 * Colors are read from CSS variables defined in src/styles/globals.css so
 * there is a single source of truth for the palette. The exact accent hex
 * values (violet/indigo, cyan, emerald, soft blue) are this implementation's
 * concrete choice for the category names the spec called for; see
 * globals.css for the full token list and rationale.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "var(--bg-base)",
          elevated: "var(--bg-elevated)",
          alt: "var(--bg-alt)"
        },
        surface: {
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)"
        },
        ink: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)"
        },
        line: {
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)"
        },
        accent: {
          violet: "var(--accent-violet)",
          indigo: "var(--accent-indigo)",
          cyan: "var(--accent-cyan)",
          emerald: "var(--accent-emerald)",
          blue: "var(--accent-blue)",
          rose: "var(--accent-rose)"
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"]
      },
      borderRadius: {
        ctl: "10px",
        card: "16px",
        panel: "20px",
        modal: "26px",
        pill: "999px"
      },
      boxShadow: {
        soft: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.55)",
        lift: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 24px 48px -20px rgba(0,0,0,0.65)",
        glow: "0 0 0 1px rgba(124,108,245,0.25), 0 0 24px -4px rgba(124,108,245,0.45)"
      },
      backgroundImage: {
        "liquid-radial":
          "radial-gradient(120% 120% at 15% 0%, rgba(124,108,245,0.14) 0%, rgba(124,108,245,0) 55%), radial-gradient(90% 90% at 90% 10%, rgba(34,211,238,0.10) 0%, rgba(34,211,238,0) 55%)",
        "liquid-sheen":
          "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0) 60%)"
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" }
        },
        "modal-scale-in": {
          from: { opacity: "0", transform: "translate(-50%, -50%) scale(0.97)" },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" }
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        "scale-in": "scale-in 0.2s ease-out both",
        "modal-scale-in": "modal-scale-in 0.2s ease-out both",
        "slide-up": "slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 2.2s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite"
      },
      transitionTimingFunction: {
        liquid: "cubic-bezier(0.22, 1, 0.36, 1)"
      }
    }
  },
  plugins: []
};

export default config;

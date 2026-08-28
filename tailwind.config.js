/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Vibrant Clean Primary (Vibrant Emerald & Mint)
        "primary": "#10B981",
        "primary-hover": "#059669",
        "primary-dark": "#047857",
        "primary-light": "#34D399",
        "primary-container": "#ECFDF5",
        "primary-glow": "rgba(16, 185, 129, 0.2)",
        "on-primary": "#ffffff",
        "on-primary-container": "#065F46",

        // Electric Secondary (Sky & Cyan)
        "secondary": "#0284C7",
        "secondary-hover": "#0369A1",
        "secondary-light": "#38BDF8",
        "secondary-container": "#F0F9FF",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#075985",

        // Accent & Brand Colors
        "brand-cyan": "#06B6D4",
        "brand-indigo": "#6366F1",
        "brand-purple": "#8B5CF6",
        "accent-amber": "#F59E0B",
        "success-green": "#10B981",
        "warning-orange": "#F59E0B",
        "error": "#EF4444",
        "error-container": "#FEF2F2",
        "on-error": "#ffffff",

        // Clean Light Surfaces
        "surface-bright": "#FFFFFF",
        "surface": "#FFFFFF",
        "surface-subtle": "#F8FAFC",
        "surface-variant": "#F1F5F9",
        "surface-container-low": "#F8FAFC",
        "surface-container": "#F1F5F9",
        "surface-container-high": "#E2E8F0",
        "surface-container-highest": "#CBD5E1",
        "background": "#F8FAFC",

        // Modern Balanced Dark Mode Surfaces
        "dark-bg": "#0F172A",
        "dark-surface": "#1E293B",
        "dark-card": "#1E293B",
        "dark-card-hover": "#334155",
        "dark-border": "#334155",
        "dark-border-light": "#475569",
        "dark-muted": "#94A3B8",
        "dark-text": "#F8FAFC",

        // Institutional brand highlights (softened)
        "institutional-navy": "#1E293B",
        "institutional-emerald": "#059669",

        // Neutrals
        "slate-950": "#020617",
        "slate-900": "#0F172A",
        "slate-800": "#1E293B",
        "slate-700": "#334155",
        "slate-600": "#475569",
        "slate-500": "#64748B",
        "slate-400": "#94A3B8",
        "slate-300": "#CBD5E1",
        "slate-200": "#E2E8F0",
        "slate-100": "#F1F5F9",
        "slate-50": "#F8FAFC",
        "outline": "#94A3B8",
        "outline-variant": "#E2E8F0",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        md: "0.625rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        'card': '0 2px 12px -2px rgba(15, 23, 42, 0.06), 0 1px 3px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 12px 28px -4px rgba(15, 23, 42, 0.1), 0 4px 8px -2px rgba(15, 23, 42, 0.05)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'card-dark-hover': '0 12px 32px -4px rgba(0, 0, 0, 0.7), 0 0 15px rgba(16, 185, 129, 0.1)',
        'glow-primary': '0 0 20px rgba(16, 185, 129, 0.35)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.35)',
      },
      spacing: {
        gutter: "1.25rem",
        "container-padding": "2rem",
        "sidebar-width": "260px",
        "stack-sm": "0.5rem",
        "stack-md": "1rem",
        "stack-lg": "1.5rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

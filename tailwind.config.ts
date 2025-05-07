import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Brand colors
        primary: {
          DEFAULT: "#2DD4BF", // Teal
          50: "#EFFCFA",
          100: "#C8F5EF",
          200: "#A1EEE5",
          300: "#7AE7DB",
          400: "#53E0D0",
          500: "#2DD4BF",
          600: "#21A090",
          700: "#186C61",
          800: "#0F3832",
          900: "#030A09",
          950: "#010302",
        },
        secondary: {
          DEFAULT: "#1E3A8A", // Navy
          50: "#8DA5E6",
          100: "#7A96E2",
          200: "#5379D9",
          300: "#2E5BD0",
          400: "#254BAB",
          500: "#1E3A8A",
          600: "#152963",
          700: "#0D193C",
          800: "#050814",
          900: "#000000",
          950: "#000000",
        },
        accent: {
          DEFAULT: "#FBBF24", // Amber
          50: "#FFF3DC",
          100: "#FEEBC9",
          200: "#FDDCA2",
          300: "#FCCD7B",
          400: "#FCCE54",
          500: "#FBBF24",
          600: "#E9A604",
          700: "#B38103",
          800: "#7C5A02",
          900: "#453201",
          950: "#281E01",
        },
        // UI colors
        charcoal: "#111827", // Main dark theme background
        offwhite: "#F9FAFB", // Main light theme background
        
        // Status colors
        success: "#15803D",
        error: "#DC2626",
        warning: "#FBBF24",
        info: "#2563EB",
        
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        heading: ["var(--font-inter)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;

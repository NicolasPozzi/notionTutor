import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // NotionTutor Design System Colors
      colors: {
        background: "#FFFFFF",
        surface: "#F7F7F7",
        text: {
          primary: "#000000",
          secondary: "#6B7280",
        },
        feedback: {
          success: "#22C55E",
          warning: "#F97316",
          error: "#EF4444",
        },
      },
      // Typography - Inter font configured via next/font
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      // Font sizes following design system
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
        base: ["1rem", { lineHeight: "1.5rem" }], // 16px
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        xl: ["1.5rem", { lineHeight: "2rem" }], // 24px
        "2xl": ["2rem", { lineHeight: "2.5rem" }], // 32px
      },
      // 8px base grid spacing
      spacing: {
        "1": "0.25rem", // 4px
        "2": "0.5rem", // 8px (base)
        "3": "0.75rem", // 12px
        "4": "1rem", // 16px
        "5": "1.25rem", // 20px
        "6": "1.5rem", // 24px
        "8": "2rem", // 32px
        "10": "2.5rem", // 40px
        "12": "3rem", // 48px
        "16": "4rem", // 64px
      },
      // Mobile-first breakpoints (UX-DR5)
      screens: {
        sm: "640px", // Tablet starts
        md: "768px",
        lg: "1024px", // Desktop starts
        xl: "1280px",
      },
      // Minimum tap target size (UX-DR1)
      minHeight: {
        tap: "44px",
      },
      minWidth: {
        tap: "44px",
      },
    },
  },
  plugins: [],
};

export default config;

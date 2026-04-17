import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        display: ['Cinzel', 'serif'],
        decorative: ['"Cinzel Decorative"', 'serif'],
        body: ['"IM Fell English"', 'Georgia', 'serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        paper: {
          DEFAULT: "hsl(var(--paper))",
          edge: "hsl(var(--paper-edge))",
        },
        ink: "hsl(var(--ink))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { "0%": { opacity: "0", transform: "scale(0.92)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        "page-flip": { "0%": { transform: "rotateY(0) scale(1)", opacity: "1" }, "50%": { transform: "rotateY(-90deg) scale(0.95)", opacity: "0.4" }, "100%": { transform: "rotateY(0) scale(1)", opacity: "1" } },
        "dice-roll": {
          "0%": { transform: "rotateX(0) rotateY(0) rotateZ(0) scale(1)" },
          "25%": { transform: "rotateX(360deg) rotateY(180deg) rotateZ(90deg) scale(1.15)" },
          "50%": { transform: "rotateX(720deg) rotateY(360deg) rotateZ(180deg) scale(1.25)" },
          "75%": { transform: "rotateX(1080deg) rotateY(540deg) rotateZ(270deg) scale(1.15)" },
          "100%": { transform: "rotateX(1440deg) rotateY(720deg) rotateZ(360deg) scale(1)" },
        },
        "ember": {
          "0%, 100%": { opacity: "0.6", transform: "translateY(0) scale(1)" },
          "50%": { opacity: "1", transform: "translateY(-4px) scale(1.05)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "scale-in": "scale-in 0.25s ease-out",
        "page-flip": "page-flip 0.6s ease-in-out",
        "dice-roll": "dice-roll 1.1s cubic-bezier(0.4, 0, 0.2, 1)",
        "ember": "ember 2.5s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-cover": "var(--gradient-cover)",
        "gradient-page": "var(--gradient-page)",
        "gradient-accent": "var(--gradient-accent)",
      },
      boxShadow: {
        page: "var(--shadow-page)",
        glow: "var(--shadow-glow)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/page.{js,ts,jsx,tsx,mdx}",
    "./app/**/layout.{js,ts,jsx,tsx,mdx}",
    "./app/**/loading.{js,ts,jsx,tsx,mdx}",
    "./app/**/error.{js,ts,jsx,tsx,mdx}",
    "./app/providers.{js,ts,jsx,tsx}",
    "./conference-backend-core/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./conference-backend-core/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#f97316",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#ffb246",
          foreground: "#0e192b",
        },
        accent: {
          DEFAULT: "#2196F3",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        brightBlue: "#2196F3",
        // Homepage Redesign Color Palette - ISSH 2026
        thistle: "#d7c0d0",
        pastelPetal: "#f7c7db",
        babyPink: "#f79ad3",
        orchidMist: "#c86fc9",
        grapeSoda: "#25406b",
        // ISSH 2026 Theme Colors
        isshBlue: "#25406b",
        isshGold: "#ebc975",
        isshRed: "#852016",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'gradient': 'gradient 8s linear infinite',
        'gradient-shift': 'gradientShift 15s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 8s ease-in-out infinite',
        'pulse-slower': 'pulseSlower 12s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.8s ease-out',
        // Homepage Redesign Animations
        'orb-pulse': 'orbPulse 4s ease-in-out infinite',
        'orb-rotate': 'orbRotate 3000s linear infinite',
        'stagger-fade': 'staggerFade 0.6s ease-out forwards',
        'scan-line': 'scanLine 2s ease-in-out',
        'cellular-float': 'cellularFloat 8s ease-in-out infinite',
        'glow-orchid': 'glowOrchid 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 178, 70, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 178, 70, 0.8)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        gradientShift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(5%, -5%) scale(1.1)' },
          '66%': { transform: 'translate(-5%, 5%) scale(0.95)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.05)' },
        },
        pulseSlower: {
          '0%, 100%': { opacity: '0.1', transform: 'scale(1)' },
          '50%': { opacity: '0.3', transform: 'scale(1.08)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Homepage Redesign Keyframes
        orbPulse: {
          '0%, 100%': { transform: 'scale(0.98)' },
          '50%': { transform: 'scale(1.02)' },
        },
        orbRotate: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
        staggerFade: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        cellularFloat: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(10px, -10px) scale(1.05)' },
          '50%': { transform: 'translate(-5px, 5px) scale(0.98)' },
          '75%': { transform: 'translate(-10px, -5px) scale(1.02)' },
        },
        glowOrchid: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(200, 111, 201, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(200, 111, 201, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

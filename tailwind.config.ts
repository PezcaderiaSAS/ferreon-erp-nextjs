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
        /* Tokens Semánticos Dinámicos de Preset */
        preset: {
          bg: 'hsl(var(--preset-bg) / <alpha-value>)',
          fg: 'hsl(var(--preset-fg) / <alpha-value>)',
          card: 'hsl(var(--preset-card) / <alpha-value>)',
          cardFg: 'hsl(var(--preset-card-fg) / <alpha-value>)',
          border: 'hsl(var(--preset-border) / <alpha-value>)',
          primary: 'hsl(var(--preset-primary) / <alpha-value>)',
          primaryFg: 'hsl(var(--preset-primary-fg) / <alpha-value>)',
          secondary: 'hsl(var(--preset-secondary) / <alpha-value>)',
          secondaryFg: 'hsl(var(--preset-secondary-fg) / <alpha-value>)',
          muted: 'hsl(var(--preset-muted) / <alpha-value>)',
          mutedFg: 'hsl(var(--preset-muted-fg) / <alpha-value>)',
          accent: 'hsl(var(--preset-accent) / <alpha-value>)',
        },
        /* Compatibilidad Canónica shadcn/ui */
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',

        /* Paleta Previa del ERP (Preservada al 100%) */
        brand: {
          salmon: 'var(--brand-base)',
          salmonDark: 'var(--brand-dark)',
          salmonLight: 'var(--brand-light)',
          glow: 'var(--brand-glow)',
        },
        sidebar: {
          bg: '#FFFFFF',
          hover: '#F8FAFC',
          active: '#FFF4F1',
        }
      },
      borderRadius: {
        preset: 'var(--preset-radius)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        /* Sombras Semánticas Dinámicas de Preset */
        'preset': 'var(--preset-shadow)',
        'preset-hover': 'var(--preset-shadow-hover)',

        /* Sombras Preexistentes del ERP */
        'card': '0 4px 6px -1px rgba(15, 23, 42, 0.05)',
        'modal': '0 10px 15px -3px rgba(15, 23, 42, 0.08)',
        'glow-brand': '0 0 35px -5px var(--brand-glow)',
        'glow-brand-lg': '0 0 50px -2px var(--brand-glow)',
        'glow-orange': '0 0 35px -5px rgba(234, 88, 12, 0.3)',
        'glow-cyan': '0 0 35px -5px rgba(6, 182, 212, 0.25)',
        'neu-salmon': '8px 8px 16px var(--shadow-neu-dark), -8px -8px 16px var(--shadow-neu-light)',
        'neu-salmon-inset': 'inset 6px 6px 12px var(--shadow-neu-dark), inset -6px -6px 12px var(--shadow-neu-light)',
        'neu-salmon-sm': '4px 4px 8px var(--shadow-neu-dark), -4px -4px 8px var(--shadow-neu-light)',
        'neu-salmon-inset-sm': 'inset 4px 4px 8px var(--shadow-neu-dark), inset -4px -4px 8px var(--shadow-neu-light)',
      },

      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out 2s infinite',
        'float-reverse': 'floatReverse 8s ease-in-out 1s infinite',
        'blob': 'blob 10s infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'beam': 'beam 5s linear infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(8px)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.08)' },
          '66%': { transform: 'translate(-25px, 25px) scale(0.92)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '0.75', transform: 'scale(1.05)' },
        },
        beam: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '30%': { opacity: '0.8' },
          '70%': { opacity: '0.8' },
          '100%': { transform: 'translateX(250%)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
};
export default config;

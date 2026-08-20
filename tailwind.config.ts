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
        theme: {
          body: 'rgb(var(--theme-bg-body) / <alpha-value>)',
          surface: 'rgb(var(--theme-bg-surface) / <alpha-value>)',
          'surface-hover': 'rgb(var(--theme-bg-surface-hover) / <alpha-value>)',
          primary: 'rgb(var(--theme-text-primary) / <alpha-value>)',
          muted: 'rgb(var(--theme-text-muted) / <alpha-value>)',
          border: 'rgb(var(--theme-border) / <alpha-value>)',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: 'rgb(var(--theme-brand-400) / <alpha-value>)',
          500: 'rgb(var(--theme-brand-500) / <alpha-value>)',
          600: 'rgb(var(--theme-brand-600) / <alpha-value>)',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
        },
      },
      borderRadius: {
        'bento': '1.5rem',      // 24px
        'bento-lg': '2rem',     // 32px
        'bento-full': '9999px',
      },
      boxShadow: {
        'glass': '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-hover': '0 25px 60px rgba(2, 132, 199, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      }
    },
  },
  plugins: [],
};
export default config;

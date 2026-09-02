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
        brand: {
          salmon: '#FF8A65',
          salmonDark: '#E76E4A',
          salmonLight: '#FFDBCF',
        },
        sidebar: {
          bg: '#FFFFFF',
          hover: '#F8FAFC',
          active: '#FFF4F1',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(15, 23, 42, 0.05)',
        'modal': '0 10px 15px -3px rgba(15, 23, 42, 0.08)',
        'glow-orange': '0 0 35px -5px rgba(234, 88, 12, 0.3)',
        'glow-cyan': '0 0 35px -5px rgba(6, 182, 212, 0.25)',
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

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
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(15, 23, 42, 0.05)',
        'modal': '0 10px 15px -3px rgba(15, 23, 42, 0.08)',
      }
    },
  },
  plugins: [],
};
export default config;

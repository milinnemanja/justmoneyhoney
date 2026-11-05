/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        honey: {
          pink: '#FF2E93',
          pinkHover: '#FF55A8',
          pinkMuted: 'rgba(255, 46, 147, 0.14)',
          dark: '#08080C',
          surface: '#111118',
          card: '#16161F',
          border: '#242432',
        }
      },
      fontFamily: {
        display: ['"Outfit"', '"Syne"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        serif: ['"Merriweather"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
};

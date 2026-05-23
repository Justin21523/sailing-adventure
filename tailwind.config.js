/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Game specific semantic colors for UI/HUD
        'ocean-deep': '#0A192F',
        'ocean-shallow': '#172A45',
        'sand-light': '#E6F1FF',
        'sail-white': '#F8F9FA',
        'warning-red': '#FF5252',
        'gold-loot': '#FFD700',
      },
      fontFamily: {
        'nautical': ['"Georgia"', 'serif'],
        'hud': ['"Roboto Mono"', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
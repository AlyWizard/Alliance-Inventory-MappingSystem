/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'esc-bg': '#1A3728',
        'esc-form': '#1e3b30',
        'esc-input': '#2d4c41',
        'esc-text': '#bef7d8',
        'esc-button': '#3CB54A',
      }
    },
  },
  plugins: [],
}
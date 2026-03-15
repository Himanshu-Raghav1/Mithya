/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dora-blue': '#00A8E8',
        'dora-sky': '#4FC3F7',
        'dora-dark-blue': '#0077B6',
        'dora-yellow': '#FFD740',
        'dora-red': '#E53935',
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

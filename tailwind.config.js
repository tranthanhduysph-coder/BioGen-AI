/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}" // Add if you have components outside src (unlikely but safe)
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sky: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        }
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
      }
    },
  },
  plugins: [],
}

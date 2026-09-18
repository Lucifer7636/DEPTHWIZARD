/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#f0f4ff', 100: '#dbe4ff', 200: '#b6c9ff', 300: '#8aabff', 400: '#5c8aff', 500: '#3366ff', 600: '#1a4dcc', 700: '#0d3399', 800: '#072266', 900: '#031133' },
        cyan: { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

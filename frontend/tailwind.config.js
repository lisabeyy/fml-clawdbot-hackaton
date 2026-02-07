/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deserved: '#ef4444',
        fml: '#3b82f6',
      },
    },
  },
  plugins: [],
}

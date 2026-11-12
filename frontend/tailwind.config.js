/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spotter: {
          dark: '#0B0F19',
          card: '#131B2E',
          cardLight: '#1C2640',
          border: '#2A3655',
          accent: '#00D1FF',
          accentHover: '#00B8E6',
        },
        risk: {
          low: '#10B981',       // Green
          moderate: '#F59E0B',  // Yellow / Amber
          high: '#F97316',      // Orange
          severe: '#EF4444',    // Red
          noTravel: '#991B1B',  // Dark Crimson / Maroon
        }
      },
    },
  },
  plugins: [],
}

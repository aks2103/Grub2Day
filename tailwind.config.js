/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        foody: {
          saffron: "#F59E0B",
          spice: "#EA580C",
          coriander: "#10B981",
          curry: "#D97706",
          tomato: "#E11D48",
          paneer: "#FFFBEB",
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif"
        ],
      }
    },
  },
  plugins: [],
}

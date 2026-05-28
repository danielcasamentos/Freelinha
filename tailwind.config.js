/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{pages,components,App,index}/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#8A2BE2",
        background: "#121212",
      },
    },
  },
  plugins: [],
}

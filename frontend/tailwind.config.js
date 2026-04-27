/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./build/**/*.html", "./build/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#c17f24",
          dark: "#3b2a1a",
          light: "#f5efe6",
          muted: "#a66d1a",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
    },
  },
  plugins: [],
};
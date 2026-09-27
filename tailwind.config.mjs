/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Do logótipo: azul-marinho do lettering, azul-céu da gota e do brilho.
      colors: {
        ink: "#0f3f6e",
        line: "#d8e4ef",
        accent: "#1e6fae",
        sky: "#4aa9df",
        sand: "#f4f8fc",
        mist: "#e8f2fb",
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15, 63, 110, 0.05), 0 10px 24px rgba(15, 63, 110, 0.07)",
      },
    },
  },
  plugins: [],
};

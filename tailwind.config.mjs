/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c2a24",
        line: "#dfe5e1",
        accent: "#0f8a6a",
        sand: "#f5f7f5",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(28, 42, 36, 0.05), 0 10px 24px rgba(28, 42, 36, 0.06)",
      },
    },
  },
  plugins: [],
};

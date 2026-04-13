/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Onest", "sans-serif"],
      },
      colors: {
        accent: {
          DEFAULT: "#1d4ed8",
          light: "#eff4ff",
          border: "#c7d7fc",
        },
        neutral: {
          bg: "#f5f4f1",
          bg2: "#eeecea",
          border: "#e2e0db",
          border2: "#d0cdc7",
        },
        brand: {
          text: "#1a1916",
          text2: "#6b6860",
          text3: "#a8a59f",
        },
      },
    },
  },
  plugins: [],
}


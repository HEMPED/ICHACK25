module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/index.html",
  ], // Adjust paths based on your project structure
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#8d6e63',
          main: '#795548',
          dark: '#5d4037',
        },
        secondary: {
          light: '#8d6e63',
          main: '#40c4ff',
          dark: '#03a9f4',
          darker: '#0288d1',
        },
      },
    },
  },
  plugins: [],
};
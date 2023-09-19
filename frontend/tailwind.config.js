export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        'montserrat': ['Montserrat', 'sans'],
      },
      colors: {
        'lprimary': '#F5F5F9',
        'primary': '#171930',
        'secondary': '#25273F',
        'tertiary': '#7090E9',
        'quaternary': '#5064FB',
        'ltext': '#1B1B1B',
        'dtext': '#E2E8F0',
      },
    },
  },
  plugins: [],
}

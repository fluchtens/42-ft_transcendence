export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        'montserrat': ['Montserrat', 'sans'],
        'public-sans': ['"Public Sans"', 'sans']
      },
      colors: {
        'lprimary': '#f5f5f9',
        'dprimary': '#171930',

        'lsecondary': '#ffffff',
        'dsecondary': '#25273F',

        'ltertiary': '#6A6CFF',
        'dtertiary': '#7090E9',

        'lquaternary': '#5064FB',
        'dquaternary': '#5064FB',

        'ltext': '#1B1B1B',
        'dtext': '#E2E8F0',
      },
    },
  },
  plugins: [],
}

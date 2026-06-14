/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amazon: {
          dark: '#0F1111',
          nav: '#131921',
          orange: '#FF9900',
          teal: '#007185',
          green: '#067D62',
          saffron: '#FF6200',
          red: '#CC0C39',
          blue: '#0066C0',
          yellow: '#B8860B',
          credits: '#2D6A4F',
          escrow: '#EAF7EC',
          warning: '#FFF3CD',
        }
      },
      fontFamily: {
        amazon: ['"Amazon Ember"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

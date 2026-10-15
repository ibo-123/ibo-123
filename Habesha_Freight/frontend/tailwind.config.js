/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B1F33',
          dark: '#070F19',
          gold: '#C8933A',
          goldHover: '#B07F2E',
          lightBg: '#F8FAFC',
        },
      },
    },
  },
  plugins: [],
};

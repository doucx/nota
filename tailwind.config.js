/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#326496',
          darkBlue: '#23496f',
        },
      },
    },
  },
  plugins: [],
};

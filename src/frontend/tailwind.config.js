/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        palette: {
          slate: '#632024',
          mist: '#617891',
          cream: '#d5b893', //Banners
          taupe: '#25344f', // Heading Text
          terracotta: '#6f4d38', // Text
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        brand: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        palette: {
          lightblue: '#d3ebff',
          slate: '#632024',
          mist: '#8db4d2',
          cream: '#d5b893', //Banners
          taupe: '#25344f', // Heading Text
          terracotta: '#6f4d38', // Text
        },
      },
    },
  },
  plugins: [],
}


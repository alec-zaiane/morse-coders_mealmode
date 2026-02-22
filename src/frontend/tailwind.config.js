/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        brand: ['"Outfit"', 'sans-serif'],
      },
      colors: {
        palette: {
          primary: '#D15B40',
          primaryDark: '#A84731',
          emerald: '#688B58',
          amber: '#DE9842',
          background: '#FBF9F6',
          surface: '#FFFFFF',
          text: '#2F2A26',
          textMuted: '#797067',
          border: '#E6E1DA',
          taupe: '#6A5E53',
          mist: '#DFE2DF',
          slate: '#7F8E89',
          terracotta: '#D15B40',
        },
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out forwards',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"SF Pro Display"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        midnight: '#0b1f3a',
        mist: '#f5f6f8',
      },
    },
  },
  plugins: [],
}


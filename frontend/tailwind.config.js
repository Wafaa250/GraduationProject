/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c4d4ff',
          300: '#96b4ff',
          400: '#6088ff',
          500: '#3b5bff',
          600: '#1a35f5',
          700: '#1228e0',
          800: '#1522b5',
          900: '#17238e',
        },
        accent: {
          DEFAULT: '#00e5c3',
          dark:    '#00b89c',
        },
        dark: {
          900: '#050814',
          800: '#0a0f24',
          700: '#0f1535',
          600: '#162040',
          500: '#1e2d54',
        },
      },
      backgroundImage: {
        'mesh-gradient': 'radial-gradient(at 40% 20%, #1a35f5 0px, transparent 50%), radial-gradient(at 80% 0%, #00e5c3 0px, transparent 50%), radial-gradient(at 0% 50%, #050814 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
}

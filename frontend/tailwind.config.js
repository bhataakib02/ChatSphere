/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ChatSphere Duo — rose / blush / lavender (replaces legacy blue primary) */
        primary: {
          50: '#fff1f2',
          100: '#ffe4e8',
          200: '#fecdd6',
          300: '#fda4b8',
          400: '#ff85a1',
          500: '#ff4d6d',
          600: '#e63e5c',
          700: '#be1a3d',
          800: '#9b1232',
          900: '#4a1624',
          950: '#2c0b14',
        },
        duo: {
          petal: '#fff0f3',
          mist: '#faf7fc',
          blush: '#ff85a1',
          rose: '#ff4d6d',
          lavender: '#e8dff5',
          lavenderMuted: '#c4b5dc',
          ink: '#3d2c3e',
          void: '#2a1f35',
          voidDeep: '#1f1828',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'duo-glow': '0 12px 40px -8px rgba(255, 77, 109, 0.25)',
        'duo-soft': '0 8px 32px rgba(255, 77, 109, 0.12)',
      },
      backgroundImage: {
        'duo-gradient': 'linear-gradient(135deg, #ff4d6d 0%, #ff85a1 45%, #c4b5dc 100%)',
        'duo-radial': 'radial-gradient(ellipse at top, rgba(255,133,161,0.35), transparent 55%)',
      },
    },
  },
  plugins: [],
}

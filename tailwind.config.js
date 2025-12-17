/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'tutorial-glow': 'tutorial-glow 3s ease-in-out infinite',
        'tutorial-shine': 'tutorial-shine 3s ease-in-out infinite',
        'float-up': 'float-up 2s ease-in-out infinite',
      },
      keyframes: {
        'tutorial-glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px 2px rgba(96, 165, 250, 0.3), 0 0 40px 6px rgba(168, 85, 247, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 30px 4px rgba(96, 165, 250, 0.5), 0 0 60px 10px rgba(168, 85, 247, 0.3)',
          },
        },
        'tutorial-shine': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float-up': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
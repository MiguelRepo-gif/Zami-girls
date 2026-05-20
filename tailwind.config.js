/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#E91E8C',
          purple: '#9B5DE5',
          dark: '#0D0D0D',
          surface: '#1A1A1A',
          border: '#2D2D2D',
          muted: '#3D3D3D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

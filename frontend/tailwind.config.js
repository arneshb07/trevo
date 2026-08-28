/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        trevo: {
          bg: '#F6FAF7',
          surface: '#FFFFFF',
          'surface-subtle': '#EEF5F1',
          primary: '#0F2E22',
          secondary: '#1A4D3B',
          muted: '#5A7568',
          'border-light': 'rgba(15, 46, 34, 0.08)',
          'border-subtle': 'rgba(15, 46, 34, 0.05)',
          mint: {
            50: '#F0F9F4',
            100: '#E0F3EA',
            200: '#C2E7D5',
            300: '#95D5B7',
            400: '#52B788',
            500: '#2D9A65',
            700: '#1B6A43',
            900: '#0F2E22',
          },
          alert: {
            bg: '#FEECEC',
            border: '#FCA5A5',
            text: '#DC2626',
          }
        }
      },
      boxShadow: {
        'stitch-card': '0 4px 20px -2px rgba(15, 46, 34, 0.04), 0 2px 6px -1px rgba(15, 46, 34, 0.02)',
        'stitch-glass': '0 8px 32px 0 rgba(15, 46, 34, 0.06)',
        'stitch-float': '0 12px 36px -4px rgba(15, 46, 34, 0.12)',
      }
    },
  },
  plugins: [],
}

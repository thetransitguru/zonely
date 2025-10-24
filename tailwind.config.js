/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme base colors (Professional Blueprint Aesthetic)
        dark: {
          bg: '#1A1A1A',           // Deep charcoal background
          card: '#242424',          // Slightly lighter for cards
          border: '#333333',        // Subtle borders
          text: '#E5E5E5',          // Light text
          muted: '#9CA3AF',         // Muted text
        },
        // Neon green accent (modern, confident, decision-ready)
        accent: {
          50: '#F0FFF4',
          100: '#C6F6D5',
          200: '#9AE6B4',
          300: '#68D391',
          400: '#48BB78',
          500: '#39FF14',           // Primary neon green
          600: '#2FCC11',           // Slightly darker
          700: '#25A00D',
          800: '#1B7309',
          900: '#114705',
        },
        // Gold alternative accent (for premium tier highlighting)
        gold: {
          500: '#FFD700',
          600: '#FFCC00',
          700: '#E6B800',
        },
        // Blueprint-style accent colors
        blueprint: {
          line: '#3B82F6',          // Electric blue for grid lines
          faint: '#1E3A8A',         // Faint blue for subtle patterns
        },
        // Legacy primary (keep for compatibility)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(57, 255, 20, 0.3)',
        'glow-green-lg': '0 0 40px rgba(57, 255, 20, 0.4)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23333333' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.6s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(57, 255, 20, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(57, 255, 20, 0.6)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

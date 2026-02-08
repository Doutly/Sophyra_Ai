/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          electric: '#6F00FF',
          'electric-light': '#8F33FF',
          'electric-dark': '#5900CC',
          deep: '#0A0021',
          'deep-light': '#1A0A35',
          white: '#FFFFFF',
        },
        swiss: {
          base: {
            white: '#FFFFFF',
            near: '#F7F8FA',
          },
          secondary: {
            light: '#E9ECF1',
            DEFAULT: '#C9D1D9',
            dark: '#A8B2BD',
          },
          accent: {
            teal: '#6F00FF',
            'teal-dark': '#5900CC',
            'teal-light': '#F3E6FF',
          },
          status: {
            pending: '#FEF3C7',
            'pending-text': '#92400E',
            approved: '#D1FAE5',
            'approved-text': '#065F46',
            rejected: '#FEE2E2',
            'rejected-text': '#991B1B',
            completed: '#DBEAFE',
            'completed-text': '#1E40AF',
          },
        },
      },
      boxShadow: {
        'swiss-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'swiss-md': '0 4px 6px -1px rgba(0, 0, 0, 0.06)',
        'swiss-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
        'swiss-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.08)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'bento': '1rem',
        'bento-lg': '1.5rem',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

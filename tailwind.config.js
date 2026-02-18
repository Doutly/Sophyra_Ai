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
          electric: '#2563EB',
          'electric-light': '#3B82F6',
          'electric-dark': '#1D4ED8',
          deep: '#0F172A',
          'deep-light': '#1E293B',
          white: '#FFFFFF',
        },
        swiss: {
          base: {
            white: '#FFFFFF',
            near: '#F6F7FA',
          },
          secondary: {
            light: '#E9ECF1',
            DEFAULT: '#C9D1D9',
            dark: '#A8B2BD',
          },
          accent: {
            teal: '#2563EB',
            'teal-dark': '#1D4ED8',
            'teal-light': '#EFF6FF',
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
        'blue-glow': '0 0 40px rgba(37, 99, 235, 0.15)',
        'blue-glow-lg': '0 0 80px rgba(37, 99, 235, 0.2)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        bento: '1rem',
        'bento-lg': '1.5rem',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        spotlight: 'spotlight 2s ease .75s 1 forwards',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
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
        spotlight: {
          '0%': { opacity: '0', transform: 'translate(-72%, -62%) scale(0.5)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -40%) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

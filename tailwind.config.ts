import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#06080f',
          950: '#06080f',
          900: '#0b0e1a',
          800: '#111627',
        },
        'slate-card': '#111627',
        accent: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
          50: 'rgba(99, 102, 241, 0.05)',
          100: 'rgba(99, 102, 241, 0.1)',
          200: 'rgba(99, 102, 241, 0.2)',
        },
        surface: {
          DEFAULT: '#111627',
          hover: '#161c33',
          raised: '#1a2038',
        },
        'status-active': '#22c55e',
        'status-pending': '#f59e0b',
        'status-expelled': '#ef4444',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        heading: ['Sora', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'page-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'page-in': 'page-in 350ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        float: 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
      },
      boxShadow: {
        glow: '0 0 40px rgba(99, 102, 241, 0.15)',
        'glow-lg': '0 0 80px rgba(99, 102, 241, 0.2)',
        'glow-accent': '0 4px 20px rgba(99, 102, 241, 0.3)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
} satisfies Config

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        wedding: {
          50: '#fdf8f6',
          100: '#f9ede7',
          200: '#f3d9cc',
          300: '#e9bea5',
          400: '#dd9b78',
          500: '#d07d56',
          600: '#c2674a',
          700: '#a1523e',
          800: '#844437',
          900: '#6c3a30',
          950: '#3a1c17',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e4ebe4',
          200: '#c9d7ca',
          300: '#a3baa5',
          400: '#7a9a7d',
          500: '#5a7d5d',
          600: '#456349',
          700: '#38503c',
          800: '#2f4132',
          900: '#28362b',
          950: '#131d15',
        },
        cream: {
          50: '#fefdfb',
          100: '#fdf9f0',
          200: '#faf0db',
          300: '#f5e3be',
          400: '#eed09a',
          500: '#e5b96e',
          600: '#dca050',
          700: '#c4843d',
          800: '#a06a36',
          900: '#82572f',
          950: '#462c17',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
}

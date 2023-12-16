module.exports = {
  content: ['./src/**/*.{html,tsx}'],
  darkMode: 'class', // 'media' or 'class'
  mode: 'jit',
  theme: {
    borderColor: theme => ({
      ...theme('colors'),
      DEFAULT: '#f0f2f5',
      dark: theme('colors.gray.600', 'currentColor'),
    }),
    divideColor: theme => ({
      ...theme('colors'),
      DEFAULT: '#f0f2f5',
      dark: theme('colors.gray.600', 'currentColor'),
    }),
    extend: {
      screens: {
        sm: '640px',
        // => @media (min-width: 640px) { ... }

        md: '768px',
        // => @media (min-width: 768px) { ... }

        lg: '1024px',
        // => @media (min-width: 1024px) { ... }

        xl: '1280px',
        // => @media (min-width: 1280px) { ... }

        '2xl': '1536px',
        // => @media (min-width: 1536px) { ... }
      },
      textColor: {
        primary: '#39e19e',
      },
      colors: {
        'gray-light': '#7B7F86',
        'gray-dark': '#7B7F86',
        'accent-1': '#FAFAFA',
        'accent-2': '#EAEAEA',
        'accent-7': '#333',
        success: '#0070f3',
        cyan: '#79ffe1',
        primary: '#39e19e',
        cancel: '#e30d4d',
        brand: {
          100: '#82dab0',
          200: '#69d3a0',
          300: '#50cb90',
          400: '#c5f1dd',
          500: '#9fe7c7',
          600: '#65d9a5',
          700: '#3ecf8e',
          800: '#38bc81',
          900: '#10633e',
        },
        dark: {
          100: '#eeeeee',
          200: '#e0e0e0',
          300: '#bbbbbb',
          400: '#aaaeba',
          500: '#333741',
          600: '#2b2b2b',
          700: '#2b2e36',
          800: '#262930',
          900: '#262930',
        },
        gray: {
          50: '#e4e4e4',
          100: '#bbbbbb',
          200: '#8d8d8d',
          300: '#5f5f5f',
          400: '#3d3d3d',
          500: '#1b1b1b',
          600: '#181818',
          700: '#141414',
          800: '#101010',
          900: '#080808',
        },
      },
      spacing: {
        28: '7rem',
      },
      letterSpacing: {
        tighter: '-.04em',
      },
      lineHeight: {
        tight: 1.2,
      },
      fontSize: {
        '5xl': '2.5rem',
        '6xl': '2.75rem',
        '7xl': '4.5rem',
        '8xl': '6.25rem',
      },
      boxShadow: {
        'light-small': '0px 4px 8px 2px rgba(107, 114, 128, 0.08)',
        small: '0 5px 10px rgba(0, 0, 0, 0.12)',
        medium: '0 8px 30px rgba(0, 0, 0, 0.12)',
        override: '0px 0px 0px rgba(0, 0, 0, 0)',
      },
      fontFamily: {
        sans: [
          'custom-font',
          'BlinkMacSystemFont',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['Source Code Pro', 'Menlo', 'monospace'],
      },
      stroke: theme => ({
        white: theme('colors.white'),
        black: theme('colors.black'),
      }),
    },
  },
  plugins: [require('@tailwindcss/forms')],
  corePlugins: {
    preflight: true,
  },
}

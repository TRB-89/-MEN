/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#050507',
        surface: {
          DEFAULT: '#101014',
          elevated: '#17171D',
          panel: '#17171D',
          card: '#121217',
        },
        border: {
          DEFAULT: '#1E1E26',
          subtle: '#14141A',
          hairline: 'rgba(214, 214, 218, 0.12)',
          chrome: '#383842',
          crimson: 'rgba(179, 18, 47, 0.4)',
        },
        primary: {
          DEFAULT: '#F2F2F4',
        },
        secondary: {
          DEFAULT: '#A1A1AA',
        },
        chrome: {
          DEFAULT: '#D6D6DA',
          bright: '#F2F2F4',
          dim: '#8E8E98',
        },
        crimson: {
          DEFAULT: '#B3122F',
          hover: '#C91738',
          glow: '#E34C67',
        },
        rose: {
          DEFAULT: '#A95370',
          muted: '#8A3E57',
        },
        accent: {
          DEFAULT: '#B3122F',
          hover: '#C91738',
          glow: '#E34C67',
        },
        muted: '#A1A1AA',
        critical: '#E34C67',
        success: '#4ADE80',
        warning: '#FBBF24',
      },
      fontFamily: {
        heading: ['"Oxanium"', '"Chakra Petch"', 'sans-serif'],
        display: ['"Chakra Petch"', '"Space Grotesk"', 'sans-serif'],
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '2px',
        md: '4px',
      },
      boxShadow: {
        'crimson-sm': '0 0 12px rgba(179, 18, 47, 0.25)',
        'crimson-md': '0 0 24px rgba(179, 18, 47, 0.35)',
        'crimson-glow': '0 0 40px rgba(227, 76, 103, 0.3)',
        'chrome-sm': '0 0 10px rgba(214, 214, 218, 0.15)',
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'pulse-crimson': 'pulseCrimson 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        pulseCrimson: {
          '0%, 100%': { opacity: '0.9', boxShadow: '0 0 15px rgba(179, 18, 47, 0.3)' },
          '50%': { opacity: '0.4', boxShadow: '0 0 5px rgba(179, 18, 47, 0.1)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}

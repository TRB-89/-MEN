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
        background: '#050505',
        secondary: '#0D0D0F',
        panel: '#161619',
        surface: {
          DEFAULT: '#161619',
          elevated: '#1A1A1E',
          panel: '#161619',
          card: '#0D0D0F',
        },
        crimson: {
          DEFAULT: '#D10E24',
          bright: '#FF293F',
          deep: '#5C0614',
          glow: '#FF293F',
          hover: '#E3122B',
        },
        chrome: {
          DEFAULT: '#DCDCE0',
          dim: '#99999F',
          dark: '#24242A',
        },
        text: {
          DEFAULT: '#F5F5F5',
          muted: '#99999F',
        },
        border: {
          DEFAULT: 'rgba(220, 220, 224, 0.1)',
          subtle: 'rgba(220, 220, 224, 0.06)',
          hairline: 'rgba(220, 220, 224, 0.12)',
          chrome: '#DCDCE0',
          crimson: 'rgba(209, 14, 36, 0.4)',
        },
        primary: {
          DEFAULT: '#F5F5F5',
        },
        accent: {
          DEFAULT: '#D10E24',
          bright: '#FF293F',
          deep: '#5C0614',
        },
        muted: '#99999F',
        critical: '#FF293F',
        success: '#22C55E',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        technical: ['"Chakra Petch"', '"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
        heading: ['"Space Grotesk"', 'sans-serif'],
      },
      borderRadius: {
        none: '0',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
        full: '9999px',
      },
      boxShadow: {
        'crimson-sm': '0 0 14px rgba(209, 14, 36, 0.3)',
        'crimson-md': '0 0 28px rgba(209, 14, 36, 0.4)',
        'crimson-glow': '0 0 50px rgba(255, 41, 63, 0.35)',
        'crimson-deep': '0 10px 40px rgba(92, 6, 20, 0.6)',
        'chrome-sm': '0 0 10px rgba(220, 220, 224, 0.12)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'pulse-crimson': 'pulseCrimson 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'jelly-pulse': 'jellyPulse 4s ease-in-out infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        pulseCrimson: {
          '0%, 100%': { opacity: '0.9', boxShadow: '0 0 20px rgba(209, 14, 36, 0.4)' },
          '50%': { opacity: '0.4', boxShadow: '0 0 8px rgba(209, 14, 36, 0.15)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        jellyPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
      },
    },
  },
  plugins: [],
}

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
        omen: {
          black: '#050506',
          surface: '#101013',
          elevated: '#19191D',
          chrome: '#E2E2E5',
          muted: '#919198',
          crimson: '#B10F29',
          signal: '#F02D46',
          border: 'rgba(255, 255, 255, 0.12)',
        },
        background: '#050506',
        secondary: '#101013',
        panel: '#101013',
        surface: {
          DEFAULT: '#101013',
          elevated: '#19191D',
          panel: '#101013',
          card: '#050506',
        },
        crimson: {
          DEFAULT: '#B10F29',
          bright: '#F02D46',
          deep: '#5C0614',
          glow: '#F02D46',
          hover: '#D10E24',
        },
        chrome: {
          DEFAULT: '#E2E2E5',
          dim: '#919198',
          dark: '#19191D',
        },
        text: {
          DEFAULT: '#F5F5F5',
          muted: '#919198',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.12)',
          subtle: 'rgba(255, 255, 255, 0.06)',
          hairline: 'rgba(255, 255, 255, 0.12)',
          chrome: '#E2E2E5',
          crimson: 'rgba(177, 15, 41, 0.45)',
        },
        primary: {
          DEFAULT: '#F5F5F5',
        },
        accent: {
          DEFAULT: '#B10F29',
          bright: '#F02D46',
          deep: '#5C0614',
        },
        muted: '#919198',
        critical: '#F02D46',
        success: '#22C55E',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        technical: ['"JetBrains Mono"', '"Chakra Petch"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
        heading: ['"Space Grotesk"', 'sans-serif'],
        brand: ['"Oxanium"', 'sans-serif'],
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

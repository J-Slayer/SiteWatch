import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // SiteWatch brand palette — matches mobile theme.ts
        primary: {
          50: '#EEF2F7',
          100: '#D4E0EE',
          200: '#A9C1DD',
          300: '#7EA2CC',
          400: '#5383BB',
          500: '#2864AA',
          600: '#1E3A5F', // main brand
          700: '#162C48',
          800: '#0F1E30',
          900: '#070F18',
        },
        accent: {
          400: '#FF8C00',
          500: '#E67300',
        },
        severity: {
          low: '#16A34A',
          medium: '#D97706',
          high: '#EA580C',
          critical: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;

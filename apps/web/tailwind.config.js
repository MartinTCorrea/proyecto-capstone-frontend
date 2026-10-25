/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        '3xs': ['0.5625rem', { lineHeight: '0.75rem' }],   // 9px - micro leyendas y sub-etiquetas
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],   // 10px - micro badges, chips y tags de estado
        'caption': ['0.6875rem', { lineHeight: '1rem' }],  // 11px - cabeceras de tabla, labels uppercase, timestamps
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        surface: {
          DEFAULT: 'var(--color-bg-surface)',
          elevated: 'var(--color-bg-surface-elevated)',
          subtle: 'var(--color-bg-surface-subtle)',
        },
      },
    },
  },
  plugins: [],
};

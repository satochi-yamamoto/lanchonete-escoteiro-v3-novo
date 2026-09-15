/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cooper: {
          canvas: 'oklch(0.975 0.009 93)',
          surface: 'oklch(0.994 0.006 93)',
          panel: 'oklch(0.948 0.012 93)',
          ink: 'oklch(0.245 0.019 130)',
          muted: 'oklch(0.48 0.026 115)',
          line: 'oklch(0.875 0.018 95)',
          leaf: 'oklch(0.46 0.115 145)',
          leafDark: 'oklch(0.33 0.09 145)',
          moss: 'oklch(0.63 0.105 128)',
          ember: 'oklch(0.58 0.14 42)',
          warning: 'oklch(0.67 0.145 67)',
          danger: 'oklch(0.55 0.17 28)'
        }
      },
      boxShadow: {
        soft: '0 18px 45px -28px oklch(0.245 0.019 130 / 0.45)',
        lift: '0 14px 30px -22px oklch(0.245 0.019 130 / 0.5)'
      }
    }
  },
  plugins: []
};

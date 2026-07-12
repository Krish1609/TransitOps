/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
        press: '#3730a3',
        lavender: '#e0e7ff',
        cream: '#fef3c7',
        hairline: '#e2e8f0',
        ink: '#0f172a',
        link: '#2563eb',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      borderRadius: {
        'pill': '90px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}


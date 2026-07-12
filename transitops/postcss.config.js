export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#4a154b',
        'primary-press': '#611f69',
        lavender: '#f9f0ff',
        cream: '#f4ede4',
        hairline: '#e6e6e6',
        ink: '#1d1d1d',
        'ink-mute': '#696969',
        link: '#1264a3',
        success: '#007a5a',
        warning: '#b8860b',
        error: '#cc4117',
      },
      borderRadius: {
        pill: '90px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
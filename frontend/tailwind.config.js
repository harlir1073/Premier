/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B2430',      // primary text / headers
        slate: '#3E5C76',    // primary accent
        mist: '#748CAB',     // secondary accent
        cloud: '#F1F5F9',    // background
        paper: '#FFFFFF',
        amber: '#D9A441',    // alerts / due
        coral: '#C1554B'     // overdue / errors
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'serif'],
        body: ['"Inter"', 'sans-serif']
      }
    }
  },
  plugins: []
};

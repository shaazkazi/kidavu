module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
    darkMode: 'class', // This is critical - ensure dark mode uses class strategy
    theme: {
      extend: {
        colors: {
          primary: {
            500: '#3B82F6', // blue-500
            600: '#2563EB', // blue-600
          },
          secondary: {
            500: '#6B7280', // gray-500
            600: '#4B5563', // gray-600
          },
        },
      },
    },
    plugins: [],
  }
  
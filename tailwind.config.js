// tailwind.config.js
// Tailwind CSS configuration
// Defines where Tailwind looks for class names and custom theme settings

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tell Tailwind which files to scan for class names
  // It will only include CSS for classes actually used in these files
  content: [
    './pages/**/*.{js,jsx}',      // Pages directory (if using pages router)
    './components/**/*.{js,jsx}',  // Component files
    './app/**/*.{js,jsx}',         // App directory (App Router)
  ],
  theme: {
    extend: {
      // Add Inter font as a custom font family
      // Can be used with className="font-inter"
      fontFamily: {
        inter: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [], // No additional Tailwind plugins currently installed
}


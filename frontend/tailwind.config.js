/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4CAF50",
        accent: "#FF9800",
        background: "#F5F5F5",
        card: "#FFFFFF",
        text: "#212121",
        subtext: "#757575",
        border: "#E0E0E0",
        success: "#2ECC71",
        error: "#E74C3C",
        info: "#3498DB",
      },
      borderRadius: { DEFAULT: "8px" },
      spacing: { page: "16px" },
    },
  },
  plugins: [],
};

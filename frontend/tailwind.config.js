/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--c-primary)",
        accent: "var(--c-accent)",
        background: "var(--c-bg)",
        card: "var(--c-card)",
        text: "var(--c-text)",
        subtext: "var(--c-subtext)",
        border: "var(--c-border)",
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

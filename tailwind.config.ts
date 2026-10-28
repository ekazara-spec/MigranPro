import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F172A",
          light: "#475569",
          dark: "#020617",
        },
        secondary: {
          DEFAULT: "#0284C7",
          light: "#38BDF8",
          dark: "#0369A1",
        },
        accent: {
          DEFAULT: "#0D9488",
        },
        surface: "#FFFFFF",
        bg: "#F8FAFC",
      },
    },
  },
  plugins: [],
};
export default config;

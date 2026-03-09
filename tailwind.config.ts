import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        rickbert: {
          paper: "#f6f0e7",
          ink: "#111111",
          accent: "#2b4f65",
        },
      },
    },
  },
  plugins: [],
};

export default config;

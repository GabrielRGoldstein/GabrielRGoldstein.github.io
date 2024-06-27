import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        pixel_bg: '#201533',
        pixel_blue: '#0ce6f2',
        pixel_pink: '#a21382',
        pixel_pink_dark: '#74246d' ,
        pixel_pink_light: '#d774a5' ,
        pixel_bg_darker: '#1B122B',
        pixel_bg_darkest: '#120C1D'
  
      },
    },
  },
  plugins: [],
};
export default config;

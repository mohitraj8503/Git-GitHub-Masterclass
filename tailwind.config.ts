import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)', 'sans-serif'],
        cormorant: ['var(--font-cormorant)', 'serif'],
        jakarta: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
        signature: ['var(--font-signature)', 'cursive'],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paper / cream surfaces (backgrounds)
        cream: '#fdf6e4',
        'paper-ivory': '#faf3de',
        paper: '#f5ecd3',
        'paper-warm': '#ebe0be',
        'stone-soft': '#dfd3ad',
        stone: '#d0c49f',

        // Ink (text)
        ink: '#2e2a1f',
        'ink-soft': '#6b5f45',
        'ink-muted': '#8a7e62',

        // Forest greens (primary accents)
        'forest-deep': '#2a3820',
        forest: '#3d4f2a',
        ivy: '#556b3a',
        moss: '#7a8c5a',

        // Terra (warm accents, warnings)
        terra: '#b5552a',
        'terra-deep': '#8b3e1d',
        rust: '#9e5436',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Baskerville', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: {
        content: '1200px',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(46, 42, 31, 0.06), 0 1px 2px rgba(46, 42, 31, 0.04)',
        card: '0 2px 8px rgba(46, 42, 31, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;

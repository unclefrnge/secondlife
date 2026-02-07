import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        danger: 'var(--color-danger)'
      },
      borderRadius: {
        sm: 'var(--radius)',
        md: 'var(--radius)',
        lg: 'var(--radius)'
      },
      transitionTimingFunction: {
        calm: 'var(--ease-calm)'
      },
      transitionDuration: {
        ui: 'var(--duration-ui)'
      },
      boxShadow: {
        focus: '0 0 0 2px rgba(198, 198, 198, 0.5)'
      },
      fontFamily: {
        sans: ['var(--font-sans)']
      }
    }
  },
  plugins: []
};

export default config;

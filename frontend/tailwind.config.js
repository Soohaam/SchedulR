/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['var(--font-inter)', 'system-ui', 'sans-serif'],
        'serif': ['var(--font-cormorant)', 'Georgia', 'serif'],
        'display': ['var(--font-cinzel)', 'serif'],
        'mono': ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'float-up': 'float-up 8s linear infinite',
        'mesh-shift': 'mesh-shift 20s ease-in-out infinite',
      },
      keyframes: {
        'float-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(100vh) scale(0)',
          },
          '10%': {
            opacity: '1',
            transform: 'translateY(90vh) scale(1)',
          },
          '90%': {
            opacity: '1',
            transform: 'translateY(10vh) scale(1)',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(0) scale(0)',
          },
        },
        'mesh-shift': {
          '0%, 100%': { 
            'background-position': '0% 0%, 100% 100%, 0% 0%' 
          },
          '50%': { 
            'background-position': '100% 100%, 0% 0%, 50% 50%' 
          },
        },
      },
    },
  },
  plugins: [],
};
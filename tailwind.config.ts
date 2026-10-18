import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				display: ['Sora', 'Inter', 'sans-serif'],
				sora: ['Sora', 'Inter', 'sans-serif'],
				arabic: ['IBM Plex Sans Arabic', 'Inter', 'sans-serif'],
				grotesk: ['Space Grotesk', 'sans-serif'],
				inter: ['Inter', 'sans-serif'],
			},
			colors: {
				// Volt: no purple/pink neon. Legacy hard-coded colour classes fold into electric blue.
				cyan: colors.blue,
				sky: colors.blue,
				indigo: colors.blue,
				violet: colors.blue,
				purple: colors.blue,
				fuchsia: colors.blue,
				pink: colors.rose,
				volt: {
					DEFAULT: 'hsl(var(--volt))',
					foreground: 'hsl(var(--volt-foreground))',
					soft: 'hsl(var(--volt-soft))',
				},
				electric: 'hsl(var(--electric))',
				'surface-2': 'hsl(var(--surface-2))',
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					light: 'hsl(var(--primary-light))',
					dark: 'hsl(var(--primary-dark))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
					light: 'hsl(var(--success-light))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))',
					light: 'hsl(var(--warning-light))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Storefront "Volt" tokens (defined in src/shop/shop.css, scoped to .shop-root)
				shop: {
					bg: 'var(--shop-bg)',
					surface: 'var(--shop-surface)',
					'surface-2': 'var(--shop-surface-2)',
					border: 'var(--shop-border)',
					text: 'var(--shop-text)',
					muted: 'var(--shop-muted)',
					primary: 'var(--shop-primary)',
					'primary-fg': 'var(--shop-primary-fg)',
					volt: 'var(--shop-volt)',
					'volt-ink': 'var(--shop-volt-ink)',
					'volt-soft': 'var(--shop-volt-soft)',
					electric: 'var(--shop-electric)',
					success: 'var(--shop-success)',
					warning: 'var(--shop-warning)',
					danger: 'var(--shop-danger)',
				},
				brand: {
					cyan: '#8B5CF6',
					violet: '#EC4899',
					orange: '#F97316',
					dark: '#0A0918',
					surface: '#13112A',
					surface2: '#1F1B3D',
					border: '#2E2A5A',
					gold: '#F59E0B',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'primary': 'var(--shadow-primary)',
				'elegant': 'var(--shadow-elegant)',
				'cyan': '0 0 20px rgba(139,92,246,0.3)',
				'cyan-lg': '0 0 40px rgba(139,92,246,0.5)',
				'violet': '0 0 20px rgba(236,72,153,0.3)',
				'orange': '0 0 20px rgba(249,115,22,0.4)',
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-success': 'var(--gradient-success)',
				'gradient-warning': 'var(--gradient-warning)',
				'gradient-card': 'var(--gradient-card)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				gradientShift: {
					'0%, 100%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' },
				},
				borderGlow: {
					'0%': { boxShadow: '0 0 5px rgba(139,92,246,0.3)' },
					'100%': { boxShadow: '0 0 20px rgba(139,92,246,0.8), 0 0 40px rgba(139,92,246,0.3)' },
				},
				float: {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-20px)' },
				},
				ring: {
					'0%': { transform: 'rotate(-15deg)' },
					'50%': { transform: 'rotate(15deg)' },
					'100%': { transform: 'rotate(-15deg)' },
				},
				borderFire: {
					'0%': { borderColor: '#F97316' },
					'50%': { borderColor: '#F59E0B' },
					'100%': { borderColor: '#EF4444' },
				},
				pulseGlow: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' },
				},
				shimmer: {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' },
				},
				'overlay-in': { from: { opacity: '0' }, to: { opacity: '1' } },
				'overlay-out': { from: { opacity: '1' }, to: { opacity: '0' } },
				'dialog-in': {
					from: { opacity: '0', transform: 'translate(-50%, -46%) scale(0.94)', filter: 'blur(4px)' },
					to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)', filter: 'blur(0)' },
				},
				'dialog-out': {
					from: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
					to: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.97)' },
				},
				'pop-in': {
					from: { opacity: '0', transform: 'scale(0.96) translateY(-4px)' },
					to: { opacity: '1', transform: 'scale(1) translateY(0)' },
				},
				'pop-out': {
					from: { opacity: '1', transform: 'scale(1)' },
					to: { opacity: '0', transform: 'scale(0.97)' },
				},
				fadeInUp: {
					'0%': { opacity: '0', transform: 'translateY(30px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'gradient-shift': 'gradientShift 3s ease infinite',
				'border-glow': 'borderGlow 2s ease-in-out infinite alternate',
				'float': 'float 6s ease-in-out infinite',
				'ring': 'ring 2s ease-in-out infinite',
				'border-fire': 'borderFire 2s ease infinite',
				'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
				'shimmer': 'shimmer 2s infinite',
				'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
				'overlay-in': 'overlay-in 0.24s cubic-bezier(0.22,1,0.36,1)',
				'overlay-out': 'overlay-out 0.16s cubic-bezier(0.55,0,1,0.45)',
				'dialog-in': 'dialog-in 0.32s cubic-bezier(0.22,1,0.36,1)',
				'dialog-out': 'dialog-out 0.18s cubic-bezier(0.55,0,1,0.45)',
				'pop-in': 'pop-in 0.18s cubic-bezier(0.22,1,0.36,1)',
				'pop-out': 'pop-out 0.12s cubic-bezier(0.55,0,1,0.45)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

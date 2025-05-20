
import type { Config } from "tailwindcss";

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
			colors: {
				border: '#000000',
				input: '#000000',
				ring: '#000000',
				background: '#FFFFFF',
				foreground: '#000000',
				primary: {
					DEFAULT: '#000000',
					foreground: '#FFFFFF'
				},
				secondary: {
					DEFAULT: '#FFFFFF',
					foreground: '#000000'
				},
				destructive: {
					DEFAULT: '#000000',
					foreground: '#FFFFFF'
				},
				muted: {
					DEFAULT: '#F1F1F1',
					foreground: '#000000'
				},
				accent: {
					DEFAULT: '#F1F1F1',
					foreground: '#000000'
				},
				popover: {
					DEFAULT: '#FFFFFF',
					foreground: '#000000'
				},
				card: {
					DEFAULT: '#FFFFFF',
					foreground: '#000000'
				},
			},
			borderRadius: {
				lg: '0',
				md: '0',
				sm: '0'
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

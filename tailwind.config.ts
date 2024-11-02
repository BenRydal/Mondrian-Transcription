import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,svelte,js,ts}'],

	theme: {
		extend: {}
	},

	plugins: [require('daisyui')]
} satisfies Config;

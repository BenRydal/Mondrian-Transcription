/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  daisyui: {
    themes: ["lofi"],
  },
  plugins: [require("daisyui")],
};

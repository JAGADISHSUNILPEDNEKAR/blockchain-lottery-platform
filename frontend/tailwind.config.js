/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                heist: {
                    red: '#E50914',
                    dark: '#0F0F0F',
                    gray: '#262626',
                    gold: '#F5C518',
                }
            }
        },
    },
    plugins: [],
}

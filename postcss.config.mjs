/** @type {import('postcss-load-config').Config} */
const config = {
    plugins: {
        '@tailwindcss/postcss': {},
        autoprefixer: {}, // Autoprefixer is optional with v4 plugin but good to keep
    },
};

export default config;

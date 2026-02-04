export default {
  from: undefined, // ✅ FIX: prevents PostCSS dev warning
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

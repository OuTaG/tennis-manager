import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

// Garde-fous du découpage en modules : toute variable utilisée doit être
// importée (no-undef / jsx-no-undef), et le moteur (src/engine, src/data)
// ne contient pas de JSX.
export default [
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      "no-undef": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-uses-vars": "error",
      "react-hooks/rules-of-hooks": "error",
      "no-unused-vars": ["warn", { varsIgnorePattern: "^_", args: "none" }],
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: { globals: { ...globals.node } },
  },
];

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Chemins relatifs : le jeu fonctionne sous https://outag.github.io/tennis-manager/
  base: "./",
  plugins: [react()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    testTimeout: 120000,
  },
});

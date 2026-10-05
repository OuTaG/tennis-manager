// Point d'entrée web (Vite). L'application elle-même est dans App.jsx.
import React from "react";
import { createRoot } from "react-dom/client";
import TennisManager from "./App.jsx";
// Polices de la gazette BD, embarquées avec le jeu (fonctionnent hors ligne).
import "@fontsource/archivo-black/400.css";
import "@fontsource/archivo/400.css";
import "@fontsource/archivo/500.css";
import "@fontsource/archivo/600.css";
import "@fontsource/archivo/700.css";
import "@fontsource/archivo/800.css";
import "@fontsource/kalam/700.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TennisManager />
  </React.StrictMode>,
);

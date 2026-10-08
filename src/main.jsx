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

// iPhone : Safari ignore « user-scalable=no » ; on bloque le zoom au
// pincement en annulant ses gestes (gesturestart/change/end, propres à
// WebKit) et tout déplacement à deux doigts.
const noZoom = (e) => e.preventDefault();
["gesturestart", "gesturechange", "gestureend"].forEach(t => document.addEventListener(t, noZoom, { passive: false }));
document.addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TennisManager />
  </React.StrictMode>,
);

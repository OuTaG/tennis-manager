// Accord des textes au féminin (circuit WTA).
import { describe, it, expect } from "vitest";
import { feminizeText } from "../src/engine/feminize.js";

describe("féminisation", () => {
  const cases = [
    ["Nom du joueur", "Nom de la joueuse"],
    ["Entame ratée pour Léa, breaké dès le premier jeu", "Entame ratée pour Léa, breakée dès le premier jeu"],
    ["Les meilleurs joueurs du circuit, classés par points ATP sur 52 semaines.", "Les meilleures joueuses du circuit, classées par points WTA sur 52 semaines."],
    ["Qualifié pour le tableau principal !", "Qualifiée pour le tableau principal !"],
    ["Serveur-volleyeur", "Serveuse-volleyeuse"],
    ["Roi de l'ocre", "Reine de l'ocre"],
  ];
  for (const [src, expected] of cases) {
    it(src, () => expect(feminizeText(src)).toBe(expected));
  }
  it("ne touche pas les textes neutres", () => {
    expect(feminizeText("Semaine suivante")).toBe("Semaine suivante");
  });
});

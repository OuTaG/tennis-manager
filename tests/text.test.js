import { describe, it, expect } from "vitest";
import { firstSentence } from "../src/engine/text.js";

describe("firstSentence", () => {
  it("ne coupe pas sur l'initiale d'un prénom", () => {
    expect(firstSentence("C'est 🇪🇸 C. Alcázar qui a fini par avoir le dernier mot face à 🇮🇹 J. Sinner. Suite du texte."))
      .toBe("C'est 🇪🇸 C. Alcázar qui a fini par avoir le dernier mot face à 🇮🇹 J. Sinner.");
  });
  it("gère les prénoms composés et les points d'exclamation", () => {
    expect(firstSentence("Bravo à J.-M. Dupont ! La suite.")).toBe("Bravo à J.-M. Dupont !");
  });
  it("renvoie tout le texte sans fin de phrase", () => {
    expect(firstSentence("Finale tendue mais S. Tsitsipan")).toBe("Finale tendue mais S. Tsitsipan");
  });
});

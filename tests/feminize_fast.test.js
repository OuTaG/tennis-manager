import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { feminizeText, feminizeTextSlow, requiredLiteral } from "../src/engine/feminize.js";

// La version accélérée (mot obligatoire + mémo) doit donner exactement le même
// résultat que l'application brute de toutes les règles.
describe("feminizeText accéléré", () => {
  it("mot obligatoire : groupes, classes et caractères optionnels ignorés", () => {
    expect(requiredLiteral("([Ll])e vainqueur")).toBe("e vainqueur");
    expect(requiredLiteral("joueurs?")).toBe("joueur");
    expect(requiredLiteral("Il|Elle")).toBe("");
  });
  it("identique à la version complète sur tous les textes du jeu", () => {
    const files = [];
    const walk = (d) => fs.readdirSync(d).forEach((f) => { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : /\.(js|jsx)$/.test(f) && files.push(p); });
    walk(path.resolve(__dirname, "../src"));
    const strs = new Set();
    for (const f of files) {
      const t = fs.readFileSync(f, "utf8");
      for (const m of t.matchAll(/"((?:[^"\\\n]|\\.){3,})"|'((?:[^'\\\n]|\\.){3,})'/g)) strs.add(m[1] || m[2]);
    }
    let diff = 0;
    for (const s of strs) for (const v of [s, "Il " + s, s + " Il est prêt."]) if (feminizeText(v) !== feminizeTextSlow(v)) diff++;
    expect(strs.size).toBeGreaterThan(1000);
    expect(diff).toBe(0);
  });
});

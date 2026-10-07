// Bas du classement : départ proche de zéro, puis montée régulière sur la
// première saison (pas de points fictifs qui fondent, Futures régionaux).
import { describe, it, expect, afterEach, vi } from "vitest";
import { seedRandom, simulateSeasons } from "./helpers.js";
import { generateAtpDatabase } from "../src/engine/database.js";
import { setCircuit } from "../src/engine/circuit.js";

afterEach(() => vi.restoreAllMocks());

describe("points de départ hors du top 1000", () => {
  it("les rangs 1001-1200 font un dégradé régulier du niveau du 1000e à 1 point", () => {
    seedRandom(11);
    setCircuit("atp");
    const db = generateAtpDatabase();
    for (let i = 1000; i < 1200; i++) {
      expect(db[i].points).toBeGreaterThanOrEqual(1);
      expect(db[i].points).toBeLessThanOrEqual(36);
    }
    expect(db[1199].points).toBeLessThanOrEqual(2);
    expect(db[1000].points).toBeGreaterThanOrEqual(28);
    // Milieu de la tranche (~1100e) : environ la moitié.
    const mid = db.slice(1090, 1110).reduce((a, p) => a + p.points, 0) / 20;
    expect(mid).toBeGreaterThan(13);
    expect(mid).toBeLessThan(21);
    // Le 1000e garde ses ~34 points de départ (barème inchangé jusqu'au 1000e).
    expect(db[999].points).toBeGreaterThanOrEqual(25);
  });
});

for (const circuit of ["atp", "wta"]) {
  describe("bas du classement sur une saison " + circuit.toUpperCase(), () => {
    seedRandom(2027);
    const at = {};
    const SAMPLE = [10, 20, 30, 40, 52];
    const { start, db } = simulateSeasons(circuit, 51, (res, wk) => {
      if (SAMPLE.includes(wk)) at[wk] = [1000, 1100, 1150, 1200].map(r => res.newDb[r - 1].points);
    });

    it("les rangs 1100 et 1150 montent semaine après semaine", () => {
      for (const k of [1, 2]) {
        for (let s = 1; s < SAMPLE.length; s++) {
          expect(at[SAMPLE[s]][k], `rang ${[1000, 1100, 1150][k]} S${SAMPLE[s]}`).toBeGreaterThanOrEqual(at[SAMPLE[s - 1]][k] - 1);
        }
      }
      expect(db[1099].points).toBeGreaterThan(start[1099].points + 15);
      expect(db[1149].points).toBeGreaterThan(start[1149].points + 12);
    });

    // Le tout dernier (1200e) dépend d'un seul joueur (souvent un rookie qui
    // vient d'arriver) : on vérifie la montée juste au-dessus.
    it("le 1190e finit la saison nettement au-dessus de son point de départ", () => {
      expect(db[1189].points).toBeGreaterThan(start[1189].points + 8);
    });

    it("le 1000e ne s'effondre pas (au moins 80 % de son départ en fin de saison)", () => {
      expect(db[999].points / start[999].points).toBeGreaterThan(0.8);
    });

    it("le haut du classement garde ses ordres de grandeur", () => {
      for (const rank of [100, 200, 300]) {
        const ratio = db[rank - 1].points / start[rank - 1].points;
        expect(ratio, "rang " + rank).toBeGreaterThan(0.8);
        expect(ratio, "rang " + rank).toBeLessThan(1.4);
      }
    });
  });
}

// Simulation du circuit IA sur une saison complète.
import { describe, it, expect, afterEach, vi } from "vitest";
import { seedRandom, simulateSeasons } from "./helpers.js";

afterEach(() => vi.restoreAllMocks());

for (const circuit of ["atp", "wta"]) {
  describe("saison " + circuit.toUpperCase(), () => {
    seedRandom(2026);
    let gsWinners = [], finalsEntries = [], retirements = 0;
    const { start, db } = simulateSeasons(circuit, 51, (res, wk, year) => {
      retirements += (res.retirements || []).length;
    });
    for (const p of db) {
      for (const e of p.pointsLog) {
        if (["ao", "rg", "wimbledon", "uso"].includes(e.source)) gsWinners.push(e.pts);
        if (e.source === "finals") finalsEntries.push(e.pts);
      }
    }

    it("la base reste triée par points", () => {
      for (let i = 1; i < db.length; i++) expect(db[i - 1].points).toBeGreaterThanOrEqual(db[i].points);
    });

    it("chaque Grand Chelem a un vainqueur à 2000 points", () => {
      expect(gsWinners.filter(x => x === 2000).length).toBe(4);
      expect(gsWinners.filter(x => x === 1200).length).toBe(4);
    });

    it("le Masters réunit 8 joueurs, titre à 1500 points maximum", () => {
      const withPts = finalsEntries.filter(x => x > 0);
      expect(withPts.length).toBeGreaterThanOrEqual(4);
      expect(withPts.length).toBeLessThanOrEqual(8);
      expect(Math.max(...withPts)).toBeLessThanOrEqual(1500);
      expect(Math.max(...withPts)).toBeGreaterThanOrEqual(1000);
    });

    it("les points à chaque rang restent proches du départ", () => {
      for (const rank of [10, 50, 100, 200, 500]) {
        const ratio = db[rank - 1].points / start[rank - 1].points;
        expect(ratio, "rang " + rank).toBeGreaterThan(0.6);
        expect(ratio, "rang " + rank).toBeLessThan(1.6);
      }
    });

    it("quelques joueurs prennent leur retraite", () => {
      const replaced = db.filter(p => !start.some(s => s.id === p.id)).length;
      expect(replaced).toBeGreaterThan(3);
      expect(replaced).toBeLessThan(80);
    });
  });
}

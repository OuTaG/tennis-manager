// Barèmes de points et de primes.
import { describe, it, expect } from "vitest";
import { POINT_SPLITS, PRIZE_SPLITS_V2, TOURNAMENT_FORMATS } from "../src/data/formats.js";
import { getPointSplits } from "../src/engine/circuit.js";
import { FINALS_PTS, finalsResultFor } from "../src/engine/simulation.js";

describe("barèmes", () => {
  it("Grand Chelem : barème réel, 2000 pour le vainqueur", () => {
    expect(POINT_SPLITS.GrandSlam.main).toEqual([10, 45, 90, 180, 360, 720, 1200, 2000]);
  });

  it("chaque barème a une case de plus que le nombre de tours (le titre)", () => {
    for (const [key, fmt] of Object.entries(TOURNAMENT_FORMATS)) {
      const pts = POINT_SPLITS[key];
      if (!pts) continue;
      expect(pts.main.length, key).toBe(fmt.mainRounds.length + 1);
      const prize = PRIZE_SPLITS_V2[key];
      if (prize) expect(prize.main.length, key + " (primes)").toBe(fmt.mainRounds.length + 1);
    }
  });

  it("les points augmentent à chaque tour", () => {
    for (const [key, s] of Object.entries(POINT_SPLITS)) {
      for (let i = 1; i < s.main.length; i++) expect(s.main[i], key).toBeGreaterThanOrEqual(s.main[i - 1]);
    }
  });

  it("Challenger et ITF : barème selon la catégorie", () => {
    expect(getPointSplits("Challenger", { points: 175 }).main.at(-1)).toBe(175);
    expect(getPointSplits("Challenger", { points: 125 }).main.at(-1)).toBe(125);
    expect(getPointSplits("Challenger", { points: 100 }).main.at(-1)).toBe(100);
    expect(getPointSplits("ITF", { points: 25 }).main.at(-1)).toBe(25);
    expect(getPointSplits("ITF", { points: 15 }).main.at(-1)).toBe(15);
  });

  it("Masters : 1500 pour un titre invaincu, 200 par victoire de poule", () => {
    expect(finalsResultFor(3, true, true, true).pts).toBe(1500);
    expect(finalsResultFor(2, true, true, true).pts).toBe(1300);
    expect(finalsResultFor(1, false, false, false).pts).toBe(FINALS_PTS.rr);
    expect(finalsResultFor(0, false, false, false).pts).toBe(0);
  });
});

// Moteur de match.
import { describe, it, expect, afterEach, vi } from "vitest";
import { seedRandom } from "./helpers.js";
import { advanceMatchOneGame, createInitialMatchData, aiWinProb } from "../src/engine/match.js";

afterEach(() => vi.restoreAllMocks());

const stats = (v) => ({ serve: v, forehand: v, backhand: v, stamina: v, mental: v, net: v });
function playMatch(p, o, bo5 = false) {
  const m = createInitialMatchData(bo5, 100, "Dur");
  for (let i = 0; i < 400 && !m.matchComplete; i++) advanceMatchOneGame(m, p, o);
  return m;
}

describe("match", () => {
  it("un match se termine avec un vainqueur en 2 sets gagnants", () => {
    seedRandom(1);
    const m = playMatch(stats(70), stats(70));
    expect(m.matchComplete).toBe(true);
    expect(Math.max(m.pSets, m.oSets)).toBe(2);
  });

  it("Grand Chelem : 3 sets gagnants", () => {
    seedRandom(2);
    const m = playMatch(stats(70), stats(70), true);
    expect(Math.max(m.pSets, m.oSets)).toBe(3);
  });

  it("le plus fort gagne nettement plus souvent", () => {
    seedRandom(3);
    let wins = 0;
    for (let i = 0; i < 60; i++) if (playMatch(stats(80), stats(65)).pSets === 2) wins++;
    expect(wins).toBeGreaterThan(42);
  });

  it("probabilité IA : 50 % à niveau égal, croissante avec l'écart", () => {
    expect(aiWinProb(0)).toBeCloseTo(0.5, 2);
    expect(aiWinProb(5)).toBeGreaterThan(aiWinProb(1));
    expect(aiWinProb(-5)).toBeLessThan(0.5);
  });
});

describe("format des Grands Chelems", () => {
  it("circuit masculin : 3 sets gagnants ; circuit féminin : 2 sets gagnants", async () => {
    const { setCircuit, isBestOfFiveMatch, ALL_TOURNAMENTS, getTournamentFormat } = await import("../src/engine/circuit.js");
    setCircuit("atp");
    const rg = ALL_TOURNAMENTS.find(t => t.id === "rg");
    expect(isBestOfFiveMatch(getTournamentFormat(rg), rg, "main", 0)).toBe(true);
    setCircuit("wta");
    const rgW = ALL_TOURNAMENTS.find(t => t.id === "rg");
    expect(isBestOfFiveMatch(getTournamentFormat(rgW), rgW, "main", 0)).toBe(false);
    setCircuit("atp");
  });

  it("Grand Chelem féminin : jeu décisif à 10 points au 3e set", () => {
    seedRandom(11);
    let sawTb10 = false;
    for (let i = 0; i < 300 && !sawTb10; i++) {
      const m = createInitialMatchData(false, 100, "Gazon");
      m.tb10Decider = true;
      for (let k = 0; k < 400 && !m.matchComplete; k++) advanceMatchOneGame(m, stats(70), stats(70));
      expect(Math.max(m.pSets, m.oSets)).toBe(2);
      const third = m.sets[2];
      if (third && third.tiebreak) {
        sawTb10 = true;
        expect(Math.max(third.tiebreak.pPts, third.tiebreak.oPts)).toBeGreaterThanOrEqual(10);
      }
    }
    expect(sawTb10).toBe(true);
  });
});

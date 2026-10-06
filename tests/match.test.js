// Moteur de match.
import { describe, it, expect, afterEach, vi } from "vitest";
import { seedRandom } from "./helpers.js";
import { advanceMatchOneGame, createInitialMatchData, aiWinProb, aiMatchProb, rollPointKind } from "../src/engine/match.js";
import { PLAYER_STYLES } from "../src/data/staff.js";
import { random, setSeed } from "../src/engine/rng.js";

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

describe("règles et profils", () => {
  it("le service alterne d'un jeu à l'autre, y compris entre deux sets", () => {
    seedRandom(21);
    for (let n = 0; n < 20; n++) {
      const m = createInitialMatchData(false, 100, "Dur");
      let last = null;
      for (let k = 0; k < 400 && !m.matchComplete; k++) {
        const r = advanceMatchOneGame(m, stats(70), stats(68));
        // Le jeu suivant un tie-break est servi par le relanceur du 1er point du tie-break.
        if (last !== null && !r.isTiebreak) expect(r.isPlayerServing).toBe(!last);
        last = r.isTiebreak ? !m.nextServerIsPlayer : r.isPlayerServing;
      }
    }
  });

  it("IA : le serveur-volleyeur est avantagé sur gazon, le contreur sur terre", () => {
    const mk = (style) => {
      const b = PLAYER_STYLES[style].base, s = {};
      for (const k in b) s[k] = b[k] + 20;
      return s;
    };
    const sv = mk("serve_volley"), cp = mk("counter");
    expect(aiMatchProb(sv, cp, "Gazon")).toBeGreaterThan(0.6);
    expect(aiMatchProb(sv, cp, "Terre battue")).toBeLessThan(0.5);
    expect(aiMatchProb(sv, cp, "Gazon")).toBeLessThan(0.8);
  });

  it("plus d'aces avec un gros service, et sur gazon que sur terre", () => {
    seedRandom(4);
    const aces = (serve, surface) => {
      let n = 0;
      for (let i = 0; i < 4000; i++) if (rollPointKind(true, random, { serve, surface }).kind === "ace") n++;
      return n;
    };
    expect(aces(90, "Dur")).toBeGreaterThan(aces(60, "Dur"));
    expect(aces(75, "Gazon")).toBeGreaterThan(aces(75, "Terre battue"));
  });

  it("même graine, même match", () => {
    const run = () => {
      setSeed(1234);
      const m = createInitialMatchData(true, 100, "Terre battue");
      for (let k = 0; k < 400 && !m.matchComplete; k++) advanceMatchOneGame(m, stats(72), stats(71));
      return JSON.stringify(m.sets.map(x => [x.pGames, x.oGames]));
    };
    expect(run()).toBe(run());
  });
});

describe("point décisif en mini-jeu", () => {
  const stats = { serve: 60, forehand: 60, backhand: 60, stamina: 60, mental: 60, net: 60 };
  const findPending = (seed) => {
    seedRandom(seed);
    const m = createInitialMatchData(false, 100, "Dur");
    for (let i = 0; i < 200 && !m.matchComplete; i++) {
      const r = advanceMatchOneGame(m, stats, stats, { allowMiniGame: true });
      if (r.pending) return { m, r };
    }
    return null;
  };

  it("s'arrête sur l'avantage du joueur sans finir le jeu", () => {
    const { m, r } = findPending(3);
    expect(r.points[r.points.length - 1].label).toBe("AV. JOUEUR");
    expect(m.pendingGame).toBeTruthy();
    expect(m.nextServerIsPlayer).toBe(r.isPlayerServing);
  });

  it("gagné : le joueur remporte le jeu", () => {
    const { m, r } = findPending(5);
    const games = m.sets[m.sets.length - 1].pGames;
    m.pendingGame.miniGameWon = true;
    const r2 = advanceMatchOneGame(m, stats, stats);
    expect(r2.points.length).toBe(r.points.length + 1);
    expect(r2.points[r2.points.length - 1].label).toBe("JEU");
    expect(m.sets[m.sets.length - 1].pGames).toBe(games + 1);
    expect(m.nextServerIsPlayer).toBe(!r.isPlayerServing);
  });

  it("perdu : retour à égalité, le jeu continue", () => {
    const { m, r } = findPending(7);
    m.pendingGame.miniGameWon = false;
    const r2 = advanceMatchOneGame(m, stats, stats);
    expect(r2.points[r.points.length].label).toBe("ÉGALITÉ");
    expect(r2.points.length).toBeGreaterThanOrEqual(r.points.length + 3);
    expect(r2.resumeFrom).toBe(r.points.length);
  });
});

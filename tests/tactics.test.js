// Plan de jeu (pause tactique) et mini-jeux de choix.
import { describe, it, expect, afterEach, vi } from "vitest";
import { seedRandom } from "./helpers.js";
import { DEFAULT_TACTICS, coachAdvice, doubleFaultRate, normalizeTactics, tacticsBonus } from "../src/engine/tactics.js";
import { opponentRead, serveDuel, smashResult } from "../src/engine/minigames.js";
import { advanceMatchOneGame, createInitialMatchData } from "../src/engine/match.js";

afterEach(() => vi.restoreAllMocks());
const S = (o) => ({ serve: 70, forehand: 70, backhand: 70, stamina: 70, mental: 70, net: 60, ...o });

describe("plan de jeu", () => {
  it("le plan par défaut ne change rien entre deux profils identiques", () => {
    expect(Math.abs(tacticsBonus(DEFAULT_TACTICS, S(), S(), "Dur", true))).toBeLessThan(0.5);
  });

  it("viser le revers paie contre un revers faible, pas contre un revers fort", () => {
    const t = { ...DEFAULT_TACTICS, target: 1 };
    expect(tacticsBonus(t, S(), S({ backhand: 55, forehand: 80 }), "Dur", false)).toBeGreaterThan(2);
    expect(tacticsBonus(t, S(), S({ backhand: 80, forehand: 55 }), "Dur", false)).toBeLessThan(-2);
  });

  it("monter au filet rapporte plus sur gazon que sur terre", () => {
    const t = { ...DEFAULT_TACTICS, net: 2 };
    const me = S({ net: 82 }), opp = S({ forehand: 60, backhand: 60 });
    expect(tacticsBonus(t, me, opp, "Gazon", false)).toBeGreaterThan(tacticsBonus(t, me, opp, "Terre battue", false));
  });

  it("risquer la 1re balle : plus de doubles fautes, surtout fatigué", () => {
    const risk = { ...DEFAULT_TACTICS, first: 2 };
    expect(doubleFaultRate(risk, 90)).toBeGreaterThan(doubleFaultRate(DEFAULT_TACTICS, 90));
    expect(doubleFaultRate(risk, 20)).toBeGreaterThan(doubleFaultRate(risk, 90));
    expect(doubleFaultRate({ ...DEFAULT_TACTICS, first: 0 }, 20)).toBe(0);
  });

  it("le bon plan fait gagner plus de matchs que le mauvais", () => {
    seedRandom(31);
    const me = S(), opp = S({ backhand: 55, forehand: 80 });
    const win = (target) => {
      let w = 0;
      for (let i = 0; i < 400; i++) {
        const m = createInitialMatchData(false, 95, "Dur");
        m.tactics = normalizeTactics({ target });
        while (!m.matchComplete) advanceMatchOneGame(m, me, opp);
        if (m.pSets > m.oSets) w++;
      }
      return w;
    };
    expect(win(1)).toBeGreaterThan(win(2) + 60);
  });

  it("le coach repère la faiblesse", () => {
    expect(coachAdvice(S(), S({ backhand: 52, forehand: 80 }), "Dur")).toMatchObject({ key: "target", value: 1 });
  });
});

describe("mini-jeux", () => {
  it("duel au service : servir là où il n'attend pas gagne toujours", () => {
    seedRandom(2);
    for (let i = 0; i < 20; i++) expect(serveDuel(0, 1, 60).win).toBe(true);
  });

  it("un adversaire au gros mental repère la zone favorite", () => {
    seedRandom(4);
    let read = 0;
    for (let i = 0; i < 1000; i++) if (opponentRead([2, 2, 2, 1], { mental: 90 }) === 2) read++;
    expect(read).toBeGreaterThan(500);
  });

  it("smash : pile dans la zone verte = gagné, raté = perdu", () => {
    expect(smashResult(0.9).win).toBe(true);
    expect(smashResult(0).win).toBe(false);
  });
});

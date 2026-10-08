// Plan de jeu (pause tactique) et mini-jeux de choix.
import { describe, it, expect, afterEach, vi } from "vitest";
import { seedRandom } from "./helpers.js";
import { DEFAULT_TACTICS, coachAdvice, doubleFaultRate, normalizeTactics, tacticsBonus } from "../src/engine/tactics.js";
import { TRAINING_CARDS, opponentRead, rollTraining, serveDuel, smashResult, trainingOdds } from "../src/engine/minigames.js";
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

  it("jouer court paie contre une volée faible, pas contre une volée forte", () => {
    const t = { ...DEFAULT_TACTICS, depth: 0 };
    expect(tacticsBonus(t, S(), S({ net: 42 }), "Dur", false)).toBeGreaterThan(1.5);
    expect(tacticsBonus(t, S(), S({ net: 82 }), "Dur", false)).toBeLessThan(-1.5);
  });

  it("jouer long paie contre un attaquant, pas contre un défenseur endurant", () => {
    const t = { ...DEFAULT_TACTICS, depth: 2 };
    expect(tacticsBonus(t, S(), S({ serve: 82, forehand: 82, backhand: 62, stamina: 58 }), "Dur", false)).toBeGreaterThan(1.5);
    expect(tacticsBonus(t, S(), S({ serve: 60, forehand: 62, backhand: 80, stamina: 82 }), "Dur", false)).toBeLessThan(-1.5);
  });

  it("varier la longueur est le réglage neutre (au milieu)", () => {
    expect(DEFAULT_TACTICS.depth).toBe(1);
    expect(normalizeTactics({}).depth).toBe(1);
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
  it("duel service/retour : ace à deux cases, retour gagnant si bien lu au T ou à l'extérieur", async () => {
    const { resolveServeDuel, RALLY_POINTS, returnDuel } = await import("../src/engine/minigames.js");
    expect(resolveServeDuel(0, 2)).toMatchObject({ kind: "ace", serverWins: true, shift: 1 });
    expect(resolveServeDuel(2, 0)).toMatchObject({ kind: "ace", serverWins: true, shift: 1 });
    expect(resolveServeDuel(2, 2)).toMatchObject({ kind: "return_winner", serverWins: false });
    expect(resolveServeDuel(0, 0)).toMatchObject({ kind: "return_winner", serverWins: false });
    seedRandom(2);
    expect(resolveServeDuel(1, 1).kind).toBe("rally");
    expect(resolveServeDuel(1, 2).kind).toBe("rally");
    expect(RALLY_POINTS.filter(r => r.serverWins).length).toBe(6);
    expect(RALLY_POINTS.filter(r => !r.serverWins).length).toBe(4);
    expect(serveDuel(0, 2).win).toBe(true);
    const r = returnDuel(1);
    expect(r.win).toBe(!r.serverWins);
  });

  it("phrases de zones : prépositions correctes, T en majuscule", async () => {
    const { ZONES, ZONE_PHRASES, returnDuel } = await import("../src/engine/minigames.js");
    expect(ZONE_PHRASES).toEqual(["à l'extérieur", "dans le corps", "au T"]);
    expect(ZONE_PHRASES.length).toBe(ZONES.length);
    expect(serveDuel(0, 2).text).toBe("Il attendait au T, vous servez à l'extérieur : ace !");
    expect(serveDuel(2, 0).text).toBe("Il attendait à l'extérieur, vous servez au T : ace !");
    // Retour : on cherche un ace adverse (le service part au hasard).
    const aces = new Set();
    for (let s = 1; s < 200 && aces.size < 2; s++) {
      seedRandom(s);
      const g = s % 2 ? 0 : 2;
      const r = returnDuel(g);
      if (r.kind === "ace") aces.add(r.text);
    }
    expect([...aces].sort()).toEqual([
      "Il a servi au T, vous l'attendiez à l'extérieur : ace.",
      "Il a servi à l'extérieur, vous l'attendiez au T : ace.",
    ].sort());
    // Aucune phrase ne garde une zone brute en minuscule (« au t », « servi corps »).
    for (const t of aces) expect(t).not.toMatch(/ au t[ ,:]|servi (corps|extérieur)|attendait (corps|extérieur)/);
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

describe("programmes d'entraînement", () => {
  it("plus le programme est ambitieux, moins il réussit", () => {
    const [routine, intensif, exploit] = TRAINING_CARDS.map(c => trainingOdds(c, { energy: 80, happiness: 70 }));
    expect(routine).toBeGreaterThan(intensif);
    expect(intensif).toBeGreaterThan(exploit);
  });

  it("raté = rien ; plus c'est risqué, plus ça rapporte (×1, ×1,4, ×2)", () => {
    for (const c of TRAINING_CARDS) expect(c.failMul).toBe(0);
    expect(TRAINING_CARDS.map(c => c.successMul)).toEqual([1, 1.4, 2]);
  });

  it("la forme et le coach augmentent les chances", () => {
    const c = TRAINING_CARDS[1];
    expect(trainingOdds(c, { energy: 95, happiness: 90, staffTrainGain: 0.1 })).toBeGreaterThan(trainingOdds(c, { energy: 40, happiness: 30 }));
  });

  it("la fréquence de réussite suit la probabilité affichée", () => {
    seedRandom(12);
    const c = TRAINING_CARDS[1], ctx = { energy: 70, happiness: 60 };
    let ok = 0;
    for (let i = 0; i < 4000; i++) if (rollTraining(c, ctx).success) ok++;
    expect(ok / 4000).toBeCloseTo(trainingOdds(c, ctx), 1);
  });
});

describe("gain d'un programme", () => {
  it("le gain affiché suit le multiplicateur du programme", async () => {
    const { programmeGain, trainingBaseGain } = await import("../src/engine/training.js");
    const { createInitialPlayer } = await import("../src/engine/player.js");
    const player = createInitialPlayer("Test", "allcourt", "Paris", "France");
    const mod = { stat: "serve", baseGain: 0.8 };
    const base = trainingBaseGain(player, mod);
    expect(base).toBeGreaterThan(0);
    expect(programmeGain(player, mod, TRAINING_CARDS[0])).toBeCloseTo(base, 2);
    expect(programmeGain(player, mod, TRAINING_CARDS[2])).toBeCloseTo(base * 2, 2);
  });
});

describe("étoiles de conseil", () => {
  it("donne au plus n réglages distincts, du plus payant au moins payant", async () => {
    const { adviceStars, coachAdvice } = await import("../src/engine/tactics.js");
    const me = { serve: 80, forehand: 75, backhand: 55, stamina: 70, mental: 65, net: 70 };
    const opp = { serve: 60, forehand: 70, backhand: 45, stamina: 55, mental: 60, net: 50 };
    const s3 = adviceStars(me, opp, "Gazon", 3);
    expect(s3.length).toBeGreaterThan(1);
    expect(s3.length).toBeLessThanOrEqual(3);
    expect(new Set(s3.map(x => x.key)).size).toBe(s3.length);
    for (let i = 1; i < s3.length; i++) expect(s3[i - 1].gain).toBeGreaterThanOrEqual(s3[i].gain);
    const c = coachAdvice(me, opp, "Gazon");
    expect(s3[0].key).toBe(c.key);
    expect(adviceStars(me, opp, "Gazon", 0)).toEqual([]);
  });
});

describe("efficacité affichée de l'entraînement", () => {
  it("100 % à pleine énergie, quelle que soit la difficulté ; la difficulté joue sur le gain", async () => {
    const { trainingEfficiency } = await import("../src/engine/training.js");
    const { createInitialPlayer } = await import("../src/engine/player.js");
    const p = createInitialPlayer("T", "allcourt", "Paris", "France", null, 5);
    p.energy = 100; p.happiness = 70; p.age = 24;
    const eff = trainingEfficiency(p);
    expect(Math.round(eff.shown * 100)).toBe(100);
    expect(eff.parts.some(x => x.key === "difficulty")).toBe(false);
    expect(eff.total).toBeLessThan(eff.shown);
  });
});

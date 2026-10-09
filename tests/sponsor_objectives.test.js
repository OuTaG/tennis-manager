// Objectifs de contrat sponsor : tables 26/52 semaines, hiérarchie des niveaux,
// types, seuils des victoires de prestige, compatibilité des anciennes sauvegardes.
import { describe, it, expect } from "vitest";
import {
  buildSponsorObjectiveLevels, evaluateSponsorObjective, generateSponsorOffer,
  sponsorObjectiveCounters, sponsorObjectiveProgress, SPONSOR_OBJECTIVE_TYPES,
} from "../src/engine/sponsors.js";
import { difficultyFactors } from "../src/engine/player.js";
import { feminizeText } from "../src/engine/feminize.js";

const RANKS = [1, 2, 3, 5, 10, 11, 25, 30, 50, 75, 100, 150, 200, 350, 351, 600, 1000, 1500, 3000];
const SEEDS = [0, 1, 2, 3]; // types[seed % 4]
const MULS = [1, difficultyFactors({ startDifficulty: 1 }).sponsorTargetMul, difficultyFactors({ startDifficulty: 5 }).sponsorTargetMul];

describe("objectifs sponsor", () => {
  it("sponsorTargetMul : ±6 % par cran", () => {
    expect(difficultyFactors({ startDifficulty: 1 }).sponsorTargetMul).toBeCloseTo(0.88);
    expect(difficultyFactors({ startDifficulty: 5 }).sponsorTargetMul).toBeCloseTo(1.12);
  });

  it("hiérarchie stricte facile < moyen < ambitieux pour tous rangs, durées, types et difficultés", () => {
    for (const r of RANKS) for (const d of [26, 52]) for (const s of SEEDS) for (const m of MULS) {
      const [e, md, h] = buildSponsorObjectiveLevels(r, d, s, m);
      expect([e.level, md.level, h.level]).toEqual(["easy", "medium", "hard"]);
      if (e.type === "rank") {
        expect(e.target).toBeGreaterThan(md.target);
        expect(md.target).toBeGreaterThan(h.target);
        expect(h.target).toBeGreaterThanOrEqual(1);
        expect(e.target).toBeLessThanOrEqual(1200);
      } else {
        expect(e.target).toBeGreaterThanOrEqual(1);
        expect(md.target).toBeGreaterThan(e.target);
        expect(h.target).toBeGreaterThan(md.target);
      }
      expect([e.rewardMul, md.rewardMul, h.rewardMul]).toEqual([0.6, 1.0, 2.0]);
      expect([e.penaltyMul, md.penaltyMul, h.penaltyMul]).toEqual([0.4, 0.8, 1.2]);
    }
  });

  it("valeurs « moyen » des tables (Pro)", () => {
    const med = (r, d, s) => buildSponsorObjectiveLevels(r, d, s, 1)[1];
    expect(med(5, 26, 2).target).toBe(40);   // victoires, top 10, 26 s
    expect(med(5, 52, 2).target).toBe(85);
    expect(med(20, 26, 1).target).toBe(4);   // titres
    expect(med(20, 52, 1).target).toBe(9);
    expect(med(100, 26, 3).target).toBe(4);  // prestige
    expect(med(100, 52, 3).target).toBe(9);
    expect(med(100, 26, 0).target).toBe(85); // classement 100 × 0,85
    expect(med(100, 52, 0).target).toBe(60);
    expect(med(1000, 26, 0).target).toBe(950); // au-delà du 350e : ×0,95
    expect(med(1000, 52, 0).target).toBe(400);
  });

  it("le type est tiré parmi les quatre, chaque année", () => {
    const seen = new Set(SEEDS.map(s => buildSponsorObjectiveLevels(100, 26, s)[0].type));
    expect([...seen].sort()).toEqual([...SPONSOR_OBJECTIVE_TYPES].sort());
  });

  it("pas d'objectif titres sur 26 semaines au-delà du 350e (remplacé par victoires)", () => {
    expect(buildSponsorObjectiveLevels(600, 26, 1)[0].type).toBe("wins");
    expect(buildSponsorObjectiveLevels(600, 52, 1)[0].type).toBe("titles");
  });

  it("seuil des victoires de prestige selon la tranche, reflété dans le libellé", () => {
    const cases = [[5, 50], [25, 50], [60, 50], [120, 100], [300, 200], [800, 400]];
    for (const [r, thr] of cases) {
      const lv = buildSponsorObjectiveLevels(r, 26, 3);
      for (const l of lv) {
        expect(l.type).toBe("bigwins");
        expect(l.threshold).toBe(thr);
        expect(l.label).toMatch(new RegExp("du top " + thr + "$"));
      }
    }
    expect(buildSponsorObjectiveLevels(300, 26, 3)[1].label).toBe("Battre 3 joueurs du top 200");
    expect(feminizeText("Battre 3 joueurs du top 200")).toBe("Battre 3 joueuses du top 200");
    expect(feminizeText("Battre 1 joueur du top 400")).toBe("Battre 1 joueuse du top 400");
  });

  it("évalue les victoires de prestige sur le compteur du seuil", () => {
    const base = sponsorObjectiveCounters({ careerBigWins: 2, careerWinsTop100: 5, careerWinsTop200: 7, careerWinsTop400: 9 });
    const now = sponsorObjectiveCounters({ careerBigWins: 2, careerWinsTop100: 6, careerWinsTop200: 10, careerWinsTop400: 13 });
    expect(evaluateSponsorObjective({ type: "bigwins", target: 3, threshold: 200 }, base, now, 300)).toBe(true);
    expect(evaluateSponsorObjective({ type: "bigwins", target: 3, threshold: 100 }, base, now, 300)).toBe(false);
    expect(sponsorObjectiveProgress({ type: "bigwins", target: 3, threshold: 400 }, base, now)).toBe(4);
  });

  it("ancienne sauvegarde : objectif sans seuil = top 50, baseline sans compteurs étendus", () => {
    const oldObjective = { type: "bigwins", target: 2, label: "Battre 2 joueurs du top 50", level: "medium" };
    const oldBaseline = { titles: 1, wins: 10, bigwins: 1 };
    const oldPlayer = { titlesWon: 1, careerWins: 20, careerBigWins: 3 }; // pas de careerWinsTop*
    expect(evaluateSponsorObjective(oldObjective, oldBaseline, sponsorObjectiveCounters(oldPlayer), 400)).toBe(true);
    expect(evaluateSponsorObjective({ ...oldObjective, target: 3 }, oldBaseline, sponsorObjectiveCounters(oldPlayer), 400)).toBe(false);
    expect(evaluateSponsorObjective({ type: "wins", target: 10 }, oldBaseline, sponsorObjectiveCounters(oldPlayer), 400)).toBe(true);
    expect(evaluateSponsorObjective({ type: "rank", target: 300 }, oldBaseline, sponsorObjectiveCounters(oldPlayer), 400)).toBe(false);
  });

  it("generateSponsorOffer produit des niveaux cohérents avec la durée", () => {
    for (let i = 0; i < 200; i++) {
      const o = generateSponsorOffer(200, 0, [], 60, {}, 2026, 3);
      if (!o) continue;
      const expected = buildSponsorObjectiveLevels(200, o.durationWeeks, o.brand.length * 7 + o.weeklyPay, 1);
      expect(o.objectiveLevels).toEqual(expected);
    }
  });
});

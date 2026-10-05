// Difficulté, options de partie, villes de départ.
import { describe, it, expect } from "vitest";
import { DIFFICULTY_LEVELS, scoreMultiplier, injuryRiskMul } from "../src/engine/difficulty.js";
import { START_CITIES, createInitialPlayer, startMoney } from "../src/engine/player.js";
import { computeLegacyScore } from "../src/engine/legacy.js";
import { ATP_TOURNAMENTS, WTA_TOURNAMENTS } from "../src/data/tournaments.js";
import { CITIES } from "../src/data/geo.js";
import { distanceKm } from "../src/engine/travel.js";

describe("difficulté et score", () => {
  it("le multiplicateur croît fortement avec le niveau", () => {
    const muls = DIFFICULTY_LEVELS.map(d => scoreMultiplier(d.level));
    for (let i = 1; i < muls.length; i++) expect(muls[i]).toBeGreaterThan(muls[i - 1]);
    expect(scoreMultiplier(5) / scoreMultiplier(1)).toBeGreaterThan(5);
  });

  it("les options ajoutent un bonus", () => {
    expect(scoreMultiplier(5, ["no_staff"])).toBeGreaterThan(scoreMultiplier(5));
    expect(scoreMultiplier(3, ["no_staff", "fragile", "low_budget"])).toBeCloseTo(1.5, 2);
  });

  it("le score de carrière suit le multiplicateur", () => {
    const base = { history: [{ ranking: 50 }], careerWins: 100, titlesByTier: { ATP250: 2 } };
    const pro = computeLegacyScore({ ...base, difficulty: 3 });
    const leg = computeLegacyScore({ ...base, difficulty: 5 });
    expect(leg / pro).toBeCloseTo(2.5, 1);
    // Ancienne carrière sans niveau choisi : comptée comme « Pro ».
    expect(computeLegacyScore({ ...base, startDifficulty: 1 })).toBe(pro);
  });

  it("la ville ne fixe plus la difficulté", () => {
    const p = createInitialPlayer("Test", "allcourt", "Buenos Aires", "France", null, 2, ["fragile"]);
    expect(p.difficulty).toBe(2);
    expect(p.gameOptions).toEqual(["fragile"]);
    expect(injuryRiskMul(p)).toBe(2);
    expect(p.money).toBe(startMoney("Buenos Aires", ["fragile"]));
    expect(startMoney("Paris", ["low_budget"])).toBe(startMoney("Paris") / 2);
  });

  it("la surface de prédilection choisie à la création est respectée", () => {
    const p = createInitialPlayer("Test", "serve_volley", "Paris", "France", null, 3, [], "Terre battue");
    expect(p.favoriteSurface).toBe("Terre battue");
  });
});

describe("circuit secondaire hors Europe", () => {
  for (const [name, list] of [["masculin", ATP_TOURNAMENTS], ["féminin", WTA_TOURNAMENTS]]) {
    it(name + " : un petit tournoi à moins de 3 000 km presque chaque semaine, quelle que soit la ville", () => {
      for (const { city } of START_CITIES) {
        let weeks = 0;
        for (let w = 1; w <= 52; w++) {
          if (list.some(t => (t.tier === "ITF" || t.tier === "Challenger") && t.week === w && distanceKm(city, t.city) <= 3000)) weeks++;
        }
        expect(weeks, city).toBeGreaterThanOrEqual(48);
      }
    });
  }

  it("chaque tournoi a une ville connue et un identifiant unique", () => {
    for (const list of [ATP_TOURNAMENTS, WTA_TOURNAMENTS]) {
      for (const t of list) expect(CITIES[t.city], t.id).toBeTruthy();
      expect(new Set(list.map(t => t.id)).size).toBe(list.length);
    }
  });
});

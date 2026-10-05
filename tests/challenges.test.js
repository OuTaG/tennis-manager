// Défis scénarisés : mise en place, objectifs et score.
import { describe, it, expect, afterEach, vi } from "vitest";
import { seedRandom } from "./helpers.js";
import { setCircuit, ALL_TOURNAMENTS } from "../src/engine/circuit.js";
import { generateAtpDatabase } from "../src/engine/database.js";
import { simulateAtpWeek } from "../src/engine/simulation.js";
import { createInitialPlayer, totalAtpPoints, getPlayerRanking } from "../src/engine/player.js";
import { CHALLENGES, evaluateChallenge, computeChallengeScore, setActiveChallenge } from "../src/engine/challenges.js";

afterEach(() => { vi.restoreAllMocks(); setActiveChallenge(null); });

// Reproduit startChallenge (App.jsx) sans l'interface.
function startChallenge(def) {
  setCircuit(def.circuit);
  const p = createInitialPlayer("Test Défi", def.style, def.city, "France", null, 3);
  let db = generateAtpDatabase();
  for (let w = 2; w <= def.startWeek; w++) db = simulateAtpWeek(db, w, 2026, []).newDb;
  p.week = def.startWeek; p.year = 2026; p.circuit = def.circuit;
  const finals = ALL_TOURNAMENTS.find(t => t.tier === "Finals");
  const deadlineAbs = def.deadline === "finals" ? 2026 * 52 + finals.week : def.deadline.year * 52 + def.deadline.week;
  p.challenge = { id: def.id, status: "active", startAbs: 2026 * 52 + def.startWeek, deadlineAbs, seenEvents: [] };
  def.setup(p, db);
  return { p, db };
}

describe("défis", () => {
  it("4 défis sur chaque circuit", () => {
    expect(CHALLENGES.filter(c => c.circuit === "atp").length).toBe(4);
    expect(CHALLENGES.filter(c => c.circuit === "wta").length).toBe(4);
  });

  for (const def of CHALLENGES) {
    it(def.name + " : démarre en cours, avec un score calculable", () => {
      seedRandom(42);
      const { p, db } = startChallenge(def);
      expect(evaluateChallenge(p, db)).toBeNull();
      const s = computeChallengeScore(p, db, null);
      expect(s.rows.length).toBeGreaterThan(0);
      expect(Number.isFinite(s.score)).toBe(true);
    });
  }

  it("Le Retour démarre autour du 150e rang", () => {
    seedRandom(5);
    const { p, db } = startChallenge(CHALLENGES.find(c => c.id === "retour"));
    const rank = getPlayerRanking(totalAtpPoints(p.atpPointsLog), db);
    expect(rank).toBeGreaterThan(140);
    expect(rank).toBeLessThan(160);
  });

  it("Sous pression : échec si le bonheur passe sous 30", () => {
    seedRandom(6);
    const { p, db } = startChallenge(CHALLENGES.find(c => c.id === "pression"));
    p.happiness = 25;
    const res = evaluateChallenge(p, db);
    expect(res.status).toBe("fail");
    expect(res.score).toBeGreaterThanOrEqual(0);
  });

  it("Fauché : dette remboursée = défi réussi, avec bonus de rapidité", () => {
    seedRandom(8);
    const { p, db } = startChallenge(CHALLENGES.find(c => c.id === "fauche"));
    p.challenge.debt = 0;
    const res = evaluateChallenge(p, db);
    expect(res.status).toBe("success");
    expect(res.score).toBeGreaterThan(3000);
  });
});

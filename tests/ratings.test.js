// Évolution des notes des joueurs IA.
import { describe, it, expect, afterEach, vi } from "vitest";
import { seedRandom, simulateSeasons, avgRating } from "./helpers.js";
import { ageCurve } from "../src/engine/simulation.js";

afterEach(() => vi.restoreAllMocks());

describe("courbe d'âge", () => {
  it("progresse jeune, décline après 30 ans", () => {
    expect(ageCurve(18, 1)).toBeGreaterThan(2);
    expect(ageCurve(22, 1)).toBeGreaterThan(0);
    expect(Math.abs(ageCurve(27, 1))).toBeLessThan(0.5);
    expect(ageCurve(31, 1)).toBeLessThan(0);
    expect(ageCurve(35, 1)).toBeLessThan(ageCurve(31, 1));
  });
});

describe("sur deux saisons", () => {
  seedRandom(7);
  const { start, db } = simulateSeasons("atp", 103);
  const before = new Map(start.map(p => [p.id, { r: avgRating(p.stats), age: p.age }]));
  const delta = (pred) => {
    const d = db.filter(p => before.has(p.id) && pred(before.get(p.id).age)).map(p => avgRating(p.stats) - before.get(p.id).r);
    return d.reduce((a, b) => a + b, 0) / d.length;
  };

  it("les jeunes progressent nettement", () => expect(delta(a => a <= 21)).toBeGreaterThan(2));
  it("les plus de 30 ans déclinent", () => expect(delta(a => a >= 30)).toBeLessThan(-1));
  it("le niveau global reste stable", () => {
    const top = (list, i) => list.map(p => avgRating(p.stats)).sort((a, b) => b - a)[i];
    for (const i of [0, 9, 99, 499]) expect(Math.abs(top(db, i) - top(start, i)), "rang " + (i + 1)).toBeLessThan(3);
  });
});

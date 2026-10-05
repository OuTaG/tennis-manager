// Joueur humain : vie, notoriété, voyages.
import { describe, it, expect } from "vitest";
import { lifeCaps, adjustLife, createInitialPlayer } from "../src/engine/player.js";
import { travelCostBetween } from "../src/engine/travel.js";

const withRank = (p, rank) => ({ ...p, history: [{ week: 1, year: 2026, points: 100, ranking: rank }] });

describe("plafond de notoriété", () => {
  const base = createInitialPlayer("Test Joueur", "allcourt", "Paris", "France", null, 3);

  it("le plafond baisse quand le classement baisse", () => {
    const caps = [1, 10, 100, 500].map(r => lifeCaps(withRank(base, r)).popularity);
    for (let i = 1; i < caps.length; i++) expect(caps[i]).toBeLessThan(caps[i - 1]);
    expect(caps[0]).toBe(100);
  });

  it("un 123e mondial ne dépasse pas son plafond", () => {
    let p = withRank({ ...base, popularity: 60, image: 70 }, 123);
    for (let i = 0; i < 30; i++) p = adjustLife(p, { popularity: 5, image: 5 });
    const caps = lifeCaps(p);
    expect(p.popularity).toBeLessThanOrEqual(caps.popularity);
    expect(p.image).toBeLessThanOrEqual(caps.image);
  });

  it("les baisses s'appliquent toujours", () => {
    const p = adjustLife(withRank({ ...base, popularity: 50 }, 123), { popularity: -5 });
    expect(p.popularity).toBeLessThan(50);
  });
});

describe("création et voyages", () => {
  it("un joueur démarre sans points, 9 000 € à Paris, 18 ans", () => {
    const p = createInitialPlayer("Test Joueur", "allcourt", "Paris", "France", null, 3);
    expect(p.atpPointsLog).toEqual([]);
    expect(p.money).toBe(9000);
    expect(p.age).toBe(18);
  });

  it("voyager coûte plus cher loin, rien sur place", () => {
    expect(travelCostBetween("Paris", "Paris")).toBe(0);
    expect(travelCostBetween("Paris", "Melbourne")).toBeGreaterThan(travelCostBetween("Paris", "Lyon"));
  });
});

// Outils communs aux tests : hasard reproductible et petites simulations.
import { vi } from "vitest";
import { setCircuit } from "../src/engine/circuit.js";
import { generateAtpDatabase } from "../src/engine/database.js";
import { simulateAtpWeek } from "../src/engine/simulation.js";
import { setSeed } from "../src/engine/rng.js";

// Math.random déterministe (mulberry32) : les tests donnent toujours le même résultat.
// Le moteur tire son hasard dans engine/rng.js : on le graine aussi.
export function seedRandom(seed = 12345) {
  setSeed(seed);
  let a = seed >>> 0;
  vi.spyOn(Math, "random").mockImplementation(() => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  });
}

// Simule `weeks` semaines du circuit IA depuis la semaine 2 de 2026.
export function simulateSeasons(circuit, weeks, onWeek) {
  setCircuit(circuit);
  let db = generateAtpDatabase();
  const start = db;
  let year = 2026;
  for (let w = 2; w <= weeks + 1; w++) {
    const wk = ((w - 1) % 52) + 1;
    if (wk === 1) year++;
    const res = simulateAtpWeek(db, wk, year, []);
    db = res.newDb;
    if (onWeek) onWeek(res, wk, year);
  }
  return { start, db };
}

export const avgRating = (s) => Object.values(s).reduce((a, b) => a + b, 0) / Object.keys(s).length;

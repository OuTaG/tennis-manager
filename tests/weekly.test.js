// Défi de la semaine : configuration commune, 3 essais, fin au score.
import { beforeAll, describe, expect, it } from "vitest";

let W, C;
const store = new Map();
beforeAll(async () => {
  globalThis.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  W = await import("../src/engine/weekly.js");
  C = await import("../src/engine/challenges.js");
});

describe("défi de la semaine", () => {
  it("même configuration pour une semaine donnée, une ou deux saisons", () => {
    const a = W.weeklyConfig(44), b = W.weeklyConfig(44);
    expect(a).toEqual(b);
    expect(W.weeklyConfig(45)).not.toEqual(a);
    for (let k = 0; k < 60; k++) expect([1, 2]).toContain(W.weeklyConfig(k).seasons);
  });
  it("change le lundi à 0 h UTC", () => {
    const sun = Date.UTC(2026, 10, 15, 23, 59), mon = Date.UTC(2026, 10, 16, 0, 1);
    expect(W.weeklyKey(mon)).toBe(W.weeklyKey(sun) + 1);
  });
  it("3 essais par semaine", () => {
    expect(W.consumeWeeklyAttempt(7)).toBe(true);
    expect(W.consumeWeeklyAttempt(7)).toBe(true);
    expect(W.consumeWeeklyAttempt(7)).toBe(true);
    expect(W.consumeWeeklyAttempt(7)).toBe(false);
    expect(W.weeklyAttemptsLeft(8)).toBe(3);
  });
  it("se termine à l'échéance avec un score, sans échec", () => {
    const cfg = W.weeklyConfig(44);
    const p = { year: 2027, week: 1, atpPointsLog: [], matchHistory: [], history: [], money: 0, stats: {}, challenge: { id: "weekly", status: "active", startAbs: 2026 * 52 + 1, deadlineAbs: (2025 + cfg.seasons) * 52 + 52, weekly: cfg } };
    C.setActiveChallenge(p.challenge);
    if (cfg.seasons === 2) p.year = 2028;
    const res = C.evaluateChallenge(p, [{ points: 100 }]);
    expect(res.status).toBe("success");
    expect(res.rows.some(r => r.label === "Difficulté")).toBe(true);
  });
});

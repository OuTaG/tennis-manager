// Commentaires en direct et débrief de fin de match : textes complets,
// fidèles au match, sans redite.
import { describe, it, expect } from "vitest";
import { advanceMatchOneGame, createInitialMatchData } from "../src/engine/match.js";
import { pickComment, pickDebrief, setCloseHow } from "../src/engine/commentary.js";
import { setSeed } from "../src/engine/rng.js";

const P = "H. Dupont", O = "K. Ivanov";
const stats = (b) => ({ serve: b, forehand: b, backhand: b, net: b, mental: b, stamina: b });

function playMatch(k) {
  setSeed(100 + k * 7919);
  const m = createInitialMatchData(k % 3 === 0, 90, "Dur");
  const lines = [];
  for (let g = 0; g < 500 && !m.matchComplete; g++) {
    const res = advanceMatchOneGame(m, stats(60 + (k * 7) % 25), stats(60 + (k * 11) % 25), {});
    if (res.pending) continue;
    const ctx = { ...res, log: m.sets[m.sets.length - 1].gameLog, setNo: m.sets.length, pSets: m.pSets, oSets: m.oSets, bo5: m.isGrandSlam, matchComplete: m.matchComplete };
    if (res.setComplete) {
      const how = setCloseHow(res, P, O, ctx.log);
      lines.push(pickComment(res.setWonByPlayer ? "set_won_lead" : "set_lost_lead", { p: P, o: O, score: "6-4", sets: "1-0", how }, ctx));
    } else {
      lines.push(pickComment(res.commentType || res.gameType, { p: P, o: O }, ctx));
    }
  }
  return { m, lines };
}

describe("commentaires et débrief", () => {
  const games = Array.from({ length: 40 }, (_, k) => playMatch(k));

  it("toutes les variables sont remplacées", () => {
    for (const { lines } of games) for (const l of lines) expect(l).not.toMatch(/\{\w+\}|undefined|NaN/);
  });

  it("un jeu blanc n'est jamais annoncé à tort", () => {
    setSeed(7);
    const points = [
      { winner: "p", kind: "rally", label: "15-0", servingPlayer: true },
      { winner: "o", kind: "error", label: "15-15", servingPlayer: true },
      { winner: "p", kind: "ace", label: "30-15", servingPlayer: true },
      { winner: "p", kind: "ace", label: "40-15", servingPlayer: true },
      { winner: "p", kind: "ace", label: "JEU", servingPlayer: true },
    ];
    for (let i = 0; i < 50; i++) {
      const t = pickComment("hold_easy", { p: P, o: O }, { points, isPlayerServing: true, score: { p: 1, o: 1 }, log: [{ playerWon: true, isPlayerServing: true }] });
      expect(t).not.toMatch(/blanc/);
    }
  });

  it("débrief : 2 à 4 phrases, sans variable oubliée, avec le score du vainqueur", () => {
    for (const { m } of games) {
      const d = pickDebrief(m, P, O, { roundIdx: 1, mainRounds: ["1er tour", "2e tour", "3e tour"], city: "Miami", oppRank: 12 });
      expect(d).not.toMatch(/\{\w+\}|undefined|NaN|\$\{/);
      const n = d.replace(/[HK]\. /g, "").split(/(?<=[.!…])\s+/).length;
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(4);
      const won = m.pSets > m.oSets;
      const first = m.sets[0];
      const a = won ? first.pGames : first.oGames, b = won ? first.oGames : first.pGames;
      expect(d).toContain(a + "-" + b);
    }
  });

  it("débrief : les ouvertures varient d'un match à l'autre", () => {
    const openings = games.map(({ m }) => pickDebrief(m, P, O).split(" ").slice(0, 3).join(" "));
    expect(new Set(openings).size).toBeGreaterThan(12);
  });
});

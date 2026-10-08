// Commentaires en direct et débrief de fin de match : textes complets,
// fidèles au match, sans redite.
import { describe, it, expect } from "vitest";
import { advanceMatchOneGame, createInitialMatchData } from "../src/engine/match.js";
import { pickComment, pickDebrief, setCloseHow } from "../src/engine/commentary.js";
import { getRngState, setSeed } from "../src/engine/rng.js";

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

  it("« ultime », « dernier set », « décisive » : seulement après un set décisif", () => {
    for (let k = 0; k < 60; k++) {
      setSeed(500 + k);
      const m = createInitialMatchData(k % 2 === 0, 90, "Dur");
      let last = null;
      for (let g = 0; g < 500 && !m.matchComplete; g++) {
        const res = advanceMatchOneGame(m, stats(70), stats(70), {});
        if (res.pending || !m.matchComplete) continue;
        const ctx = { ...res, log: m.sets[m.sets.length - 1].gameLog, setNo: m.sets.length, pSets: m.pSets, oSets: m.oSets, bo5: m.isGrandSlam, matchComplete: true };
        const how = setCloseHow(res, P, O, ctx.log);
        for (let i = 0; i < 6; i++) last = pickComment(res.setWonByPlayer ? "set_won_match" : "set_lost_match", { p: P, o: O, score: "6-4", sets: "2-0", how }, ctx);
      }
      const decider = m.sets.length === (m.isGrandSlam ? 5 : 3);
      if (!decider) expect(last).not.toMatch(/ultime|dernier set|Dernier set|anche décisive|set décisif|Dernière manche/);
    }
  });

  it("« confirme le break » seulement avec un vrai break d'avance", () => {
    const pts = [{ winner: "p", kind: "rally" }, { winner: "p", kind: "rally" }, { winner: "o", kind: "error" }, { winner: "p", kind: "rally" }, { winner: "p", kind: "winner" }];
    const g = (isPlayerServing, playerWon) => ({ isPlayerServing, playerWon, isTiebreak: false });
    // Breaké, puis débreak, puis service tenu : aucun break d'avance.
    const afterRebreak = [g(true, false), g(false, true), g(true, true)];
    // Service tenu, break, service tenu : le break est confirmé.
    const afterBreak = [g(true, true), g(false, true), g(true, true)];
    let confirmed = 0;
    for (let i = 0; i < 120; i++) {
      const a = pickComment("hold_easy", { p: P, o: O }, { points: pts, isPlayerServing: true, score: { p: 2, o: 1 }, log: afterRebreak, setNo: 1 });
      expect(a).not.toMatch(/confirm|consolide/i);
      const b = pickComment("hold_easy", { p: P, o: O }, { points: pts, isPlayerServing: true, score: { p: 3, o: 0 }, log: afterBreak, setNo: 1 });
      if (/confirm|consolide/i.test(b)) confirmed++;
    }
    expect(confirmed).toBeGreaterThan(0);
  });

  it("débreak différé : pas de « aussitôt » ni « dans la foulée »", () => {
    const g = (isPlayerServing, playerWon) => ({ isPlayerServing, playerWon, isTiebreak: false });
    const log = [g(true, false), g(false, false), g(true, true), g(false, true)]; // break adverse, puis deux jeux, puis débreak
    for (let i = 0; i < 80; i++) {
      const t = pickComment("rebreak", { p: P, o: O }, { points: [{ winner: "p", kind: "winner" }], isPlayerServing: false, score: { p: 2, o: 2 }, log, setNo: 1 });
      expect(t).not.toMatch(/immédiat|aussitôt|dans la foulée|confirmer|pas longtemps/);
    }
  });

  it("débrief : pas deux fois le même verbe, pas deux fois la même phrase de suite, tirages constants", () => {
    const verbs = ["écart", "impos", "convert", "conclu", "renvers", "trembl", "align", "domin"];
    for (const { m } of games) {
      const d = pickDebrief(m, P, O, { city: "Rome" });
      for (const v of verbs) expect(d.split(v).length - 1).toBeLessThanOrEqual(1);
    }
    const { m } = games[3];
    setSeed(42); const d1 = pickDebrief(m, P, O); const s1 = getRngState();
    setSeed(42); const d2 = pickDebrief(m, P, O); const s2 = getRngState();
    expect(s2).toBe(s1); // la mémoire ne change pas le nombre de tirages
    const sentences = (d) => d.replace(/[HK]\. /g, "").split(/(?<=[.!…])\s+/).slice(1);
    const shared = sentences(d1).filter(x => sentences(d2).includes(x));
    expect(shared.length).toBeLessThan(sentences(d1).length);
  });
});

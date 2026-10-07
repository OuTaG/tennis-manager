import { describe, it, expect } from "vitest";
import { buildDuelSteps } from "../src/ui/overlays/MiniGames.jsx";
import { RALLY_POINTS } from "../src/engine/minigames.js";

// Court : couloirs x 16–344, fond y 16–404, filet y 210.
const inCourt = (b) => b.x >= 16 && b.x <= 344 && b.y >= 16 && b.y <= 404;

// Géométrie (viewBox 360×420) : simple x 40–320, fonds y 16 et 404,
// filet y 210 ; relanceur en y 70, serveur en y 372.
const SINGLES = { x0: 40, x1: 320, y0: 16, y1: 404 };
const inSingles = (b) => b.x >= SINGLES.x0 && b.x <= SINGLES.x1 && b.y >= SINGLES.y0 && b.y <= SINGLES.y1;
const inFrame = (b) => b.x >= -7 && b.x <= 367 && b.y >= -7 && b.y <= 427;
const TOP_Y = 70, BOT_Y = 372;
// Distance d'un point au segment [a, b].
const segDist = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
};
// Rejoue les étapes : positions des joueurs au moment de chaque étape.
const replay = (steps) => {
  let ret, srv;
  return steps.map(st => {
    if (st.ret !== undefined) ret = st.ret;
    if (st.srv !== undefined) srv = st.srv;
    return { ...st, retPos: { x: ret, y: TOP_Y }, srvPos: { x: srv, y: BOT_Y } };
  });
};
// Tous les scénarios possibles : ace, retour gagnant, et chaque point
// d'échange pour chaque couple (service, lecture) qui y mène. Le même
// rendu sert au duel au service (joueur en bas) et au retour (joueur en haut).
const scenarios = [];
for (let serveZone = 0; serveZone < 3; serveZone++) for (let readZone = 0; readZone < 3; readZone++) {
  const d = Math.abs(serveZone - readZone);
  if (d === 2) scenarios.push({ name: "ace " + serveZone + "/" + readZone, r: { kind: "ace", serveZone, readZone, shift: readZone + Math.sign(serveZone - readZone) } });
  else if (d === 0 && serveZone !== 1) scenarios.push({ name: "retour gagnant " + serveZone, r: { kind: "return_winner", serveZone, readZone, shift: readZone } });
  else RALLY_POINTS.forEach((rally, i) => scenarios.push({ name: "échange " + i + " (" + rally.text + ") " + serveZone + "/" + readZone, r: { kind: "rally", serveZone, readZone, shift: serveZone, rally } }));
}
const RUNS = 60; // les échanges ont une part de hasard cosmétique

describe("animation des duels : géométrie", () => {
  it("couvre ace, retour gagnant et les 10 points d'échange", () => {
    expect(scenarios.some(s => s.r.kind === "ace")).toBe(true);
    expect(scenarios.some(s => s.r.kind === "return_winner")).toBe(true);
    RALLY_POINTS.forEach(rally => expect(scenarios.some(s => s.r.rally === rally)).toBe(true));
  });

  it("le service rebondit dans le carré visé", () => {
    for (const s of scenarios) {
      const st = buildDuelSteps(s.r)[1];
      expect(st.bounce).toBe(true);
      expect(st.ball.x).toBeGreaterThanOrEqual(180);
      expect(st.ball.x).toBeLessThanOrEqual(320);
      expect(st.ball.y).toBeGreaterThanOrEqual(112);
      expect(st.ball.y).toBeLessThan(210);
    }
  });

  it("après chaque rebond, la balle garde son axe (segments colinéaires, même sens)", () => {
    for (const s of scenarios) for (let k = 0; k < RUNS; k++) {
      const steps = buildDuelSteps(s.r);
      steps.forEach((st, i) => {
        if (!st.bounce || i === steps.length - 1) return;
        const a = steps[i - 1].ball, b = st.ball, c = steps[i + 1].ball;
        const u = { x: b.x - a.x, y: b.y - a.y }, v = { x: c.x - b.x, y: c.y - b.y };
        const cross = (u.x * v.y - u.y * v.x) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y));
        const dot = u.x * v.x + u.y * v.y;
        expect(Math.abs(cross), s.name).toBeLessThan(1e-9);
        expect(dot, s.name).toBeGreaterThan(0);
      });
    }
  });

  it("chaque balle frappée par le relanceur part de sa raquette (sur l'axe du service)", () => {
    for (const s of scenarios.filter(x => x.r.kind !== "ace")) {
      const steps = replay(buildDuelSteps(s.r));
      expect(Math.abs(steps[2].ball.x - steps[2].retPos.x), s.name).toBeLessThan(1e-9);
      expect(inFrame(steps[2].ball), s.name).toBe(true);
    }
  });

  it("ace : la balle passe hors de portée du relanceur", () => {
    for (const s of scenarios.filter(x => x.r.kind === "ace")) {
      const steps = replay(buildDuelSteps(s.r));
      const last = steps[steps.length - 1];
      expect(segDist(last.retPos, steps[1].ball, last.ball), s.name).toBeGreaterThanOrEqual(45);
      expect(inFrame(last.ball), s.name).toBe(false);
    }
  });

  it("coups gagnants : rebond dans le simple, loin de l'adversaire, puis sortie du cadre", () => {
    const winners = scenarios.filter(s => s.r.kind === "return_winner" || (s.r.kind === "rally" && s.r.rally.end === "winner"));
    for (const s of winners) for (let k = 0; k < RUNS; k++) {
      const steps = replay(buildDuelSteps(s.r));
      const last = steps[steps.length - 1], land = steps[steps.length - 2], from = steps[steps.length - 3].ball;
      expect(land.bounce, s.name).toBe(true);
      expect(inSingles(land.ball), s.name).toBe(true);
      const toBottom = land.ball.y > 210;
      expect(toBottom, s.name).toBe(from.y < 210); // rebond chez l'adversaire
      const opp = toBottom ? land.srvPos : land.retPos;
      expect(Math.abs(land.ball.x - opp.x), s.name).toBeGreaterThanOrEqual(80);
      // La balle ne passe jamais à portée de raquette, ni avant ni après le rebond.
      // (Le lob, lui, passe par-dessus l'adversaire : seul son vol est exempté.)
      if (s.r.rally?.shot !== "lob") expect(segDist(opp, from, land.ball), s.name).toBeGreaterThanOrEqual(80);
      expect(segDist(opp, land.ball, last.ball), s.name).toBeGreaterThanOrEqual(80);
      expect(inFrame(last.ball), s.name).toBe(false);
    }
  });

  it("le gagnant part loin de l'adversaire : long de ligne s'il est côté croisé, croisé s'il est côté ligne", () => {
    const winners = scenarios.filter(s => s.r.kind === "rally" && s.r.rally.end === "winner");
    for (const s of winners) for (let k = 0; k < RUNS; k++) {
      const steps = replay(buildDuelSteps(s.r));
      const land = steps[steps.length - 2], from = steps[steps.length - 3].ball;
      const toBottom = land.ball.y > 210;
      const opp = toBottom ? land.srvPos : land.retPos;
      const before = steps[steps.length - 3];
      const oppBefore = toBottom ? before.srvPos : before.retPos;
      const oppSide = Math.sign(oppBefore.x - 180), hitSide = Math.sign(from.x - 180), landSide = Math.sign(land.ball.x - 180);
      expect(landSide, s.name).toBe(-oppSide);
      if (s.r.rally.dir === "line") expect(landSide, s.name).toBe(hitSide);
      if (s.r.rally.dir === "cross") expect(landSide, s.name).toBe(-hitSide);
      expect(Math.abs(opp.x - oppBefore.x), s.name).toBeLessThanOrEqual(16.001); // un pas, pas de téléportation
    }
  });

  it("amortie : rebond court dans le terrain adverse, loin du joueur, la balle meurt dans son axe", () => {
    for (const s of scenarios.filter(x => x.r.kind === "rally" && x.r.rally.end === "drop")) for (let k = 0; k < RUNS; k++) {
      const steps = replay(buildDuelSteps(s.r));
      const last = steps[steps.length - 1], land = steps[steps.length - 2];
      expect(land.bounce).toBe(true);
      expect(inSingles(land.ball) && inSingles(last.ball), s.name).toBe(true);
      const opp = land.ball.y > 210 ? land.srvPos : land.retPos;
      expect(Math.hypot(land.ball.x - opp.x, land.ball.y - opp.y), s.name).toBeGreaterThanOrEqual(80);
    }
  });

  it("fautes : filet (la balle s'arrête au filet) ou rebond nettement hors des lignes", () => {
    for (const s of scenarios.filter(x => x.r.kind === "rally" && (x.r.rally.end === "net" || x.r.rally.end === "out"))) for (let k = 0; k < RUNS; k++) {
      const steps = buildDuelSteps(s.r);
      const last = steps[steps.length - 1];
      if (s.r.rally.end === "net") expect(Math.abs(last.ball.y - 210), s.name).toBeLessThanOrEqual(10);
      else { expect(last.bounce).toBe(true); expect(last.ball.x < 16 || last.ball.x > 344, s.name).toBe(true); }
    }
  });
});

describe("mini-jeu mental", () => {
  it("s'affiche avec son titre, sa consigne et le bouton Respirer", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { createElement } = await import("react");
    const { MatchMiniGame } = await import("../src/ui/overlays/MiniGames.jsx");
    const html = renderToStaticMarkup(createElement(MatchMiniGame, { kind: "mental", oppName: "X", stake: "Balle de set à sauver", myMental: 70, onDone: () => {} }));
    expect(html).toContain("Sang-froid");
    expect(html).toContain("Balle de set à sauver");
    expect(html).toContain("Respirer");
  });
});

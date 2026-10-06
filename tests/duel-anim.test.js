import { describe, it, expect } from "vitest";
import { buildDuelSteps } from "../src/ui/overlays/MiniGames.jsx";
import { RALLY_POINTS } from "../src/engine/minigames.js";

// Court : couloirs x 16–344, fond y 16–404, filet y 210.
const inCourt = (b) => b.x >= 16 && b.x <= 344 && b.y >= 16 && b.y <= 404;

describe("animation des duels", () => {
  it("retour gagnant : rebond dans le terrain côté serveur, puis sortie du cadre", () => {
    const steps = buildDuelSteps({ kind: "return_winner", serveZone: 2, readZone: 2, shift: 2 });
    const last = steps[steps.length - 1];
    const before = steps[steps.length - 2];
    expect(before.bounce).toBe(true);
    expect(inCourt(before.ball)).toBe(true);
    expect(before.ball.y).toBeGreaterThan(210);
    expect(inCourt(last.ball)).toBe(false);
  });

  it("coup gagnant d'échange : rebond dans le terrain avant de sortir", () => {
    const rally = RALLY_POINTS.find(r => r.end === "winner");
    const steps = buildDuelSteps({ kind: "rally", serveZone: 1, readZone: 1, shift: 1, rally });
    const before = steps[steps.length - 2];
    expect(before.bounce).toBe(true);
    expect(inCourt(before.ball)).toBe(true);
    expect(inCourt(steps[steps.length - 1].ball)).toBe(false);
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

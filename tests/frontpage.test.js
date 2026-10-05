// La une du journal d'accueil.
import { describe, it, expect } from "vitest";
import { buildFrontPage, pickDispatches } from "../src/engine/frontpage.js";

const base = { name: "Hugo Lefèvre", age: 21, location: "Paris", year: 2027, week: 14, matchHistory: [] };
const match = (o) => ({ year: 2027, week: 13, tournament: "Miami Open", city: "Miami", opponent: "K. Ivanov", score: "6-4 6-4", tierWon: "Masters1000", surface: "Dur", ...o });

describe("la une", () => {
  it("une blessure qui empêche de jouer passe avant tout", () => {
    const s = buildFrontPage({ player: { ...base, injury: { canPlay: false, label: "Entorse", weeksRemaining: 3 }, matchHistory: [match({ won: true, round: "Vainqueur" })] }, ranking: 80 });
    expect(s.kicker).toBe("Infirmerie");
  });

  it("titre, finale perdue, élimination", () => {
    expect(buildFrontPage({ player: { ...base, matchHistory: [match({ won: true, round: "Vainqueur" })] }, ranking: 80 }).title).toMatch(/Sacre/);
    expect(buildFrontPage({ player: { ...base, matchHistory: [match({ won: false, playedRound: "Finale" })] }, ranking: 80 }).title).toMatch(/Si près/);
    // « 8es de finale » n'est pas une finale.
    expect(buildFrontPage({ player: { ...base, matchHistory: [match({ won: false, playedRound: "8es de finale" })] }, ranking: 80 }).title).toMatch(/Fin de parcours/);
  });

  it("un vieux résultat laisse place au tournoi à venir", () => {
    const enrolled = { name: "Monte-Carlo Open", city: "Monte-Carlo", tier: "Masters1000", surface: "Terre battue", week: 16 };
    const s = buildFrontPage({ player: { ...base, matchHistory: [match({ week: 5, won: false, playedRound: "1er tour" })] }, ranking: 80, enrolled });
    expect(s.title).toBe("Cap sur Monte-Carlo");
  });

  it("dépêches : fil Monde uniquement, sans emoji de tête", () => {
    const d = pickDispatches([
      { id: "x", feed: "personal", content: "privé" },
      { id: "post_ret_1", feed: "world", content: "🎾 Fin d'une carrière" },
      { id: "a", feed: "world", content: "Titre à Rome", tournamentMeta: {} },
    ]);
    expect(d).toEqual([{ rubric: "Retraite", text: "Fin d'une carrière" }, { rubric: "Résultats", text: "Titre à Rome" }]);
  });
});

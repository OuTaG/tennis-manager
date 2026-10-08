import { describe, it, expect } from "vitest";
import { tournamentOutcome, tournamentEarningsFromHistory } from "../src/engine/history.js";

describe("tour atteint dans les meilleurs tournois", () => {
  it("titre, élimination, qualif, en cours", () => {
    expect(tournamentOutcome({ round: "Vainqueur", won: true })).toEqual({ label: "Vainqueur", title: true });
    expect(tournamentOutcome({ round: "Quarts", won: false })).toEqual({ label: "Quarts", title: false, ongoing: false });
    expect(tournamentOutcome({ round: "Q2", won: false }).label).toBe("Qualif 2");
    expect(tournamentOutcome({ round: "2e tour", won: true }).ongoing).toBe(true);
  });
  it("anciennes entrées : retrouvé dans l'historique des matchs (dernier match joué)", () => {
    const hist = [
      { tournament: "Open Doha", week: 3, year: 2026, round: "Demies", won: false, prize: 500 },
      { tournament: "Open Doha", week: 3, year: 2026, round: "Quarts", won: true, prize: 0 },
    ];
    const [e] = tournamentEarningsFromHistory(hist);
    expect(tournamentOutcome(e, hist).label).toBe("Demies");
    expect(tournamentOutcome({ name: "Open Doha", week: 3, year: 2026 }, hist).label).toBe("Demies");
    expect(tournamentOutcome({ name: "Inconnu", week: 1, year: 2026 }, hist)).toBeNull();
  });
});

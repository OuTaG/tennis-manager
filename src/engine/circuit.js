// Circuit actif (ATP/WTA), formats, barèmes, conditions d'entrée.
import { POINT_SPLITS, TOURNAMENT_FORMATS } from "../data/formats.js";
import { TOURNAMENT_LORE, WTA_TOURNAMENT_LORE } from "../data/lore.js";
import { ATP_TOURNAMENTS, WTA_TOURNAMENTS } from "../data/tournaments.js";
import { ACTIVE_CHALLENGE, challengeActive } from "./challenges.js";
import { T } from "../ui/theme.js";

// Liste active du calendrier. Le jeu la lit partout : on remplace son contenu
// selon le circuit de la carrière chargée (voir setCircuit).
export const ALL_TOURNAMENTS = [...ATP_TOURNAMENTS];
export let CIRCUIT = "atp";
export function isWTA() { return CIRCUIT === "wta"; }
export function setCircuit(c) {
  const next = c === "wta" ? "wta" : "atp";
  if (next === CIRCUIT && ALL_TOURNAMENTS.length) return;
  CIRCUIT = next;
  ALL_TOURNAMENTS.length = 0;
  ALL_TOURNAMENTS.push(...(next === "wta" ? WTA_TOURNAMENTS : ATP_TOURNAMENTS));
  _formatCache.clear();
}

// Barème de points d'un tournoi : les Challenger et ITF dépendent de leur
// catégorie (points du vainqueur).
export function getPointSplits(fmtKey, tourn) {
  const pts = tourn && tourn.points;
  if (fmtKey === "Challenger") {
    if (pts >= 175) return POINT_SPLITS.Challenger_175;
    if (pts && pts <= 100) return POINT_SPLITS.Challenger_100;
    return POINT_SPLITS.Challenger;
  }
  if (fmtKey === "ITF") return pts === 25 || pts === 50 ? POINT_SPLITS.ITF_M25 : POINT_SPLITS.ITF;
  return POINT_SPLITS[fmtKey] || POINT_SPLITS.ITF;
}

// Map tournament -> format (cached after first resolution)
export const _formatCache = new Map();
export function getTournamentFormat(tournament) {
  if (_formatCache.has(tournament.id)) return _formatCache.get(tournament.id);
  const overrides = {
    indian_wells: "Masters1000_96",
    miami: "Masters1000_96",
    madrid: "Masters1000_96",
    rome: "Masters1000_96",
    canada: "Masters1000_96",
    cincinnati: "Masters1000_96",
    shanghai: "Masters1000_96",
    monte_carlo: "Masters1000_56",
    paris_bercy: "Masters1000_56",
    washington: "ATP500_48",
    winston: "ATP250_32",
    // WTA 1000 à 56 joueuses
    doha_wta: "Masters1000_56",
    dubai_wta: "Masters1000_56",
    wuhan: "Masters1000_56",
  };
  let fmt;
  if (overrides[tournament.id]) fmt = TOURNAMENT_FORMATS[overrides[tournament.id]];
  else {
    const defaultMap = {
      GrandSlam: "GrandSlam",
      Finals: "Finals",
      Masters1000: "Masters1000_96",
      ATP500: "ATP500_32",
      ATP250: "ATP250_28",
      Challenger: "Challenger",
      ITF: "ITF",
    };
    fmt = TOURNAMENT_FORMATS[defaultMap[tournament.tier]] || TOURNAMENT_FORMATS.ITF;
  }
  _formatCache.set(tournament.id, fmt);
  return fmt;
}

// Determine entry status for a player at a tournament
// Returns: { status: "direct" | "qualifying" | "blocked", reason: string }
// Rang du joueur à la Race (points de l'année civile), tenu à jour par
// TennisManager : l'accès au Masters de fin d'année en dépend.
export let PLAYER_RACE_RANK = 9999;
export function setPlayerRaceRank(v) { PLAYER_RACE_RANK = v; }
export function getEntryStatus(tournament, ranking, raw) {
  if (tournament.tier === "Finals") {
    return PLAYER_RACE_RANK <= 8
      ? { status: "direct", reason: "Qualifié via la Race (" + PLAYER_RACE_RANK + "e)" }
      : { status: "blocked", reason: "Réservé aux 8 premiers de la Race" };
  }
  // Défi « Le Retour » : classement protégé pour un nombre limité d'entrées.
  const pc = ACTIVE_CHALLENGE;
  if (!raw && challengeActive() && pc.protectedRank && (pc.protectedUses || 0) > 0 && pc.protectedRank < ranking) {
    const natural = getEntryStatus(tournament, ranking, true);
    if (natural.status !== "direct" && getEntryStatus(tournament, pc.protectedRank, true).status === "direct") {
      return { status: "direct", protected: true, reason: "Classement protégé n°" + pc.protectedRank + " (" + pc.protectedUses + " entrée" + (pc.protectedUses > 1 ? "s" : "") + " restante" + (pc.protectedUses > 1 ? "s" : "") + ")" };
    }
  }
  const fmt = getTournamentFormat(tournament);
  if (ranking <= fmt.directCut) return { status: "direct", reason: "Entrée directe en tableau principal" };
  if (ranking <= fmt.qualiCut) return { status: "qualifying", reason: "Entrée par les qualifications (" + fmt.qualiRounds + " tours à gagner)" };
  return { status: "blocked", reason: "Classement insuffisant (top " + fmt.qualiCut + " requis)" };
}

// Is player seeded? (top X by ranking)
// Number of seeds varies by draw size: 32-draw = 8 seeds, 56-draw = 16 seeds, 96-draw = 32 seeds, 128-draw = 32 seeds
export function getSeedCount(format) {
  if (format.drawSize >= 96) return 32;
  if (format.drawSize >= 48) return 16;
  if (format.drawSize >= 28) return 8;
  return 4;
}

// Does the player get a 1st-round bye? (Only applies if entered as direct acceptance and ranked among top byeSeeds)
export function playerHasBye(format, ranking) {
  if (format.byeSeeds === 0) return false;
  return ranking <= format.byeSeeds;
}

// Absolute week index of a tournament relative to the player's current date.
export function tournamentAbsWeek(t, player) {
  const year = t.week >= player.week ? player.year : player.year + 1;
  return year * 52 + t.week;
}

export function getTournamentLore(tournamentId) {
  if (isWTA()) return WTA_TOURNAMENT_LORE[tournamentId] || null;
  return TOURNAMENT_LORE[tournamentId] || null;
}

// Format en sets d'un match donné. Grand Chelem masculin : 3 sets gagnants
// dans le tableau final. En qualifications, 2 sets gagnants, sauf au dernier
// tour des qualifications de Wimbledon (seul qualif encore en 3 sets gagnants).
// Circuit féminin : toujours 2 sets gagnants, Grands Chelems compris.
export function isBestOfFiveMatch(fmt, tourn, mode, roundIdx) {
  if (!fmt || fmt.setsToWin !== 3) return false;
  if (isWTA()) return false;
  if (mode !== "qualifying") return true;
  return !!tourn && tourn.id === "wimbledon" && roundIdx === (fmt.qualiRounds || 3) - 1;
}

export function tierColor(tier) {
  return { GrandSlam: "#b8891f", Finals: "#8a6a9e", Masters1000: "#7d8a93", ATP500: "#a86b3c", ATP250: T.green, Challenger: T.blue, ITF: T.clay }[tier] || T.fg4;
}
export function tierLabel(tier) {
  return { GrandSlam: "Majeur", Finals: "Masters", Masters1000: "Grand 1000", ATP500: "Tour 500", ATP250: "Tour 250", Challenger: "Circuit Pro", ITF: "Circuit Open" }[tier] || tier;
}

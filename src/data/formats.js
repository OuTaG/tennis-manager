// Formats de tableau, barèmes de points et répartition des primes.

// ─── TOURNAMENT FORMATS ────────────────────────────────────────────────────────
// Real ATP formats with draw sizes, qualifying rounds, byes for top seeds, and direct entry cutoffs.
//
// ROUNDS naming convention:
//   "1er tour" = round of 128/64/32 (start of main draw for non-seeds)
//   "2e tour" = round of 64/32/16 (where top seeds with byes enter)
//   etc.
//
// directCut: rank at which player gets DIRECT MAIN-DRAW entry (no qualifying needed)
// qualiCut: rank at which player can enter QUALIFYING (between directCut and qualiCut)
// qualiRounds: number of qualifying rounds to win to reach main draw
// mainRounds: list of main-draw rounds (top to bottom)
// byeUntilRound: index of round where top seeds enter (0 = no byes, 1 = top X enter at 2nd round)
// byeSeeds: number of top seeds that get a 1st-round bye
export const TOURNAMENT_FORMATS = {
  // Masters de fin d'année : 8 qualifiés, deux poules de 4, puis demies et
  // finale (voir simulateFinalsRR / buildFinalsDraw).
  Finals: {
    label: "Masters",
    drawSize: 8,
    directCut: 8,
    qualiCut: 8,
    qualiRounds: 0,
    mainRounds: ["Poules · match 1", "Poules · match 2", "Poules · match 3", "Demi-finale", "Finale"],
    byeUntilRound: 0,
    byeSeeds: 0,
    setsToWin: 2,
  },
  GrandSlam: {
    label: "Majeur",
    drawSize: 128,
    directCut: 104,
    qualiCut: 230,
    qualiRounds: 3,
    mainRounds: ["1er tour", "2e tour", "3e tour", "8es de finale", "Quarts", "Demies", "Finale"],
    byeUntilRound: 0,
    byeSeeds: 0,
    setsToWin: 3, // best-of-5
  },
  Masters1000_96: {
    label: "Grand 1000",
    drawSize: 96,
    directCut: 76,
    qualiCut: 180,
    qualiRounds: 2,
    mainRounds: ["1er tour", "2e tour", "3e tour", "8es de finale", "Quarts", "Demies", "Finale"],
    byeUntilRound: 1, // top 32 seeds skip round 0
    byeSeeds: 32,
    setsToWin: 2,
  },
  Masters1000_56: {
    label: "Grand 1000",
    drawSize: 56,
    directCut: 50,
    qualiCut: 130,
    qualiRounds: 2,
    mainRounds: ["1er tour", "2e tour", "3e tour", "Quarts", "Demies", "Finale"],
    byeUntilRound: 1, // top 8 seeds skip round 0
    byeSeeds: 8,
    setsToWin: 2,
  },
  ATP500_48: {
    label: "Tour 500",
    drawSize: 48,
    directCut: 65,
    qualiCut: 170,
    qualiRounds: 2,
    mainRounds: ["1er tour", "2e tour", "8es de finale", "Quarts", "Demies", "Finale"],
    byeUntilRound: 1, // top 16 seeds skip round 0
    byeSeeds: 16,
    setsToWin: 2,
  },
  ATP500_32: {
    label: "Tour 500",
    drawSize: 32,
    directCut: 55,
    qualiCut: 150,
    qualiRounds: 2,
    mainRounds: ["1er tour", "8es de finale", "Quarts", "Demies", "Finale"],
    byeUntilRound: 0,
    byeSeeds: 0,
    setsToWin: 2,
  },
  ATP250_28: {
    label: "Tour 250",
    drawSize: 28,
    directCut: 70,
    qualiCut: 250,
    qualiRounds: 2,
    mainRounds: ["1er tour", "8es de finale", "Quarts", "Demies", "Finale"],
    byeUntilRound: 1, // top 4 seeds skip round 0
    byeSeeds: 4,
    setsToWin: 2,
  },
  ATP250_32: {
    label: "Tour 250",
    drawSize: 32,
    directCut: 80,
    qualiCut: 250,
    qualiRounds: 2,
    mainRounds: ["1er tour", "8es de finale", "Quarts", "Demies", "Finale"],
    byeUntilRound: 0,
    byeSeeds: 0,
    setsToWin: 2,
  },
  Challenger: {
    label: "Circuit Pro",
    drawSize: 32,
    directCut: 200, // direct entry top 200
    qualiCut: 450, // qualis open up to ~450
    qualiRounds: 2,
    mainRounds: ["1er tour", "8es de finale", "Quarts", "Demies", "Finale"],
    byeUntilRound: 0,
    byeSeeds: 0,
    setsToWin: 2,
  },
  ITF: {
    label: "Circuit Open",
    drawSize: 32,
    directCut: 600,
    qualiCut: 9999,
    qualiRounds: 2,
    mainRounds: ["1er tour", "8es de finale", "Quarts", "Demies", "Finale"],
    byeUntilRound: 0,
    byeSeeds: 0,
    setsToWin: 2,
  },
};

// Tag each format with its own key so we don't need Object.keys().find() at runtime
Object.keys(TOURNAMENT_FORMATS).forEach(k => { TOURNAMENT_FORMATS[k]._key = k; });

// ─── PRIMES ET POINTS : BARÈMES CALÉS SUR LE CIRCUIT RÉEL ─────────────────
// Sources : barème officiel des points ATP (2024+) et dotations 2025-2026
// (Roland-Garros, Indian Wells, Barcelone, Brisbane, ITF M15/M25).
// Chaque tableau "qualifying" a qualiRounds + 1 cases : index r = éliminé au
// tour de qualif r (Q1 = 0), dernière case = qualifié. "main" : index 0 =
// éliminé au 1er tour, dernière case = vainqueur.
// Comme sur le vrai circuit : 0 point pour une défaite au 1er tour des qualifs
// (et au 1er tour des tableaux ATP 500 / 250 / Challenger / ITF), et le
// qualifié cumule ses points de qualif avec ceux du tableau final.
// Primes : fractions de la prime du vainqueur (tourn.prize). Les qualifs ne
// paient rien en ITF.
export const PRIZE_SPLITS_V2 = {
  Finals:          { qualifying: [],                               main: [0.07, 0.15, 0.23, 0.31, 0.53, 1.0] },
  // Roland-Garros 2025
  GrandSlam:       { qualifying: [0.0082, 0.0116, 0.0169, 0.0169], main: [0.0306, 0.0459, 0.0659, 0.1039, 0.1725, 0.2706, 0.50, 1.0] },
  // Indian Wells 2026
  Masters1000_96:  { qualifying: [0.0064, 0.0123, 0.0123],         main: [0.0211, 0.0314, 0.0537, 0.0918, 0.1682, 0.2955, 0.5318, 1.0] },
  // Même échelle qu'Indian Wells, tableau de 56 (qualifs estimées)
  Masters1000_56:  { qualifying: [0.0094, 0.0182, 0.0182],         main: [0.0314, 0.0537, 0.0918, 0.1682, 0.2955, 0.5318, 1.0] },
  // Barcelone 2025 (2e tour et qualifs estimés)
  ATP500_48:       { qualifying: [0.0125, 0.0242, 0.0242],         main: [0.0417, 0.058, 0.0761, 0.1446, 0.2767, 0.5333, 1.0] },
  ATP500_32:       { qualifying: [0.0125, 0.0242, 0.0242],         main: [0.0417, 0.0761, 0.1446, 0.2767, 0.5333, 1.0] },
  // Brisbane 2025
  ATP250_28:       { qualifying: [0.0192, 0.0359, 0.0359],         main: [0.0678, 0.1130, 0.1927, 0.3408, 0.5834, 1.0] },
  ATP250_32:       { qualifying: [0.0192, 0.0359, 0.0359],         main: [0.0678, 0.1130, 0.1927, 0.3408, 0.5834, 1.0] },
  // Même répartition que l'ATP 250 (estimation)
  Challenger:      { qualifying: [0.0192, 0.0359, 0.0359],         main: [0.0678, 0.1130, 0.1927, 0.3408, 0.5834, 1.0] },
  // ITF M15 : pas de prime en qualifs
  ITF:             { qualifying: [0, 0, 0],                        main: [0.0722, 0.1194, 0.2028, 0.3486, 0.5889, 1.0] },
};

// Points ATP (barème officiel)
export const POINT_SPLITS = {
  GrandSlam:       { qualifying: [0, 8, 16, 30], main: [10, 45, 90, 180, 360, 720, 1200, 2000] },
  Finals:          { qualifying: [],             main: [0, 200, 400, 600, 1000, 1500] },
  Masters1000_96:  { qualifying: [0, 10, 20],    main: [10, 30, 50, 100, 200, 400, 650, 1000] },
  Masters1000_56:  { qualifying: [0, 16, 30],    main: [10, 50, 100, 200, 400, 650, 1000] },
  ATP500_48:       { qualifying: [0, 8, 16],     main: [0, 25, 50, 100, 200, 330, 500] },
  ATP500_32:       { qualifying: [0, 13, 25],    main: [0, 50, 100, 200, 330, 500] },
  ATP250_28:       { qualifying: [0, 7, 13],     main: [0, 25, 50, 100, 165, 250] },
  ATP250_32:       { qualifying: [0, 7, 13],     main: [0, 25, 50, 100, 165, 250] },
  Challenger_175:  { qualifying: [0, 3, 6],      main: [0, 13, 25, 50, 90, 175] },
  Challenger:      { qualifying: [0, 3, 5],      main: [0, 8, 16, 35, 64, 125] },   // Challenger 125
  Challenger_100:  { qualifying: [0, 2, 4],      main: [0, 7, 14, 25, 50, 100] },
  ITF_M25:         { qualifying: [0, 0, 0],      main: [0, 1, 3, 8, 16, 25] },
  ITF:             { qualifying: [0, 0, 0],      main: [0, 1, 2, 4, 8, 15] },       // ITF M15
};

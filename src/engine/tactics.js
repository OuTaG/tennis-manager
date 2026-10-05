// Plan de jeu du joueur pendant un match (pause tactique).
// Cinq réglages à trois positions. Chacun déplace la note effective du
// joueur selon le duel de profils (ses points forts contre les points faibles
// adverses) et la surface, et change la fatigue et l'allure des points.
// Aucun réglage n'est bon partout : c'est le duel qui décide.

export const TACTIC_DEFS = [
  { key: "style",  label: "Attitude",  options: ["Défensif", "Équilibré", "Offensif"],
    hints: ["moins de fautes, moins de coups gagnants", "le juste milieu", "+ coups gagnants, + fautes"] },
  { key: "first",  label: "1re balle", options: ["Assurer", "Normal", "Risquer"],
    hints: ["pas de double faute, service moins tranchant", "le juste milieu", "+ aces, + doubles fautes (surtout fatigué)"] },
  { key: "rally",  label: "Échanges",  options: ["Tenir le point", "Normal", "Abréger"],
    hints: ["use l'adversaire, coûte de l'énergie", "le juste milieu", "points courts, économise l'énergie"] },
  { key: "net",    label: "Filet",     options: ["Fond de court", "Parfois", "Monter"],
    hints: ["solide face à un bon passeur", "le juste milieu", "payant contre un passing faible, surtout sur gazon"] },
  { key: "target", label: "Cible",     options: ["Varier", "Son revers", "Son coup droit"],
    hints: ["imprévisible", "insister sur son revers", "insister sur son coup droit"] },
];

export const DEFAULT_TACTICS = { style: 1, first: 1, rally: 1, net: 1, target: 0 };

const NET_SURFACE = { "Gazon": 1.4, "Indoor": 1.15, "Dur": 1, "Terre battue": 0.6 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const avg = (a, b) => ((a ?? 50) + (b ?? 50)) / 2;

export function normalizeTactics(t) {
  const out = { ...DEFAULT_TACTICS };
  for (const d of TACTIC_DEFS) {
    const v = t && t[d.key];
    if (v === 0 || v === 1 || v === 2) out[d.key] = v;
  }
  return out;
}

// Bonus de note (en points de note) apporté par le plan de jeu.
// serving : le joueur sert-il ce point ? (la 1re balle ne joue qu'au service)
export function tacticsBonus(tactics, me, opp, surface, serving) {
  const t = normalizeTactics(tactics);
  const attack = avg(me.serve, me.forehand), oppAttack = avg(opp.serve, opp.forehand);
  const defense = avg(me.stamina, me.backhand), oppDefense = avg(opp.stamina, opp.backhand);
  let b = 0;
  // Attitude : on joue sur ses forces contre les faiblesses adverses.
  if (t.style === 2) b += (attack - oppDefense) * 0.12;
  if (t.style === 0) b += (defense - oppAttack) * 0.12;
  // Échanges : tenir le point profite au plus endurant, abréger au plus puissant.
  if (t.rally === 0) b += ((me.stamina ?? 50) - (opp.stamina ?? 50)) * 0.08 + ((me.mental ?? 50) - (opp.mental ?? 50)) * 0.04;
  if (t.rally === 2) b += (attack - (opp.stamina ?? 50)) * 0.06;
  // Filet : la volée contre le passing adverse, amplifiée sur surface rapide.
  const passing = avg(opp.forehand, opp.backhand);
  const netK = NET_SURFACE[surface] ?? 1;
  if (t.net === 2) b += ((me.net ?? 50) - passing) * 0.10 * netK;
  if (t.net === 0) b += (passing - (opp.net ?? 50)) * 0.03;
  // Cible : insister sur la faiblesse… ou sur la force.
  const wing = (opp.forehand ?? 50) - (opp.backhand ?? 50);
  if (t.target === 1) b += wing * 0.12;
  if (t.target === 2) b += -wing * 0.12;
  if (t.target === 0) b += 0.4;
  // 1re balle : le risque ne paie que pour un gros serveur.
  if (serving) {
    if (t.first === 2) b += 1.5 + ((me.serve ?? 50) - 60) * 0.10;
    if (t.first === 0) b -= 1;
  }
  return clamp(b, -6, 6);
}

// Part des points de service perdus sur double faute selon le réglage et
// l'énergie (la fatigue fait trembler le bras).
export function doubleFaultRate(tactics, energy) {
  const t = normalizeTactics(tactics);
  if (t.first === 0) return 0;
  const tired = energy < 50 ? (50 - energy) * 0.0008 : 0;
  return (t.first === 2 ? 0.04 : 0.012) + tired;
}

// Multiplicateurs de fatigue (joueur, adversaire).
export function tacticsEnergy(tactics) {
  const t = normalizeTactics(tactics);
  let self = 1, opp = 1;
  if (t.style === 2) self *= 1.12;
  if (t.style === 0) self *= 1.08;
  if (t.rally === 0) { self *= 1.25; opp *= 1.2; }
  if (t.rally === 2) self *= 0.85;
  if (t.net === 2) self *= 1.08;
  return { self, opp };
}

// Allure des points (animation et statistiques d'aces).
export function tacticsShape(tactics) {
  const t = normalizeTactics(tactics);
  let aceMul = 1, longMul = 1;
  if (t.first === 2) aceMul *= 1.35;
  if (t.first === 0) aceMul *= 0.7;
  if (t.style === 2) longMul *= 0.75;
  if (t.style === 0) longMul *= 1.3;
  if (t.rally === 0) longMul *= 1.4;
  if (t.rally === 2) longMul *= 0.6;
  return { aceMul, longMul };
}

// Conseil du coach : le réglage le plus payant contre cet adversaire.
export function coachAdvice(me, opp, surface) {
  const candidates = [];
  for (const d of TACTIC_DEFS) {
    for (let v = 0; v < 3; v++) {
      if (v === DEFAULT_TACTICS[d.key]) continue;
      const t = { ...DEFAULT_TACTICS, [d.key]: v };
      const gain = (tacticsBonus(t, me, opp, surface, true) + tacticsBonus(t, me, opp, surface, false)) / 2
        - (tacticsBonus(DEFAULT_TACTICS, me, opp, surface, true) + tacticsBonus(DEFAULT_TACTICS, me, opp, surface, false)) / 2;
      candidates.push({ key: d.key, value: v, gain });
    }
  }
  candidates.sort((a, b) => b.gain - a.gain);
  const best = candidates[0];
  const wing = (opp.forehand ?? 50) - (opp.backhand ?? 50);
  const lines = {
    "target:1": "Son revers est fragile. Joue dessus !",
    "target:2": "Son coup droit est son point faible, étonnamment. Vise-le.",
    "rally:0": "Il est moins endurant que toi. Fais-le courir, tiens l'échange.",
    "rally:2": "Ne te laisse pas user. Frappe fort et abrège.",
    "net:2": "Son passing ne tient pas. Monte au filet !",
    "net:0": "Il passe bien. Reste au fond.",
    "style:2": "Tu as plus de puissance que lui. Prends l'initiative.",
    "style:0": "Il frappe fort. Défends, laisse-le faire la faute.",
    "first:2": "Ton service peut faire mal. Prends des risques en première.",
    "first:0": "Assure la première, ne lui offre pas de points.",
  };
  if (!best || best.gain < 0.4) {
    return { text: "Match équilibré. Garde ton plan et reste solide.", key: null, value: null };
  }
  const k = best.key + ":" + best.value;
  return { text: lines[k] || (wing > 0 ? lines["target:1"] : lines["target:2"]), key: best.key, value: best.value };
}

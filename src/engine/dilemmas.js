// Dilemmes en cours de match et proposition de match arrangé.
import { PLAYER_STYLES } from "../data/staff.js";
import { getPlayerProfile } from "./database.js";

// ─── DILEMMA SYSTEM ───────────────────────────────────────────────────────────
// Each dilemma has options whose correctness depends on opponent's profile.
// Effects can persist across multiple games (lasting modifiers).
export const DILEMMA_TEMPLATES = [
  {
    id: "attack_weakness", title: "Étudier la faille adverse",
    desc: "Vous repérez un possible point faible. Quelle stratégie adopter ?",
    options: [
      { label: "Attaquer le revers", iconName: "target", targets: "backhand", pickFor: "weak_backhand" },
      { label: "Attaquer le coup droit", iconName: "rocket", targets: "forehand", pickFor: "weak_forehand" },
      { label: "Le faire monter au filet", iconName: "goal", targets: "net", pickFor: "weak_net" },
      { label: "Allonger les échanges", iconName: "run", targets: "stamina", pickFor: "weak_stamina" },
    ],
  },
  {
    id: "tempo", title: "Question de rythme",
    desc: "{o} commence à dicter le tempo. Comment réagir ?",
    options: [
      { label: "Accélérer le rythme", iconName: "energy", risky: true, against: "puncher", goodAgainst: "counter" },
      { label: "Casser le rythme avec des slices", iconName: "brain", goodAgainst: "puncher", against: "counter" },
      { label: "Allonger les échanges", iconName: "run", goodAgainst: "serve_volley", against: "baseliner" },
      { label: "Continuer comme avant", iconName: "check", neutral: true },
    ],
  },
  {
    id: "positioning", title: "Choix de positionnement",
    desc: "Vous devez choisir comment vous placer face à {o}.",
    options: [
      { label: "Monter au filet", iconName: "goal", goodAgainst: "counter", against: "serve_volley" },
      { label: "Rester en fond de court", iconName: "shield", goodAgainst: "serve_volley", against: "baseliner" },
      { label: "Alterner court/long", iconName: "sparkles", goodAgainst: "baseliner", against: "allcourt" },
    ],
  },
  {
    id: "physical", title: "Gestion physique",
    desc: "Le match s'éternise, vous sentez la fatigue arriver.",
    options: [
      { label: "Pause hydratation", iconName: "drop", effect: { energy: 8, momentum: -1 } },
      { label: "Pousser malgré tout", iconName: "fire", effect: { energy: -5, momentum: 1, riskInjury: 0.05 } },
      { label: "Respirer profondément", iconName: "brain", effect: { energy: 3, momentum: 0 } },
    ],
  },
  {
    id: "tactical_risk", title: "Risque tactique",
    desc: "Une opportunité s'offre à vous. La saisir ?",
    options: [
      { label: "Tout donner sur ce jeu", iconName: "fire", effect: { momentum: 3, energy: -8, persist: 1 }, risky: true },
      { label: "Sécuriser ses appuis", iconName: "shield", effect: { momentum: 0, energy: 2 } },
      { label: "Tester un nouveau coup", iconName: "sparkles", experimental: true },
    ],
  },
  {
    id: "shot_choice", title: "Choix de coup",
    desc: "Quelle frappe privilégier face à {o} ?",
    options: [
      { label: "Premières balles puissantes", iconName: "rocket", goodAgainst: "counter", against: "puncher" },
      { label: "Service-volée appuyé", iconName: "target", goodAgainst: "baseliner", against: "puncher" },
      { label: "Lobs et amorties", iconName: "brain", goodAgainst: "counter", against: "puncher" },
    ],
  },
  {
    id: "coach_advice", title: "Conseil du coach",
    desc: "Votre coach vous fait signe. L'écouter ?",
    requiresCoach: true,
    options: [
      { label: "Suivre son conseil", iconName: "chat", coachAdvice: true, requiresCoach: true },
      { label: "Faire à votre manière", iconName: "user", instinct: true },
    ],
  },
  {
    id: "crowd", title: "Pression du public",
    desc: "Le public est partagé. Comment l'utiliser ?",
    options: [
      { label: "Le galvaniser", iconName: "megaphone", effect: { momentum: 2, energy: -2 } },
      { label: "Faire abstraction", iconName: "brain", effect: { momentum: 0, energy: 1 } },
    ],
  },
  {
    id: "time_violation", title: "Provoquer un avertissement",
    desc: "Vous prenez votre temps. {o} commence à s'agacer.",
    options: [
      { label: "Continuer à temporiser", iconName: "slow", effect: { momentum: 1, energy: 4, riskWarning: 0.3 },
        successMsg: "Vous cassez le rythme : l'attente agace votre adversaire et vous en profitez pour souffler." },
      { label: "Reprendre le rythme normal", iconName: "check", effect: { momentum: 0, energy: 0 } },
    ],
  },
  {
    id: "exploit_weakness", title: "Cibler une faille",
    desc: "Où attaquer le jeu de {o} ?",
    options: [
      { label: "Marteler son service / retour", iconName: "rocket", targets: "serve" },
      { label: "Mettre la pression mentale (longs échanges, provocation)", iconName: "brain", targets: "mental" },
      { label: "Attaquer son revers", iconName: "target", targets: "backhand" },
      { label: "Attaquer son coup droit", iconName: "fire", targets: "forehand" },
    ],
  },
  {
    id: "self_game", title: "Jouer son jeu",
    desc: "Sur quelle qualité personnelle vous appuyer dans ce moment clé ?",
    options: [
      { label: "Imposer mon service", iconName: "rocket", usesSelf: "serve" },
      { label: "Dérouler mon coup droit", iconName: "fire", usesSelf: "forehand" },
      { label: "M'appuyer sur mon revers", iconName: "target", usesSelf: "backhand" },
      { label: "Tenir mentalement le bras de fer", iconName: "brain", usesSelf: "mental" },
      { label: "User l'adversaire physiquement", iconName: "run", usesSelf: "stamina" },
    ],
  },
];

// Outcome generator - each option produces a real consequence
export function resolveDilemmaOption(option, dilemma, opponent, player, momentum) {
  const opp = opponent;
  const oppProfile = getPlayerProfile(opp.stats);
  let result = {
    msg: "",
    effects: { momentumDelta: 0, energyDelta: 0, persistGames: 0, persistMomentum: 0, persistEnergyPerGame: 0, injury: false, warning: false },
  };

  // Targeted weakness option (good if matches opponent weakness)
  if (option.targets) {
    const statLabels = { serve: "service", forehand: "coup droit", backhand: "revers", mental: "mental", stamina: "endurance", net: "filet" };
    const tLab = statLabels[option.targets] || option.targets;
    const matched = oppProfile.weakness.stat === option.targets;
    const oppStat = opp.stats[option.targets] ?? 50;
    if (matched) {
      result.msg = "Dans le mille ! Le " + tLab + " est le point faible de " + opp.name + " (" + Math.round(oppProfile.weakness.value) + "). Vous prenez l'ascendant !";
      result.effects.momentumDelta = 3;
      result.effects.persistGames = 3;
      result.effects.persistMomentum = 1; // bonus per game for next 3 games
    } else if (oppProfile.strength.stat === option.targets) {
      result.msg = "Erreur ! Le " + tLab + " est le point fort de " + opp.name + " (" + Math.round(oppStat) + "). Vous lui jouez dans la raquette !";
      result.effects.momentumDelta = -2;
      result.effects.persistGames = 2;
      result.effects.persistMomentum = -1;
    } else {
      result.msg = "Choix moyen : le " + tLab + " de " + opp.name + " (" + Math.round(oppStat) + ") n'est ni sa force ni sa faille.";
      result.effects.momentumDelta = 0;
    }
    return result;
  }

  // Self-based option: leaning on one of YOUR stats. Rewards playing to your
  // strengths and punishes leaning on a weakness — forces the player to know
  // their own profile. Also compares to the opponent's same stat for nuance.
  if (option.usesSelf) {
    const selfProfile = getPlayerProfile(player.stats);
    const stat = option.usesSelf;
    const val = player.stats?.[stat] ?? 50;
    const oppVal = opp.stats?.[stat] ?? 50;
    const labels = { serve: "service", forehand: "coup droit", backhand: "revers", mental: "mental", stamina: "endurance", net: "filet" };
    const lab = labels[stat] || stat;
    const isStrength = selfProfile.strength.stat === stat;
    const isWeakness = selfProfile.weakness.stat === stat;
    // Compare the displayed (rounded) values, so "64 contre 64" is never a loss.
    const rv = Math.round(val), ro = Math.round(oppVal);
    if (isWeakness) {
      result.msg = "Mauvais choix : le " + lab + " (" + Math.round(val) + ") est votre point faible. Vous vous mettez en difficulté.";
      result.effects.momentumDelta = -3;
      result.effects.persistGames = 3;
      result.effects.persistMomentum = -1;
    } else if (isStrength && rv >= ro) {
      result.msg = "Excellent ! Vous imposez votre " + lab + " (" + Math.round(val) + "), c'est votre point fort.";
      result.effects.momentumDelta = 3;
      result.effects.persistGames = 3;
      result.effects.persistMomentum = 1;
    } else if (rv >= ro) {
      result.msg = rv === ro
        ? "Duel équilibré en " + lab + " (" + rv + " partout), mais vous imposez votre intention."
        : "Choix solide : votre " + lab + " (" + rv + " contre " + ro + ") tient la route face à " + opp.name + ".";
      result.effects.momentumDelta = 1;
      result.effects.persistGames = 2;
      result.effects.persistMomentum = 1;
    } else {
      result.msg = opp.name + " est meilleur que vous en " + lab + " (" + ro + " contre " + rv + "). Le pari ne paie pas.";
      result.effects.momentumDelta = -2;
      result.effects.persistGames = 2;
      result.effects.persistMomentum = -1;
    }
    return result;
  }

  // Style-based options
  if (option.goodAgainst && opp.style === option.goodAgainst) {
    result.msg = "Bien vu ! Cette stratégie déstabilise un " + PLAYER_STYLES[opp.style].name.toLowerCase() + ".";
    result.effects.momentumDelta = 2;
    result.effects.persistGames = 2;
    result.effects.persistMomentum = 1;
    return result;
  }
  if (option.against && opp.style === option.against) {
    result.msg = "Mauvaise idée. Cette stratégie joue le jeu d'un " + PLAYER_STYLES[opp.style].name.toLowerCase() + ".";
    result.effects.momentumDelta = -2;
    result.effects.persistGames = 3;
    result.effects.persistMomentum = -1;
    return result;
  }
  if (option.neutral) {
    result.msg = "Vous restez fidèle à votre plan de jeu, sans que cela change la physionomie du match.";
    return result;
  }
  if (option.goodAgainst || option.against) {
    const neutralMsgs = [
      "Ce choix ne change pas vraiment la physionomie du match.",
      opp.name + " s'adapte sans difficulté : l'échange reste équilibré.",
      "Tactique appliquée, mais sans effet notable sur le cours du match.",
    ];
    result.msg = neutralMsgs[Math.floor(Math.random() * neutralMsgs.length)];
    return result;
  }

  // Coach advice — safe, modest, reliable. Better with a high-level coach.
  if (option.coachAdvice) {
    const coach = (player.staff || []).find(s => s.role === "Coach");
    const coachLevel = coach?.level || 1;
    // Level 1: +1 momentum, 2 games. Level 2: +2 momentum, 3 games. Level 3: +2 momentum, 5 games.
    const mom = coachLevel >= 2 ? 2 : 1;
    const games = coachLevel >= 3 ? 5 : coachLevel >= 2 ? 3 : 2;
    result.msg = coach
      ? coach.name + " : « Joue " + (oppProfile.weakness.label.toLowerCase()) + ", il craque dessus. »"
      : "Vous suivez le plan tactique préparé.";
    result.effects.momentumDelta = mom;
    result.effects.persistGames = games;
    result.effects.persistMomentum = 1;
    return result;
  }

  // New shot — risky. Success depends on the player's technique (forehand,
  // backhand, net) compared to the opponent's. 50% baseline ± up to 30%.
  if (option.experimental) {
    const tech = (s) => ((s?.forehand ?? 50) + (s?.backhand ?? 50) + (s?.net ?? 50)) / 3;
    const edge = tech(player.stats) - tech(opp.stats);
    const successChance = 0.5 + Math.max(-0.20, Math.min(0.20, edge / 60));
    if (Math.random() < successChance) {
      result.msg = "Le nouveau coup fonctionne ! " + opp.name + " est pris de court.";
      result.effects.momentumDelta = 2;
      result.effects.energyDelta = -3;
      result.effects.persistGames = 2;
      result.effects.persistMomentum = 1;
    } else {
      result.msg = "Le nouveau coup rate sa cible. " + opp.name + " en profite.";
      result.effects.momentumDelta = -2;
      result.effects.energyDelta = -3;
      result.effects.persistGames = 2;
      result.effects.persistMomentum = -1;
    }
    return result;
  }

  // Instinct — risky. Pays off if player mental > opponent mental, else backfires.
  if (option.instinct) {
    const playerMental = player.stats?.mental || 50;
    const oppMental = opp.stats?.mental || 50;
    const edge = playerMental - oppMental;
    // Probability of success based on mental edge (50% baseline ± up to 30%)
    const successChance = 0.5 + Math.max(-0.30, Math.min(0.30, edge / 50));
    if (Math.random() < successChance) {
      result.msg = "Coup de poker payant ! Votre instinct surprend " + opp.name + ".";
      result.effects.momentumDelta = 3;
      result.effects.energyDelta = 1;
      result.effects.persistGames = 2;
      result.effects.persistMomentum = 1;
    } else {
      result.msg = "Mauvais pari. " + opp.name + " lit votre jeu.";
      result.effects.momentumDelta = -2;
      result.effects.energyDelta = -1;
      result.effects.persistGames = 2;
      result.effects.persistMomentum = -1;
    }
    return result;
  }

  // Direct effect options
  if (option.effect) {
    const ef = option.effect;
    result.effects.momentumDelta = ef.momentum || 0;
    result.effects.energyDelta = ef.energy || 0;

    // Risk of injury
    if (ef.riskInjury && Math.random() < ef.riskInjury) {
      result.effects.injury = true;
      result.msg = "Vous vous froissez un muscle ! Pénalité pour le reste du match.";
      result.effects.persistGames = 99;
      result.effects.persistEnergyPerGame = -1;
      return result;
    }
    // Risk of warning
    if (ef.riskWarning && Math.random() < ef.riskWarning) {
      result.effects.warning = true;
      result.msg = "Avertissement de l'arbitre ! Vous perdez en concentration.";
      result.effects.momentumDelta = -1;
      return result;
    }
    // Persisting buff
    if (ef.persist || ef.lastingFor || ef.durableBuff) {
      result.effects.persistGames = ef.durableBuff || ef.lastingFor || ef.persist || 0;
      result.effects.persistMomentum = ef.momentum > 0 ? 1 : ef.momentum < 0 ? -1 : 0;
    }
    result.msg = option.successMsg || pickResultMsg(option, ef);
  }
  return result;
}

export function pickResultMsg(option, effect) {
  const bits = [];
  if (effect.momentum > 0) bits.push("vous prenez confiance");
  if (effect.momentum < 0) bits.push("vous perdez un peu le fil");
  if (effect.energy > 0) bits.push("vous reprenez votre souffle");
  if (effect.energy < 0) bits.push("l'effort se fait sentir physiquement");
  if (bits.length === 0) return "Ce choix ne change pas vraiment la physionomie du match.";
  return bits.join(" et ").replace(/^./, c => c.toUpperCase()) + ".";
}

export function pickRandomDilemma() {
  return DILEMMA_TEMPLATES[Math.floor(Math.random() * DILEMMA_TEMPLATES.length)];
}

// Special, rare dilemma: a match-fixing proposal. Only offered against a clearly
// weaker opponent, early in a match the player is expected to win. Throwing the
// match earns dirty money but risks a long suspension. Handled separately from
// the normal dilemma pool so it never appears at random.
export const MATCH_FIX_DILEMMA = {
  id: "match_fixing", title: "Proposition douteuse",
  desc: "Pendant un changement de côté, un inconnu vous glisse une offre : perdre ce match contre {o}, en échange d'une grosse somme en liquide. Personne ne le saurait... peut-être.",
  isMatchFix: true,
  options: [
    { label: "Accepter et lever le pied (argent sale, gros risque)", matchFix: "accept", iconName: "money", risky: true },
    { label: "Refuser et jouer normalement", matchFix: "decline", iconName: "check" },
    { label: "Refuser et signaler aux autorités", matchFix: "report", iconName: "shield" },
  ],
};

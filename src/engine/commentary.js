// Choix des commentaires et rédaction des débriefs.
import { COMMENTARY } from "../data/commentary.js";
import { random } from "./rng.js";

export function pickComment(type, vars = {}) {
  const pool = COMMENTARY[type] || COMMENTARY.hold_easy;
  let txt = pool[Math.floor(random() * pool.length)];
  // Serve speed for ace comments: random between 210 and 225 km/h.
  const allVars = { kmh: 210 + Math.floor(random() * 16), ...vars };
  Object.entries(allVars).forEach(([k, v]) => { txt = txt.replace("{" + k + "}", v); });
  return txt;
}

export function pickDebrief(matchData, playerName, oppName) {
  const P = playerName, O = oppName;
  const pick = (a) => a[Math.floor(random() * a.length)];
  const won = matchData.pSets > matchData.oSets;
  const W = won ? P : O;           // match winner
  const L = won ? O : P;           // match loser
  const bo5 = !!matchData.isGrandSlam;
  const setsToWin = bo5 ? 3 : 2;
  const sets = matchData.sets.filter(s => s.completed);
  const nSets = sets.length;
  const ord = (i) => ["premier", "deuxième", "troisième", "quatrième", "cinquième"][i] || (i + 1) + "e";
  const sideName = (side) => side === "p" ? P : O;

  // Score line from the match winner's point of view ("6-4 3-6 7-6(5)").
  const setLine = (s) => {
    const a = won ? s.pGames : s.oGames, b = won ? s.oGames : s.pGames;
    const tb = s.tiebreak ? "(" + (s.winner === "p" ? s.tiebreak.oPts : s.tiebreak.pPts) + ")" : "";
    return a + "-" + b + tb;
  };
  const scoreLine = sets.map(setLine).join(" ");

  // ─── Facts read from the actual match ────────────────────────────────────
  let totalGames = 0, deuceGames = 0, pServeLost = 0, oServeLost = 0;
  let bestRun = { side: null, len: 0, set: 0, startSet: 0 };
  let run = { side: null, len: 0, startSet: 0 };
  let extendedTb = null;
  let bagelSet = -1;
  sets.forEach((s, si) => {
    totalGames += s.pGames + s.oGames;
    if (Math.min(s.pGames, s.oGames) === 0 && bagelSet < 0) bagelSet = si;
    if (s.tiebreak && Math.max(s.tiebreak.pPts, s.tiebreak.oPts) >= ((bo5 && si === 4) || (!bo5 && matchData.tb10Decider && si === 2) ? 12 : 9)) extendedTb = { set: si, s };
    (s.gameLog || []).forEach(g => {
      const side = g.playerWon ? "p" : "o";
      if (!g.isTiebreak) {
        if (g.isPlayerServing && !g.playerWon) pServeLost++;
        if (!g.isPlayerServing && g.playerWon) oServeLost++;
        if ((g.points || []).some(pt => pt.label === "ÉGALITÉ")) deuceGames++;
      }
      if (run.side === side) run.len++; else run = { side, len: 1, startSet: si };
      if (run.len > bestRun.len) bestRun = { side, len: run.len, set: si, startSet: run.startSet };
    });
  });

  // Decisive break in the final set (last break won by the match winner).
  const last = sets[nSets - 1];
  let decisive = null;
  if (last && !last.tiebreak) {
    let pg = 0, og = 0;
    (last.gameLog || []).forEach(g => {
      const isBreak = (g.isPlayerServing && !g.playerWon) || (!g.isPlayerServing && g.playerWon);
      const byWinner = won ? g.playerWon : !g.playerWon;
      if (isBreak && byWinner) decisive = { a: won ? pg : og, b: won ? og : pg };
      if (g.playerWon) pg++; else og++;
    });
  }

  const firstSetWinner = sets[0]?.winner;                  // "p" / "o"
  const winnerSide = won ? "p" : "o";
  const comeback = firstSetWinner && firstSetWinner !== winnerSide;
  const deciderPlayed = nSets === setsToWin * 2 - 1;
  const straightSets = nSets === setsToWin;
  const longMatch = totalGames >= (bo5 ? 44 : 30) || deuceGames >= (bo5 ? 14 : 10);
  const shortMatch = straightSets && totalGames <= (bo5 ? 26 : 17);
  const tightSets = sets.filter(s => s.tiebreak || Math.abs(s.pGames - s.oGames) <= 2).length;
  const tired = (matchData.playerEnergy ?? 60) < 25;

  // ─── Opening sentence: the shape of the match (spoken, on-air tone) ──────
  let opening;
  if (shortMatch) {
    opening = pick([
      `Alors là, c'est plié en ${totalGames} jeux : ${W} s'impose ${scoreLine}, et ${L} n'a jamais pu respirer.`,
      `Eh bien, ${W} a expédié l'affaire, ${scoreLine}, et franchement ${L} n'a jamais trouvé la moindre prise.`,
      `Victoire éclair de ${W}, ${scoreLine}… on a presque l'impression que la rencontre n'a pas eu lieu.`,
    ]);
  } else if (comeback && deciderPlayed) {
    opening = pick([
      `Quel retournement ! Mené d'un set, ${W} a fini par renverser ${L}, ${scoreLine}.`,
      `Alors ça, c'est du caractère : ${W} perd le premier set, et pourtant il retourne complètement le match, ${scoreLine}.`,
      `On l'a cru en difficulté après la première manche, mais ${W} s'impose finalement ${scoreLine}.`,
    ]);
  } else if (longMatch) {
    opening = pick([
      `Quel marathon ! ${totalGames} jeux au total, et c'est finalement ${W} qui l'emporte au bout de l'effort, ${scoreLine}.`,
      `Il en aura fallu, des jeux, pour départager ces deux-là : ${totalGames} au total, et c'est ${W} qui passe, ${scoreLine}.`,
      `Un match interminable, d'une intensité folle, et au bout du compte c'est pour ${W}, ${scoreLine}.`,
    ]);
  } else if (straightSets && tightSets >= 2) {
    opening = pick([
      `${W} s'impose en ${nSets} sets, ${scoreLine}, mais attention, rien n'a été simple : chaque manche s'est jouée à quelques points.`,
      `Alors le score, ${scoreLine}, ne dit pas tout, parce que ${L} a vraiment tenu tête avant de céder face à ${W}.`,
      `${W} gagne sans lâcher de set, ${scoreLine}, et pourtant les manches ont été très, très serrées.`,
    ]);
  } else if (straightSets) {
    opening = pick([
      `${W} s'impose en ${nSets} sets secs, ${scoreLine}, et il n'a jamais vraiment perdu le contrôle du match.`,
      `Victoire nette de ${W}, ${scoreLine}, et on a senti ${L} courir après le score du début à la fin.`,
      `Voilà, ${W} a déroulé son plan de jeu, ${scoreLine}, face à un ${L} trop souvent en réaction.`,
    ]);
  } else {
    opening = pick([
      `Un match disputé, qui s'est joué dans la manche décisive, et c'est ${W} qui l'emporte ${scoreLine}.`,
      `${W} et ${L} se sont rendu coup pour coup, et puis ${W} a fini par faire la différence, ${scoreLine}.`,
      `Il a fallu une dernière manche pour les départager, et c'est finalement ${W} qui passe, ${scoreLine}.`,
    ]);
  }

  // ─── Detail sentences, most telling first ───────────────────────────────
  const facts = [];
  let deciderTbMentioned = false;
  if (deciderPlayed && decisive) {
    facts.push(pick([
      `Tout s'est joué sur un break de ${W} alors que le score était de ${decisive.a}-${decisive.b} dans la dernière manche.`,
      `Le break décisif est tombé à ${decisive.a}-${decisive.b} dans le set final, en faveur de ${W}.`,
    ]));
  } else if (deciderPlayed && last?.tiebreak) {
    deciderTbMentioned = true;
    facts.push(`La dernière manche est allée jusqu'au jeu décisif, conclu ${Math.max(last.tiebreak.pPts, last.tiebreak.oPts)}-${Math.min(last.tiebreak.pPts, last.tiebreak.oPts)} par ${W}.`);
  }
  if (bestRun.len >= 5) {
    const where = bestRun.startSet === bestRun.set
      ? "dans le " + ord(bestRun.set) + " set"
      : "entre le " + ord(bestRun.startSet) + " et le " + ord(bestRun.set) + " set";
    facts.push(shortMatch || (straightSets && tightSets === 0)
      ? pick([
        `${sideName(bestRun.side)} a aligné ${bestRun.len} jeux d'affilée ${where}.`,
        `Une série de ${bestRun.len} jeux consécutifs de ${sideName(bestRun.side)} ${where} a résumé l'écart entre les deux joueurs.`,
      ])
      : pick([
        `Une série de ${bestRun.len} jeux consécutifs de ${sideName(bestRun.side)} ${where} a fait basculer la rencontre.`,
        `${sideName(bestRun.side)} a enchaîné ${bestRun.len} jeux d'affilée ${where}, un tournant du match.`,
      ]));
  }
  if (pServeLost === 0) {
    facts.push(`${P} n'a pas perdu une seule fois son service${won ? ", la base de son succès" : ", mais cela n'a pas suffi"}.`);
  } else if (oServeLost === 0) {
    facts.push(`${P} n'a jamais réussi à prendre le service de ${O}.`);
  } else if (pServeLost + oServeLost >= (bo5 ? 12 : 8)) {
    facts.push(`Les services ont beaucoup souffert : ${pServeLost + oServeLost} breaks au total, dont ${won ? oServeLost : pServeLost} pour ${W}.`);
  }
  // Pas de redite : si le jeu décisif « éternisé » est celui de la dernière
  // manche déjà évoquée plus haut, on ne le mentionne pas une seconde fois.
  if (extendedTb && !(deciderTbMentioned && extendedTb.s === last)) {
    const t = extendedTb.s.tiebreak;
    facts.push(`Le jeu décisif du ${ord(extendedTb.set)} set s'est éternisé jusqu'à ${Math.max(t.pPts, t.oPts)}-${Math.min(t.pPts, t.oPts)}.`);
  }
  if (bagelSet >= 0) {
    const bw = sets[bagelSet].winner === "p" ? P : O;
    facts.push(`${bw} a même infligé un 6-0 dans le ${ord(bagelSet)} set.`);
  }
  if (deuceGames >= (bo5 ? 12 : 8) && !longMatch) {
    facts.push(`Beaucoup de jeux accrochés : ${deuceGames} sont passés par l'égalité.`);
  }
  if (tired) {
    facts.push(won ? `${P} a terminé sur la réserve physiquement, il faudra bien récupérer.` : `${P} a fini le match à bout de forces.`);
  }
  if (!won && comeback) {
    facts.push(`${P} avait pourtant pris le premier set : les regrets seront là.`);
  }
  if (facts.length === 0) {
    facts.push(won
      ? `${P} a su rester solide dans les moments importants.`
      : `${P} a manqué d'un peu de réussite dans les moments clés.`);
  }
  // Spoken links between sentences, like a commentator on air.
  const startsWithName = (t) => t.startsWith(P) || t.startsWith(O);
  const lowerFirst = (t) => startsWithName(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
  const LINK1 = ["Il faut dire que ", "Et puis ", "D'ailleurs, ", "Faut souligner que ", "Et on retiendra que "];
  const LINK2 = ["Et surtout, ", "Sans oublier que ", "Et en plus, ", "Ajoutez à ça que ", "Et puis bon, "];
  const chosen = facts.slice(0, 2);
  const linked = chosen.map((f, i) => pick(i === 0 ? LINK1 : LINK2) + lowerFirst(f));
  return [opening, ...linked].join(" ");
}

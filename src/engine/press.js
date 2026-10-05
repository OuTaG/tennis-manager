// Conférences de presse.
import { random } from "./rng.js";

// ─── PRESS CONFERENCE ─────────────────────────────────────────────────────────
// Generates a list of contextual questions about the WHOLE tournament run.
// Effects are kept hidden from the player — pure roleplay.
// Each call returns 3 questions chosen from larger pools, randomized.
export function buildPressConference(player, tourn, won, isTitleWin, opponent, opponentRank, tournamentRun) {
  // tournamentRun: array of matches from this tournament (oldest first), built from matchHistory
  const oppName = opponent?.name || "votre adversaire";
  const isRival = (player.rivalries || []).some(r => r.name === oppName && (r.wins + r.losses) >= 2);
  const rivalry = (player.rivalries || []).find(r => r.name === oppName);
  const rivalWins = rivalry?.wins || 0;
  const rivalLosses = rivalry?.losses || 0;
  const tier = tourn.tier;
  const surface = tourn.surface;
  const matchesPlayed = tournamentRun?.length || 0;
  const setsLostPath = (tournamentRun || []).reduce((s, m) => {
    if (!m.score) return s;
    return s + m.score.split(" ").filter(set => {
      const [a, b] = set.split("-").map(x => parseInt(x));
      return b > a;
    }).length;
  }, 0);
  const allStraightSets = (tournamentRun || []).every(m => {
    if (!m.score) return true;
    return m.score.split(" ").every(set => {
      const [a, b] = set.split("-").map(x => parseInt(x));
      return a > b;
    });
  });

  // Helper: pick 1 random item from an array
  const pick = arr => arr[Math.floor(random() * arr.length)];

  const pickedQuestions = [];

  // Q1 — Résultat global du tournoi
  let q1Pool;
  if (isTitleWin && allStraightSets && matchesPlayed >= 3) {
    q1Pool = [
      {
        text: "Vous avez remporté " + tourn.name + " sans concéder un seul set. Comment expliquez-vous une telle domination ?",
        options: [
          { label: "Tout simplement le travail. Des semaines d'entraînement payent enfin." },
          { label: "J'étais dans une zone particulière. Difficile à reproduire." },
          { label: "Mes adversaires n'étaient pas à leur meilleur niveau. Je reste lucide." },
          { label: "Ma préparation physique était parfaite. Le reste a suivi." },
        ],
      },
    ];
  } else if (isTitleWin) {
    q1Pool = [
      {
        text: "Vainqueur de " + tourn.name + " ! Racontez-nous votre semaine.",
        options: [
          { label: "Une montée en puissance progressive. Chaque match m'a renforcé." },
          { label: "C'était dur, surtout au début. Mais j'ai trouvé mon rythme." },
          { label: "Honnêtement, je n'imaginais pas gagner en arrivant ici. Quelle surprise." },
          { label: "Je savais qu'avec ma préparation, j'avais le niveau pour le titre." },
          { label: "Tournoi compliqué. Le match couperet, c'était les quarts." },
        ],
      },
      {
        text: "Quel a été le moment-clé de votre tournoi ?",
        options: [
          { label: "Le tie-break du premier match. Si je le perds, l'aventure s'arrête." },
          { label: "La demi-finale. J'étais cuit, mais j'ai trouvé les ressources." },
          { label: "Ma préparation d'avant-tournoi. Le reste, c'est de l'exécution." },
          { label: "L'instant juste avant la finale. J'ai senti que c'était possible." },
        ],
      },
    ];
  } else if (won) {
    q1Pool = [
      {
        text: "Vous arrivez en " + (matchesPlayed <= 2 ? "phase finale" : "stade avancé") + " de " + tourn.name + ". Comment évaluez-vous votre semaine ?",
        options: [
          { label: "Très positive. Je sors confiant pour la suite de la saison." },
          { label: "Encore beaucoup à améliorer. Je ne suis pas pleinement satisfait." },
          { label: "Mon meilleur tennis de l'année, à coup sûr." },
          { label: "Des hauts et des bas. Le résultat compte plus que la manière." },
        ],
      },
    ];
  } else {
    // Loss — depends on how far the run went
    if (matchesPlayed >= 3) {
      q1Pool = [
        {
          text: "Vous sortez de " + tourn.name + " après un beau parcours. Quel sentiment domine ?",
          options: [
            { label: "La fierté du parcours, malgré la déception finale." },
            { label: "Frustration. J'avais le sentiment de pouvoir aller plus loin." },
            { label: "C'est un bon résultat. Je prends des points et de la confiance." },
            { label: "Je rentre la tête haute. Mon adversaire a mieux joué." },
          ],
        },
      ];
    } else {
      q1Pool = [
        {
          text: "Élimination précoce à " + tourn.name + ". Comment l'expliquez-vous ?",
          options: [
            { label: "Je n'étais pas au niveau aujourd'hui. C'est aussi simple que ça." },
            { label: "Adversaire en grande forme. Pas grand-chose à se reprocher." },
            { label: "Petit pépin physique en début de match. Je n'ai jamais trouvé mes marques." },
            { label: "Difficulté de concentration. Ça arrive, ça repart." },
          ],
        },
        {
          text: "Cette défaite va laisser des traces, non ?",
          options: [
            { label: "Non. Je tourne la page très vite. Prochain tournoi déjà en tête." },
            { label: "Bien sûr, c'est dur. Mais ça fait partie du métier." },
            { label: "Je vais retravailler en profondeur. Y a du boulot." },
            { label: "Pas plus que les autres. On en perd plus qu'on en gagne." },
          ],
        },
      ];
    }
  }
  pickedQuestions.push(pick(q1Pool));

  // Q2 — Adversaire ou rivalité
  if (isRival) {
    const rivScore = rivalWins + "-" + rivalLosses;
    const rivalryPool = [
      {
        text: "C'est votre " + (rivalWins + rivalLosses) + "e confrontation avec " + oppName + " (" + rivScore + "). On parle d'une vraie rivalité maintenant.",
        options: [
          { label: "Une rivalité, oui. Et c'est ce qui rend ce circuit passionnant." },
          { label: "Le mot rivalité me semble fort. On est deux compétiteurs, point." },
          { label: "Il me pousse à donner mon meilleur. C'est une chance de l'avoir sur ma route." },
          { label: "Je préfère parler de respect mutuel. Tout le monde adore créer des récits." },
        ],
      },
      {
        text: "Vos duels avec " + oppName + " sont scrutés. Vous y mettez plus d'intensité ?",
        options: [
          { label: "Honnêtement oui. Quelque chose s'allume en moi quand je le vois en face." },
          { label: "Non, je joue pareil contre tout le monde. La pression, c'est dans la tête des autres." },
          { label: "Je me prépare différemment, c'est vrai. On connaît tellement bien son jeu." },
          { label: "C'est lui qui doit répondre à ça. Moi, je fais mon travail." },
        ],
      },
      {
        text: "Vous mène/êtes mené " + rivScore + " face à " + oppName + ". Que vous inspire ce bilan ?",
        options: [
          { label: "Les statistiques, c'est du passé. Je vis chaque match comme une page blanche." },
          { label: rivalWins > rivalLosses ? "J'ai mon ascendant, je vais essayer de le garder." : "Il faut que j'inverse cette tendance. Ça va venir." },
          { label: "On est très proches techniquement. Tout se joue sur les détails." },
        ],
      },
    ];
    pickedQuestions.push(pick(rivalryPool));
  } else if (oppName !== "votre adversaire") {
    const oppPool = [
      {
        text: "Un mot sur " + oppName + " ?",
        options: [
          { label: "Un joueur dont j'apprécie le tennis. Beaucoup à apprendre de lui." },
          { label: "Compétiteur de très haut niveau. Chapeau." },
          { label: "Très solide. Pas le plus spectaculaire, mais redoutable." },
          { label: "Je le respecte énormément. Sa progression force l'admiration." },
        ],
      },
      ...(opponentRank && opponentRank <= 10 ? [
        {
          text: "Affronter un top 10 comme " + oppName + ", ça change quelque chose ?",
          options: [
            { label: "Ces matchs me rappellent pourquoi je fais ce sport." },
            { label: "C'est l'examen. Soit on passe, soit on retourne bosser." },
            { label: "Pas vraiment. Sur le court, on est deux joueurs avec une raquette." },
            { label: "Évidemment. Tu sais que tu dois être à 110%, sinon c'est plié." },
          ],
        },
      ] : []),
      {
        text: "Ce match contre " + oppName + " marque-t-il un tournant ?",
        options: [
          { label: "Trop tôt pour le dire. La suite répondra." },
          { label: "Je l'espère. C'est exactement le type de match dont j'ai besoin." },
          { label: "Non, juste un match parmi d'autres. La semaine prochaine, autre histoire." },
          { label: "Symboliquement oui. Mais le tennis ne fonctionne pas comme ça." },
        ],
      },
    ];
    pickedQuestions.push(pick(oppPool));
  }

  // Q3 — Variable selon contexte (surface, ambition, état d'esprit, voyage…)
  const variedPool = [];

  // Surface-based
  if (surface === "Terre battue") {
    variedPool.push({
      text: "Comment décririez-vous votre rapport à la terre battue ?",
      options: [
        { label: "Je l'adore. Le tennis prend une dimension presque tactique sur cette surface." },
        { label: "Compliqué. Ça demande une patience que je n'ai pas toujours." },
        { label: "C'est la surface du vrai tennis, celle qui ne ment pas." },
        { label: "Je m'y adapte, mais ce n'est pas mon terrain de prédilection." },
      ],
    });
  } else if (surface === "Gazon") {
    variedPool.push({
      text: "Le gazon, surface particulière. Votre ressenti ?",
      options: [
        { label: "C'est ma surface préférée. Le tennis y est rapide, instinctif." },
        { label: "Difficile. Très peu de temps pour réfléchir, tout est réflexe." },
        { label: "Le grand tournoi sur gazon reste l'objectif. Cette surface a quelque chose de magique." },
        { label: "J'apprends encore. Le placement est totalement différent du reste." },
      ],
    });
  } else if (surface === "Dur") {
    variedPool.push({
      text: "Le dur représente la majorité du circuit. Ça vous va ?",
      options: [
        { label: "C'est la surface la plus juste. J'aime cette idée." },
        { label: "Difficile pour le corps. À long terme, ça use." },
        { label: "Je m'y sens bien. C'est là que je suis le plus à l'aise." },
        { label: "Surface neutre, ni de mes préférées, ni de mes rejets." },
      ],
    });
  } else if (surface === "Indoor") {
    variedPool.push({
      text: "Jouer en salle change-t-il votre approche ?",
      options: [
        { label: "Oui beaucoup. La balle vole, il faut être plus tranchant." },
        { label: "Pas vraiment. Je joue de la même façon." },
        { label: "L'ambiance est unique. On entend tout, on ressent tout." },
        { label: "C'est très différent. J'aime devoir m'adapter techniquement." },
      ],
    });
  }

  // Generic mood / fans / family
  variedPool.push(
    {
      text: "Vos proches étaient présents cette semaine ?",
      options: [
        { label: "Oui, et c'est essentiel pour moi. Sans eux, rien n'a de sens." },
        { label: "Non, je préfère qu'ils restent à la maison. Trop de pression sinon." },
        { label: "Ma famille suit à distance. On se parle après chaque match." },
        { label: "Question privée. Vous comprendrez que je ne réponde pas." },
      ],
    },
    {
      text: "Comment gérez-vous la pression médiatique ?",
      options: [
        { label: "Je ne lis plus rien. C'est la seule façon de rester concentré." },
        { label: "Je l'utilise comme carburant. Plus on parle, plus j'ai envie de prouver." },
        { label: "Bien entouré, ça va. Mon staff filtre tout." },
        { label: "Difficile parfois. Je suis humain, ça touche." },
      ],
    },
    {
      text: "Le calendrier est dense. Comment récupérez-vous ?",
      options: [
        { label: "Récupération en priorité. Sommeil, étirements, alimentation. Le reste suit." },
        { label: "Je voyage léger. Quelques jours à la maison entre deux tournois." },
        { label: "Avec mon staff. On a un protocole bien rodé." },
        { label: "Honnêtement, c'est ma plus grande difficulté." },
      ],
    },
    {
      text: "Un message pour vos supporters ?",
      options: [
        { label: "Merci pour leur fidélité. Sans eux, rien ne serait pareil." },
        { label: "Restez derrière moi. Le meilleur reste à venir." },
        { label: "Je joue pour eux autant que pour moi. Promesse tenue." },
        { label: "On va construire de grandes choses ensemble cette saison." },
      ],
    }
  );

  // Ambition (only for ATP500+)
  if (["GrandSlam", "Finals", "Masters1000", "ATP500"].includes(tier)) {
    variedPool.push(
      {
        text: "Un titre du Majeur reste-t-il votre obsession ?",
        options: [
          { label: "Absolument. C'est le seul objectif qui compte vraiment." },
          { label: "Je n'aime pas le mot obsession. Mais oui, je le veux." },
          { label: "Pas une obsession, un rêve. Nuance importante." },
          { label: "Je préfère viser la régularité. Le titre viendra ensuite." },
        ],
      },
      {
        text: "Que vous manque-t-il pour atteindre le très haut niveau ?",
        options: [
          { label: "Du temps et de la patience. Le reste est en place." },
          { label: "De la confiance. C'est le dernier verrou." },
          { label: "Rien de précis. Continuer à travailler, c'est tout." },
          { label: "Une grande victoire qui change tout. Comme un déclic." },
        ],
      }
    );
  }

  pickedQuestions.push(pick(variedPool));

  // Assign small hidden effects to options (varied tones)
  for (const q of pickedQuestions) {
    if (!q.options) continue;
    q.options = q.options.map((opt, idx) => {
      if (opt.effects) return opt; // already set
      // Heuristic-driven small effects based on tone of the answer
      const lbl = opt.label;
      const effects = { happiness: 0, popularity: 0, image: 0 };
      // Humble/respectful keywords → image+
      if (/(chapeau|respect|humble|fierté|merci|admir|félicitations|honnêtement)/i.test(lbl)) {
        effects.image += 1 + Math.floor(random() * 2);
        effects.popularity += Math.floor(random() * 2);
      }
      // Confidence / driven keywords → popularity+, image variable
      if (/(le meilleur|champion|obsession|écraser|domin|gagner|titre|grand chelem)/i.test(lbl)) {
        effects.popularity += 1 + Math.floor(random() * 2);
      }
      // Cocky / dismissive → image-
      if (/(point|pas grand-chose|c'est aussi simple|rien à se|n'imaginais pas|tout simplement)/i.test(lbl)) {
        effects.image += Math.floor(random() * 2) - 1;
      }
      // Vulnerable / emotional → happiness change
      if (/(touche|dur|difficile|humain|essentiel|sans (eux|elle))/i.test(lbl)) {
        effects.happiness += 1;
        effects.popularity += 1;
      }
      // Refusal to answer → image-
      if (/(question privée|je ne réponds|je préfère ne pas|sans commentaire)/i.test(lbl)) {
        effects.image -= 2;
      }
      return { ...opt, effects };
    });
  }

  return pickedQuestions;
}

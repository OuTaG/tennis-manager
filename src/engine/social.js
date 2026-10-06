// Réseaux sociaux : fil Monde et fil Pour vous.
import { ALL_TOURNAMENTS } from "./circuit.js";
import { random } from "./rng.js";

// ─── SOCIAL POSTS GENERATOR ────────────────────────────────────────────────────
// Generates random social-network style posts each week.
// Three feeds source:
//   - tournament articles (from generateTournamentArticle, posted by "journalist")
//   - aux posts (rumors, fan posts, brand posts, player tweets)
//   - personal posts (about the human player) — added in playGame on win/loss

// Pool of journalist / brand / fan handles for variety
export const SOCIAL_AUTHORS = {
  journalists: [
    { handle: "@TennisDaily", name: "Tennis Daily", verified: true, type: "press" },
    { handle: "@CourtCentral", name: "Court Central", verified: true, type: "press" },
    { handle: "@SetPointHQ", name: "Set Point", verified: true, type: "press" },
    { handle: "@AcePulse", name: "Ace Pulse", verified: true, type: "press" },
    { handle: "@RallyTimes", name: "Rally Times", verified: false, type: "press" },
    { handle: "@LeJournalDuCourt", name: "Le Journal du Court", verified: true, type: "press" },
    { handle: "@BaselineMag", name: "Baseline Mag", verified: true, type: "press" },
    { handle: "@TennisInsider", name: "Tennis Insider", verified: false, type: "press" },
  ],
  brands: [
    { handle: "@VoltTennis", name: "Volt", verified: true, type: "brand" },
    { handle: "@Topspin", name: "Topspin", verified: true, type: "brand" },
    { handle: "@ChronosOfficial", name: "Chronos", verified: true, type: "brand" },
    { handle: "@ApexCourt", name: "Apex Court", verified: true, type: "brand" },
    { handle: "@KineticSport", name: "Kinetic", verified: true, type: "brand" },
    { handle: "@StriderRun", name: "Strider", verified: true, type: "brand" },
  ],
  fans: [
    { handle: "@tennislover99", name: "TennisFan99", verified: false, type: "fan" },
    { handle: "@coupdroit_fr", name: "CoupDroitFR", verified: false, type: "fan" },
    { handle: "@servonlineace", name: "ServeOnAce", verified: false, type: "fan" },
    { handle: "@grandchelem_fan", name: "GCFan", verified: false, type: "fan" },
    { handle: "@returner_pro", name: "Returner", verified: false, type: "fan" },
    { handle: "@matchpointgirl", name: "MatchPoint", verified: false, type: "fan" },
    { handle: "@tiebreak_addict", name: "TiebreakAddict", verified: false, type: "fan" },
    { handle: "@lob_et_amortie", name: "LobEtAmortie", verified: false, type: "fan" },
    { handle: "@ocre_forever", name: "OcreForever", verified: false, type: "fan" },
    { handle: "@gazon_club", name: "GazonClub", verified: false, type: "fan" },
    { handle: "@papi_tennis", name: "PapiTennis", verified: false, type: "fan" },
    { handle: "@volley_queen", name: "VolleyQueen", verified: false, type: "fan" },
    { handle: "@stats_nerd_atp", name: "StatsNerd", verified: false, type: "fan" },
  ],
};

// « Pour vous » : au plus 3 nouveaux messages par semaine (matchs compris).
export const PERSONAL_POSTS_PER_WEEK = 3;
// Garde, parmi candidates, les messages « Pour vous » qui tiennent encore
// dans le quota de leur semaine (existing = fil actuel). Les autres fils
// passent tels quels.
export function limitPersonalPosts(candidates, existing) {
  const count = {};
  const key = (x) => (x.year || 0) + ":" + (x.week || 0);
  for (const x of existing || []) if (x.feed === "personal") count[key(x)] = (count[key(x)] || 0) + 1;
  return (candidates || []).filter(x => {
    if (!x || x.feed !== "personal") return !!x;
    const k = key(x);
    if ((count[k] || 0) >= PERSONAL_POSTS_PER_WEEK) return false;
    count[k] = (count[k] || 0) + 1;
    return true;
  });
}

export function pickRandom(arr) { return arr[Math.floor(random() * arr.length)]; }
export function randomLikes(min, max) { return Math.floor(min + random() * (max - min)); }

// Aux posts about world tennis — generated each week (1-3 per week, mostly fluff)
export function generateAuxSocialPosts(atpDb, week, year, playerInfo, recentNews) {
  const posts = [];
  const count = 1 + Math.floor(random() * 3); // 1-3 aux posts

  const top10 = (atpDb || []).slice(0, 10);
  const top30 = (atpDb || []).slice(0, 30);
  const top100 = (atpDb || []).slice(0, 100);
  // Évite de republier un texte déjà vu récemment dans le fil.
  const recent = new Set((recentNews || []).slice(0, 80).map(p => p.content));
  const fresh = (list) => {
    const pool = list.filter(t => !recent.has(t));
    const t = pickRandom(pool.length ? pool : list);
    recent.add(t);
    return t;
  };
  const two = () => {
    const a = pickRandom(top30);
    let b = pickRandom(top30);
    for (let k = 0; k < 5 && b === a; k++) b = pickRandom(top30);
    return [a, b];
  };
  const nextWeek = week >= 52 ? 1 : week + 1;
  const upcoming = ALL_TOURNAMENTS.filter(t => t.week === nextWeek && ["GrandSlam", "Finals", "Masters1000", "ATP500"].includes(t.tier));

  for (let i = 0; i < count; i++) {
    const r = random();
    let post = null;

    if (r < 0.18 && top30.length >= 2) {
      // Top player banter / training post
      const author = pickRandom(top10);
      const templates = [
        "Belle séance ce matin. La machine est lancée pour la suite de la saison.",
        "Récupération obligatoire après cette semaine. Mon corps me remercie.",
        "Pourquoi ce sport est-il aussi exigeant et aussi addictif à la fois ?",
        "Tournoi qui s'annonce relevé. Hâte de débuter.",
        "Le travail finit toujours par payer. Merci à mon staff.",
        "Petite session vidéo pour analyser mes derniers matchs. Toujours à apprendre.",
        "Le tennis c'est 90% mental. On me l'a dit, je le vis chaque semaine.",
        "Journée off : famille, soleil et zéro raquette. Ça fait du bien.",
        "Nouveau cordage testé cette semaine. Premières sensations très bonnes.",
        "Merci au public de ce soir, ambiance incroyable.",
        "Séance physique à 7h. Le plus dur, c'est de sortir du lit.",
        "Les avions, les hôtels, les valises… la vie de joueur n'est pas que glamour.",
        "Match d'entraînement avec un junior aujourd'hui. Il a un sacré coup droit.",
        "On apprend plus d'une défaite que de dix victoires.",
        "Cap sur la prochaine étape. Concentré, serein.",
        "Trois heures d'avion, deux heures de retard, une seule envie : jouer.",
        "J'ai enfin retrouvé ma raquette préférée. Longue histoire. 😅",
        "Bain froid, étirements, dodo. La routine des champions… ou presque.",
        "Premier entraînement sur place : la balle va beaucoup plus vite ici.",
        "Merci aux ramasseurs de balles, les vrais héros de la semaine. 🙌",
        "Je relis mes notes de match avant de dormir. Mauvaise habitude ?",
        "Le décalage horaire a gagné cette nuit. Revanche demain.",
        "Nouvelle tenue pour la saison. Verdict ? 👕",
        "Journée de repos imposée par le kiné. Je déteste ça.",
        "Entraînement sous la pluie. Ça forge le caractère, paraît-il. 🌧️",
        "Quelqu'un a un bon restaurant à conseiller dans le coin ? 🍽️",
        "Mon coach m'a fait servir 200 balles ce matin. Mon épaule me parle.",
      ];
      post = {
        author: {
          handle: "@" + author.name.replace(/[\s.]/g, "").toLowerCase(),
          name: author.name,
          verified: true,
          type: "player",
          flag: author.nat?.flag,
        },
        content: fresh(templates),
        likes: randomLikes(2000, 15000),
        retweets: randomLikes(300, 2500),
        feed: "world",
      };
    } else if (r < 0.32) {
      // Brand post
      const brand = pickRandom(SOCIAL_AUTHORS.brands);
      const templates = [
        "Nouvelle collection disponible. Inspirée par les champions, conçue pour vous.",
        "Le service de la semaine 🎾 (clip imaginé)",
        "On parie sur qui pour cette semaine ? Dropper vos pronostics.",
        "Notre équipe est prête. Et vous ?",
        "Behind the scenes : les coulisses de notre dernier shooting.",
        "Concours : gagnez une raquette dédicacée. Partagez ce post pour participer.",
        "Tension, cordage, grip : quel est votre réglage parfait ?",
        "Les nouvelles chaussures terre battue arrivent la semaine prochaine.",
        "Un jeu de jambes irréprochable commence par de bonnes semelles.",
        "Votre coup préféré à l'entraînement ? On veut vos vidéos.",
        "Édition limitée : 500 exemplaires seulement. Vous êtes prêts ?",
        "Gazon, terre, dur : une chaussure pour chaque surface. Laquelle est la vôtre ?",
        "Nos ambassadeurs ont testé le nouveau cadre. Leur verdict en vidéo.",
        "Recyclez vos vieilles balles en magasin : on s'occupe du reste. ♻️",
        "Stage jeunes cet été : inscriptions ouvertes dans nos clubs partenaires.",
        "Grip neuf, confiance neuve. Changez-le toutes les deux semaines.",
        "Sondage : poignet souple ou poignet ferme au service ?",
      ];
      post = {
        author: brand,
        content: fresh(templates),
        likes: randomLikes(500, 5000),
        retweets: randomLikes(50, 800),
        feed: "world",
      };
    } else if (r < 0.52 && top30.length > 0) {
      // Journalist news / opinion
      const author = pickRandom(SOCIAL_AUTHORS.journalists);
      const subject = pickRandom(top30);
      const [a, b] = two();
      const young = top100.filter(p => (p.age || 25) <= 21);
      const veteran = top100.filter(p => (p.age || 25) >= 32);
      const templates = [
        "🚨 " + subject.name + " annonce une légère gêne au genou. À surveiller cette semaine.",
        "Selon nos sources, " + subject.name + " envisagerait un changement de coach en fin de saison.",
        "Beau coup de projecteur sur " + subject.name + " : son rapport tactique est devenu une référence.",
        "Question du jour : peut-on encore arrêter " + subject.name + " sur sa surface favorite ?",
        "Sondage : qui sera n°1 mondial d'ici 2 ans ? " + subject.name + " mène les votes pour l'instant.",
        subject.name + " confie : « Je veux gagner un Majeur dans les 18 mois. » Ambitions affichées.",
        "Analyse : le pourcentage de premières balles de " + subject.name + " a nettement progressé cette saison.",
        subject.name + " a changé de raquette cet hiver. Un pari risqué qui semble payer.",
        "Les bookmakers placent " + subject.name + " parmi les favoris du prochain Grand 1000.",
        "Chronique : " + subject.name + " est-il le joueur le plus régulier du circuit ?",
        "Rumeur de transfert d'équipementier pour " + subject.name + ". Rien d'officiel.",
        subject.name + " annonce son soutien à une académie de tennis pour enfants défavorisés.",
        "Clash en conférence : " + subject.name + " n'a pas apprécié une question sur son calendrier.",
        "Duel au sommet : " + a.name + " contre " + b.name + ", la rivalité qui fait vibrer le circuit.",
        a.name + " et " + b.name + " se sont entraînés ensemble cette semaine. Ambiance détendue.",
        "Débat : " + a.name + " ou " + b.name + ", qui a le meilleur coup droit du circuit ?",
        "Le circuit est-il trop long ? Plusieurs joueurs réclament une vraie trêve hivernale.",
        "Chaleur extrême annoncée cette semaine : les organisateurs prévoient des pauses.",
        "Les arbitres de ligne disparaissent un peu plus chaque saison au profit de la vidéo. Bonne nouvelle ?",
        "Record d'affluence pour les qualifications cette saison. Le tennis attire.",
        subject.name + " aurait recruté un ancien préparateur de rugby. Méthodes musclées.",
        "Classement : " + subject.name + " n'a jamais été aussi bien classé de sa carrière.",
        "Coulisses : une partie du vestiaire réclame des balles différentes selon les surfaces.",
      ];
      if (young.length) { const y = pickRandom(young); templates.push("Pépite : à " + (y.age || 20) + " ans, " + y.name + " impressionne déjà le circuit."); }
      if (veteran.length) { const v = pickRandom(veteran); templates.push(v.name + " (" + v.age + " ans) n'exclut pas de jouer encore deux saisons. Longévité remarquable."); }
      if (upcoming.length) {
        const t = pickRandom(upcoming);
        templates.push("Avant-programme : " + t.name + " démarre la semaine prochaine. " + subject.name + " part favori selon nos experts.");
        templates.push("Tableau de " + t.name + " : quart de finale de rêve possible entre " + a.name + " et " + b.name + ".");
      }
      post = {
        author,
        content: fresh(templates),
        likes: randomLikes(800, 8000),
        retweets: randomLikes(100, 1500),
        feed: "world",
      };
    } else if (r < 0.62 && top30.length >= 2) {
      // Statistiques et anecdotes
      const author = pickRandom(SOCIAL_AUTHORS.journalists);
      const leaders = [...top30].sort((x, y) => (y.seasonWins || 0) - (x.seasonWins || 0));
      const lead = leaders[0];
      const titled = [...top30].sort((x, y) => (y.seasonTitles || 0) - (x.seasonTitles || 0))[0];
      const rich = [...top30].sort((x, y) => (y.seasonEarnings || 0) - (x.seasonEarnings || 0))[0];
      const templates = [];
      if (lead && (lead.seasonWins || 0) > 0) templates.push("📊 " + lead.name + " compte " + lead.seasonWins + " victoires cette saison. Personne ne fait mieux.");
      if (titled && (titled.seasonTitles || 0) > 1) templates.push("📊 Déjà " + titled.seasonTitles + " titres cette saison pour " + titled.name + ".");
      if (rich && (rich.seasonEarnings || 0) > 0) templates.push("💰 " + rich.name + " a déjà empoché " + Math.round(rich.seasonEarnings).toLocaleString("fr-FR") + " € de gains cette saison.");
      const nat = {};
      top100.forEach(p => { const c = p.nat?.country; if (c) nat[c] = (nat[c] || 0) + 1; });
      const topNat = Object.entries(nat).sort((x, y) => y[1] - x[1])[0];
      if (topNat) templates.push("📊 " + topNat[0] + " place " + topNat[1] + " représentants dans le top 100. Aucune nation ne fait mieux.");
      const avgAge = top100.length ? Math.round(top100.reduce((s, p) => s + (p.age || 25), 0) / top100.length * 10) / 10 : 0;
      if (avgAge) templates.push("📊 Âge moyen du top 100 : " + String(avgAge).replace(".", ",") + " ans.");
      templates.push("📊 Le n°1 mondial, " + top10[0].name + ", compte " + top10[0].points.toLocaleString("fr-FR") + " points.");
      if (top10.length >= 2) templates.push("📊 Écart entre le n°1 et le n°2 : " + (top10[0].points - top10[1].points).toLocaleString("fr-FR") + " points.");
      post = {
        author,
        content: fresh(templates),
        likes: randomLikes(400, 4000),
        retweets: randomLikes(40, 600),
        feed: "world",
      };
    } else {
      // Fan post / opinion
      const author = pickRandom(SOCIAL_AUTHORS.fans);
      const subject = top30.length > 0 ? pickRandom(top30) : null;
      const pair = top30.length >= 2 ? two() : null;
      const generic = [
        "Le tennis est le plus beau sport du monde, débat clos.",
        "Saison passionnante cette année. Tellement de jeunes qui montent.",
        "Le calendrier ATP est trop chargé. Les joueurs vont craquer.",
        "Qui d'autre se lève à 4h du matin pour regarder les tournois en Asie ? 🙋",
        "Unpopular opinion : le jeu décisif à 10 points devrait être partout.",
        "Les matchs en 5 sets, c'est ça le vrai tennis. Change my mind.",
        "Mon club a enfin refait les courts en terre battue. Bonheur. 🧡",
        "Petit rappel : les ramasseurs de balles méritent un salaire. 🙏",
        "Le bruit de la balle sur gazon, c'est le meilleur son du monde.",
        "Qui veut monter une ligue de pronostics pour la saison ? 📈",
        "Je viens d'acheter ma première raquette pro. Mon niveau, lui, n'a pas changé. 😂",
        "On devrait interdire les cris à chaque frappe. Ou pas ?",
      ];
      const withSubject = subject ? [
        "On peut applaudir le mental de " + subject.name + ", franchement.",
        subject.name + " joue avec une telle classe. Toujours un plaisir.",
        "Je pense que " + subject.name + " est sous-coté en ce moment.",
        "Le revers à deux mains de " + subject.name + " est juste 🤯",
        "Personne ne parle de la première balle de " + subject.name + ". Pourquoi ?",
        "Hot take : " + subject.name + " gagnera 3 GC avant la fin de sa carrière.",
        "J'ai croisé " + subject.name + " à l'aéroport, super sympa avec les fans 🙌",
        "Qui d'autre regarde les matchs de " + subject.name + " en boucle ? 🙋",
        "Le jeu de jambes de " + subject.name + " devrait être enseigné dans les écoles de tennis.",
        subject.name + " sur gazon, c'est un autre joueur. Change my mind.",
        "Match de " + subject.name + " hier : j'ai perdu ma voix à force de crier 😂",
        "Les stats de " + subject.name + " sur balles de break sont folles cette année 📊",
        "Autographe de " + subject.name + " obtenu après 2h d'attente. Ça valait le coup. ✍️",
        subject.name + " qui fait un câlin à un ramasseur de balles, c'est tout ce dont j'avais besoin aujourd'hui 🥹",
        "Si " + subject.name + " trouve un vrai deuxième service, c'est fini pour les autres.",
        "Le style de " + subject.name + " me fait penser aux légendes des années 2000.",
      ] : [];
      const withPair = pair ? [
        pair[0].name + " vs " + pair[1].name + " en finale, c'est tout ce que je demande cette saison.",
        "Team " + pair[0].name + " ou team " + pair[1].name + " ? Je veux des réponses. 👇",
        "Le jour où " + pair[0].name + " et " + pair[1].name + " feront un double ensemble… 🤩",
      ] : [];
      post = {
        author,
        content: fresh([...withSubject, ...withPair, ...generic]),
        likes: randomLikes(5, 200),
        retweets: randomLikes(0, 20),
        feed: "world",
      };
    }

    if (post) {
      posts.push({
        ...post,
        id: "post_" + Date.now() + "_" + random().toString(36).slice(2, 8),
        week, year,
        replyable: false, // aux posts not replyable (variety)
      });
    }
  }
  return posts;
}

// Generate a personal post about the human player (after a match)
export function generatePersonalSocialPost(player, tourn, won, isTitleWin, opponent, score, week, year) {
  const r = random();
  const playerName = player.name;
  let post = null;

  if (isTitleWin) {
    // Branded congrats or fan celebration
    const congratsTemplates = [
      { from: "fan", content: "ÇA Y EST ! " + playerName + " gagne " + tourn.name + ' !! 🏆 Je suis fier ! On va loin !' },
      { from: "fan", content: playerName + " a tout simplement été énorme cette semaine. Quelle classe." },
      { from: "press", content: "🚨 " + playerName + " remporte " + tourn.name + " ! Carrière qui décolle." },
      { from: "brand", content: "Bravo " + playerName + " pour ce titre au " + tourn.name + ". Belle représentation." },
    ];
    const tmpl = pickRandom(congratsTemplates);
    const author = tmpl.from === "fan" ? pickRandom(SOCIAL_AUTHORS.fans)
                 : tmpl.from === "press" ? pickRandom(SOCIAL_AUTHORS.journalists)
                 : pickRandom(SOCIAL_AUTHORS.brands);
    post = {
      author,
      content: tmpl.content,
      likes: randomLikes(50, 1500),
      retweets: randomLikes(5, 200),
      replyable: tmpl.from === "fan",
      replies: tmpl.from === "fan" ? [
        { label: "Merci, c'est grâce à vous.", effects: { popularity: 1, image: 1 } },
        { label: "Hâte de la suite. Allez !", effects: { popularity: 1 } },
        { label: "C'est le travail qui paye.", effects: { image: 1 } },
      ] : null,
    };
  } else if (won && (opponent?.rank || 999) <= 30) {
    // Beat a top 30 → buzzworthy post
    const templates = [
      { from: "press", content: "Belle surprise : " + playerName + " bat " + opponent.name + " (#" + opponent.rank + ") au " + tourn.name + ". Score : " + (score || "—") },
      { from: "fan", content: "WTF " + playerName + " vient de sortir " + opponent.name + " 😱 il monte il monte !" },
      { from: "fan", content: "Avez-vous vu ce match de " + playerName + " ? Quel niveau." },
    ];
    const tmpl = pickRandom(templates);
    const author = tmpl.from === "press" ? pickRandom(SOCIAL_AUTHORS.journalists) : pickRandom(SOCIAL_AUTHORS.fans);
    post = {
      author,
      content: tmpl.content,
      likes: randomLikes(100, 800),
      retweets: randomLikes(10, 100),
      replyable: tmpl.from === "fan",
      replies: tmpl.from === "fan" ? [
        { label: "Encore un effort, on y croit.", effects: { popularity: 1 } },
        { label: "Restons concentrés, c'est qu'un match.", effects: { image: 1 } },
        { label: "Merci pour le soutien !", effects: { popularity: 1 } },
      ] : null,
    };
  } else if (!won && (opponent?.rank || 0) > 200 && random() < 0.4) {
    // Bad loss → critical fan post
    const templates = [
      "Bon, on peut parler de " + playerName + " ? Cette défaite ça pique quand même.",
      "Sérieux, " + playerName + " contre un " + (opponent?.rank ? "#" + opponent.rank : "joueur inconnu") + " ?? Faut se réveiller.",
      "Inquiétant pour " + playerName + ". Une mauvaise passe ou un vrai problème ?",
    ];
    const author = pickRandom(SOCIAL_AUTHORS.fans);
    post = {
      author,
      content: pickRandom(templates),
      likes: randomLikes(20, 200),
      retweets: randomLikes(1, 30),
      replyable: true,
      replies: [
        { label: "Je vais tout donner pour me racheter.", effects: { image: 1 } },
        { label: "Calme. Une défaite ne définit pas une carrière.", effects: { image: 2 } },
        { label: "Tu joues mieux que moi ? Vas-y, montre.", effects: { popularity: 1, image: -3 } },
      ],
    };
  }

  if (!post) return null;
  return {
    ...post,
    id: "post_" + Date.now() + "_" + random().toString(36).slice(2, 8),
    week, year,
    feed: "personal",
  };
}

// Weekly "for you" posts: not tied to a match. Mixes neutral/positive/fun
// content, casual personal questions, and reactions to posts the player liked.
// Each carries a varied set of reply options so the feed feels less repetitive.
export function generateWeeklyPersonalPosts(player, news, week, year) {
  const out = [];
  const name = player.name || "vous";
  const fan = () => pickRandom(SOCIAL_AUTHORS.fans);
  const press = () => pickRandom(SOCIAL_AUTHORS.journalists);
  const mk = (author, content, replies, extra = {}) => ({
    author, content,
    likes: randomLikes(extra.likeMin || 30, extra.likeMax || 900),
    retweets: randomLikes(2, 120),
    replyable: !!(replies && replies.length),
    replies: replies || null,
    id: "post_" + Date.now() + "_" + random().toString(36).slice(2, 8),
    week, year, feed: "personal",
  });

  // ── Pool A: casual "how are you" / life questions (fun & light) ───────────
  const casual = [
    () => mk(fan(), "Hey " + name + ", ça va en ce moment ? On pense à toi 💚", [
      { label: "Au top, merci de demander !", effects: { happiness: 2, popularity: 1 } },
      { label: "Des hauts et des bas, comme tout le monde.", effects: { happiness: 1, image: 1 } },
      { label: "Je préfère garder ça pour moi.", effects: { popularity: -1, image: 1 } },
      { label: "🎾", effects: { happiness: 1 } },
    ]),
    () => mk(fan(), name + ", c'est pour quand un petit bébé ? 👶 La communauté veut savoir 😄", [
      { label: "Chaque chose en son temps 😊", effects: { popularity: 2, happiness: 1 } },
      { label: "Concentré sur le tennis pour l'instant !", effects: { image: 2 } },
      { label: "Occupez-vous de vos raquettes 😂", effects: { popularity: 1, image: -1 } },
      { label: "Mêlez-vous de vos affaires.", effects: { popularity: -3, image: -1 } },
    ]),
    () => mk(fan(), "Question random : team chocolatine ou pain au chocolat, " + name + " ? 🥐", [
      { label: "Pain au chocolat, évidemment.", effects: { popularity: 1, happiness: 1 } },
      { label: "Chocolatine, ne me cherchez pas.", effects: { popularity: 1, happiness: 1 } },
      { label: "Les deux, je suis un athlète 😎", effects: { popularity: 2 } },
      { label: "Vraiment ? C'est ça vos questions ? 😅", effects: { image: -1 } },
    ]),
    () => mk(fan(), "On t'a vu super détendu cette semaine " + name + ". Bonne période ? ✨", [
      { label: "Oui, je me sens bien en ce moment.", effects: { happiness: 2, image: 1 } },
      { label: "Je travaille beaucoup l'aspect mental.", effects: { image: 2 } },
      { label: "Faut pas se fier aux apparences 😉", effects: { popularity: 1 } },
    ]),
    () => mk(fan(), "Si t'étais pas joueur de tennis " + name + ", tu ferais quoi dans la vie ?", [
      { label: "Sûrement un truc dans le sport.", effects: { popularity: 1 } },
      { label: "Aucune idée, je suis né pour ça 🎾", effects: { popularity: 1, image: 1 } },
      { label: "Je rêvais d'être cuisinier en vrai 😄", effects: { happiness: 1, popularity: 2 } },
    ]),
    () => mk(fan(), "C'est quoi ta playlist avant un match " + name + " ? 🎧", [
      { label: "Du rap pour me mettre en mode guerrier 🔥", effects: { popularity: 2 } },
      { label: "Du calme, je préfère le silence.", effects: { image: 1 } },
      { label: "Secret défense 🤫", effects: { popularity: 1 } },
    ]),
    () => mk(fan(), "Ton plat préféré après une victoire " + name + " ? 🍝", [
      { label: "Des pâtes, toujours des pâtes.", effects: { popularity: 1, happiness: 1 } },
      { label: "Un bon burger, on l'a mérité 🍔", effects: { popularity: 2 } },
      { label: "Diététicien oblige : légumes vapeur 😅", effects: { image: 1 } },
    ]),
    () => mk(fan(), "Tu as un rituel porte-bonheur avant de servir " + name + " ?", [
      { label: "Trois rebonds, jamais plus, jamais moins.", effects: { popularity: 2 } },
      { label: "Aucun, je ne crois pas à la chance.", effects: { image: 1 } },
      { label: "Si je te le dis, ça ne marche plus 😉", effects: { popularity: 1, happiness: 1 } },
    ]),
    () => mk(fan(), "Quel joueur t'a donné envie de jouer au tennis " + name + " ?", [
      { label: "Les légendes des années 2000, forcément.", effects: { popularity: 1, image: 1 } },
      { label: "Mon père, sur le court du quartier ❤️", effects: { happiness: 2, popularity: 1 } },
      { label: "Personne, je suis tombé dedans par hasard.", effects: { popularity: 1 } },
    ]),
    () => mk(fan(), name + ", tu joues à quels jeux vidéo entre deux tournois ? 🎮", [
      { label: "Des jeux de foot, je suis nul au tennis virtuel 😂", effects: { popularity: 2, happiness: 1 } },
      { label: "Pas le temps, je lis beaucoup.", effects: { image: 1 } },
      { label: "Je tiens le classement de mon équipe en ligne 😎", effects: { popularity: 1 } },
    ]),
    () => mk(fan(), "Plutôt mer ou montagne pour les vacances " + name + " ? 🏖️⛰️", [
      { label: "Mer, sans hésiter.", effects: { happiness: 1, popularity: 1 } },
      { label: "Montagne, pour souffler loin de tout.", effects: { happiness: 1, popularity: 1 } },
      { label: "Les vacances ? C'est quoi ? 😅", effects: { popularity: 2 } },
    ]),
    () => mk(fan(), "Si tu pouvais affronter n'importe quelle légende " + name + ", ce serait qui ?", [
      { label: "Le meilleur de tous, pour voir où j'en suis.", effects: { popularity: 2 } },
      { label: "Un grand serveur-volleyeur, pour le style.", effects: { popularity: 1, image: 1 } },
      { label: "Personne, je tiens à mon ego 😂", effects: { popularity: 2, happiness: 1 } },
    ]),
    () => mk(fan(), "Tu as un animal de compagnie " + name + " ? 🐶🐱", [
      { label: "Un chien qui me suit partout 🐶", effects: { popularity: 2, happiness: 1 } },
      { label: "Pas encore, trop de voyages.", effects: { popularity: 1 } },
      { label: "Un poisson rouge. Il ne se plaint jamais 🐟", effects: { popularity: 2 } },
    ]),
    () => mk(fan(), "Ta surface préférée " + name + " ? Et pas de réponse diplomatique 😏", [
      { label: "La terre battue, j'adore glisser.", effects: { popularity: 1 } },
      { label: "Le gazon, pour le spectacle.", effects: { popularity: 1 } },
      { label: "Le dur, c'est le plus juste.", effects: { image: 1 } },
      { label: "Celle où je gagne 😄", effects: { popularity: 2 } },
    ]),
    () => mk(fan(), "Le dernier livre ou la dernière série qui t'a marqué " + name + " ? 📚", [
      { label: "Une bio de grand sportif, très inspirant.", effects: { image: 1 } },
      { label: "Une série policière, j'ai tout regardé en une semaine 😅", effects: { popularity: 2 } },
      { label: "Je dors dans l'avion, désolé 😴", effects: { popularity: 1, happiness: 1 } },
    ]),
    () => mk(fan(), "Combien de raquettes dans ton sac " + name + " ? 🎒", [
      { label: "Six, toutes cordées pareil.", effects: { image: 1 } },
      { label: "Trois, je suis minimaliste.", effects: { popularity: 1 } },
      { label: "Assez pour en casser une ou deux 😬", effects: { popularity: 2, image: -1 } },
    ]),
    () => mk(fan(), "Coup droit ou revers : lequel tu préfères frapper " + name + " ?", [
      { label: "Coup droit, c'est mon arme.", effects: { popularity: 1 } },
      { label: "Revers long de ligne, rien de mieux.", effects: { popularity: 1, image: 1 } },
      { label: "L'amortie, pour le plaisir 😈", effects: { popularity: 2 } },
    ]),
    () => mk(fan(), "Tu parles combien de langues " + name + " ? Le circuit, ça aide non ? 🌍", [
      { label: "Trois, et j'apprends la quatrième.", effects: { image: 2 } },
      { label: "Juste assez pour commander à manger 😂", effects: { popularity: 2 } },
      { label: "Le langage du tennis suffit 🎾", effects: { popularity: 1 } },
    ]),
    () => mk(fan(), "Le pire réveil de ta vie de tennis " + name + " ? ⏰", [
      { label: "Un match à 10h après un vol de nuit.", effects: { popularity: 1 } },
      { label: "Le jour où j'ai oublié mes chaussures 😅", effects: { popularity: 2, happiness: 1 } },
      { label: "Je ne me réveille jamais mal, question suivante 😎", effects: { popularity: 1 } },
    ]),
    () => mk(fan(), "Tu fais quoi pour décompresser après un match perdu " + name + " ?", [
      { label: "Je coupe le téléphone et je marche.", effects: { image: 1, happiness: 1 } },
      { label: "Je revois le match, direct. Je suis maso.", effects: { image: 1 } },
      { label: "Glace au chocolat, sans exception 🍫", effects: { popularity: 2, happiness: 1 } },
    ]),
    () => mk(fan(), "Le tournoi que tu rêves de gagner " + name + " ? 🏆", [
      { label: "Le Tournoi de Londres, pour la tradition.", effects: { popularity: 1, image: 1 } },
      { label: "Les Internationaux de Paris, sur l'ocre.", effects: { popularity: 1, image: 1 } },
      { label: "Le prochain, tout simplement.", effects: { image: 2 } },
    ]),
    () => mk(fan(), "Tu cuisines " + name + " ou c'est room service tous les soirs ? 🍳", [
      { label: "Je cuisine dès que je rentre chez moi.", effects: { happiness: 1, popularity: 1 } },
      { label: "Room service, je l'avoue 😅", effects: { popularity: 2 } },
      { label: "Mon nutritionniste choisit pour moi.", effects: { image: 1 } },
    ]),
    () => mk(fan(), "Un conseil pour un jeune qui débute le tennis " + name + " ?", [
      { label: "Prends du plaisir avant tout.", effects: { image: 2, popularity: 1 } },
      { label: "Travaille ton jeu de jambes, tout part de là.", effects: { image: 2 } },
      { label: "Écoute ton coach… la plupart du temps 😄", effects: { popularity: 2 } },
    ]),
    () => mk(fan(), "Lever de soleil ou coucher de soleil sur le court " + name + " ? 🌅", [
      { label: "Lever, le calme du matin.", effects: { happiness: 1 } },
      { label: "Coucher, sous les projecteurs.", effects: { popularity: 1 } },
    ]),
    () => mk(fan(), "Ta pire superstition " + name + " ? Promis on ne juge pas 🤞", [
      { label: "Je ne marche jamais sur les lignes.", effects: { popularity: 2 } },
      { label: "Même chaussettes tant que je gagne 🧦", effects: { popularity: 2, image: -1 } },
      { label: "Aucune. Bon… peut-être une ou deux.", effects: { popularity: 1 } },
    ]),
  ];

  // ── Pool B: positive / supportive ─────────────────────────────────────────
  const positive = [
    () => mk(fan(), "Quoi qu'il arrive cette saison, on est derrière toi " + name + " 💚🎾", [
      { label: "Merci, ça compte énormément.", effects: { happiness: 3, popularity: 2 } },
      { label: "On lâche rien ensemble !", effects: { popularity: 2, happiness: 1 } },
      { label: "❤️", effects: { happiness: 1, popularity: 1 } },
    ]),
    () => mk(press(), "Portrait : " + name + ", un parcours qui inspire la nouvelle génération.", [
      { label: "Très touché par cet article.", effects: { image: 2, happiness: 1 } },
      { label: "Le plus dur reste à venir.", effects: { image: 2 } },
      { label: "Merci, mais je reste focus.", effects: { image: 1 } },
    ]),
    () => mk(fan(), "Mon fils a commencé le tennis grâce à toi " + name + ". Merci pour tout 🙏", [
      { label: "Ça me touche, longue carrière à lui !", effects: { popularity: 3, happiness: 2, image: 1 } },
      { label: "Le tennis a besoin de jeunes comme lui 💪", effects: { popularity: 2, image: 1 } },
      { label: "🥹💚", effects: { happiness: 2, popularity: 1 } },
    ]),
    () => mk(fan(), "J'ai fait 300 km pour te voir jouer " + name + ", aucun regret 🙌", [
      { label: "Merci infiniment, c'est pour vous que je joue.", effects: { popularity: 3, happiness: 2 } },
      { label: "La prochaine fois, viens me dire bonjour !", effects: { popularity: 2, image: 1 } },
      { label: "🙏", effects: { happiness: 1 } },
    ]),
    () => mk(press(), name + " fait partie des profils à suivre selon notre rédaction.", [
      { label: "Merci, ça motive à travailler encore plus.", effects: { image: 2, happiness: 1 } },
      { label: "Je préfère qu'on juge sur les résultats.", effects: { image: 1 } },
      { label: "Enfin quelqu'un qui a l'œil 😎", effects: { popularity: 2, image: -1 } },
    ]),
    () => mk(fan(), "Ton fair-play au dernier match, respect total " + name + " 👏", [
      { label: "Le respect de l'adversaire, c'est la base.", effects: { image: 3 } },
      { label: "Merci, j'essaie de rester moi-même.", effects: { image: 1, happiness: 1 } },
      { label: "❤️", effects: { popularity: 1 } },
    ]),
    () => mk(fan(), "Mon club organise un tournoi en ton honneur ce week-end " + name + " 🎾", [
      { label: "Génial ! Envoyez-moi des photos 📸", effects: { popularity: 3, happiness: 1 } },
      { label: "Quel honneur, bon tournoi à tous !", effects: { image: 2, popularity: 1 } },
    ]),
    () => mk(fan(), "Tu es une vraie source de motivation pour moi au quotidien " + name + ".", [
      { label: "Ça me va droit au cœur, merci.", effects: { happiness: 3, popularity: 1 } },
      { label: "Crois en toi, c'est le plus important.", effects: { image: 2, popularity: 1 } },
    ]),
    () => mk(fan(), "Ma fille a fait un dessin de toi pour son école " + name + " 🖍️", [
      { label: "Montre-le-moi, je veux le voir !", effects: { popularity: 3, happiness: 2 } },
      { label: "Dis-lui merci, ça me touche beaucoup.", effects: { happiness: 2, image: 1 } },
    ]),
    () => mk(press(), "Notre rédaction a élu le point de la semaine : signé " + name + ". 🎬", [
      { label: "Merci ! Je ne sais toujours pas comment il est passé 😄", effects: { popularity: 2 } },
      { label: "Le résultat de beaucoup de travail.", effects: { image: 2 } },
    ]),
    () => mk(fan(), "Le club de mon village suit tous tes matchs sur grand écran " + name + " 📺", [
      { label: "Énorme ! Un salut à tout le club 👋", effects: { popularity: 3, happiness: 1 } },
      { label: "Je passerai vous voir un jour, promis.", effects: { popularity: 2, image: 1 } },
    ]),
    () => mk(fan(), "Tes interviews sont toujours honnêtes " + name + ", c'est rare. Merci.", [
      { label: "Je dis ce que je pense, c'est plus simple.", effects: { image: 2 } },
      { label: "Merci, j'essaie de rester vrai.", effects: { image: 1, happiness: 1 } },
    ]),
    () => mk(fan(), "Joyeux anniversaire de ta première victoire pro " + name + " 🎂🎾", [
      { label: "Déjà ?! Le temps passe trop vite.", effects: { happiness: 2, popularity: 1 } },
      { label: "Merci d'avoir été là depuis le début.", effects: { popularity: 2, happiness: 1 } },
    ]),
  ];

  // ── Pool C: light criticism / mixed (kept rarer) ─────────────────────────
  const mixed = [
    () => mk(fan(), name + " un peu trop discret sur les réseaux non ? On veut du contenu ! 📸", [
      { label: "Promis, je poste plus souvent.", effects: { popularity: 2 } },
      { label: "Je préfère parler sur le court.", effects: { image: 2, popularity: -1 } },
      { label: "Patience, des surprises arrivent 👀", effects: { popularity: 1 } },
    ]),
    () => mk(fan(), "Franchement " + name + ", ton jeu manque parfois d'agressivité. Mon avis 🤷", [
      { label: "Note prise, je bosse là-dessus.", effects: { image: 1 } },
      { label: "Chacun son style, ça marche pour moi.", effects: { popularity: 1, image: 1 } },
      { label: "Viens sur le court, on verra 😏", effects: { popularity: 2, image: -2 } },
    ]),
    () => mk(fan(), "Ton revers lâche encore sous pression " + name + "… faut bosser ça 😬", [
      { label: "C'est vrai, on y travaille chaque jour.", effects: { image: 2 } },
      { label: "Tu devrais voir le tien 😏", effects: { popularity: 1, image: -2 } },
      { label: "Merci pour le conseil, coach 😅", effects: { popularity: 1 } },
    ]),
    () => mk(press(), "Tribune : " + name + " doit-il revoir son calendrier ? Trop de voyages selon certains.", [
      { label: "Chaque choix est réfléchi avec mon équipe.", effects: { image: 2 } },
      { label: "Les experts de canapé, merci bien.", effects: { popularity: 1, image: -3 } },
      { label: "Pas de commentaire.", effects: { image: -1 } },
    ]),
    () => mk(fan(), "Les billets pour te voir sont trop chers " + name + ", pense aux vrais fans 😤", [
      { label: "Je vais en parler aux organisateurs.", effects: { image: 2, popularity: 1 } },
      { label: "Je ne fixe pas les prix, désolé.", effects: { image: -1 } },
      { label: "Je ferai une séance ouverte au public 🎾", effects: { popularity: 3, happiness: -1 } },
    ]),
    () => mk(fan(), "On t'a vu râler contre l'arbitre " + name + ". Pas très classe 🙄", [
      { label: "Vous avez raison, je m'excuse.", effects: { image: 2, happiness: -1 } },
      { label: "La décision était vraiment fausse !", effects: { popularity: 1, image: -2 } },
      { label: "C'est la passion qui parle.", effects: { popularity: 1 } },
    ]),
    () => mk(fan(), "Ton deuxième service est trop prévisible " + name + ". Tout le monde le sait 👀", [
      { label: "Merci du scouting gratuit 😅", effects: { popularity: 1 } },
      { label: "On travaille dessus avec mon équipe.", effects: { image: 2 } },
      { label: "Prévisible, mais efficace.", effects: { popularity: 1, image: -1 } },
    ]),
    () => mk(press(), "Édito : " + name + " a-t-il le physique pour tenir une saison entière ?", [
      { label: "Rendez-vous en fin de saison.", effects: { image: 2 } },
      { label: "Mon préparateur rigole en lisant ça.", effects: { popularity: 1, image: -1 } },
      { label: "Pas de commentaire.", effects: { image: -1 } },
    ]),
    () => mk(fan(), "Tu signes moins d'autographes qu'avant " + name + "… la célébrité monte à la tête ? 😒", [
      { label: "Désolé, j'avais un vol. Je me rattraperai.", effects: { image: 2, popularity: 1 } },
      { label: "Je fais de mon mieux, promis.", effects: { image: 1 } },
      { label: "Je ne peux pas tout faire.", effects: { popularity: -2 } },
    ]),
    () => mk(fan(), "Ta tenue de la semaine, honnêtement… on en parle ? 🙈", [
      { label: "Les goûts et les couleurs 😄", effects: { popularity: 2 } },
      { label: "Ce n'est pas moi qui choisis !", effects: { popularity: 1 } },
      { label: "J'adore, et je la remettrai.", effects: { popularity: 1, happiness: 1 } },
    ]),
    () => mk(press(), "Certains anciens joueurs trouvent " + name + " trop prudent dans le jeu. Votre avis ?", [
      { label: "Chacun son tennis.", effects: { image: 1 } },
      { label: "Ils peuvent venir me le dire en face.", effects: { popularity: 2, image: -2 } },
      { label: "J'écoute toutes les critiques, ça fait progresser.", effects: { image: 2 } },
    ]),
  ];

  // ── Pool E: context-aware posts (current situation of the player) ────────
  const context = [];
  const lastMatch = (player.matchHistory || [])[0];
  if (player.injury && player.injury.weeksRemaining > 0) {
    context.push(() => mk(fan(), "Prompt rétablissement " + name + " ! On a hâte de te revoir sur le court 🩹", [
      { label: "Merci, je reviens plus fort.", effects: { happiness: 2, popularity: 1 } },
      { label: "Patience, le corps décide.", effects: { image: 1 } },
      { label: "❤️", effects: { happiness: 1 } },
    ]));
  }
  if (lastMatch && lastMatch.won && lastMatch.round === "Vainqueur") {
    context.push(() => mk(fan(), "TITRE à " + (lastMatch.tournament || "ce tournoi") + " 🏆 Quelle semaine " + name + " !", [
      { label: "Merci ! Une semaine inoubliable.", effects: { happiness: 2, popularity: 2 } },
      { label: "Ce n'est qu'un début.", effects: { popularity: 2, image: -1 } },
      { label: "Merci à toute mon équipe 🙏", effects: { image: 2 } },
    ]));
  } else if (lastMatch && !lastMatch.won) {
    context.push(() => mk(fan(), "Dur la défaite contre " + (lastMatch.opponent || "ton adversaire") + " " + name + "… Relève la tête 💪", [
      { label: "Déjà tourné vers la suite.", effects: { image: 1, happiness: 1 } },
      { label: "Je n'étais pas au niveau, c'est tout.", effects: { image: 2, happiness: -1 } },
      { label: "Merci pour le soutien ❤️", effects: { happiness: 2 } },
    ]));
  }
  if ((player.popularity ?? 20) >= 70) {
    context.push(() => mk(press(), name + " parmi les sportifs les plus suivis du moment sur les réseaux.", [
      { label: "Merci à tous ceux qui me suivent !", effects: { popularity: 2, happiness: 1 } },
      { label: "Les réseaux, ce n'est pas l'essentiel.", effects: { image: 2, popularity: -1 } },
    ]));
  }
  if ((player.happiness ?? 70) < 35) {
    context.push(() => mk(fan(), "On te sent un peu éteint en ce moment " + name + ". Prends soin de toi 🫶", [
      { label: "Merci, je traverse une période compliquée.", effects: { happiness: 3, image: 1 } },
      { label: "Tout va bien, ne vous inquiétez pas.", effects: { popularity: 1 } },
      { label: "Je préfère ne pas en parler.", effects: { image: -1 } },
    ]));
  }
  const recentMatches = (player.matchHistory || []).slice(0, 5);
  if (recentMatches.length >= 4 && recentMatches.every(m => m.won)) {
    context.push(() => mk(fan(), recentMatches.length + " victoires de suite " + name + " 🔥 Qui peut t'arrêter ?", [
      { label: "Personne, j'espère 😄", effects: { popularity: 2, image: -1 } },
      { label: "Un match à la fois.", effects: { image: 2 } },
      { label: "Merci, la confiance est là.", effects: { happiness: 2 } },
    ]));
  }
  if (recentMatches.length >= 3 && recentMatches.slice(0, 3).every(m => !m.won)) {
    context.push(() => mk(press(), "Trois défaites de suite pour " + name + ". Le doute s'installe ?", [
      { label: "Aucun doute, juste des détails à régler.", effects: { image: 2 } },
      { label: "C'est dur, je ne vais pas mentir.", effects: { image: 1, happiness: 1 } },
      { label: "Les journalistes adorent les crises.", effects: { popularity: 1, image: -2 } },
    ]));
  }
  if ((player.money ?? 0) < 1500) {
    context.push(() => mk(fan(), "Les voyages coûtent une fortune quand on débute… courage " + name + " 💸", [
      { label: "Merci, c'est vraiment la galère parfois.", effects: { happiness: 2, popularity: 1 } },
      { label: "Ça fait partie du chemin.", effects: { image: 2 } },
    ]));
  }
  if ((player.sponsors || []).length > 0) {
    const sp = pickRandom(player.sponsors);
    context.push(() => mk(fan(), "Vu ta nouvelle pub avec " + (sp.brand || sp.name || "ton sponsor") + " " + name + " 😎", [
      { label: "Le tournage était très drôle !", effects: { popularity: 2 } },
      { label: "Merci, fier de les représenter.", effects: { image: 1 } },
      { label: "Ne regardez pas les prises ratées 🙈", effects: { popularity: 2, happiness: 1 } },
    ]));
  }
  const nextWeekNum = week >= 52 ? 1 : week + 1;
  const bigNext = ALL_TOURNAMENTS.find(t => t.week === nextWeekNum && (t.tier === "GrandSlam" || t.tier === "Finals"));
  if (bigNext) {
    context.push(() => mk(fan(), bigNext.name + " la semaine prochaine " + name + " ! Objectif ? 🎯", [
      { label: "Aller le plus loin possible.", effects: { image: 1 } },
      { label: "Le titre, rien d'autre.", effects: { popularity: 2, image: -1 } },
      { label: "Profiter de chaque match.", effects: { happiness: 2 } },
    ]));
  }
  if (player.location) {
    context.push(() => mk(fan(), "Bienvenue à " + player.location + " " + name + " ! Tu vas visiter un peu ? 🗺️", [
      { label: "Oui, j'adore découvrir les villes du circuit.", effects: { popularity: 2, happiness: 1 } },
      { label: "Hôtel, court, hôtel. Focus total.", effects: { image: 1 } },
      { label: "Des recommandations ? 👀", effects: { popularity: 2 } },
    ]));
  }

  // ── Pool D: reaction to a post the player liked (if any recent likes) ─────
  const likedWorld = (news || []).filter(p => p.likedByUser && p.feed !== "personal");
  const reactions = [];
  if (likedWorld.length > 0) {
    const liked = pickRandom(likedWorld);
    const who = liked.author?.name || "ce post";
    reactions.push(() => mk(fan(),
      "J'ai vu que t'as liké le post de " + who + " 👀 Tu suis ça de près " + name + " ?", [
      { label: "Toujours un œil sur l'actu du circuit.", effects: { image: 1, popularity: 1 } },
      { label: "On peut rien vous cacher 😄", effects: { popularity: 2 } },
      { label: "Un like est juste un like 😅", effects: { image: 1 } },
    ]));
    if (liked.author?.type === "brand") {
      reactions.push(() => mk(fan(),
        "Alors " + name + ", un petit deal qui se prépare avec " + who + " ? 👀 (vu ton like)", [
        { label: "Wait and see 😉", effects: { popularity: 2 } },
        { label: "Rien d'officiel pour l'instant.", effects: { image: 1 } },
        { label: "J'aime juste leurs produits !", effects: { popularity: 1 } },
      ]));
    }
  }

  // Weighted, varied selection. Roughly 50% chance of 1 casual/fun, frequent
  // positive, occasional mixed, and a reaction when the player has liked stuff.
  // Pas deux fois le même texte en peu de temps.
  const recentContents = new Set((news || []).slice(0, 80).map(p => p.content));
  const pickFresh = (pool) => {
    let post = null;
    for (let k = 0; k < 8; k++) {
      post = pickRandom(pool)();
      if (!recentContents.has(post.content)) break;
    }
    recentContents.add(post.content);
    return post;
  };
  if (random() < 0.55) out.push(pickFresh(casual));
  if (random() < 0.45) out.push(pickFresh(positive));
  if (random() < 0.25) out.push(pickFresh(mixed));
  if (reactions.length > 0 && random() < 0.6) out.push(pickFresh(reactions));
  if (context.length > 0 && random() < 0.5) out.push(pickFresh(context));

  // Guarantee at least one personal post most weeks so the feed stays alive.
  if (out.length === 0 && random() < 0.7) out.push(pickFresh(casual));

  return out;
}

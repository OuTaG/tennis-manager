// Entraînements, activités de loisir, événements de vie, placements.

// Reduced energy costs - 3 trainings should cost ~25 energy total (was ~50)
export const TRAINING_MODULES = [
  { id: "service", name: "Service", stat: "serve", cost: 50, baseGain: 0.5, energyCost: 8, iconName: "racquet" },
  { id: "revers", name: "Revers", stat: "backhand", cost: 40, baseGain: 0.5, energyCost: 7, iconName: "dumbbell" },
  { id: "coup_droit", name: "Coup droit", stat: "forehand", cost: 40, baseGain: 0.5, energyCost: 7, iconName: "target" },
  { id: "physique", name: "Préparation physique", stat: "stamina", cost: 45, baseGain: 0.5, energyCost: 10, iconName: "run" },
  { id: "mental", name: "Travail mental", stat: "mental", cost: 35, baseGain: 0.4, energyCost: 4, iconName: "brain" },
  { id: "filet", name: "Jeu au filet", stat: "net", cost: 45, baseGain: 0.5, energyCost: 7, iconName: "goal" },
];

// ─── LIFE ACTIVITIES ────────────────────────────────────────────────────────
// Cost in € and energy, effects on happiness/popularity/image.
// One-shot activities with cooldown (in weeks). Each activity must have at least
// one downside to prevent free stacking of gains.
// cooldown = nombre de semaines avant de pouvoir refaire l'activité.
export const LIFE_ACTIVITIES = [
  // Repos / loisirs simples — petits gains, courts cooldowns
  { id: "cinema", name: "Aller au cinéma", desc: "Une soirée tranquille devant un film", cost: 15, energyCost: 2, cooldown: 2, iconName: "sparkles", happiness: 3, popularity: 0, image: 0 },
  { id: "verre", name: "Boire un verre", desc: "Un verre avec des amis en ville", cost: 30, energyCost: 6, cooldown: 2, iconName: "users", happiness: 5, popularity: 0, image: -1 },
  { id: "resto", name: "Restaurant", desc: "Bon repas dans un restaurant", cost: 80, energyCost: 3, cooldown: 3, iconName: "money", happiness: 5, popularity: 0, image: 0 },
  { id: "famille", name: "Voir sa famille", desc: "Un moment avec les proches", cost: 50, energyCost: 4, cooldown: 4, iconName: "heart", happiness: 8, popularity: 0, image: 0 },
  { id: "shopping", name: "Shopping", desc: "Sortie achats", cost: 600, energyCost: 5, cooldown: 4, iconName: "money", happiness: 4, popularity: 0, image: 0 },

  // Récupération — gain d'énergie modéré, bonheur faible et cooldown long
  { id: "spa", name: "Spa & massage", desc: "Récupération + détente totale", cost: 250, energyCost: -8, cooldown: 5, iconName: "heart", happiness: 2, popularity: 0, image: 0 },
  { id: "voyage", name: "Week-end voyage", desc: "Mini-évasion 2 jours", cost: 600, energyCost: -5, cooldown: 8, iconName: "plane", happiness: 4, popularity: 0, image: 0 },

  // Visibilité — actions publiques qui font réellement bouger pop/image (mais moins qu'avant)
  { id: "concert", name: "Concert", desc: "Une soirée live, vu par les fans", cost: 200, energyCost: 10, cooldown: 6, iconName: "sparkles", happiness: 6, popularity: 1, image: 0 },
  { id: "interview", name: "Interview presse", desc: "Mettre en avant votre image", cost: 0, energyCost: 10, cooldown: 8, iconName: "news", happiness: -3, popularity: 2, image: 2 },
  { id: "social", name: "Post réseaux sociaux", desc: "Engagement avec les fans", cost: 0, energyCost: 2, cooldown: 3, iconName: "news", happiness: -1, popularity: 1, image: 0 },
  { id: "ecole", name: "Visite d'école", desc: "Rencontre avec des jeunes joueurs", cost: 100, energyCost: 8, cooldown: 12, iconName: "users", happiness: 2, popularity: 1, image: 2 },

  // Achats de luxe — chers, ostentatoires
  { id: "voiture", name: "Acheter une voiture", desc: "Belle voiture, on en parle", cost: 35000, energyCost: 0, cooldown: 26, iconName: "trophy", happiness: 8, popularity: 2, image: 1 },
  { id: "montre", name: "Montre de luxe", desc: "Achat statutaire", cost: 8000, energyCost: 0, cooldown: 12, iconName: "trophy", happiness: 3, popularity: 1, image: 1 },

  // Charity — cher mais reste un gros levier d'image (action qui marque)
  { id: "charity", name: "Don à une association", desc: "Geste qui se voit, vraie générosité", cost: 10000, energyCost: 2, cooldown: 20, iconName: "heart", happiness: 3, popularity: 3, image: 4 },
];

// Random weekly events (dilemma-style popups). Each has 2-3 options.
// Options have effects: { money?, energy?, happiness?, popularity?, image? }.
export const LIFE_EVENTS = [
  {
    id: "interview_demand",
    title: "Demande d'interview",
    body: "Un grand magazine sportif vous propose une interview exclusive. Vous y consacrez un après-midi.",
    options: [
      { label: "Accepter et jouer le jeu", effects: { energy: -8, popularity: 5, image: 4 } },
      { label: "Accepter mais bâcler", effects: { energy: -3, popularity: 2, image: -3 } },
      { label: "Refuser", effects: { popularity: -2, image: 1 } },
    ],
  },
  {
    id: "paparazzi",
    title: "Photo paparazzi",
    body: "Un paparazzi vous a pris en photo en train de sortir d'un club à 3h du matin.",
    minSeason: 2,
    options: [
      { label: "Assumer publiquement", effects: { happiness: 2, popularity: 3, image: -2 } },
      { label: "Démentir via votre agent", effects: { popularity: -1, image: 1 } },
      { label: "Racheter les photos (5 000€)", effects: { money: -5000, image: 3 } },
    ],
  },
  {
    id: "invitation_gala",
    title: "Invitation à un gala",
    body: "Une marque de luxe vous invite à un gala caritatif. Tenue habillée requise.",
    minSeason: 2,
    options: [
      { label: "Y aller en grande tenue (2 000€)", effects: { money: -2000, energy: -6, popularity: 4, image: 6, happiness: 2 } },
      { label: "Y aller modestement", effects: { energy: -5, popularity: 2, image: 2 } },
      { label: "Décliner poliment", effects: { popularity: -1 } },
    ],
  },
  {
    id: "polemique_reseaux",
    title: "Polémique sur les réseaux",
    body: "Un tweet maladroit de votre part fait débat. Les commentaires s'enflamment.",
    options: [
      { label: "Présenter des excuses", effects: { happiness: -2, image: 2 } },
      { label: "Assumer et tenir position", effects: { popularity: 3, image: -4 } },
      { label: "Supprimer et faire silence", effects: { popularity: -2, image: -1 } },
    ],
  },
  {
    id: "ami_demande_argent",
    title: "Un proche vous demande de l'aide",
    body: "Un vieil ami traverse une mauvaise passe et vous demande 3 000€.",
    options: [
      { label: "Lui prêter sans condition", effects: { money: -3000, happiness: 5 } },
      { label: "L'aider à moitié (1 500€)", effects: { money: -1500, happiness: 2 } },
      { label: "Refuser", effects: { happiness: -4 } },
    ],
  },
  {
    id: "documentaire",
    title: "Proposition de documentaire",
    body: "Un réalisateur veut faire un documentaire sur votre carrière. Tournage long et intrusif.",
    minSeason: 3,
    options: [
      { label: "Accepter", effects: { energy: -10, popularity: 8, image: 5, happiness: -3 } },
      { label: "Refuser", effects: { popularity: -1 } },
    ],
  },
  {
    id: "fan_courrier",
    title: "Lettre d'un jeune fan",
    body: "Un enfant gravement malade vous écrit. Sa famille espère une réponse.",
    minSeason: 2,
    options: [
      { label: "Aller le rencontrer", effects: { energy: -6, happiness: 8, image: 8, popularity: 5 } },
      { label: "Envoyer une vidéo perso", effects: { happiness: 4, image: 4, popularity: 2 } },
      { label: "Ignorer", effects: { happiness: -3, image: -3 } },
    ],
  },
  {
    id: "scandale_evite",
    title: "Rumeur infondée",
    body: "Une rumeur de dopage circule sur internet. Aucune preuve, mais ça se propage.",
    minSeason: 2,
    options: [
      { label: "Communiqué officiel ferme", effects: { image: 3, popularity: -2, happiness: -3 } },
      { label: "Porter plainte pour diffamation (3 000€)", effects: { money: -3000, image: 4, energy: -4 } },
      { label: "Ignorer, ça passera", effects: { image: -3, happiness: 2, energy: 3 } },
    ],
  },
  {
    id: "pub_marque",
    title: "Tournage publicitaire",
    body: "Une marque non-sportive vous propose un tournage rapide pour 10 000€.",
    minSeason: 2,
    options: [
      { label: "Accepter", effects: { money: 10000, energy: -5, popularity: 2, image: -1 } },
      { label: "Refuser, préserver son image", effects: { image: 2 } },
    ],
  },
  {
    id: "match_charite",
    title: "Match d'exhibition caritatif",
    body: "Une fondation vous propose un match exhibition bénévole.",
    options: [
      { label: "Accepter", effects: { energy: -12, popularity: 6, image: 7, happiness: 3 } },
      { label: "Refuser", effects: { image: -2 } },
    ],
  },

  // ─── ÉVÉNEMENTS PÉNALISANTS / PIÈGES ───────────────────────────────
  // Pas de bonne option : il faut accepter des pertes, juste limiter les dégâts.
  {
    id: "blessure_legere",
    title: "Tendinite naissante",
    body: "Votre coude vous fait souffrir. Le médecin recommande du repos.",
    options: [
      { label: "Repos forcé (1 sem.)", effects: { energy: -5, happiness: -4 } },
      { label: "Anti-inflammatoires et continuer", effects: { energy: -10, happiness: -2, image: -1 } },
    ],
  },
  {
    id: "amende_federation",
    title: "Amende de la fédération",
    body: "Une réflexion lors d'un match a déplu. La fédération vous inflige une amende.",
    options: [
      { label: "Payer sans rien dire", effects: { money: -3000, happiness: -3 } },
      { label: "Contester publiquement", effects: { money: -3000, popularity: 2, image: -5, happiness: -2 } },
    ],
  },
  {
    id: "vol_montre",
    title: "Cambriolage",
    body: "Votre domicile a été cambriolé pendant votre absence. Vol important.",
    minSeason: 2,
    options: [
      { label: "Subir la perte", effects: { money: -8000, happiness: -6 } },
      { label: "Renforcer la sécurité après coup", effects: { money: -12000, happiness: -4, image: 1 } },
    ],
  },
  {
    id: "famille_obligation",
    title: "Obligation familiale",
    body: "Un événement familial important tombe en pleine semaine de préparation.",
    options: [
      { label: "Y aller (annule l'entraînement)", effects: { energy: -8, happiness: 4 } },
      { label: "Sauter, rester focus", effects: { happiness: -6, image: -1 } },
    ],
  },
  {
    id: "agent_conflit",
    title: "Conflit avec votre agent",
    body: "Votre agent a pris une décision sans vous consulter. Tensions.",
    options: [
      { label: "Le confronter", effects: { happiness: -3, energy: -3 } },
      { label: "Le licencier (frais juridiques)", effects: { money: -5000, happiness: -2, image: -3 } },
      { label: "Laisser couler", effects: { happiness: -5, image: -1 } },
    ],
  },
  {
    id: "tabloid_couple",
    title: "Photos volées d'une dispute",
    body: "Un tabloïd publie des photos de vous en pleine dispute publique.",
    minSeason: 3,
    options: [
      { label: "Démentir froidement", effects: { popularity: -2, image: -2 } },
      { label: "S'expliquer dans une story", effects: { happiness: -3, popularity: 1, image: -4 } },
      { label: "Poursuivre le journal", effects: { money: -4000, image: -1 } },
    ],
  },
  {
    id: "supporters_huees",
    title: "Sifflé par le public",
    body: "Lors d'un récent match, le public local vous a copieusement sifflé.",
    minSeason: 2,
    options: [
      { label: "Répondre avec classe", effects: { image: 2, happiness: -3 } },
      { label: "Geste désinvolte au public", effects: { popularity: 3, image: -6, happiness: -2 } },
      { label: "Ignorer totalement", effects: { popularity: -2, happiness: -4 } },
    ],
  },
  {
    id: "ex_coach",
    title: "Ancien coach critique",
    body: "Votre ex-coach déballe tout dans une interview négative.",
    minSeason: 3,
    options: [
      { label: "Répondre publiquement", effects: { popularity: 2, image: -4, happiness: -3 } },
      { label: "Garder le silence", effects: { image: -2, happiness: -4 } },
    ],
  },
  {
    id: "dopage_controle",
    title: "Contrôle antidopage inopiné",
    body: "L'AMA débarque pour un contrôle surprise. Un complément alimentaire récent contient une substance limite et le test revient positif. Vous savez que vous n'avez rien pris sciemment.",
    minSeason: 3,
    options: [
      { label: "Reconnaître et accepter la sanction (suspension 6 mois)", effects: { money: -15000, happiness: -15, popularity: -10, image: -20, energy: -5 } },
      { label: "Faire appel avec une équipe d'avocats", effects: { money: -40000 }, outcomes: [
        { chance: 0.55, msg: "Appel gagné : vous êtes blanchi.", effects: { happiness: -2, image: 2 } },
        { chance: 0.45, msg: "Appel rejeté : la sanction est confirmée.", effects: { happiness: -14, popularity: -8, image: -15 } },
      ] },
      { label: "Tout nier et accuser le laboratoire", effects: { money: -10000 }, outcomes: [
        { chance: 0.25, msg: "Le laboratoire reconnaît une erreur. Vous sortez renforcé.", effects: { popularity: 3, image: 1 } },
        { chance: 0.75, msg: "Personne ne vous croit : votre réputation s'effondre.", effects: { happiness: -10, popularity: -6, image: -28 } },
      ] },
    ],
  },

  // ─── ÉVÉNEMENTS LÉGERS / NEUTRES / FUN ───────────────────────────────
  // Effets volontairement modérés pour ne pas déséquilibrer la partie.
  {
    id: "jour_repos",
    title: "Journée off",
    body: "Pas de tournoi en vue cette semaine. Comment occupez-vous votre temps libre ?",
    options: [
      { label: "Repos total à la maison", effects: { energy: 8, happiness: 3 } },
      { label: "Sortie entre amis", effects: { energy: -2, happiness: 6, popularity: 1 } },
      { label: "Séance vidéo + analyse de jeu", effects: { energy: -3, happiness: -1 } },
    ],
  },
  {
    id: "rencontre_idole",
    title: "Rencontre avec une légende",
    body: "Un ancien champion que vous admirez vous propose de déjeuner et d'échanger quelques conseils.",
    options: [
      { label: "Accepter avec joie", effects: { happiness: 6, energy: -3, image: 2 } },
      { label: "Décliner, trop occupé", effects: { happiness: -1 } },
    ],
  },
  {
    id: "podcast_invite",
    title: "Invitation podcast",
    body: "Un podcast populaire vous invite pour une discussion détendue d'une heure.",
    minSeason: 2,
    options: [
      { label: "Y aller, parler franchement", effects: { energy: -4, popularity: 4, image: 1, happiness: 1 } },
      { label: "Y aller, rester prudent", effects: { energy: -4, popularity: 2 } },
      { label: "Refuser", effects: { popularity: -1 } },
    ],
  },
  {
    id: "anniversaire",
    title: "Votre anniversaire",
    body: "C'est votre anniversaire ! Vos proches veulent organiser quelque chose.",
    options: [
      { label: "Grande fête (3 000€)", effects: { money: -3000, happiness: 8, energy: -5, popularity: 2 } },
      { label: "Dîner intime", effects: { money: -300, happiness: 5 } },
      { label: "Rester focus, juste un gâteau", effects: { happiness: 1 } },
    ],
  },
  {
    id: "nouveau_gadget",
    title: "Nouvelle techno d'entraînement",
    body: "Un capteur de mouvement dernier cri promet d'affiner votre service. Coût non négligeable.",
    minSeason: 2,
    options: [
      { label: "Investir (4 000€)", effects: { money: -4000, energy: -2, happiness: 2 }, trainBoost: { weeks: 5, mul: 1.15 } },
      { label: "Passer son tour", effects: {} },
    ],
  },
  {
    id: "fan_club",
    title: "Création d'un fan club",
    body: "Des supporters veulent lancer un fan club officiel à votre nom.",
    minSeason: 2,
    options: [
      { label: "Soutenir l'initiative", effects: { popularity: 5, happiness: 2, energy: -4, money: -1500 } },
      { label: "Soutenir de loin, sans s'impliquer", effects: { popularity: 2, image: -1 } },
      { label: "Rester discret", effects: { popularity: -1, image: 1, energy: 2 } },
    ],
  },
  {
    id: "vacances_eclair",
    title: "Escapade improvisée",
    body: "Une fenêtre de calme dans le calendrier : vous pourriez partir quelques jours.",
    options: [
      { label: "Partir au soleil (2 500€)", effects: { money: -2500, energy: 12, happiness: 7 } },
      { label: "Mini-break local", effects: { money: -400, energy: 6, happiness: 3 } },
      { label: "Rester s'entraîner", effects: { energy: -2, happiness: -2 } },
    ],
  },
  {
    id: "reseaux_viral",
    title: "Vidéo virale",
    body: "Un point spectaculaire que vous avez joué devient viral. Des millions de vues.",
    options: [
      { label: "Surfer dessus avec humour", effects: { popularity: 6, image: 2, happiness: 2 } },
      { label: "Rester sobre", effects: { popularity: 2, image: 2 } },
    ],
  },
  {
    id: "cuisine_resto",
    title: "Invitation d'un chef étoilé",
    body: "Un chef réputé, fan de tennis, vous invite à dîner gratuitement dans son restaurant.",
    options: [
      { label: "Accepter (et poster une photo)", effects: { happiness: 4, popularity: 2 } },
      { label: "Accepter discrètement", effects: { happiness: 4 } },
      { label: "Décliner, régime strict", effects: { happiness: -2, energy: 2 } },
    ],
  },
  {
    id: "jeune_espoir",
    title: "Un jeune vous demande conseil",
    body: "Un junior prometteur de votre académie vous demande de le parrainer informellement.",
    minSeason: 2,
    options: [
      { label: "Le prendre sous votre aile", effects: { energy: -4, happiness: 4, image: 3 } },
      { label: "Lui donner quelques conseils", effects: { happiness: 2, image: 1 } },
      { label: "Pas le temps", effects: { image: -1 } },
    ],
  },
  {
    id: "meteo_caprice",
    title: "Intempéries",
    body: "Une tempête bloque vos déplacements et perturbe votre semaine de préparation.",
    options: [
      { label: "S'entraîner en salle quand même", effects: { energy: -5, happiness: -1 }, statGain: 0.3 },
      { label: "Profiter pour récupérer", effects: { energy: 6, happiness: 1 } },
    ],
  },
  {
    id: "interview_piege",
    title: "Question piège en conférence",
    body: "Un journaliste vous pose une question polémique sur un confrère du circuit.",
    options: [
      { label: "Botter en touche avec diplomatie", effects: { image: 2 } },
      { label: "Répondre cash", effects: { popularity: 3, image: -3, happiness: 1 } },
      { label: "Refuser de répondre", effects: { popularity: -1, image: 1 } },
    ],
  },
  {
    id: "objet_perdu",
    title: "Raquette fétiche égarée",
    body: "Votre raquette préférée a disparu pendant un transfert d'aéroport.",
    options: [
      { label: "En racheter une identique (600€)", effects: { money: -600, happiness: 1 } },
      { label: "S'adapter à un nouveau modèle", effects: { happiness: -3 } },
    ],
  },
  {
    id: "demande_mariage_fan",
    title: "Demande en mariage d'un fan",
    body: "En plein match exhibition, un spectateur brandit une pancarte vous demandant en mariage. Le public adore.",
    minSeason: 2,
    options: [
      { label: "Jouer le jeu avec humour", effects: { popularity: 4, happiness: 3, image: 1 } },
      { label: "Sourire poliment et continuer", effects: { popularity: 1 } },
    ],
  },
  {
    id: "association_caritative",
    title: "Devenir ambassadeur",
    body: "Une association sérieuse vous propose d'en devenir l'ambassadeur. Engagement de temps.",
    minSeason: 2,
    options: [
      { label: "Accepter pleinement", effects: { energy: -6, image: 6, happiness: 4, popularity: 3 } },
      { label: "Soutien ponctuel seulement", effects: { image: 2, happiness: 1 } },
      { label: "Refuser, manque de temps", effects: { image: -1 } },
    ],
  },
  {
    id: "petit_coup_de_mou",
    title: "Coup de fatigue mentale",
    body: "La routine du circuit pèse. Vous ressentez une lassitude inhabituelle.",
    options: [
      { label: "Voir un préparateur mental (1 000€)", effects: { money: -1000, happiness: 6, energy: 2 } },
      { label: "Lever le pied une semaine", effects: { energy: 8, happiness: 3, popularity: -3 } },
      { label: "Serrer les dents", effects: { happiness: -4, energy: -3 } },
    ],
  },
  {
    id: "investissement_propose",
    title: "Opportunité d'investissement",
    body: "Un proche vous propose d'investir dans un petit commerce. Risqué mais tentant.",
    minSeason: 3,
    options: [
      { label: "Investir gros (15 000€)", effects: { money: -15000, happiness: 1 }, investment: { amount: 15000, plan: "big", weeks: 12 } },
      { label: "Investir prudemment (4 000€)", effects: { money: -4000 }, investment: { amount: 4000, plan: "safe", weeks: 12 } },
      { label: "Refuser", effects: {} },
    ],
  },
  {
    id: "retard_avion",
    title: "Vol annulé",
    body: "Votre vol pour le prochain tournoi est annulé. Solution de dernière minute coûteuse.",
    options: [
      { label: "Réserver un vol privé (8 000€)", effects: { money: -8000, energy: -2 } },
      { label: "Attendre le prochain vol", effects: { energy: -6, happiness: -3 } },
    ],
  },
  {
    id: "marque_vetement",
    title: "Collaboration mode",
    body: "Une marque de streetwear veut créer une capsule à votre nom.",
    minSeason: 2,
    options: [
      { label: "Lancer la collab (revenus)", effects: { money: 6000, popularity: 4, image: 1, energy: -3 } },
      { label: "Refuser, pas votre univers", effects: { image: 1 } },
    ],
  },
  {
    id: "blessure_entrainement",
    title: "Petite alerte à l'entraînement",
    body: "Une gêne musculaire est apparue lors d'une séance intense.",
    options: [
      { label: "Repos préventif", effects: { energy: 4, happiness: -2 }, restWeeks: 2 },
      { label: "Continuer prudemment", effects: { energy: -6, happiness: -1 }, injuryRisk: 0.10 },
    ],
  },
];

// Delayed investment outcomes: [chance, return multiplier, message].
export const INVESTMENT_PLANS = {
  big:  [
    { chance: 0.25, mul: 4.0, msg: "Le commerce cartonne ! Votre gros investissement est multiplié par 4." },
    { chance: 0.35, mul: 1.5, msg: "Le commerce tourne bien : belle plus-value sur votre investissement." },
    { chance: 0.40, mul: 0.0, msg: "Le commerce a fait faillite. Votre investissement est perdu." },
  ],
  safe: [
    { chance: 0.20, mul: 3.0, msg: "Excellente surprise : votre placement prudent est multiplié par 3." },
    { chance: 0.50, mul: 1.3, msg: "Placement prudent rentable : petite plus-value." },
    { chance: 0.30, mul: 0.5, msg: "Le commerce peine : vous ne récupérez que la moitié de votre mise." },
  ],
};

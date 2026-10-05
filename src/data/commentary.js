// Textes des commentateurs et débriefs de match.

// ─── COMMENTARY DATABASE ──────────────────────────────────────────────────────
// Each commentary type is selected based on actual match state.
// Variables: {p} = player, {o} = opponent, {server}, {receiver}
export const COMMENTARY = {
  // ── Premier jeu du match : ton d'ouverture ─────────────────────────────
  first_hold: [
    "C'est parti ! {p} ouvre le match en tenant son service",
    "Entrée en matière réussie pour {p}, premier jeu dans la poche",
    "{p} lance la rencontre sur un jeu de service maîtrisé",
    "Premier jeu pour {p}, qui se met tout de suite dans le rythme",
    "{p} débute tranquillement au service, 1-0",
  ],
  first_break: [
    "Coup de tonnerre d'entrée : {p} breake {o} dès le premier jeu !",
    "Départ canon ! {p} prend d'emblée le service de {o}",
    "{o} manque son entame, {p} en profite et breake d'entrée",
    "Le match commence fort : break immédiat de {p} !",
  ],
  first_lose_serve: [
    "Entame ratée pour {p}, breaké dès le premier jeu",
    "Départ compliqué : {o} prend d'entrée le service de {p}",
    "{p} n'est pas encore dans son match, {o} breake d'emblée",
    "Le premier jeu échappe à {p}, qui perd son service d'entrée",
  ],
  first_opp_hold: [
    "Le match est lancé, {o} tient son premier service",
    "{o} ouvre la marque sur son engagement",
    "Premier jeu pour {o}, sans trembler au service",
    "Entame solide de {o}, qui débute par un jeu de service tenu",
    "{o} fait le premier pas, 1-0 au service",
  ],
  // Player serves and holds (no break)
  hold_easy: [
    "{p} déroule au service, jeu blanc !",
    "Service impérial pour {p}, rien à dire",
    "{p} signe un nouvel ace décisif",
    "{p} tient son service avec autorité",
    "Trois aces consécutifs, {p} survole",
    "{p} marque sur premier service, jeu rapide",
  ],
  hold_tough: [
    "{p} sauve une balle de break et conclut",
    "Jeu très accroché mais {p} s'en sort",
    "{p} tient son engagement après 8 minutes",
    "Bataille de fond de court, {p} l'emporte au mental",
    "{p} arrache son service au filet",
    "Avantage, jeu, {p} respire",
  ],
  // Player breaks opponent
  break_clean: [
    "BREAK ! {p} prend le service de {o} !",
    "{o} craque, {p} fait le break !",
    "Coup droit gagnant ! Le break pour {p} !",
    "{p} récupère le break en passant {o} au filet !",
    "Double faute de {o}, BREAK pour {p} !",
    "Retour gagnant ligne ! Break pour {p} !",
  ],
  break_grind: [
    "Après 12 points, {p} arrache le break !",
    "Au mental, {p} obtient le break crucial !",
    "{p} fait craquer {o} sur sa quatrième balle de break !",
    "{p} casse la résistance de {o}, break !",
  ],
  // Player rebreaks (recovers a break)
  rebreak: [
    "DÉBREAK ! {p} recolle au score !",
    "{p} efface le break de {o} immédiatement !",
    "Quelle réaction de {p} qui débreake aussitôt !",
    "{p} reprend le service de {o}, débreak !",
    "Le débreak de {p} ! On repart à zéro dans ce set !",
    "{p} ne reste pas longtemps mené, débreak !",
  ],
  // Opponent rebreaks (player had just broken, now loses serve)
  opp_rebreak: [
    "{o} débreake immédiatement, frustrant pour {p}",
    "{p} cède son service dans la foulée, débreak de {o}",
    "{o} efface le break de {p}, retour à l'égalité dans le set",
    "Le débreak de {o} ! {p} n'a pas su confirmer",
    "{o} récupère le break perdu, sale moment pour {p}",
  ],
  // Player takes a double break
  double_break: [
    "DOUBLE BREAK ! {p} prend le large dans ce set !",
    "{p} breake une deuxième fois, {o} est au bord du gouffre !",
    "Deux breaks d'avance pour {p}, le set semble plié !",
    "{p} enfonce le clou : double break !",
    "Encore un break ! {p} mène désormais de deux breaks",
  ],
  // Player takes a THIRD break in the set
  triple_break: [
    "Et de trois ! {p} collectionne les breaks comme des timbres",
    "Troisième break : à ce stade, {o} sert surtout pour {p}",
    "{p} breake encore. Quelqu'un peut vérifier que {o} a bien une raquette ?",
    "Trois breaks d'avance. {o} regarde son banc, son banc regarde ailleurs",
    "Encore un break de {p} ! Le service de {o} est officiellement porté disparu",
  ],
  // Opponent takes a third break
  opp_triple_break: [
    "Troisième break de {o}. {p} sert, mais on se demande pour qui",
    "Et de trois pour {o} ! Le service de {p} est en congé sans solde",
    "{p} cède encore sa mise en jeu. Même le ramasseur de balles compatit",
    "{o} breake pour la troisième fois. {p} cherche encore le mode d'emploi",
  ],
  // Opponent takes a double break
  opp_double_break: [
    "Double break pour {o}, {p} est en grand danger dans ce set",
    "{p} cède encore son service : {o} a deux breaks d'avance",
    "{o} s'envole avec un double break, {p} doit réagir vite",
    "Deuxième break de {o}, le set échappe à {p}",
  ],
  // Player recovers one of the two breaks conceded
  rebreak_double: [
    "{p} récupère un des deux breaks, la remontée est lancée !",
    "{p} refuse d'abdiquer : un break de retard seulement !",
    "Débreak de {p} ! {o} n'a plus qu'un break d'avance",
    "{p} grignote son retard, plus qu'un break à rattraper",
  ],
  // Opponent recovers one of the two breaks the player had
  opp_rebreak_double: [
    "{o} récupère un des deux breaks, {p} doit rester vigilant",
    "{p} laisse filer un break, il n'en reste plus qu'un d'avance",
    "{o} revient : plus qu'un break d'écart dans ce set",
    "Le double break s'envole, {o} recolle à un break",
  ],
  // Player loses serve (opponent breaks)
  lose_serve: [
    "Catastrophe ! {p} perd son service",
    "Double faute fatale, {o} prend le service",
    "{p} se fait breaker sur une faute directe",
    "{o} retourne tout, {p} cède son service",
    "Passing-shot foudroyant, {p} est breaké",
    "{p} explose une balle dans le filet, break {o}",
  ],
  // Opponent holds (player on return)
  opp_hold: [
    "{o} tient son service sans trembler",
    "{o} enchaîne les premiers services, jeu",
    "Solide au service, {o} maintient l'écart",
    "{o} sert juste, {p} ne peut rien faire",
    "Ace à {kmh} km/h pour {o} !",
    "{o} déroule au service, jeu blanc",
  ],
  // Tiebreak commentary (player wins)
  tb_won: [
    "JEU DÉCISIF GAGNÉ {tbScore} ! {p} fait basculer le set !",
    "Quel tie-break ! {p} l'emporte {tbScore} !",
    "{p} gagne le tie-break {tbScore}, set en poche !",
  ],
  tb_lost: [
    "Tie-break perdu {tbScore}, set pour {o}",
    "{p} cède le tie-break {tbScore}, dommage",
    "{o} remporte le tie-break {tbScore}, set perdu",
  ],
  // Set won/lost
  // Set commentary depends on the set score AFTER the set. {how} says how the
  // closing game was won (service, break, tie-break).
  // 6-0 sets ("bagel"), a bit cheeky
  bagel_won_set: [
    "6-0 ! {p} sert une bulle à {o}, et sans sucre",
    "Roue de vélo pour {p} ! {o} n'a pas vu le jour dans ce set",
    "6-0 pour {p}. {o} est prié de rendre sa raquette à l'accueil",
    "Set blanc pour {p} ! {o} a juste fait acte de présence",
  ],
  bagel_won_match: [
    "6-0 et MATCH ! {p} finit avec une bulle, {o} rentre au vestiaire sans un jeu",
    "{p} conclut par une roue de vélo : 6-0 et match. Pas de quartier",
    "Match plié sur un 6-0 : {p} a oublié de laisser des miettes à {o}",
  ],
  bagel_lost_set: [
    "6-0 pour {o}. {p} peut-être aurait dû rester au lit ce matin",
    "Bulle encaissée : {p} n'a pas marqué un jeu dans ce set",
    "Roue de vélo pour {o}. {p} cherche encore le chemin du tableau d'affichage",
    "6-0. {p} vient de découvrir ce que ressent un mur d'entraînement",
  ],
  bagel_lost_match: [
    "6-0 et match pour {o}. {p} repart avec une bulle en souvenir",
    "{o} conclut par une roue de vélo. {p} ne racontera pas ce set à ses petits-enfants",
    "Défaite sur un 6-0 : {p} a vécu une fin de match à oublier très vite",
  ],
  set_won_first: [
    "{p} remporte le premier set {score}, conclu {how}",
    "Premier set pour {p} ({score}), bouclé {how}",
    "{p} empoche la première manche {how} : {score}",
  ],
  set_won_lead: [
    "{p} s'adjuge le set {score} {how} et mène {sets}",
    "Set {score} pour {p}, conclu {how}. {sets} au compteur",
    "{p} prend l'avantage {sets} en remportant le set {how} ({score})",
  ],
  set_won_equalize: [
    "{p} égalise à {sets} en remportant le set {score} {how}",
    "{p} s'offre le set {score} {how} : {sets}, tout est relancé",
    "Réaction de {p} qui recolle à {sets}, set {score} conclu {how}",
  ],
  set_won_reduce: [
    "{p} réduit l'écart à {sets} en prenant le set {score} {how}",
    "{p} s'accroche : set {score} conclu {how}, {sets}",
  ],
  set_won_match: [
    "{p} conclut {how} : set {score} et match !",
    "Balle de match convertie {how}, {p} s'impose ({score} dans le dernier set) !",
    "{p} termine le travail {how} et remporte le match, {score} dans l'ultime manche",
  ],
  set_lost_first: [
    "{o} remporte le premier set {score}, conclu {how}",
    "Premier set pour {o} ({score}), bouclé {how}",
    "{p} cède la première manche {score}, {o} conclut {how}",
  ],
  set_lost_lead: [
    "{o} s'adjuge le set {score} {how} et mène {sets}",
    "Set {score} pour {o}, conclu {how}. {p} est mené {sets}",
    "{o} prend l'avantage {sets} en remportant le set {how} ({score})",
  ],
  set_lost_equalize: [
    "{o} égalise à {sets} en remportant le set {score} {how}",
    "{o} recolle à {sets}, set {score} conclu {how}",
    "Tout est à refaire : {o} prend le set {score} {how}, {sets}",
  ],
  set_lost_reduce: [
    "{o} réduit l'écart à {sets} en prenant le set {score} {how}",
    "{o} s'accroche : set {score} conclu {how}, {sets}",
  ],
  set_lost_match: [
    "{o} conclut {how} : set {score} et match",
    "Balle de match convertie {how} par {o}, {p} s'incline ({score} dans le dernier set)",
    "C'est terminé : {o} remporte le dernier set {score} {how}",
  ],
  // Special moments (random events)
  injury_minor: ["Petite gêne au mollet pour {p}", "{p} se masse l'épaule entre deux jeux"],
  crowd_cheer: ["Le public se lève pour {p} !", "Ambiance de feu dans le stade"],
  rain_delay: ["Quelques gouttes mais le match continue"],
  challenge: ["{p} demande un challenge... balle bonne !", "Challenge raté pour {o}"],
};

// End-of-match debriefs - vary by result, opponent strength, score pattern
export const MATCH_DEBRIEFS = {
  // Won easily (no set lost)
  win_dominant: [
    "Un match maîtrisé de bout en bout par {p}, qui n'a jamais semblé inquiété par {o}.",
    "{p} survole les débats. {o} repart sans avoir vu venir le coup. Récital.",
    "Démonstration de {p} qui n'a laissé aucune chance à {o}. Une performance de référence sur cette surface.",
    "Match expédié par {p} : la différence de niveau était flagrante face à {o}.",
    "{p} a parfaitement géré son match. Service efficace, échanges courts, peu de fautes : la recette gagnante.",
  ],
  // Won in tight match
  win_tight: [
    "Quelle bataille ! {p} s'en sort au mental face à un {o} qui n'a rien lâché.",
    "{p} arrache la victoire au bout du suspense. Un match qui marque les esprits.",
    "Combat acharné. {p} a su faire la différence dans les moments-clés malgré la résistance de {o}.",
    "Victoire au caractère pour {p}, qui a tenu bon dans les points importants face à {o}.",
    "Match très accroché remporté par {p}. Le mental aura fait la différence.",
  ],
  // Won via comeback
  win_comeback: [
    "Quelle remontée fantastique de {p} ! Mené au score, le voilà qui renverse {o} de manière spectaculaire.",
    "{p} signe une remontée historique face à {o} ! Un match référence en termes de mental.",
    "Comeback magistral de {p} ! Dos au mur, il a trouvé les ressources pour faire plier {o}.",
    "On le voyait perdu, mais {p} a su renverser la situation contre {o}. Énorme exploit !",
  ],
  // Lost easily (no set won)
  loss_blowout: [
    "Match à oublier pour {p}, dominé de la tête aux pieds par {o}.",
    "{p} n'a jamais existé dans ce match. {o} était trop fort, point.",
    "Soirée difficile pour {p} : trop de fautes, peu de solutions, et un {o} impressionnant.",
    "Défaite logique de {p} face à un {o} d'un autre niveau aujourd'hui.",
    "{p} repart bredouille après un match où il n'a jamais trouvé son rythme face à {o}.",
  ],
  // Lost in tight match
  loss_tight: [
    "{p} sort la tête haute malgré la défaite. Le match a tenu en haleine jusqu'au bout.",
    "Cruelle défaite pour {p}, qui aura tout donné face à {o}. À quelques points près, le résultat aurait pu être inverse.",
    "{p} s'incline d'une courte tête face à {o}. Match d'une intensité remarquable.",
    "Défaite avec les honneurs pour {p}, qui a poussé {o} dans ses derniers retranchements.",
    "Petite déception : {p} aurait pu l'emporter dans ce match très accroché contre {o}.",
  ],
  // Lost after leading
  loss_collapse: [
    "Quelle déception pour {p}, qui menait avant de craquer dans la dernière ligne droite face à {o}.",
    "{p} s'effondre alors qu'il était en bonne posture. {o} a su saisir sa chance.",
    "{o} remonte le score et signe une victoire renversante face à {p}, qui aura des regrets.",
    "Match qui tourne mal pour {p} en fin de partie. La fatigue ou le mental ? À méditer.",
  ],
};

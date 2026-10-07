// Textes des commentateurs pendant le match.

// ─── COMMENTAIRES EN DIRECT ──────────────────────────────────────────────────
// Chaque clé correspond à un type d'événement (voir pickComment dans
// src/engine/commentary.js). Une entrée est soit une liste de phrases, soit
// un objet de listes rangées par « forme » du jeu, lue dans les points joués :
//   love    jeu blanc                 aces    au moins deux aces du serveur
//   bp      balle(s) de break sauvée(s) ou ratée(s) ({bp} : « deux balles de break »)
//   first   break converti sur la première balle de break
//   many    break converti après plusieurs balles ({bpn} : « troisième »)
//   long    jeu à rallonge, plusieurs égalités ({deuces}, {pts} points)
//   clean   sans balle de break ni égalité (mais pas blanc)
//   ace / winner / error / rally : comment s'est joué le dernier point
//   any     toujours vrai, quelle que soit la forme du jeu
// Une phrase n'est rangée sous une forme que si elle est vraie pour tout jeu
// de cette forme. Variables : {p} joueur, {o} adversaire (« H. Dupont »),
// {kmh} vitesse d'un ace, {aces}, {bp}, {bpn}, {deuces}, {pts}, {enjeu}.
// Pas de « il » ni d'accord sur les joueurs : les textes valent aussi pour le
// circuit féminin (voir src/engine/feminize.js).

// Le joueur tient son service.
const HOLD = {
  love: [
    "Jeu blanc de {p} au service",
    "{p} tient son service sans lâcher le moindre point",
    "Quatre points, quatre gagnés : jeu blanc pour {p}",
    "Rien à signaler sur la mise en jeu de {p}, jeu blanc",
    "{p} expédie son jeu de service, blanc",
    "Jeu de service express pour {p}, {o} n'a rien pu faire",
    "Pas un point pour {o} sur ce jeu : {p} déroule",
  ],
  aces: [
    "{p} s'appuie sur sa première balle : {aces} dans ce jeu",
    "{aces} dans le jeu, et {p} tient son service sans forcer",
    "Le service de {p} fait mal : {aces} et le jeu",
    "{p} fait parler la poudre au service, {aces} pour tenir",
  ],
  ace: [
    "{p} conclut par un ace à {kmh} km/h",
    "Un ace pour finir, {p} tient son engagement",
    "Ace extérieur de {p}, et le jeu est dans la poche",
    "{p} boucle son jeu de service sur un ace au T",
    "Le radar affiche {kmh} km/h : ace, jeu {p}",
  ],
  winner: [
    "{p} termine le jeu d'un coup droit gagnant",
    "Service, coup droit : la recette fonctionne, jeu {p}",
    "{p} conclut d'une volée bien placée et garde son service",
    "Un revers long de ligne pour conclure, {p} tient bon",
    "{p} tient son engagement sur une accélération de coup droit",
  ],
  error: [
    "{o} commet la faute sur le dernier point, jeu {p}",
    "Retour dans le filet de {o}, {p} conserve son service",
    "{p} tient son service, aidé par une faute de {o}",
    "La balle de {o} sort de peu : jeu {p}",
  ],
  rally: [
    "{p} conclut un échange interminable et tient son service",
    "Long rallye pour finir, et c'est {p} qui a le dernier mot",
    "Après un bras de fer de fond de court, {p} garde sa mise en jeu",
  ],
  bp: [
    "{p} sauve {bp} et finit par tenir son service",
    "Chaud pour {p}, qui écarte {bp} avant de conclure",
    "{p} se sort du piège en effaçant {bp}",
    "Sueurs froides pour {p} : {bp} à défendre, et le service tient",
    "{o} a eu sa chance, {bp}, mais {p} n'a rien lâché",
    "Gros jeu de service de {p}, qui efface {bp}",
    "{p} serre le jeu au bon moment et repousse {bp}",
  ],
  long: [
    "Jeu accroché, {deuces}, mais {p} finit par conclure",
    "{p} a dû batailler, {pts} points disputés, pour tenir son service",
    "Le jeu s'éternise, mais {p} garde sa mise en jeu",
    "Il a fallu s'employer : {pts} points pour que {p} tienne son service",
  ],
  clean: [
    "{p} tient son service sans trembler",
    "Jeu de service maîtrisé par {p}",
    "{p} tient son engagement avec autorité",
    "Pas d'alerte sur le service de {p}",
    "{p} déroule sur sa mise en jeu",
    "Tranquille au service, {p} empoche le jeu",
  ],
  any: [
    "{p} tient son service",
    "Jeu {p}, sur sa mise en jeu",
    "Service tenu pour {p}",
    "{p} fait le travail sur sa mise en jeu",
    "{p} garde son engagement",
  ],
};

// L'adversaire tient son service.
const OPP_HOLD = {
  love: [
    "Jeu blanc de {o}, {p} n'a rien vu passer",
    "{o} tient son service sans perdre un point",
    "Pas un point pour {p} en retour : jeu blanc de {o}",
    "{o} expédie son jeu de service, blanc",
    "Service impeccable de {o}, qui ne laisse rien à {p}",
  ],
  aces: [
    "{aces} pour {o} dans ce jeu, {p} n'a pas pu toucher la balle",
    "{o} s'appuie sur son service : {aces}, et le jeu",
    "La mise en jeu de {o} fait des dégâts, {aces} dans le jeu",
  ],
  ace: [
    "Ace à {kmh} km/h pour {o}, qui garde son service",
    "{o} conclut par un ace, rien à faire pour {p}",
    "Un ace au T pour finir : jeu {o}",
    "{o} referme le jeu sur un ace extérieur",
  ],
  winner: [
    "{o} conclut d'un coup droit gagnant et tient son service",
    "Service, coup droit pour {o}, et le jeu",
    "{o} monte à la volée pour conclure, jeu",
    "{o} déborde {p} sur le dernier point et tient son engagement",
  ],
  error: [
    "Retour de {p} dans le filet, jeu {o}",
    "{p} rate son retour sur le dernier point : jeu {o}",
    "Faute de {p} pour conclure, {o} garde son service",
    "La balle de {p} sort, {o} empoche le jeu",
  ],
  rally: [
    "Long échange pour finir, et {o} garde son service",
    "{o} gagne le bras de fer de fond de court et tient son engagement",
    "{p} a tout essayé dans ce long rallye, mais le jeu est pour {o}",
  ],
  bp: [
    "{p} laisse passer {bp}, {o} tient son service",
    "Occasion manquée pour {p} : {bp}, et {o} s'en sort",
    "{o} écarte {bp} et garde sa mise en jeu",
    "{p} a eu {bp}, sans parvenir à conclure",
    "{o} se sort du piège en effaçant {bp}",
    "Gros regret pour {p} : {bp} sans réussite, et {o} s'en sort",
  ],
  long: [
    "Jeu interminable, {deuces}, et {o} finit par le remporter",
    "{p} a poussé, {pts} points disputés, mais {o} tient bon",
    "{o} a dû batailler pour garder son service",
  ],
  clean: [
    "{o} tient son service sans trembler",
    "Solide au service, {o} empoche le jeu",
    "{o} sert juste, {p} ne peut pas grand-chose",
    "Pas d'ouverture pour {p} sur le service de {o}",
    "{o} déroule sur sa mise en jeu",
  ],
  any: [
    "{o} tient son service",
    "Jeu {o}, sur sa mise en jeu",
    "Service tenu pour {o}",
    "{o} garde son engagement",
    "{o} fait le travail au service",
  ],
};

// Le joueur breake l'adversaire.
const BREAK = {
  love: [
    "Break blanc ! {p} ne laisse pas un point à {o} sur ce jeu",
    "{o} n'a pas marqué un point sur sa mise en jeu : break blanc de {p}",
    "Jeu blanc en retour pour {p}, qui prend le service de {o}",
  ],
  first: [
    "Première balle de break, et {p} la convertit !",
    "{p} ne tremble pas sur sa première occasion : break !",
    "Une seule balle de break, et {p} ne la laisse pas filer",
    "Réalisme total de {p}, break dès la première occasion",
  ],
  many: [
    "Il aura fallu une {bpn} balle de break, mais {p} a fini par passer !",
    "{p} convertit enfin, à la {bpn} occasion : break !",
    "La patience paie : break de {p} sur sa {bpn} balle de break",
    "{o} a résisté longtemps, mais {p} breake à la {bpn} tentative",
  ],
  winner: [
    "Retour gagnant de {p} ! Le service de {o} tombe",
    "Passing de {p} le long de la ligne : break !",
    "{p} trouve l'ouverture en coup droit croisé, break !",
    "Lob parfait de {p} sur la balle de break : le service de {o} tombe",
    "{p} prend la balle tôt et frappe gagnant : break !",
  ],
  error: [
    "{o} commet la faute sur la balle de break : {p} passe devant",
    "La balle de {o} file dans le filet, break pour {p}",
    "{o} craque sur la balle de break, {p} en profite",
    "Faute de {o} au pire moment : break {p}",
  ],
  rally: [
    "Échange à rallonge sur la balle de break, et c'est {o} qui craque le premier : break {p} !",
    "{p} gagne le bras de fer de fond de court et prend le service de {o}",
  ],
  long: [
    "Après {pts} points de lutte, {p} arrache le break !",
    "Jeu marathon, {deuces}, et c'est {p} qui le remporte : break !",
    "{p} a fait le siège du service de {o}, et ça finit par céder",
  ],
  any: [
    "BREAK ! {p} prend le service de {o}",
    "{p} s'empare de la mise en jeu de {o}",
    "Le service de {o} tombe, break {p}",
    "{p} fait le break !",
    "Break pour {p}, qui met la pression sur {o}",
  ],
};

// L'adversaire breake le joueur.
const LOSE_SERVE = {
  love: [
    "Jeu blanc… sur le service de {p}. {o} breake sans perdre un point",
    "{p} ne marque pas un point sur sa mise en jeu : break blanc de {o}",
    "Trou d'air pour {p}, breaké sans marquer un point",
  ],
  first: [
    "{o} convertit sa première balle de break, {p} perd son service",
    "Une seule occasion pour {o}, et c'est le break",
    "{o} ne laisse pas passer sa chance : break dès la première balle",
  ],
  many: [
    "{p} a longtemps résisté, mais {o} convertit à la {bpn} balle de break",
    "{o} finit par passer, à la {bpn} occasion : {p} perd son service",
    "{p} a sauvé ce qui pouvait l'être, mais {o} breake à la {bpn} tentative",
  ],
  winner: [
    "Retour gagnant de {o}, {p} cède son service",
    "Passing imparable de {o} : {p} est breaké",
    "{o} trouve la ligne sur la balle de break, le service de {p} tombe",
    "{o} déborde {p} en coup droit et prend le service",
  ],
  error: [
    "Faute de {p} sur la balle de break : {o} prend le service",
    "{p} envoie la balle dans le filet, et c'est le break pour {o}",
    "La balle de {p} sort de peu, break {o}",
    "{p} se crispe sur la balle de break, et {o} en profite",
  ],
  rally: [
    "Long échange sur la balle de break, {p} finit par céder",
    "{o} gagne le bras de fer de fond de court et breake {p}",
  ],
  long: [
    "Jeu interminable, {deuces}, et {p} finit par céder son service",
    "{p} a lutté, {pts} points disputés, mais {o} arrache le break",
  ],
  any: [
    "{p} perd son service",
    "Break pour {o}",
    "Le service de {p} tombe",
    "{o} prend la mise en jeu de {p}",
    "Coup dur : {p} cède son service",
  ],
};

export const COMMENTARY = {
  // ── Premier jeu du match : ton d'ouverture ─────────────────────────────
  first_hold: [
    "C'est parti ! {p} ouvre le match en tenant son service",
    "Entrée en matière réussie pour {p}, premier jeu dans la poche",
    "{p} lance la rencontre sur un jeu de service maîtrisé",
    "Premier jeu pour {p}, tout de suite dans le rythme",
    "{p} débute au service et ouvre la marque, 1-0",
    "Le match est lancé : {p} tient sa première mise en jeu",
  ],
  first_break: [
    "Coup de tonnerre d'entrée : {p} breake {o} dès le premier jeu !",
    "Départ canon ! {p} prend d'emblée le service de {o}",
    "{o} manque son entame, {p} en profite et breake d'entrée",
    "Le match commence fort : break immédiat de {p} !",
    "{p} entre dans le match par la grande porte, break au premier jeu",
  ],
  first_lose_serve: [
    "Entame ratée pour {p}, breaké dès le premier jeu",
    "Départ compliqué : {o} prend d'entrée le service de {p}",
    "{p} n'est pas encore dans son match, {o} breake d'emblée",
    "Le premier jeu échappe à {p}, qui perd son service d'entrée",
    "Mauvaise entame : {o} frappe d'entrée sur le service de {p}",
  ],
  first_opp_hold: [
    "Le match est lancé, {o} tient son premier service",
    "{o} ouvre la marque sur sa mise en jeu",
    "Premier jeu pour {o}, sans trembler au service",
    "Entame solide de {o}, qui débute par un jeu de service tenu",
    "{o} fait le premier pas, 1-0 au service",
    "{p} prend la température en retour, {o} tient son premier service",
  ],
  hold_easy: HOLD,
  hold_tough: HOLD,
  opp_hold: OPP_HOLD,
  break_clean: BREAK,
  break_grind: BREAK,
  lose_serve: LOSE_SERVE,

  // ── Situations de score (prioritaires sur la forme du jeu) ─────────────
  // Le joueur confirme le break qu'il vient de faire.
  sit_hold_confirm: [
    "{p} confirme le break",
    "Break confirmé par {p}, qui garde son avance",
    "{p} consolide son break sur sa mise en jeu",
    "Pas de débreak : {p} confirme dans la foulée",
    "{p} enchaîne et confirme son break",
  ],
  sit_opp_confirm: [
    "{o} confirme le break",
    "Break confirmé par {o}, {p} reste sous pression",
    "{o} consolide son avance au service",
    "Pas de réaction immédiate de {p} : {o} confirme le break",
  ],
  // Le joueur sert pour rester dans le set (ou le match) et tient.
  sit_hold_stay: [
    "{p} tient son service pour rester dans {enjeu}",
    "Sous pression, {p} tient bon : {enjeu} n'est pas encore joué",
    "{p} sert pour rester dans {enjeu}… et y parvient",
    "Pas question de lâcher maintenant : {p} tient son service",
    "{p} refuse de céder {enjeu}, jeu de service tenu",
  ],
  sit_opp_hold_stay: [
    "{o} tient son service et reste dans {enjeu}",
    "{o} ne lâche pas : service tenu pour rester dans {enjeu}",
    "{o} sauve sa mise en jeu, {enjeu} attendra",
    "{o} repousse l'échéance et garde son service",
  ],
  // Le joueur breake alors que l'adversaire servait pour le set/match.
  sit_break_serving_for: [
    "{o} servait pour {enjeu}, et {p} lui reprend son service !",
    "Coup de théâtre : {o} servait pour {enjeu} et se fait breaker !",
    "{p} breake au meilleur moment, {o} ne conclura pas {enjeu} tout de suite",
    "Rien n'est fait ! {p} prend le service de {o}, qui servait pour {enjeu}",
  ],
  // Le joueur servait pour le set/match et se fait breaker.
  sit_lose_serving_for: [
    "{p} servait pour {enjeu}, mais {o} débreake au pire moment",
    "Pas de conclusion pour {p}, qui perd son service en servant pour {enjeu}",
    "{p} se crispe en servant pour {enjeu}, {o} revient",
    "Tout est à refaire : {p} servait pour {enjeu} et se fait breaker",
  ],

  // ── Break, débreak, double break ───────────────────────────────────────
  // Player rebreaks (recovers a break)
  rebreak: [
    "DÉBREAK ! {p} recolle au score !",
    "{p} efface le break de {o} immédiatement !",
    "Quelle réaction de {p}, qui débreake aussitôt !",
    "{p} reprend le service de {o}, débreak !",
    "Le débreak de {p} ! On repart de zéro dans ce set",
    "{p} ne reste pas longtemps mené, débreak !",
    "Réponse immédiate de {p} : le break est effacé",
    "{o} n'a pas su confirmer, {p} débreake",
  ],
  // Opponent rebreaks (player had just broken, now loses serve)
  opp_rebreak: [
    "{o} débreake, frustrant pour {p}",
    "{p} cède son service dans la foulée, débreak de {o}",
    "{o} efface le break de {p}, retour à égalité dans le set",
    "Le débreak de {o} ! {p} n'a pas su confirmer",
    "{o} récupère le break perdu, sale moment pour {p}",
    "L'avance de {p} s'envole : {o} débreake",
    "Tout est à refaire pour {p}, {o} reprend le break",
  ],
  // Player takes a double break
  double_break: [
    "DOUBLE BREAK ! {p} prend le large dans ce set !",
    "{p} breake une deuxième fois, {o} est au bord du gouffre !",
    "Deux breaks d'avance pour {p}, le set prend une sale tournure pour {o}",
    "{p} enfonce le clou : double break !",
    "Encore un break ! {p} mène désormais de deux breaks",
    "{o} ne trouve pas la solution, {p} breake de nouveau",
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
    "Deuxième break de {o}, le set file entre les doigts de {p}",
    "{p} perd de nouveau son service, la manche s'éloigne",
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

  // ── Tie-break (le set se conclut : commentaire de set à la place) ──────
  tb_won: [
    "Jeu décisif gagné {tbScore} ! {p} fait basculer le set",
    "Quel tie-break ! {p} l'emporte {tbScore}",
    "{p} gagne le tie-break {tbScore}, set en poche",
  ],
  tb_lost: [
    "Tie-break perdu {tbScore}, set pour {o}",
    "{p} cède le tie-break {tbScore}",
    "{o} remporte le tie-break {tbScore}",
  ],

  // ── Sets ───────────────────────────────────────────────────────────────
  // {score} : score du set côté vainqueur, {sets} : sets côté vainqueur,
  // {how} : comment le set s'est conclu (voir setCloseHow).
  // 6-0 sets ("bagel"), a bit cheeky
  bagel_won_set: [
    "6-0 ! {p} sert une bulle à {o}, et sans sucre",
    "Roue de vélo pour {p} ! {o} n'a pas vu le jour dans ce set",
    "6-0 pour {p}. {o} est prié de rendre sa raquette à l'accueil",
    "Set blanc pour {p} ! {o} a juste fait acte de présence",
    "Six jeux à rien : {p} n'a laissé que des miettes, et encore",
  ],
  bagel_won_match: [
    "6-0 et MATCH ! {p} finit avec une bulle, {o} rentre au vestiaire sans un jeu",
    "{p} conclut par une roue de vélo : 6-0 et match. Pas de quartier",
    "Match plié sur un 6-0 : {p} a oublié de laisser des miettes à {o}",
  ],
  bagel_lost_set: [
    "6-0 pour {o}. {p} aurait peut-être dû rester au lit ce matin",
    "Bulle encaissée : {p} n'a pas marqué un jeu dans ce set",
    "Roue de vélo pour {o}. {p} cherche encore le chemin du tableau d'affichage",
    "6-0. {p} vient de découvrir ce que ressent un mur d'entraînement",
    "Set blanc pour {o}, {p} n'a jamais trouvé la clé",
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
    "La première manche est pour {p}, {score}, {how}",
    "{p} frappe le premier : {score}, set conclu {how}",
  ],
  set_won_lead: [
    "{p} s'adjuge le set {score} {how} et mène {sets}",
    "Set {score} pour {p}, conclu {how}. {sets} au compteur",
    "{p} prend l'avantage {sets} : set {score}, conclu {how}",
    "{p} passe devant, {sets}, après un set {score} conclu {how}",
  ],
  set_won_equalize: [
    "{p} égalise à {sets} : set {score}, conclu {how}",
    "{p} s'offre le set {score} {how} : {sets}, tout est relancé",
    "Réaction de {p}, qui recolle à {sets}, set {score} conclu {how}",
    "Tout est à refaire pour {o} : {p} prend le set {score} {how}, {sets}",
  ],
  set_won_reduce: [
    "{p} réduit l'écart à {sets} : set {score}, conclu {how}",
    "{p} s'accroche : set {score} conclu {how}, {sets}",
    "{p} est toujours en vie ! Set {score} {how}, {sets}",
  ],
  set_won_match: [
    "{p} conclut {how} : set {score} et match !",
    "Balle de match convertie {how}, {p} s'impose ({score} dans le dernier set) !",
    "{p} termine le travail {how} et remporte le match, {score} dans l'ultime manche",
    "JEU, SET ET MATCH {p} ! Dernier set {score}, conclu {how}",
  ],
  set_lost_first: [
    "{o} remporte le premier set {score}, conclu {how}",
    "Premier set pour {o} ({score}), bouclé {how}",
    "{p} cède la première manche {score}, {o} conclut {how}",
    "La première manche file à {o}, {score}, {how}",
  ],
  set_lost_lead: [
    "{o} s'adjuge le set {score} {how} et mène {sets}",
    "Set {score} pour {o}, conclu {how}. {p} est mené {sets}",
    "{o} prend l'avantage {sets} : set {score}, conclu {how}",
    "{o} passe devant, {sets} : set {score} conclu {how}",
  ],
  set_lost_equalize: [
    "{o} égalise à {sets} : set {score}, conclu {how}",
    "{o} recolle à {sets}, set {score} conclu {how}",
    "Tout est à refaire : {o} prend le set {score} {how}, {sets}",
    "{p} laisse filer le set {score}, {o} revient à {sets}",
  ],
  set_lost_reduce: [
    "{o} réduit l'écart à {sets} : set {score}, conclu {how}",
    "{o} s'accroche : set {score} conclu {how}, {sets}",
    "{o} refuse de rendre les armes, set {score} {how} : {sets}",
  ],
  set_lost_match: [
    "{o} conclut {how} : set {score} et match",
    "Balle de match convertie {how} par {o}, {p} s'incline ({score} dans le dernier set)",
    "C'est terminé : {o} remporte le dernier set {score} {how}",
    "Jeu, set et match {o}. Dernière manche {score}, conclue {how}",
  ],

  // ── Moments de match (tirés au hasard entre deux jeux) ─────────────────
  crowd_cheer: [
    "Le public se lève pour {p} !",
    "Ambiance de feu dans les tribunes",
    "Le court scande le nom de {p}",
    "Applaudissements nourris après cet échange",
    "Une ola traverse les tribunes, le public est dans le match",
    "Le clan de {p} se fait entendre en tribune",
    "Quelques sifflets pour {o}, vite recouverts par les applaudissements",
  ],
  challenge: [
    "{p} demande un challenge… balle bonne !",
    "Challenge raté pour {o}, la balle touchait la ligne",
    "{o} conteste l'annonce : la vidéo lui donne tort",
    "Challenge de {p}, et l'arbitre de chaise doit corriger son annonce",
    "Balle annoncée faute, {p} conteste… et la vidéo confirme : faute",
    "La balle mord la ligne d'un millimètre, le challenge de {o} est perdu",
  ],
  ambiance: [
    "L'arbitre de chaise réclame le silence, s'il vous plaît",
    "Un peu de vent se lève, les lancers de balle deviennent délicats",
    "Le soleil tape fort, les deux joueurs filent à l'ombre au changement de côté",
    "Petite interruption : un spectateur a fait tomber son parasol",
    "Les ramasseurs de balles s'activent, on reprend",
    "Un avion passe bas au-dessus du court, {o} attend avant de servir",
    "Changement de balles, les nouvelles fusent davantage",
  ],
  bench: [
    "Dans sa loge, le staff de {p} se lève pour encourager",
    "{o} jette un œil vers son entraîneur, en quête de solutions",
    "{p} se parle à voix basse, concentration maximale",
    "Dans le clan de {o}, on retient son souffle",
    "{p} prend le temps de s'éponger, la tension monte",
    "{o} change de raquette au changement de côté",
  ],
  injury_minor: ["Petite gêne au mollet pour {p}", "{p} se masse l'épaule entre deux jeux"],
  rain_delay: ["Quelques gouttes mais le match continue"],
};

// ─── FORME DU JOUR ───────────────────────────────────────────────────────────
// Remarques glissées après quelques jeux quand la forme du jour est marquée.
export const FORM_REMARKS = {
  p_good: [
    "{p} semble en jambes aujourd'hui.",
    "Tout paraît facile pour {p} en ce début de match.",
    "{p} a visiblement de bonnes sensations.",
    "La balle sort très bien de la raquette de {p}.",
    "Quel relâchement chez {p}, ça frappe juste et fort.",
    "{p} a l'air d'avoir trouvé ses marques très vite.",
  ],
  p_bad: [
    "{p} a l'air emprunté aujourd'hui.",
    "Quelque chose cloche dans le jeu de {p}.",
    "{p} peine à trouver ses repères.",
    "Le timing n'y est pas pour {p}, beaucoup de balles mal centrées.",
    "{p} secoue la tête après cette faute, les sensations ne sont pas là.",
    "Jambes lourdes pour {p} en ce début de match.",
  ],
  o_good: [
    "{o} semble dans un grand jour.",
    "{o} frappe la balle remarquablement bien.",
    "Journée faste pour {o}.",
    "{o} a l'air de voir la balle en grand aujourd'hui.",
    "Tout rentre pour {o}, c'est impressionnant.",
  ],
  o_bad: [
    "{o} n'a pas l'air dans son assiette.",
    "{o} multiplie les signes de nervosité.",
    "{o} semble à court de sensations.",
    "{o} regarde souvent sa raquette, signe que rien ne va.",
    "Beaucoup de déchet dans le jeu de {o} pour l'instant.",
  ],
};

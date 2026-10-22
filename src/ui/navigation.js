// Navigation (onglets) et pages d'aide.

// ─── NAVIGATION ───────────────────────────────────────────────────────────
// 5 entrées dans le dock ; chaque entrée regroupe 1 ou 2 écrans, accessibles
// par des sous-onglets en haut de page. Les identifiants d'écran ne changent
// pas (le tutoriel et l'aide s'appuient dessus).
export const NAV_GROUPS = [
  { id: "home",    label: "Accueil",  icon: "home",   screens: [{ id: "hub", label: "Accueil", icon: "home" }] },
  { id: "circuit", label: "Circuit",  icon: "court",  screens: [{ id: "calendar", label: "Tournois", icon: "calendar" }, { id: "travel", label: "Voyages", icon: "plane" }] },
  { id: "player",  label: "Joueur",   icon: "racquet", screens: [{ id: "prep", label: "Préparation", icon: "dumbbell" }, { id: "life", label: "Vie", icon: "heart" }] },
  { id: "career",  label: "Carrière", icon: "chart",  screens: [{ id: "stats", label: "Stats", icon: "chart" }, { id: "atp", label: "Classement", icon: "trophy" }] },
  { id: "office",  label: "Bureau",   icon: "office", screens: [{ id: "finance", label: "Finances", icon: "money" }, { id: "social", label: "Social", icon: "chat" }, { id: "shop", label: "Boutique", icon: "bag" }] },
];
export function navGroupOf(screenId) {
  return NAV_GROUPS.find(g => g.screens.some(sc => sc.id === screenId)) || NAV_GROUPS[0];
}
export function screenPathLabel(screenId) {
  const g = navGroupOf(screenId);
  const sc = g.screens.find(x => x.id === screenId);
  return g.screens.length > 1 ? g.label + " › " + (sc ? sc.label : screenId) : g.label;
}

// Fiches d'aide : une par onglet (ouverte seule à la première visite, puis
// via le bouton « i »), plus le premier match et la première wildcard.
// Courtes, orientées « quoi faire », vocabulaire expliqué.
export const PAGE_HELP = {
  hub: { title: "Bienvenue", items: [
    ["Votre objectif", "Partir de zéro et grimper jusqu'à la première place mondiale. Plus vous gagnez de matchs dans de gros tournois, plus vous gagnez de points au classement."],
    ["Chaque semaine", "1. Inscrivez-vous à un tournoi (onglet Circuit). 2. Voyagez jusqu'à sa ville. 3. Entraînez-vous (onglet Joueur). 4. Touchez « Semaine suivante » : le temps avance et votre tournoi se joue."],
    ["Argent et énergie", "Toujours affichés en haut. L'énergie remonte de 25 chaque semaine ; à plat, vous jouez moins bien. Si votre argent passe sous zéro, c'est la faillite et la carrière s'arrête."],
  ] },
  calendar: { title: "Tournois", items: [
    ["S'inscrire", "La liste montre les tournois des semaines à venir. Touchez le nom d'un tournoi pour voir ses conditions d'accès, son format et sa ville."],
    ["Entrer dans le tableau", "Votre classement décide : « Tableau principal » = vous entrez directement ; « Qualifications » = il faut d'abord gagner quelques matchs pour y accéder ; sinon votre rang est insuffisant (le seuil est indiqué)."],
    ["Les catégories", "Du plus petit au plus grand : Circuit Open, Circuit Pro, Tour 250, Tour 500, Grand 1000, puis les 4 Majeurs. Plus c'est grand, plus il y a de points, d'argent… et d'adversaires forts."],
    ["Bon à savoir", "Un tournoi à la fois. Il faut être dans sa ville au moment où il commence. Les qualifications rapportent peu : les vrais points se gagnent dans le tableau principal. ★ = votre surface préférée."],
  ] },
  travel: { title: "Voyages", items: [
    ["Rejoindre son tournoi", "La ville de votre prochain tournoi est indiquée en haut : touchez « Y aller ». Chaque billet demande une confirmation."],
    ["Coût d'un voyage", "Le prix et la fatigue augmentent avec la distance. Enchaîner des tournois proches les uns des autres économise de l'argent et de l'énergie."],
  ] },
  prep: { title: "Préparation", items: [
    ["S'entraîner", "Chaque séance améliore une stat contre de l'argent et de l'énergie. Plus une stat est haute, plus elle progresse lentement : les gains se comptent en dixièmes."],
    ["Le staff", "Coach, kiné, préparateurs, agent… Chacun donne un bonus contre un salaire chaque semaine. Vérifiez que vos revenus suivent avant d'embaucher."],
  ] },
  life: { title: "Vie", items: [
    ["Trois jauges", "Bonheur : aide vos progrès et votre mental. Popularité : soutien du public et invitations (wildcards). Image : attire les sponsors."],
    ["Activités", "Deux par semaine au maximum, chacune avec un délai avant de la refaire. Les effets affichés sont ceux que vous obtiendrez réellement."],
    ["Plafond de notoriété", "Tant que vous êtes peu classé, popularité et image ne peuvent pas monter très haut : grimpez au classement pour relever ce plafond."],
    ["Événements", "Des imprévus arrivent parfois en fin de semaine. Chaque choix indique son effet sur l'argent, l'énergie et vos jauges."],
  ] },
  stats: { title: "Statistiques", items: [
    ["Vos stats", "Service, coup droit, revers, endurance, mental et filet font votre niveau en match. La cote est leur moyenne."],
    ["Graphiques et historique", "Touchez le nom d'une courbe pour en avoir la définition. Plus bas, vos derniers tournois match par match."],
  ] },
  atp: { title: "Classement", items: [
    ["Classement mondial", "Les joueurs sont classés selon les points gagnés sur les 52 dernières semaines. Sans aucun point, vous êtes « NC » (non classé)."],
    ["Race", "Second onglet : seuls les points de l'année comptent. Les 8 premiers en fin de saison jouent le Masters de fin d'année."],
    ["Profils", "Touchez un joueur pour voir son profil, son style de jeu et ses derniers résultats."],
  ] },
  finance: { title: "Finances", items: [
    ["Revenus et dépenses", "D'un côté : gains en tournoi, sponsors et primes. De l'autre : staff, voyages, entraînements et frais fixes. Sous zéro, c'est la faillite."],
    ["Sponsors", "Un équipementier et jusqu'à deux partenaires. Les offres arrivent aux semaines 26 et 52, parfois en cours de saison : négociez, puis signez."],
    ["Objectifs", "Chaque contrat fixe un objectif (classement, titres, victoires…) à atteindre avant la fin : prime si réussi, pénalité sinon. Facile, moyen ou ambitieux : plus c'est exigeant, mieux c'est payé."],
  ] },
  shop: { title: "Boutique", items: [
    ["Gratuit", "Le jeu complet est gratuit, sans publicité. Aucun achat ne donne d'avantage en match."],
    ["Extensions", "Défis scénarisés, Personnalisation et Carrières multiples se paient une seule fois et restent acquis, même si vous recommencez une carrière."],
  ] },
  social: { title: "Social", items: [
    ["Pour vous", "Messages des fans et de la presse. Vos réponses font bouger votre bonheur, votre popularité et votre image."],
    ["Monde", "L'actualité du circuit : résultats, rumeurs, annonces (5 dernières semaines)."],
  ] },
  match: { title: "Votre premier match", items: [
    ["Le match se joue tout seul", "Les points défilent avec les commentaires. Le bouton ▶ / ❚❚ lance le match ou le met en pause."],
    ["Énergie et élan", "Énergie : votre réserve physique, elle baisse au fil du match ; fatigué, vous jouez moins bien. Élan : la dynamique du moment, la barre penche vers celui qui enchaîne les points."],
    ["Tactique", "Le bouton Tactique met en pause et ouvre votre plan de jeu : attitude, service, échanges, filet, cible. ★ = conseil de votre coach."],
    ["Points décisifs", "Sur une balle de jeu, vous jouez parfois le point vous-même : duel au service ou au retour (Au T = au centre, Corps = sur le joueur, Extérieur = vers la ligne de côté), smash ou sang-froid au tie-break."],
  ] },
  wildcard: { title: "Une wildcard !", items: [
    ["C'est quoi ?", "Une invitation des organisateurs : vous entrez directement dans le tableau principal du tournoi, même si votre classement ne suffit pas."],
    ["Pourquoi vous ?", "Votre popularité et vos bons résultats attirent les invitations. Plus vous êtes connu, plus il y en a."],
    ["Que faire ?", "Acceptez-la sur l'accueil, puis voyagez jusqu'à la ville du tournoi. Déjà inscrit ailleurs ? Annulez d'abord cette inscription. Vous pouvez aussi la refuser."],
  ] },
};

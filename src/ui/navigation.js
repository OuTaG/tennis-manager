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

// Help content shown by the "?" button, one entry per tab.
export const PAGE_HELP = {
  hub: { title: "Accueil", items: [
    ["Bienvenue", "Vous démarrez sans classement, avec l'argent de départ de votre ville. Objectif : grimper jusqu'au sommet du classement mondial. Cette fiche reste disponible à tout moment via le bouton « i » en haut à droite."],
    ["Vos ressources", "L'argent et l'énergie sont toujours affichés en haut. Le bonheur, la popularité et l'image se gèrent dans Joueur › Vie : ils dérivent doucement et influencent l'entraînement, le soutien du public et les sponsors."],
    ["Semaine suivante", "Fait avancer le temps d'une semaine : énergie récupérée, salaires et sponsors réglés, circuit simulé. Si vous êtes inscrit à un tournoi cette semaine-là, il se lance."],
    ["Récupération", "Chaque semaine rend 25 d'énergie (plus le bonus du kiné ou du nutritionniste). En match, chaque pause entre deux sets rend 3 à 5. Entre deux matchs d'un tournoi, vous récupérez 10 à 20 selon votre endurance."],
    ["Votre tournoi", "L'encart d'inscription rappelle le tournoi prévu. Vous pouvez l'annuler (frais remboursés)."],
    ["Objectifs sponsors", "Chaque contrat fixe un objectif à tenir avant sa fin : prime si réussi, pénalité sinon."],
    ["Événements", "Des imprévus surviennent parfois : chaque choix a ses conséquences sur l'argent, l'énergie, le bonheur, la popularité ou l'image."],
  ] },
  calendar: { title: "Tournois", items: [
    ["S'inscrire", "Choisissez un tournoi de la semaine en cours ou à venir. Votre classement décide si vous entrez directement, par les qualifications, ou pas du tout."],
    ["Être sur place", "Il faut être dans la ville du tournoi au moment où il commence : pensez à voyager avant."],
    ["Catégories", "Du Circuit Open au Majeur : plus la catégorie est haute, plus les points, les gains et le niveau des adversaires sont élevés."],
    ["Un tournoi à la fois", "Une seule inscription possible, un seul tournoi par semaine."],
  ] },
  travel: { title: "Voyages", items: [
    ["Se déplacer", "Chaque trajet coûte de l'argent et un peu d'énergie, selon la distance."],
    ["Planifier", "Enchaîner des tournois proches les uns des autres limite la fatigue et les frais."],
  ] },
  prep: { title: "Préparation", items: [
    ["Entraînement", "Chaque séance améliore une statistique contre de l'argent et de l'énergie. Plus une stat est haute, plus elle progresse lentement."],
    ["Âge et moral", "Les progrès ralentissent avec l'âge et quand le bonheur est bas."],
    ["Staff", "Coachs, préparateurs, kinés, agents : chacun apporte des bonus (et parfois des contraintes) contre un salaire hebdomadaire."],
  ] },
  life: { title: "Vie", items: [
    ["Activités", "Deux activités par semaine au maximum, chacune avec un délai avant de pouvoir la refaire."],
    ["Bonheur", "Influence vos progrès à l'entraînement et votre mental en match."],
    ["Popularité et image", "La popularité attire les wildcards et le soutien du public, l'image attire les sponsors."],
  ] },
  stats: { title: "Statistiques", items: [
    ["Vos stats", "Service, coup droit, revers, endurance, mental et filet déterminent votre force en match."],
    ["Graphiques", "Touchez le nom d'une courbe pour en avoir la définition."],
    ["Score de légende", "Un score global de carrière : meilleur classement, semaines en tête, titres (un Majeur vaut bien plus qu'un Tour 250), victoires, séries, objectifs sponsors. Son détail s'affiche à chaque fin de saison."],
    ["Historique", "Vos derniers tournois, match par match, avec les gains et les points obtenus."],
  ] },
  atp: { title: "Top 100", items: [
    ["Classement mondial", "Les meilleurs joueurs du circuit, classés par points ATP sur 52 semaines."],
    ["Race", "Second onglet : seuls les points gagnés depuis le 1er janvier comptent. Les 8 premiers en fin de saison disputent le Masters de fin d'année."],
    ["Profils", "Touchez un joueur pour voir son profil, son style et ses résultats récents."],
  ] },
  finance: { title: "Finances", items: [
    ["Revenus et dépenses", "Gains en tournoi, sponsors et primes d'un côté ; staff, voyages, entraînements et frais fixes de l'autre."],
    ["Catégories de sponsors", "Un seul équipementier (étiquette bleue) et jusqu'à deux partenaires en même temps. Certaines marques sont « à prendre ou à laisser »."],
    ["Sponsors", "Les offres arrivent aux semaines 26 et 52. Négociez le salaire ou la prime, choisissez le niveau d'objectif, puis signez."],
    ["Offres du moment", "En cours de saison, une marque peut aussi se manifester (plus souvent après de bons résultats). L'offre reste 4 semaines : signez-la telle quelle ou, si vos places sont prises, remplacez un contrat en payant sa résiliation."],
    ["Faillite", "Si votre argent passe sous zéro, votre carrière s'arrête."],
  ] },
  shop: { title: "Boutique", items: [
    ["Gratuit", "Le jeu est gratuit : circuits masculin et féminin, vitesse de match ×4. Aucun achat ne donne d'avantage en jeu."],
    ["En ligne", "Payé une seule fois. L'accès Classements ouvre les défis hebdomadaires et le classement mondial ; l'accès complet y ajoute les carrières coop. Le passage de l'un à l'autre coûte la différence."],
    ["Options", "Défis scénarisés, Personnalisation et Carrières multiples se paient une fois. Les achats sont liés à votre appareil : ils restent acquis si vous recommencez une carrière."],
    ["Personnalisation", "Modifiez le nom, la nationalité et le portrait de tous les joueurs depuis le menu principal, dans 3 configurations. Au lancement d'une carrière, choisissez la base Standard ou l'une d'elles."],
    ["Bientôt", "Les offres marquées « Bientôt » sont annoncées mais pas encore achetables."],
  ] },
  social: { title: "Social", items: [
    ["Pour vous", "Les messages des fans et de la presse qui vous concernent. Vos réponses influencent votre bonheur, votre popularité et votre image."],
    ["Monde", "L'actualité du circuit : résultats, rumeurs, annonces."],
    ["Historique", "Seules les 5 dernières semaines sont affichées."],
  ] },
};

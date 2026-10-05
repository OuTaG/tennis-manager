# Tennis Manager

Jeu de gestion de carrière de tennis (mobile), en React.

## Démarrer

```bash
npm install
npm run dev            # jeu dans le navigateur (http://localhost:5173)
npm test               # tests automatiques (équilibrage, moteur, défis)
npm run lint           # vérifie les imports manquants et les règles des hooks
npm run build          # version web de production (dossier dist/)
npm run build:single   # un seul fichier .jsx pour l'aperçu dans Claude
```

`npm run build:single` produit `dist/TM_Mobile_single.jsx` : tout le jeu en un
fichier, comme avant le découpage. Il est **généré** : on modifie toujours
`src/`, jamais ce fichier.

## Organisation du code

```
src/
  main.jsx            point d'entrée web
  App.jsx             composant principal : état de la partie, semaine,
                      tournois, matchs, sauvegarde
  data/               données pures (aucune logique)
    tournaments.js    calendriers ATP et WTA
    formats.js        formats de tableau, barèmes de points et de primes
    names.js          top 50 réels (noms modifiés), prénoms, nationalités
    geo.js            villes et surfaces
    staff.js, life.js, commentary.js, lore.js, flags.js
  engine/             logique du jeu, sans React ni JSX (testable seule)
    circuit.js        circuit actif (ATP/WTA), formats, conditions d'entrée
    match.js          moteur de match (points, jeux, tie-breaks)
    simulation.js     semaine du circuit IA, Masters, évolution des notes
    database.js       génération des 1 200 joueurs IA
    player.js         joueur humain : création, vie, notoriété, blessures
    race.js           Race et expiration des points
    challenges.js     défis scénarisés (objectifs, score, événements)
    sponsors.js, press.js, social.js, progression.js, trophies.js,
    legacy.js, records.js, storage.js, names.js, feminize.js, …
  ui/                 interface
    screens/          un fichier par écran (Accueil, Circuit, Stats…)
    overlays/         animations et négociation
    icons.jsx, avatar.jsx, charts.jsx, theme.js, styles.js, navigation.js
tests/                tests Vitest
scripts/              build en fichier unique
```

Règles :

- `engine/` et `data/` ne contiennent **ni React ni JSX**. C'est ce qui
  permettra de faire tourner le même moteur côté serveur (classements en
  ligne, carrière coop). `npm run lint` et les tests le vérifient.
- L'interface lit le moteur, le moteur ne connaît pas l'interface.
- Les états globaux du moteur se modifient par des fonctions :
  `setCircuit()`, `setPlayerRaceRank()`, `setActiveChallenge()`.

## Tests

Les tests utilisent un hasard reproductible (`tests/helpers.js`) : un même
test donne toujours le même résultat. Ils couvrent :

- les barèmes (Grand Chelem 2000/1200/720…, Masters, Challenger/ITF) ;
- une saison simulée ATP et WTA : vainqueurs de Grand Chelem, Masters à
  8 joueurs, points stables à chaque rang, retraites ;
- l'évolution des notes (jeunes en progrès, plus de 30 ans en déclin) ;
- le moteur de match (fin de match, avantage au plus fort) ;
- le plafond de notoriété ;
- les 8 défis (mise en place, échec, réussite, score) ;
- l'accord au féminin.

À lancer avant chaque livraison : `npm test && npm run lint`.

## Suite prévue

`App.jsx` reste gros (~5 000 lignes) : la semaine, le lancement des
tournois et la fin de match y vivent encore. Prochaine étape : les
extraire dans `engine/` sous forme de fonctions pures
(`état → nouvel état`), ce qui rend le moteur entièrement rejouable.

// Audit de l'accord au féminin (circuit WTA) : mini-jeux, match, presse,
// réseaux, défis… et idempotence des règles.
import { describe, it, expect } from "vitest";
import { feminizeText } from "../src/engine/feminize.js";

describe("féminisation : audit", () => {
  const cases = [
    // Mini-jeux
    ["Il attendait au T, vous servez à l'extérieur : ace !", "Elle attendait au T, vous servez à l'extérieur : ace !"],
    ["Il avait lu votre service : retour gagnant.", "Elle avait lu votre service : retour gagnant."],
    ["Il a servi à l'extérieur, vous l'attendiez au T : ace.", "Elle a servi à l'extérieur, vous l'attendiez au T : ace."],
    ["Balle de break · Léa Martin va servir. Où va-t-il frapper ?", "Balle de break · Léa Martin va servir. Où va-t-elle frapper ?"],
    ["Servez là où il ne vous attend pas.", "Servez là où elle ne vous attend pas."],
    ["Placez-vous là où il va servir.", "Placez-vous là où elle va servir."],
    ["CRISPÉ…", "CRISPÉE…"],
    ["1 respiration sur 3 : crispé, le point vous échappe.", "1 respiration sur 3 : crispée, le point vous échappe."],
    ["Coup droit d'attaque gagnant du serveur.", "Coup droit d'attaque gagnant de la serveuse."],
    ["Long échange, le relanceur finit par sortir la balle.", "Long échange, la relanceuse finit par sortir la balle."],
    ["Lob gagnant par-dessus le serveur !", "Lob gagnant par-dessus la serveuse !"],
    // Smash raté : blessure dans le fil du match
    ["Mauvaise réception après le smash… Entorse ! Léa Martin est gêné pour la suite du match.",
      "Mauvaise réception après le smash… Entorse ! Léa Martin est gênée pour la suite du match."],
    // Match, résultats
    ["QUALIFIÉ !", "QUALIFIÉE !"],
    ["CHAMPION !", "CHAMPIONNE !"],
    ["ÉLIMINÉ EN QUALIFS", "ÉLIMINÉE EN QUALIFS"],
    ["BREAKÉ", "BREAKÉE"],
    ["Il est moins endurant que toi. Fais-le courir, tiens l'échange.", "Elle est moins endurante que toi. Fais-la courir, tiens l'échange."],
    ["Le n° 5 ? Il faudra compter avec moi.", "La n° 5 ? Il faudra compter avec moi."],
    ["Battre le n°1 mondial", "Battre la n°1 mondiale"],
    // Presse, réseaux, vie
    ["Encore beaucoup à améliorer. Je ne suis pas pleinement satisfait.", "Encore beaucoup à améliorer. Je ne suis pas pleinement satisfaite."],
    ["Certains anciens joueurs trouvent Léa trop prudent dans le jeu.", "Certaines anciennes joueuses trouvent Léa trop prudente dans le jeu."],
    ["Merci, je reviens plus fort.", "Merci, je reviens plus forte."],
    ["Sifflé par le public", "Sifflée par le public"],
    ["Aucun joueur trouvé…", "Aucune joueuse trouvée…"],
    ["Rome : Léa couronné", "Rome : Léa couronnée"],
    // Plan de jeu : longueur
    ["Sa volée est faible. Joue court, attire-le au filet.", "Sa volée est faible. Joue court, attire-la au filet."],
    ["Il aime prendre la balle tôt. Joue long, repousse-le.", "Elle aime prendre la balle tôt. Joue long, repousse-la."],
    ["profond : contre un attaquant, pas un défenseur", "profond : contre une attaquante, pas une défenseuse"],
  ];
  for (const [src, expected] of cases) {
    it(src, () => expect(feminizeText(src)).toBe(expected));
  }

  it("est idempotente (appliquée deux fois = une fois)", () => {
    for (const [src] of cases) {
      const once = feminizeText(src);
      expect(feminizeText(once)).toBe(once);
    }
  });

  it("ne touche pas les mots masculins sans lien avec la joueuse", () => {
    const keep = [
      "SMASH ! Imparable.",
      "Smash un peu court… l'adversaire le remet et gagne le point.",
      "Service-volée : volée gagnante.",
      "Le service est gagnant, un set à zéro.",
      "La WTA 1000 de Rome a couronné Léa au terme d'une finale disputée.",
      "Mon fils a commencé le tennis grâce à toi. Ça me touche, longue carrière à lui !",
      "Match équilibré. Garde ton plan et reste solide.",
    ];
    for (const s of keep) expect(feminizeText(s)).toBe(s);
  });
});

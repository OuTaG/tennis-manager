// Trophées (Hall of Fame).
import { CITIES } from "../data/geo.js";

// 100+ secondary achievements across 6 categories.
// Each trophy has: id, name, desc, category, rarity (bronze/silver/gold),
// and a check(player, ctx) function returning { unlocked, progress? }.
// progress.target may be omitted for purely boolean trophies.

export const TROPHY_CATEGORIES = {
  ranking: { label: "Classement", iconName: "trophy" },
  matches: { label: "Matches", iconName: "target" },
  titles:  { label: "Titres",   iconName: "award" },
  career:  { label: "Carrière", iconName: "history" },
  special: { label: "Spéciaux", iconName: "sparkles" },
  discovery: { label: "Découverte", iconName: "search" },
};

export const RARITY = {
  bronze: { label: "Bronze", color: "#a86b3c", glow: "transparent" },
  silver: { label: "Argent", color: "#8f969c", glow: "transparent" },
  gold:   { label: "Or",     color: "#b8891f", glow: "transparent" },
};

// Cash reward granted when claiming a trophy, by rarity
export const RARITY_REWARD = { bronze: 50, silver: 100, gold: 500 };

// Helper: scan a player's match history with a predicate, return count
export const countMatches = (player, predicate) =>
  (player.matchHistory || []).filter(predicate).length;

// Helper: best ever ranking (lowest number) — relies on history snapshots
export const bestRankingEver = (player) => {
  const hist = player.history || [];
  if (hist.length === 0) return 9999;
  return Math.min(...hist.map(h => h.ranking || 9999));
};

export const TROPHIES = [
  // ─── RANKING (12 trophies) ──────────────────────────────────────
  { id: "rank_1000", name: "Pied dans la porte", desc: "Atteindre le top 1000", cat: "ranking", rarity: "bronze",
    check: (p) => ({ unlocked: bestRankingEver(p) <= 1000, progress: { current: 1101 - Math.min(1101, bestRankingEver(p)), target: 101 } }) },
  { id: "rank_500", name: "Espoir confirmé", desc: "Atteindre le top 500", cat: "ranking", rarity: "bronze",
    check: (p) => ({ unlocked: bestRankingEver(p) <= 500 }) },
  { id: "rank_300", name: "Joueur pro", desc: "Atteindre le top 300", cat: "ranking", rarity: "bronze",
    check: (p) => ({ unlocked: bestRankingEver(p) <= 300 }) },
  { id: "rank_200", name: "Habitué du circuit", desc: "Atteindre le top 200", cat: "ranking", rarity: "silver",
    check: (p) => ({ unlocked: bestRankingEver(p) <= 200 }) },
  { id: "rank_100", name: "Centurion", desc: "Atteindre le top 100", cat: "ranking", rarity: "silver",
    check: (p) => ({ unlocked: bestRankingEver(p) <= 100 }) },
  { id: "rank_50", name: "Tête d'affiche", desc: "Atteindre le top 50", cat: "ranking", rarity: "silver",
    check: (p) => ({ unlocked: bestRankingEver(p) <= 50 }) },
  { id: "rank_30", name: "Sérieux client", desc: "Atteindre le top 30", cat: "ranking", rarity: "silver",
    check: (p) => ({ unlocked: bestRankingEver(p) <= 30 }) },
  { id: "rank_20", name: "Outsider", desc: "Atteindre le top 20", cat: "ranking", rarity: "gold",
    check: (p) => ({ unlocked: bestRankingEver(p) <= 20 }) },
  { id: "rank_10", name: "Top 10 mondial", desc: "Atteindre le top 10", cat: "ranking", rarity: "gold",
    check: (p) => ({ unlocked: bestRankingEver(p) <= 10 }) },
  { id: "rank_5", name: "Big Five", desc: "Atteindre le top 5", cat: "ranking", rarity: "gold",
    check: (p) => ({ unlocked: bestRankingEver(p) <= 5 }) },
  { id: "rank_3", name: "Podium mondial", desc: "Atteindre le top 3", cat: "ranking", rarity: "gold",
    check: (p) => ({ unlocked: bestRankingEver(p) <= 3 }) },
  { id: "rank_1", name: "Numéro un", desc: "Devenir #1 mondial", cat: "ranking", rarity: "gold",
    check: (p) => ({ unlocked: bestRankingEver(p) === 1 }) },

  // ─── MATCHES (12 trophies) ──────────────────────────────────────
  { id: "win_first", name: "Premier sang", desc: "Gagner votre premier match", cat: "matches", rarity: "bronze",
    check: (p) => ({ unlocked: p.careerWins >= 1 }) },
  { id: "win_10", name: "Régulier", desc: "Gagner 10 matches", cat: "matches", rarity: "bronze",
    check: (p) => ({ unlocked: p.careerWins >= 10, progress: { current: Math.min(p.careerWins, 10), target: 10 } }) },
  { id: "win_50", name: "Cinquantenaire", desc: "Gagner 50 matches", cat: "matches", rarity: "silver",
    check: (p) => ({ unlocked: p.careerWins >= 50, progress: { current: Math.min(p.careerWins, 50), target: 50 } }) },
  { id: "win_100", name: "Le centième", desc: "Gagner 100 matches", cat: "matches", rarity: "silver",
    check: (p) => ({ unlocked: p.careerWins >= 100, progress: { current: Math.min(p.careerWins, 100), target: 100 } }) },
  { id: "win_250", name: "Vétéran", desc: "Gagner 250 matches", cat: "matches", rarity: "gold",
    check: (p) => ({ unlocked: p.careerWins >= 250, progress: { current: Math.min(p.careerWins, 250), target: 250 } }) },
  { id: "win_500", name: "Demi-millier", desc: "Gagner 500 matches", cat: "matches", rarity: "gold",
    check: (p) => ({ unlocked: p.careerWins >= 500, progress: { current: Math.min(p.careerWins, 500), target: 500 } }) },
  { id: "bagel_set", name: "Bagel", desc: "Gagner un set 6-0", cat: "matches", rarity: "bronze",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && /6-0/.test(m.score || "")) >= 1 }) },
  { id: "double_bagel", name: "Double Bagel", desc: "Gagner un match 6-0 6-0", cat: "matches", rarity: "gold",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && /^6-0[, ]+6-0$/.test((m.score || "").trim())) >= 1 }) },
  { id: "comeback", name: "Remontée fantastique", desc: "Gagner après avoir perdu le premier set", cat: "matches", rarity: "silver",
    check: (p) => ({ unlocked: countMatches(p, m => {
      if (!m.won || !m.score) return false;
      const sets = m.score.split(/[, ]+/);
      if (sets.length < 3) return false;
      const [a, b] = sets[0].split("-").map(Number);
      return a < b;
    }) >= 1 }) },
  { id: "tiebreak_master", name: "Roi du tie-break", desc: "Gagner 5 tie-breaks", cat: "matches", rarity: "silver",
    check: (p) => {
      const c = countMatches(p, m => m.won && /\d+\(\d+\)/.test(m.score || ""));
      return { unlocked: c >= 5, progress: { current: Math.min(c, 5), target: 5 } };
    } },
  { id: "giant_killer", name: "Tueur de géants", desc: "Battre un joueur du top 10", cat: "matches", rarity: "gold",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && (m.opponentRank || 999) <= 10) >= 1 }) },
  { id: "giant_killer_x5", name: "Régicide", desc: "Battre 5 joueurs du top 10", cat: "matches", rarity: "gold",
    check: (p) => {
      const c = countMatches(p, m => m.won && (m.opponentRank || 999) <= 10);
      return { unlocked: c >= 5, progress: { current: Math.min(c, 5), target: 5 } };
    } },

  // ─── TITLES (12 trophies) ──────────────────────────────────────
  { id: "title_first", name: "Premier sacre", desc: "Gagner votre premier titre", cat: "titles", rarity: "bronze",
    check: (p) => ({ unlocked: p.titlesWon >= 1 }) },
  { id: "title_itf", name: "Premiers pas", desc: "Gagner un tournoi du Circuit Open", cat: "titles", rarity: "bronze",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && m.tierWon === "ITF") >= 1 }) },
  { id: "title_challenger", name: "Roi du Circuit Pro", desc: "Gagner un tournoi du Circuit Pro", cat: "titles", rarity: "silver",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && m.tierWon === "Challenger") >= 1 }) },
  { id: "title_atp250", name: "Premier titre", desc: "Gagner un Tour 250", cat: "titles", rarity: "silver",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && m.tierWon === "ATP250") >= 1 }) },
  { id: "title_atp500", name: "Titre Tour 500", desc: "Gagner un Tour 500", cat: "titles", rarity: "silver",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && m.tierWon === "ATP500") >= 1 }) },
  { id: "title_masters", name: "Grand 1000", desc: "Gagner un Grand 1000", cat: "titles", rarity: "gold",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && m.tierWon === "Masters1000") >= 1 }) },
  { id: "title_slam", name: "Majeur", desc: "Gagner un tournoi Majeur", cat: "titles", rarity: "gold",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && m.tierWon === "GrandSlam") >= 1 }) },
  { id: "career_slam", name: "Career Slam", desc: "Gagner les 4 Grands Chelems", cat: "titles", rarity: "gold",
    check: (p) => {
      const slams = new Set();
      (p.matchHistory || []).forEach(m => {
        if (m.won && m.round === "Vainqueur" && m.tierWon === "GrandSlam") slams.add(m.tournament);
      });
      return { unlocked: slams.size >= 4, progress: { current: Math.min(slams.size, 4), target: 4 } };
    } },
  { id: "titles_5", name: "Cinq trophées", desc: "Gagner 5 titres", cat: "titles", rarity: "silver",
    check: (p) => ({ unlocked: p.titlesWon >= 5, progress: { current: Math.min(p.titlesWon, 5), target: 5 } }) },
  { id: "titles_10", name: "Décennie de titres", desc: "Gagner 10 titres", cat: "titles", rarity: "silver",
    check: (p) => ({ unlocked: p.titlesWon >= 10, progress: { current: Math.min(p.titlesWon, 10), target: 10 } }) },
  { id: "titles_25", name: "Collectionneur", desc: "Gagner 25 titres", cat: "titles", rarity: "gold",
    check: (p) => ({ unlocked: p.titlesWon >= 25, progress: { current: Math.min(p.titlesWon, 25), target: 25 } }) },
  { id: "titles_50", name: "Légende vivante", desc: "Gagner 50 titres", cat: "titles", rarity: "gold",
    check: (p) => ({ unlocked: p.titlesWon >= 50, progress: { current: Math.min(p.titlesWon, 50), target: 50 } }) },

  // ─── CAREER / FINANCE (8 trophies) ─────────────────────────────
  { id: "earn_10k", name: "Premiers gains", desc: "Gagner 10 000€ en carrière", cat: "career", rarity: "bronze",
    check: (p) => ({ unlocked: (p.totalEarnings || 0) >= 10000, progress: { current: Math.min(p.totalEarnings || 0, 10000), target: 10000 } }) },
  { id: "earn_100k", name: "Six chiffres", desc: "Gagner 100 000€ en carrière", cat: "career", rarity: "silver",
    check: (p) => ({ unlocked: (p.totalEarnings || 0) >= 100000, progress: { current: Math.min(p.totalEarnings || 0, 100000), target: 100000 } }) },
  { id: "earn_500k", name: "Demi-million", desc: "Gagner 500 000€ en carrière", cat: "career", rarity: "silver",
    check: (p) => ({ unlocked: (p.totalEarnings || 0) >= 500000, progress: { current: Math.min(p.totalEarnings || 0, 500000), target: 500000 } }) },
  { id: "earn_1m", name: "Millionnaire", desc: "Gagner 1 000 000€ en carrière", cat: "career", rarity: "gold",
    check: (p) => ({ unlocked: (p.totalEarnings || 0) >= 1000000, progress: { current: Math.min(p.totalEarnings || 0, 1000000), target: 1000000 } }) },
  { id: "earn_10m", name: "Dix millions", desc: "Gagner 10 000 000€ en carrière", cat: "career", rarity: "gold",
    check: (p) => ({ unlocked: (p.totalEarnings || 0) >= 10000000, progress: { current: Math.min(p.totalEarnings || 0, 10000000), target: 10000000 } }) },
  { id: "longevity_5", name: "Lustre de carrière", desc: "5 saisons jouées", cat: "career", rarity: "silver",
    check: (p) => ({ unlocked: (p.careerSeasons || []).length >= 5, progress: { current: Math.min((p.careerSeasons || []).length, 5), target: 5 } }) },
  { id: "longevity_10", name: "Décennie pro", desc: "10 saisons jouées", cat: "career", rarity: "gold",
    check: (p) => ({ unlocked: (p.careerSeasons || []).length >= 10, progress: { current: Math.min((p.careerSeasons || []).length, 10), target: 10 } }) },
  { id: "longevity_20", name: "Monument du sport", desc: "20 saisons jouées", cat: "career", rarity: "gold",
    check: (p) => ({ unlocked: (p.careerSeasons || []).length >= 20, progress: { current: Math.min((p.careerSeasons || []).length, 20), target: 20 } }) },

  // ─── SPECIAL (6 trophies) ──────────────────────────────────────
  { id: "year_end_1", name: "N°1 mondial annuel", desc: "Finir une saison en tant que #1", cat: "special", rarity: "gold",
    check: (p) => ({ unlocked: (p.careerSeasons || []).some(s => s.endOfYearRanking === 1) }) },
  { id: "stat_max", name: "Joueur complet", desc: "Avoir une stat à 90+", cat: "special", rarity: "silver",
    check: (p) => ({ unlocked: Object.values(p.stats || {}).some(v => v >= 90) }) },
  { id: "all_90", name: "Maître absolu", desc: "Avoir toutes les stats à 80+", cat: "special", rarity: "gold",
    check: (p) => {
      const vals = Object.values(p.stats || {});
      const c = vals.filter(v => v >= 80).length;
      const total = vals.length;
      return { unlocked: c === total && total > 0, progress: { current: c, target: total } };
    } },
  { id: "all_sponsors", name: "Marque incontournable", desc: "Avoir 3 sponsors actifs simultanément", cat: "special", rarity: "silver",
    check: (p) => ({ unlocked: (p.sponsors || []).length >= 3 }) },
  { id: "premium_sponsor", name: "Tier premium", desc: "Signer un sponsor premium", cat: "special", rarity: "gold",
    check: (p) => ({ unlocked: (p.sponsors || []).some(s => s.tier === "premium") || (p.sponsorOffers || []).some(o => o.tier === "premium") }) },
  { id: "wildcard_first", name: "Élu", desc: "Recevoir et accepter une wildcard", cat: "special", rarity: "bronze",
    check: (p) => ({ unlocked: (p.wildcardsUsed || []).length >= 1 }) },

  // ─── NEW TROPHIES (50) — user-requested + additions ─────────────
  // Specific rival wins
  { id: "beat_alcaraz", name: "Roi détrôné", desc: "Battre C. Alcázar en match", cat: "matches", rarity: "gold",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && (m.opponent === "C. Alcázar" || m.opponent === "I. Swiatak")) >= 1 }) },
  { id: "beat_sinner", name: "Renard piégé", desc: "Battre J. Sinterm en match", cat: "matches", rarity: "gold",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && (m.opponent === "J. Sinterm" || m.opponent === "A. Sabalenko")) >= 1 }) },
  { id: "beat_both_top2", name: "Big Two terrassés", desc: "Battre Sinterm ET Alcázar au cours de la carrière", cat: "matches", rarity: "gold",
    check: (p) => ({
      unlocked: countMatches(p, m => m.won && (m.opponent === "J. Sinterm" || m.opponent === "A. Sabalenko")) >= 1
             && countMatches(p, m => m.won && (m.opponent === "C. Alcázar" || m.opponent === "I. Swiatak")) >= 1,
    }) },

  // Comeback trophies (using flags computed in matchEntry)
  { id: "comeback_set_5_0", name: "Remontée exceptionnelle", desc: "Gagner un set après avoir été mené 5-0", cat: "matches", rarity: "silver",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.comebackInSetFrom5_0) >= 1 }) },
  { id: "comeback_match_5_0", name: "Remontée incroyable", desc: "Gagner un match après avoir été mené 5-0 dans le set décisif", cat: "matches", rarity: "gold",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.comebackMatchFrom5_0Decider) >= 1 }) },
  { id: "three_tiebreaks", name: "Tie-break Marathon", desc: "Gagner un match avec 2 tie-breaks gagnés", cat: "matches", rarity: "gold",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && (m.tiebreaksWon || 0) >= 2) >= 1 }) },

  // ATP discovery
  { id: "atp_100_viewed", name: "Œil de scout", desc: "Consulter la fiche des 100 joueurs du top 100 mondial", cat: "discovery", rarity: "silver",
    check: (p) => {
      const c = (p.viewedAtpPlayers || []).length;
      return { unlocked: c >= 100, progress: { current: Math.min(c, 100), target: 100 } };
    } },
  { id: "atp_25_viewed", name: "Curieux", desc: "Consulter 25 fiches de joueurs du circuit", cat: "discovery", rarity: "bronze",
    check: (p) => {
      const c = (p.viewedAtpPlayers || []).length;
      return { unlocked: c >= 25, progress: { current: Math.min(c, 25), target: 25 } };
    } },

  // Surface-based titles
  { id: "title_clay", name: "Terrien", desc: "Gagner un titre sur terre battue", cat: "titles", rarity: "bronze",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && m.surface === "Terre battue") >= 1 }) },
  { id: "title_grass", name: "Pelouse maîtrisée", desc: "Gagner un titre sur gazon", cat: "titles", rarity: "silver",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && m.surface === "Gazon") >= 1 }) },
  { id: "title_hard", name: "Béton armé", desc: "Gagner un titre sur dur", cat: "titles", rarity: "bronze",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && m.surface === "Dur") >= 1 }) },
  { id: "title_indoor", name: "Sous la verrière", desc: "Gagner un titre en indoor", cat: "titles", rarity: "silver",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && m.surface === "Indoor") >= 1 }) },
  { id: "title_all_surfaces", name: "Polyvalent", desc: "Gagner un titre sur 3 surfaces différentes", cat: "titles", rarity: "gold",
    check: (p) => {
      const surfs = new Set();
      (p.matchHistory || []).forEach(m => {
        if (m.won && m.round === "Vainqueur" && m.surface) surfs.add(m.surface);
      });
      return { unlocked: surfs.size >= 3, progress: { current: Math.min(surfs.size, 3), target: 3 } };
    } },

  // Win-streaks & dominance
  { id: "win_streak_5", name: "Série de 5", desc: "Gagner 5 matches consécutifs", cat: "matches", rarity: "bronze",
    check: (p) => {
      const hist = (p.matchHistory || []).slice().reverse(); // chronological
      let best = 0, cur = 0;
      hist.forEach(m => { if (m.won) { cur++; best = Math.max(best, cur); } else cur = 0; });
      return { unlocked: best >= 5, progress: { current: Math.min(best, 5), target: 5 } };
    } },
  { id: "win_streak_10", name: "Série de 10", desc: "Gagner 10 matches consécutifs", cat: "matches", rarity: "silver",
    check: (p) => {
      const hist = (p.matchHistory || []).slice().reverse();
      let best = 0, cur = 0;
      hist.forEach(m => { if (m.won) { cur++; best = Math.max(best, cur); } else cur = 0; });
      return { unlocked: best >= 10, progress: { current: Math.min(best, 10), target: 10 } };
    } },
  { id: "win_streak_20", name: "Invaincu", desc: "Gagner 20 matches consécutifs", cat: "matches", rarity: "gold",
    check: (p) => {
      const hist = (p.matchHistory || []).slice().reverse();
      let best = 0, cur = 0;
      hist.forEach(m => { if (m.won) { cur++; best = Math.max(best, cur); } else cur = 0; });
      return { unlocked: best >= 20, progress: { current: Math.min(best, 20), target: 20 } };
    } },

  // Special wins
  { id: "win_no_set_lost", name: "Sans encombre", desc: "Gagner un tournoi sans concéder un set", cat: "matches", rarity: "silver",
    check: (p) => {
      const hist = p.matchHistory || [];
      // Group matches by tournament+year. A "clean tournament win" = all matches of the
      // tournament are won AND no set was conceded, with the last match being "Vainqueur".
      const groups = {};
      for (const m of hist) {
        if (m.isQualifying) continue;
        const key = (m.tournament || "?") + "|" + (m.year || 0);
        (groups[key] = groups[key] || []).push(m);
      }
      const cleanRun = Object.values(groups).some(matches => {
        if (!matches.some(m => m.round === "Vainqueur" && m.won)) return false;
        return matches.every(m => {
          if (!m.won || !m.score) return false;
          const sets = m.score.split(" ");
          return sets.every(s => {
            const [a, b] = s.split("-").map(x => parseInt(x));
            return a > b;
          });
        });
      });
      return { unlocked: cleanRun };
    } },
  { id: "five_set_win", name: "Marathon gagnant", desc: "Gagner un match en 5 sets", cat: "matches", rarity: "silver",
    // Circuit féminin (pas de match en 5 sets) : gagner en 3 sets en Grand Chelem.
    check: (p) => ({ unlocked: countMatches(p, m => m.won && (m.setsCount === 5 || (p.circuit === "wta" && m.tierWon === "GrandSlam" && m.setsCount === 3))) >= 1 }) },
  { id: "win_top20", name: "Chasseur d'élite", desc: "Battre un joueur du top 20", cat: "matches", rarity: "silver",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && (m.opponentRank || 999) <= 20) >= 1 }) },
  { id: "win_top50", name: "Coup d'éclat", desc: "Battre un joueur du top 50", cat: "matches", rarity: "bronze",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && (m.opponentRank || 999) <= 50) >= 1 }) },
  { id: "win_top1", name: "Tombeur du Roi", desc: "Battre le n°1 mondial", cat: "matches", rarity: "gold",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && (m.opponentRank || 999) === 1) >= 1 }) },

  // Tournament-specific Slams
  { id: "slam_rg", name: "Roi de l'ocre", desc: "Gagner les Internationaux de Paris", cat: "titles", rarity: "gold",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && /Internationaux de Paris/i.test(m.tournament || "")) >= 1 }) },
  { id: "slam_wim", name: "Gentleman du gazon", desc: "Gagner le Tournoi de Londres", cat: "titles", rarity: "gold",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && /Tournoi de Londres/i.test(m.tournament || "")) >= 1 }) },
  { id: "slam_us", name: "King of New York", desc: "Gagner l'Open des États-Unis", cat: "titles", rarity: "gold",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && /États-Unis/i.test(m.tournament || "")) >= 1 }) },
  { id: "slam_aus", name: "Été australien", desc: "Gagner l'Open d'Australie", cat: "titles", rarity: "gold",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && /Australie|Australia|Australian/i.test(m.tournament || "")) >= 1 }) },
  { id: "slam_final", name: "Finaliste majeur", desc: "Atteindre une finale de Majeur", cat: "titles", rarity: "silver",
    check: (p) => ({ unlocked: countMatches(p, m => m.tierWon === "GrandSlam" && (m.round === "Vainqueur" || m.round === "Finale")) >= 1 }) },

  // Single-season feats
  { id: "season_10_wins", name: "Saison solide", desc: "Gagner 10 matches en une saison", cat: "career", rarity: "bronze",
    check: (p) => {
      const cur = p.seasonStats?.wins || 0;
      const best = Math.max(cur, ...((p.careerSeasons || []).map(s => s.wins || 0)));
      return { unlocked: best >= 10, progress: { current: Math.min(best, 10), target: 10 } };
    } },
  { id: "season_30_wins", name: "Métronome", desc: "Gagner 30 matches en une saison", cat: "career", rarity: "silver",
    check: (p) => {
      const cur = p.seasonStats?.wins || 0;
      const best = Math.max(cur, ...((p.careerSeasons || []).map(s => s.wins || 0)));
      return { unlocked: best >= 30, progress: { current: Math.min(best, 30), target: 30 } };
    } },
  { id: "season_50_wins", name: "Rouleau compresseur", desc: "Gagner 50 matches en une saison", cat: "career", rarity: "gold",
    check: (p) => {
      const cur = p.seasonStats?.wins || 0;
      const best = Math.max(cur, ...((p.careerSeasons || []).map(s => s.wins || 0)));
      return { unlocked: best >= 50, progress: { current: Math.min(best, 50), target: 50 } };
    } },
  { id: "season_3_titles", name: "Triple sacre", desc: "Gagner 3 titres en une saison", cat: "career", rarity: "silver",
    check: (p) => {
      const cur = p.seasonStats?.titles || 0;
      const best = Math.max(cur, ...((p.careerSeasons || []).map(s => s.titles || 0)));
      return { unlocked: best >= 3, progress: { current: Math.min(best, 3), target: 3 } };
    } },
  { id: "season_5_titles", name: "Saison sacrée", desc: "Gagner 5 titres en une saison", cat: "career", rarity: "gold",
    check: (p) => {
      const cur = p.seasonStats?.titles || 0;
      const best = Math.max(cur, ...((p.careerSeasons || []).map(s => s.titles || 0)));
      return { unlocked: best >= 5, progress: { current: Math.min(best, 5), target: 5 } };
    } },

  // Stat-based
  { id: "stat_95", name: "Au sommet", desc: "Avoir une stat à 95+", cat: "special", rarity: "gold",
    check: (p) => ({ unlocked: Object.values(p.stats || {}).some(v => v >= 95) }) },
  { id: "stat_serve_85", name: "Canonnier", desc: "Service à 85+", cat: "special", rarity: "silver",
    check: (p) => ({ unlocked: (p.stats?.serve || 0) >= 85 }) },
  { id: "stat_return_85", name: "Mur de retour", desc: "Retour à 85+", cat: "special", rarity: "silver",
    check: (p) => ({ unlocked: (p.stats?.return || 0) >= 85 }) },
  { id: "stat_mental_85", name: "Tête froide", desc: "Mental à 85+", cat: "special", rarity: "silver",
    check: (p) => ({ unlocked: (p.stats?.mental || 0) >= 85 }) },
  { id: "stat_stamina_85", name: "Endurance d'acier", desc: "Endurance à 85+", cat: "special", rarity: "silver",
    check: (p) => ({ unlocked: (p.stats?.stamina || 0) >= 85 }) },

  // Finance / sponsors
  { id: "earn_5m", name: "Cinq millions", desc: "Gagner 5 000 000€ en carrière", cat: "career", rarity: "gold",
    check: (p) => ({ unlocked: (p.totalEarnings || 0) >= 5000000, progress: { current: Math.min(p.totalEarnings || 0, 5000000), target: 5000000 } }) },
  { id: "earn_50m", name: "Cinquante millions", desc: "Gagner 50 000 000€ en carrière", cat: "career", rarity: "gold",
    check: (p) => ({ unlocked: (p.totalEarnings || 0) >= 50000000, progress: { current: Math.min(p.totalEarnings || 0, 50000000), target: 50000000 } }) },
  { id: "first_sponsor", name: "Premier contrat", desc: "Signer votre premier sponsor", cat: "special", rarity: "bronze",
    check: (p) => ({ unlocked: (p.sponsors || []).length >= 1 }) },
  { id: "rich_account", name: "Coffre garni", desc: "Avoir 500 000€ de liquidités", cat: "career", rarity: "silver",
    check: (p) => ({ unlocked: (p.money || 0) >= 500000 }) },

  // Round milestones
  { id: "qf_first", name: "Quart-finaliste", desc: "Atteindre un quart de finale", cat: "matches", rarity: "bronze",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && /Quart/i.test(m.round || "")) >= 1 }) },
  { id: "sf_first", name: "Demi-finaliste", desc: "Atteindre une demi-finale", cat: "matches", rarity: "silver",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && /Demi/i.test(m.round || "")) >= 1 }) },
  { id: "final_first", name: "Finaliste", desc: "Atteindre une finale", cat: "matches", rarity: "silver",
    check: (p) => ({ unlocked: countMatches(p, m => m.round === "Finale" || m.round === "Vainqueur") >= 1 }) },

  // Specific cities (discovery & travel)
  { id: "city_paris", name: "Joué à Paris", desc: "Disputer un match à Paris", cat: "discovery", rarity: "bronze",
    check: (p) => ({ unlocked: countMatches(p, m => m.city === "Paris") >= 1 }) },
  { id: "city_5", name: "Globe-trotter", desc: "Disputer un match dans 5 villes différentes", cat: "discovery", rarity: "bronze",
    check: (p) => {
      const cities = new Set((p.matchHistory || []).map(m => m.city).filter(Boolean));
      return { unlocked: cities.size >= 5, progress: { current: Math.min(cities.size, 5), target: 5 } };
    } },
  { id: "city_15", name: "Tour du monde", desc: "Disputer un match dans 15 villes différentes", cat: "discovery", rarity: "silver",
    check: (p) => {
      const cities = new Set((p.matchHistory || []).map(m => m.city).filter(Boolean));
      return { unlocked: cities.size >= 15, progress: { current: Math.min(cities.size, 15), target: 15 } };
    } },
  { id: "city_30", name: "Nomade", desc: "Disputer un match dans 30 villes différentes", cat: "discovery", rarity: "gold",
    check: (p) => {
      const cities = new Set((p.matchHistory || []).map(m => m.city).filter(Boolean));
      return { unlocked: cities.size >= 30, progress: { current: Math.min(cities.size, 30), target: 30 } };
    } },

  // Score patterns / scoreline beauty
  { id: "all_three_sets_tb", name: "Trois tie-breaks", desc: "Gagner un match en 3 sets dont les 3 au tie-break", cat: "matches", rarity: "gold",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.threeTiebreaksWon && m.setsCount === 3) >= 1 }) },
  { id: "win_in_quali", name: "Sortie de qualif", desc: "Gagner un tournoi en sortant des qualifications", cat: "titles", rarity: "gold",
    check: (p) => {
      // Won the tournament AND had any quali wins in the same tournament year/week
      return { unlocked: (p.matchHistory || []).some(m => {
        if (!(m.won && m.round === "Vainqueur")) return false;
        return (p.matchHistory || []).some(q => q.tournament === m.tournament && q.year === m.year && q.isQualifying && q.won);
      }) };
    } },

  // Career longevity & feats
  { id: "longevity_15", name: "Quinze saisons", desc: "15 saisons jouées", cat: "career", rarity: "gold",
    check: (p) => ({ unlocked: (p.careerSeasons || []).length >= 15, progress: { current: Math.min((p.careerSeasons || []).length, 15), target: 15 } }) },
  { id: "year_end_top10", name: "Top 10 annuel", desc: "Finir une saison dans le top 10", cat: "special", rarity: "gold",
    check: (p) => ({ unlocked: (p.careerSeasons || []).some(s => (s.endOfYearRanking || 9999) <= 10) }) },
  { id: "year_end_top50", name: "Top 50 annuel", desc: "Finir une saison dans le top 50", cat: "special", rarity: "silver",
    check: (p) => ({ unlocked: (p.careerSeasons || []).some(s => (s.endOfYearRanking || 9999) <= 50) }) },

  // Match volume
  { id: "matches_100", name: "Centurion des courts", desc: "Disputer 100 matches", cat: "matches", rarity: "silver",
    check: (p) => {
      const total = (p.careerWins || 0) + (p.careerLosses || 0);
      return { unlocked: total >= 100, progress: { current: Math.min(total, 100), target: 100 } };
    } },
  { id: "matches_500", name: "Quintuple centurion", desc: "Disputer 500 matches", cat: "matches", rarity: "gold",
    check: (p) => {
      const total = (p.careerWins || 0) + (p.careerLosses || 0);
      return { unlocked: total >= 500, progress: { current: Math.min(total, 500), target: 500 } };
    } },

  // Misc
  { id: "no_injury_season", name: "Inoxydable", desc: "Terminer une saison sans blessure", cat: "career", rarity: "silver",
    check: (p) => ({ unlocked: (p.careerSeasons || []).some(s => !s.hadInjury) }) },
  { id: "title_home", name: "Devant son public", desc: "Gagner un titre dans un tournoi de votre pays", cat: "titles", rarity: "silver",
    check: (p) => ({ unlocked: countMatches(p, m => m.won && m.round === "Vainqueur" && m.city && CITIES[m.city]?.country === p.nationality) >= 1 }) },
];

// Check trophies against player state and return newly unlocked ones.
// `prevTrophies` is a Set of already-unlocked trophy IDs.
export function checkTrophies(player, prevTrophies) {
  const newlyUnlocked = [];
  for (const t of TROPHIES) {
    if (prevTrophies.has(t.id)) continue;
    const result = t.check(player);
    if (result.unlocked) newlyUnlocked.push(t);
  }
  return newlyUnlocked;
}

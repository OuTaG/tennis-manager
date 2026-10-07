// Choix des commentaires et rédaction des débriefs.
import { COMMENTARY, FORM_REMARKS } from "../data/commentary.js";
import { random } from "./rng.js";
import { roundPhrase } from "./frontpage.js";

// ─── OUTILS ──────────────────────────────────────────────────────────────────
// Mémoire courte des phrases déjà servies : on évite de redire la même chose
// à quelques jeux d'intervalle. Le tirage consomme toujours un seul nombre
// aléatoire, que la mémoire soit pleine ou vide : la suite du match (même
// graine) ne dépend donc pas de ce qui a été affiché avant un rechargement.
const recent = [];
const RECENT_MAX = 40;
function remember(key) {
  recent.push(key);
  if (recent.length > RECENT_MAX) recent.shift();
}
function pickFresh(list, tag = "") {
  if (!list || !list.length) return "";
  const start = Math.floor(random() * list.length);
  for (let k = 0; k < list.length; k++) {
    const i = (start + k) % list.length;
    const key = tag + "|" + (typeof list[i] === "string" ? list[i] : i);
    if (!recent.includes(key)) { remember(key); return list[i]; }
  }
  return list[start];
}
function fill(txt, vars) {
  return txt.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m));
}
const NUM_M = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze"];
const NUM_F = ["zéro", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze"];
// « une balle de break », « trois balles de break », « 14 aces »
function count(n, sing, plur, fem = true) {
  const w = (fem ? NUM_F : NUM_M)[n] ?? String(n);
  return w + " " + (n > 1 ? plur : sing);
}
const ORD = ["premier", "deuxième", "troisième", "quatrième", "cinquième", "sixième", "septième", "huitième", "neuvième", "dixième"];
const ORD_F = ["première", "deuxième", "troisième", "quatrième", "cinquième", "sixième", "septième", "huitième", "neuvième", "dixième"];
const ord = (i) => ORD[i] || (i + 1) + "e";
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// ─── ANALYSE D'UN JEU ────────────────────────────────────────────────────────
// Lit la suite des points d'un jeu (hors tie-break) : balles de break, égalités,
// aces du serveur, dernier point.
export function analyzeGame(points, serverIsP) {
  const S = serverIsP ? "p" : "o";
  let s = 0, r = 0, bp = 0, deuces = 0, aces = 0;
  for (const pt of points || []) {
    if (r >= 3 && r - s >= 1) bp++;
    if (pt.winner === S) s++; else r++;
    if (pt.winner === S && pt.kind === "ace") aces++;
    if (s >= 3 && s === r) deuces++;
  }
  const last = (points || [])[(points || []).length - 1] || null;
  const serverWon = s > r;
  return { serverWon, sPts: s, rPts: r, total: s + r, bp, deuces, aces, last, love: Math.min(s, r) === 0 };
}

// Formes vraies pour ce jeu (voir l'en-tête de src/data/commentary.js).
function gameShapes(g) {
  const shapes = [];
  if (!g) return shapes;
  const hold = g.serverWon;
  if (g.love) shapes.push("love");
  if (hold) {
    if (g.bp > 0) shapes.push("bp");
    if (g.aces >= 2) shapes.push("aces");
    if (g.bp === 0 && g.deuces === 0 && !g.love) shapes.push("clean");
  } else {
    if (g.bp === 1) shapes.push("first");
    if (g.bp >= 3) shapes.push("many");
  }
  if (g.deuces >= 2 || g.total >= 12) shapes.push("long");
  const k = g.last?.kind;
  if (hold && k === "ace") shapes.push("ace");
  else if (k === "winner" || (!hold && k === "ace")) shapes.push("winner");
  else if (k === "error") shapes.push("error");
  else if (k === "long_rally") shapes.push("rally");
  return shapes;
}

function gameVars(g) {
  if (!g) return {};
  const bpCount = g.serverWon ? g.bp : Math.max(1, g.bp);
  return {
    aces: count(g.aces, "ace", "aces", false),
    bp: count(bpCount, "balle de break", "balles de break"),
    bpn: ORD_F[Math.max(0, bpCount - 1)] || bpCount + "e",
    deuces: count(g.deuces, "égalité", "égalités"),
    pts: g.total,
  };
}

// ─── SITUATIONS DE SCORE ─────────────────────────────────────────────────────
// ctx : le résultat du jeu (advanceMatchOneGame) + log (jeux du set en cours),
// pSets / oSets, bo5.
function scoreSituation(ctx) {
  if (!ctx || !ctx.log || !ctx.score || ctx.isTiebreak || ctx.setComplete) return null;
  const log = ctx.log;
  const cur = log[log.length - 1];
  if (!cur) return null;
  const pWon = !!cur.playerWon, pServed = !!ctx.isPlayerServing;
  const a = ctx.score.p - (pWon ? 1 : 0), b = ctx.score.o - (pWon ? 0 : 1); // avant le jeu
  const setsToWin = ctx.bo5 ? 3 : 2;
  const sg = pServed ? a : b, rg = pServed ? b : a; // serveur / relanceur, avant le jeu
  const servingFor = sg >= 5 && sg - rg >= 1;
  const servingToStay = rg >= 5 && rg - sg >= 1;
  const sSets = pServed ? (ctx.pSets || 0) : (ctx.oSets || 0);
  const rSets = pServed ? (ctx.oSets || 0) : (ctx.pSets || 0);
  const holds = pWon === pServed;
  if (servingFor && !holds) {
    return { key: pServed ? "sit_lose_serving_for" : "sit_break_serving_for", enjeu: sSets === setsToWin - 1 ? "le match" : "le set", weight: 0.8 };
  }
  if (servingToStay && holds && !(ctx.score.p === 6 && ctx.score.o === 6)) {
    return { key: pServed ? "sit_hold_stay" : "sit_opp_hold_stay", enjeu: rSets === setsToWin - 1 ? "le match" : "le set", weight: 0.65 };
  }
  const prev = log[log.length - 2];
  if (prev && !prev.isTiebreak && holds && prev.isPlayerServing !== pServed && prev.playerWon === pWon) {
    return { key: pServed ? "sit_hold_confirm" : "sit_opp_confirm", weight: 0.45 };
  }
  return null;
}

// ─── COMMENTAIRE D'UN JEU OU D'UN SET ────────────────────────────────────────
// type : clé de COMMENTARY ; vars : {p}, {o}, {score}… ; ctx (facultatif) :
// le résultat du jeu, pour coller aux points réellement joués.
export function pickComment(type, vars = {}, ctx = null) {
  // Tirages fixes (même nombre quel que soit le chemin pris).
  const rShape = random(), rSit = random(), rSuffix = random(), rForm = random();
  const allVars = { kmh: 210 + Math.floor(random() * 16), ...vars };
  const entry = COMMENTARY[type] || COMMENTARY.hold_easy;
  const isSet = /^(set_|bagel_)/.test(type);

  let line;
  let situation = null, sitUsed = false;
  if (ctx && !isSet && ctx.points && !ctx.isTiebreak) {
    const g = analyzeGame(ctx.points, !!ctx.isPlayerServing);
    Object.assign(allVars, gameVars(g));
    situation = scoreSituation(ctx);
    if (situation && !/^first_/.test(type) && rSit < situation.weight) {
      allVars.enjeu = situation.enjeu || "le set";
      sitUsed = true;
      line = pickFresh(COMMENTARY[situation.key], situation.key);
    } else if (!Array.isArray(entry)) {
      line = pickShaped(entry, gameShapes(g), rShape, type);
    }
  }
  if (!line) {
    line = Array.isArray(entry) ? pickFresh(entry, type) : pickShaped(entry, [], rShape, type);
  }
  let txt = fill(line, allVars);

  if (ctx && !isSet && ctx.score && !ctx.isTiebreak && !/^first_/.test(type)) {
    txt = withSetOpening(txt, ctx, allVars, rForm);
    // Une situation de score se suffit : pas de score en plus (sauf 6-6).
    txt = withScore(txt, ctx, allVars, sitUsed ? 1 : rSuffix);
  }
  if (ctx && isSet && ctx.log && !ctx.matchComplete && !/^bagel_/.test(type)) {
    const extra = setFact(ctx, allVars, rSuffix);
    if (extra) txt = txt + ". " + extra;
  }
  return txt;
}

function pickShaped(entry, shapes, r, type) {
  const specific = shapes.filter(s => entry[s] && entry[s].length);
  // Forme la plus parlante d'abord ; sinon une phrase toujours vraie.
  const order = ["bp", "love", "many", "first", "aces", "long", "ace", "winner", "error", "rally", "clean"];
  specific.sort((x, y) => order.indexOf(x) - order.indexOf(y));
  let key;
  if (specific.length && r < 0.8) key = r < 0.5 ? specific[0] : specific[Math.floor((r - 0.5) / 0.3 * specific.length) % specific.length];
  else key = "any";
  const pool = entry[key] && entry[key].length ? entry[key] : entry.any;
  return pickFresh(pool, type + ":" + key);
}

// Premier jeu d'un nouveau set : on situe le moment.
function withSetOpening(txt, ctx, vars, r) {
  const setNo = ctx.setNo || 1;
  if (setNo < 2 || !ctx.log || ctx.log.length !== 1 || r >= 0.55) return txt;
  const setsToWin = ctx.bo5 ? 3 : 2;
  const decider = setNo === setsToWin * 2 - 1;
  const opts = decider
    ? ["Début du set décisif : ", "Dernière manche, premier jeu : ", "Tout se joue maintenant. "]
    : ["Début de la " + ORD_F[setNo - 1] + " manche : ", cap(ORD[setNo - 1]) + " set, premier jeu : ", "On repart pour un " + ORD[setNo - 1] + " set. "];
  const pre = opts[Math.floor(r / 0.55 * opts.length) % opts.length];
  const startsWithName = txt.startsWith(vars.p) || txt.startsWith(vars.o);
  const firstWord = txt.split(/[\s,!:]/)[0];
  const shouty = firstWord.length > 1 && firstWord === firstWord.toUpperCase();
  const body = pre.endsWith(": ") && !startsWithName && !shouty ? txt.charAt(0).toLowerCase() + txt.slice(1) : txt;
  return pre + body;
}

// Score du set après le jeu, glissé comme le ferait un commentateur.
function withScore(txt, ctx, vars, r) {
  const sp = ctx.score.p, so = ctx.score.o;
  if (sp === 6 && so === 6) {
    return txt + (/[!?.…]$/.test(txt) ? "" : ".") + " Six partout : place au tie-break.";
  }
  if (r >= 0.35 || /[!?.…]$/.test(txt) || txt.includes(",") || /^(Début|Dernière|Tout se joue|On repart|\S+ set, premier)/.test(txt)) return txt;
  const log = ctx.log || [];
  const pWon = !!(log[log.length - 1] || {}).playerWon;
  const hi = Math.max(sp, so), lo = Math.min(sp, so);
  const leader = sp > so ? vars.p : vars.o;
  const leaderWon = (sp > so) === pWon;
  let opts;
  if (sp === so) opts = [", " + sp + " partout", ", " + sp + " jeux partout", ", égalité " + sp + "-" + so];
  else if (txt.includes(leader)) {
    if (!leaderWon) return txt;
    opts = [", " + hi + "-" + lo, ", " + hi + "-" + lo + " dans ce set"];
  } else if (leaderWon) opts = [", " + hi + "-" + lo + " pour " + leader, ", " + leader + " mène " + hi + "-" + lo, ", " + leader + " mène " + hi + "-" + lo + " dans ce set"];
  else opts = [", " + leader + " mène toujours " + hi + "-" + lo, ", " + hi + "-" + lo + " pour " + leader, ", " + leader + " garde la main, " + hi + "-" + lo];
  return txt + opts[Math.floor(r / 0.35 * opts.length) % opts.length];
}

// Fait marquant du set qui vient de se terminer (une phrase, une fois sur deux).
function setFact(ctx, vars, r) {
  if (r >= 0.55) return null;
  const pWonSet = !!ctx.setWonByPlayer;
  const W = pWonSet ? vars.p : vars.o, L = pWonSet ? vars.o : vars.p;
  const ws = pWonSet ? "p" : "o";
  let diff = 0, trailed = false, breaksW = 0, breaksL = 0, lSetPts = 0, wSetPts = 0;
  let gp = 0, go = 0;
  for (const g of ctx.log) {
    if (g.isTiebreak) break;
    const server = g.isPlayerServing ? "p" : "o";
    // Balles de set dans ce jeu, pour chacun.
    let s = 0, rr = 0;
    for (const pt of g.points || []) {
      for (const side of ["p", "o"]) {
        const mine = side === server ? s : rr, theirs = side === server ? rr : s;
        const gx = side === "p" ? gp : go, gy = side === "p" ? go : gp;
        const gamePt = mine >= 3 && mine - theirs >= 1;
        const setPt = gamePt && ((gx + 1 >= 6 && gx + 1 - gy >= 2) || gx + 1 === 7);
        if (setPt) { if (side === ws) wSetPts++; else lSetPts++; }
      }
      if (pt.winner === server) s++; else rr++;
    }
    const winner = g.playerWon ? "p" : "o";
    if (winner !== server) {
      if (winner === ws) { breaksW++; diff++; } else { breaksL++; diff--; }
      if (diff < 0) trailed = true;
    }
    if (g.playerWon) gp++; else go++;
  }
  const opts = [];
  if (lSetPts > 0) {
    const n = count(lSetPts, "balle de set", "balles de set");
    opts.push(L + " a pourtant eu " + n + " dans cette manche", "Et dire que " + L + " a eu " + n + "…");
  }
  if (trailed) {
    opts.push(W + " a pourtant été mené d'un break dans cette manche", "Belle réaction de " + W + ", qui avait concédé un break dans cette manche");
  }
  if (breaksW + breaksL === 0 && ctx.isTiebreak) {
    opts.push("Aucun break dans cette manche : chacun a tenu son service jusqu'au tie-break");
  }
  if (breaksW + breaksL >= 4) {
    opts.push("Une manche décousue, avec " + (breaksW + breaksL) + " breaks au total");
  }
  if (wSetPts >= 3 && !ctx.isTiebreak) {
    opts.push("Il a tout de même fallu " + count(wSetPts, "balle de set", "balles de set") + " à " + W + " pour conclure");
  }
  if (!opts.length) return null;
  return pickFresh(opts, "setfact") + ".";
}

// Comment le set a été conclu, du point de vue de son vainqueur
// (« sur un break », « au tie-break (7-5) », « sur un ace »…).
export function setCloseHow(result, pName, oName, log = []) {
  const pWon = !!result.setWonByPlayer;
  const L = pWon ? oName : pName;
  const r1 = random(), r2 = random();
  const choose = (list) => list[Math.floor(r2 * list.length)];
  if (result.isTiebreak) {
    const l = result.tbScore ?? 0;
    const w = Math.max(result.tbTarget || 7, l + 2);
    return choose(["au tie-break (" + w + "-" + l + ")", "au jeu décisif (" + w + "-" + l + ")", "dans le tie-break (" + w + "-" + l + ")"]);
  }
  const g = analyzeGame(result.points || [], !!result.isPlayerServing);
  const brk = !g.serverWon;
  const specific = [];
  if (brk) {
    if (g.love) specific.push("sur un break blanc");
    if (g.last?.kind === "winner" || g.last?.kind === "ace") specific.push("sur un retour gagnant", "d'un coup gagnant en retour");
    if (g.last?.kind === "error") specific.push("sur une faute de " + L);
    if (g.bp >= 3) specific.push("à la " + ORD_F[g.bp - 1] + " balle de break");
  } else {
    if (g.love) specific.push("sur un jeu blanc");
    if (g.last?.kind === "ace") specific.push("sur un ace", "d'un ace");
    if (g.bp > 0) specific.push("en sauvant " + count(g.bp, "balle de break", "balles de break") + " au passage");
  }
  const earlierBreak = (log || []).slice(0, -1).some(x => !x.isTiebreak && x.playerWon === pWon && x.isPlayerServing !== pWon);
  const generic = brk
    ? ["sur un break", "en prenant le service de " + L, ...(earlierBreak ? ["en breakant une dernière fois"] : [])]
    : ["sur son service", "sur sa mise en jeu", "en tenant son engagement"];
  return choose(specific.length && r1 < 0.6 ? specific : generic);
}

// Remarques sur la forme du jour (après quelques jeux).
export function formRemarks(playerForm, oppForm, pName, oName) {
  const out = [];
  const vars = { p: pName, o: oName };
  if (playerForm >= 4) out.push(fill(pickFresh(FORM_REMARKS.p_good, "form"), vars));
  else if (playerForm <= -4) out.push(fill(pickFresh(FORM_REMARKS.p_bad, "form"), vars));
  if (oppForm >= 4) out.push(fill(pickFresh(FORM_REMARKS.o_good, "form"), vars));
  else if (oppForm <= -4) out.push(fill(pickFresh(FORM_REMARKS.o_bad, "form"), vars));
  return out;
}

// ─── DÉBRIEF DE FIN DE MATCH ─────────────────────────────────────────────────
// Lit tout le match point par point : breaks, balles de break, balles de set
// et de match, aces, séries de jeux, tie-breaks, durée estimée.
export function analyzeMatch(matchData) {
  const bo5 = !!matchData.isGrandSlam;
  const setsToWin = bo5 ? 3 : 2;
  const sets = (matchData.sets || []).filter(s => s.completed);
  const side = (isP) => (isP ? "p" : "o");
  const st = {
    p: { aces: 0, pts: 0, bpOpp: 0, bpWon: 0, bpFaced: 0, servesLost: 0, mp: 0, tbWon: 0 },
    o: { aces: 0, pts: 0, bpOpp: 0, bpWon: 0, bpFaced: 0, servesLost: 0, mp: 0, tbWon: 0 },
  };
  let seconds = 0, totalGames = 0, deuceGames = 0;
  let bestRun = { side: null, len: 0, set: 0, startSet: 0 }, run = { side: null, len: 0, startSet: 0 };
  const tbs = [];
  let pS = 0, oS = 0;
  const other = (x) => (x === "p" ? "o" : "p");
  sets.forEach((s, si) => {
    totalGames += s.pGames + s.oGames;
    let gp = 0, go = 0;
    const decider = si === setsToWin * 2 - 2;
    const tbTarget = decider && (bo5 || matchData.tb10Decider) ? 10 : 7;
    const atSetsPoint = (x) => (x === "p" ? pS : oS) === setsToWin - 1;
    (s.gameLog || []).forEach((g, gi) => {
      const winner = g.playerWon ? "p" : "o";
      if (run.side === winner) run.len++; else run = { side: winner, len: 1, startSet: si };
      if (run.len > bestRun.len) bestRun = { side: winner, len: run.len, set: si, startSet: run.startSet };
      if (gi > 0 && gi % 2 === 1) seconds += 90; // changement de côté
      if (g.isTiebreak) {
        const pts = (g.tb && g.tb.points) || [];
        let tp = 0, to = 0;
        pts.forEach(pt => {
          for (const x of ["p", "o"]) {
            const mine = x === "p" ? tp : to, theirs = x === "p" ? to : tp;
            if (mine + 1 >= tbTarget && mine + 1 - theirs >= 2 && atSetsPoint(x)) st[x].mp++;
          }
          st[pt.winner].pts++;
          if (pt.kind === "ace" && side(pt.servingPlayer) === pt.winner) st[pt.winner].aces++;
          seconds += 25 + (pt.rallies || 3) * 1.4;
          if (pt.winner === "p") tp++; else to++;
        });
        const tb = g.tb || {};
        tbs.push({ set: si, w: winner, hi: Math.max(tb.pPts || 0, tb.oPts || 0), lo: Math.min(tb.pPts || 0, tb.oPts || 0) });
        st[winner].tbWon++;
        return;
      }
      const server = side(g.isPlayerServing), recv = other(server);
      let sv = 0, rv = 0, sawDeuce = false;
      (g.points || []).forEach(pt => {
        if (rv >= 3 && rv - sv >= 1) { st[recv].bpOpp++; st[server].bpFaced++; }
        for (const x of ["p", "o"]) {
          const mine = x === server ? sv : rv, theirs = x === server ? rv : sv;
          const gx = x === "p" ? gp : go, gy = x === "p" ? go : gp;
          if (mine >= 3 && mine - theirs >= 1 && ((gx + 1 >= 6 && gx + 1 - gy >= 2) || gx + 1 === 7) && atSetsPoint(x)) st[x].mp++;
        }
        st[pt.winner].pts++;
        if (pt.kind === "ace" && pt.winner === server) st[server].aces++;
        seconds += 25 + (pt.rallies || 3) * 1.4;
        if (pt.winner === server) sv++; else rv++;
        if (sv >= 3 && sv === rv) sawDeuce = true;
      });
      if (sawDeuce) deuceGames++;
      if (winner === recv) { st[recv].bpWon++; st[server].servesLost++; }
      if (g.playerWon) gp++; else go++;
    });
    if (s.winner === "p") pS++; else oS++;
    seconds += 120; // pause entre les sets
  });
  return { bo5, setsToWin, sets, st, minutes: Math.round(seconds / 60), totalGames, deuceGames, bestRun, tbs };
}

function durationText(min) {
  if (min < 60) return min + " minutes";
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? h + (h > 1 ? " heures" : " heure") : h + " h " + String(m).padStart(2, "0");
}
const nw = (n, fem = true) => (fem ? NUM_F : NUM_M)[n] ?? String(n);
// « à » + groupe nominal : au, aux, à la.
const toA = (gn) => gn.replace(/^le /, "au ").replace(/^les /, "aux ").replace(/^la /, "à la ");
const cityPhrase = (city) => !city ? "" : /^Le /.test(city) ? "au " + city.slice(3) : /^Les /.test(city) ? "aux " + city.slice(4) : "à " + city;
// Tour suivant, en complément : « les quarts de finale », « la finale »…
const NEXT_ROUND = {
  "2e tour": "le deuxième tour", "3e tour": "le troisième tour", "8es de finale": "les huitièmes de finale",
  "Quarts": "les quarts de finale", "Demies": "les demi-finales", "Demi-finale": "les demi-finales", "Finale": "la finale",
};

// Débrief des commentateurs : un court récit (2 à 4 phrases) bâti sur les
// faits du match. ctx (facultatif) : { roundIdx, qualifying, qualiRounds,
// mainRounds, city, oppRank }.
export function pickDebrief(matchData, playerName, oppName, ctx = {}) {
  const P = playerName, O = oppName;
  const A = analyzeMatch(matchData);
  const { sets, st, bo5, setsToWin } = A;
  const nSets = sets.length;
  if (!nSets) return "";
  const won = matchData.pSets > matchData.oSets;
  const ws = won ? "p" : "o", ls = won ? "o" : "p";
  const W = won ? P : O, L = won ? O : P;
  const nameOf = (x) => (x === "p" ? P : O);
  const pick = (list, tag) => pickFresh(list, "deb:" + tag);

  // Score côté vainqueur : « 6-4 3-6 7-6(5) ».
  const scoreLine = sets.map(s => {
    const a = won ? s.pGames : s.oGames, b = won ? s.oGames : s.pGames;
    const tb = s.tiebreak ? "(" + Math.min(s.tiebreak.pPts, s.tiebreak.oPts) + ")" : "";
    return a + "-" + b + tb;
  }).join(" ");

  // Contexte du tour.
  const roundLabel = ctx.qualifying ? (ctx.roundIdx != null ? "Qualif. " + (ctx.roundIdx + 1) : "")
    : (ctx.mainRounds && ctx.roundIdx != null ? ctx.mainRounds[ctx.roundIdx] : "");
  const roundPh = roundLabel ? roundPhrase(roundLabel) : "";
  const stage = [roundPh, cityPhrase(ctx.city)].filter(Boolean).join(" ");
  const st_ = stage ? " " + stage : "";
  const isFinal = roundLabel === "Finale";
  let nextRound = null;
  if (won && !isFinal && roundLabel && !/^Poules/.test(roundLabel)) {
    if (ctx.qualifying) nextRound = ctx.roundIdx + 1 >= (ctx.qualiRounds || 0) ? "le tableau principal" : "le dernier tour des qualifications";
    else nextRound = NEXT_ROUND[ctx.mainRounds?.[ctx.roundIdx + 1]] || null;
    if (ctx.qualifying && ctx.roundIdx + 2 < (ctx.qualiRounds || 0)) nextRound = "le tour suivant des qualifications";
  }

  // ─── Faits ────────────────────────────────────────────────────────────
  const dur = durationText(A.minutes);
  const firstSetW = sets[0].winner;
  const comeback = firstSetW !== ws;
  const twoSetsDown = bo5 && sets[0].winner === ls && sets[1]?.winner === ls;
  const deciderPlayed = nSets === setsToWin * 2 - 1;
  const straight = nSets === setsToWin;
  const last = sets[nSets - 1];
  const deciderTb = deciderPlayed && !!last.tiebreak;
  const mpSaved = st[ls].mp;               // balles de match de L, toutes sauvées
  const mpUsed = st[ws].mp;                // balles de match nécessaires à W
  const long = A.totalGames >= (bo5 ? 44 : 30) || A.minutes >= (bo5 ? 210 : 140);
  const lGames = sets.reduce((n, s) => n + (won ? s.oGames : s.pGames), 0);
  const rout = straight && lGames <= (bo5 ? 8 : 5);
  const calm = !A.tbs.length && st[ws].servesLost <= 1;
  const tightSets = sets.filter(s => s.tiebreak || Math.abs(s.pGames - s.oGames) <= 2).length;
  const tightStraight = straight && tightSets >= 2;
  const ptsW = st[ws].pts, ptsL = st[ls].pts, ptsAll = ptsW + ptsL;
  const pctW = ptsAll ? Math.round(ptsW / ptsAll * 100) : 50;
  const nSetsWords = NUM_M[nSets];

  // Break décisif du dernier set (le dernier break de W, sans réponse de L).
  let decisive = null;
  if (deciderPlayed && !last.tiebreak) {
    let pg = 0, og = 0;
    const games = (last.gameLog || []).filter(g => !g.isTiebreak);
    games.forEach((g, gi) => {
      const brk = g.isPlayerServing !== g.playerWon;
      if (brk) {
        const byW = (g.playerWon ? "p" : "o") === ws;
        decisive = byW ? { a: won ? pg : og, b: won ? og : pg, last: gi === games.length - 1 } : null;
      }
      if (g.playerWon) pg++; else og++;
    });
  }
  const bagel = sets.findIndex(s => Math.min(s.pGames, s.oGames) === 0);
  const longTb = A.tbs.find(t => t.hi >= (t.hi >= 10 ? 13 : 10) || (t.hi >= 9 && t.lo >= 7));

  // ─── 1. L'attaque : la forme du match ──────────────────────────────────
  const used = new Set();
  let story, lede;
  const mpTxt = count(mpSaved, "balle de match", "balles de match");
  if (mpSaved > 0) {
    story = "mp"; used.add("mp");
    lede = pick([
      `${W} revient de très loin : ${L} a eu ${mpTxt} avant de s'incliner ${scoreLine}.`,
      `Quel retournement ! Face à ${mpTxt}, ${W} n'a jamais lâché et finit par renverser ${L}, ${scoreLine}.`,
      `${W} a sauvé ${mpTxt} avant de s'imposer${st_} face à ${L}, ${scoreLine}.`,
      `On croyait l'affaire entendue, ${L} a même eu ${mpTxt}, mais c'est bien ${W} qui l'emporte ${scoreLine}.`,
    ], "mp");
  } else if (twoSetsDown) {
    story = "comeback2"; used.add("comeback");
    lede = pick([
      `${W} a été mené deux sets à rien, et pourtant la victoire est au bout : ${scoreLine} face à ${L}.`,
      `Deux sets de retard, et au bout du compte une victoire : ${W} a renversé ${L}${st_}, ${scoreLine}.`,
      `Remontée spectaculaire de ${W}, qui a effacé un handicap de deux manches face à ${L} : ${scoreLine}.`,
    ], "cb2");
  } else if (comeback) {
    story = "comeback"; used.add("comeback");
    lede = pick([
      `${W} a perdu la première manche, puis tout renversé : victoire ${scoreLine} face à ${L}${st_}.`,
      `Mené d'un set, ${W} a trouvé les ressources pour renverser ${L}, ${scoreLine}.`,
      `Après un premier set raté, ${W} a pris le dessus sur ${L} pour s'imposer ${scoreLine}.`,
      `${L} avait idéalement lancé son match, mais c'est ${W} qui a fini le plus fort : ${scoreLine}.`,
      `Victoire à l'envers pour ${W}${st_} : premier set perdu, puis la remontée face à ${L}, ${scoreLine}.`,
    ], "cb");
  } else if (deciderTb) {
    story = "decTb"; used.add("decTb");
    lede = pick([
      `Il a fallu un jeu décisif dans la dernière manche pour départager ${W} et ${L} : ${scoreLine}.`,
      `Au bout du suspense, ${W} s'impose au tie-break du set décisif face à ${L}, ${scoreLine}.`,
      `${W} et ${L} n'ont pas pu se départager avant le tie-break final, remporté par ${W} : ${scoreLine}.`,
    ], "dtb");
  } else if (long) {
    story = "long"; used.add("dur");
    lede = pick([
      `${W} a eu le dernier mot face à ${L} au terme d'un marathon de ${dur} : ${scoreLine}.`,
      `${A.totalGames} jeux, ${dur} de combat, et au bout ${W} : ${scoreLine} face à ${L}.`,
      `Match fleuve${st_} : ${W} s'impose ${scoreLine} après ${dur} d'une bataille usante.`,
      `Il aura fallu ${dur} à ${W} pour venir à bout de ${L}, ${scoreLine}.`,
    ], "long");
  } else if (rout) {
    story = "rout"; used.add("dur");
    lede = pick([
      `${W} n'a pas fait de détail${st_} : ${scoreLine} face à ${L}, en ${dur}.`,
      `Démonstration de ${W}, qui expédie ${L} ${scoreLine} en ${dur}.`,
      `Pas de suspense${st_} : ${W} a déroulé face à ${L}, ${scoreLine}.`,
      `Victoire express pour ${W}, ${scoreLine}, et ${L} n'a jamais trouvé la faille.`,
      `En ${dur}, l'affaire était pliée : ${W} domine ${L} ${scoreLine}.`,
    ], "rout");
  } else if (tightStraight) {
    story = "tight";
    lede = pick([
      `${W} s'impose en ${nSetsWords} manches, ${scoreLine}, mais le score cache un vrai combat.`,
      `Pas de set perdu pour ${W}, et pourtant ${L} a vendu chèrement sa peau : ${scoreLine}.`,
      tightSets === nSets ? `Victoire en ${nSetsWords} sets serrés pour ${W}${st_}, ${scoreLine} face à ${L}.` : `${W} passe${st_} en ${nSetsWords} manches, ${scoreLine}, mais ${L} a longtemps fait jeu égal.`,
      `${W} écarte ${L} ${scoreLine}, au terme de manches bien plus disputées que ne le dit le score.`,
    ], "tight");
  } else if (!straight && !deciderPlayed) {
    story = "dropped";
    const lostIdx = sets.findIndex(s => s.winner === ls);
    lede = pick([
      `${W} a lâché ${lostIdx >= 0 ? "le " + ord(lostIdx) + " set" : "un set"} en route, mais s'impose en ${nSetsWords} manches face à ${L} : ${scoreLine}.`,
      `${W} écarte ${L}${st_} en ${nSetsWords} sets, ${scoreLine}, malgré une manche égarée.`,
      `Un set de perdu, mais l'essentiel est assuré pour ${W} : ${scoreLine} face à ${L}.`,
      `${L} a réussi à prendre une manche, pas davantage : ${W} s'impose ${scoreLine}.`,
    ], "drop");
  } else if (deciderPlayed) {
    story = "decider";
    lede = pick([
      `${W} a dû passer par une manche décisive pour écarter ${L} : ${scoreLine}.`,
      `Il a fallu ${nSetsWords} sets à ${W} pour se défaire de ${L}${st_} : ${scoreLine}.`,
      `${W} a laissé filer une manche en route, mais a fini par s'imposer face à ${L}, ${scoreLine}.`,
      `${bo5 ? "Deux sets" : "Un set"} partout, et puis ${W} a fait la différence dans la dernière manche : ${scoreLine} face à ${L}.`,
    ], "dec");
  } else {
    story = "routine";
    lede = pick([
      calm ? `${W} s'impose ${scoreLine} face à ${L}${st_}, sans jamais vraiment trembler.` : `${W} s'impose ${scoreLine} face à ${L}${st_}, avec du métier quand il le fallait.`,
      `Victoire nette de ${W}${st_} : ${scoreLine} face à ${L}.`,
      `Le contrat est rempli pour ${W}, qui écarte ${L} ${scoreLine}.`,
      `${W} a imposé son rythme à ${L} : ${scoreLine}.`,
      `${W} prend le meilleur sur ${L}${st_}, ${scoreLine}, avec beaucoup de maîtrise.`,
    ], "rtn");
  }

  // ─── 2. Le tournant ──────────────────────────────────────────────────────
  const turns = [];
  if (decisive && !used.has("decTb")) {
    const at = decisive.a + decisive.b === 0 ? "d'entrée" : "à " + decisive.a + "-" + decisive.b;
    turns.push({ k: "decisive", w: 10, t: decisive.last ? pick([
      `${W} a conclu sur le service adverse, en breakant ${at} dans la dernière manche.`,
      `Le dénouement est tombé au tout dernier jeu : break de ${W} ${at} dans le set décisif.`,
      `Dans l'ultime manche, ${L} a cédé sa mise en jeu au pire moment, à ${decisive.b}-${decisive.a}.`,
    ], "dbrkL") : pick([
      `Le tournant ? Un break de ${W} ${at} dans la dernière manche, que ${L} n'a jamais pu effacer.`,
      `Tout s'est joué sur un break ${at} dans le set décisif.`,
      `${W} a fait la différence en breakant ${at} dans l'ultime manche.`,
      `Dans le dernier set, le break est tombé ${at}, et ${W} n'a plus rien lâché.`,
    ], "dbrk") });
  }
  if (deciderTb && story !== "decTb") {
    turns.push({ k: "decTb", w: 9, t: `Le dernier set s'est même terminé au tie-break, ${last.tiebreak ? Math.max(last.tiebreak.pPts, last.tiebreak.oPts) + "-" + Math.min(last.tiebreak.pPts, last.tiebreak.oPts) : ""} pour ${W}.` });
  }
  if (mpUsed >= 3 && !used.has("mp")) {
    turns.push({ k: "mpUsed", w: 7, t: pick([
      `Il a tout de même fallu ${count(mpUsed, "balle de match", "balles de match")} à ${W} pour conclure.`,
      `${W} a tremblé au moment de conclure : ${count(mpUsed, "balle de match", "balles de match")} avant la bonne.`,
    ], "mpu") });
  }
  if (A.bestRun.len >= (rout ? 7 : 5)) {
    const nRun = NUM_M[A.bestRun.len] || String(A.bestRun.len);
    const R = nameOf(A.bestRun.side);
    const where = A.bestRun.startSet === A.bestRun.set
      ? "dans le " + ord(A.bestRun.set) + " set"
      : A.bestRun.set - A.bestRun.startSet === 1
        ? "à cheval sur le " + ord(A.bestRun.startSet) + " et le " + ord(A.bestRun.set) + " set"
        : "du " + ord(A.bestRun.startSet) + " au " + ord(A.bestRun.set) + " set";
    const byW = A.bestRun.side === ws;
    turns.push({ k: "run", w: byW ? 8 : 6, t: byW ? pick([
      `${R} a fait le trou en alignant ${nRun} jeux d'affilée ${where}.`,
      `Le moment clé : une série de ${nRun} jeux consécutifs de ${R} ${where}.`,
      `${cap(nRun)} jeux de suite pour ${R} ${where} : c'est là que le match a basculé.`,
      `Le match a basculé ${where}, quand ${R} a enchaîné ${nRun} jeux.`,
    ], "runW") : pick([
      `${R} a bien aligné ${nRun} jeux d'affilée ${where}, mais sans parvenir à inverser la tendance.`,
      `La série de ${nRun} jeux de ${R} ${where} n'aura pas suffi.`,
    ], "runL") });
  }
  if (A.tbs.length >= 2 && !used.has("decTb")) {
    const k = A.tbs.filter(t => t.w === ws).length;
    turns.push({ k: "tbs", w: 6, t: `${cap(count(A.tbs.length, "tie-break", "tie-breaks", false))} dans ce match, et ${W} en a remporté ${k === A.tbs.length ? (A.tbs.length === 2 ? "les deux" : "tous") : NUM_M[k]}.` });
  } else if (A.tbs.length === 1 && !deciderTb) {
    const t = A.tbs[0];
    const tw = nameOf(t.w);
    turns.push({ k: "tb", w: 5, t: pick(t.w === ws ? [
      `Le jeu décisif du ${ord(t.set)} set, remporté ${t.hi}-${t.lo} par ${tw}, a pesé lourd.`,
      `${tw} a su faire la différence au tie-break du ${ord(t.set)} set, ${t.hi}-${t.lo}.`,
    ] : [
      `${tw} avait pourtant enlevé le tie-break du ${ord(t.set)} set, ${t.hi}-${t.lo}.`,
    ], "tb1") });
  }
  if (longTb) {
    turns.push({ k: "longTb", w: 5, t: `Le tie-break du ${ord(longTb.set)} set s'est éternisé jusqu'à ${longTb.hi}-${longTb.lo}.` });
  }
  if (bagel >= 0 && story !== "rout") {
    const bw = nameOf(sets[bagel].winner);
    turns.push({ k: "bagel", w: 4, t: pick([
      `${bw} a même infligé un 6-0 dans le ${ord(bagel)} set.`,
      `Le ${ord(bagel)} set s'est terminé sur un sec 6-0 en faveur de ${bw}.`,
    ], "bag") });
  }
  if (story === "decider" && !decisive) {
    const lostIdx = sets.findIndex(s => s.winner === ls);
    if (lostIdx >= 0) turns.push({ k: "lostSet", w: 3, t: `${W} s'est fait surprendre dans le ${ord(lostIdx)} set, avant de reprendre les commandes.` });
  }
  turns.sort((x, y) => y.w - x.w);
  const turn = turns[0] || null;
  if (turn) used.add(turn.k);

  // ─── 3. Les chiffres ─────────────────────────────────────────────────────
  const stats = [];
  const sW = st[ws], sL = st[ls];
  if (sW.servesLost === 0) {
    stats.push(sW.bpFaced === 0
      ? pick([`Au service, ${W} n'a pas concédé la moindre balle de break.`, `${W} n'a pas offert une seule balle de break de tout le match.`], "s0")
      : pick([
        `${W} n'a jamais perdu son service, en sauvant ${sW.bpFaced === 1 ? "la seule balle de break concédée" : "les " + nw(sW.bpFaced) + " balles de break concédées"}.`,
        `Solide sur sa mise en jeu, ${W} a écarté ${sW.bpFaced === 1 ? "l'unique balle de break offerte" : "les " + count(sW.bpFaced, "balle de break", "balles de break") + " offertes"} à ${L}.`,
      ], "s1"));
  }
  if (sL.bpOpp >= 3 && sL.bpWon <= sL.bpOpp / 4) {
    stats.push(sL.bpWon === 0
      ? pick([`${L} a obtenu ${count(sL.bpOpp, "balle de break", "balles de break")}, sans en convertir une seule.`, `${cap(count(sL.bpOpp, "balle de break", "balles de break"))} pour ${L}, et aucune convertie : tout est là.`], "bpL")
      : `${L} n'a converti ${sL.bpWon === 1 ? "qu'une" : "que " + nw(sL.bpWon)} de ses ${nw(sL.bpOpp)} balles de break.`);
  }
  if (sW.bpOpp >= 4) {
    stats.push(pick([
      `${W} a converti ${nw(sW.bpWon)} de ses ${nw(sW.bpOpp)} balles de break.`,
      `${cap(nw(sW.bpWon, false))} break${sW.bpWon > 1 ? "s" : ""} sur ${nw(sW.bpOpp)} occasions pour ${W}.`,
    ], "bpW"));
  }
  const aceMin = bo5 ? 12 : 8;
  if (sW.aces >= aceMin) stats.push(pick([`${W} a pu compter sur son service, avec ${sW.aces} aces.`, `${sW.aces} aces pour ${W}, un vrai bouclier.`], "aceW"));
  if (sL.aces >= aceMin) stats.push(`${L} a bien frappé ${sL.aces} aces, mais cela n'a pas suffi.`);
  if (ptsL > ptsW) stats.push(pick([`Fait rare : ${L} a gagné plus de points (${ptsL} contre ${ptsW}), mais ${W} a remporté les plus importants.`, `${W} a pourtant marqué moins de points que ${L}, ${ptsW} contre ${ptsL} : un succès arraché sur les points qui comptent.`], "pts"));
  else if (pctW >= 62 && story !== "rout") stats.push(`${W} a remporté ${pctW} % des points disputés.`);
  if (!used.has("dur") && (A.minutes >= (bo5 ? 180 : 120) || A.minutes <= (bo5 ? 100 : 65))) {
    stats.push(A.minutes >= (bo5 ? 180 : 120) ? `Le tout en ${dur} de jeu.` : `Le tout bouclé en ${dur}.`);
  }
  const stat = stats.length ? pick(stats, "stat") : null;

  // ─── 4. Le mot de la fin, côté joueur ────────────────────────────────────
  const tired = (matchData.playerEnergy ?? 60) < 25;
  const closings = [];
  if (won) {
    if (isFinal) closings.push(pick([`Le titre est pour ${P}${ctx.city ? ", " + cityPhrase(ctx.city) : ""}.`, `${P} soulève le trophée.`, `Un titre au bout de la semaine pour ${P}.`], "title"));
    else if (nextRound) closings.push(pick([`Prochaine étape pour ${P} : ${nextRound}.`, `${P} file vers ${nextRound}.`, `Place maintenant ${toA(nextRound)} pour ${P}.`, `${P} rejoint ${nextRound}.`], "next"));
    if (tired) closings.push(pick([`Attention à la récupération : ${P} a fini sur la réserve.`, `${P} a laissé beaucoup d'énergie dans la bataille, il faudra récupérer vite.`], "tiredW"));
  } else {
    if (tired) closings.push(pick([`${P} a terminé à bout de forces.`, `Physiquement, ${P} était dans le rouge en fin de match.`], "tiredL"));
    if (comeback && !used.has("comeback")) closings.push(`${P} avait pourtant pris le premier set : les regrets seront là.`);
    else if (rout) closings.push(pick([`Journée à oublier pour ${P}, qui devra vite tourner la page.`, `Une leçon à digérer vite pour ${P}.`, `${P} devra vite passer à autre chose.`], "routL"));
    else if (story === "mp" || story === "decTb" || tightStraight || deciderPlayed) closings.push(pick([`${P} peut nourrir des regrets.`, `${P} n'a pas démérité, mais ${O} a mieux négocié les points importants.`, `Une défaite qui laissera des traces chez ${P}, tant la victoire était proche.`], "closeL"));
    else if (ctx.oppRank && ctx.oppRank <= 20) closings.push(pick([`Face au ${ctx.oppRank}e mondial, la marche était haute pour ${P}.`, `${O} (${ctx.oppRank}e mondial) a rappelé son rang.`], "rankL"));
    if (isFinal) closings.push(`${P} échoue en finale, mais la semaine reste belle.`);
  }
  const closing = closings.length ? closings[Math.floor(random() * closings.length)] : null;

  // Assemblage : 2 à 4 phrases, jamais deux fois le même fait. Deux phrases
  // de suite ne commencent pas par le même nom : on glisse une transition.
  const parts = [lede];
  const add = (t, links) => {
    if (!t) return;
    const prev = parts[parts.length - 1];
    const startName = (x) => (x.startsWith(P) ? P : x.startsWith(O) ? O : null);
    const n = startName(t);
    parts.push(n && startName(prev) === n ? pick(links, "link") + t : t);
  };
  if (turn) add(turn.t, ["Surtout, ", "Et puis, ", "D'ailleurs, ", "Il faut dire que "]);
  if (stat && parts.length < 3) add(stat, ["Côté chiffres, ", "Dans les statistiques, ", "Sur l'ensemble du match, ", "En chiffres : "]);
  if (closing && parts.length < 4) add(closing, won ? ["Pour la suite, ", "Désormais, ", "Et maintenant, "] : ["Au bout du compte, ", "Pour la suite, ", "Reste que "]);
  if (parts.length < 2) parts.push(won ? `${W} a su rester solide dans les moments importants.` : `${P} a manqué de réussite dans les moments clés.`);
  return parts.join(" ");
}

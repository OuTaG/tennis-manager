// Composant principal : état de la partie, semaine, tournois, sauvegarde.
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
} from "lucide-react";
import { PRIZE_SPLITS_V2, TOURNAMENT_FORMATS } from "./data/formats.js";
import { CITIES } from "./data/geo.js";
import { INVESTMENT_PLANS, LIFE_EVENTS } from "./data/life.js";
import { PLAYER_STYLES } from "./data/staff.js";
import { CHALLENGE_SLOT, MEDAL_INFO, challengeActive, challengeTallyWeek, evaluateChallenge, getChallengeDef, getEventById, pickChallengeEvent, saveChallengeResult, setActiveChallenge } from "./engine/challenges.js";
import { ALL_TOURNAMENTS, getEntryStatus, getPointSplits, getSeedCount, getTournamentFormat, getTournamentLore, isBestOfFiveMatch, isWTA, playerHasBye, setCircuit, setPlayerRaceRank, tierColor, tierLabel, tournamentAbsWeek } from "./engine/circuit.js";
import { pickComment, pickDebrief } from "./engine/commentary.js";
import { generateAtpDatabase, getPlayerProfile, getRating, pickOpponentForMatch } from "./engine/database.js";
import { MATCH_FIX_DILEMMA, pickRandomDilemma, resolveDilemmaOption } from "./engine/dilemmas.js";
import { feminizeText } from "./engine/feminize.js";
import { tournamentEarningsFromHistory, tournamentIdByName } from "./engine/history.js";
import { computeCareerSummary, computeLegacyBreakdown, computeLegacyScore, legacyTier } from "./engine/legacy.js";
import { advanceMatchOneGame, aiMatchProb, clampMomentum, createInitialMatchData } from "./engine/match.js";
import { randomFullName } from "./engine/names.js";
import { RETIREMENT_AGE, START_CITIES, START_STAT_BONUS, adjustLife, ageTrainingMultiplier, applyWeeklyAgeDecline, clampLife, computeMatchLifeDeltas, createInitialPlayer, difficultyFactors, getEffectiveStats, getPlayerRanking, lifeCaps, rollInjury, startMoney, totalAtpPoints } from "./engine/player.js";
import { buildPressConference } from "./engine/press.js";
import { computeTournamentProgression, styledProgressionMultiplier } from "./engine/progression.js";
import { expireOldPoints, playerRaceRank, pointsWeekAfter, raceStandings } from "./engine/race.js";
import { updateCareerRecords } from "./engine/records.js";
import { FINALS_PRIZE, FINALS_PTS, RR_SCHEDULE, buildFinalsDraw, finalizeHumanTournamentBracket, finalsAiMatch, finalsAiResults, finalsPlayMatchday, finalsRanked, generateTournamentArticle, simulateAtpWeek } from "./engine/simulation.js";
import { SOCIAL_AUTHORS, generateAuxSocialPosts, generatePersonalSocialPost, generateWeeklyPersonalPosts, pickRandom, randomLikes } from "./engine/social.js";
import { SPONSOR_BRANDS, SPONSOR_CAPS, WC_CRITERIA, evaluateSponsorObjective, generateSponsorOffer, getRecentPerfBonus, getSponsorTierForRanking, getWildcardPerfBonus, sponsorCancelBreakdownFor } from "./engine/sponsors.js";
import { staffTrainEnergyExtra, sumStaffEffect } from "./engine/staff.js";
import { hasPurchased, loadChallengeMeta, loadSlotMetas, saveKeyFor, slotMetaKeyFor, writeSlotMeta } from "./engine/storage.js";
import { distanceKm, travelCostBetween } from "./engine/travel.js";
import { RARITY, RARITY_REWARD, TROPHIES, TROPHY_CATEGORIES, checkTrophies } from "./engine/trophies.js";
import { AVATAR_OPTIONS, Avatar, AvatarBuilder, avatarTone, femaleHairStyle } from "./ui/avatar.jsx";
import { rankingName } from "./ui/format.js";
import { FlagFromEmoji, Icon, SurfaceIcon, flagEmojiToCode, withFlags } from "./ui/icons.jsx";
import { NAV_GROUPS, PAGE_HELP, navGroupOf } from "./ui/navigation.js";
import { FlightOverlay } from "./ui/overlays/Flight.jsx";
import { SponsorNegotiationOverlay } from "./ui/overlays/Negotiation.jsx";
import { RallyOverlay } from "./ui/overlays/Rally.jsx";
import { TrainingOverlay } from "./ui/overlays/Training.jsx";
import { CalendarScreen } from "./ui/screens/Calendar.jsx";
import { ChallengePanel, ChallengesScreen } from "./ui/screens/Challenges.jsx";
import { FinanceScreen } from "./ui/screens/Finance.jsx";
import { HubScreen } from "./ui/screens/Hub.jsx";
import { LifeScreen } from "./ui/screens/Life.jsx";
import { PrepScreen } from "./ui/screens/Prep.jsx";
import { RankingScreen } from "./ui/screens/Ranking.jsx";
import { RecordsScreen } from "./ui/screens/Records.jsx";
import { ShopScreen } from "./ui/screens/Shop.jsx";
import { SOCIAL_HISTORY_WEEKS, SocialScreen } from "./ui/screens/Social.jsx";
import { StatsScreen } from "./ui/screens/Stats.jsx";
import { TravelScreen } from "./ui/screens/Travel.jsx";
import { styles } from "./ui/styles.js";
import { T, applyTheme } from "./ui/theme.js";
import { getRngState, newSeed, random, setRngState, setSeed } from "./engine/rng.js";
import { DIFFICULTY_LEVELS, GAME_OPTIONS, formatMultiplier, hasGameOption, injuryRiskMul, scoreMultiplier } from "./engine/difficulty.js";

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TennisManager() {
  const [screen, setScreen] = useState("menu");
  const [player, setPlayer] = useState(null);
  const [atpDb, setAtpDb] = useState(null);
  const [news, setNews] = useState([]); // articles
  const [nameInput, setNameInput] = useState("");
  const [styleInput, setStyleInput] = useState("allcourt");
  const [startCityInput, setStartCityInput] = useState("Paris");
  const [difficultyInput, setDifficultyInput] = useState(3);
  const [gameOptionsInput, setGameOptionsInput] = useState([]);
  const [nationalityInput, setNationalityInput] = useState(""); // chosen at step 1
  const [createStep, setCreateStep] = useState(-1); // -1 = circuit, 0 = identity (name+avatar), 1 = profile (style+city)
  const [avatarInput, setAvatarInput] = useState({
    skin: AVATAR_OPTIONS.skin[1],
    hair: AVATAR_OPTIONS.hair[0],
    hairStyle: "short",
    eyes: AVATAR_OPTIONS.eyes[0],
    shirt: AVATAR_OPTIONS.shirt[0],
  });
  const [matchState, setMatchState] = useState(null);
  const [rallyAnim, setRallyAnim] = useState(null); // { points, contextLabel, isTiebreak, commit } during point-by-point animation
  // Match mode: "manual" = one game per click; "auto" = games chain with a
  // short pause, stopping on any event (dilemma, match-fix proposal).
  // Vitesse du match : ×4 pour tous, seule vitesse proposée.
  const matchModeRef = useRef("x4");
  const autoTimerRef = useRef(null);
  // Match speed multiplier on delays: x1 → ×2 (slower), x2/manual → ×1, x4 → ×0.5.
  const speedFactor = () => matchModeRef.current === "x1" ? 2 : matchModeRef.current === "x4" ? 0.5 : 1;
  const playGameRef = useRef(null);
  // Pause du match : les jeux ne s'enchaînent plus tant qu'elle est active.
  const [matchPaused, setMatchPaused] = useState(false);
  const matchPausedRef = useRef(false);
  // Suite du jeu interrompu par la pause (reprise au point près).
  const pausedResumeRef = useRef(null);
  const setPausedBoth = (v) => { matchPausedRef.current = v; setMatchPaused(v); };
  // Démarrage automatique : après le lancement du match, courte pause de
  // préparation puis le premier jeu démarre seul.
  const MATCH_START_DELAY = 2500;
  const [startCountdown, setStartCountdown] = useState(0);
  useEffect(() => {
    const ms = matchState;
    if (!ms || ms.phase !== "live") return;
    const games = ms.matchData.sets.reduce((a, st) => a + st.gameLog.length, 0);
    if (games > 0 || (ms.eventLog || []).length > 0 || ms.matchData.matchComplete) return;
    const total = MATCH_START_DELAY * (matchModeRef.current === "x1" ? 2 : matchModeRef.current === "x4" ? 0.5 : 1);
    const endAt = Date.now() + total;
    setStartCountdown(Math.ceil(total / 1000));
    const tick = setInterval(() => setStartCountdown(Math.max(0, Math.ceil((endAt - Date.now()) / 1000))), 250);
    const id = setTimeout(() => {
      clearInterval(tick);
      setStartCountdown(0);
      if (!matchPausedRef.current && playGameRef.current) playGameRef.current();
    }, total);
    return () => { clearTimeout(id); clearInterval(tick); setStartCountdown(0); };
  }, [matchState?.phase, matchState?.opponent?.id, matchState?.roundIdx, matchState?.mode]);
  const [livePoint, setLivePoint] = useState(null); // { p, o } — current game's running score shown in the scoreboard
  const livePointTimersRef = useRef([]);
  const pendingCommitRef = useRef(null); // function that commits the in-flight simulation immediately
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState("hub");
  const [calFilters, setCalFilters] = useState({ surface: [], tier: [], region: "all" });
  const [atpPage, setAtpPage] = useState(1);
  const [progressionModal, setProgressionModal] = useState(null);
  const [isAdvancingWeek, setIsAdvancingWeek] = useState(false);
  const [tournamentDetail, setTournamentDetail] = useState(null); // tournament ID for detail modal
  const [atpPlayerDetail, setAtpPlayerDetail] = useState(null); // ATP player ID for detail modal
  // Emplacements de carrière : 3 sauvegardes indépendantes. Le 1er est gratuit,
  // les 2 suivants sont débloqués par l'achat « Carrières multiples ».
  const [slot, setSlot] = useState(0); // emplacement de la carrière en cours
  const slotRef = useRef(0);
  useEffect(() => { slotRef.current = slot; }, [slot]);
  const [slotMetas, setSlotMetas] = useState(() => loadSlotMetas());
  const [challengeMeta, setChallengeMeta] = useState(() => loadChallengeMeta());
  const refreshSlots = () => { setSlotMetas(loadSlotMetas()); setChallengeMeta(loadChallengeMeta()); };
  const [menuShop, setMenuShop] = useState(false); // boutique ouverte depuis le menu
  const [circuitInput, setCircuitInput] = useState("atp"); // circuit choisi à la création
  const [confirmDelete, setConfirmDelete] = useState(null); // emplacement à effacer (null = fermé)
  const [confirmCancelSponsor, setConfirmCancelSponsor] = useState(null); // sponsor to confirm cancelling
  const [sponsorReplaceModal, setSponsorReplaceModal] = useState(null); // { offer, candidates: [sponsors of same cat to potentially cancel] }
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const [helpTab, setHelpTab] = useState(null); // tab id whose help is open
  const lastScreenByGroup = useRef({}); // dernier sous-écran ouvert par groupe de navigation
  const [flightAnim, setFlightAnim] = useState(null); // { from, to } during travel animation
  const [trainAnim, setTrainAnim] = useState(null);   // { mod, gain } during a training animation
  const [sponsorNegotiation, setSponsorNegotiation] = useState(null); // { phase, year, results, objMoney }
  const [theme, setTheme] = useState(() => {
    if (typeof localStorage !== "undefined") {
      try { return localStorage.getItem("tm-theme") === "dark" ? "dark" : "light"; } catch (e) {}
    }
    return "dark";
  });

  // ── ATP DB COMPACTION FOR SAVE (Opt A+B) ──────────────────────────────────
  // recentResults: keep only 6 (not 10), and use short field names to reduce size
  // pointsLog: use short field names (y, w, p instead of year, week, pts) and drop 'source'
  const compactAtpDb = (atpDb) => {
    if (!atpDb) return atpDb;
    return atpDb.map(p => ({
      ...p,
      rr: (p.recentResults || []).slice(0, 6).map(r => ({
        t: r.tournament, r: r.roundReached, pr: r.prize, p: r.pts, w: r.isWinner
      })),
      pl: (p.pointsLog || []).map(e => ({ y: e.year, w: e.week, p: e.pts })),
      // Remove originals so they don't get saved
      recentResults: undefined,
      pointsLog: undefined,
    }));
  };
  
  // Decompress back to full format when loading
  const decompactAtpDb = (atpDb) => {
    if (!atpDb) return atpDb;
    return atpDb.map(p => ({
      ...p,
      recentResults: (p.rr || []).map(r => ({
        tournament: r.t, roundReached: r.r, prize: r.pr, pts: r.p, isWinner: r.w,
        // tier/year/week were only used for internal stuff, not displayed, so don't restore them
      })),
      pointsLog: (p.pl || []).map(e => ({ year: e.y, week: e.w, pts: e.p, source: "" })),
      // Remove compacted versions
      rr: undefined,
      pl: undefined,
    }));
  };

  // ── SAVE / LOAD ──────────────────────────────────────────────────────────
  const SAVE_KEY = saveKeyFor(slot);

  // Load on mount
  // Apply light/dark theme to the document and persist the choice.
  // Circuit affiché : celui choisi pendant la création, sinon celui de la
  // carrière chargée. Il pilote l'accent rose et l'accord au féminin.
  const activeCircuit = screen === "create" ? circuitInput : (player?.circuit || "atp");
  useEffect(() => {
    applyTheme(theme, activeCircuit);
    try { localStorage.setItem("tm-theme", theme); } catch (e) {}
  }, [theme, activeCircuit]);

  // Carrière WTA : accorde au féminin tous les textes affichés.
  useEffect(() => {
    if (activeCircuit !== "wta" || typeof document === "undefined") return;
    const fix = (node) => {
      if (node.nodeType === 3) {
        if (node.parentElement && node.parentElement.closest("[data-nofem]")) return;
        const v = node.nodeValue;
        if (v && /[A-Za-zÀ-ÿ]/.test(v)) {
          const n = feminizeText(v);
          if (n !== v) node.nodeValue = n;
        }
      } else if (node.nodeType === 1 && node.tagName !== "SCRIPT" && node.tagName !== "STYLE") {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        let t;
        while ((t = walker.nextNode())) fix(t);
      }
    };
    fix(document.body);
    const obs = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === "characterData") fix(m.target);
        else m.addedNodes.forEach(fix);
      }
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => obs.disconnect();
  }, [activeCircuit]);


  // Save the game — debounced. Serialising `player + atpDb (~1200 entries) +
  // news` is heavy and JSON.stringify blocks the main thread. Writing on
  // every single setState made each click feel sluggish (~1s). We coalesce
  // writes so the save happens ~600 ms after the player stops interacting,
  // and always right before the tab closes (`beforeunload`) as a safety net.
  const saveTimerRef = useRef(null);
  // Tournament in progress between two matches: saved so that the tournament
  // (pending points, next opponent…) survives closing the app. Keyed on the
  // number of matches played so it saves once at the end of each match, not
  // at every game.
  const atPrematch = !!(matchState && matchState.phase === "prematch" && !(matchState.eventLog || []).length);
  // Last "safe point" of the tournament (pre-match screen or between two
  // matches). It is KEPT while a match is being played, so quitting mid-match
  // brings the player back to the start of that match instead of the hub.
  // It is dropped once the tournament is over.
  const lastResumeRef = useRef(null);
  if (matchState && (matchState.pendingNextMatch || atPrematch)) lastResumeRef.current = matchState;
  if (!matchState || (matchState.finalResult && !matchState.pendingNextMatch)) lastResumeRef.current = null;
  const resumeSnapshot = lastResumeRef.current;
  const resumeKey = resumeSnapshot
    ? (resumeSnapshot.pendingNextMatch ? "next:" : "pre:") + (resumeSnapshot.tournMatchesPlayed || []).length + ":" + (resumeSnapshot.tournament?.id || "")
    : "none";
  useEffect(() => {
    if (!player || !atpDb || screen === "menu" || screen === "create") return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const data = {
          player,
          atpDb: compactAtpDb(atpDb),
          news,
          resume: resumeSnapshot,
          rng: getRngState(),
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        writeSlotMeta(slot, player, atpDb);
      } catch (e) {
        console.warn("Save failed:", e);
      }
      updateCareerRecords(player, atpDb);
    }, 300);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, atpDb, news, screen, resumeKey, slot]);

  // Flush any pending save when the tab is about to close.
  // Listeners are registered once; the latest state is read from a ref.
  const saveDataRef = useRef({ player: null, atpDb: null, news: null, resume: null });
  useEffect(() => {
    saveDataRef.current = { player, atpDb, news, resume: resumeSnapshot };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, atpDb, news, resumeKey]);

  useEffect(() => {
    const flush = () => {
      const { player, atpDb, news, resume } = saveDataRef.current;
      if (!saveTimerRef.current || !player || !atpDb) return;
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      try {
        localStorage.setItem(saveKeyFor(slotRef.current), JSON.stringify({
          player, atpDb: compactAtpDb(atpDb), news, resume: resume || null, rng: getRngState(), savedAt: new Date().toISOString(),
        }));
        writeSlotMeta(slotRef.current, player, atpDb);
      } catch (e) {}
    };
    const onVis = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Défi : objectif atteint, échéance dépassée ou condition d'échec.
  useEffect(() => {
    if (!player || !atpDb || !player.challenge || player.challenge.status !== "active") return;
    if (screen !== "hub" || !player.challenge.introSeen) return;
    const res = evaluateChallenge(player, atpDb);
    if (!res) return;
    saveChallengeResult(player.challenge.id, res, player);
    setPlayer(p => ({ ...p, challenge: { ...p.challenge, status: res.status, result: res, resultSeen: false } }));
  }, [player, atpDb, screen]);

  // Trophy detection: check on relevant player changes; notify on new unlocks.
  useEffect(() => {
    if (!player) return;
    const prev = new Set(player.trophies || []);
    const newly = checkTrophies(player, prev);
    if (newly.length > 0) {
      setPlayer(p => ({
        ...p,
        trophies: [...(p.trophies || []), ...newly.map(t => t.id)],
        unseenTrophies: (p.unseenTrophies || 0) + newly.length,
      }));
      newly.forEach((t, i) => {
        setTimeout(() => notify("Trophée débloqué : " + t.name, "success"), i * 800);
      });
    }
  }, [player?.careerWins, player?.titlesWon, player?.matchHistory?.length, player?.history?.length, player?.totalEarnings, player?.careerSeasons?.length, player?.sponsors?.length, player?.sponsorOffers?.length, player?.wildcardsUsed?.length, player?.viewedAtpPlayers?.length, player?.money, player?.stats]);

  const loadSave = (slotIdx) => {
    try {
      const raw = localStorage.getItem(saveKeyFor(slotIdx));
      if (!raw) { notify("Aucune sauvegarde trouvée", "warn"); return; }
      const data = JSON.parse(raw);
      if (!data.player || !data.atpDb) { notify("Sauvegarde corrompue", "warn"); return; }
      // Decompress atpDb (Opt A+B)
      data.atpDb = decompactAtpDb(data.atpDb);
      setCircuit(data.player.circuit || "atp");
      // Reprend le hasard là où la partie l'avait laissé.
      if (data.rng !== undefined) setRngState(data.rng);
      // Anciennes carrières WTA : avatar féminin.
      if (data.player.circuit === "wta" && data.player.avatar && data.player.avatar.female === undefined) {
        data.player.avatar = { ...data.player.avatar, female: true, hairStyle: femaleHairStyle(true, data.player.avatar.hairStyle) };
      }
      setSlot(slotIdx);
      slotRef.current = slotIdx;
      // Anciennes sauvegardes : les pages d'aide sont considérées comme déjà vues.
      if (!Array.isArray(data.player.seenHelp)) data.player.seenHelp = Object.keys(PAGE_HELP);
      if (!data.player.careerId) data.player.careerId = "c" + Date.now().toString(36) + random().toString(36).slice(2, 6);
      setPlayer(data.player);
      setAtpDb(data.atpDb);
      setNews(data.news || []);
      setActiveTab("hub");
      // Resume a tournament that was saved between two matches.
      if (data.resume && (data.resume.pendingNextMatch || data.resume.phase === "prematch")) {
        setMatchState(data.resume);
        setScreen("match");
      } else {
        setScreen("hub");
      }
    } catch (e) {
      console.error(e);
      notify("Erreur lors du chargement", "warn");
    }
  };

  // window.confirm est bloqué dans certains environnements (le bouton ne
  // faisait rien) : on passe par une fenêtre de confirmation intégrée au jeu.
  const deleteSave = (slotIdx = slot) => setConfirmDelete(slotIdx);
  const doDeleteSave = () => {
    const target = confirmDelete;
    setConfirmDelete(null);
    if (target === null) return;
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    try {
      localStorage.removeItem(saveKeyFor(target));
      localStorage.removeItem(slotMetaKeyFor(target));
    } catch (e) {}
    // Si c'est la carrière en cours, on revient proprement au menu principal.
    if (target === slot && player) {
      setPlayer(null);
      setAtpDb(null);
      setNews([]);
      setMatchState(null);
      setRallyAnim(null);
      setLivePoint(null);
      if (pendingCommitRef.current) pendingCommitRef.current = null;
      setActiveTab("hub");
      setCircuit("atp");
      setScreen("menu");
    }
    refreshSlots();
    notify("Carrière effacée", "info");
  };

  // Retour au menu principal : on sauvegarde tout de suite, puis on décharge
  // la carrière (elle reste reprenable depuis son emplacement).
  const returnToMenu = (playerOverride) => {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    const pl = playerOverride && playerOverride.name ? playerOverride : player;
    if (pl && atpDb) {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          player: pl, atpDb: compactAtpDb(atpDb), news, resume: resumeSnapshot || null, savedAt: new Date().toISOString(),
        }));
        writeSlotMeta(slot, pl, atpDb);
      } catch (e) { console.warn("Save failed:", e); }
      updateCareerRecords(pl, atpDb);
    }
    setPlayer(null);
    setAtpDb(null);
    setNews([]);
    setMatchState(null);
    setRallyAnim(null);
    setLivePoint(null);
    if (pendingCommitRef.current) pendingCommitRef.current = null;
    setActiveTab("hub");
    setCircuit("atp");
    refreshSlots();
    setScreen("menu");
  };

  const notify = (msg, type = "info") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ── DÉFIS ───────────────────────────────────────────────────────────────
  // Lance un défi : partie neuve dans l'emplacement des défis, base IA avancée
  // jusqu'à la semaine de départ, puis mise en situation (setup du défi).
  const startChallenge = (def, form) => {
    setSeed(newSeed());
    setCircuit(form.circuit);
    const female = form.circuit === "wta";
    const avatar = { ...avatarInput, female, hairStyle: female ? "ponytail" : "short" };
    const p = createInitialPlayer(form.name, def.style, def.city, form.nationality, avatar, 3);
    p.circuit = form.circuit;
    let db = generateAtpDatabase();
    const enrollT = def.enroll ? ALL_TOURNAMENTS.find(t => t.id === def.enroll) : null;
    for (let w = 2; w <= def.startWeek; w++) {
      db = simulateAtpWeek(db, w, 2026, enrollT && enrollT.week === w ? [enrollT.id] : []).newDb;
    }
    p.week = def.startWeek;
    p.year = 2026;
    const finals = ALL_TOURNAMENTS.find(t => t.tier === "Finals");
    const deadlineAbs = def.deadline === "finals"
      ? 2026 * 52 + (finals ? finals.week : 46)
      : def.deadline.year * 52 + def.deadline.week;
    p.challenge = { id: def.id, status: "active", startAbs: 2026 * 52 + def.startWeek, deadlineAbs, seenEvents: [], introSeen: false };
    def.setup(p, db);
    p.seenHelp = Object.keys(PAGE_HELP);
    if (enrollT) p.enrollment = { tournamentId: enrollT.id, week: enrollT.week, year: 2026, entryStatus: "direct" };
    // Point de départ du graphique (et des trophées liés au classement).
    {
      const pts = totalAtpPoints(p.atpPointsLog);
      p.history = [{ week: p.week, year: p.year, points: pts, ranking: pts > 0 ? getPlayerRanking(pts, db) : 1201, money: p.money, stats: { ...p.stats } }];
    }
    // Trophées déjà acquis par le palmarès de départ : débloqués sans prime.
    const already = checkTrophies(p, new Set()).map(t => t.id);
    p.trophies = already;
    p.claimedTrophies = already;
    try { localStorage.removeItem(saveKeyFor(CHALLENGE_SLOT)); } catch (e) {}
    setSlot(CHALLENGE_SLOT);
    slotRef.current = CHALLENGE_SLOT;
    setPlayer(p);
    setAtpDb(db);
    setNews([]);
    setMatchState(null);
    setActiveTab("hub");
    setScreen("hub");
  };

  // Fauché : remboursement volontaire de la dette.
  const repayDebt = (amount) => {
    const debt = player?.challenge?.debt || 0;
    const pay = Math.floor(Math.min(amount, debt, player?.money || 0));
    if (pay <= 0) { notify("Pas assez d'argent pour rembourser", "warn"); return; }
    setPlayer(p => ({
      ...p, money: p.money - pay, totalSpent: (p.totalSpent || 0) + pay,
      challenge: { ...p.challenge, debt: Math.max(0, (p.challenge.debt || 0) - pay) },
    }));
    notify("Remboursement de " + pay.toLocaleString() + " €", "success");
  };

  // ── AIDE À LA PREMIÈRE VISITE ────────────────────────────────────────────
  // Nouvelle partie : la fiche d'aide de chaque page s'ouvre toute seule la
  // première fois qu'on y arrive (une seule fois par carrière). Elle reste
  // accessible à tout moment via le bouton « i » en haut à droite.
  useEffect(() => {
    if (screen !== "hub" || !player || !PAGE_HELP[activeTab]) return;
    if (sponsorNegotiation || flightAnim || trainAnim || player.pendingSeasonRecap || player.pendingLifeEvent) return;
    const seen = player.seenHelp || [];
    if (seen.includes(activeTab)) return;
    setHelpTab(activeTab);
    setPlayer(p => ({ ...p, seenHelp: [...(p.seenHelp || []), activeTab] }));
  }, [activeTab, screen, !!player, sponsorNegotiation, flightAnim, trainAnim, player?.pendingSeasonRecap, player?.pendingLifeEvent]);

  // ── WEEK ADVANCE ──────────────────────────────────────────────────────────
  const advanceWeek = () => {
    if (!player || isAdvancingWeek) return;
    const tStart = performance.now();

    let p = { ...player };
    const oldYear = p.year;
    const newWeek = p.week === 52 ? 1 : p.week + 1;
    const newYear = p.week === 52 ? p.year + 1 : p.year;
    const isNewSeason = newYear !== oldYear;
    p.week = newWeek;
    p.year = newYear;
    p.playedThisWeek = []; // reset weekly tournament play tracking

    // Age progression: +1 week at current age, +1 year every 52 weeks
    p.weeksAtAge = (p.weeksAtAge || 0) + 1;
    if (p.weeksAtAge >= 52) {
      p.weeksAtAge = 0;
      p.age = (p.age || 18) + 1;
    }

    // Forced retirement at 40
    if (p.age >= RETIREMENT_AGE) {
      setPlayer(p);
      setScreen("gameover");
      return;
    }

    // Weekly stat decline from age (compensable via training/tournaments)
    p.stats = applyWeeklyAgeDecline(p.stats, p.age);

    // Injury recovery: decrement weeksRemaining; heal when reaches 0
    if (p.injury) {
      const inj = { ...p.injury, weeksRemaining: p.injury.weeksRemaining - 1 };
      if (inj.weeksRemaining <= 0) {
        notify("Vous êtes guéri de votre blessure !", "success");
        p.injury = null;
      } else {
        p.injury = inj;
      }
    }

    const recoveryBonus = sumStaffEffect(p.staff, "recovery"); // flat extra energy
    p.energy = Math.min(100, p.energy + 25 + Math.max(0, recoveryBonus));
    // Cumulative happiness drain from staff (joueur surchargé par trop de membres)
    const happDrain = sumStaffEffect(p.staff, "happinessDrain");
    if (happDrain > 0) {
      p.happiness = Math.max(0, Math.round((p.happiness ?? 70) - happDrain * difficultyFactors(p).moodDecayMul));
    }
    p.atpPointsLog = expireOldPoints(p.atpPointsLog, newWeek, newYear);
    const staffCost = p.staff.reduce((a, s) => a + s.cost, 0);
    const weeklyOutflow = Math.round(p.weeklyExpenses + staffCost);
    p.money -= weeklyOutflow;
    p.totalSpent = (p.totalSpent || 0) + weeklyOutflow;

    // Sponsor weekly income + countdown
    if (p.sponsors && p.sponsors.length > 0) {
      let sponsorIncome = 0;
      const remaining = [];
      for (const s of p.sponsors) {
        sponsorIncome += s.weeklyPay;
        const next = { ...s, weeksLeft: s.weeksLeft - 1 };
        if (next.weeksLeft > 0) { remaining.push(next); continue; }
        // Contract ends: settle its objective now.
        if (s.objective) {
          const cur = { titles: p.titlesWon || 0, wins: p.careerWins || 0, bigwins: p.careerBigWins || 0 };
          const rk = getPlayerRanking(totalAtpPoints(p.atpPointsLog), atpDb);
          const met = evaluateSponsorObjective(s.objective, s.objectiveBaseline || { titles: 0, wins: 0, bigwins: 0 }, cur, rk);
          const amount = met ? (s.objectiveReward || 0) : -(s.objectivePenalty || 0);
          p.money += amount;
          if (amount > 0) p.totalEarnings = (p.totalEarnings || 0) + amount;
          else p.totalSpent = (p.totalSpent || 0) - amount;
          if (met) p.careerObjectivesMet = (p.careerObjectivesMet || 0) + 1;
          p._endedSponsorResults = [...(p._endedSponsorResults || []), { brand: s.brand, met, amount, objective: s.objective }];
          notify("Fin du contrat " + s.brand + " : objectif " + (met ? "atteint, prime de " + amount.toLocaleString() + "€" : "manqué, pénalité de " + (-amount).toLocaleString() + "€"), met ? "success" : "warn");
        } else {
          notify("Contrat sponsor terminé : " + s.brand, "info");
        }
      }
      // Agent bonus: extra % on sponsor revenue
      const agentBonus = Math.max(0, sumStaffEffect(p.staff, "sponsorPay"));
      if (agentBonus > 0) sponsorIncome = Math.round(sponsorIncome * (1 + agentBonus));
      p.money += sponsorIncome;
      p.totalEarnings = (p.totalEarnings || 0) + sponsorIncome;
      p.sponsorRevenue = (p.sponsorRevenue || 0) + sponsorIncome;
      p.sponsors = remaining;
    }

    // ── SPONSOR NEGOTIATION PHASES (start of season = week 1, mid-season = week 27) ──
    // At each phase: (1) evaluate objectives of contracts whose deadline has come,
    // paying bonuses or applying penalties / breaking contracts; (2) generate a
    // fresh slate of offers (each with its own objective) and open the
    // negotiation overlay so the player can sign new deals.
    const isNegotiationWeek = newWeek === 26 || newWeek === 52;
    try {
    if (isNegotiationWeek) {
      const ptsTotalNow = totalAtpPoints(p.atpPointsLog);
      const rankingNow = getPlayerRanking(ptsTotalNow, atpDb);
      const perfBonus = getRecentPerfBonus(p.matchHistory);

      // (1) Evaluate due objectives on active contracts. We use lifetime career
      // counters so the per-contract baseline subtraction is robust across the
      // season reset (season counters would reset mid-window).
      const current = { titles: p.titlesWon || 0, wins: p.careerWins || 0, bigwins: p.careerBigWins || 0 };
      const keptSponsors = [];
      let objMoney = 0;
      const negotiationResults = []; // for the overlay summary
      for (const s of (p.sponsors || [])) {
        // Objectives are settled when the contract ends (weekly countdown).
        if (typeof s.weeksLeft === "number" && s.weeksLeft > 0) { keptSponsors.push(s); continue; }
        const deadlineReached = s.objective && s.objectiveYear !== undefined &&
          ((newYear > s.objectiveYear) || (newYear === s.objectiveYear && newWeek >= s.objectiveWeek));
        if (!deadlineReached) { keptSponsors.push(s); continue; }
        const base = s.objectiveBaseline || { titles: 0, wins: 0, bigwins: 0 };
        const met = evaluateSponsorObjective(s.objective, base, current, rankingNow);
        if (met) {
          objMoney += s.objectiveReward || 0;
          p.careerObjectivesMet = (p.careerObjectivesMet || 0) + 1;
          negotiationResults.push({ brand: s.brand, met: true, amount: s.objectiveReward || 0, objective: s.objective });
          // Legacy contracts running past this window: renew for the next one.
          keptSponsors.push({
            ...s,
            objectiveBaseline: { ...current },
            objectiveYear: newWeek === 26 ? newYear : (newYear + 1),
            objectiveWeek: newWeek === 26 ? 52 : 26, // next phase
          });
        } else {
          objMoney -= s.objectivePenalty || 0;
          negotiationResults.push({ brand: s.brand, met: false, amount: -(s.objectivePenalty || 0), objective: s.objective, broken: true });
          // Contract broken on failure (not pushed to keptSponsors).
        }
      }
      p.sponsors = keptSponsors;
      if (p._endedSponsorResults && p._endedSponsorResults.length > 0) {
        negotiationResults.unshift(...p._endedSponsorResults);
      }
      delete p._endedSponsorResults;
      if (objMoney !== 0) {
        p.money += objMoney;
        if (objMoney > 0) p.totalEarnings = (p.totalEarnings || 0) + objMoney;
        else p.totalSpent = (p.totalSpent || 0) - objMoney;
      }

      // (2) Generate a slate of offers (4-9) for the negotiation table. More
      // offers when ranking/image are higher.
      const imageMul = (p.image ?? 60) < 20 ? 0 : (p.image ?? 60) < 40 ? 0.6 : 1.0;
      const slate = [];
      if (imageMul > 0) {
        const existingBrands = [...(p.sponsors || []).map(s => s.brand)];
        const tierNow = getSponsorTierForRanking(rankingNow, perfBonus, p.image);
        const poolBrands = (SPONSOR_BRANDS[tierNow] || SPONSOR_BRANDS.entry).filter(b => !existingBrands.includes(b.name));
        const poolHasEquip = poolBrands.some(b => b.cat === "equipment");
        const poolHasOther = poolBrands.some(b => b.cat === "other");
        const rankBonus = rankingNow <= 30 ? 3 : rankingNow <= 100 ? 2 : rankingNow <= 300 ? 1 : 0;
        const wanted = Math.min(9, 4 + rankBonus + (random() < 0.5 ? 1 : 0));
        const count = Math.min(wanted, poolBrands.length);
        for (let i = 0; i < count; i++) {
          const engagedCats = (p.sponsors || []).reduce((acc, s) => { acc[s.cat] = (acc[s.cat] || 0) + 1; return acc; }, {});
          // Force-balance: if late in the loop the slate is missing one cat
          // (and the pool can supply it), bias the next pick toward that cat.
          const slateEquip = slate.filter(o => o.cat === "equipment").length;
          const slateOther = slate.filter(o => o.cat === "other").length;
          const remaining = count - i;
          let forceCat = null;
          if (poolHasEquip && slateEquip === 0 && remaining <= 1 + Math.max(0, slateOther - 1)) forceCat = "equipment";
          else if (poolHasOther && slateOther === 0 && remaining <= 1 + Math.max(0, slateEquip - 1)) forceCat = "other";
          const tierBoost = Math.max(0, sumStaffEffect(p.staff, "sponsorTierBoost"));
          const offer = generateSponsorOffer(rankingNow, perfBonus, [...existingBrands, ...slate.map(o => o.brand)], p.image, engagedCats, newYear, p.startDifficulty, forceCat, tierBoost);
          if (offer) slate.push({ ...offer, week: newWeek, year: newYear });
        }
      }
      // Stash the negotiation data to open the overlay after state commit —
      // but only if there is something to show (offers to negotiate and/or
      // objective outcomes to report). Avoids an empty "no sponsors" screen.
      p.sponsorOffers = slate;
      if (slate.length > 0 || negotiationResults.length > 0) {
        p._pendingNegotiation = {
          phase: newWeek === 26 ? "mid" : "end",
          year: newYear,
          ranking: rankingNow,
          results: negotiationResults,
          objMoney,
        };
      }
    }
    } catch (err) {
      console.error("[week] sponsor phase error:", err);
      notify("Erreur lors de la phase sponsors, semaine poursuivie", "warn");
    }

    // Wildcard offers: if player has good recent perf but ranking limits them on
    // a tournament 1-3 weeks away, offer a WC. Strict caps to keep this rare.
    {
      const ptsTotalNow = totalAtpPoints(p.atpPointsLog);
      const rankingNow = getPlayerRanking(ptsTotalNow, atpDb);
      const perfBonus = getWildcardPerfBonus(p.matchHistory);
      const playerImage = p.image ?? 60;
      const playerPop = p.popularity ?? 20;
      // Wildcards are for players who NEED them to enter tournaments.
      // A top-50 player has direct access almost everywhere → no WC.
      const blockedByRank = rankingNow <= 50;
      // Critères propres à chaque catégorie de tournoi (voir WC_CRITERIA).
      const wcEligible = (tier) => {
        const c = WC_CRITERIA[tier] || WC_CRITERIA.ATP250;
        return playerImage >= c.minImage && (rankingNow <= c.maxRank || perfBonus >= 1);
      };
      const anyTierEligible = Object.keys(WC_CRITERIA).some(wcEligible);
      if (!blockedByRank && anyTierEligible) {
        // Clean expired WC offers, and offers for tournaments the player can
        // now enter directly (a WC is only useful to skip qualifying / get in).
        p.wildcardOffers = (p.wildcardOffers || []).filter(o => {
          const elapsed = (newYear - o.year) * 52 + (newWeek - o.week);
          const t = ALL_TOURNAMENTS.find(x => x.id === o.tournamentId);
          const nowDirect = t && getEntryStatus(t, rankingNow).status === "direct";
          return !nowDirect && elapsed < 3 && (o.tournamentWeek > newWeek || o.tournamentYear > newYear);
        });
        // CAP 1: max 2 pending wildcard offers at once
        const pendingCount = (p.wildcardOffers || []).length;
        // CAP 2: max 1 new WC offer generated per week
        let newOffersThisWeek = 0;
        // Popularity multiplier on WC frequency:
        // pop 0-20: ×0.3 (anonymous, rarely chosen)
        // pop 20-50: ×0.7
        // pop 50-75: ×1.0 (baseline)
        // pop 75-90: ×1.5
        // pop 90+: ×2.0 (média darling)
        let popMul;
        if (playerPop < 20) popMul = 0.3;
        else if (playerPop < 50) popMul = 0.7;
        else if (playerPop < 75) popMul = 1.0;
        else if (playerPop < 90) popMul = 1.5;
        else popMul = 2.0;
        if (pendingCount < 2) {
          // Look at tournaments in next 1-3 weeks
          outer: for (let lookahead = 1; lookahead <= 3; lookahead++) {
            const targetWeek = ((newWeek - 1 + lookahead) % 52) + 1;
            const targetYear = newWeek + lookahead > 52 ? newYear + 1 : newYear;
            const tourns = ALL_TOURNAMENTS.filter(t => t.week === targetWeek);
            for (const t of tourns) {
              const entry = getEntryStatus(t, rankingNow);
              // No WC when the player already has direct main-draw entry.
              // A WC is only offered to skip qualifying (or to get in at all).
              if (entry.status === "direct") continue;
              if (t.tier === "Finals" || !wcEligible(t.tier)) continue;
              // Already offered?
              if ((p.wildcardOffers || []).some(o => o.tournamentId === t.id && o.tournamentYear === targetYear)) continue;
              // Probability of WC offer depends on tier — significantly lowered.
              const wcProb = { GrandSlam: 0.004, Masters1000: 0.008, ATP500: 0.015, ATP250: 0.025, Challenger: 0.035, ITF: 0.045 }[t.tier] || 0.02;
              const adjustedProb = wcProb * (1 + perfBonus * 0.5) * popMul;
              if (random() < adjustedProb) {
                p.wildcardOffers = [...(p.wildcardOffers || []), {
                  tournamentId: t.id,
                  tournamentName: t.name,
                  tournamentWeek: targetWeek,
                  tournamentYear: targetYear,
                  week: newWeek, year: newYear,
                }];
                notify("Wildcard proposée : " + t.name + " !", "success");
                newOffersThisWeek++;
                if (newOffersThisWeek >= 1 || (p.wildcardOffers || []).length >= 2) break outer;
              }
            }
          }
        }
      }
    }

    // Delayed investments reaching maturity
    if ((p.pendingInvestments || []).length > 0) {
      const absNow = newYear * 52 + newWeek;
      const still = [];
      for (const inv of p.pendingInvestments) {
        if (absNow < inv.dueAbsWeek) { still.push(inv); continue; }
        const plan = INVESTMENT_PLANS[inv.plan] || INVESTMENT_PLANS.safe;
        let r = random();
        let out = plan[plan.length - 1];
        for (const o of plan) { if (r < o.chance) { out = o; break; } r -= o.chance; }
        const payout = Math.round(inv.amount * out.mul);
        p.money += payout;
        if (payout > inv.amount) p.totalEarnings = (p.totalEarnings || 0) + (payout - inv.amount);
        notify(out.msg + (payout > 0 ? " (+" + payout.toLocaleString() + "€)" : ""), payout >= inv.amount ? "success" : "warn");
      }
      p.pendingInvestments = still;
    }

    // Bankruptcy check
    if (p.money < 0) {
      setPlayer(p);
      setScreen("gameover");
      return;
    }

    // Weekly history snapshot (for progression graphs)
    {
      const ptsTotalNow = totalAtpPoints(p.atpPointsLog);
      const rankingNow = getPlayerRanking(ptsTotalNow, atpDb);
      const snapshot = {
        week: newWeek, year: newYear,
        points: ptsTotalNow,
        ranking: rankingNow,
        money: p.money,
        stats: { ...p.stats },
      };
      // Keep last 260 weeks (~5 years)
      p.history = [...(p.history || []), snapshot].slice(-260);
    }

    // ── Défi en cours : mécaniques de la semaine ─────────────────────────────
    if (p.challenge && p.challenge.status === "active") {
      p.challenge = { ...p.challenge };
      const absNow = newYear * 52 + newWeek;
      // Bilan du défi (pour le score) : matchs de la semaine écoulée.
      p.challenge.tally = challengeTallyWeek(p.challenge.tally, p.matchHistory, oldYear, player.week);
      p.challenge.bestRace = Math.min(p.challenge.bestRace || 9999, playerRaceRank(player, atpDb));
      // Récupération réduite (Dernière danse).
      if (p.challenge.energyRegenMod) p.energy = Math.max(0, Math.min(100, p.energy + p.challenge.energyRegenMod));
      // Fauché : échéance obligatoire toutes les 4 semaines.
      if (p.challenge.id === "fauche" && (p.challenge.debt || 0) > 0 && absNow >= (p.challenge.nextDueAbs || 0)) {
        const due = Math.min(2500, Math.round(p.challenge.debt));
        if (p.money >= due) {
          p.money -= due;
          p.totalSpent = (p.totalSpent || 0) + due;
          p.challenge.debt = Math.max(0, p.challenge.debt - due);
          notify("Échéance payée : " + due.toLocaleString() + " € (reste " + Math.round(p.challenge.debt).toLocaleString() + " €)", "info");
        } else {
          const pen = Math.round(p.challenge.debt * 0.1);
          p.challenge.debt += pen;
          notify("Échéance impayée : pénalité de " + pen.toLocaleString() + " €", "warn");
        }
        p.challenge.nextDueAbs = absNow + 4;
      }
      // Seul au monde : autodidacte, chaque victoire de la semaine passée fait progresser.
      if (p.challenge.id === "seul") {
        const wins = (p.matchHistory || []).filter(m => m.won && !m.seeded && m.year === oldYear && m.week === player.week).length;
        if (wins > 0) {
          const keys = ["serve", "forehand", "backhand", "stamina", "mental", "net"];
          const k = keys[Math.floor(random() * keys.length)];
          const g = Math.round(0.12 * wins * 100) / 100;
          p.stats = { ...p.stats, [k]: Math.min(99, p.stats[k] + g) };
          const labels = { serve: "Service", forehand: "Coup droit", backhand: "Revers", stamina: "Endurance", mental: "Mental", net: "Filet" };
          notify("Autodidacte : +" + g + " en " + labels[k], "success");
        }
      }
      // Événement propre au défi.
      if (!p.pendingLifeEvent) {
        const pick = pickChallengeEvent(p);
        if (pick) {
          p.pendingLifeEvent = pick.ev.id;
          p.challenge.seenEvents = [...(p.challenge.seenEvents || []), pick.key];
          p.lastLifeEventWeek = newWeek;
          p.lastLifeEventYear = newYear;
        }
      }
    }

    // Season-end recap: trigger when entering a new year
    if (isNewSeason) {
      const endRanking = getPlayerRanking(totalAtpPoints(p.atpPointsLog), atpDb);
      const recap = {
        year: oldYear,
        wins: (p.seasonStats?.wins) || 0,
        losses: (p.seasonStats?.losses) || 0,
        titles: (p.seasonStats?.titles) || 0,
        earnings: (p.seasonStats?.earnings) || 0,
        endOfYearRanking: endRanking,
        endOfYearPoints: totalAtpPoints(p.atpPointsLog),
        legacyScore: computeLegacyScore(p), // career legacy score at this point in time
      };
      p.careerSeasons = [...(p.careerSeasons || []), recap];
      p.pendingSeasonRecap = recap;
      p.seasonStats = { wins: 0, losses: 0, titles: 0, earnings: 0, year: newYear };
      p.seasonBigWins = 0;
    }

    // ── Masters de fin d'année : inscription automatique du top 8 de la Race ──
    {
      const finals = ALL_TOURNAMENTS.find(t => t.tier === "Finals");
      if (finals && !p.challenge?.failReason) {
        const raceRk = playerRaceRank(p, atpDb);
        if (newWeek === finals.week - 1 && raceRk <= 8) {
          notify("Qualifié pour le " + finals.name + " la semaine prochaine (" + raceRk + "e de la Race) !", "success");
        }
        if (newWeek === finals.week && raceRk <= 8) {
          const blocked = (p.injury && !p.injury.canPlay) || (p.restUntilAbsWeek && newYear * 52 + newWeek < p.restUntilAbsWeek);
          if (blocked) {
            notify("Qualifié pour le " + finals.name + " mais forfait : blessure ou repos.", "warn");
          } else {
            // Annule une autre inscription cette semaine (frais remboursés).
            if (p.enrollment && p.enrollment.tournamentId !== finals.id) {
              const other = ALL_TOURNAMENTS.find(x => x.id === p.enrollment.tournamentId);
              p.money += other?.entryFee || 0;
            }
            // Voyage pris en charge par l'organisation.
            p.location = finals.city;
            p.enrollment = { tournamentId: finals.id, week: finals.week, year: newYear, entryStatus: "direct" };
            setPlayerRaceRank(raceRk);
            notify("Direction " + finals.city + " pour le " + finals.name + " : voyage offert par l'organisation.", "success");
          }
        }
      }
    }

    const tSim = performance.now();
    let newDb = atpDb, articles = [], retirements = [];
    try {
      // Le tournoi où le joueur est inscrit cette semaine n'est pas simulé ici :
      // il sera joué (et enregistré) avec le vrai tableau du joueur.
      const enrolledNow = p.enrollment && p.enrollment.week === newWeek ? [p.enrollment.tournamentId] : [];
      const result = simulateAtpWeek(atpDb, newWeek, newYear, [...(p.playedThisWeek || []), ...enrolledNow]);
      newDb = result.newDb;
      articles = result.articles;
      retirements = result.retirements || [];
    } catch (err) {
      console.error("[week] simulation error:", err);
      notify("Erreur de simulation, semaine passée sans calculs ATP", "warn");
    }
    const tAfterSim = performance.now();
    console.log("[week] sim:", (tAfterSim - tSim).toFixed(1), "ms · articles:", articles.length);

    setAtpDb(newDb);
    // Convert tournament articles into journalist-style social posts (world feed)
    const tournamentPosts = (articles || []).map(a => {
      const author = pickRandom(SOCIAL_AUTHORS.journalists);
      // Use the article title as a tweet headline, body as continuation
      const content = a.title + (a.body ? " — " + a.body.split(". ")[0] + "." : "");
      return {
        id: a.id,
        author,
        content,
        likes: randomLikes(500, 5000),
        retweets: randomLikes(80, 800),
        week: newWeek, year: newYear,
        feed: "world",
        tournamentMeta: { tier: a.tier, surface: a.surface, city: a.city, winner: a.winner, tournament: a.tournament },
      };
    });
    const auxPosts = generateAuxSocialPosts(newDb, newWeek, newYear, null, news);
    const personalPosts = generateWeeklyPersonalPosts(p, news, newWeek, newYear);
    // Retraites du top 100 annoncées dans le fil « Monde ».
    const retirementPosts = retirements.map(r => ({
      id: "post_ret_" + Date.now() + "_" + random().toString(36).slice(2, 7),
      author: pickRandom(SOCIAL_AUTHORS.journalists),
      content: pickRandom([
        "🎾 Fin d'une carrière : " + r.name + " (" + r.age + " ans, " + r.rank + "e mondial) annonce sa retraite.",
        r.name + " raccroche la raquette à " + r.age + " ans. Merci pour toutes ces années sur le circuit.",
        "Officiel : " + r.name + " met un terme à sa carrière. Il quitte le circuit à la " + r.rank + "e place mondiale.",
      ]),
      likes: randomLikes(r.rank <= 20 ? 5000 : 800, r.rank <= 20 ? 20000 : 5000),
      retweets: randomLikes(200, 2500),
      week: newWeek, year: newYear, feed: "world", replyable: false,
    }));
    const allNewPosts = [...retirementPosts, ...tournamentPosts, ...auxPosts, ...personalPosts];
    if (allNewPosts.length > 0) {
      const nowAbs = newYear * 52 + newWeek;
      setNews(prev => [...allNewPosts, ...prev]
        .filter(x => nowAbs - ((x.year || 0) * 52 + (x.week || 0)) < SOCIAL_HISTORY_WEEKS)
        .slice(0, 300));
    }

    // Safety net: an enrollment whose week has already passed (tournament never
    // launched for any reason) is cancelled and refunded instead of sticking.
    if (p.enrollment && p.enrollment.week !== newWeek) {
      // Older saves have no year on the enrollment: only treat a recent past
      // week as missed, never a week scheduled for next year.
      const encAbs = p.enrollment.year !== undefined
        ? p.enrollment.year * 52 + p.enrollment.week
        : (p.enrollment.week < newWeek ? newYear * 52 + p.enrollment.week : Infinity);
      if (encAbs < newYear * 52 + newWeek) {
        const missed = ALL_TOURNAMENTS.find(x => x.id === p.enrollment.tournamentId);
        p.money += missed?.entryFee || 0;
        notify("Inscription expirée" + (missed ? " (" + missed.name + ")" : "") + " : frais remboursés.", "warn");
        p.enrollment = null;
      }
    }

    // Auto-launch enrolled tournament if it's this week
    if (p.enrollment && p.enrollment.week === newWeek) {
      const t = ALL_TOURNAMENTS.find(x => x.id === p.enrollment.tournamentId);
      if (t) {
        // Preventive rest: no tournament
        if (p.restUntilAbsWeek && newYear * 52 + newWeek < p.restUntilAbsWeek) {
          notify("Repos préventif : " + t.name + " annulé, frais remboursés.", "warn");
          p.money += t.entryFee || 0;
          p.enrollment = null;
          setPlayer(p);
          return;
        }
        // Injury too severe to play
        if (p.injury && !p.injury.canPlay) {
          notify("Blessure : impossible de disputer " + t.name + ". Tournoi annulé.", "warn");
          p.enrollment = null;
          setPlayer(p);
          console.log("[week] total:", (performance.now() - tStart).toFixed(1), "ms");
          return;
        }
        if (p.location !== t.city) {
          notify("Vous n'êtes pas à " + t.city + " ! Tournoi annulé.", "warn");
          p.enrollment = null;
          setPlayer(p);
          console.log("[week] total:", (performance.now() - tStart).toFixed(1), "ms");
          return;
        }
        setPlayer(p);
        console.log("[week] total:", (performance.now() - tStart).toFixed(1), "ms");
        try {
          // The sponsor negotiation waits for the end of the tournament
          // (it opens from the tournament summary screen).
          launchTournament(t, p, newDb);
        } catch (err) {
          console.error("[week] tournament launch error:", err);
          notify("Impossible de lancer " + t.name + " : inscription annulée, frais remboursés.", "warn");
          setPlayer(prev => ({ ...prev, money: prev.money + (t.entryFee || 0), enrollment: null }));
        }
        return;
      }
    }

    // Weekly life-stat drift:
    // - Happiness: decays fast when high (mood swings are normal). Baseline 40.
    // - Popularity & Image: very stable. They drift very slowly because reputation
    //   is hard-won and slow to lose passively. The big swings come from specific
    //   events (scandals, big wins, etc.), not from weekly attrition.
    const driftTowards = (v, target, rateAbove, rateBelow) => {
      if (v > target) {
        const dist = v - target;
        const drop = Math.max(0.5, dist * rateAbove);
        return Math.max(target, v - drop);
      } else {
        const dist = target - v;
        const gain = Math.max(0.1, dist * rateBelow);
        return Math.min(target, v + gain);
      }
    };
    // Happiness — fast decay above baseline, slow recovery below.
    p.happiness  = Math.round(driftTowards(p.happiness ?? 70, 40, 0.14, 0.03));
    // Popularity / image drift toward a baseline. Harder difficulty lowers that
    // baseline, so staying popular/well-regarded takes more active effort.
    const _df = difficultyFactors(p);
    const popBaseline = Math.max(5, Math.round(15 - (_df.level - 3) * 3)); // d1:21 d3:15 d5:9
    const imgBaseline = Math.max(30, Math.round(50 - (_df.level - 3) * 4)); // d1:58 d3:50 d5:42
    p.popularity = Math.round(driftTowards(p.popularity ?? 20, popBaseline, 0.012, 0.005));
    p.image      = Math.round(driftTowards(p.image ?? 60, imgBaseline, 0.012, 0.005));
    // Au-dessus du plafond fixé par le classement : retour progressif.
    {
      const caps = lifeCaps(p);
      if (p.popularity > caps.popularity) p.popularity -= Math.max(1, Math.round((p.popularity - caps.popularity) * 0.15));
      if (p.image > caps.image) p.image -= Math.max(1, Math.round((p.image - caps.image) * 0.15));
    }

    // Random life event (~22% chance per week, only if no event already pending,
    // not during the tournament-launch flow above, and not right after another event)
    if (!p.pendingLifeEvent
        && random() < 0.22
        && (p.lastLifeEventWeek === undefined || ((newYear - (p.lastLifeEventYear || newYear)) * 52 + (newWeek - p.lastLifeEventWeek)) >= 2)) {
      const currentSeason = (p.careerSeasons?.length || 0) + 1;
      const eligible = LIFE_EVENTS.filter(e => !e.minSeason || currentSeason >= e.minSeason);
      if (eligible.length > 0) {
        const ev = eligible[Math.floor(random() * eligible.length)];
        p.pendingLifeEvent = ev.id;
        p.lastLifeEventWeek = newWeek;
        p.lastLifeEventYear = newYear;
      }
    }

    setPlayer(p);
    // Open the sponsor negotiation overlay if a phase just triggered this week.
    if (p._pendingNegotiation) {
      const neg = p._pendingNegotiation;
      delete p._pendingNegotiation;
      setSponsorNegotiation(neg);
    }
    console.log("[week] total:", (performance.now() - tStart).toFixed(1), "ms");
  };

  // ── TRAINING ──────────────────────────────────────────────────────────────
  const doTraining = (mod) => {
    {
      const absNow = (player.year || 0) * 52 + (player.week || 0);
      if (player.restUntilAbsWeek && absNow < player.restUntilAbsWeek) {
        const left = player.restUntilAbsWeek - absNow;
        notify("Repos préventif : pas d'entraînement pendant encore " + left + " semaine" + (left > 1 ? "s" : ""), "warn");
        return;
      }
    }
    if (player.money < mod.cost) { notify("Pas assez d'argent", "warn"); return; }
    // Stamina reduces energy cost: stat 50 → full cost, stat 90 → 60% cost
    const staminaReduction = Math.max(0.6, 1 - (player.stats.stamina - 50) / 100);
    // Staff malus: coachs intensifs (Carlos Vives, etc.) ajoutent un surcoût d'énergie
    // (trainEnergyCost is stored as a malus, so sumStaffEffect returns it negative.)
    const extraEnergyFromStaff = staffTrainEnergyExtra(player.staff);
    const actualEnergyCost = Math.round(mod.energyCost * staminaReduction) + extraEnergyFromStaff;
    if (player.energy < actualEnergyCost + 3) { notify("Énergie insuffisante", "warn"); return; }

    // Staff bonus: somme des trainGain de TOUS les staff applicables (coachs en pratique).
    // Net = trainGain bonuses - trainGain malus (sumStaffEffect le gère).
    const staffTrainGain = Math.max(-0.3, sumStaffEffect(player.staff, "trainGain"));
    const staffBonus = 1 + staffTrainGain;
    // Happiness impacts training: very low = motivation in tatters, high = focus.
    // Thresholds: <20 = ×0.5, <40 = ×0.85, 40-75 = ×1.0, >85 = ×1.10
    const happ = player.happiness ?? 70;
    let happinessTrainMul = 1.0;
    if (happ < 20) happinessTrainMul = 0.5;
    else if (happ < 40) happinessTrainMul = 0.85;
    else if (happ > 85) happinessTrainMul = 1.10;
    const energyMultiplier = 0.6 + (player.energy / 250);
    const ageMul = ageTrainingMultiplier(player.age);
    const currentStat = player.stats[mod.stat];
    const diminishMul = styledProgressionMultiplier(player.styleId, mod.stat, currentStat);
    const diffF = difficultyFactors(player);
    const absWeekNow = (player.year || 0) * 52 + (player.week || 0);
    const techBoostMul = (player.trainBoost && absWeekNow < player.trainBoost.untilAbsWeek) ? player.trainBoost.mul : 1;
    const challengeTrainMul = (player.challenge && player.challenge.status === "active" && player.challenge.trainMul) || 1;
    const expectedGain = mod.baseGain * staffBonus * energyMultiplier * diminishMul * ageMul * happinessTrainMul * diffF.trainMul * techBoostMul * challengeTrainMul;
    // Random factor 0.75-1.25 around expected (tighter than before)
    const variance = 0.75 + random() * 0.5;
    const gain = parseFloat((expectedGain * variance).toFixed(2));
    const newStats = { ...player.stats };
    newStats[mod.stat] = Math.min(99, newStats[mod.stat] + gain);

    // ── Training while injured: high risk of aggravating the injury ──
    // The physio/staff injuryProtect reduces (but never removes) the risk.
    let aggravated = false;
    let updatedInjury = player.injury;
    if (player.injury && player.injury.weeksRemaining > 0) {
      const protect = Math.max(0, Math.min(0.5, sumStaffEffect(player.staff, "injuryProtect")));
      const aggravationChance = 0.45 * (1 - protect); // ~45%, lowered by physio
      if (random() < aggravationChance) {
        aggravated = true;
        const inj = player.injury;
        const addedWeeks = 1 + Math.floor(random() * 4); // +1 to +4 weeks
        const worsePenalty = Math.min(0.45, (inj.statPenalty || 0.05) + 0.05);
        // A moderate injury can tip into "cannot play" when badly aggravated.
        const stillCanPlay = inj.canPlay && worsePenalty < 0.30;
        updatedInjury = {
          ...inj,
          weeksRemaining: inj.weeksRemaining + addedWeeks,
          statPenalty: worsePenalty,
          canPlay: stillCanPlay,
        };
      }
    }

    setTrainAnim({ mod, gain });

    setPlayer(p => ({
      ...p, stats: newStats,
      money: p.money - mod.cost,
      totalSpent: (p.totalSpent || 0) + mod.cost,
      trainCount: (p.trainCount || 0) + 1,
      energy: Math.max(0, p.energy - actualEnergyCost),
      injury: updatedInjury,
    }));
    if (aggravated) {
      notify("Vous avez aggravé votre blessure ! Repos prolongé (" + updatedInjury.label + ").", "warn");
    } else if (player.injury && player.injury.weeksRemaining > 0) {
      notify("+" + gain + " en " + mod.name + " (entraînement risqué malgré la blessure)", "success");
    } else if (gain < 0.05) {
      notify("Entraînement effectué (stat trop élevée pour progresser)", "info");
    } else {
      notify("+" + gain + " en " + mod.name + " !", "success");
    }
  };

  const doLifeActivity = (act) => {
    if (player.money < act.cost) { notify("Pas assez d'argent", "warn"); return; }
    if (act.energyCost > 0 && player.energy < act.energyCost + 2) { notify("Énergie insuffisante", "warn"); return; }
    const absWeek = (player.year || 0) * 52 + (player.week || 0);
    // Cooldown check
    const lastUsed = (player.activityCooldowns || {})[act.id];
    if (lastUsed !== undefined) {
      const since = absWeek - lastUsed;
      const remaining = (act.cooldown || 0) - since;
      if (remaining > 0) {
        notify("Disponible dans " + remaining + " semaine" + (remaining > 1 ? "s" : ""), "warn");
        return;
      }
    }
    // Weekly limit: max 2 activities per week (reset on new week)
    const currentWeekKey = player.lifeActivitiesWeekKey || 0;
    const countThisWeek = currentWeekKey === absWeek ? (player.lifeActivitiesThisWeek || 0) : 0;
    if (countThisWeek >= 2) {
      notify("Maximum 2 activités par semaine", "warn");
      return;
    }
    setPlayer(p => adjustLife({
      ...p,
      money: p.money - act.cost,
      totalSpent: (p.totalSpent || 0) + act.cost,
      energy: Math.max(0, Math.min(100, p.energy - act.energyCost)),
      lastLifeActivityWeek: p.week,
      activityCooldowns: { ...(p.activityCooldowns || {}), [act.id]: absWeek },
      lifeActivitiesWeekKey: absWeek,
      lifeActivitiesThisWeek: countThisWeek + 1,
    }, { happiness: act.happiness, popularity: act.popularity, image: act.image }));
    const parts = [];
    if (act.happiness) parts.push((act.happiness > 0 ? "+" : "") + act.happiness + " bonheur");
    if (act.popularity) parts.push((act.popularity > 0 ? "+" : "") + act.popularity + " popularité");
    if (act.image) parts.push((act.image > 0 ? "+" : "") + act.image + " image");
    notify(act.name + " : " + parts.join(" · "), "success");
  };

  const resolveLifeEvent = (option) => {
    // Uncertain options: roll one outcome and merge its effects.
    let e = { ...(option.effects || {}) };
    if (option.outcomes && option.outcomes.length > 0) {
      let r = random();
      let picked = option.outcomes[option.outcomes.length - 1];
      for (const o of option.outcomes) { if (r < o.chance) { picked = o; break; } r -= o.chance; }
      for (const [k, v] of Object.entries(picked.effects || {})) e[k] = (e[k] || 0) + v;
      if (picked.msg) notify(picked.msg, (picked.effects?.image || 0) >= 0 ? "success" : "warn");
    }
    // Light training gain on one random stat (diminishing returns + age apply).
    let statGainApplied = null;
    if (option.statGain) {
      const keys = ["serve", "forehand", "backhand", "stamina", "mental", "net"];
      const k = keys[Math.floor(random() * keys.length)];
      const cur = player.stats[k];
      const g = parseFloat((option.statGain * styledProgressionMultiplier(player.styleId, k, cur) * ageTrainingMultiplier(player.age)).toFixed(2));
      statGainApplied = { k, g };
      const labels = { serve: "Service", forehand: "Coup droit", backhand: "Revers", stamina: "Endurance", mental: "Mental", net: "Filet" };
      notify("Séance en salle : +" + g + " en " + labels[k], "success");
    }
    const absNow = (player.year || 0) * 52 + (player.week || 0);
    const invest = option.investment
      ? { amount: option.investment.amount, plan: option.investment.plan, dueAbsWeek: absNow + option.investment.weeks }
      : null;
    if (invest) notify("Investissement réalisé : résultat dans " + option.investment.weeks + " semaines.", "info");
    const restUntil = option.restWeeks ? absNow + option.restWeeks : null;
    if (restUntil) notify("Repos préventif : ni entraînement ni tournoi pendant " + option.restWeeks + " semaines.", "info");
    let newInjury = null;
    if (option.injuryRisk && random() < option.injuryRisk * injuryRiskMul(player)) {
      newInjury = rollInjury();
      notify(newInjury.label + " ! Indisponible " + newInjury.weeksRemaining + " semaine" + (newInjury.weeksRemaining > 1 ? "s" : "") + ".", "warn");
    }
    const boost = option.trainBoost;
    if (boost) notify("Entraînement boosté de +" + Math.round((boost.mul - 1) * 100) + " % pendant " + boost.weeks + " semaines", "success");
    setPlayer(p => {
      let newPlayer = adjustLife({
        ...p,
        money: (p.money || 0) + (e.money || 0),
        energy: Math.max(0, Math.min(100, (p.energy || 100) + (e.energy || 0))),
        totalEarnings: (e.money || 0) > 0 ? (p.totalEarnings || 0) + e.money : (p.totalEarnings || 0),
        totalSpent: (e.money || 0) < 0 ? (p.totalSpent || 0) - e.money : (p.totalSpent || 0),
        pendingLifeEvent: null,
        ...(invest ? { pendingInvestments: [...(p.pendingInvestments || []), invest] } : {}),
        ...(restUntil ? { restUntilAbsWeek: Math.max(p.restUntilAbsWeek || 0, restUntil) } : {}),
        ...(newInjury && !(p.injury && p.injury.weeksRemaining > newInjury.weeksRemaining) ? { injury: newInjury } : {}),
        ...(statGainApplied ? { stats: { ...p.stats, [statGainApplied.k]: Math.min(99, p.stats[statGainApplied.k] + statGainApplied.g) } } : {}),
        ...(boost ? { trainBoost: { mul: boost.mul, untilAbsWeek: (p.year || 0) * 52 + (p.week || 0) + boost.weeks } } : {}),
      }, { happiness: e.happiness || 0, popularity: e.popularity || 0, image: e.image || 0 });
      // Effets propres aux événements de défi (dette, stats, règles…).
      if (option.apply) newPlayer = option.apply(newPlayer);
      // Trigger game over if life event drains money below zero
      if (newPlayer.money < 0) {
        setTimeout(() => setScreen("gameover"), 100);
      }
      return newPlayer;
    });
  };

  // ── ENROLL TOURNAMENT ─────────────────────────────────────────────────────
  const enrollTournament = (t) => {
    if (t.tier === "Finals") { notify("Le Masters se joue sur qualification : inscription automatique si vous êtes dans le top 8 de la Race.", "info"); return; }
    if (player.restUntilAbsWeek && tournamentAbsWeek(t, player) < player.restUntilAbsWeek) {
      notify("Repos préventif : aucun tournoi avant la fin de votre repos.", "warn");
      return;
    }
    // Block if injured and cannot play
    if (player.injury && !player.injury.canPlay) {
      notify("Vous êtes trop blessé pour jouer (" + player.injury.label + ").", "warn");
      return;
    }
    // Block if already played any tournament this week (one tournament per week max)
    if (t.week === player.week && (player.playedThisWeek || []).length > 0) {
      if ((player.playedThisWeek || []).includes(t.id)) {
        notify("Vous avez déjà disputé ce tournoi cette semaine.", "warn");
      } else {
        notify("Vous avez déjà joué un tournoi cette semaine.", "warn");
      }
      return;
    }
    const ptsTotal = totalAtpPoints(player.atpPointsLog);
    const ranking = getPlayerRanking(ptsTotal, atpDb);
    const entry = getEntryStatus(t, ranking);
    if (entry.status === "blocked") { notify(entry.reason, "warn"); return; }
    if (t.week === player.week && player.location !== t.city) {
      notify("Vous devez d'abord vous rendre à " + t.city, "warn");
      return;
    }
    if (player.money < t.entryFee) { notify("Frais d'inscription insuffisants", "warn"); return; }

    const entryStatus = entry.protected ? "protected" : entry.status;
    if (entry.protected) notify("Classement protégé utilisé pour " + t.name + ".", "info");
    setPlayer(p => ({
      ...p, money: p.money - t.entryFee,
      totalSpent: (p.totalSpent || 0) + t.entryFee,
      enrollment: { tournamentId: t.id, week: t.week, year: t.week >= player.week ? player.year : player.year + 1, entryStatus },
      ...(entry.protected ? { challenge: { ...p.challenge, protectedUses: Math.max(0, (p.challenge.protectedUses || 0) - 1) } } : {}),
    }));
    if (t.week === player.week) {
      setTimeout(() => launchTournament(t, { ...player, money: player.money - t.entryFee, enrollment: { tournamentId: t.id, week: t.week, year: player.year, entryStatus } }, atpDb), 50);
    } else {
      const suffix = entry.status === "qualifying" ? " (qualifs)" : "";
      notify("Inscrit au " + t.name + suffix + " (semaine " + t.week + ")", "success");
    }
  };

  const cancelEnrollment = () => {
    setPlayer(p => {
      const t = p.enrollment ? ALL_TOURNAMENTS.find(x => x.id === p.enrollment.tournamentId) : null;
      const refund = t?.entryFee || 0;
      return {
        ...p,
        enrollment: null,
        money: p.money + refund,
        totalSpent: Math.max(0, (p.totalSpent || 0) - refund),
        // Entrée protégée rendue si l'inscription est annulée.
        ...(p.enrollment?.entryStatus === "protected" && p.challenge ? { challenge: { ...p.challenge, protectedUses: (p.challenge.protectedUses || 0) + 1 } } : {}),
      };
    });
    const t = player.enrollment ? ALL_TOURNAMENTS.find(x => x.id === player.enrollment.tournamentId) : null;
    const refund = t?.entryFee || 0;
    notify(refund > 0 ? "Inscription annulée (+" + refund + "€ remboursés)" : "Inscription annulée", "info");
  };

  // ── TIRAGE D'UN TABLEAU ───────────────────────────────────────────────────
  // Construit le tableau (qualifs ou tableau final) et pré-simule les adversaires
  // du joueur à chaque tour. excludeIds : joueurs à écarter (déjà affrontés).
  const buildTournamentDraw = (t, fmt, mode, db, p, excludeIds = []) => {
    const excluded = new Set(excludeIds);
    // Joueurs déjà engagés dans un autre tournoi cette semaine (simulation IA).
    for (const pl of db) {
      const last = pl.recentResults && pl.recentResults[0];
      if (last && last.week === p.week && last.year === p.year) excluded.add(pl.id);
    }
    // ── Qualifying rank ranges per tier ───────────────────────────────────
    const qualiRanges = {
      Finals:      [9, 12],
      GrandSlam:   [105, 250],
      Masters1000: [77,  180],
      ATP500:      [56,  170],
      ATP250:      [71,  250],
      Challenger:  [125, 450],
      ITF:         [600, 1200],
    };

    // ── Build bracket ──────────────────────────────────────────────────────
    // Candidates are collected across the whole eligible rank range, THEN
    // shuffled, so the draw isn't always made of the same (lowest-index)
    // players that happened to pass the probability check first.
    const seenIds = new Set();
    const candidates = [];
    const addC = (pl) => {
      if (pl && !seenIds.has(pl.id) && !excluded.has(pl.id)) { seenIds.add(pl.id); candidates.push(pl); }
    };
    const scan = (from, to, prob) => {
      const end = Math.min(to, db.length);
      for (let i = Math.max(0, from); i < end; i++) if (random() < prob) addC(db[i]);
    };
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const tier = t.tier;
    const needed = fmt.drawSize - 1;
    let fallbackRange;

    if (mode === "qualifying") {
      // Les qualifs ne contiennent que des joueurs SANS entrée directe
      // (classés au-delà de la limite d'entrée directe du tournoi).
      const [rMin, rMax] = qualiRanges[tier] || [600, 1200];
      const qMin = Math.max(rMin, fmt.directCut + 1);
      const qMax = Math.max(rMax, qMin + 60);
      scan(qMin - 1, qMax, 0.4);
      fallbackRange = [qMin - 1, qMax];
    } else if (tier === "Finals") {
      // Les autres qualifiés : meilleurs de la Race.
      raceStandings(db, p.year).slice(0, 8).forEach(r => addC(r.p));
      fallbackRange = [0, 12];
    } else if (tier === "GrandSlam") {
      scan(0, 80, 0.95); scan(80, 150, 0.60);
      fallbackRange = [0, 200];
    } else if (tier === "Masters1000") {
      scan(0, 50, 0.92); scan(50, 100, 0.55);
      fallbackRange = [0, 160];
    } else if (tier === "ATP500") {
      scan(0, 30, 0.40); scan(30, 100, 0.35);
      fallbackRange = [0, 160];
    } else if (tier === "ATP250") {
      scan(20, 200, 0.25);
      fallbackRange = [10, 300];
    } else if (tier === "Challenger") {
      scan(80, 400, 0.20);
      fallbackRange = [60, 500];
    } else { // ITF
      scan(300, 1100, 0.15);
      fallbackRange = [250, 1200];
    }

    shuffle(candidates);
    const bracketParticipants = candidates.slice(0, needed);

    // Not enough candidates: complete from the same rank range, shuffled.
    if (bracketParticipants.length < needed) {
      const extra = [];
      for (let i = Math.max(0, fallbackRange[0]); i < Math.min(fallbackRange[1], db.length); i++) {
        if (!seenIds.has(db[i].id) && !excluded.has(db[i].id)) extra.push(db[i]);
      }
      shuffle(extra);
      for (const pl of extra) {
        if (bracketParticipants.length >= needed) break;
        seenIds.add(pl.id);
        bracketParticipants.push(pl);
      }
      // Still short: take anyone left, at random.
      if (bracketParticipants.length < needed) {
        const floorIdx = mode === "qualifying" ? fmt.directCut : 0;
        const rest = db.filter((x, i) => i >= floorIdx && !seenIds.has(x.id) && !excluded.has(x.id));
        shuffle(rest);
        for (const pl of rest) {
          if (bracketParticipants.length >= needed) break;
          seenIds.add(pl.id);
          bracketParticipants.push(pl);
        }
      }
    }

    // Avoid facing the same first-round opponent as in recent matches.
    const recentOpps = new Set((p.matchHistory || []).slice(0, 6).map(mh => mh.opponent));
    if (bracketParticipants.length > 1 && recentOpps.has(bracketParticipants[0]?.name)) {
      const alt = bracketParticipants.findIndex((x, i) => i > 0 && !recentOpps.has(x.name));
      if (alt > 0) {
        [bracketParticipants[0], bracketParticipants[alt]] = [bracketParticipants[alt], bracketParticipants[0]];
      }
    }

    // Simulates the rest of the bracket so we know the player's opponent in
    // every future round (the player is at slot 0 and always advances here).
    const buildBracketOpponents = (participants) => {
      const opponents = [participants[0]];
      let current = [{ __player: true }, ...participants];
      while (current.length > 1) {
        const nextRound = [];
        for (let i = 0; i < current.length; i += 2) {
          if (i === 0) { nextRound.push(current[0]); continue; } // player advances
          const x = current[i], y = current[i + 1];
          if (!y) { nextRound.push(x); continue; }
          const pX = aiMatchProb(x.stats, y.stats, t.surface, isBestOfFiveMatch(fmt, t, mode, 0));
          nextRound.push(random() < pX ? x : y);
        }
        current = nextRound;
        if (current.length > 1) opponents.push(current[1]);
      }
      return opponents; // opponents[i] = opponent in round i
    };

    const bracketOpponents = buildBracketOpponents(bracketParticipants);
    return { bracketParticipants, bracketOpponents };
  };

  // ── LAUNCH TOURNAMENT ────────────────────────────────────────────────────
  const launchTournament = (t, p, db) => {
    const playerRank = getPlayerRanking(totalAtpPoints(p.atpPointsLog), db);
    const fmt = getTournamentFormat(t);
    const naturalEntry = getEntryStatus(t, playerRank);
    // Wildcard grants direct main-draw entry regardless of ranking
    const isWildcard = p.enrollment?.entryStatus === "wildcard";
    const isProtected = p.enrollment?.entryStatus === "protected";
    const entry = isWildcard ? { status: "direct", reason: "Wildcard" } : isProtected ? { status: "direct", reason: "Classement protégé" } : naturalEntry;

    let mode, currentRoundIdx;
    const hasBye = entry.status === "direct" && playerHasBye(fmt, playerRank);

    if (entry.status === "qualifying") {
      mode = "qualifying";
      currentRoundIdx = 0;
    } else if (hasBye) {
      mode = "main";
      currentRoundIdx = 1;
    } else {
      mode = "main";
      currentRoundIdx = 0;
    }

    const isGS = isBestOfFiveMatch(fmt, t, mode, currentRoundIdx);

    const finalsDraw = t.tier === "Finals" ? buildFinalsDraw(db, p) : null;
    const { bracketParticipants, bracketOpponents } = finalsDraw || buildTournamentDraw(t, fmt, mode, db, p);
    const firstOpp = bracketOpponents[currentRoundIdx] || bracketParticipants[1] || bracketParticipants[0];
    const firstOppRank = db.findIndex(x => x.id === firstOpp.id) + 1;

    const matchData = createInitialMatchData(isGS, p.energy, t.surface);
    matchData.tb10Decider = t.tier === "GrandSlam";

    // ── Match-fixing scheduling ────────────────────────────────────────────
    // Roll once per match for a 4% chance to receive a fix offer, only when
    // the opponent is clearly weaker. If rolled, pick a random game (2..6) at
    // which the proposal will appear.
    const myRating = getRating(p.stats);
    const oppRating = getRating(firstOpp.stats);
    const fixEligibleThisMatch = (myRating - oppRating) >= 8;
    const scheduledFixGame = (fixEligibleThisMatch && random() < 0.04)
      ? (2 + Math.floor(random() * 5)) // game 2..6 inclusive
      : null;

    setMatchState({
      phase: "prematch",
      tournament: t,
      format: fmt,
      formatKey: fmt._key,
      mode,
      roundIdx: currentRoundIdx,
      hasBye,
      opponent: firstOpp,
      opponentRank: firstOppRank || 999,
      matchData,
      eventLog: [],
      pendingDilemma: null,
      lastResolveMsg: null,
      tournMatchesPlayed: [],
      playedOpponentIds: [firstOpp.id],
      bracketOpponents,
      bracketParticipants,
      bracketMode: mode,
      qualifyingRoundsWon: 0,
      isGrandSlam: isGS,
      entryStatus: entry.status,
      scheduledFixGame,
      fixOffered: false,
      rr: finalsDraw ? finalsDraw.rr : null,
    });
    setScreen("match");
  };

  // ── PLAY ONE GAME ────────────────────────────────────────────────────────
  // Computes the next game purely, then plays the point-by-point rally
  // animation. The resulting match-state is committed only once the animation
  // finishes (or is skipped), so the scoreboard updates in sync with the rally.
  const playGame = () => {
    // If a simulation is already in flight, the second click means "skip to
    // the end of the current game" — never start a new simulation on top.
    if (pendingCommitRef.current) {
      pendingCommitRef.current();
      return;
    }
    const ms = matchState;
    if (!ms || ms.matchData.matchComplete) return;

    const m = { ...ms.matchData, sets: ms.matchData.sets.map(s => ({ ...s, gameLog: [...s.gameLog] })) };
    // Capture the serving info & current set BEFORE advancing, for the context label.
    const preSet = m.sets[m.sets.length - 1];
    const preSetNum = m.sets.length; // 1-based set number being played (approx)
    const energyBefore = m.playerEnergy;
    const result = advanceMatchOneGame(m, getEffectiveStats(player, { tournamentCity: ms.tournament?.city, opponentCountry: ms.opponent?.nat?.country, surface: ms.tournament?.surface }), ms.opponent.stats);
    // Apply staff energy-drain reduction (e.g. fitness coach).
    const drainCut = Math.max(0, sumStaffEffect(player.staff, "energyDrainCut"));
    if (drainCut > 0) {
      const drain = energyBefore - m.playerEnergy;
      if (drain > 0) m.playerEnergy = Math.min(100, m.playerEnergy + drain * drainCut);
    }

    // Build commentary
    const vars = {
      p: player.name,
      o: ms.opponent.name,
      score: result.setComplete ? (result.setWonByPlayer ? result.score.p + "-" + result.score.o : result.score.o + "-" + result.score.p) : "",
      tbScore: result.tbScore !== undefined ? (result.setWonByPlayer ? result.tbScore + "" : result.tbScore + "") : "",
    };
    if (result.gameType === "tb_won") vars.tbScore = result.tbScore + "";
    if (result.gameType === "tb_lost") vars.tbScore = result.tbScore + "";

    const newEvents = [];
    // Premier jeu du match : commentaires d'ouverture dédiés.
    const isFirstGameOfMatch = m.sets.length === 1 && (m.sets[0].gameLog || []).length === 1 && !result.isTiebreak;
    const firstKey = { hold_easy: "first_hold", hold_tough: "first_hold", break_clean: "first_break", break_grind: "first_break", lose_serve: "first_lose_serve", opp_hold: "first_opp_hold" }[result.gameType];
    const commentKey = isFirstGameOfMatch && firstKey ? firstKey : (result.commentType || result.gameType);
    const gameEvent = { id: Date.now() + random(), type: result.gameType, text: pickComment(commentKey, vars), points: result.points || null, isTiebreak: !!result.isTiebreak, score: { ...result.score, isPlayerServing: result.isPlayerServing, tiebreak: m.sets[m.sets.length - 1].tiebreak } };
    // A game that closes a set is NOT commented on its own: the set comment
    // below says how the set was closed (hold, break, tie-break) instead.
    if (!result.setComplete) newEvents.push(gameEvent);

    if (result.setComplete) {
      const winnerSets = result.setWonByPlayer ? m.pSets : m.oSets;
      const loserSets = result.setWonByPlayer ? m.oSets : m.pSets;
      const setVars = {
        p: player.name, o: ms.opponent.name,
        score: result.setWonByPlayer ? result.score.p + "-" + result.score.o : result.score.o + "-" + result.score.p,
        sets: result.setWonByPlayer ? m.pSets + "-" + m.oSets : m.oSets + "-" + m.pSets,
      };
      const setCtx = m.matchComplete ? "match"
        : (m.pSets + m.oSets === 1) ? "first"
        : winnerSets === loserSets ? "equalize"
        : winnerSets > loserSets ? "lead"
        : "reduce";
      const loserGames = result.setWonByPlayer ? result.score.o : result.score.p;
      const setType = loserGames === 0
        ? (result.setWonByPlayer ? "bagel_won_" : "bagel_lost_") + (m.matchComplete ? "match" : "set")
        : (result.setWonByPlayer ? "set_won_" : "set_lost_") + setCtx;
      // How the set was closed, from the set winner's point of view.
      const gt = result.gameType;
      const tbTxt = "au tie-break (" + (result.tbScore ?? "") + ")";
      const howPools = result.setWonByPlayer
        ? (gt === "tb_won" ? [tbTxt]
          : /break/.test(gt) ? ["sur un break", "en prenant le service de " + ms.opponent.name, "en breakant une dernière fois"]
          : ["sur son service", "sur sa mise en jeu", "en tenant son engagement"])
        : (gt === "tb_lost" ? [tbTxt]
          : (gt === "lose_serve" || gt === "opp_rebreak") ? ["sur un break", "en prenant le service de " + player.name, "en breakant une dernière fois"]
          : ["sur son service", "sur sa mise en jeu", "en tenant son engagement"]);
      setVars.how = howPools[Math.floor(random() * howPools.length)];
      newEvents.push({ ...gameEvent, id: Date.now() + random() + 1, type: result.setWonByPlayer ? "set_won" : "set_lost", text: pickComment(setType, setVars) });
    }

    if (random() < 0.05 && !result.setComplete) {
      const eventTypes = ["crowd_cheer", "challenge"];
      const type = eventTypes[Math.floor(random() * eventTypes.length)];
      newEvents.push({ id: Date.now() + random() + 2, type: "event", text: pickComment(type, vars) });
    }

    // Decide if dilemma should appear
    const totalGamesPlayed = m.sets.reduce((a, s) => a + s.gameLog.length, 0);

    // Forme du jour : allusion discrète après quelques jeux si elle est marquée.
    if (!m.formNoted && totalGamesPlayed >= 3 && !m.matchComplete) {
      m.formNoted = true;
      const pick = arr => arr[Math.floor(random() * arr.length)];
      const lines = [];
      if ((m.playerForm || 0) >= 4) lines.push(pick([player.name + " semble en jambes aujourd'hui.", "Tout paraît facile pour " + player.name + " en ce début de match.", player.name + " a visiblement de bonnes sensations."]));
      else if ((m.playerForm || 0) <= -4) lines.push(pick([player.name + " a l'air emprunté aujourd'hui.", "Quelque chose cloche dans le jeu de " + player.name + ".", player.name + " peine à trouver ses repères."]));
      if ((m.oppForm || 0) >= 4) lines.push(pick([ms.opponent.name + " semble dans un grand jour.", ms.opponent.name + " frappe la balle remarquablement bien.", "Journée faste pour " + ms.opponent.name + "."]));
      else if ((m.oppForm || 0) <= -4) lines.push(pick([ms.opponent.name + " n'a pas l'air dans son assiette.", ms.opponent.name + " multiplie les signes de nervosité.", ms.opponent.name + " semble à court de sensations."]));
      lines.forEach((text, i) => newEvents.push({ id: Date.now() + random() + 3 + i, type: "event", text }));
    }
    let pendingDilemma = null;
    let coachRevealedFor = ms.coachRevealedFor || null; // coach's scouting memory for this match
    // Match-fixing: only pops on the pre-scheduled game (one roll per match).
    const fixDue = ms.scheduledFixGame != null
      && totalGamesPlayed === ms.scheduledFixGame
      && !ms.fixOffered && !ms.pendingDilemma
      && !m.matchComplete && !result.setComplete;
    let fixOffered = ms.fixOffered || false;
    if (fixDue) {
      pendingDilemma = MATCH_FIX_DILEMMA;
      fixOffered = true;
    } else {
      const shouldDilemma = !m.matchComplete && !result.setComplete && totalGamesPlayed >= 3 && random() < 0.18 && !ms.pendingDilemma;
      if (shouldDilemma) {
        const candidate = pickRandomDilemma();
        if (!candidate.requiresCoach || player.staff.some(s => s.role === "Coach")) {
          // The coach's scouting hint only shows up about 30% of the time
          // (decided once, when the dilemma appears).
          const alreadyRevealed = ms.coachRevealedFor && ms.coachRevealedFor === ms.opponent?.name;
          const hint = alreadyRevealed || random() < 0.30;
          pendingDilemma = { ...candidate, coachHint: hint };
          // Once the coach has spotted the weakness, he keeps giving it until the end of the match.
          if (hint && candidate.id === "exploit_weakness" && player.staff.some(s => s.role === "Coach")) {
            coachRevealedFor = ms.opponent?.name || null;
          }
        }
      }
    }

    const committedState = {
      ...ms,
      matchData: m,
      eventLog: [...newEvents.reverse(), ...ms.eventLog].slice(0, 80),
      pendingDilemma,
      fixOffered,
      coachRevealedFor,
      lastResolveMsg: null,
    };

    // ── Animation context label ──────────────────────────────────────────
    // Score BEFORE this game (games in the current set, set count).
    const curSet = m.sets[m.sets.length - 1];
    const setNum = m.sets.length;
    let contextLabel;
    if (result.isTiebreak) {
      contextLabel = "Set " + setNum + " · Tie-break · " + (m.pSets) + "-" + (m.oSets) + " en sets";
    } else {
      // games standing shown is AFTER this game for clarity of stakes
      const pg = result.score.p, og = result.score.o;
      const serveTxt = result.isPlayerServing ? player.name + " au service" : ms.opponent.name + " au service";
      contextLabel = "Set " + setNum + " · " + serveTxt;
    }

    const points = result.points && result.points.length ? result.points : [{ winner: result.gameType && /won|break|hold|rebreak/.test(result.gameType) ? "p" : "o", kind: "winner", rallies: 3, label: "JEU", servingPlayer: !!result.isPlayerServing }];

    // Decompose a point label into per-player cells for the scoreboard.
    // For the deciding "JEU" label, show it only on the winner's line so the
    // loser's line stays at their last score-letter.
    const splitLabel = (label, winner, prevP, prevO) => {
      if (!label) return { p: "0", o: "0" };
      if (label === "JEU") {
        return winner === "p"
          ? { p: "JEU", o: prevO || "—" }
          : { p: prevP || "—", o: "JEU" };
      }
      if (label === "ÉGALITÉ") return { p: "40", o: "40" };
      if (label === "AV. JOUEUR") return { p: "AV", o: "—" };
      if (label === "AV. ADV.") return { p: "—", o: "AV" };
      const [a, b] = label.split("-");
      return { p: a, o: b };
    };

    // Build the shared commit function used by both modes. Calling it again
    // (e.g. user clicking the button mid-simulation) skips to the end.
    const commitNow = () => {
      livePointTimersRef.current.forEach(clearTimeout);
      livePointTimersRef.current = [];
      setMatchState(committedState);
      setRallyAnim(null);
      setLivePoint(null);
      pendingCommitRef.current = null;
    };
    pendingCommitRef.current = commitNow;

    // Reset previous live-point timers (defensive — shouldn't be any).
    livePointTimersRef.current.forEach(clearTimeout);
    livePointTimersRef.current = [];

    // Server of the point about to be played (tiebreaks rotate 1 then 2-2).
    const serverAt = (i) => {
      const pt = points[Math.min(i, points.length - 1)];
      return pt ? !!pt.servingPlayer : !!result.isPlayerServing;
    };

    // Scroll through the points in the scoreboard, then commit.
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
    const scheduleAuto = () => {
      if (matchModeRef.current === "manual") return;
      if (committedState.pendingDilemma || m.matchComplete) return; // stop on events / end
      if (matchPausedRef.current) return; // match en pause
      autoTimerRef.current = setTimeout(() => {
        autoTimerRef.current = null;
        if (matchModeRef.current !== "manual" && playGameRef.current) playGameRef.current();
      }, (result.setComplete ? 1300 : 650) * speedFactor()); // slightly longer pause between sets
    };
    const commitAndMaybeContinue = () => { commitNow(); scheduleAuto(); };
    pendingCommitRef.current = commitAndMaybeContinue;
    setLivePoint({ p: "0", o: "0", server: serverAt(0) });
    let step = 0;
    let prevP = "0", prevO = "0";
    // Super tie-break (10 points): slower points to build suspense.
    // Speed: x2 = reference pace (also used in manual). x1 = everything twice
    // as slow. x4 = twice as fast, except tie-break points which keep their pace.
    const tbFactor = matchModeRef.current === "x1" ? 2 : 1;
    const stepDur = result.isTiebreak
      ? (result.tbTarget === 10 ? 1000 : 800) * tbFactor
      : 380 * speedFactor();
    const runStep = () => {
      // Pause immédiate : on gèle le jeu en cours et on reprendra ici.
      if (matchPausedRef.current) { pausedResumeRef.current = runStep; return; }
      if (step >= points.length) { commitAndMaybeContinue(); return; }
      const pt = points[step];
      const split = splitLabel(pt.label, pt.winner, prevP, prevO);
      // La balle reste sur le serveur du point qui vient d'être joué, puis
      // passe au serveur du point suivant entre les deux points (tie-breaks).
      const servedNow = serverAt(step);
      const servesNext = serverAt(step + 1);
      setLivePoint({ ...split, server: servedNow });
      if (servesNext !== servedNow && step + 1 < points.length) {
        const swapId = setTimeout(() => {
          setLivePoint(lp => (lp ? { ...lp, server: servesNext } : lp));
        }, stepDur * 0.5);
        livePointTimersRef.current.push(swapId);
      }
      prevP = split.p; prevO = split.o;
      step++;
      const id = setTimeout(runStep, stepDur);
      livePointTimersRef.current.push(id);
    };
    const id = setTimeout(runStep, 200 * speedFactor());
    livePointTimersRef.current.push(id);
  };
  playGameRef.current = playGame;
  // Après un choix de dilemme : courte pause pour lire l'effet du choix, puis
  // les jeux reprennent tout seuls (plus besoin de rappuyer sur « Suivant »).
  const resumeAfterDilemma = () => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    autoTimerRef.current = setTimeout(() => {
      autoTimerRef.current = null;
      if (!matchPausedRef.current && playGameRef.current) playGameRef.current();
    }, 2600 * speedFactor());
  };
  const resolveDilemma = (option, dilemma) => {
    // ── Special handling: match-fixing proposal ──
    if (dilemma && dilemma.isMatchFix) {
      setMatchState(ms => {
        const m = { ...ms.matchData };
        let msg = "";
        if (option.matchFix === "accept") {
          // Dirty money scaled to the stage; force the player to lose by tanking
          // momentum hard and applying a heavy persistent debuff for the match.
          const bribe = 8000 + Math.floor(random() * 12000); // 8k–20k €
          m.playerMomentum -= 8;
          m.persistMomentumGames = 99;
          m.persistentDebuff = 8;
          m.persistEnergyDrainGames = 0;
          m.matchFixThrown = true;
          // Suspension risk: 35% chance of being caught → 10–12 weeks out.
          const caught = random() < 0.35;
          setPlayer(p => {
            let np = { ...p, money: p.money + bribe, totalEarnings: (p.totalEarnings || 0) + bribe };
            if (caught) {
              const weeks = 10 + Math.floor(random() * 3); // 10–12
              np.injury = { severity: "suspension", weeksRemaining: weeks, statPenalty: 0, canPlay: false, label: "Suspension (match truqué)" };
              np.image = clampLife((np.image ?? 60) - 30);
              np.popularity = clampLife((np.popularity ?? 20) - 15);
            }
            return np;
          });
          msg = caught
            ? "Vous touchez " + bribe.toLocaleString() + "€... mais l'enquête vous rattrape : suspension de plusieurs semaines et réputation en miettes."
            : "Vous touchez " + bribe.toLocaleString() + "€ et levez discrètement le pied. Personne n'a rien vu... cette fois.";
        } else if (option.matchFix === "report") {
          // 30% chance the public doesn't believe the story.
          const believed = random() < 0.70;
          if (believed) {
            setPlayer(p => ({ ...p, image: clampLife((p.image ?? 60) + 6), popularity: clampLife((p.popularity ?? 20) + 4) }));
            m.playerMomentum += 2;
            msg = "Vous signalez la tentative de corruption. Votre intégrité est saluée.";
          } else {
            setPlayer(p => ({ ...p, image: clampLife((p.image ?? 60) - 5), popularity: clampLife((p.popularity ?? 20) - 3) }));
            m.playerMomentum -= 1;
            msg = "Vous signalez la tentative, mais le public doute de votre version. Votre réputation en pâtit.";
          }
        } else {
          m.playerMomentum += 1;
          msg = "Vous refusez et restez concentré sur votre match.";
        }
        m.playerMomentum = clampMomentum(m.playerMomentum);
        const dEvt = { id: Date.now() + random(), type: "dilemma", title: dilemma.title, choice: option.label, text: msg };
        return { ...ms, matchData: m, pendingDilemma: null, lastResolveMsg: msg, eventLog: [dEvt, ...(ms.eventLog || [])].slice(0, 80) };
      });
      resumeAfterDilemma();
      return;
    }

    setMatchState(ms => {
      const result = resolveDilemmaOption(option, dilemma, ms.opponent, player, ms.matchData.playerMomentum);
      const m = { ...ms.matchData };
      m.playerMomentum += result.effects.momentumDelta;
      m.playerEnergy = Math.max(0, Math.min(100, m.playerEnergy + result.effects.energyDelta));
      if (result.effects.persistGames > 0) {
        m.persistMomentumGames = result.effects.persistGames;
        m.playerMomentum += result.effects.persistMomentum;
      }
      m.playerMomentum = clampMomentum(m.playerMomentum);
      if (result.effects.injury) {
        // Staff "injuryProtect" gives a chance to dodge an injury proc (nutritionist, top kiné)
        const protect = Math.max(0, sumStaffEffect(player.staff, "injuryProtect"));
        if (protect > 0 && random() < protect) {
          // Dodged — minor in-match debuff still applies but no lasting injury
          m.persistEnergyDrainGames = 20;
          m.persistentDebuff = 2;
          result.msg = "Alerte évitée grâce à votre staff médical !";
        } else {
          m.persistEnergyDrainGames = 99;
          m.persistentDebuff = 5;
          // Set a persistent injury on the player (lasts beyond the match)
          const inj = rollInjury();
          setPlayer(p => {
            // Don't overwrite an existing more-severe injury
            if (p.injury && p.injury.weeksRemaining > inj.weeksRemaining) return p;
            // The diagnosis (length of unavailability) is revealed after the tournament.
            return { ...p, injury: inj, injuryNoticePending: true };
          });
          result.msg = inj.label + " ! Vous êtes gêné pour la suite du match.";
        }
      }
      return {
        ...ms,
        matchData: m,
        pendingDilemma: null,
        lastResolveMsg: result.msg,
        eventLog: [{ id: Date.now() + random(), type: "dilemma", title: dilemma?.title, choice: option.label, text: result.msg }, ...(ms.eventLog || [])].slice(0, 80),
      };
    });
    resumeAfterDilemma();
  };

  // ── FINISH MATCH ─────────────────────────────────────────────────────────
  const finishMatch = () => {
    const ms = matchState;
    const m = ms.matchData;
    const won = m.pSets > m.oSets;
    const tourn = ms.tournament;
    const fmt = ms.format;
    const formatKey = ms.formatKey;
    const roundIdx = ms.roundIdx;
    const isQualifying = ms.mode === "qualifying";

    const prizeSplits = PRIZE_SPLITS_V2[formatKey] || PRIZE_SPLITS_V2.ITF;
    const pointSplits = getPointSplits(formatKey, tourn);

    // Compute prize and points based on phase
    let prize = 0, pts = 0;
    let roundLabel;

    if (isQualifying) {
      const qualiSplit = prizeSplits.qualifying;
      const qualiPoints = pointSplits.qualifying;
      // Même logique que le tableau final : perdu au tour r → case r ;
      // gagné → case r + 1 (la dernière case = qualifié).
      const qCredit = won ? roundIdx + 1 : roundIdx;
      prize = Math.round(tourn.prize * (qualiSplit[qCredit] ?? qualiSplit[qualiSplit.length - 1] ?? 0));
      pts = qualiPoints[qCredit] ?? 0;
      roundLabel = "Q" + (roundIdx + 1);
    } else {
      const mainSplit = prizeSplits.main;
      const mainPoints = pointSplits.main;
      // If the player WON this match, they advanced to the next round — credit
      // them at roundIdx + 1, which for the final means the winner bucket.
      // If they LOST, credit at roundIdx (where they were eliminated).
      const creditIdx = won ? roundIdx + 1 : roundIdx;
      prize = Math.round(tourn.prize * (mainSplit[creditIdx] || 0));
      pts = mainPoints[creditIdx] || 0;
      // Si on a gagné la finale, on est vainqueur du tournoi — important pour
      // les trophées qui détectent les titres via m.round === "Vainqueur".
      const isTournamentWin = won && roundIdx === fmt.mainRounds.length - 1;
      roundLabel = isTournamentWin ? "Vainqueur" : (fmt.mainRounds[creditIdx] || "Round " + (creditIdx + 1));
    }

    // Prize money and ATP points are NOT cumulative within a tournament: the
    // player earns what the best round reached is worth (as on the real tour).
    // Each match therefore only credits the difference with what was already
    // credited. Qualifying and main-draw points are counted separately (a
    // qualifier keeps his qualifying points on top of his main-draw points);
    // prize money is a single total (the main-draw prize replaces the qualifying one).
    const prizeAlreadyPaid = ms.tournPrizePaid || 0;
    let prizeEntitled = Math.max(prizeAlreadyPaid, prize);
    prize = prizeEntitled - prizeAlreadyPaid;
    const ptsPhase = isQualifying ? "quali" : "main";
    const ptsAlready = (ms.tournBestPts || {})[ptsPhase] || 0;
    let ptsEntitled = Math.max(ptsAlready, pts);
    pts = ptsEntitled - ptsAlready;
    // Masters : points et prime cumulés match après match (poules comprises).
    const isFinals = tourn.tier === "Finals" && !!ms.rr;
    if (isFinals) {
      const share = won ? (roundIdx < 3 ? FINALS_PRIZE.rr : roundIdx === 3 ? FINALS_PRIZE.sf : FINALS_PRIZE.f) : 0;
      prize = Math.round(tourn.prize * (share + (roundIdx === 0 ? FINALS_PRIZE.base : 0)));
      pts = won ? (roundIdx < 3 ? FINALS_PTS.rr : roundIdx === 3 ? FINALS_PTS.sf : FINALS_PTS.f) : 0;
      prizeEntitled = prizeAlreadyPaid + prize;
      ptsEntitled = ptsAlready + pts;
      roundLabel = won && roundIdx === 4 ? "Vainqueur" : fmt.mainRounds[roundIdx];
    }
    const tournCreditState = {
      tournPrizePaid: prizeEntitled,
      tournBestPts: { ...(ms.tournBestPts || {}), [ptsPhase]: ptsEntitled },
    };

    const finalScore = m.sets.filter(s => s.completed && (s.pGames > 0 || s.oGames > 0)).map(s => s.pGames + "-" + s.oGames + (s.tiebreak ? "(" + (s.winner === "p" ? s.tiebreak.oPts : s.tiebreak.pPts) + ")" : "")).join(" ");

    // ─── Trophy detection flags computed from set logs ───
    // Did the player ever trail 5-0 (in games) within a set and still win that set?
    let comebackInSetFrom5_0 = false;
    // Did the player ever trail 5-0 in the deciding set and still win the match?
    let comebackMatchFrom5_0Decider = false;
    // Three tiebreaks won in this match?
    let threeTiebreaksWon = false;
    let tbWonCount = 0;
    const completedSets = m.sets.filter(s => s.completed);
    completedSets.forEach((set, idx) => {
      // Replay the gameLog to find any moment where opponent led 5-0
      let p = 0, o = 0;
      let trailed5_0 = false;
      for (const g of set.gameLog) {
        if (g.isTiebreak) break; // tiebreak handled separately
        if (g.playerWon) p++; else o++;
        if (o >= 5 && p === 0) trailed5_0 = true;
      }
      if (set.tiebreak && set.winner === "p") tbWonCount++;
      if (trailed5_0 && set.winner === "p") {
        comebackInSetFrom5_0 = true;
        const isDecidingSet = (m.isGrandSlam && idx === completedSets.length - 1 && completedSets.length >= 3)
          || (!m.isGrandSlam && idx === completedSets.length - 1 && completedSets.length === 3);
        if (isDecidingSet && won) comebackMatchFrom5_0Decider = true;
      }
    });
    threeTiebreaksWon = tbWonCount >= 3 && won;

    const matchEntry = {
      tournament: tourn.name, round: roundLabel, won, score: finalScore,
      playedRound: isQualifying ? "Qualif. " + (roundIdx + 1) : (fmt.mainRounds[roundIdx] || "Tour " + (roundIdx + 1)),
      opponent: ms.opponent.name, opponentRank: ms.opponentRank, prize, pts,
      // Notes « sur le papier » au moment du match (pour les wildcards).
      myRating: getRating(player.stats), oppRating: getRating(ms.opponent.stats),
      year: player.year, week: player.week,
      isQualifying,
      tierWon: tourn.tier, // for trophy detection
      // Trophy flags
      opponentName: ms.opponent.name,
      surface: tourn.surface,
      city: tourn.city,
      comebackInSetFrom5_0,
      comebackMatchFrom5_0Decider,
      threeTiebreaksWon,
      tiebreaksWon: tbWonCount,
      setsCount: completedSets.length,
    };

    const newTournMatches = [...ms.tournMatchesPlayed, { won, opponentRank: ms.opponentRank, roundIdx, isQualifying }];

    // Use the actual in-match energy as post-match energy (drained game by game)
    const postMatchEnergy = Math.round(m.playerEnergy);

    // Determine next state
    let continueToNextMatch = false;
    let nextMode = ms.mode;
    let nextRoundIdx = roundIdx + 1;

    // Masters : la phase de poules continue même après une défaite.
    let rrNext = null, finalsOutcome = null;
    if (isFinals) {
      let rr = ms.rr;
      if (roundIdx <= 2) {
        rr = finalsPlayMatchday(rr, roundIdx, won, m.pSets, m.oSets);
        if (roundIdx < 2) {
          continueToNextMatch = true;
        } else {
          const { g, h } = finalsRanked(rr, player);
          const pos = g.indexOf("__me");
          if (pos <= 1) {
            const sfOpp = pos === 0 ? h[1] : h[0];
            const oA = pos === 0 ? h[0] : g[0], oB = pos === 0 ? g[1] : h[1];
            const os = finalsAiMatch(rr.players[oA], rr.players[oB]);
            rr = { ...rr, sf: sfOpp, otherSF: { w: os.w.id, l: os.l.id } };
            continueToNextMatch = true;
          } else {
            finalsOutcome = { groupOut: true };
          }
        }
      } else if (roundIdx === 3) {
        if (won) continueToNextMatch = true;
        else finalsOutcome = { sfLostTo: ms.opponent.id };
      } else {
        finalsOutcome = won ? { champion: true } : { finalLostTo: ms.opponent.id };
      }
      rrNext = rr;
    } else if (won) {
      if (isQualifying) {
        if (roundIdx >= fmt.qualiRounds - 1) {
          continueToNextMatch = true;
          nextMode = "main";
          nextRoundIdx = 0;
        } else {
          continueToNextMatch = true;
          nextMode = "qualifying";
        }
      } else {
        if (roundIdx < fmt.mainRounds.length - 1) {
          continueToNextMatch = true;
          nextMode = "main";
        }
      }
    }

    if (continueToNextMatch) {
      // (Au Masters, on peut continuer après une défaite en poule.)
      const lifeDeltas = computeMatchLifeDeltas(won, ms.opponentRank, false, getPlayerRanking(totalAtpPoints(player.atpPointsLog), atpDb));
      setPlayer(p => adjustLife({
        ...p,
        money: p.money + prize,
        totalEarnings: (p.totalEarnings || 0) + prize,
        // Note: ATP points NOT applied here. They are accumulated in matchState.pendingTournamentPts
        // and flushed to atpPointsLog only when the tournament ends (avoids ranking jumping match by match).
        careerWins: won ? p.careerWins + 1 : p.careerWins,
        careerLosses: won ? p.careerLosses : p.careerLosses + 1,
        seasonBigWins: (p.seasonBigWins || 0) + (won && (ms.opponentRank || 999) <= 50 ? 1 : 0),
        careerBigWins: (p.careerBigWins || 0) + (won && (ms.opponentRank || 999) <= 50 ? 1 : 0),
        energy: Math.min(100, postMatchEnergy + 10), // +10 recovery between tournament matches
        matchHistory: [matchEntry, ...p.matchHistory].slice(0, 80),
        seasonStats: {
          ...(p.seasonStats || { wins: 0, losses: 0, titles: 0, earnings: 0, year: p.year }),
          wins: ((p.seasonStats?.wins) || 0) + (won ? 1 : 0),
          losses: ((p.seasonStats?.losses) || 0) + (won ? 0 : 1),
          earnings: ((p.seasonStats?.earnings) || 0) + prize,
        },
      }, lifeDeltas));

      // Compute the next match opponent now so the user can preview it,
      // but DON'T start the match yet. Show an intermediate result screen
      // with the debrief and wait for the user to click "Continuer".
      const debrief = pickDebrief(m, player.name, ms.opponent.name);
      const playerRank = getPlayerRanking(totalAtpPoints(player.atpPointsLog) + pts, atpDb);
      const playedIds = ms.playedOpponentIds || [];

      let nextOpp, nextOppRank;
      let bracketOpponents = ms.bracketOpponents || [];
      // Qualifié : on tire le vrai tableau final du tournoi (mêmes joueurs que
      // les entrées directes), au lieu de plages de classement.
      let mainDraw = null;
      if (isQualifying && nextMode === "main") {
        mainDraw = buildTournamentDraw(tourn, fmt, "main", atpDb, player, playedIds);
        bracketOpponents = mainDraw.bracketOpponents;
      }
      if (isFinals) {
        const oppId = nextRoundIdx <= 2 ? rrNext.G[RR_SCHEDULE[nextRoundIdx][0][1]] : nextRoundIdx === 3 ? rrNext.sf : rrNext.otherSF.w;
        nextOpp = rrNext.players[oppId];
        nextOppRank = atpDb.findIndex(x => x.id === nextOpp.id) + 1 || 999;
      } else if ((!isQualifying || mainDraw) && bracketOpponents[nextRoundIdx]) {
        nextOpp = bracketOpponents[nextRoundIdx];
        nextOppRank = atpDb.findIndex(x => x.id === nextOpp.id) + 1 || 999;
      } else {
        const picked = pickOpponentForMatch(atpDb, tourn, { isQualifying: nextMode === "qualifying", roundIdx: nextRoundIdx, format: fmt, tier: tourn.tier }, playerRank, playedIds);
        nextOpp = picked.player;
        nextOppRank = picked.rank;
      }

      const newPlayedIds = [...playedIds, nextOpp.id];
      const recoveredEnergy = Math.min(100, postMatchEnergy + 10);
      const oppFatigue = nextRoundIdx * (3 + random() * 3);
      const nextOppEnergy = Math.max(40, 95 - oppFatigue + random() * 5);

      setMatchState(prev => ({
        ...prev,
        phase: "intermediate",
        finalResult: { ...matchEntry, finalScore, debrief },
        tournMatchesPlayed: newTournMatches,
        ...tournCreditState,
        // Accumulate ATP points for this tournament; applied to atpPointsLog only at tournament end
        pendingTournamentPts: [
          ...(prev.pendingTournamentPts || []),
          ...(pts > 0 ? [{ pts, source: tourn.id + ":" + roundLabel }] : []),
        ],
        pendingNextMatch: {
          nextMode, nextRoundIdx, nextOpp, nextOppRank,
          newPlayedIds, recoveredEnergy, nextOppEnergy,
          mainDraw,
        },
        ...(isFinals ? { rr: rrNext } : {}),
      }));
      const enteringMain = nextMode === "main" && ms.mode === "qualifying";
      if (isFinals && nextRoundIdx === 3) notify("Qualifié pour les demi-finales !", "success");
      else if (isFinals && !won) notify("Défaite en poule : tout reste possible", "warn");
      else notify(enteringMain ? "Qualifié pour le tableau principal !" : "Victoire ! " + (nextMode === "qualifying" ? "Q" + (nextRoundIdx + 1) : fmt.mainRounds[nextRoundIdx]), "success");
    } else {
      // Tournament over for the player
      const isTitleWin = won && !isQualifying && roundIdx === fmt.mainRounds.length - 1;
      const ptsTotalForProgression = totalAtpPoints(player.atpPointsLog);
      const rankingForProgression = getPlayerRanking(ptsTotalForProgression, atpDb);
      const progression = computeTournamentProgression(player, newTournMatches, isTitleWin, fmt, tourn, rankingForProgression);

      const newStats = { ...player.stats };
      Object.entries(progression).forEach(([k, v]) => {
        newStats[k] = Math.max(30, Math.min(99, newStats[k] + v));
      });

      // Sponsor title bonuses — capped at 50% of the tournament prize money.
      // This prevents a top-10 player from earning the same sponsor bonus on an
      // ITF (600€ prize) as on a Grand Slam (2M€ prize): the bonus scales naturally
      // with the tournament's actual importance.
      let sponsorTitleBonus = 0;
      if (isTitleWin && player.sponsors && player.sponsors.length > 0) {
        const rawBonus = player.sponsors.reduce((a, s) => a + (s.titleBonus || 0), 0);
        const cap = Math.round(tourn.prize * 0.5);
        sponsorTitleBonus = Math.min(rawBonus, cap);
        if (sponsorTitleBonus > 0) notify("Bonus sponsors pour ce titre : +" + sponsorTitleBonus.toLocaleString() + "€", "success");
      }

      const lifeDeltasFinal = computeMatchLifeDeltas(won, ms.opponentRank, isTitleWin, getPlayerRanking(totalAtpPoints(player.atpPointsLog), atpDb));
      // Flush all ATP points earned during the tournament (accumulated previous rounds + current match).
      // This is the single moment where the ranking actually moves.
      const allTournamentPts = [
        ...(ms.pendingTournamentPts || []),
        ...(pts > 0 ? [{ pts, source: tourn.id + ":" + roundLabel }] : []),
      ];
      setPlayer(p => adjustLife({
        ...p,
        money: p.money + prize + sponsorTitleBonus,
        totalEarnings: (p.totalEarnings || 0) + prize + sponsorTitleBonus,
        sponsorRevenue: (p.sponsorRevenue || 0) + sponsorTitleBonus,
        atpPointsLog: allTournamentPts.length > 0
          ? [...p.atpPointsLog, ...allTournamentPts.map(e => { const pw = pointsWeekAfter(p.week, p.year); return { week: pw.week, year: pw.year, points: e.pts, source: e.source }; })]
          : p.atpPointsLog,
        careerWins: won ? p.careerWins + 1 : p.careerWins,
        careerLosses: !won ? p.careerLosses + 1 : p.careerLosses,
        seasonBigWins: (p.seasonBigWins || 0) + (won && (ms.opponentRank || 999) <= 50 ? 1 : 0),
        careerBigWins: (p.careerBigWins || 0) + (won && (ms.opponentRank || 999) <= 50 ? 1 : 0),
        titlesWon: isTitleWin ? p.titlesWon + 1 : p.titlesWon,
        titlesByTier: isTitleWin
          ? { ...(p.titlesByTier || {}), [tourn.tier]: ((p.titlesByTier || {})[tourn.tier] || 0) + 1 }
          : (p.titlesByTier || {}),
        energy: postMatchEnergy,
        matchHistory: [matchEntry, ...p.matchHistory].slice(0, 80),
        stats: newStats,
        enrollment: null,
        playedThisWeek: [...(p.playedThisWeek || []), tourn.id], // mark as played
        // Gains par édition de tournoi (toute la carrière) pour « Top tournois ».
        tournamentEarnings: [
          ...(p.tournamentEarnings || tournamentEarningsFromHistory(p.matchHistory))
            .filter(e => !(e.name === tourn.name && e.week === p.week && e.year === p.year)),
          { tid: tourn.id, name: tourn.name, week: p.week, year: p.year, prize: prizeEntitled },
        ],
        seasonStats: {
          ...(p.seasonStats || { wins: 0, losses: 0, titles: 0, earnings: 0, year: p.year }),
          wins: ((p.seasonStats?.wins) || 0) + (won ? 1 : 0),
          losses: ((p.seasonStats?.losses) || 0) + (won ? 0 : 1),
          titles: ((p.seasonStats?.titles) || 0) + (isTitleWin ? 1 : 0),
          earnings: ((p.seasonStats?.earnings) || 0) + prize + sponsorTitleBonus,
        },
      }, lifeDeltasFinal));

      // ── Finalize the rest of the bracket for the ATP DB ─────────────────
      // The human tournament is skipped by simulateAtpWeek (via playedThisWeek),
      // so without this step, opponents would have no recentResults / points /
      // season stats recorded for this tournament. We simulate the rest of the
      // bracket here (player exits at `roundIdx` if they lost, or wins it all)
      // and write the results back to the ATP DB.
      // Note: only fires for main-draw brackets (a qualifier gets the real
      // main draw of the tournament when he comes through the qualifying).
      {
        const bracketMode = ms.bracketMode || ms.mode;
        const inMainBracket = bracketMode === "main" && !isQualifying;
        if (isFinals && finalsOutcome) {
          const aiResults = finalsAiResults(rrNext, player, finalsOutcome);
          setAtpDb(currentDb => finalizeHumanTournamentBracket(
            currentDb, tourn, fmt, ms.bracketParticipants, null, false, player.week, player.year, aiResults,
          ));
        } else if (inMainBracket && ms.bracketParticipants && ms.bracketParticipants.length > 0) {
          const playerEliminatedAtRound = isTitleWin ? null : roundIdx;
          setAtpDb(currentDb => finalizeHumanTournamentBracket(
            currentDb,
            tourn,
            fmt,
            ms.bracketParticipants,
            playerEliminatedAtRound,
            false, // isQualifying — we only run for main brackets
            player.week,
            player.year,
          ));
        }
      }

      // Generate news article if the player won a major tournament title
      // (ATP250+). This replaces the would-be NPC winner article since we now
      // skip player-played tournaments in simulateAtpWeek.
      if (isTitleWin) {
        const articleTiers = new Set(["GrandSlam", "Finals", "Masters1000", "ATP500", "ATP250"]);
        if (articleTiers.has(tourn.tier)) {
          const fmtForArticle = TOURNAMENT_FORMATS[tourn.tier] || TOURNAMENT_FORMATS.ATP250_32;
          const playerWinner = {
            id: "human_player",
            name: rankingName(player.name),
            nat: { flag: player.nationalityFlag || CITIES[player.location]?.flag || "🎾", country: player.nationality, code: "" },
          };
          const runnerUp = ms.opponent ? {
            name: ms.opponent.name,
            nat: ms.opponent.nat || { flag: "🎾", country: "" },
          } : null;
          const article = generateTournamentArticle(tourn, playerWinner, runnerUp, [], [], fmtForArticle);
          // Convert into a journalist-style social post (world feed)
          const journoAuthor = pickRandom(SOCIAL_AUTHORS.journalists);
          const journoPost = {
            id: article.id,
            author: journoAuthor,
            content: article.title + (article.body ? " — " + article.body.split(". ")[0] + "." : ""),
            likes: randomLikes(1500, 8000),
            retweets: randomLikes(200, 1200),
            week: player.week, year: player.year,
            feed: "world",
            tournamentMeta: { tier: article.tier, surface: article.surface, city: article.city, winner: article.winner, tournament: article.tournament },
          };
          setNews(prev => [journoPost, ...prev].slice(0, 300));
        }
      }
      // Add personal feed post (always, regardless of tier — for personal feed)
      const personalPost = generatePersonalSocialPost(
        player, tourn, won, isTitleWin,
        ms.opponent ? { name: ms.opponent.name, rank: ms.opponentRank } : null,
        finalScore, player.week, player.year
      );
      if (personalPost) {
        setNews(prev => [personalPost, ...prev].slice(0, 300));
      }

      const debrief = pickDebrief(m, player.name, ms.opponent.name);

      // Update rivalry tracking
      const oppName = ms.opponent?.name;
      if (oppName) {
        setPlayer(p => {
          const rivalries = [...(p.rivalries || [])];
          const idx = rivalries.findIndex(r => r.name === oppName);
          if (idx >= 0) {
            rivalries[idx] = {
              ...rivalries[idx],
              wins: rivalries[idx].wins + (won ? 1 : 0),
              losses: rivalries[idx].losses + (won ? 0 : 1),
              lastYear: p.year,
            };
          } else {
            rivalries.push({ name: oppName, wins: won ? 1 : 0, losses: won ? 0 : 1, lastYear: p.year });
          }
          return { ...p, rivalries };
        });
      }

      // Press conference for ATP250+
      const pressTiers = new Set(["GrandSlam", "Finals", "Masters1000", "ATP500", "ATP250"]);
      let pressConf = null;
      if (pressTiers.has(tourn.tier)) {
        // Build with current player + updated rivalries (approximate — use player state)
        const updatedRivalries = [...(player.rivalries || [])];
        const rIdx = updatedRivalries.findIndex(r => r.name === oppName);
        if (rIdx >= 0) {
          updatedRivalries[rIdx] = {
            ...updatedRivalries[rIdx],
            wins: updatedRivalries[rIdx].wins + (won ? 1 : 0),
            losses: updatedRivalries[rIdx].losses + (won ? 0 : 1),
          };
        } else if (oppName) {
          updatedRivalries.push({ name: oppName, wins: won ? 1 : 0, losses: won ? 0 : 1, lastYear: player.year });
        }
        const playerForPress = { ...player, rivalries: updatedRivalries };
        // Tournament run = matchHistory entries from this tournament+year (oldest first)
        const tournamentRun = (player.matchHistory || [])
          .filter(m => m.tournament === tourn.name && m.year === player.year)
          .slice().reverse();
        // Add current match (not yet in history at this point)
        tournamentRun.push(matchEntry);
        pressConf = buildPressConference(playerForPress, tourn, won, isTitleWin, ms.opponent, ms.opponentRank, tournamentRun);
      }

      setMatchState(prev => ({
        ...prev, phase: pressConf ? "press" : "result",
        finalResult: { ...matchEntry, isTitleWin, prize, pts, finalScore, eliminatedInQuali: !won && isQualifying, debrief },
        progression,
        totalMatchesInTournament: newTournMatches.length,
        pressConference: pressConf ? { questions: pressConf, currentQ: 0, answers: [] } : null,
      }));
    }
  };

  // ── TRAVEL ────────────────────────────────────────────────────────────────
  const travelTo = (cityName) => {
    if (!player) return;
    if (cityName === player.location) { notify("Vous êtes déjà sur place", "info"); return; }
    const cost = travelCostBetween(player.location, cityName);
    if (player.money < cost) { notify("Budget insuffisant", "warn"); return; }
    const fromCity = player.location;
    // Energy drain scales with distance: 3 for short hops (<1000 km),
    // up to 8 for the longest intercontinental flights (~20000 km).
    const km = distanceKm(player.location, cityName);
    const energyCost = km <= 1000
      ? 3
      : Math.min(8, Math.round(3 + ((km - 1000) / 19000) * 5));
    setFlightAnim({ from: fromCity, to: cityName });
    setPlayer(p => ({
      ...p, location: cityName,
      money: p.money - cost,
      totalSpent: (p.totalSpent || 0) + cost,
      energy: Math.max(0, p.energy - energyCost)
    }));
    notify("Vous voilà à " + cityName + " (-" + cost + "€, -" + energyCost + " énergie)", "success");
  };

  // ── HIRE / FIRE STAFF ────────────────────────────────────────────────────
  const hireStaff = (s) => {
    if (challengeActive("seul")) { notify("Défi Seul au monde : aucun staff autorisé.", "warn"); return; }
    if (hasGameOption(player, "no_staff")) { notify("Option Sans staff : aucun staff autorisé.", "warn"); return; }
    if (player.staff.find(st => st.role === s.role)) { notify("Licenciez d'abord la personne actuelle", "warn"); return; }
    if (player.money < s.cost * 4) { notify("Pas assez (1 mois requis)", "warn"); return; }
    setPlayer(p => ({
      ...p, staff: [...p.staff, s],
      money: p.money - s.cost * 4,
      totalSpent: (p.totalSpent || 0) + s.cost * 4,
    }));
    notify(s.name + " rejoint l'équipe !", "success");
  };
  const fireStaff = (s) => {
    setPlayer(p => ({ ...p, staff: p.staff.filter(st => st.id !== s.id) }));
    notify(s.name + " a quitté l'équipe", "info");
  };

  // ── SPONSORS ─────────────────────────────────────────────────────────────
  // Cap per category: 1 equipment maker + 2 other sponsors.
  const acceptSponsorOffer = (offer, terms) => {
    const cat = offer.cat || "other";
    const sameCatSponsors = (player.sponsors || []).filter(s => (s.cat || "other") === cat);
    const cap = SPONSOR_CAPS[cat] || 1;
    if (sameCatSponsors.length >= cap) {
      // Open replacement modal: ask which existing sponsor (of same cat) to cancel.
      setSponsorReplaceModal({ offer, terms, candidates: sameCatSponsors });
      return;
    }
    actuallyAcceptSponsorOffer(offer, terms);
  };
  // Build the final contract from an offer + negotiated terms.
  // terms = { weeklyPay, titleBonus, level } where level is one of the offer's
  // objectiveLevels. Falls back to the medium level / opening pay if absent.
  const buildContractFromOffer = (p, offer, terms) => {
    const lvl = terms?.level
      || (offer.objectiveLevels || []).find(l => l.level === "medium")
      || (offer.objectiveLevels || [])[1]
      || null;
    const weeklyPay = terms?.weeklyPay ?? offer.weeklyPay;
    const titleBonus = terms?.titleBonus ?? offer.titleBonus;
    const reward = Math.round((offer.baseReward || 0) * (lvl?.rewardMul || 1));
    const penalty = Math.round((offer.basePenalty || 0) * (lvl?.penaltyMul || 1));
    const objective = lvl ? { type: lvl.type, target: lvl.target, label: lvl.label, level: lvl.level } : null;
    // Deadline = end of the contract, aligned on the negotiation phases
    // (weeks 26 / 52): 26-week contract → next phase, 52-week → the one after.
    const nextPhase = (w, y) => (w < 26 ? { w: 26, y } : w < 52 ? { w: 52, y } : { w: 26, y: y + 1 });
    let dl = nextPhase(p.week, p.year);
    if ((offer.durationWeeks || 26) >= 52) dl = nextPhase(dl.w, dl.y);
    const objectiveWeek = dl.w, objectiveYear = dl.y;
    const weeksToDeadline = (dl.y - p.year) * 52 + (dl.w - p.week);
    const baseline = { titles: p.titlesWon || 0, wins: p.careerWins || 0, bigwins: p.careerBigWins || 0 };
    return {
      id: offer.id, brand: offer.brand, cat: offer.cat || "other", tier: offer.tier,
      weeklyPay, titleBonus,
      durationWeeks: weeksToDeadline, weeksLeft: weeksToDeadline,
      objective,
      objectiveReward: reward,
      objectivePenalty: penalty,
      objectiveBaseline: baseline,
      objectiveWeek, objectiveYear,
    };
  };
  const actuallyAcceptSponsorOffer = (offer, terms) => {
    setPlayer(p => {
      const offers = (p.sponsorOffers || []).filter(o => o.id !== offer.id);
      const sponsors = [...(p.sponsors || []), buildContractFromOffer(p, offer, terms)];
      return { ...p, sponsorOffers: offers, sponsors };
    });
    notify("Contrat signé avec " + offer.brand + " !", "success");
  };
  // Replace an existing sponsor by accepting a new offer of the same category.
  // Pays the cancellation penalty, then signs the new contract atomically.
  const confirmSponsorReplacement = (sponsorToCancel) => {
    const offer = sponsorReplaceModal?.offer;
    if (!offer) return;
    const penalty = sponsorCancelCost(sponsorToCancel);
    if (player.money < penalty) {
      notify("Fonds insuffisants pour la résiliation (" + penalty.toLocaleString() + "€)", "warn");
      return;
    }
    setPlayer(p => {
      const offers = (p.sponsorOffers || []).filter(o => o.id !== offer.id);
      const remaining = (p.sponsors || []).filter(s => s.id !== sponsorToCancel.id);
      const sponsors = [...remaining, buildContractFromOffer(p, offer, sponsorReplaceModal?.terms)];
      return {
        ...p,
        sponsorOffers: offers,
        sponsors,
        money: p.money - penalty,
        totalSpent: (p.totalSpent || 0) + penalty,
      };
    });
    notify(sponsorToCancel.brand + " résilié (−" + penalty.toLocaleString() + "€), contrat signé avec " + offer.brand, "success");
    setSponsorReplaceModal(null);
  };
  const declineSponsorOffer = (offer) => {
    setPlayer(p => ({ ...p, sponsorOffers: (p.sponsorOffers || []).filter(o => o.id !== offer.id) }));
    notify("Offre de " + offer.brand + " refusée", "info");
  };
  // Résiliation d'un contrat : indemnité de rupture (6 mois de salaire,
  // plafonnée au revenu restant) + pénalité d'objectif si l'objectif n'est pas
  // atteint au moment de la rupture. Sans ça, résilier juste avant l'échéance
  // permettait d'échapper à la pénalité d'objectif pour le prix d'une semaine.
  const sponsorCancelBreakdown = (sponsor) =>
    sponsorCancelBreakdownFor(player, sponsor, atpDb && player ? getPlayerRanking(totalAtpPoints(player.atpPointsLog), atpDb) : 9999);
  const sponsorCancelCost = (sponsor) => sponsorCancelBreakdown(sponsor).total;
  const cancelSponsor = (sponsor) => {
    const { total: penalty, objective: objPenalty } = sponsorCancelBreakdown(sponsor);
    if (player.money < penalty) {
      notify("Fonds insuffisants pour payer la résiliation (" + penalty + "€)", "warn");
      return;
    }
    setPlayer(p => ({
      ...p,
      sponsors: (p.sponsors || []).filter(s => s.id !== sponsor.id),
      money: p.money - penalty,
      totalSpent: (p.totalSpent || 0) + penalty,
    }));
    notify("Contrat avec " + sponsor.brand + " résilié (−" + penalty.toLocaleString() + "€" + (objPenalty > 0 ? ", dont " + objPenalty.toLocaleString() + "€ d'objectif manqué" : "") + ")", "info");
  };

  // ── WILDCARDS ─────────────────────────────────────────────────────────────
  const acceptWildcard = (offer) => {
    if (player.restUntilAbsWeek && (offer.tournamentYear * 52 + offer.tournamentWeek) < player.restUntilAbsWeek) {
      notify("Repos préventif : impossible de jouer ce tournoi.", "warn");
      return;
    }
    {
      const t = ALL_TOURNAMENTS.find(x => x.id === offer.tournamentId);
      const rk = getPlayerRanking(totalAtpPoints(player.atpPointsLog), atpDb);
      if (t && getEntryStatus(t, rk).status === "direct") {
        setPlayer(p => ({
          ...p,
          wildcardOffers: (p.wildcardOffers || []).filter(o => o.tournamentId !== offer.tournamentId || o.tournamentYear !== offer.tournamentYear),
        }));
        notify("Vous avez déjà une entrée directe pour ce tournoi : wildcard inutile.", "info");
        return;
      }
    }
    if (player.enrollment) {
      notify("Vous êtes déjà inscrit à un autre tournoi. Annulez d'abord.", "warn");
      return;
    }
    if (player.injury && !player.injury.canPlay) {
      notify("Vous êtes trop blessé pour accepter.", "warn");
      return;
    }
    setPlayer(p => ({
      ...p,
      wildcardOffers: (p.wildcardOffers || []).filter(o => o.tournamentId !== offer.tournamentId || o.tournamentYear !== offer.tournamentYear),
      wildcardsUsed: [...(p.wildcardsUsed || []), { tournamentId: offer.tournamentId, week: offer.tournamentWeek, year: offer.tournamentYear }],
      enrollment: { tournamentId: offer.tournamentId, week: offer.tournamentWeek, year: offer.tournamentYear, entryStatus: "wildcard" },
    }));
    notify("Wildcard acceptée pour " + offer.tournamentName + " !", "success");
  };
  const declineWildcard = (offer) => {
    setPlayer(p => ({
      ...p,
      wildcardOffers: (p.wildcardOffers || []).filter(o => o.tournamentId !== offer.tournamentId || o.tournamentYear !== offer.tournamentYear),
    }));
    notify("Wildcard refusée", "info");
  };

  // ── VOLUNTARY RETIREMENT ──────────────────────────────────────────────────
  const retire = () => {
    if (!player) return;
    if (!window.confirm("Êtes-vous sûr de vouloir prendre votre retraite ? Cette action est irréversible.")) return;
    // Force the gameover screen with the retirement variant
    setPlayer(p => ({ ...p, _voluntaryRetirement: true }));
    setScreen("gameover");
  };

  // ── SEASON RECAP ─────────────────────────────────────────────────────────
  const dismissSeasonRecap = () => {
    setPlayer(p => ({ ...p, pendingSeasonRecap: null }));
  };

  const rating = useMemo(() => player ? getRating(player.stats) : 0, [player?.stats]);
  const totalPts = useMemo(() => player ? totalAtpPoints(player.atpPointsLog) : 0, [player?.atpPointsLog]);
  const ranking = useMemo(() => (player && atpDb) ? getPlayerRanking(totalPts, atpDb) : 1200, [totalPts, atpDb]);
  const raceRank = useMemo(() => playerRaceRank(player, atpDb), [player?.atpPointsLog, player?.year, atpDb]);
  setPlayerRaceRank(raceRank);
  setActiveChallenge(player?.challenge || null);

  // ─── MENU ──────────────────────────────────────────────────────────────────
  const deleteSaveDialog = confirmDelete !== null && (
    <div style={{
      position: "fixed", inset: 0, background: T.overlay,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, zIndex: 500,
    }} onClick={() => setConfirmDelete(null)}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.bg1, borderRadius: 3, padding: 22,
        border: "1px solid " + T.redBrd,
        maxWidth: 340, width: "100%",
        boxShadow: "0 10px 30px var(--tm-shadow)",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 3, marginBottom: 12,
          background: T.redSub, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="trash" size={20} color={T.red} />
        </div>
        <div style={{ color: T.fg, fontSize: 17, fontWeight: 600, marginBottom: 8 }}>
          Effacer la carrière {slotMetas[confirmDelete]?.name ? "de " + slotMetas[confirmDelete].name : ""} ?
        </div>
        <div style={{ color: T.fg3, fontSize: 13, lineHeight: 1.5, marginBottom: 18 }}>
          Cette carrière, son classement, vos titres et votre argent seront définitivement supprimés.
          <strong style={{ color: T.red }}> Aucun retour en arrière ne sera possible.</strong>
        </div>
        <button style={{ ...styles.btnPrimary, background: T.red, boxShadow: "0 3px 0 " + T.redBrd }} onClick={doDeleteSave}>
          Oui, tout effacer
        </button>
        <button style={{ ...styles.btnSecondary, marginTop: 8 }} onClick={() => setConfirmDelete(null)}>Annuler</button>
      </div>
    </div>
  );

  if (screen === "records") return <RecordsScreen onBack={() => setScreen("menu")} />;

  const multiOwned = hasPurchased("multi_careers");
  if (screen === "challenges") return (
    <>
      {deleteSaveDialog}
      <ChallengesScreen
        onBack={() => { refreshSlots(); setScreen("menu"); }}
        onStart={startChallenge}
        onResume={() => loadSave(CHALLENGE_SLOT)}
        onAbandon={() => deleteSave(CHALLENGE_SLOT)}
        current={challengeMeta}
        owned={hasPurchased("dlc_challenges")}
        goShop={() => { setMenuShop(true); setScreen("menu"); }}
      />
      {notification && (
        <div style={{ ...styles.notif, bottom: 24, borderLeftColor: notification.type === "success" ? T.green : notification.type === "warn" ? T.amber : T.blue }}>{notification.msg}</div>
      )}
    </>
  );
  if (screen === "menu" && menuShop) return (
    <div style={styles.root}>
      <div style={{ padding: "16px 16px 0" }}>
        <button style={{ ...styles.btnSmall, display: "flex", alignItems: "center", gap: 6 }} onClick={() => { setMenuShop(false); refreshSlots(); }}>
          <Icon name="arrowLeft" size={14} /> Menu principal
        </button>
      </div>
      <ShopScreen notify={notify} />
      {notification && (
        <div style={{ ...styles.notif, bottom: 24, borderLeftColor: notification.type === "success" ? T.green : notification.type === "warn" ? T.amber : T.blue }}>{notification.msg}</div>
      )}
    </div>
  );

  if (screen === "menu") return (
    <div style={styles.root}>
      {deleteSaveDialog}
      {notification && (
        <div style={{ ...styles.notif, bottom: 24, borderLeftColor: notification.type === "success" ? T.green : notification.type === "warn" ? T.amber : T.blue }}>{notification.msg}</div>
      )}
      <div style={styles.menuBg} className="tm-grain">
        <div style={styles.menuCard}>
          <div style={{ position: "relative", zIndex: 2, width: "100%", textAlign: "center" }}>
            <div style={{
              width: 76, height: 76, margin: "4px auto 16px", borderRadius: 24,
              background: T.greenSub, border: "1px solid " + T.greenBrd,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: "rotate(-6deg)",
            }}>
              <Icon name="racquet" size={40} color={T.green} strokeWidth={1.6} />
            </div>
            <h1 style={styles.menuTitle}>Courtside</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 18px" }}>
              <div style={{ flex: 1, height: 1, background: T.brd2 }} />
              <Icon name="ball" size={14} color={T.ball} />
              <div style={{ flex: 1, height: 1, background: T.brd2 }} />
            </div>
            <p style={styles.menuTagline}>Entraînez-vous, voyagez, signez vos sponsors et grimpez au classement, semaine après semaine.</p>
            {[0, 1, 2].map(i => {
              const meta = slotMetas[i];
              const locked = i > 0 && !multiOwned;
              if (meta) {
                return (
                  <div key={i} style={{ background: T.bg2, border: "1px solid " + T.brd2, borderRadius: 3, padding: 12, marginBottom: 10, textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div className="tm-num" style={{ color: T.fg5, fontSize: 11, width: 14 }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: T.fg, fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {meta.flag && <FlagFromEmoji emoji={meta.flag} size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />}{meta.name}
                        </div>
                        <div style={{ color: T.fg4, fontSize: 12, marginTop: 2 }}>
                          {meta.circuit === "wta" ? "WTA" : "ATP"} · {meta.rank && meta.rank <= 1200 ? "N°" + meta.rank : (meta.circuit === "wta" ? "Non classée" : "Non classé")} · Sem. {meta.week} · {meta.year}
                        </div>
                      </div>
                      <button
                        style={{ background: "none", border: "none", padding: 6, cursor: "pointer", color: T.fg4, display: "flex" }}
                        onClick={() => deleteSave(i)} title="Effacer cette carrière"
                      ><Icon name="trash" size={16} color={T.fg4} /></button>
                    </div>
                    <button style={{ ...styles.btnPrimary, padding: "11px 16px", fontSize: 14 }} onClick={() => loadSave(i)}>Reprendre</button>
                  </div>
                );
              }
              return (
                <button
                  key={i}
                  style={{ ...styles.btnSecondary, marginBottom: 10, display: "flex", alignItems: "center", gap: 10, textAlign: "left", opacity: locked ? 0.75 : 1 }}
                  onClick={() => {
                    if (locked) { setMenuShop(true); return; }
                    setSlot(i);
                    slotRef.current = i;
                    setCreateStep(-1);
                    setCircuitInput("atp");
                    setAvatarInput(a => a.female ? { ...a, female: false, hairStyle: "short" } : a);
                    setScreen("create");
                  }}
                >
                  <span className="tm-num" style={{ color: T.fg5, fontSize: 11, width: 14 }}>{i + 1}</span>
                  <span style={{ flex: 1 }}>{locked ? "Emplacement verrouillé" : "Nouvelle carrière"}</span>
                  <Icon name={locked ? "lock" : "plus"} size={16} color={locked ? T.amber : T.green} />
                </button>
              );
            })}
            <button style={{
              ...styles.btnPrimary, marginTop: 6, marginBottom: 3,
              background: T.clay, boxShadow: "0 3px 0 " + avatarTone("#b95d38", -0.3),
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }} onClick={() => setScreen("challenges")}>
              <Icon name="target" size={16} color={T.onAccent} /> Défis
              {challengeMeta && <span style={{ fontSize: 12, fontWeight: 500 }}>· en cours</span>}
              {!hasPurchased("dlc_challenges") && <Icon name="lock" size={13} color={T.onAccent} />}
            </button>
            <button style={{ ...styles.btnSecondary, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setScreen("records")}>
              <Icon name="trophy" size={16} color={T.amber} /> Records
            </button>
            <button style={{ ...styles.btnSecondary, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setMenuShop(true)}>
              <Icon name="bag" size={16} color={T.amber} /> Boutique
            </button>
            <p style={{ color: T.fg5, fontSize: 12, marginTop: 22, fontFamily: T.mono }}>v3.0</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── CREATE ────────────────────────────────────────────────────────────────
  // ─── CREATE ────────────────────────────────────────────────────────────────
  if (screen === "create") {
    const selectedStyle = PLAYER_STYLES[styleInput];
    const goToProfileStep = () => setCreateStep(1);
    const goBackToIdentity = () => setCreateStep(0);

    // ÉTAPE PRÉALABLE : choix du classement (ATP ou WTA)
    if (createStep === -1) {
      const pick = (id) => {
        setCircuit(id === "wta" ? "wta" : "atp");
        setCircuitInput(id);
        setNameInput("");
        // Avatar féminin pour la WTA, masculin pour l'ATP.
        setAvatarInput(a => id === "wta"
          ? (a.female ? a : { ...a, female: true, hairStyle: "ponytail" })
          : (a.female ? { ...a, female: false, hairStyle: "short" } : a));
        setCreateStep(0);
      };
      return (
        <div style={styles.root}>
          <div style={styles.menuBg}>
            <div style={{ ...styles.menuCard, gap: 14, alignItems: "stretch", maxWidth: 380 }}>
              <h2 style={{ color: T.fg, fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>Quel circuit ?</h2>
              <div style={{ color: T.fg4, fontSize: 13, textAlign: "center", lineHeight: 1.5 }}>
                Choisissez le circuit de votre carrière.
              </div>
              {[
                { id: "atp", label: "Circuit masculin", sub: "Carrière d'un joueur", accent: "#4d7a3a", sample: { female: false, hairStyle: "short", shirt: "#4d7a3a" } },
                { id: "wta", label: "Circuit féminin", sub: "Carrière d'une joueuse", accent: "#b23f73", sample: { female: true, hairStyle: "ponytail", shirt: "#b23f73" } },
              ].map(c => {
                return (
                  <button key={c.id} data-nofem="" onClick={() => pick(c.id)} style={{
                    display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
                    background: T.bg1, border: "1.5px solid " + c.accent, borderRadius: 3,
                    padding: 14, cursor: "pointer", fontFamily: T.body,
                  }}>
                    <Avatar config={{ ...avatarInput, ...c.sample }} size={64} />
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, color: c.accent, fontSize: 18, fontWeight: 700, fontFamily: T.display }}>
                        {c.label}
                      </span>
                      <span style={{ display: "block", color: T.fg4, fontSize: 12, marginTop: 2 }}>{c.sub}</span>
                    </span>
                    <Icon name="chevronRight" size={18} color={T.fg4} />
                  </button>
                );
              })}
              <button style={styles.btnSecondary} onClick={() => { setCircuit("atp"); setScreen("menu"); }}>Retour</button>
            </div>
          </div>
        </div>
      );
    }

    // STEP 0 : IDENTITY (name + avatar)
    if (createStep === 0) {
      return (
        <div style={styles.root}>
          <div style={styles.menuBg}>
            <div style={{ ...styles.menuCard, gap: 14, alignItems: "stretch", maxWidth: 380 }}>
              <h2 style={{ color: T.fg, fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>Étape 1/2 · Identité</h2>
              <div style={{
                background: T.bg1, borderRadius: 3, padding: "10px 12px",
                border: "1px solid var(--tm-brd)",
                fontSize: 11.5, color: T.fg4, lineHeight: 1.5,
              }}>
                Choisissez votre nom, votre nationalité et personnalisez votre avatar.
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Nom du joueur</label>
                <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                  <input style={{ ...styles.input, flex: 1, minWidth: 0 }} placeholder={circuitInput === "wta" ? "Ex: Léa Martin" : "Ex: Thomas Martin"} value={nameInput} onChange={e => setNameInput(e.target.value)} />
                  <button
                    type="button"
                    title="Nom au hasard"
                    onClick={() => setNameInput(randomFullName(nationalityInput, circuitInput === "wta"))}
                    style={{
                      flexShrink: 0, width: 46, borderRadius: 3, cursor: "pointer",
                      background: T.bg2, border: "1px solid " + T.greenBrd,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Icon name="dice" size={20} color={T.green} />
                  </button>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Nationalité</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 30, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                    {nationalityInput
                      ? <FlagFromEmoji emoji={(Object.values(CITIES).find(c => c.country === nationalityInput) || {}).flag} size={16} />
                      : <Icon name="flag" size={16} color={T.fg4} />}
                  </div>
                  <select
                    value={nationalityInput}
                    onChange={e => setNationalityInput(e.target.value)}
                    style={{ ...styles.input, flex: 1, minWidth: 0, appearance: "auto" }}
                  >
                    <option value="">Choisir un pays…</option>
                    {[...new Set(Object.values(CITIES).map(c => c.country))]
                      .sort((a, b) => a.localeCompare(b, "fr"))
                      .map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ color: T.fg5, fontSize: 11, marginTop: 6 }}>
                  Indépendante de votre ville de départ. Elle compte pour jouer à domicile.
                </div>
              </div>

              <div>
                <label style={styles.label}>Avatar</label>
                <div style={{
                  background: T.bg1, borderRadius: 3, padding: 14,
                  border: "1px solid var(--tm-brd)",
                }}>
                  <AvatarBuilder config={avatarInput} onChange={setAvatarInput} />
                </div>
              </div>

              <button
                style={{ ...styles.btnPrimary, opacity: (nameInput.length < 2 || !nationalityInput) ? 0.4 : 1, marginTop: 4 }}
                disabled={nameInput.length < 2 || !nationalityInput}
                onClick={goToProfileStep}
              >
                Suivant
              </button>
              <button style={styles.btnSecondary} onClick={() => setCreateStep(-1)}>Retour</button>
            </div>
          </div>
        </div>
      );
    }

    // STEP 1 : PROFILE (style + city)
    return (
      <div style={styles.root}>
        <div style={styles.menuBg}>
          <div style={{ ...styles.menuCard, gap: 16, alignItems: "stretch", maxWidth: 380 }}>
            <h2 style={{ color: T.fg, fontSize: 22, fontWeight: 800, margin: 0, textAlign: "center" }}>Étape 2/2 · Profil</h2>
            <div style={{
              background: T.bg1, borderRadius: 3, padding: "10px 12px",
              border: "1px solid var(--tm-brd)",
              fontSize: 11.5, color: T.fg4, lineHeight: 1.5,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Avatar config={avatarInput} size={40} />
              <div style={{ minWidth: 0 }}>
                <div style={{ color: T.fg, fontSize: 13, fontWeight: 700 }}>{nameInput}</div>
                <div style={{ fontSize: 11 }}>Votre <strong style={{ color: T.fg }}>ville de départ</strong> est seulement votre point de départ sur le circuit.</div>
              </div>
            </div>

            <div>
              <label style={styles.label}>Style de jeu</label>
              <div style={styles.styleGrid}>
                {Object.values(PLAYER_STYLES).map(s => (
                  <button key={s.id} style={{ ...styles.styleBtn, ...(styleInput === s.id ? styles.styleBtnActive : {}) }} onClick={() => setStyleInput(s.id)}>
                    <Icon name={s.iconName} size={24} color={styleInput === s.id ? T.green : T.fg3} />
                    <div style={{ fontWeight: 800, fontSize: 12, marginTop: 4 }}>{s.name}</div>
                  </button>
                ))}
              </div>
              <div style={{ color: T.fg4, fontSize: 12, marginTop: 8, textAlign: "center", minHeight: 30 }}>{selectedStyle.desc}</div>
            </div>

            <div>
              <label style={styles.label}>Ville de départ</label>
              <div style={{ color: T.fg4, fontSize: 11, marginTop: -4, marginBottom: 8 }}>
                Chaque région a son circuit proche, avec ses surfaces. L'argent de départ compense les écarts de coût des voyages.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {START_CITIES.map(({ city, desc, money }) => {
                  const info = CITIES[city];
                  const isActive = startCityInput === city;
                  return (
                    <button
                      key={city}
                      onClick={() => setStartCityInput(city)}
                      style={{
                        ...styles.styleBtn,
                        ...(isActive ? styles.styleBtnActive : {}),
                        flexDirection: "column", alignItems: "flex-start", gap: 6, padding: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                        <FlagFromEmoji emoji={info?.flag} size={16} />
                        <div style={{ textAlign: "left", minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{city}</div>
                          <div style={{ fontSize: 10, color: T.fg4, marginTop: 2, fontWeight: 500 }}>{info?.country}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10.5, color: T.fg4, textAlign: "left", lineHeight: 1.3 }}>{desc}</div>
                      <div className="tm-num" style={{ fontSize: 11, color: T.green, fontWeight: 700 }}>{money.toLocaleString("fr-FR")} € au départ</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={styles.label}>Difficulté</label>
              <div style={{ color: T.fg4, fontSize: 11, marginTop: -4, marginBottom: 8 }}>
                Elle multiplie votre score de carrière, celui des classements. Seul le niveau Légende permet de viser le sommet.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 4 }}>
                {DIFFICULTY_LEVELS.map(d => {
                  const isActive = difficultyInput === d.level;
                  return (
                    <button key={d.level} onClick={() => setDifficultyInput(d.level)} style={{
                      ...styles.styleBtn, ...(isActive ? styles.styleBtnActive : {}),
                      flexDirection: "column", gap: 2, padding: "8px 2px", minHeight: 56,
                    }}>
                      <div style={{ fontWeight: 800, fontSize: 11 }}>{d.name}</div>
                      <div className="tm-num" style={{ fontSize: 13, fontWeight: 800, color: isActive ? T.green : T.amber }}>{formatMultiplier(d.scoreMul)}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ color: T.fg4, fontSize: 12, marginTop: 8, textAlign: "center", minHeight: 30 }}>
                {DIFFICULTY_LEVELS.find(d => d.level === difficultyInput)?.desc}
              </div>
            </div>

            <div>
              <label style={styles.label}>Options de partie</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {GAME_OPTIONS.map(o => {
                  const on = gameOptionsInput.includes(o.id);
                  return (
                    <label key={o.id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", minHeight: 44, boxSizing: "border-box",
                      background: T.bg1, borderRadius: 3, cursor: "pointer",
                      border: "1.5px solid " + (on ? T.green : "var(--tm-brd)"),
                    }}>
                      <input type="checkbox" checked={on} onChange={() => setGameOptionsInput(list => on ? list.filter(x => x !== o.id) : [...list, o.id])} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontWeight: 700, fontSize: 13, color: T.fg }}>{o.name}</span>
                        <span style={{ display: "block", fontSize: 11, color: T.fg4 }}>{o.desc}</span>
                      </span>
                      <span className="tm-num" style={{ fontWeight: 800, fontSize: 12, color: T.amber }}>+{Math.round(o.bonus * 100)} %</span>
                    </label>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 12px", borderRadius: 3, background: T.bg2 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.fg3 }}>Multiplicateur de score</span>
                <span className="tm-num" style={{ fontSize: 22, fontWeight: 800, color: T.green }}>{formatMultiplier(scoreMultiplier(difficultyInput, gameOptionsInput))}</span>
              </div>
            </div>

            <div style={styles.statPreview}>
              <p style={{ color: T.fg4, fontSize: 12, margin: "0 0 8px" }}>Stats de départ (variation aléatoire à chaque partie)</p>
              {Object.entries({ serve: "Service", forehand: "Coup droit", backhand: "Revers", stamina: "Endurance", mental: "Mental", net: "Filet" }).map(([k, label]) => {
                const v = selectedStyle.base[k] + START_STAT_BONUS - 1;
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 90, fontSize: 11, color: T.fg3 }}>{label}</div>
                    <div style={{ flex: 1, height: 6, background: T.bg3, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: v + "%", height: "100%", background: T.green }} />
                    </div>
                    <div className="tm-num" style={{ width: 28, textAlign: "right", fontSize: 11, color: T.fg }}>{v}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: T.bg1, borderRadius: 3, padding: 12, border: "1px solid var(--tm-brd)", fontSize: 12, color: T.fg4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Icon name="money" size={12} color={T.green} /> {startMoney(startCityInput, gameOptionsInput).toLocaleString("fr-FR")} €
              <span style={{ color: T.fg5 }}>·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="location" size={12} color={T.green} />
                {startCityInput}
                <FlagFromEmoji emoji={CITIES[startCityInput]?.flag} size={12} />
                <span style={{ color: T.fg4 }}>{CITIES[startCityInput]?.country}</span>
              </span>
              <span style={{ color: T.fg5 }}>·</span>
              <Icon name="trophy" size={12} color={T.amber} /> 0 pt ATP
              <span style={{ color: T.fg5 }}>·</span>
              <Icon name="energy" size={12} color={T.green} /> 100%
            </div>

            <button
              style={{ ...styles.btnPrimary, opacity: nameInput.length < 2 ? 0.4 : 1 }}
              disabled={nameInput.length < 2}
              onClick={() => {
                setSeed(newSeed());
                setCircuit(circuitInput);
                const newPlayer = createInitialPlayer(nameInput, styleInput, startCityInput, nationalityInput || undefined, avatarInput, difficultyInput, gameOptionsInput);
                newPlayer.circuit = circuitInput;
                const newDb = generateAtpDatabase();
                // Starter sponsor: a low-tier offer to introduce the negotiation
                // scene and let the player earn a little from the start.
                const startRanking = 1100;
                const starter = generateSponsorOffer(startRanking, 0, [], newPlayer.image, {}, 2026, newPlayer.startDifficulty);
                if (starter) {
                  newPlayer.sponsorOffers = [{ ...starter, week: 1, year: 2026 }];
                }
                setPlayer(newPlayer);
                setAtpDb(newDb);
                setNews([]);
                setScreen("hub");
                setActiveTab("hub");
                setCreateStep(-1); // reset for next time
                // Open the intro negotiation scene right away (if an offer exists).
                if (starter) {
                  setSponsorNegotiation({
                    phase: "intro", year: 2026, ranking: startRanking,
                    results: [], objMoney: 0,
                  });
                }
              }}
            >
              Lancer la carrière
            </button>
            <button style={styles.btnSecondary} onClick={goBackToIdentity}>← Étape précédente</button>
          </div>
        </div>
      </div>
    );
  }

  if (!player || !atpDb) return null;

  // ─── GAME OVER (Bankruptcy / Forced retirement at 40 / Voluntary retirement) ──
  if (screen === "gameover") {
    const isForcedRetirement = (player.age || 0) >= RETIREMENT_AGE;
    const isVoluntaryRetirement = !!player._voluntaryRetirement;
    const isRetirement = isForcedRetirement || isVoluntaryRetirement;
    const summary = computeCareerSummary(player);
    const legacy = computeLegacyScore(player, summary);
    const breakdown = computeLegacyBreakdown(player, summary);
    const tier = legacyTier(legacy);
    return (
      <div style={styles.root}>
        <div style={{ ...styles.menuBg, padding: 24, alignItems: "flex-start", paddingTop: 40 }}>
          <div style={{ ...styles.menuCard, maxWidth: 380, alignItems: "stretch" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: 8 }}><Icon name={isRetirement ? "trophy" : "wallet"} size={56} color={isRetirement ? T.amber : T.red} /></div>
              <h1 style={{ color: isRetirement ? T.amber : T.red, fontSize: 26, margin: 0, fontWeight: 900 }}>
                {isRetirement ? "Retraite" : "Fin de carrière"}
              </h1>
              <p style={{ color: T.fg4, fontSize: 13, margin: "8px 0 24px" }}>
                {isVoluntaryRetirement ? "Vous avez choisi de raccrocher" : isForcedRetirement ? "40 ans : il est temps de raccrocher" : "Banqueroute"}
              </p>
            </div>

            {/* Legacy score */}
            <div style={{ background: T.bg1, borderRadius: 3, padding: "20px 16px", marginBottom: 12, border: "1px solid " + tier.color + "55", textAlign: "center", boxShadow: "0 0 30px " + tier.color + "22" }}>
              <div style={{ color: T.fg4, fontSize: 11, fontWeight: 700, letterSpacing: 0.2, textTransform: "none", marginBottom: 6 }}>Score de légende</div>
              <div style={{ color: tier.color, fontWeight: 900, fontSize: 46, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{legacy.toLocaleString()}</div>
              <div style={{ display: "inline-block", marginTop: 10, padding: "4px 14px", borderRadius: 3, background: tier.color + "22", border: "1px solid " + tier.color + "66", color: tier.color, fontWeight: 800, fontSize: 13, letterSpacing: 0.2 }}>{tier.label}</div>
            </div>

            {/* Score breakdown */}
            <div style={{ background: T.bg1, borderRadius: 3, padding: 16, marginBottom: 12, border: "1px solid var(--tm-brd)" }}>
              <div style={{ color: T.fg4, fontSize: 11, fontWeight: 700, letterSpacing: 0.2, textTransform: "none", marginBottom: 10 }}>Détail du score</div>
              {breakdown.rows.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "4px 0", fontSize: 12.5, borderBottom: "1px solid var(--tm-bg1)" }}>
                  <span style={{ color: T.fg3 }}>{r.label} <span style={{ color: T.fg5, fontSize: 11 }}>({r.detail})</span></span>
                  <strong style={{ color: T.fg, fontFamily: "monospace" }}>+{r.pts.toLocaleString()}</strong>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 4px", fontSize: 12.5, borderBottom: "1px solid var(--tm-bg1)", color: T.fg4 }}>
                <span>Sous-total</span>
                <strong style={{ color: T.fg3, fontFamily: "monospace" }}>{breakdown.subtotal.toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12.5 }}>
                <span style={{ color: T.amber }}>{breakdown.diffPct >= 0 ? "Bonus" : "Malus"} difficulté <span style={{ color: T.fg5, fontSize: 11 }}>({breakdown.mulLabel})</span></span>
                <strong style={{ color: T.amber, fontFamily: "monospace" }}>{breakdown.difficultyBonus >= 0 ? "+" : "−"}{Math.abs(breakdown.difficultyBonus).toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", marginTop: 4, borderTop: "1px solid var(--tm-bg4)", fontSize: 14 }}>
                <strong style={{ color: T.fg }}>Total</strong>
                <strong style={{ color: tier.color, fontFamily: "monospace", fontSize: 16 }}>{breakdown.total.toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ background: T.bg1, borderRadius: 3, padding: 16, marginBottom: 12, border: "1px solid var(--tm-brd)", textAlign: "center" }}>
              <div style={{ color: T.fg, fontSize: 13, lineHeight: 1.5, fontStyle: "italic" }}>
                {isRetirement
                  ? `Après une longue carrière sur le circuit, ${player.name} décide de prendre une retraite bien méritée. Place à la nouvelle génération !`
                  : `Le tennis professionnel est impitoyable. Faute de moyens pour continuer, ${player.name} a dû mettre un terme à son rêve.`}
              </div>
            </div>

            {/* Career records */}
            <div style={{ background: T.bg1, borderRadius: 3, padding: 16, marginBottom: 12, border: "1px solid var(--tm-brd)" }}>
              <div style={{ color: T.amber, fontWeight: 800, fontSize: 13, marginBottom: 12, textAlign: "center" }}><Icon name="chart" size={11} /> Bilan de carrière</div>
              {[
                { l: "Âge final", v: player.age + " ans", c: T.fg },
                { l: "Meilleur classement", v: "#" + (summary.bestRank === 9999 ? "—" : summary.bestRank), c: T.amber },
                { l: "Semaines n°1", v: summary.weeksNo1, c: summary.weeksNo1 > 0 ? "#b8891f" : T.fg4, hide: summary.weeksNo1 === 0 },
                { l: "Semaines top 10", v: summary.weeksTop10, c: T.green, hide: summary.weeksTop10 === 0 },
                { l: "Titres remportés", v: player.titlesWon, c: T.amber },
                { l: "Dont Grands Chelems", v: summary.gsTitles, c: "#b8891f", hide: summary.gsTitles === 0 },
                { l: "Victoires en carrière", v: player.careerWins, c: T.green },
                { l: "Meilleure série", v: summary.bestStreak + " v.", c: T.green, hide: summary.bestStreak < 2 },
                { l: "Objectifs sponsors atteints", v: (player.careerObjectivesMet || 0), c: "var(--tm-blue)", hide: (player.careerObjectivesMet || 0) === 0 },
                { l: "Gains totaux", v: (player.totalEarnings || 0).toLocaleString() + "€", c: T.green },
                { l: "Saisons jouées", v: summary.seasons, c: T.fg },
              ].filter(row => !row.hide).map((row, i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: T.fg4, fontSize: 13, borderBottom: i < arr.length - 1 ? "1px solid var(--tm-bg1)" : "none" }}>
                  <span>{row.l}</span><strong style={{ color: row.c }}>{row.v}</strong>
                </div>
              ))}
              {summary.bestRivalry && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--tm-bg4)", color: T.fg4, fontSize: 12, textAlign: "center" }}>
                  Plus grande rivalité : <strong style={{ color: T.fg }}>{summary.bestRivalry.name}</strong>
                  <span style={{ color: T.fg5 }}> ({summary.bestRivalry.wins}V–{summary.bestRivalry.losses}D)</span>
                </div>
              )}
            </div>

            <button style={{ ...styles.btnPrimary, marginTop: 4 }} onClick={() => {
              try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(slotMetaKeyFor(slot)); } catch (e) {}
              setPlayer(null);
              setAtpDb(null);
              setNews([]);
              setMatchState(null);
              setCircuit("atp");
              refreshSlots();
              setScreen("menu");
            }}>Nouvelle carrière</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── SETTINGS SCREEN ───────────────────────────────────────────────────────
  if (screen === "settings") {
    return (
      <div style={styles.root}>
        {deleteSaveDialog}
        <div style={{ ...styles.menuBg, padding: 24, alignItems: "flex-start", paddingTop: 40 }}>
          <div style={{ ...styles.menuCard, maxWidth: 380, alignItems: "stretch", gap: 14 }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <Icon name="cog" size={36} color={T.fg3} strokeWidth={1.5} />
              <h1 style={{ color: T.fg, fontSize: 22, margin: "8px 0 4px", fontWeight: 900, letterSpacing: 0.2 }}>Réglages</h1>
              <p style={{ color: T.fg4, fontSize: 12, margin: 0 }}>Paramètres de la partie en cours</p>
            </div>

            {/* Appearance / theme */}
            <div style={{ background: T.bg1, borderRadius: 3, padding: 14, border: "1px solid " + T.brd }}>
              <div style={{ color: T.fg, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Apparence</div>
              <div style={{ color: T.fg4, fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>
                Activez ou désactivez le mode sombre. Le réglage est mémorisé.
              </div>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: T.bg2, border: "1px solid " + T.brd2, borderRadius: 3,
                  padding: "12px 14px", cursor: "pointer", fontFamily: T.body,
                }}
              >
                <span style={{ color: T.fg, fontSize: 13, fontWeight: 700 }}>Mode sombre</span>
                <span style={{
                  position: "relative", width: 44, height: 24, borderRadius: 3, flexShrink: 0,
                  background: theme === "dark" ? T.green : T.bg4,
                  border: "1px solid " + (theme === "dark" ? T.green : T.brd2),
                  transition: "background 0.2s, border-color 0.2s",
                }}>
                  <span style={{
                    position: "absolute", top: 2, left: theme === "dark" ? 22 : 2,
                    width: 18, height: 18, borderRadius: 3,
                    background: "#fff",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                  }} />
                </span>
              </button>
            </div>

            {/* Pages d'aide */}
            <div style={{ background: T.bg1, borderRadius: 3, padding: 14, border: "1px solid " + T.brd }}>
              <div style={{ color: T.fg, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Pages d'aide</div>
              <div style={{ color: T.fg4, fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>
                L'aide de chaque page s'ouvre à votre première visite, puis reste disponible via le bouton « i » en haut à droite. Vous pouvez la faire réapparaître automatiquement sur toutes les pages.
              </div>
              <button
                style={{ ...styles.btnPrimary, width: "100%" }}
                onClick={() => {
                  setPlayer(p => ({ ...p, seenHelp: [] }));
                  setActiveTab("hub");
                  setScreen("hub");
                }}
              >
                Réafficher les pages d'aide
              </button>
            </div>

            {/* Back to game */}
            <button
              style={styles.btnSecondary}
              onClick={() => setScreen("hub")}
            >
              <Icon name="arrowLeft" size={12} /> Retour au jeu
            </button>

            {/* Main menu */}
            <button
              style={{ ...styles.btnSecondary, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              onClick={() => returnToMenu()}
            >
              <Icon name="home" size={14} /> Menu principal
            </button>
            <div style={{ color: T.fg4, fontSize: 11, textAlign: "center", marginTop: -6, lineHeight: 1.5 }}>
              La carrière est sauvegardée et reste disponible depuis le menu.
            </div>

            {/* Danger zone */}
            <div style={{ background: T.bg1, borderRadius: 3, padding: 14, border: "1px solid " + T.brd, marginTop: 8 }}>
              <div style={{ color: T.red, fontWeight: 700, fontSize: 11, letterSpacing: 0.2, textTransform: "none", marginBottom: 8 }}>Zone sensible</div>
              <button
                style={{ ...styles.btnSecondary, width: "100%", borderColor: T.red, color: T.red }}
                onClick={() => deleteSave(slot)}
              >
                <Icon name="trash" size={12} /> Effacer cette carrière
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MATCH SCREEN ──────────────────────────────────────────────────────────
  if (screen === "match" && matchState) {
    const ms = matchState;
    const fmt = ms.format;
    const isQuali = ms.mode === "qualifying";
    const roundName = isQuali
      ? "Qualifs · Tour " + (ms.roundIdx + 1) + "/" + fmt.qualiRounds
      : (fmt.mainRounds[ms.roundIdx] || "Round " + (ms.roundIdx + 1));
    const tourn = ms.tournament;
    const m = ms.matchData;

    if (ms.phase === "intermediate") {
      const fr = ms.finalResult;
      const pnm = ms.pendingNextMatch || {};
      const enteringMain = pnm.nextMode === "main" && ms.mode === "qualifying";
      const nextRoundLabel = pnm.nextMode === "qualifying"
        ? "Qualifs · Tour " + ((pnm.nextRoundIdx ?? 0) + 1) + "/" + fmt.qualiRounds
        : (fmt.mainRounds[pnm.nextRoundIdx] || "Round " + ((pnm.nextRoundIdx ?? 0) + 1));

      const onContinue = () => {
        const nextBo5 = isBestOfFiveMatch(ms.format, ms.tournament, pnm.nextMode, pnm.nextRoundIdx);
        const matchData = createInitialMatchData(nextBo5, pnm.recoveredEnergy, ms.tournament?.surface);
        matchData.tb10Decider = ms.tournament?.tier === "GrandSlam";
        matchData.oppEnergy = pnm.nextOppEnergy;
        setMatchState(prev => ({
          ...prev,
          isGrandSlam: nextBo5,
          phase: "prematch",
          mode: pnm.nextMode,
          roundIdx: pnm.nextRoundIdx,
          opponent: pnm.nextOpp,
          opponentRank: pnm.nextOppRank,
          matchData,
          eventLog: [],
          pendingDilemma: null,
          lastResolveMsg: null,
          playedOpponentIds: pnm.newPlayedIds,
          qualifyingRoundsWon: enteringMain ? (prev.qualifyingRoundsWon || 0) + 1 : (prev.qualifyingRoundsWon || 0),
          ...(pnm.mainDraw ? {
            bracketParticipants: pnm.mainDraw.bracketParticipants,
            bracketOpponents: pnm.mainDraw.bracketOpponents,
            bracketMode: "main",
          } : {}),
          finalResult: null,
          pendingNextMatch: null,
        }));
      };

      return (
        <div style={styles.root}>
          <div style={{ ...styles.screen, alignItems: "center", justifyContent: "flex-start", overflowY: "auto", paddingBottom: 24 }}>
            <div style={{ textAlign: "center", padding: 24, width: "100%", boxSizing: "border-box" }}>
              <div><Icon name={enteringMain ? "party" : fr.won ? "success" : "fail"} size={52} color={fr.won ? T.green : T.red} /></div>
              <h2 style={{ color: fr.won ? T.green : T.red, fontSize: 26, margin: "12px 0 4px" }}>
                {enteringMain ? "Qualifié !" : fr.won ? "Victoire !" : "Défaite"}
              </h2>
              <p style={{ color: T.fg4, fontSize: 14 }}>{tourn.name}</p>
              <p style={{ color: T.fg, fontSize: 22, margin: "16px 0 4px", fontWeight: 800 }}>{fr.finalScore}</p>
              <p style={{ color: T.fg4, fontSize: 13 }}>vs {fr.opponent} (#{fr.opponentRank})</p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", margin: "20px 0", flexWrap: "wrap" }}>
                <div style={styles.resultPill}><Icon name="money" size={11} /> +{fr.prize.toLocaleString()}€</div>
                <div style={styles.resultPill}><Icon name="trending" size={11} /> +{fr.pts} pts</div>
              </div>

              {fr.debrief && (
                <div style={{ background: T.bg1, borderRadius: 3, padding: 14, marginBottom: 16, border: "1px solid var(--tm-brd)", color: T.fg3, fontSize: 13, lineHeight: 1.6, fontStyle: "italic", textAlign: "left" }}>
                  <div style={{ color: T.fg4, fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "none", letterSpacing: 0.5, fontStyle: "normal" }}><Icon name="mic" size={11} /> Débrief des commentateurs</div>
                  "{fr.debrief}"
                </div>
              )}

              {ms.rr && (() => {
                const { g, h } = finalsRanked(ms.rr, player);
                const nameOf = id => id === "__me" ? rankingName(player.name) : ms.rr.players[id].name;
                const table = (label, ids) => (
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <div className="tm-eyebrow" style={{ marginBottom: 6 }}>Poule {label}</div>
                    {ids.map((id, i) => {
                      const r = ms.rr.table[id];
                      return (
                        <div key={id} style={{ display: "flex", justifyContent: "space-between", gap: 6, fontSize: 12, padding: "3px 0", color: id === "__me" ? T.green : T.fg2, fontWeight: id === "__me" ? 700 : 500, borderTop: i === 2 ? "1px dashed " + T.brd2 : "none" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {nameOf(id)}</span>
                          <span className="tm-num">{r.w}-{r.l}</span>
                        </div>
                      );
                    })}
                  </div>
                );
                return (
                  <div style={{ background: T.bg1, borderRadius: 3, padding: 14, marginBottom: 16, border: "1px solid var(--tm-brd)", textAlign: "left", display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {table(ms.rr.gLabel, g)}
                    {table(ms.rr.hLabel, h)}
                  </div>
                );
              })()}

              {pnm.nextOpp && (
                <div style={{ background: T.bg0, borderRadius: 3, padding: 14, marginBottom: 16, border: "1px solid var(--tm-brd)", textAlign: "left" }}>
                  <div style={{ color: T.fg4, fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: "none", letterSpacing: 0.5 }}>Prochain match</div>
                  <div style={{ color: T.fg, fontSize: 14, fontWeight: 700 }}>{nextRoundLabel}</div>
                  <div style={{ color: T.fg3, fontSize: 13, marginTop: 4 }}>
                    vs <FlagFromEmoji emoji={pnm.nextOpp.nat?.flag} size={11} /> {pnm.nextOpp.name} (#{pnm.nextOppRank})
                  </div>
                </div>
              )}

              <button style={styles.btnPrimary} onClick={onContinue}>Continuer →</button>
            </div>
          </div>
        </div>
      );
    }

    if (ms.phase === "press" && ms.pressConference) {
      const { questions, currentQ, answers } = ms.pressConference;
      const q = questions[currentQ];
      const isLast = currentQ === questions.length - 1;
      const tourn = ms.tournament;

      const answerQuestion = (option) => {
        // Une conférence de presse de petit tournoi a peu d'écho médiatique.
        const echo = { GrandSlam: 1, Finals: 1, Masters1000: 1, ATP500: 0.75, ATP250: 0.5, Challenger: 0.3, ITF: 0.2 }[tourn?.tier] ?? 0.5;
        const posScale = (v) => v > 0 ? (random() < v * echo - Math.floor(v * echo) ? Math.ceil(v * echo) : Math.floor(v * echo)) : v;
        setPlayer(p => adjustLife({
          ...p,
          money: p.money + (option.effects?.money || 0),
        }, {
          happiness: option.effects?.happiness || 0,
          popularity: posScale(option.effects?.popularity || 0),
          image: posScale(option.effects?.image || 0),
        }));
        const newAnswers = [...answers, { qId: q.id || ("q" + currentQ), label: option.label }];
        if (isLast) {
          setMatchState(prev => ({
            ...prev, phase: "result",
            pressConference: { ...prev.pressConference, answers: newAnswers },
          }));
        } else {
          setMatchState(prev => ({
            ...prev,
            pressConference: {
              ...prev.pressConference,
              currentQ: currentQ + 1,
              answers: newAnswers,
            },
          }));
        }
      };

      return (
        <div style={styles.root}>
          <div style={{ ...styles.screen, alignItems: "stretch", justifyContent: "flex-start", overflowY: "auto", padding: 0, background: T.bg0 }}>
            {/* Press room banner */}
            <div style={{
              padding: "16px 16px 12px",
              borderBottom: "1px solid " + T.brd,
              background: T.bg1,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 6, height: 22, borderRadius: 3,
                background: "var(--tm-red)",
                
                animation: "pulse 2s infinite",
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="tm-eyebrow" style={{ color: "var(--tm-red)" }}>● EN DIRECT — Conférence de presse</div>
                <div style={{ color: T.fg, fontSize: 12, fontWeight: 700, marginTop: 2 }}>{tourn?.name}</div>
              </div>
              <div style={{ color: T.fg5, fontSize: 11, fontWeight: 700 }}>
                {currentQ + 1} / {questions.length}
              </div>
            </div>

            {/* Microphones / row of journalists at top */}
            <div style={{
              padding: "10px 16px",
              display: "flex", gap: 6, justifyContent: "center",
              fontSize: 18, opacity: 0.4,
            }}>
              {[0, 1, 2, 3, 4].map(k => <Icon key={k} name="mic" size={18} color={T.fg4} />)}
            </div>

            {/* Question bubble from a journalist */}
            <div style={{
              padding: "0 16px 14px",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 3, flexShrink: 0,
                background: T.bg3, border: "1px solid " + T.brd2,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, marginTop: 4,
              }}><Icon name="document" size={22} color={T.fg3} /></div>
              <div style={{
                background: T.bg2, borderRadius: "12px 12px 12px 2px",
                padding: "10px 14px",
                border: "1px solid " + T.brd2,
                color: T.fg, fontSize: 14, lineHeight: 1.5,
                fontStyle: "italic", flex: 1,
                position: "relative",
              }}>
                {q.text}
              </div>
            </div>

            {/* Player avatar + name on the right (the "interviewee") */}
            <div style={{
              padding: "4px 16px 14px",
              display: "flex", flexDirection: "column", alignItems: "flex-end",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: T.fg, fontSize: 13, fontWeight: 800 }}>{player.name}</div>
                  <div style={{ color: T.fg4, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: "none" }}>Votre réponse</div>
                </div>
                {player.avatar ? (
                  <div style={{
                    width: 48, height: 48, borderRadius: 24,
                    overflow: "hidden",
                    border: "2px solid " + T.green,
                    
                    flexShrink: 0,
                  }}>
                    <Avatar config={player.avatar} size={48} />
                  </div>
                ) : (
                  <div style={{
                    width: 48, height: 48, borderRadius: 24,
                    background: T.bg3, border: "2px solid " + T.green,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon name="users" size={20} color={T.green} />
                  </div>
                )}
              </div>
            </div>

            {/* Answer options */}
            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => answerQuestion(opt)}
                  style={{
                    background: T.bg2,
                    border: "1px solid " + T.brd2,
                    borderRadius: "12px 12px 2px 12px",
                    padding: "12px 14px",
                    textAlign: "right", cursor: "pointer",
                    color: T.fg, fontFamily: T.body, fontSize: 14,
                    lineHeight: 1.45, fontWeight: 500,
                  }}
                >
                  « {opt.label} »
                </button>
              ))}
            </div>

            {/* Progress dots */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "20px 0 10px" }}>
              {questions.map((_, i) => (
                <div key={i} style={{
                  width: i === currentQ ? 20 : 6, height: 6, borderRadius: 3,
                  background: i < currentQ ? T.green : i === currentQ ? T.green : T.bg4,
                  transition: "all 0.3s",
                }} />
              ))}
            </div>

            <div style={{ padding: "0 16px 20px" }}>
              <button
                style={{ ...styles.btnSecondary, width: "100%", fontSize: 11, opacity: 0.6 }}
                onClick={() => setMatchState(prev => ({ ...prev, phase: "result" }))}
              >Passer la conférence</button>
            </div>
          </div>
        </div>
      );
    }

    if (ms.phase === "result") {
      const fr = ms.finalResult;
      const prog = ms.progression || {};
      const statLabels = { serve: "Service", forehand: "Coup droit", backhand: "Revers", stamina: "Endurance", mental: "Mental", net: "Filet" };
      const hasProg = Object.keys(prog).length > 0;
      const lore = fr.isTitleWin ? getTournamentLore(tourn.id) : null;
      return (
        <div style={styles.root}>
          <div style={{ ...styles.screen, alignItems: "center", justifyContent: "flex-start", overflowY: "auto", paddingBottom: 24 }}>
            <div style={{ textAlign: "center", padding: 24, width: "100%", boxSizing: "border-box" }}>
              {fr.isTitleWin ? (
                <div style={{
                  background: "linear-gradient(180deg, var(--tm-amberSub) 0%, rgba(15,23,42,0) 60%)",
                  borderRadius: 3, padding: "24px 8px 8px", marginBottom: 8,
                }}>
                  <div style={{ animation: "pulse 2s infinite", filter: "none" }}><Icon name="trophy" size={72} color={T.amber} /></div>
                  <div style={{ color: T.amber, fontSize: 11, fontWeight: 900, letterSpacing: 0.2, marginTop: 4 }}>Champion</div>
                  <h2 style={{ color: T.amber, fontSize: 28, margin: "8px 0 4px", fontWeight: 900, lineHeight: 1.1, textShadow: "none" }}>
                    {tourn.name}
                  </h2>
                  <p style={{ color: "var(--tm-amber)", fontSize: 13, fontStyle: "italic", margin: "4px 0 12px" }}>
                    <FlagFromEmoji emoji={CITIES[tourn.city]?.flag} size={11} /> {tourn.city} · {player.year}
                  </p>
                </div>
              ) : (
                <>
                  <h2 style={{ color: fr.won ? T.green : T.red, fontSize: 26, margin: "12px 0 4px" }}>
                    {fr.won ? "Victoire !" : (fr.eliminatedInQuali ? "Éliminé en qualifs" : "Élimination")}
                  </h2>
                  <p style={{ color: T.fg4, fontSize: 14 }}>{tourn.name} — {fr.round}</p>
                </>
              )}
              <p style={{ color: T.fg, fontSize: 22, margin: "16px 0 4px", fontWeight: 800 }}>{fr.finalScore}</p>
              <p style={{ color: T.fg4, fontSize: 13 }}>vs {fr.opponent} (#{fr.opponentRank})</p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", margin: "24px 0", flexWrap: "wrap" }}>
                <div style={styles.resultPill}><Icon name="money" size={11} /> +{fr.prize.toLocaleString()}€</div>
                <div style={styles.resultPill}><Icon name="trending" size={11} /> +{fr.pts} pts</div>
              </div>

              {/* Tournament history (only for big titles with lore) */}
              {fr.isTitleWin && lore && (
                <div style={{ background: T.bg1, borderRadius: 3, padding: 16, marginBottom: 16, border: "1px solid var(--tm-amber)", textAlign: "left" }}>
                  <div style={{ color: T.amber, fontSize: 12, fontWeight: 900, letterSpacing: 0.2, marginBottom: 8, textTransform: "none" }}>Histoire du tournoi</div>
                  <div style={{ color: T.fg3, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>{lore.history}</div>
                  <div style={{ color: T.amber, fontSize: 11, fontWeight: 700, marginBottom: 6 }}><Icon name="trophy" size={11} /> Légendes du tournoi</div>
                  {lore.legends.map((legend, i) => (
                    <div key={i} style={{ color: T.fg, fontSize: 12, padding: "3px 0", borderBottom: i < lore.legends.length - 1 ? "1px solid var(--tm-bg1)" : "none" }}>
                      • {legend}
                    </div>
                  ))}
                  <div style={{ marginTop: 12, padding: 10, background: T.bg0, borderRadius: 3, border: "1px solid var(--tm-amber)" }}>
                    <div style={{ color: T.amber, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>Vainqueur {player.year}</div>
                    <div style={{ color: T.fg, fontSize: 14, fontWeight: 800 }}><FlagFromEmoji emoji={player.nationalityFlag} size={12} /> {player.name}</div>
                    <div style={{ color: T.fg4, fontSize: 11, marginTop: 2 }}>Score final : {fr.finalScore}</div>
                  </div>
                </div>
              )}

              {/* Generic title celebration if no lore */}
              {fr.isTitleWin && !lore && (
                <div style={{ background: T.bg1, borderRadius: 3, padding: 16, marginBottom: 16, border: "1px solid var(--tm-amber)", textAlign: "left" }}>
                  <div style={{ color: T.amber, fontSize: 12, fontWeight: 900, letterSpacing: 0.2, marginBottom: 8 }}>Palmarès</div>
                  <div style={{ color: T.fg3, fontSize: 12, lineHeight: 1.6 }}>
                    Votre nom rejoint désormais la liste des vainqueurs de {tourn.name}. Une belle ligne ajoutée à votre carrière.
                  </div>
                </div>
              )}

              {fr.debrief && (
                <div style={{ background: T.bg1, borderRadius: 3, padding: 14, marginBottom: 16, border: "1px solid var(--tm-brd)", color: T.fg3, fontSize: 13, lineHeight: 1.6, fontStyle: "italic", textAlign: "left" }}>
                  <div style={{ color: T.fg4, fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "none", letterSpacing: 0.5, fontStyle: "normal" }}><Icon name="mic" size={11} /> Débrief des commentateurs</div>
                  "{fr.debrief}"
                </div>
              )}

              {hasProg && (
                <div style={{ background: T.bg1, borderRadius: 3, padding: 16, marginBottom: 16, border: "1px solid " + (Object.values(prog).some(v => v < 0) ? T.amber : T.green) }}>
                  <div style={{ color: Object.values(prog).some(v => v < 0) ? T.amber : T.green, fontSize: 14, fontWeight: 800, marginBottom: 12 }}>
                    <Icon name="trending" size={11} /> Bilan du tournoi
                  </div>
                  <div style={{ color: T.fg4, fontSize: 11, marginBottom: 10 }}>
                    {ms.totalMatchesInTournament} match{ms.totalMatchesInTournament > 1 ? "s" : ""} · {fr.isTitleWin ? "Titre +bonus" : (Object.values(prog).some(v => v < 0) ? "Performance décevante" : "Progrès pendant le tournoi")}
                  </div>
                  {Object.entries(prog).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: T.fg, fontSize: 13 }}>
                      <span>{statLabels[k] || k}</span>
                      <span style={{ color: v >= 0 ? T.green : T.red, fontWeight: 700 }}>{v >= 0 ? "+" : ""}{v}</span>
                    </div>
                  ))}
                </div>
              )}

              <button style={styles.btnPrimary} onClick={() => {
                setScreen("hub");
                setActiveTab("hub");
                setMatchState(null);
                // Medical diagnosis for an injury picked up during the tournament
                if (player.injuryNoticePending) {
                  const inj = player.injury;
                  if (inj && inj.weeksRemaining > 0) {
                    const wk = inj.weeksRemaining + " semaine" + (inj.weeksRemaining > 1 ? "s" : "");
                    notify(inj.canPlay
                      ? "Diagnostic médical : " + inj.label + ". Gêné pendant " + wk + " (−" + Math.round((inj.statPenalty || 0) * 100) + " % sur vos stats)."
                      : "Diagnostic médical : " + inj.label + ". Indisponible " + wk + ".", "warn");
                  }
                  setPlayer(p => ({ ...p, injuryNoticePending: false }));
                }
                // Sponsor phase that fell on the tournament week: open it now.
                if (player._pendingNegotiation) {
                  const neg = player._pendingNegotiation;
                  setPlayer(p => {
                    const np = { ...p };
                    delete np._pendingNegotiation;
                    return np;
                  });
                  setSponsorNegotiation(neg);
                }
              }}>Continuer →</button>
            </div>
          </div>
        </div>
      );
    }

    if (ms.phase === "prematch") {
      const oppProfile = getPlayerProfile(ms.opponent.stats);
      return (
        <div style={styles.root}>
          <div style={styles.screen}>
            <div style={{
              background: T.bg1, padding: "16px 18px",
              borderBottom: "1px solid " + T.brd,
              textAlign: "center",
            }}>
              <div className="tm-eyebrow" style={{ color: tierColor(tourn.tier), marginBottom: 4 }}>{tierLabel(tourn.tier)} · {tourn.surface}</div>
              <div className="tm-display" style={{ color: T.fg, fontSize: 24, lineHeight: 1.1, letterSpacing: 0.5 }}>{tourn.name}</div>
              <div style={{ color: T.fg3, fontSize: 12, marginTop: 4, fontWeight: 600 }}>{roundName}</div>
            </div>
            <div style={{
              ...styles.vsCard,
              background: T.bg0,
              border: "1px solid " + T.brd,
            }} className="tm-court">
              <div style={styles.vsPlayer}>
                <div style={{
                  width: 52, height: 52, borderRadius: 3,
                  background: T.greenSub, border: "1px solid " + T.greenBrd,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, marginBottom: 6,
                }}>{flagEmojiToCode(player.nationalityFlag)
                  ? <FlagFromEmoji emoji={player.nationalityFlag} size={24} />
                  : <Icon name="user" size={22} />}</div>
                <div style={styles.vsName}>{player.name}</div>
                <div style={styles.vsRating}>#{ranking}</div>
              </div>
              <div style={styles.vsVs}>vs</div>
              <div style={styles.vsPlayer}>
                <div style={{
                  width: 52, height: 52, borderRadius: 3,
                  background: T.bg3, border: "1px solid " + T.brd2,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, marginBottom: 6,
                }}>{flagEmojiToCode(ms.opponent.nat?.flag)
                  ? <FlagFromEmoji emoji={ms.opponent.nat?.flag} size={24} />
                  : <Icon name="user" size={22} />}</div>
                <div style={styles.vsName}>{ms.opponent.name}</div>
                <div style={{ ...styles.vsRating, color: T.fg3 }}>#{ms.opponentRank}</div>
              </div>
            </div>

            {/* Opponent scouting card */}
            <div style={{ ...styles.section, paddingBottom: 8 }}>
              <div style={styles.sectionTitle}><Icon name="search" size={11} /> Scouting adverse</div>
              <div style={{ background: T.bg1, borderRadius: 3, padding: 14, border: "1px solid var(--tm-brd)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
                  <span style={{ color: T.fg4, fontSize: 12 }}>Style de jeu</span>
                  <span style={{ color: T.fg, fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Icon name={PLAYER_STYLES[ms.opponent.style]?.iconName} size={14} color={T.green} />
                    {PLAYER_STYLES[ms.opponent.style]?.name}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ color: T.fg4, fontSize: 12 }}>Point fort</span>
                  <span style={{ color: T.green, fontWeight: 700, fontSize: 13 }}>{oppProfile.strength.label} ({Math.round(oppProfile.strength.value)})</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ color: T.fg4, fontSize: 12 }}><Icon name="target" size={11} /> Point faible</span>
                  <span style={{ color: T.red, fontWeight: 700, fontSize: 13 }}>{oppProfile.weakness.label} ({Math.round(oppProfile.weakness.value)})</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: T.fg4, fontSize: 12 }}>Côte globale</span>
                  <span style={{ color: T.amber, fontWeight: 700, fontSize: 13 }}>{getRating(ms.opponent.stats)}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: "0 16px 12px" }}>
              <div style={{ ...styles.energyBar, marginBottom: 8 }}>
                <div style={styles.energyLabel}><Icon name="energy" size={11} /> Vous</div>
                <div style={styles.energyTrack}>
                  <div style={{ ...styles.energyFill, width: player.energy + "%", background: player.energy > 60 ? T.green : player.energy > 30 ? T.amber : T.red }} />
                </div>
                <div style={styles.energyVal}>{player.energy}%</div>
              </div>
              <div style={{ ...styles.energyBar, marginBottom: 4 }}>
                <div style={styles.energyLabel}><Icon name="energy" size={11} /> Adv.</div>
                <div style={styles.energyTrack}>
                  <div style={{ ...styles.energyFill, width: Math.round(m.oppEnergy) + "%", background: m.oppEnergy > 60 ? T.green : m.oppEnergy > 30 ? T.amber : T.red }} />
                </div>
                <div style={styles.energyVal}>{Math.round(m.oppEnergy)}%</div>
              </div>
              {player.energy < 40 && <div style={{ color: T.red, fontSize: 11, textAlign: "center", marginTop: 6 }}><Icon name="warning" size={11} /> Énergie faible — performance réduite</div>}
              {m.oppEnergy < 50 && <div style={{ color: T.green, fontSize: 11, textAlign: "center", marginTop: 4 }}><Icon name="lightbulb" size={11} /> Adversaire fatigué par ses précédents matchs</div>}
            </div>

            <div style={{ ...styles.section, paddingTop: 0 }}>
              <div style={styles.sectionTitle}>Format</div>
              <div style={{ color: T.fg, fontSize: 13 }}>
                {ms.isGrandSlam ? "3 sets gagnants · Tie-break à 10pts (5e set)"
                  : ms.tournament?.tier === "GrandSlam" ? "2 sets gagnants · Tie-break à 10pts (3e set)"
                  : "2 sets gagnants · Tie-break à 7pts à 6-6"}
              </div>
            </div>
            <button style={{ ...styles.btnPrimary, margin: "auto 16px 24px" }} onClick={() => {
              setPausedBoth(false);
              pausedResumeRef.current = null;
              setMatchState(prev => ({ ...prev, phase: "live" }));
            }}>Lancer le match</button>
          </div>
        </div>
      );
    }

    if (ms.phase === "live") {
      // When a set has just ended (match not over), show the next set at 0-0
      // right away instead of waiting for its first game.
      const lastSetDone = m.sets.length > 0 && m.sets[m.sets.length - 1].completed;
      const setsPlayed = (lastSetDone && !m.matchComplete)
        ? [...m.sets, { pGames: 0, oGames: 0, completed: false, winner: null, tiebreak: null, gameLog: [] }]
        : m.sets;
      // Display setup: 2 or 3 sets are completed/in progress
      const completedSets = setsPlayed.filter(s => s.completed);
      const currentSet = setsPlayed[setsPlayed.length - 1];
      const showCurrent = currentSet && !currentSet.completed;
      const totalSlots = ms.isGrandSlam ? Math.max(setsPlayed.length, 1) : Math.max(setsPlayed.length, 1);

      return (
        <div style={styles.root}>
          {rallyAnim && (
            <RallyOverlay
              points={rallyAnim.points}
              playerName={rallyAnim.playerName}
              oppName={rallyAnim.oppName}
              playerFlag={rallyAnim.playerFlag}
              oppFlag={rallyAnim.oppFlag}
              isTiebreak={rallyAnim.isTiebreak}
              contextLabel={rallyAnim.contextLabel}
              finalGameWinner={rallyAnim.finalGameWinner}
              onPointAdvance={rallyAnim.onPointAdvance}
              onDone={rallyAnim.commit}
              onSkip={rallyAnim.commit}
            />
          )}
          {notification && <div style={{ ...styles.notif, background: notification.type === "success" ? T.bg2 : notification.type === "warn" ? T.bg2 : T.bg2, borderColor: notification.type === "success" ? T.green : notification.type === "warn" ? T.amber : T.brd2 }}>{withFlags(notification.msg)}</div>}
          <div style={{ ...styles.screen, height: "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))", minHeight: 0, overflowY: "auto" }}>
            <div style={{
              ...styles.header,
              background: T.bg1,
              alignItems: "stretch",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="tm-eyebrow" style={{ color: tierColor(tourn.tier), marginBottom: 2 }}>LIVE · {tierLabel(tourn.tier)}</div>
                <div style={{ color: T.fg, fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tourn.name}</div>
                <div style={{ color: T.fg3, fontSize: 11, marginTop: 2 }}>{roundName}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <div style={{ ...styles.momentumChip, color: m.playerMomentum > 0 ? T.green : m.playerMomentum < 0 ? T.red : T.fg3 }} title="Momentum : élan psychologique.">
                  <span style={{ fontFamily: T.mono }}>{m.playerMomentum > 0 ? "+" : ""}{m.playerMomentum}</span>
                </div>
                <div style={{ ...styles.momentumChip, color: Math.round(m.playerEnergy) > 50 ? T.green : T.red }}>
                  <Icon name="energy" size={11} /> <span style={{ fontFamily: T.mono }}>{Math.round(m.playerEnergy)}</span>
                </div>
              </div>
            </div>

            {/* Stadium scoreboard */}
            <div style={{
              margin: "16px 16px 14px",
              background: T.bg1,
              borderRadius: 3,
              border: "1px solid " + T.brd,
              overflow: "hidden",
              boxShadow: "0 10px 30px var(--tm-shadow)",
            }}>
              <div style={{
                background: T.bg2,
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid " + T.brd,
              }}>
                <span style={{ flex: 1, color: T.fg5, fontSize: 9, fontWeight: 700, letterSpacing: 0.2, textTransform: "none" }}>Joueur</span>
                {setsPlayed.map((_, i) => (
                  <span key={i} style={{
                    width: 42, textAlign: "center",
                    color: T.fg5, fontSize: 9, fontWeight: 700,
                    fontFamily: T.mono, letterSpacing: 0.2,
                  }}>SET {i + 1}</span>
                ))}
                <span style={{
                  width: 48, textAlign: "center",
                  color: livePoint ? T.amber : T.fg5,
                  fontSize: 9, fontWeight: 700,
                  fontFamily: T.mono, letterSpacing: 0.2,
                  borderLeft: "1px solid " + T.brd, marginLeft: 4, paddingLeft: 4,
                  transition: "color 0.2s",
                }}>PT</span>
              </div>
              {/* Server for the next game = the same rotation the engine
                  uses to advance (m.nextServerIsPlayer). */}
              {(() => null)()}
              {[
                { name: player.name, flag: player.nationalityFlag || "🎾", isP: true },
                { name: ms.opponent.name, flag: ms.opponent.nat?.flag || "🎾", isP: false },
              ].map((row, ri) => {
                const lastS = setsPlayed[setsPlayed.length - 1];
                // When the last set is finished, the next game opens a new set.
                const betweenSets = !!(lastS && lastS.completed);
                const setNum = setsPlayed.length + (betweenSets ? 1 : 0);
                const firstServerThisSet = setNum % 2 === 1 ? m.firstServerIsPlayer : !m.firstServerIsPlayer;
                const gamesInSet = (lastS && !betweenSets) ? (lastS.pGames + lastS.oGames) : 0;
                const nextIsPlayerServing = (livePoint && typeof livePoint.server === "boolean")
                  ? livePoint.server
                  : typeof m.nextServerIsPlayer === "boolean"
                    ? m.nextServerIsPlayer
                    : ((gamesInSet % 2 === 0) ? firstServerThisSet : !firstServerThisSet);
                const isServing = !m.matchComplete && (row.isP ? nextIsPlayerServing : !nextIsPlayerServing);
                return (
                <div key={ri} style={{
                  display: "flex", alignItems: "center", padding: "14px 16px",
                  borderTop: ri === 1 ? "1px solid " + T.brd : "none",
                  background: row.isP ? T.greenSub : "transparent",
                }}>
                  <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    {/* Tennis-ball glyph in front of the current server */}
                    <span style={{
                      width: 14, height: 14, borderRadius: 7, flexShrink: 0,
                      background: isServing ? T.ball : "transparent",
                      border: isServing ? "1px solid " + T.ball : "1px dashed " + T.brd2,
                      boxShadow: "none",
                      position: "relative",
                      transition: "all 0.25s",
                    }}>
                      {isServing && (
                        <svg viewBox="0 0 14 14" style={{ position: "absolute", inset: 0 }}>
                          <path d="M 1 5 Q 7 7 13 5" fill="none" stroke="#000" strokeWidth="0.6" opacity="0.6" />
                          <path d="M 1 9 Q 7 11 13 9" fill="none" stroke="#000" strokeWidth="0.6" opacity="0.6" />
                        </svg>
                      )}
                    </span>
                    <FlagFromEmoji emoji={row.flag} size={13} />
                    <span style={{ color: T.fg, fontWeight: 700, fontSize: 13, letterSpacing: 0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.name}</span>
                  </span>
                  {setsPlayed.map((s, i) => {
                    const display = row.isP ? s.pGames : s.oGames;
                    const won = row.isP ? s.winner === "p" : s.winner === "o";
                    const lost = s.completed && !won;
                    const tbSup = s.tiebreak && (
                      row.isP ? (s.winner === "o" && s.pGames === 6 ? <sup style={{ ...styles.tbSup, fontFamily: T.mono }}>{s.tiebreak.pPts}</sup> : null)
                              : (s.winner === "p" && s.oGames === 6 ? <sup style={{ ...styles.tbSup, fontFamily: T.mono }}>{s.tiebreak.oPts}</sup> : null)
                    );
                    return (
                      <span key={i} style={{
                        width: 42, textAlign: "center",
                        fontSize: 26, fontWeight: 800,
                        fontFamily: T.mono, fontVariantNumeric: "tabular-nums",
                        letterSpacing: -1, lineHeight: 1,
                        color: !s.completed ? T.amber : (won ? T.fg : T.fg4),
                      }}>{display}{tbSup}</span>
                    );
                  })}
                  {/* PT cell — running point score for the current game (0/15/30/40/AV/JEU) */}
                  <span style={{
                    width: 48, textAlign: "center",
                    fontSize: livePoint ? (((row.isP ? livePoint.p : livePoint.o) || "").length > 2 ? 16 : 22) : 18,
                    fontWeight: 800, fontFamily: T.mono, fontVariantNumeric: "tabular-nums",
                    letterSpacing: -0.5, lineHeight: 1,
                    color: livePoint ? T.ball : T.fg5,
                    borderLeft: "1px solid " + T.brd, marginLeft: 4, paddingLeft: 4,
                    textShadow: "none",
                    transition: "color 0.2s, font-size 0.15s",
                  }}>{livePoint ? (row.isP ? livePoint.p : livePoint.o) : "—"}</span>
                </div>
                );
              })}
            </div>

            {/* Le résultat des décisions apparaît désormais dans le fil des commentaires. */}

            {/* Event feed */}
            <div style={{ ...styles.eventFeed, flex: "1 1 0", minHeight: 160, maxHeight: "none", paddingBottom: 18 }}>
              {ms.eventLog.length === 0 && (
                <div style={{ color: T.fg4, fontSize: 13, textAlign: "center", padding: 16 }}>
                  {matchPaused ? "Match en pause · appuyez sur Reprendre pour commencer."
                    : startCountdown > 0 ? <>Préparez-vous… début du match dans <strong className="tm-num" style={{ color: T.ball }}>{startCountdown}</strong></>
                    : "Premier jeu…"}
                </div>
              )}
              {ms.eventLog.map((b, i) => {
                if (b.type === "dilemma") {
                  return (
                    <div key={b.id} style={{ ...styles.eventItem, opacity: Math.max(0.55, 1 - i * 0.05), borderLeft: "3px solid " + T.ball, background: T.bg2 }}>
                      <div className="tm-eyebrow" style={{ color: T.ball, marginBottom: 4 }}>Décision{b.title ? " · " + b.title : ""}</div>
                      {b.choice && <div style={{ fontSize: 12, color: T.fg3, marginBottom: 4 }}>Choix : <strong style={{ color: T.fg }}>{b.choice}</strong></div>}
                      <span style={{ fontSize: 13, color: T.fg }}>{withFlags(b.text || "")}</span>
                    </div>
                  );
                }
                const color = b.type === "lose_serve" || b.type === "tb_lost" || b.type === "set_lost" ? T.red
                  : b.type === "break_clean" || b.type === "break_grind" || b.type === "tb_won" || b.type === "set_won" || b.type === "hold_easy" || b.type === "hold_tough" ? T.green
                  : T.fg4;
                return <div key={b.id} style={{ ...styles.eventItem, opacity: Math.max(0.55, 1 - i * 0.05), borderLeft: "3px solid " + color }}><span style={{ fontSize: 13, color: T.fg }}>{withFlags(b.text)}</span></div>;
              })}
            </div>

            {/* Dilemma overlay */}
            {ms.pendingDilemma && (
              <div style={styles.dilemmaOverlay}>
                <div style={styles.dilemmaCard}>
                  <div className="tm-eyebrow" style={{ color: ms.pendingDilemma.isMatchFix ? T.red : T.ball, marginBottom: 6 }}>{ms.pendingDilemma.isMatchFix ? "Proposition illégale" : "Décision · Choix tactique"}</div>
                  <div style={{ color: T.fg, fontWeight: 700, fontSize: 17, letterSpacing: 0.2 }}>{ms.pendingDilemma.title}</div>
                  <div style={{ color: T.fg3, fontSize: 13, margin: "8px 0 18px", lineHeight: 1.5 }}>{ms.pendingDilemma.desc.replace("{o}", ms.opponent.name)}</div>
                  {ms.pendingDilemma.isMatchFix && (
                    <div style={{ margin: "-8px 0 16px", padding: "8px 10px", borderRadius: 3, background: "var(--tm-redSub)", border: "1px solid var(--tm-redBrd)", color: T.red, fontSize: 11.5, lineHeight: 1.4 }}>
                      Truquer un match est passible d'une suspension de 10 à 12 semaines et ruine votre réputation si vous êtes démasqué.
                    </div>
                  )}
                  {ms.pendingDilemma.id === "exploit_weakness" && (() => {
                    const hasCoach = (player.staff || []).some(s => s.role === "Coach");
                    const prof = getPlayerProfile(ms.opponent.stats);
                    return (
                      <div style={{ margin: "-8px 0 16px", padding: "8px 10px", borderRadius: 3, background: (hasCoach && ms.pendingDilemma.coachHint) ? T.greenSub : T.bg2, border: "1px solid " + ((hasCoach && ms.pendingDilemma.coachHint) ? T.greenBrd : T.brd), color: (hasCoach && ms.pendingDilemma.coachHint) ? T.green : T.fg4, fontSize: 11.5, lineHeight: 1.4 }}>
                        {hasCoach && ms.pendingDilemma.coachHint
                          ? "Rapport du coach : point faible de " + ms.opponent.name + " → " + prof.weakness.label.toLowerCase() + " (" + Math.round(prof.weakness.value) + ")."
                          : hasCoach
                            ? "Votre coach n'a rien repéré de décisif chez " + ms.opponent.name + " : à vous de trouver sa faille."
                            : "Sans coach pour le scouting, à vous d'identifier sa faille."}
                      </div>
                    );
                  })()}
                  {ms.pendingDilemma.options.filter(opt => !opt.requiresCoach || player.staff.some(s => s.role === "Coach")).map((opt, i) => (
                    <button
                      key={i}
                      style={{ ...styles.dilemmaBtn, display: "flex", alignItems: "center", gap: 12 }}
                      onClick={() => resolveDilemma(opt, ms.pendingDilemma)}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 3,
                        background: T.bg3, border: "1px solid " + T.brd2,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <Icon name={opt.iconName || "target"} size={18} color={T.green} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{opt.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Barre de contrôle du match : pause / reprise + vitesse */}
            {!ms.pendingDilemma && !m.matchComplete && (() => {
              const running = !matchPaused;
              const togglePause = () => {
                if (running) {
                  setPausedBoth(true);
                  if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
                } else {
                  setPausedBoth(false);
                  if (pausedResumeRef.current) {
                    // Reprend le jeu gelé exactement où il s'était arrêté.
                    const resume = pausedResumeRef.current;
                    pausedResumeRef.current = null;
                    resume();
                  } else if (!pendingCommitRef.current && playGameRef.current) {
                    playGameRef.current();
                  }
                }
              };
              return (
                <div style={{
                  position: "sticky", bottom: 0, marginTop: "auto", zIndex: 5, flexShrink: 0,
                  padding: "12px 16px calc(14px + env(safe-area-inset-bottom, 0px))",
                  background: T.bg1,
                  // Bande noire de séparation entre les commentaires et les boutons.
                  borderTop: "10px solid " + T.bg0,
                  boxShadow: "0 -1px 0 " + T.brd + ", 0 -10px 24px var(--tm-shadow)",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <button
                    onClick={togglePause}
                    aria-label={running ? "Mettre en pause" : "Reprendre le match"}
                    style={{
                      width: 58, height: 58, borderRadius: 29, flexShrink: 0,
                      border: "none", cursor: "pointer",
                      background: running ? T.bg3 : T.green,
                      color: running ? T.fg : T.bg0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: running ? "inset 0 0 0 1px " + T.brd2 : "0 0 0 4px " + T.greenSub + ", 0 6px 18px var(--tm-shadow)",
                      transition: "background 0.15s, box-shadow 0.15s",
                    }}
                  >
                    {running ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" /></svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" /></svg>
                    )}
                  </button>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: running ? T.green : T.amber, letterSpacing: 0.3 }}>
                        {running ? (startCountdown > 0 && ms.eventLog.length === 0 ? "Début dans " + startCountdown + " s" : "Match en cours") : "En pause"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
            {m.matchComplete && (
              <div style={{
                position: "sticky", bottom: 0, marginTop: "auto", zIndex: 5, flexShrink: 0,
                padding: "14px 16px calc(16px + env(safe-area-inset-bottom, 0px))",
                background: T.bg1,
                // Même bande de séparation que la barre de contrôle du match.
                borderTop: "10px solid " + T.bg0,
                boxShadow: "0 -1px 0 " + T.brd + ", 0 -10px 24px var(--tm-shadow)",
              }}>
                <button style={{ ...styles.btnPrimary, margin: 0, width: "100%" }} onClick={finishMatch}><Icon name="flag" size={11} /> Voir le résultat</button>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  // ─── HUB / TABS ────────────────────────────────────────────────────────────
  const activeGroup = navGroupOf(activeTab);
  lastScreenByGroup.current[activeGroup.id] = activeTab;

  return (
    <div style={styles.root}>
      {notification && <div style={{ ...styles.notif, background: notification.type === "success" ? T.bg2 : notification.type === "warn" ? T.bg2 : T.bg2, borderColor: notification.type === "success" ? T.green : notification.type === "warn" ? T.amber : T.brd2 }}>{withFlags(notification.msg)}</div>}
      {isAdvancingWeek && (
        <div style={styles.notif}><Icon name="loader" size={11} /> Simulation en cours...</div>
      )}
      {flightAnim && (
        <FlightOverlay
          from={flightAnim.from}
          to={flightAnim.to}
          onDone={() => setFlightAnim(null)}
        />
      )}
      {trainAnim && (
        <TrainingOverlay
          mod={trainAnim.mod}
          gain={trainAnim.gain}
          onDone={() => setTrainAnim(null)}
        />
      )}
      {sponsorNegotiation && (
        <SponsorNegotiationOverlay
          data={{ ...sponsorNegotiation, onWalkAway: (offerId) => {
            setPlayer(p => ({ ...p, sponsorOffers: (p.sponsorOffers || []).filter(o => o.id !== offerId) }));
            notify("Le sponsor a mis fin à la négociation", "warn");
          } }}
          player={player}
          ranking={ranking}
          onSign={acceptSponsorOffer}
          onClose={() => {
            setPlayer(p => ({ ...p, sponsorOffers: [] }));
            setSponsorNegotiation(null);
          }}
        />
      )}
      <div style={styles.screen}>
        <div style={styles.topBar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 3, overflow: "hidden",
              background: player.avatar ? "transparent" : T.bg2, border: player.avatar ? "none" : "1px solid " + T.brd2, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {player.avatar
                ? <Avatar config={player.avatar} size={40} />
                : <Icon name="racquet" size={20} color={T.green} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: T.fg, fontWeight: 600, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{player.name}</div>
              <div style={{ color: T.fg4, fontSize: 12, marginTop: 1, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", minWidth: 0 }}>
                <span className="tm-num" style={{ color: T.green, fontWeight: 600 }}>#{ranking}</span>
                <span>·</span>
                <span>Sem. {player.week}</span>
                <span>·</span>
                <FlagFromEmoji emoji={CITIES[player.location]?.flag} size={9} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{player.location}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => setHelpTab(activeTab)} style={{
              background: T.bg1, border: "1px solid " + T.brd2,
              borderRadius: 3, width: 38, height: 38,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, position: "relative", color: T.fg3,
            }} title="Aide de cette page">
              <Icon name="info" size={18} />
            </button>
            <button
              onClick={() => {
                setShowHallOfFame(true);
                if ((player.unseenTrophies || 0) > 0) setPlayer(p => ({ ...p, unseenTrophies: 0 }));
              }}
              style={{
              background: T.bg1, border: "1px solid " + T.brd2,
              borderRadius: 3, width: 38, height: 38,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, position: "relative", color: T.fg3,
            }}
              title="Trophées"
            >
              <Icon name="trophy" size={18} color={T.ball} />
              {(player.unseenTrophies || 0) > 0 && (
                <span style={{
                  position: "absolute", top: -5, right: -5,
                  background: T.clay, color: T.onAccent,
                  fontSize: 10, fontWeight: 700, borderRadius: 3, padding: "1px 5px",
                  fontFamily: T.mono, minWidth: 16, textAlign: "center",
                }}>{player.unseenTrophies}</span>
              )}
            </button>
            <button onClick={() => setScreen("settings")} style={{
              background: T.bg1, border: "1px solid " + T.brd2,
              borderRadius: 3, width: 38, height: 38,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, position: "relative", color: T.fg3,
            }} title="Réglages">
              <Icon name="cog" size={18} />
            </button>
          </div>
        </div>
        {/* Bandeau ressources : argent + énergie, lisible d'un coup d'œil
            (l'accueil les affiche déjà dans sa manchette). */}
        {activeTab !== "hub" && <div style={{ display: "flex", gap: 8, padding: "10px 16px 0" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: T.bg1, border: "1px solid " + T.brd, borderRadius: 3, padding: "8px 12px" }}>
            <Icon name="money" size={16} color={player.money >= 0 ? T.green : T.red} />
            <span className="tm-num" style={{ color: T.fg, fontWeight: 600, fontSize: 14 }}>{player.money.toLocaleString()} €</span>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: T.bg1, border: "1px solid " + T.brd, borderRadius: 3, padding: "8px 12px" }}>
            <Icon name="energy" size={16} color={player.energy > 60 ? T.green : player.energy > 30 ? T.amber : T.red} />
            <div style={{ flex: 1, height: 6, background: T.bg3, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: player.energy + "%", height: "100%", borderRadius: 3, background: player.energy > 60 ? T.green : player.energy > 30 ? T.amber : T.red }} />
            </div>
            <span className="tm-num" style={{ color: T.fg2, fontSize: 12, fontWeight: 600 }}>{player.energy}</span>
          </div>
        </div>}
        {activeGroup.screens.length > 1 && (
          <div style={styles.subTabs}>
            {activeGroup.screens.map(sc => {
              const on = activeTab === sc.id;
              return (
                <button key={sc.id} onClick={() => setActiveTab(sc.id)} style={{ ...styles.subTab, ...(on ? styles.subTabActive : {}) }}>
                  <Icon name={sc.icon} size={15} color={on ? T.green : T.fg4} />
                  {sc.label}
                </button>
              );
            })}
          </div>
        )}
        <div style={{ ...styles.content, paddingBottom: 110 }}>
          {helpTab && PAGE_HELP[helpTab] && (
            <div onClick={() => setHelpTab(null)} style={{
              position: "fixed", inset: 0, background: "var(--tm-overlay)", zIndex: 400,
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            }}>
              <div onClick={e => e.stopPropagation()} style={{
                background: T.bg1, border: "1px solid " + T.greenBrd, borderRadius: 3,
                padding: 20, maxWidth: 440, width: "100%", maxHeight: "80vh", overflowY: "auto",
              }}>
                <div className="tm-eyebrow" style={{ color: T.green, marginBottom: 6 }}>Aide</div>
                <div style={{ color: T.fg, fontSize: 18, fontWeight: 800, marginBottom: 12 }}>{PAGE_HELP[helpTab].title}</div>
                {PAGE_HELP[helpTab].items.map((it, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ color: T.fg, fontSize: 13, fontWeight: 700 }}>{it[0]}</div>
                    <div style={{ color: T.fg3, fontSize: 12.5, lineHeight: 1.5, marginTop: 2 }}>{it[1]}</div>
                  </div>
                ))}
                <button style={{ ...styles.btnPrimary, marginTop: 8 }} onClick={() => setHelpTab(null)}>Compris</button>
              </div>
            </div>
          )}
          {activeTab === "hub" && player.challenge && <ChallengePanel player={player} atpDb={atpDb} repayDebt={repayDebt} />}
          {activeTab === "hub" && <HubScreen player={player} news={news} advanceWeek={advanceWeek} rating={rating} ranking={ranking} totalPts={totalPts} cancelEnrollment={cancelEnrollment} isAdvancingWeek={isAdvancingWeek} acceptWildcard={acceptWildcard} declineWildcard={declineWildcard} retire={retire} setTournamentDetail={setTournamentDetail} />}
          {activeTab === "calendar" && <CalendarScreen player={player} ranking={ranking} calFilters={calFilters} setCalFilters={setCalFilters} enrollTournament={enrollTournament} cancelEnrollment={cancelEnrollment} setTournamentDetail={setTournamentDetail} />}
          {activeTab === "travel" && <TravelScreen player={player} travelTo={travelTo} />}
          {activeTab === "prep" && <PrepScreen player={player} doTraining={doTraining} hireStaff={hireStaff} fireStaff={fireStaff} />}
          {activeTab === "life" && <LifeScreen player={player} doLifeActivity={doLifeActivity} />}
          {activeTab === "stats" && <StatsScreen player={player} rating={rating} ranking={ranking} totalPts={totalPts} setTournamentDetail={setTournamentDetail} />}
          {activeTab === "atp" && <RankingScreen raceRank={raceRank} atpDb={atpDb} player={player} ranking={ranking} totalPts={totalPts} atpPage={atpPage} setAtpPage={setAtpPage} setAtpPlayerDetail={(pid) => {
            setAtpPlayerDetail(pid);
            if (pid) {
              setPlayer(p => {
                const viewed = p.viewedAtpPlayers || [];
                if (viewed.includes(pid)) return p;
                return { ...p, viewedAtpPlayers: [...viewed, pid] };
              });
            }
          }} />}
          {activeTab === "finance" && <FinanceScreen player={player} acceptSponsorOffer={acceptSponsorOffer} declineSponsorOffer={declineSponsorOffer} requestCancelSponsor={setConfirmCancelSponsor} sponsorCancelCost={sponsorCancelCost} setTournamentDetail={setTournamentDetail} />}
          {activeTab === "shop" && <ShopScreen notify={notify} />}
          {activeTab === "social" && <SocialScreen player={player} posts={news} setNews={setNews} setPlayer={setPlayer} adjustLife={adjustLife} />}
        </div>
        {!flightAnim && !sponsorNegotiation && (
          <nav style={styles.bottomNav}>
            {NAV_GROUPS.map(g => {
              const isActive = activeGroup.id === g.id;
              return (
                <button
                  key={g.id}
                  style={{ ...styles.navBtn, ...(isActive ? styles.navBtnActive : {}) }}
                  onClick={() => setActiveTab(isActive ? activeTab : (lastScreenByGroup.current[g.id] || g.screens[0].id))}
                >
                  <Icon name={g.icon} size={22} color={isActive ? T.green : T.fg4} strokeWidth={isActive ? 2 : 1.7} />
                  <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 500 }}>{g.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Season-end recap overlay */}
      {player.pendingSeasonRecap && (() => {
        const r = player.pendingSeasonRecap;
        const winRate = (r.wins + r.losses) > 0 ? Math.round(r.wins / (r.wins + r.losses) * 100) : 0;
        const prev = (player.careerSeasons || []).slice(-2)[0]; // previous season (if any)
        const rankDelta = prev ? prev.endOfYearRanking - r.endOfYearRanking : null;
        return (
          <div style={{ position: "fixed", inset: 0, background: T.overlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 250, padding: 16 }}>
            <div style={{ background: T.bg1, borderRadius: 3, padding: 22, border: "1px solid " + T.amber, maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div><Icon name="flag" size={44} color={T.green} /></div>
                <div style={{ color: T.amber, fontWeight: 900, fontSize: 22 }}>Bilan saison {r.year}</div>
                <div style={{ color: T.fg4, fontSize: 12 }}>Bienvenue dans la saison {r.year + 1} !</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ background: T.bg0, borderRadius: 3, padding: 12, textAlign: "center", border: "1px solid " + T.brd }}>
                  <div style={{ color: T.fg4, fontSize: 11 }}>Classement final</div>
                  <div style={{ color: T.amber, fontWeight: 800, fontSize: 20 }}>#{r.endOfYearRanking}</div>
                  {rankDelta !== null && (
                    <div style={{ color: rankDelta > 0 ? T.green : rankDelta < 0 ? T.red : T.fg4, fontSize: 11 }}>
                      {rankDelta > 0 ? "↑ +" + rankDelta : rankDelta < 0 ? "↓ " + rankDelta : "→ 0"} place{Math.abs(rankDelta) > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
                <div style={{ background: T.bg0, borderRadius: 3, padding: 12, textAlign: "center", border: "1px solid " + T.brd }}>
                  <div style={{ color: T.fg4, fontSize: 11 }}>Points ATP</div>
                  <div style={{ color: T.green, fontWeight: 800, fontSize: 20 }}>{r.endOfYearPoints}</div>
                </div>
              </div>
              <div style={{ background: T.bg0, borderRadius: 3, padding: 12, marginBottom: 12, border: "1px solid " + T.brd }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: T.fg3, fontSize: 13, padding: "4px 0", borderBottom: "1px solid " + T.brd }}>
                  <span>Victoires</span><strong style={{ color: T.green }}>{r.wins}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: T.fg3, fontSize: 13, padding: "4px 0", borderBottom: "1px solid " + T.brd }}>
                  <span>Défaites</span><strong style={{ color: T.red }}>{r.losses}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: T.fg3, fontSize: 13, padding: "4px 0", borderBottom: "1px solid " + T.brd }}>
                  <span>Taux de victoire</span><strong style={{ color: winRate >= 50 ? T.green : T.red }}>{winRate}%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: T.fg3, fontSize: 13, padding: "4px 0", borderBottom: "1px solid " + T.brd }}>
                  <span>Titres</span><strong style={{ color: T.amber }}><Icon name="trophy" size={11} /> {r.titles}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: T.fg3, fontSize: 13, padding: "4px 0" }}>
                  <span>Gains saison</span><strong style={{ color: T.green }}>+{r.earnings.toLocaleString()}€</strong>
                </div>
              </div>
              {typeof r.legacyScore === "number" && (() => {
                const prevScore = prev && typeof prev.legacyScore === "number" ? prev.legacyScore : null;
                const delta = prevScore !== null ? r.legacyScore - prevScore : null;
                const tier = legacyTier(r.legacyScore);
                // Detailed legacy breakdown — same data structure as the end of career screen.
                const breakdown = computeLegacyBreakdown(player);
                return (
                  <>
                    <div style={{ background: T.bg0, borderRadius: 3, padding: 14, marginBottom: 12, border: "1px solid " + tier.color + "55", textAlign: "center" }}>
                      <div style={{ color: T.fg4, fontSize: 10, fontWeight: 700, letterSpacing: 0.2, textTransform: "none", marginBottom: 4 }}>Score de légende</div>
                      <div style={{ color: tier.color, fontWeight: 900, fontSize: 30, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{r.legacyScore.toLocaleString()}</div>
                      <div style={{ display: "inline-block", marginTop: 6, padding: "2px 10px", borderRadius: 3, background: tier.color + "22", border: "1px solid " + tier.color + "55", color: tier.color, fontWeight: 700, fontSize: 11, letterSpacing: 0.5 }}>{tier.label}</div>
                      {delta !== null && (
                        <div style={{ color: delta > 0 ? T.green : delta < 0 ? T.red : T.fg4, fontSize: 12, fontWeight: 700, marginTop: 8 }}>
                          {delta > 0 ? "↑ +" + delta.toLocaleString() : delta < 0 ? "↓ " + delta.toLocaleString() : "→ 0"} cette saison
                        </div>
                      )}
                    </div>
                    {/* Legacy score breakdown — same rows as the end-of-career
                        reveal, so the player can track how each component grows. */}
                    <div style={{ background: T.bg0, borderRadius: 3, padding: 12, marginBottom: 12, border: "1px solid " + T.brd }}>
                      <div style={{ color: T.fg4, fontSize: 10, fontWeight: 700, letterSpacing: 0.2, textTransform: "none", marginBottom: 8 }}>Détail du score</div>
                      {breakdown.rows.map((row, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "4px 0", borderBottom: i < breakdown.rows.length - 1 ? "1px dashed " + T.brd : "none" }}>
                          <span style={{ color: T.fg3, fontSize: 12 }}>{row.label}</span>
                          <span style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                            <span style={{ color: T.fg5, fontSize: 10, fontFamily: T.mono }}>{row.detail}</span>
                            <strong style={{ color: T.fg, fontSize: 12, fontFamily: T.mono, fontVariantNumeric: "tabular-nums", minWidth: 50, textAlign: "right" }}>{row.pts.toLocaleString()}</strong>
                          </span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 2px", marginTop: 4, borderTop: "1px solid " + T.brd2, color: T.fg3, fontSize: 12 }}>
                        <span>Sous-total</span>
                        <strong style={{ color: T.fg, fontFamily: T.mono }}>{breakdown.subtotal.toLocaleString()}</strong>
                      </div>
                      {breakdown.difficultyBonus !== 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: breakdown.difficultyBonus > 0 ? T.green : T.red, fontSize: 12 }}>
                          <span>{breakdown.diffPct > 0 ? "Bonus" : "Malus"} difficulté ({breakdown.mulLabel})</span>
                          <strong style={{ fontFamily: T.mono }}>{breakdown.difficultyBonus > 0 ? "+" : ""}{breakdown.difficultyBonus.toLocaleString()}</strong>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
              <button style={styles.btnPrimary} onClick={dismissSeasonRecap}>Continuer →</button>
            </div>
          </div>
        );
      })()}

      {/* Hall of Fame modal */}
      {/* Life event modal */}
      {player.challenge && !player.challenge.introSeen && (() => {
        const def = getChallengeDef(player.challenge.id);
        if (!def) return null;
        return (
          <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 260, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div className="tm-fade-up" style={{ background: T.bg1, borderRadius: 3, padding: 20, border: "1px solid " + T.brd2, borderTop: "3px solid " + T.clay, maxWidth: 400, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
              <div className="tm-eyebrow" style={{ color: T.clay, marginBottom: 6 }}>Défi</div>
              <div style={{ color: T.fg, fontSize: 22, fontWeight: 700, fontFamily: T.display, marginBottom: 10 }}>{def.name}</div>
              <div style={{ color: T.fg2, fontSize: 13.5, lineHeight: 1.6, marginBottom: 14 }}>{def.context}</div>
              <div style={{ background: T.bg2, border: "1px solid " + T.brd, borderRadius: 3, padding: 12, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.fg, fontWeight: 700 }}><Icon name="target" size={16} color={T.green} /> {def.objectiveLabel}</div>
                <div style={{ color: T.fg4, fontSize: 12, marginTop: 4, marginLeft: 24 }}>{def.deadlineLabel}</div>
              </div>
              {def.perks.map((pk, i) => (
                <div key={i} style={{ display: "flex", gap: 8, color: T.fg2, fontSize: 13, lineHeight: 1.45, marginBottom: 6 }}>
                  <Icon name="chevronRight" size={14} color={T.clay} style={{ marginTop: 2 }} /> <span>{pk}</span>
                </div>
              ))}
              <button style={{ ...styles.btnPrimary, marginTop: 10 }} onClick={() => setPlayer(p => ({ ...p, challenge: { ...p.challenge, introSeen: true } }))}>C'est parti</button>
            </div>
          </div>
        );
      })()}
      {player.challenge && player.challenge.status !== "active" && !player.challenge.resultSeen && (() => {
        const def = getChallengeDef(player.challenge.id);
        const res = player.challenge.result || {};
        const ok = player.challenge.status === "success";
        const seen = { ...player, challenge: { ...player.challenge, resultSeen: true } };
        return (
          <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 260, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div className="tm-fade-up" style={{ background: T.bg1, borderRadius: 3, padding: 22, border: "1px solid " + T.brd2, borderTop: "3px solid " + (ok ? T.green : T.red), maxWidth: 380, width: "100%", textAlign: "center" }}>
              <Icon name={ok ? "trophy" : "fail"} size={40} color={ok ? (MEDAL_INFO[res.medal] || {}).color || T.ball : T.red} />
              <div className="tm-eyebrow" style={{ marginTop: 10 }}>{def ? def.name : "Défi"}</div>
              <div style={{ color: T.fg, fontSize: 24, fontWeight: 700, fontFamily: T.display, margin: "4px 0 8px" }}>{ok ? "Défi réussi !" : "Défi échoué"}</div>
              {ok ? (
                <div style={{ color: T.fg2, fontSize: 14, marginBottom: 12 }}>
                  Médaille <strong style={{ color: (MEDAL_INFO[res.medal] || {}).color }}>{(MEDAL_INFO[res.medal] || {}).label}</strong> · {res.weeks} semaine{res.weeks > 1 ? "s" : ""}
                </div>
              ) : (
                <div style={{ color: T.fg3, fontSize: 13.5, lineHeight: 1.5, marginBottom: 12 }}>{res.reason}</div>
              )}
              <div style={{ background: T.bg2, border: "1px solid " + T.brd, borderRadius: 3, padding: "8px 12px", marginBottom: 14, textAlign: "left" }}>
                {(res.rows || []).map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "5px 0", borderBottom: "1px solid " + T.brd }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ color: T.fg2, fontSize: 12.5, fontWeight: 600 }}>{r.label}</span>
                      <span style={{ display: "block", color: T.fg5, fontSize: 11 }}>{r.detail}</span>
                    </span>
                    <span className="tm-num" style={{ color: T.fg, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{r.pts.toLocaleString("fr-FR")}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
                  <span style={{ color: T.fg, fontWeight: 700 }}>Score du défi</span>
                  <span className="tm-num" style={{ color: T.clay, fontSize: 18, fontWeight: 700 }}>{(res.score || 0).toLocaleString("fr-FR")}</span>
                </div>
              </div>
              {!ok && def && (
                <button style={{ ...styles.btnPrimary, marginBottom: 10 }} onClick={() => startChallenge(def, { name: player.name, nationality: player.nationality, circuit: player.circuit || "atp" })}>Réessayer</button>
              )}
              <button style={{ ...styles.btnSecondary, marginBottom: 8 }} onClick={() => setPlayer(seen)}>{ok ? "Continuer la partie" : "Continuer quand même"}</button>
              <button style={styles.btnSecondary} onClick={() => returnToMenu(seen)}>Menu principal</button>
            </div>
          </div>
        );
      })()}
      {player.pendingLifeEvent && (() => {
        const ev = getEventById(player.pendingLifeEvent);
        if (!ev) return null;
        const evDef = ev.challenge ? getChallengeDef(ev.challenge) : null;
        return (
          <div style={{
            position: "fixed", inset: 0, background: T.overlay,
            backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
            zIndex: 240, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}>
            <div className="tm-fade-up" style={{
              background: T.bg1, borderRadius: 3, padding: 20,
              border: "1px solid " + T.brd2, borderTop: "3px solid " + T.ball,
              maxWidth: 380, width: "100%",
              boxShadow: "0 10px 30px var(--tm-shadow)",
            }}>
              <div className="tm-eyebrow" style={{ color: evDef ? T.clay : T.ball, marginBottom: 6 }}>{evDef ? "Défi · " + evDef.name : "Événement de la semaine"}</div>
              <div style={{ color: T.fg, fontSize: 17, fontWeight: 800, marginBottom: 10, letterSpacing: 0.3 }}>
                {ev.title}
              </div>
              <div style={{ color: T.fg3, fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                {typeof ev.body === "function" ? ev.body(player) : ev.body}
              </div>
              {ev.options.map((opt, i) => {
                const eff = opt.effects || {};
                const chips = [];
                if (eff.money) chips.push({ label: (eff.money > 0 ? "+" : "") + eff.money.toLocaleString() + "€", color: eff.money > 0 ? T.green : T.red });
                if (eff.energy) chips.push({ label: (eff.energy > 0 ? "+" : "") + eff.energy, color: eff.energy > 0 ? T.green : T.red, icon: "energy" });
                if (eff.happiness) chips.push({ label: (eff.happiness > 0 ? "+" : "") + eff.happiness, color: eff.happiness > 0 ? "var(--tm-amber)" : T.red, icon: "heart" });
                if (eff.popularity) chips.push({ label: (eff.popularity > 0 ? "+" : "") + eff.popularity, color: eff.popularity > 0 ? T.green : T.red, icon: "sparkles" });
                if (eff.image) chips.push({ label: (eff.image > 0 ? "+" : "") + eff.image, color: eff.image > 0 ? "var(--tm-blue)" : T.red, icon: "users" });
                if (opt.investment) chips.push({ label: "Résultat dans " + opt.investment.weeks + " sem. · gros gain possible", color: T.amber });
                if (opt.restWeeks) chips.push({ label: "Ni entraînement ni tournoi · " + opt.restWeeks + " sem.", color: T.amber });
                if (opt.injuryRisk) chips.push({ label: "Risque de blessure " + Math.round(opt.injuryRisk * 100) + "%", color: T.red });
                if (opt.statGain) chips.push({ label: "Stats + (léger)", color: T.green });
                if (opt.trainBoost) chips.push({ label: "Entraînement +" + Math.round((opt.trainBoost.mul - 1) * 100) + "% · " + opt.trainBoost.weeks + " sem.", color: T.green });
                if (opt.outcomes && opt.outcomes.length > 0) chips.push({ label: "Réussite " + Math.round(opt.outcomes[0].chance * 100) + "% · issue incertaine", color: T.amber });
                (opt.chips || []).forEach(c => chips.push(c));
                return (
                  <button key={i} onClick={() => resolveLifeEvent(opt)} style={{
                    width: "100%", padding: "12px 14px",
                    background: T.bg2, border: "1px solid " + T.brd2,
                    borderRadius: 3, color: T.fg, textAlign: "left",
                    cursor: "pointer", marginBottom: 8, fontFamily: T.body,
                    fontSize: 13,
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{opt.label}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {chips.map((c, j) => (
                        <span key={j} style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 6px",
                          borderRadius: 4, background: T.bg3, color: c.color,
                          display: "inline-flex", alignItems: "center", gap: 3,
                        }}>
                          {c.label}
                          {c.icon && <Icon name={c.icon} size={10} color={c.color} />}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {showHallOfFame && (() => {
        const unlocked = new Set(player.trophies || []);
        const claimed = new Set(player.claimedTrophies || []);
        const byCategory = {};
        for (const t of TROPHIES) {
          if (!byCategory[t.cat]) byCategory[t.cat] = [];
          byCategory[t.cat].push(t);
        }
        const total = TROPHIES.length;
        const got = unlocked.size;
        // Total claimable cash (unlocked but not yet claimed)
        const claimableTotal = TROPHIES
          .filter(t => unlocked.has(t.id) && !claimed.has(t.id))
          .reduce((sum, t) => sum + (RARITY_REWARD[t.rarity] || 0), 0);
        const claimableCount = TROPHIES.filter(t => unlocked.has(t.id) && !claimed.has(t.id)).length;

        const claimTrophy = (trophyId, amount) => {
          setPlayer(p => ({
            ...p,
            money: p.money + amount,
            totalEarnings: (p.totalEarnings || 0) + amount,
            claimedTrophies: [...(p.claimedTrophies || []), trophyId],
          }));
        };

        const claimAll = () => {
          const toClaim = TROPHIES.filter(t => unlocked.has(t.id) && !claimed.has(t.id));
          const totalAmount = toClaim.reduce((s, t) => s + (RARITY_REWARD[t.rarity] || 0), 0);
          setPlayer(p => ({
            ...p,
            money: p.money + totalAmount,
            totalEarnings: (p.totalEarnings || 0) + totalAmount,
            claimedTrophies: [...(p.claimedTrophies || []), ...toClaim.map(t => t.id)],
          }));
        };

        return (
          <div style={{
            position: "fixed", inset: 0, background: T.bg0,
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            zIndex: 250,
            overflowY: "auto",
          }} onClick={() => setShowHallOfFame(false)}>
            <div onClick={e => e.stopPropagation()} style={{
              maxWidth: 440, margin: "0 auto",
              minHeight: "100vh",
              background: T.bg0,
            }}>
              {/* Header */}
              <div style={{
                position: "sticky", top: 0, zIndex: 2,
                background: T.bg0,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                padding: "14px 18px",
                borderBottom: "1px solid " + T.brd,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <button onClick={() => setShowHallOfFame(false)} style={{
                  background: "none", border: "none", color: T.fg2,
                  cursor: "pointer", padding: 4, display: "flex", alignItems: "center",
                }}>
                  <Icon name="x" size={20} />
                </button>
                <div style={{ flex: 1 }}>
                  <div className="tm-eyebrow" style={{ color: T.ball, marginBottom: 2 }}>Hall of Fame</div>
                  <div className="tm-display" style={{ color: T.fg, fontSize: 20, lineHeight: 1, letterSpacing: 0.2 }}>
                    {got} <span style={{ color: T.fg5 }}>/ {total}</span>
                  </div>
                </div>
              </div>

              {/* Claimable rewards banner */}
              {claimableCount > 0 && (
                <div style={{
                  margin: "12px 16px 0",
                  padding: 12, borderRadius: 3,
                  background: "linear-gradient(135deg, var(--tm-greenSub), var(--tm-amberSub))",
                  border: "1px solid " + T.green,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <Icon name="money" size={18} color={T.green} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.fg, fontSize: 13, fontWeight: 700 }}>
                      {claimableTotal.toLocaleString()}€ à réclamer
                    </div>
                    <div style={{ color: T.fg4, fontSize: 10, marginTop: 2 }}>
                      {claimableCount} récompense{claimableCount > 1 ? "s" : ""} en attente
                    </div>
                  </div>
                  <button onClick={claimAll} style={{
                    background: T.green, color: T.bg0, border: "none",
                    borderRadius: 3, padding: "8px 14px",
                    fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: "none",
                    cursor: "pointer",
                  }}>Tout réclamer</button>
                </div>
              )}

              {/* Categories */}
              <div style={{ padding: 16 }}>
                {Object.entries(byCategory).map(([catKey, trophies]) => {
                  const cat = TROPHY_CATEGORIES[catKey];
                  const catGot = trophies.filter(t => unlocked.has(t.id)).length;
                  return (
                    <div key={catKey} style={{ marginBottom: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <Icon name={cat.iconName} size={14} color={T.green} />
                        <div className="tm-eyebrow" style={{ color: T.fg2 }}>{cat.label}</div>
                        <div style={{ flex: 1, height: 1, background: T.brd }} />
                        <div className="tm-num" style={{ color: T.fg5, fontSize: 11 }}>{catGot} / {trophies.length}</div>
                      </div>

                      {trophies.map(t => {
                        const isUnlocked = unlocked.has(t.id);
                        const result = isUnlocked ? { unlocked: true } : t.check(player);
                        const rarity = RARITY[t.rarity];
                        const hasProgress = result.progress && !isUnlocked;

                        return (
                          <div key={t.id} style={{
                            background: isUnlocked ? T.bg1 : T.bg2,
                            borderRadius: 3, padding: 12, marginBottom: 8,
                            border: "1px solid " + (isUnlocked ? "var(--tm-amberSub)" : T.brd),
                            borderLeft: "3px solid " + (isUnlocked ? rarity.color : T.brd2),
                            opacity: isUnlocked ? 1 : 0.65,
                            display: "flex", alignItems: "center", gap: 12,
                            transition: "all 0.2s",
                            boxShadow: isUnlocked ? "0 2px 12px " + rarity.glow : "none",
                          }}>
                            <div style={{
                              width: 40, height: 40, borderRadius: 3,
                              background: isUnlocked ? "var(--tm-amberSub)" : T.bg3,
                              border: "1px solid " + (isUnlocked ? rarity.color : T.brd2),
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                            }}>
                              <Icon
                                name={isUnlocked ? "trophy" : "ban"}
                                size={20}
                                color={isUnlocked ? rarity.color : T.fg5}
                                strokeWidth={isUnlocked ? 2 : 1.5}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: isUnlocked ? T.fg : T.fg3, fontSize: 13, fontWeight: 700, letterSpacing: 0.2 }}>
                                {t.name}
                              </div>
                              <div style={{ color: T.fg4, fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>{t.desc}</div>
                              {hasProgress && (
                                <div style={{ marginTop: 6 }}>
                                  <div style={{ height: 3, background: T.bg4, borderRadius: 2, overflow: "hidden", marginBottom: 2 }}>
                                    <div style={{ height: "100%", width: (result.progress.current / result.progress.target * 100) + "%", background: T.green, borderRadius: 2 }} />
                                  </div>
                                  <div className="tm-num" style={{ color: T.fg5, fontSize: 9 }}>
                                    {result.progress.current.toLocaleString()} / {result.progress.target.toLocaleString()}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div style={{
                              display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4,
                              flexShrink: 0,
                            }}>
                              <div style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: 0.2, textTransform: "none",
                                color: isUnlocked ? rarity.color : T.fg5,
                              }}>{rarity.label}</div>
                              {isUnlocked && (() => {
                                const reward = RARITY_REWARD[t.rarity] || 0;
                                const isClaimed = claimed.has(t.id);
                                if (isClaimed) {
                                  return (
                                    <div style={{ display: "flex", alignItems: "center", gap: 3, color: T.fg5, fontSize: 10, fontWeight: 700 }}>
                                      <Icon name="check" size={10} color={T.fg5} /> {reward}€
                                    </div>
                                  );
                                }
                                return (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); claimTrophy(t.id, reward); }}
                                    style={{
                                      background: T.green, color: T.bg0, border: "none",
                                      borderRadius: 6, padding: "4px 8px",
                                      fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
                                      cursor: "pointer", whiteSpace: "nowrap",
                                    }}
                                  >+{reward}€</button>
                                );
                              })()}
                              {!isUnlocked && (
                                <div style={{ color: T.fg5, fontSize: 10, fontWeight: 600 }}>
                                  +{RARITY_REWARD[t.rarity] || 0}€
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sponsor cancellation modal */}
      {confirmCancelSponsor && (() => {
        const s = confirmCancelSponsor;
        const { rupture, objective: objPenalty, total: penalty } = sponsorCancelBreakdown(s);
        return (
          <div style={{
            position: "fixed", inset: 0, background: T.overlay,
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, zIndex: 300,
          }} onClick={() => setConfirmCancelSponsor(null)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: T.bg1, borderRadius: 3, padding: 22,
              border: "1px solid " + T.red, borderTop: "3px solid " + T.red,
              maxWidth: 340, width: "100%",
              boxShadow: "0 10px 30px var(--tm-shadow)",
            }}>
              <div className="tm-eyebrow" style={{ color: T.red, marginBottom: 8 }}>Résiliation</div>
              <div style={{ color: T.fg, fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Résilier le contrat avec {s.brand} ?</div>
              <div style={{ color: T.fg3, fontSize: 13, lineHeight: 1.5, marginBottom: 18 }}>
                Indemnité de rupture : <span className="tm-num" style={{ color: T.red }}>−{rupture.toLocaleString()} €</span> (6 mois de contrat au plus).
                <br />
                {objPenalty > 0 && (<>Objectif non atteint : <span className="tm-num" style={{ color: T.red }}>−{objPenalty.toLocaleString()} €</span><br /></>)}
                Total : <strong className="tm-num" style={{ color: T.red }}>−{penalty.toLocaleString()} €</strong>
                <br />
                Vous perdrez le revenu hebdomadaire de <span className="tm-num">{s.weeklyPay}€</span> et le bonus titre de <span className="tm-num">{s.titleBonus.toLocaleString()}€</span>.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...styles.btnSmall, flex: 1 }} onClick={() => setConfirmCancelSponsor(null)}>Annuler</button>
                <button
                  style={{ ...styles.btnSmall, flex: 1, background: T.red, color: T.fg, borderColor: T.red }}
                  onClick={() => { cancelSponsor(s); setConfirmCancelSponsor(null); }}
                >Confirmer la résiliation</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sponsor replacement modal: same-category cap reached, pick which to cancel */}
      {sponsorReplaceModal && (() => {
        const { offer, candidates } = sponsorReplaceModal;
        const catLabel = (offer.cat === "equipment") ? "équipementier" : "autre sponsor";
        return (
          <div style={{
            position: "fixed", inset: 0, background: T.overlay,
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, zIndex: 300,
          }} onClick={() => setSponsorReplaceModal(null)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: T.bg1, borderRadius: 3, padding: 22,
              border: "1px solid " + T.ball, borderTop: "3px solid " + T.ball,
              maxWidth: 400, width: "100%",
              boxShadow: "0 10px 30px var(--tm-shadow)",
            }}>
              <div className="tm-eyebrow" style={{ color: T.ball, marginBottom: 8 }}>Remplacer un sponsor</div>
              <div style={{ color: T.fg, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                Vous avez déjà atteint la limite d'{catLabel}{(offer.cat === "other") ? "s" : ""}.
              </div>
              <div style={{ color: T.fg3, fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                Pour signer avec <strong style={{ color: T.fg }}>{offer.brand}</strong>, choisissez un sponsor à résilier. Le coût de résiliation sera prélevé (indemnité de rupture, plus la pénalité d'objectif si celui-ci n'est pas atteint).
              </div>

              {candidates.map(s => {
                const penalty = sponsorCancelCost(s);
                const canAfford = player.money >= penalty;
                return (
                  <button
                    key={s.id}
                    disabled={!canAfford}
                    onClick={() => confirmSponsorReplacement(s)}
                    style={{
                      width: "100%", textAlign: "left",
                      background: T.bg2, border: "1px solid " + T.brd2,
                      borderRadius: 3, padding: 12, marginBottom: 8,
                      cursor: canAfford ? "pointer" : "not-allowed",
                      opacity: canAfford ? 1 : 0.5,
                      display: "flex", alignItems: "center", gap: 10,
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 3,
                      background: T.red,
                      color: T.fg, fontWeight: 800, fontSize: 14,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>✕</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: T.fg, fontWeight: 700, fontSize: 13 }}>{s.brand}</div>
                      <div style={{ color: T.fg4, fontSize: 11, marginTop: 2 }}>
                        <span className="tm-num">{s.weeklyPay}€/sem</span>
                        <span style={{ color: T.fg5, margin: "0 6px" }}>·</span>
                        <span className="tm-num">{s.weeksLeft}</span> sem restantes
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className="tm-eyebrow" style={{ color: T.red }}>Résil.</div>
                      <div className="tm-num" style={{ color: T.red, fontWeight: 800, fontSize: 13 }}>
                        −{penalty.toLocaleString()}€
                      </div>
                    </div>
                  </button>
                );
              })}

              <button
                style={{ ...styles.btnSmall, width: "100%", marginTop: 4 }}
                onClick={() => setSponsorReplaceModal(null)}
              >Annuler</button>
            </div>
          </div>
        );
      })()}

      {/* Tournament detail modal */}
      {tournamentDetail && (() => {
        const t = ALL_TOURNAMENTS.find(x => x.id === tournamentDetail);
        if (!t) return null;
        const fmt = getTournamentFormat(t);
        const cityInfo = CITIES[t.city];
        const entry = getEntryStatus(t, ranking);
        const dist = distanceKm(player.location, t.city);
        const travelCost = travelCostBetween(player.location, t.city);
        const playerIsSeed = entry.status === "direct" && fmt.byeSeeds > 0 && ranking <= fmt.byeSeeds;
        return (
          <div style={{ position: "fixed", inset: 0, background: "var(--tm-overlay)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400, padding: 16 }} onClick={() => setTournamentDetail(null)}>
            <div style={{ background: T.bg1, borderRadius: 3, padding: 20, border: "1px solid " + tierColor(t.tier), maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: tierColor(t.tier), fontSize: 11, fontWeight: 800, letterSpacing: 0.2, textTransform: "none" }}>{tierLabel(t.tier)}</div>
                  <div style={{ color: T.fg, fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>{t.name}</div>
                  <div style={{ color: T.fg4, fontSize: 13, marginTop: 4 }}><FlagFromEmoji emoji={cityInfo?.flag} /> {t.city}, {cityInfo?.country}</div>
                </div>
                <button style={{ background: "none", border: "none", color: T.fg4, fontSize: 22, cursor: "pointer", padding: 4 }} onClick={() => setTournamentDetail(null)}>✕</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ background: T.bg0, borderRadius: 3, padding: 10 }}>
                  <div style={{ color: T.fg4, fontSize: 10 }}>Surface</div>
                  <div style={{ color: T.fg, fontWeight: 700 }}><SurfaceIcon name={t.surface} /> {t.surface}</div>
                </div>
                <div style={{ background: T.bg0, borderRadius: 3, padding: 10 }}>
                  <div style={{ color: T.fg4, fontSize: 10 }}>Semaine</div>
                  <div style={{ color: T.fg, fontWeight: 700 }}>S{t.week}</div>
                </div>
                <div style={{ background: T.bg0, borderRadius: 3, padding: 10 }}>
                  <div style={{ color: T.fg4, fontSize: 10 }}>Prize money total</div>
                  <div style={{ color: T.green, fontWeight: 700 }}>{t.prize.toLocaleString()}€</div>
                </div>
                <div style={{ background: T.bg0, borderRadius: 3, padding: 10 }}>
                  <div style={{ color: T.fg4, fontSize: 10 }}>Points (vainqueur)</div>
                  <div style={{ color: T.amber, fontWeight: 700 }}>{t.points} pts</div>
                </div>
              </div>

              <div style={{ background: T.bg0, borderRadius: 3, padding: 12, marginBottom: 12 }}>
                <div style={{ color: T.amber, fontSize: 12, fontWeight: 800, marginBottom: 6 }}><Icon name="clipboard" size={11} /> Format</div>
                <div style={{ color: T.fg3, fontSize: 12, lineHeight: 1.6 }}>
                  Tableau principal : <strong>{fmt.drawSize} joueurs</strong><br />
                  Nombre de tours : <strong>{fmt.mainRounds.length}</strong> ({fmt.mainRounds.join(" → ")})<br />
                  Format : <strong>{fmt.setsToWin === 3 && !isWTA() ? "3 sets gagnants (Best of 5)" : "2 sets gagnants (Best of 3)"}</strong>
                  {fmt.setsToWin === 3 && !isWTA() && (fmt.qualiRounds || 0) > 0 && (
                    <span style={{ color: T.fg4 }}> · qualifs en 2 sets gagnants{t.id === "wimbledon" ? " (3 au dernier tour)" : ""}</span>
                  )}<br />
                  Têtes de série : <strong>{getSeedCount(fmt)}</strong>
                  {fmt.byeSeeds > 0 && <> · Bye 1er tour pour le top <strong>{fmt.byeSeeds}</strong></>}<br />
                  Qualifications : <strong>{fmt.qualiRounds} tours</strong>
                </div>
              </div>

              <div style={{ background: T.bg0, borderRadius: 3, padding: 12, marginBottom: 12 }}>
                <div style={{ color: T.amber, fontSize: 12, fontWeight: 800, marginBottom: 6 }}><Icon name="target" size={11} /> Critères d'accès</div>
                <div style={{ color: T.fg3, fontSize: 12, lineHeight: 1.6 }}>
                  Entrée directe : <strong>top {fmt.directCut}</strong> ATP<br />
                  Qualifs ouvertes jusqu'au top <strong>{fmt.qualiCut === 9999 ? "∞" : fmt.qualiCut}</strong>
                </div>
              </div>

              <div style={{ background: T.bg0, borderRadius: 3, padding: 12, marginBottom: 12 }}>
                <div style={{ color: T.amber, fontSize: 12, fontWeight: 800, marginBottom: 6 }}><Icon name="user" size={12} /> Votre situation</div>
                <div style={{ color: T.fg3, fontSize: 12, lineHeight: 1.7 }}>
                  Votre classement : <strong>#{ranking}</strong><br />
                  Statut :{" "}
                  {entry.status === "direct" && <strong style={{ color: T.green }}><Icon name="check" size={11} /> Entrée directe{entry.protected ? " (classement protégé)" : ""}</strong>}
                  {entry.status === "qualifying" && <strong style={{ color: T.amber }}>Qualifs requises</strong>}
                  {entry.status === "blocked" && <strong style={{ color: T.red }}><Icon name="fail" size={11} /> Classement insuffisant</strong>}
                  {playerIsSeed && <span style={{ color: T.green }}> (tête de série, bye 1er tour)</span>}<br />
                  Distance : <strong>{Math.round(dist)} km</strong> ({travelCost}€ de voyage)<br />
                  {t.entryFee > 0 && <>Frais d'inscription : <strong>{t.entryFee}€</strong></>}
                </div>
              </div>

              <button style={{ ...styles.btnSecondary, marginTop: 8 }} onClick={() => setTournamentDetail(null)}>Fermer</button>
            </div>
          </div>
        );
      })()}

      {/* ATP player detail modal */}
      {atpPlayerDetail && (() => {
        const p = atpDb.find(x => x.id === atpPlayerDetail);
        if (!p) return null;
        const rank = atpDb.findIndex(x => x.id === atpPlayerDetail) + 1;
        const adjustedRank = rank >= ranking ? rank + 1 : rank;
        const profile = getPlayerProfile(p.stats);
        const styleInfo = PLAYER_STYLES[p.style] || PLAYER_STYLES.allcourt;
        const winRate = (p.seasonWins + p.seasonLosses) > 0 ? Math.round(p.seasonWins / (p.seasonWins + p.seasonLosses) * 100) : 0;
        const statLabels = { serve: "Service", forehand: "Coup droit", backhand: "Revers", stamina: "Endurance", mental: "Mental", net: "Filet" };
        return (
          <div style={{ position: "fixed", inset: 0, background: "var(--tm-overlay)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }} onClick={() => setAtpPlayerDetail(null)}>
            <div style={{ background: T.bg1, borderRadius: 3, padding: 20, border: "1px solid var(--tm-green)", maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: T.green, fontSize: 11, fontWeight: 800, letterSpacing: 0.2, textTransform: "none" }}>Classement #{adjustedRank}</div>
                  <div style={{ color: T.fg, fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}><FlagFromEmoji emoji={p.nat.flag} /> {p.name}</div>
                  <div style={{ color: T.fg4, fontSize: 13, marginTop: 4 }}>{p.nat.country}</div>
                </div>
                <button style={{ background: "none", border: "none", color: T.fg4, fontSize: 22, cursor: "pointer", padding: 4 }} onClick={() => setAtpPlayerDetail(null)}>✕</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ background: T.bg0, borderRadius: 3, padding: 10 }}>
                  <div style={{ color: T.fg4, fontSize: 10 }}>Points ATP</div>
                  <div style={{ color: T.amber, fontWeight: 700, fontSize: 16 }}>{p.points.toLocaleString()}</div>
                </div>
                <div style={{ background: T.bg0, borderRadius: 3, padding: 10 }}>
                  <div style={{ color: T.fg4, fontSize: 10 }}>Âge</div>
                  <div style={{ color: T.fg, fontWeight: 700, fontSize: 16 }}>{p.age || "—"} ans</div>
                </div>
                <div style={{ background: T.bg0, borderRadius: 3, padding: 10 }}>
                  <div style={{ color: T.fg4, fontSize: 10 }}>Côte globale</div>
                  <div style={{ color: T.fg, fontWeight: 700, fontSize: 16 }}>{getRating(p.stats)}</div>
                </div>
                <div style={{ background: T.bg0, borderRadius: 3, padding: 10 }}>
                  <div style={{ color: T.fg4, fontSize: 10 }}>Win rate (saison)</div>
                  <div style={{ color: T.green, fontWeight: 700, fontSize: 16 }}>{winRate}%</div>
                </div>
              </div>

              <div style={{ background: T.bg0, borderRadius: 3, padding: 12, marginBottom: 12 }}>
                <div style={{ color: T.amber, fontSize: 12, fontWeight: 800, marginBottom: 8 }}><Icon name="chart" size={11} /> Saison en cours</div>
                <div style={{ display: "flex", justifyContent: "space-between", color: T.fg4, fontSize: 12, padding: "3px 0" }}>
                  <span>Victoires</span><strong style={{ color: T.green }}>{p.seasonWins}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: T.fg4, fontSize: 12, padding: "3px 0" }}>
                  <span>Défaites</span><strong style={{ color: T.red }}>{p.seasonLosses}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: T.fg4, fontSize: 12, padding: "3px 0" }}>
                  <span>Titres</span><strong style={{ color: T.amber }}><Icon name="trophy" size={11} /> {p.seasonTitles}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: T.fg4, fontSize: 12, padding: "3px 0" }}>
                  <span>Gains saison</span><strong style={{ color: T.green }}>{(p.seasonEarnings || 0).toLocaleString()}€</strong>
                </div>
              </div>

              <div style={{ background: T.bg0, borderRadius: 3, padding: 12, marginBottom: 12 }}>
                <div style={{ color: T.amber, fontSize: 12, fontWeight: 800, marginBottom: 8 }}><Icon name="target" size={11} /> Profil</div>
                <div style={{ color: T.fg3, fontSize: 12, lineHeight: 1.6 }}>
                  Point fort : <strong style={{ color: T.green }}>{profile.strength.label} ({Math.round(profile.strength.value)})</strong><br />
                  Point faible : <strong style={{ color: T.red }}>{profile.weakness.label} ({Math.round(profile.weakness.value)})</strong>
                </div>
              </div>

              <div style={{ background: T.bg0, borderRadius: 3, padding: 12, marginBottom: 12 }}>
                <div style={{ color: T.amber, fontSize: 12, fontWeight: 800, marginBottom: 8 }}><Icon name="trending" size={11} /> Compétences</div>
                {Object.entries(p.stats).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                      <span style={{ color: T.fg4 }}>{statLabels[k] || k}</span>
                      <span style={{ color: v >= 80 ? T.green : v >= 60 ? T.amber : T.fg4, fontWeight: 700 }}>{Math.round(v)}</span>
                    </div>
                    <div style={{ height: 4, background: T.brd, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: v + "%", height: "100%", background: v >= 80 ? T.green : v >= 60 ? T.amber : T.green }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: T.bg0, borderRadius: 3, padding: 12, marginBottom: 12 }}>
                <div style={{ color: T.amber, fontSize: 12, fontWeight: 800, marginBottom: 8 }}>Derniers résultats</div>
                {p.recentResults && p.recentResults.length > 0 ? (
                  p.recentResults.slice(0, 6).map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < Math.min(5, p.recentResults.length - 1) ? "1px solid var(--tm-bg2)" : "none", fontSize: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div
                          onClick={tournamentIdByName(r.tournament) ? () => setTournamentDetail(tournamentIdByName(r.tournament)) : undefined}
                          style={{ color: T.fg, cursor: tournamentIdByName(r.tournament) ? "pointer" : "default", textDecoration: tournamentIdByName(r.tournament) ? "underline" : "none", textDecorationColor: T.fg5, textUnderlineOffset: 3 }}
                        >{r.tournament}</div>
                        <div style={{ color: r.isWinner ? T.amber : T.fg4, fontSize: 10 }}>{r.isWinner && <Icon name="trophy" size={10} />} {r.roundReached}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: T.green, fontSize: 11 }}>+{r.prize.toLocaleString()}€</div>
                        <div style={{ color: T.amber, fontSize: 10 }}>+{r.pts}p</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: T.fg5, fontSize: 12, fontStyle: "italic" }}>Aucun résultat enregistré — avancez quelques semaines.</div>
                )}
              </div>

              <button style={{ ...styles.btnSecondary, marginTop: 8 }} onClick={() => setAtpPlayerDetail(null)}>Fermer</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

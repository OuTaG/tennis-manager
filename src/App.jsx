// Composant principal : état de la partie, semaine, tournois, sauvegarde.
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
} from "lucide-react";
import { PRIZE_SPLITS_V2, TOURNAMENT_FORMATS } from "./data/formats.js";
import { CITIES, SURFACES } from "./data/geo.js";
import { INVESTMENT_PLANS, LIFE_EVENTS } from "./data/life.js";
import { PLAYER_STYLES } from "./data/staff.js";
import { CHALLENGE_SLOT, MEDAL_INFO, challengeActive, challengeTallyWeek, evaluateChallenge, getChallengeDef, getEventById, pickChallengeEvent, saveChallengeResult, setActiveChallenge } from "./engine/challenges.js";
import { ALL_TOURNAMENTS, getEntryStatus, getPointSplits, getSeedCount, getTournamentFormat, getTournamentLore, isBestOfFiveMatch, isWTA, playerHasBye, setCircuit, setPlayerRaceRank, tierColor, tierLabel, tournamentAbsWeek } from "./engine/circuit.js";
import { pickComment, pickDebrief, setCloseHow, formRemarks } from "./engine/commentary.js";
import { generateAtpDatabase, getPlayerProfile, getRating, pickOpponentForMatch } from "./engine/database.js";
import { MATCH_FIX_DILEMMA, resolveDilemmaOption } from "./engine/dilemmas.js";
import { feminizeText } from "./engine/feminize.js";
import { elide, firstSentence } from "./engine/text.js";
import { tournamentEarningsFromHistory, tournamentIdByName } from "./engine/history.js";
import { computeCareerSummary, computeLegacyBreakdown, computeLegacyScore, legacyTier } from "./engine/legacy.js";
import { advanceMatchOneGame, aiMatchProb, clampMomentum, createInitialMatchData } from "./engine/match.js";
import { randomFullName } from "./engine/names.js";
import { RETIREMENT_AGE, START_CITIES, betweenMatchRecovery, START_STAT_BONUS, SURFACE_BONUS, adjustLife, ageTrainingMultiplier, applyWeeklyAgeDecline, clampLife, computeMatchLifeDeltas, createInitialPlayer, difficultyFactors, getEffectiveStats, getPlayerRanking, lifeCaps, rollInjury, startMoney, totalAtpPoints } from "./engine/player.js";
import { buildPressConference } from "./engine/press.js";
import { computeTournamentProgression, styledProgressionMultiplier } from "./engine/progression.js";
import { expireOldPoints, playerRaceRank, pointsWeekAfter, raceStandings } from "./engine/race.js";
import { updateCareerRecords } from "./engine/records.js";
import { FINALS_PRIZE, FINALS_PTS, RR_SCHEDULE, buildFinalsDraw, finalizeHumanTournamentBracket, finalsAiMatch, finalsAiResults, finalsPlayMatchday, finalsRanked, generateTournamentArticle, simulateAtpWeek } from "./engine/simulation.js";
import { SOCIAL_AUTHORS, generateAuxSocialPosts, generatePersonalSocialPost, generateWeeklyPersonalPosts, limitPersonalPosts, pickRandom, randomLikes } from "./engine/social.js";
import { SPONSOR_BRANDS, SPONSOR_CAPS, WC_CRITERIA, evaluateSponsorObjective, generateSponsorOffer, getRecentPerfBonus, getSponsorTierForRanking, getWildcardPerfBonus, sponsorCancelBreakdownFor, sponsorObjectiveCounters } from "./engine/sponsors.js";
import { staffTrainEnergyExtra, sumStaffEffect } from "./engine/staff.js";
import { hasPurchased, loadChallengeMeta, loadSlotMetas, saveKeyFor, slotMetaKeyFor, writeSlotMeta } from "./engine/storage.js";
import { distanceKm, travelCostBetween } from "./engine/travel.js";
import { RARITY, RARITY_REWARD, TROPHIES, TROPHY_CATEGORIES, checkTrophies } from "./engine/trophies.js";
import { BarShade, BoxShade, WindowShades, useScrollEdges } from "./ui/scrollShade.jsx";
import { WallGame } from "./ui/overlays/WallGame.jsx";
import { CustomizeScreen } from "./ui/screens/Customize.jsx";
import { loadRosterConfigs, rosterEditCount, rosterEntries } from "./engine/roster.js";

// Couleur du bandeau de match selon la surface.
const LIVE_SURF_BG = { "Gazon": "#1f7a45", "Terre battue": "#c4622d", "Dur": "#2c6fd1", "Indoor": "#5b2d8e" };
import { AVATAR_OPTIONS, Avatar, AvatarBuilder, aiAvatar, femaleHairStyle } from "./ui/avatar.jsx";
import { fmtMoney, fmtNum, fmtKm, fmtStatDelta, rankingName } from "./ui/format.js";
import { BangBadge, FlagFromEmoji, Icon, SurfaceIcon, flagEmojiToCode, withFlags } from "./ui/icons.jsx";
import { NAV_GROUPS, PAGE_HELP, navGroupOf } from "./ui/navigation.js";
import { FlightOverlay } from "./ui/overlays/Flight.jsx";
import { SponsorNegotiationOverlay } from "./ui/overlays/Negotiation.jsx";
import { RallyOverlay } from "./ui/overlays/Rally.jsx";
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
import { FULL_H, styles } from "./ui/styles.js";
import { T, applyCircuitAccent } from "./ui/theme.js";
import { getRngState, newSeed, random, setRngState, setSeed } from "./engine/rng.js";
import { TACTIC_DEFS, adviceStars, coachAdvice, normalizeTactics } from "./engine/tactics.js";
import { TRAINING_CARDS, ZONES, miniGameEffect, pickMatchMiniGame, trainingOdds } from "./engine/minigames.js";
import { programmeGain, trainingBaseGain } from "./engine/training.js";
import { MatchMiniGame, TrainingCards } from "./ui/overlays/MiniGames.jsx";
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
  const [surfaceInput, setSurfaceInput] = useState("Dur");
  const [nationalityInput, setNationalityInput] = useState(""); // chosen at step 1
  const [createStep, setCreateStep] = useState(-1); // -2 = base de joueurs, -1 = circuit, 0 = identité, 1 = profil (style, surface), 2 = départ (ville, difficulté, options)
  const [avatarInput, setAvatarInput] = useState({
    skin: AVATAR_OPTIONS.skin[1],
    hair: AVATAR_OPTIONS.hair[0],
    hairStyle: "court",
    accessory: "bandeau",
    accessoryColor: AVATAR_OPTIONS.accessoryColor[0],
    shirt: AVATAR_OPTIONS.shirt[0],
  });
  const [matchState, setMatchState] = useState(null);
  const [travelSearch, setTravelSearch] = useState(""); // ville pré-remplie dans Voyages (fenêtre de forfait)
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
  const [tacticsOpen, setTacticsOpen] = useState(false);
  const [wallTaps, setWallTaps] = useState(0); // secret des réglages
  const [wildcardBlocked, setWildcardBlocked] = useState(null); // { title, lead, body, injury? } : wildcard impossible à accepter (inscrit ailleurs, repos, blessure)
  const [travelWarning, setTravelWarning] = useState(null); // tournoi de la semaine prochaine, joueur pas sur place
  // Ombres de défilement : fenêtre (pages de jeu), plan de jeu, aide, commentaires.
  const winEdges = useScrollEdges(null);
  const tacticsBoxRef = useRef(null);
  const feedBoxRef = useRef(null);
  const [cardPick, setCardPick] = useState(null); // module d'entraînement en attente du choix de fiche
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
  const [rosterInput, setRosterInput] = useState(-1); // base de joueurs : -1 = Standard, 0-2 = configuration perso
  const [confirmDelete, setConfirmDelete] = useState(null); // emplacement à effacer (null = fermé)
  const [confirmCancelSponsor, setConfirmCancelSponsor] = useState(null); // sponsor to confirm cancelling
  const [confirmRetire, setConfirmRetire] = useState(false); // fenêtre BD de confirmation de la retraite
  const [sponsorReplaceModal, setSponsorReplaceModal] = useState(null); // { offer, candidates: [sponsors of same cat to potentially cancel] }
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const [helpTab, setHelpTab] = useState(null); // tab id whose help is open
  const lastScreenByGroup = useRef({}); // dernier sous-écran ouvert par groupe de navigation
  const [flightAnim, setFlightAnim] = useState(null); // { from, to } during travel animation
  const [sponsorNegotiation, setSponsorNegotiation] = useState(null); // { phase, year, results, objMoney }

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
  // Circuit affiché : celui choisi pendant la création, sinon celui de la
  // carrière chargée. Il pilote l'accent rose et l'accord au féminin.
  const activeCircuit = screen === "create" ? circuitInput : (player?.circuit || "atp");
  useEffect(() => {
    applyCircuitAccent(activeCircuit);
    // Ancien réglage du mode sombre (supprimé) : on nettoie.
    try { localStorage.removeItem("tm-theme"); } catch (e) {}
  }, [activeCircuit]);

  // Changement de page ou de menu : on repart toujours du haut. Les étapes
  // de création et les phases du match (avant-match → direct → résultat)
  // sont aussi des pages : sans cela, le défilement de la précédente est
  // conservé et le haut de la nouvelle passe sous la barre d'état.
  const matchPhase = matchState ? matchState.phase : null;
  useEffect(() => {
    try { window.scrollTo(0, 0); } catch (e) {}
  }, [activeTab, screen, createStep, matchPhase]);

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

  // Trophy detection: check on relevant player changes; record new unlocks.
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
    }
  }, [player?.careerWins, player?.titlesWon, player?.matchHistory?.length, player?.history?.length, player?.totalEarnings, player?.careerSeasons?.length, player?.sponsors?.length, player?.sponsorOffers?.length, player?.wildcardsUsed?.length, player?.viewedAtpPlayers?.length, player?.money, player?.stats]);

  const loadSave = (slotIdx) => {
    try {
      const raw = localStorage.getItem(saveKeyFor(slotIdx));
      if (!raw) { return; }
      const data = JSON.parse(raw);
      if (!data.player || !data.atpDb) { return; }
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
      if (data.player.location === "Dubai") data.player.location = "Dubaï";
      if (!data.player.careerId) data.player.careerId = "c" + Date.now().toString(36) + random().toString(36).slice(2, 6);
      setPlayer(data.player);
      setAtpDb(data.atpDb);
      // Premier sponsor obligatoire : la négociation d'accueil revient si la
      // page a été rechargée avant qu'elle soit conclue.
      if (data.player.introSponsorPending && (data.player.sponsorOffers || []).length > 0) {
        setSponsorNegotiation({ phase: "intro", year: data.player.year || 2026, ranking: 1100, results: [], objMoney: 0 });
      }
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

  // ── DÉFIS ───────────────────────────────────────────────────────────────
  // Lance un défi : partie neuve dans l'emplacement des défis, base IA avancée
  // jusqu'à la semaine de départ, puis mise en situation (setup du défi).
  const startChallenge = (def, form) => {
    setSeed(newSeed());
    setCircuit(form.circuit);
    const female = form.circuit === "wta";
    const avatar = { ...avatarInput, female, hairStyle: female ? "queue" : "court" };
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
    if (pay <= 0) { return; }
    setPlayer(p => ({
      ...p, money: p.money - pay, totalSpent: (p.totalSpent || 0) + pay,
      challenge: { ...p.challenge, debt: Math.max(0, (p.challenge.debt || 0) - pay) },
    }));

  };

  // ── AIDE À LA PREMIÈRE VISITE ────────────────────────────────────────────
  // Nouvelle partie : la fiche d'aide de chaque page s'ouvre toute seule la
  // première fois qu'on y arrive (une seule fois par carrière). Elle reste
  // accessible à tout moment via le bouton « i » en haut à droite.
  useEffect(() => {
    if (screen !== "hub" || !player || !PAGE_HELP[activeTab]) return;
    if (sponsorNegotiation || flightAnim || player.pendingSeasonRecap || player.pendingLifeEvent) return;
    const seen = player.seenHelp || [];
    if (seen.includes(activeTab)) return;
    setHelpTab(activeTab);
    setPlayer(p => ({ ...p, seenHelp: [...(p.seenHelp || []), activeTab] }));
  }, [activeTab, screen, !!player, sponsorNegotiation, flightAnim, player?.pendingSeasonRecap, player?.pendingLifeEvent]);

  // ── WEEK ADVANCE ──────────────────────────────────────────────────────────
  // « Semaine suivante » : si le tournoi où l'on est inscrit commence la
  // semaine prochaine dans une autre ville, on demande confirmation (sinon
  // c'est un forfait, frais d'inscription perdus).
  const requestAdvanceWeek = () => {
    const e = player && player.enrollment;
    const nextWeek = player ? (player.week === 52 ? 1 : player.week + 1) : null;
    const t = e && e.week === nextWeek ? ALL_TOURNAMENTS.find(x => x.id === e.tournamentId) : null;
    const absNext = player ? (player.week === 52 ? player.year + 1 : player.year) * 52 + nextWeek : 0;
    const resting = player && player.restUntilAbsWeek && absNext < player.restUntilAbsWeek;
    const injured = player && player.injury && !player.injury.canPlay;
    if (t && player.location !== t.city && !resting && !injured) { setTravelWarning(t); return; }
    advanceWeek();
  };

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

        p.injury = null;
      } else {
        p.injury = inj;
      }
    }

    // Récupération de la semaine : 25, plus le bonus du staff (kiné,
    // nutritionniste).
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
          const cur = sponsorObjectiveCounters(p);
          const rk = getPlayerRanking(totalAtpPoints(p.atpPointsLog), atpDb);
          const met = evaluateSponsorObjective(s.objective, s.objectiveBaseline || {}, cur, rk);
          const amount = met ? (s.objectiveReward || 0) : -(s.objectivePenalty || 0);
          p.money += amount;
          if (amount > 0) p.totalEarnings = (p.totalEarnings || 0) + amount;
          else p.totalSpent = (p.totalSpent || 0) - amount;
          if (met) p.careerObjectivesMet = (p.careerObjectivesMet || 0) + 1;
          p._endedSponsorResults = [...(p._endedSponsorResults || []), { brand: s.brand, met, amount, objective: s.objective }];

        } else {

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
      const current = sponsorObjectiveCounters(p);
      const keptSponsors = [];
      let objMoney = 0;
      const negotiationResults = []; // for the overlay summary
      for (const s of (p.sponsors || [])) {
        // Objectives are settled when the contract ends (weekly countdown).
        if (typeof s.weeksLeft === "number" && s.weeksLeft > 0) { keptSponsors.push(s); continue; }
        const deadlineReached = s.objective && s.objectiveYear !== undefined &&
          ((newYear > s.objectiveYear) || (newYear === s.objectiveYear && newWeek >= s.objectiveWeek));
        if (!deadlineReached) { keptSponsors.push(s); continue; }
        const base = s.objectiveBaseline || {};
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
    } else {
      // Offres en cours de saison : une marque peut se manifester n'importe
      // quelle semaine (plus souvent après de bons résultats). L'offre reste
      // valable 4 semaines et peut remplacer un contrat existant.
      const nowAbs = newYear * 52 + newWeek;
      const pending = (p.sponsorOffers || []).filter(o => o.midSeason && o.expiresAbs > nowAbs);
      const perfBonus = getRecentPerfBonus(p.matchHistory);
      if (pending.length < 2 && (p.image ?? 60) >= 20 && random() < 0.08 + 0.06 * perfBonus) {
        const rankingNow = getPlayerRanking(totalAtpPoints(p.atpPointsLog), atpDb);
        const taken = [...(p.sponsors || []).map(s => s.brand), ...pending.map(o => o.brand)];
        const engagedCats = (p.sponsors || []).reduce((acc, s) => { acc[s.cat] = (acc[s.cat] || 0) + 1; return acc; }, {});
        const tierBoost = Math.max(0, sumStaffEffect(p.staff, "sponsorTierBoost"));
        const offer = generateSponsorOffer(rankingNow, perfBonus, taken, p.image, engagedCats, newYear, p.startDifficulty, null, tierBoost);
        if (offer) pending.push({ ...offer, week: newWeek, year: newYear, midSeason: true, expiresAbs: nowAbs + 4 });
      }
      p.sponsorOffers = pending;
    }
    } catch (err) {
      console.error("[week] sponsor phase error:", err);

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

        } else {
          const pen = Math.round(p.challenge.debt * 0.1);
          p.challenge.debt += pen;

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

        }
        if (newWeek === finals.week && raceRk <= 8) {
          const blocked = (p.injury && !p.injury.canPlay) || (p.restUntilAbsWeek && newYear * 52 + newWeek < p.restUntilAbsWeek);
          if (blocked) {

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

    }
    const tAfterSim = performance.now();
    console.log("[week] sim:", (tAfterSim - tSim).toFixed(1), "ms · articles:", articles.length);

    setAtpDb(newDb);
    // Convert tournament articles into journalist-style social posts (world feed)
    const tournamentPosts = (articles || []).map(a => {
      const author = pickRandom(SOCIAL_AUTHORS.journalists);
      // Use the article title as a tweet headline, body as continuation
      const content = a.title + (a.body ? " — " + firstSentence(a.body) : "");
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
      setNews(prev => [...limitPersonalPosts(allNewPosts, prev), ...prev]
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

        p.enrollment = null;
      }
    }

    // Auto-launch enrolled tournament if it's this week
    if (p.enrollment && p.enrollment.week === newWeek) {
      const t = ALL_TOURNAMENTS.find(x => x.id === p.enrollment.tournamentId);
      if (t) {
        // Preventive rest: no tournament
        if (p.restUntilAbsWeek && newYear * 52 + newWeek < p.restUntilAbsWeek) {

          p.money += t.entryFee || 0;
          p.enrollment = null;
          setPlayer(p);
          return;
        }
        // Injury too severe to play
        if (p.injury && !p.injury.canPlay) {

          p.enrollment = null;
          setPlayer(p);
          console.log("[week] total:", (performance.now() - tStart).toFixed(1), "ms");
          return;
        }
        if (p.location !== t.city) {

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
  // Énergie de base d'une séance : l'endurance réduit le coût, certains
  // coachs intensifs ajoutent un surcoût.
  const baseTrainingEnergy = (mod) => Math.round(mod.energyCost * Math.max(0.6, 1 - (player.stats.stamina - 50) / 100)) + staffTrainEnergyExtra(player.staff);
  // Forme du joueur pour les probabilités de réussite des programmes.
  const trainingOddsCtx = player ? { energy: player.energy, happiness: player.happiness ?? 70, staffTrainGain: Math.max(-0.3, sumStaffEffect(player.staff || [], "trainGain")) } : {};
  // Choix de la fiche d'entraînement (mini-jeu), puis la séance.
  const doTraining = (mod) => {
    const absNow = (player.year || 0) * 52 + (player.week || 0);
    if (player.restUntilAbsWeek && absNow < player.restUntilAbsWeek) {
      return;
    }
    if (player.money < mod.cost) { return; }
    if (player.energy < baseTrainingEnergy(mod) + 3) { return; }
    setCardPick(mod);
  };
  // outcome : résultat du programme tiré à l'écran des fiches
  // ({ success, gainMul, injury }) ; sans résultat, séance de routine réussie.
  const runTraining = (mod, cardId = "commune", outcome = null) => {
    const card = TRAINING_CARDS.find(c => c.id === cardId) || TRAINING_CARDS[0];
    {
      const absNow = (player.year || 0) * 52 + (player.week || 0);
      if (player.restUntilAbsWeek && absNow < player.restUntilAbsWeek) {
        return;
      }
    }
    if (player.money < mod.cost) { return; }
    // Stamina reduces energy cost: stat 50 → full cost, stat 90 → 60% cost
    const staminaReduction = Math.max(0.6, 1 - (player.stats.stamina - 50) / 100);
    // Staff malus: coachs intensifs (Carlos Vives, etc.) ajoutent un surcoût d'énergie
    // (trainEnergyCost is stored as a malus, so sumStaffEffect returns it negative.)
    const extraEnergyFromStaff = staffTrainEnergyExtra(player.staff);
    // Même énergie quel que soit le programme choisi.
    const actualEnergyCost = Math.round(mod.energyCost * staminaReduction) + extraEnergyFromStaff;
    if (player.energy < actualEnergyCost + 3) { return; }
    const cardGainMul = outcome ? outcome.gainMul : card.successMul;

    // Gain exact affiché sur la fiche du programme (raté = 0).
    const gain = parseFloat((trainingBaseGain(player, mod) * cardGainMul).toFixed(2));
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

    setPlayer(p => ({
      ...p, stats: newStats,
      money: p.money - mod.cost,
      totalSpent: (p.totalSpent || 0) + mod.cost,
      trainCount: (p.trainCount || 0) + 1,
      energy: Math.max(0, p.energy - actualEnergyCost),
      injury: updatedInjury,
    }));
    const failed = outcome && !outcome.success;
    if (aggravated) {

    } else if (failed) {

    } else if (player.injury && player.injury.weeksRemaining > 0) {

    } else if (gain < 0.05) {

    } else {

    }
  };

  const doLifeActivity = (act) => {
    if (player.money < act.cost) { return; }
    if (act.energyCost > 0 && player.energy < act.energyCost + 2) { return; }
    const absWeek = (player.year || 0) * 52 + (player.week || 0);
    // Cooldown check
    const lastUsed = (player.activityCooldowns || {})[act.id];
    if (lastUsed !== undefined) {
      const since = absWeek - lastUsed;
      const remaining = (act.cooldown || 0) - since;
      if (remaining > 0) {

        return;
      }
    }
    // Weekly limit: max 2 activities per week (reset on new week)
    const currentWeekKey = player.lifeActivitiesWeekKey || 0;
    const countThisWeek = currentWeekKey === absWeek ? (player.lifeActivitiesThisWeek || 0) : 0;
    if (countThisWeek >= 2) {

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
  };

  const resolveLifeEvent = (option) => {
    // Uncertain options: roll one outcome and merge its effects.
    let e = { ...(option.effects || {}) };
    if (option.outcomes && option.outcomes.length > 0) {
      let r = random();
      let picked = option.outcomes[option.outcomes.length - 1];
      for (const o of option.outcomes) { if (r < o.chance) { picked = o; break; } r -= o.chance; }
      for (const [k, v] of Object.entries(picked.effects || {})) e[k] = (e[k] || 0) + v;
    }
    // Light training gain on one random stat (diminishing returns + age apply).
    let statGainApplied = null;
    if (option.statGain) {
      const keys = ["serve", "forehand", "backhand", "stamina", "mental", "net"];
      const k = keys[Math.floor(random() * keys.length)];
      const cur = player.stats[k];
      const g = parseFloat((option.statGain * styledProgressionMultiplier(player.styleId, k, cur) * ageTrainingMultiplier(player.age)).toFixed(2));
      statGainApplied = { k, g };
    }
    const absNow = (player.year || 0) * 52 + (player.week || 0);
    const invest = option.investment
      ? { amount: option.investment.amount, plan: option.investment.plan, dueAbsWeek: absNow + option.investment.weeks }
      : null;
    const restUntil = option.restWeeks ? absNow + option.restWeeks : null;
    let newInjury = null;
    if (option.injuryRisk && random() < option.injuryRisk * injuryRiskMul(player)) {
      newInjury = rollInjury();

    }
    const boost = option.trainBoost;
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
    if (t.tier === "Finals") { return; }
    if (player.restUntilAbsWeek && tournamentAbsWeek(t, player) < player.restUntilAbsWeek) {

      return;
    }
    // Block if injured and cannot play
    if (player.injury && !player.injury.canPlay) {

      return;
    }
    // Block if already played any tournament this week (one tournament per week max)
    if (t.week === player.week && (player.playedThisWeek || []).length > 0) {
      if ((player.playedThisWeek || []).includes(t.id)) {

      } else {

      }
      return;
    }
    const ptsTotal = totalAtpPoints(player.atpPointsLog);
    const ranking = getPlayerRanking(ptsTotal, atpDb);
    const entry = getEntryStatus(t, ranking);
    if (entry.status === "blocked") { return; }
    if (t.week === player.week && player.location !== t.city) {

      return;
    }
    if (player.money < t.entryFee) { return; }

    const entryStatus = entry.protected ? "protected" : entry.status;
    setPlayer(p => ({
      ...p, money: p.money - t.entryFee,
      totalSpent: (p.totalSpent || 0) + t.entryFee,
      enrollment: { tournamentId: t.id, week: t.week, year: t.week >= player.week ? player.year : player.year + 1, entryStatus },
      ...(entry.protected ? { challenge: { ...p.challenge, protectedUses: Math.max(0, (p.challenge.protectedUses || 0) - 1) } } : {}),
    }));
    if (t.week === player.week) {
      setTimeout(() => launchTournament(t, { ...player, money: player.money - t.entryFee, enrollment: { tournamentId: t.id, week: t.week, year: player.year, entryStatus } }, atpDb), 50);
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
    matchData.tactics = normalizeTactics(p.tactics);

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
    // Point décisif : une fois sur deux, l'avantage du joueur se joue en mini-jeu.
    const allowMiniGame = !m.pendingGame && !m.matchFixThrown && random() < 0.5;
    const result = advanceMatchOneGame(m, getEffectiveStats(player, { tournamentCity: ms.tournament?.city, opponentCountry: ms.opponent?.nat?.country, surface: ms.tournament?.surface }), ms.opponent.stats, { allowMiniGame, allowTiebreakMental: !m.pendingGame && !m.matchFixThrown });
    const pendingMini = !!result.pending;
    // Apply staff energy-drain reduction (e.g. fitness coach).
    const drainCut = Math.max(0, sumStaffEffect(player.staff, "energyDrainCut"));
    if (drainCut > 0) {
      const drain = energyBefore - m.playerEnergy;
      if (drain > 0) m.playerEnergy = Math.min(100, m.playerEnergy + drain * drainCut);
    }

    // Petit risque de blessure à chaque jeu, plus fort en fin de réservoir.
    let injuryText = null;
    if (!pendingMini && !m.matchComplete
      && random() < GAME_INJURY_RISK * (m.playerEnergy < 30 ? 3 : 1) * injuryRiskMul(player)) {
      injuryText = "Coup dur : " + inflictMatchInjury(m);
    }

    // Build commentary
    const vars = {
      p: rankingName(player.name),
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
    // Contexte lu par les commentaires : points du jeu, jeux du set, score en sets.
    const gameCtx = { ...result, log: m.sets[m.sets.length - 1].gameLog, setNo: m.sets.length, pSets: m.pSets, oSets: m.oSets, bo5: !!m.isGrandSlam, matchComplete: !!m.matchComplete };
    const gameEvent = { id: Date.now() + random(), type: result.gameType, text: pickComment(commentKey, vars, gameCtx), points: result.points || null, isTiebreak: !!result.isTiebreak, score: { ...result.score, isPlayerServing: result.isPlayerServing, tiebreak: m.sets[m.sets.length - 1].tiebreak } };
    // A game that closes a set is NOT commented on its own: the set comment
    // below says how the set was closed (hold, break, tie-break) instead.
    if (!result.setComplete && !pendingMini) newEvents.push(gameEvent);
    if (injuryText) newEvents.push({ id: Date.now() + random() + 5, type: "injury", text: injuryText });

    if (result.setComplete) {
      const winnerSets = result.setWonByPlayer ? m.pSets : m.oSets;
      const loserSets = result.setWonByPlayer ? m.oSets : m.pSets;
      const setVars = {
        p: rankingName(player.name), o: ms.opponent.name,
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
      setVars.how = setCloseHow(result, setVars.p, setVars.o, gameCtx.log);
      newEvents.push({ ...gameEvent, id: Date.now() + random() + 1, type: result.setWonByPlayer ? "set_won" : "set_lost", matchEnd: !!m.matchComplete, text: pickComment(setType, setVars, gameCtx) });
    }

    if (!pendingMini && random() < 0.05 && !result.setComplete) {
      const eventTypes = ["crowd_cheer", "challenge", "ambiance", "bench"];
      const type = eventTypes[Math.floor(random() * eventTypes.length)];
      newEvents.push({ id: Date.now() + random() + 2, type: "event", text: pickComment(type, vars) });
    }

    // Decide if dilemma should appear
    const totalGamesPlayed = m.sets.reduce((a, s) => a + s.gameLog.length, 0);

    // Forme du jour : allusion discrète après quelques jeux si elle est marquée.
    if (!pendingMini && !m.formNoted && totalGamesPlayed >= 3 && !m.matchComplete) {
      m.formNoted = true;
      const lines = formRemarks(m.playerForm || 0, m.oppForm || 0, rankingName(player.name), ms.opponent.name);
      lines.forEach((text, i) => newEvents.push({ id: Date.now() + random() + 3 + i, type: "event", text }));
    }
    let pendingDilemma = null;
    // Match-fixing: only pops on the pre-scheduled game (one roll per match).
    const fixDue = ms.scheduledFixGame != null
      && totalGamesPlayed === ms.scheduledFixGame
      && !ms.fixOffered && !ms.pendingDilemma && !pendingMini
      && !m.matchComplete && !result.setComplete;
    let fixOffered = ms.fixOffered || false;
    if (pendingMini) {
      // Avantage joueur : le point se joue en mini-jeu (gagné = jeu, perdu = égalité).
      // Tie-break : balle de set jouée au mental ; sinon duel ou smash.
      pendingDilemma = { id: "minigame", minigame: result.isTiebreak ? "mental" : pickMatchMiniGame(result.isPlayerServing !== false), title: "Point décisif", desc: "" };
    } else if (fixDue) {
      pendingDilemma = MATCH_FIX_DILEMMA;
      fixOffered = true;
    }

    const committedState = {
      ...ms,
      matchData: m,
      eventLog: [...newEvents.reverse(), ...ms.eventLog].slice(0, 80),
      pendingDilemma,
      fixOffered,
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
      const serveTxt = result.isPlayerServing ? rankingName(player.name) + " au service" : ms.opponent.name + " au service";
      contextLabel = "Set " + setNum + " · " + serveTxt;
    }

    const allPoints = result.points && result.points.length ? result.points : [{ winner: result.gameType && /won|break|hold|rebreak/.test(result.gameType) ? "p" : "o", kind: "winner", rallies: 3, label: "JEU", servingPlayer: !!result.isPlayerServing }];
    // Jeu repris après un mini-jeu : on n'anime que les points restants.
    // (le point du mini-jeu est déjà affiché : JEU ou ÉGALITÉ).
    const points = result.resumeFrom ? allPoints.slice(result.resumeFrom + 1) : allPoints;
    const resumeLabel = result.resumeFrom ? allPoints[result.resumeFrom] : null;

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
      // Le plan de jeu a pu être changé pendant l'animation du jeu (pause
      // tactique) : on garde le réglage le plus récent au lieu de celui
      // capturé au début du jeu.
      setMatchState(prev => (prev && prev.matchData && prev.matchData.tactics
        ? { ...committedState, matchData: { ...committedState.matchData, tactics: prev.matchData.tactics } }
        : committedState));
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
      }, (result.resumeFrom ? 2400 : result.setComplete ? 1300 : 650) * speedFactor()); // pause plus longue entre les sets, et après un point décisif pour se remettre dans le match
    };
    const commitAndMaybeContinue = () => { commitNow(); scheduleAuto(); };
    pendingCommitRef.current = commitAndMaybeContinue;
    const startSplit = resumeLabel ? splitLabel(resumeLabel.label, resumeLabel.winner, "40", "40") : { p: "0", o: "0" };
    setLivePoint({ ...startSplit, server: serverAt(0) });
    let step = 0;
    let prevP = startSplit.p, prevO = startSplit.o;
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
  // Blessure en plein match (m est modifié) : le staff médical peut l'éviter,
  // l'option « Corps fragile » double le risque en amont. Renvoie le message.
  const inflictMatchInjury = (m) => {
    const protect = Math.max(0, sumStaffEffect(player.staff, "injuryProtect"));
    if (protect > 0 && random() < protect) {
      m.persistEnergyDrainGames = 20;
      m.persistentDebuff = Math.max(m.persistentDebuff || 0, 2);
      return "Alerte physique, mais votre staff médical limite les dégâts.";
    }
    m.persistEnergyDrainGames = 99;
    m.persistentDebuff = Math.max(m.persistentDebuff || 0, 5);
    const inj = rollInjury();
    setPlayer(p => {
      if (p.injury && p.injury.weeksRemaining > inj.weeksRemaining) return p;
      // Le diagnostic (durée d'indisponibilité) tombe après le tournoi.
      return { ...p, injury: inj, injuryNoticePending: true };
    });
    return inj.label + " ! " + rankingName(player.name) + " est gêné pour la suite du match.";
  };
  // Risque de blessure : smash raté 5 %, et un petit risque à chaque jeu,
  // triplé quand l'énergie passe sous 30.
  const SMASH_INJURY_RISK = 0.05;
  const GAME_INJURY_RISK = 0.0005;

  // Fin d'un mini-jeu de match : l'élan bouge, le résultat entre dans le fil.
  const resolveMiniGame = (kind, win, text, zone, label) => {
    setMatchState(ms => {
      if (!ms) return ms;
      const m = { ...ms.matchData };
      // Élan symétrique : le vainqueur du mini-jeu prend l'élan (joueur ou adversaire).
      const swing = miniGameEffect(true).momentumDelta;
      if (win) m.playerMomentum = clampMomentum((m.playerMomentum || 0) + swing);
      else m.oppMomentum = clampMomentum((m.oppMomentum || 0) + swing);
      if (kind === "serve_duel" && zone !== null && zone !== undefined) m.serveZones = [...(m.serveZones || []), zone].slice(-8);
      // Le jeu interrompu reprend : gagné → jeu pour le joueur, perdu → égalité.
      if (m.pendingGame) m.pendingGame = { ...m.pendingGame, miniGameWon: !!win };
      const title = kind === "serve_duel" ? "Duel au service" : kind === "return_duel" ? "Duel au retour" : kind === "mental" ? "Sang-froid" : "Smash";
      const outcome = kind === "mental" ? (win ? " Point gagné !" : " Point perdu.") : (win ? " Jeu !" : " Retour à égalité.");
      const evts = [{ id: Date.now() + random(), type: "dilemma", title, choice: zone !== null && zone !== undefined ? ZONES[zone] : (label || (win ? "Réussi" : "Raté")), text: text + outcome }];
      // Smash raté : réception difficile, petit risque de blessure.
      if (kind === "smash" && !win && random() < SMASH_INJURY_RISK * injuryRiskMul(player)) {
        evts.unshift({ id: Date.now() + random() + 1, type: "injury", text: "Mauvaise réception après le smash… " + inflictMatchInjury(m) });
      }
      return {
        ...ms,
        matchData: m,
        pendingDilemma: null,
        eventLog: [...evts, ...(ms.eventLog || [])].slice(0, 80),
      };
    });
    // Le score s'affiche tout de suite : jeu gagné, retour à égalité, ou
    // nouveau score du tie-break.
    const pgNow = matchState && matchState.matchData && matchState.matchData.pendingGame;
    if (pgNow && pgNow.isTiebreak) {
      setLivePoint(lp => ({ p: String(pgNow.pPts + (win ? 1 : 0)), o: String(pgNow.oPts + (win ? 0 : 1)), server: lp ? lp.server : true }));
    } else {
      setLivePoint(lp => ({ p: win ? "JEU" : "40", o: "40", server: lp ? lp.server : true }));
    }
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    // Jeu gagné : le tableau se met à jour aussitôt. Égalité : courte pause
    // pour se remettre dans le match, puis la fin du jeu se joue.
    autoTimerRef.current = setTimeout(() => {
      autoTimerRef.current = null;
      if (!matchPausedRef.current && playGameRef.current) playGameRef.current();
    }, (pgNow && pgNow.isTiebreak ? 1400 : win ? 250 : 1600) * speedFactor());
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
            ? "Vous touchez " + fmtMoney(bribe) + "... mais l'enquête vous rattrape : suspension de plusieurs semaines et réputation en miettes."
            : "Vous touchez " + fmtMoney(bribe) + " et levez discrètement le pied. Personne n'a rien vu... cette fois.";
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
        careerWinsTop100: (p.careerWinsTop100 || 0) + (won && (ms.opponentRank || 9999) <= 100 ? 1 : 0),
        careerWinsTop200: (p.careerWinsTop200 || 0) + (won && (ms.opponentRank || 9999) <= 200 ? 1 : 0),
        careerWinsTop400: (p.careerWinsTop400 || 0) + (won && (ms.opponentRank || 9999) <= 400 ? 1 : 0),
        // Récupération entre deux matchs du tournoi : 10 à 20 selon l'endurance.
        energy: Math.min(100, postMatchEnergy + betweenMatchRecovery(p.stats.stamina)),
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
      const debrief = pickDebrief(m, rankingName(player.name), ms.opponent.name, { roundIdx, qualifying: isQualifying, qualiRounds: fmt.qualiRounds, mainRounds: fmt.mainRounds, city: tourn.city, oppRank: ms.opponentRank });
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
        careerWinsTop100: (p.careerWinsTop100 || 0) + (won && (ms.opponentRank || 9999) <= 100 ? 1 : 0),
        careerWinsTop200: (p.careerWinsTop200 || 0) + (won && (ms.opponentRank || 9999) <= 200 ? 1 : 0),
        careerWinsTop400: (p.careerWinsTop400 || 0) + (won && (ms.opponentRank || 9999) <= 400 ? 1 : 0),
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
          { tid: tourn.id, name: tourn.name, week: p.week, year: p.year, prize: prizeEntitled, round: roundLabel, won },
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
            nat: { flag: player.nationalityFlag || CITIES[player.location]?.flag || "", country: player.nationality, code: "" },
          };
          const runnerUp = ms.opponent ? {
            name: ms.opponent.name,
            nat: ms.opponent.nat || { flag: "", country: "" },
          } : null;
          const article = generateTournamentArticle(tourn, playerWinner, runnerUp, [], [], fmtForArticle);
          // Convert into a journalist-style social post (world feed)
          const journoAuthor = pickRandom(SOCIAL_AUTHORS.journalists);
          const journoPost = {
            id: article.id,
            author: journoAuthor,
            content: article.title + (article.body ? " — " + firstSentence(article.body) : ""),
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
        setNews(prev => [...limitPersonalPosts([personalPost], prev), ...prev].slice(0, 300));
      }

      const debrief = pickDebrief(m, rankingName(player.name), ms.opponent.name, { roundIdx, qualifying: isQualifying, qualiRounds: fmt.qualiRounds, mainRounds: fmt.mainRounds, city: tourn.city, oppRank: ms.opponentRank });

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
    if (cityName === player.location) { return; }
    const cost = travelCostBetween(player.location, cityName);
    if (player.money < cost) { return; }
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

  };

  // ── HIRE / FIRE STAFF ────────────────────────────────────────────────────
  const hireStaff = (s) => {
    if (challengeActive("seul")) { return; }
    if (hasGameOption(player, "no_staff")) { return; }
    if (player.staff.find(st => st.role === s.role)) { return; }
    if (player.money < s.cost * 4) { return; }
    setPlayer(p => ({
      ...p, staff: [...p.staff, s],
      money: p.money - s.cost * 4,
      totalSpent: (p.totalSpent || 0) + s.cost * 4,
    }));

  };
  const fireStaff = (s) => {
    setPlayer(p => ({ ...p, staff: p.staff.filter(st => st.id !== s.id) }));

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
    const objective = lvl ? { type: lvl.type, target: lvl.target, label: lvl.label, level: lvl.level, ...(lvl.threshold ? { threshold: lvl.threshold } : {}) } : null;
    // Deadline = end of the contract, aligned on the negotiation phases
    // (weeks 26 / 52): 26-week contract → next phase, 52-week → the one after.
    const nextPhase = (w, y) => (w < 26 ? { w: 26, y } : w < 52 ? { w: 52, y } : { w: 26, y: y + 1 });
    let dl = nextPhase(p.week, p.year);
    if ((offer.durationWeeks || 26) >= 52) dl = nextPhase(dl.w, dl.y);
    // Offre signée en cours de saison : au moins 13 semaines pour l'objectif.
    if (offer.midSeason && (dl.y - p.year) * 52 + (dl.w - p.week) < 13) dl = nextPhase(dl.w, dl.y);
    const objectiveWeek = dl.w, objectiveYear = dl.y;
    const weeksToDeadline = (dl.y - p.year) * 52 + (dl.w - p.week);
    const baseline = sponsorObjectiveCounters(p);
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

  };
  // Replace an existing sponsor by accepting a new offer of the same category.
  // Pays the cancellation penalty, then signs the new contract atomically.
  const confirmSponsorReplacement = (sponsorToCancel) => {
    const offer = sponsorReplaceModal?.offer;
    if (!offer) return;
    const penalty = sponsorCancelCost(sponsorToCancel);
    if (player.money < penalty) {

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

    setSponsorReplaceModal(null);
  };
  // Offre reçue en cours de saison et pas encore ouverte : point
  // d'exclamation sur Bureau, Finances et la carte de l'offre.
  const hasNewSponsorOffer = (player?.sponsorOffers || []).some(o => o.midSeason && !o.seen);
  const markSponsorOfferSeen = (offer) => {
    if (offer.seen) return;
    setPlayer(p => ({ ...p, sponsorOffers: (p.sponsorOffers || []).map(o => (o.id === offer.id ? { ...o, seen: true } : o)) }));
  };
  const declineSponsorOffer = (offer) => {
    setPlayer(p => ({ ...p, sponsorOffers: (p.sponsorOffers || []).filter(o => o.id !== offer.id) }));

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

      return;
    }
    setPlayer(p => ({
      ...p,
      sponsors: (p.sponsors || []).filter(s => s.id !== sponsor.id),
      money: p.money - penalty,
      totalSpent: (p.totalSpent || 0) + penalty,
    }));

  };

  // ── WILDCARDS ─────────────────────────────────────────────────────────────
  const acceptWildcard = (offer) => {
    if (player.restUntilAbsWeek && (offer.tournamentYear * 52 + offer.tournamentWeek) < player.restUntilAbsWeek) {
      const left = Math.max(1, player.restUntilAbsWeek - ((player.year || 0) * 52 + (player.week || 0)));
      setWildcardBlocked({
        title: "Au repos !",
        lead: "Vous êtes au repos imposé encore " + left + " semaine" + (left > 1 ? "s" : "") + "…",
        body: elide("Le " + offer.tournamentName + " tombe pendant ce repos : impossible d'accepter la wildcard."),
      });
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

        return;
      }
    }
    if (player.enrollment) {
      // Déjà inscrit ailleurs : on explique qu'il faut d'abord se désinscrire.
      const enr = ALL_TOURNAMENTS.find(x => x.id === player.enrollment.tournamentId);
      setWildcardBlocked({
        title: "Déjà inscrit !",
        lead: "Vous êtes déjà inscrit " + (enr ? elide("au " + enr.name) : "à un autre tournoi") + (player.enrollment.week ? " (semaine " + player.enrollment.week + ")" : "") + "…",
        body: elide("Pour accepter la wildcard du " + offer.tournamentName) + ", annulez d'abord votre inscription à l'autre tournoi (sur l'accueil ou dans Circuit › Tournois), puis acceptez la wildcard.",
      });
      return;
    }
    if (player.injury && !player.injury.canPlay) {
      const w = player.injury.weeksRemaining;
      setWildcardBlocked({
        title: "Blessé !",
        lead: player.injury.label + " : vous ne pouvez pas jouer" + (w ? " (retour dans " + w + " sem.)" : "") + "…",
        body: elide("Impossible d'accepter la wildcard du " + offer.tournamentName) + " tant que la blessure vous empêche de disputer un tournoi.",
        injury: true,
      });
      return;
    }
    setPlayer(p => ({
      ...p,
      wildcardOffers: (p.wildcardOffers || []).filter(o => o.tournamentId !== offer.tournamentId || o.tournamentYear !== offer.tournamentYear),
      wildcardsUsed: [...(p.wildcardsUsed || []), { tournamentId: offer.tournamentId, week: offer.tournamentWeek, year: offer.tournamentYear }],
      enrollment: { tournamentId: offer.tournamentId, week: offer.tournamentWeek, year: offer.tournamentYear, entryStatus: "wildcard" },
    }));

  };
  const declineWildcard = (offer) => {
    setPlayer(p => ({
      ...p,
      wildcardOffers: (p.wildcardOffers || []).filter(o => o.tournamentId !== offer.tournamentId || o.tournamentYear !== offer.tournamentYear),
    }));

  };

  // ── VOLUNTARY RETIREMENT ──────────────────────────────────────────────────
  const retire = () => {
    if (!player) return;
    // Fenêtre de confirmation intégrée (window.confirm n'est pas au style BD
    // et peut être bloqué) : la retraite est lancée par doRetire.
    setConfirmRetire(true);
  };
  const doRetire = () => {
    setConfirmRetire(false);
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
  // État pressé des boutons de BD : l'ombre d'encre s'écrase, le bouton s'enfonce.
  const BD_PRESS_CSS = ".tm-bd-press { transition: transform 0.08s, box-shadow 0.08s; } .tm-bd-press:active:not(:disabled) { transform: translate(3px, 3px) !important; box-shadow: 1px 1px 0 #141414 !important; }";
  const deleteSaveDialog = confirmDelete !== null && (
    <div style={{
      position: "fixed", inset: 0, background: T.overlay,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, zIndex: 500,
    }} onClick={() => setConfirmDelete(null)}>
      <style>{BD_PRESS_CSS}</style>
      <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "6px 6px 0 " + T.ink, maxWidth: 340, width: "100%" }}>
        <div aria-hidden="true" style={{ height: 10, background: "repeating-linear-gradient(-45deg, #e0a21b 0 10px, #141414 10px 20px)", borderBottom: "3px solid " + T.ink }} />
        <div className="tm-display" style={{ background: "#c4302b", backgroundImage: "radial-gradient(rgba(20,20,20,0.22) 1.3px, transparent 1.5px)", backgroundSize: "6px 6px", color: "#ffffff", fontSize: 18, padding: "8px 12px", borderBottom: "3px solid " + T.ink, display: "flex", alignItems: "center", gap: 10, textShadow: "1px 1px 0 " + T.ink }}>
          <span style={{ width: 32, height: 32, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, transform: "rotate(-4deg)" }}>
            <Icon name="trash" size={20} />
          </span>
          Effacer la carrière ?
        </div>
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="tm-lettering" style={{ fontSize: 18, lineHeight: 1.25, transform: "rotate(-0.5deg)" }}>
            {slotMetas[confirmDelete]?.name ? "La carrière de " + slotMetas[confirmDelete].name + " va disparaître…" : "Cette carrière va disparaître…"}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.45, borderTop: "2px dashed " + T.ink, paddingTop: 10 }}>
            Son classement, vos titres et votre argent seront définitivement supprimés. <strong style={{ color: "#c4302b" }}>Aucun retour en arrière ne sera possible.</strong>
          </div>
          <button className="tm-bd-press" style={{ ...styles.btnPrimary, background: "#c4302b", fontSize: 17, textShadow: "1px 1px 0 " + T.ink, marginBottom: 0 }} onClick={doDeleteSave}>Oui, tout effacer</button>
          <button className="tm-bd-press tm-display" style={{ ...styles.btnSecondary, background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, fontFamily: T.display, fontWeight: 400, fontSize: 15 }} onClick={() => setConfirmDelete(null)}>Annuler</button>
        </div>
      </div>
    </div>
  );

  if (screen === "records") return <RecordsScreen onBack={() => setScreen("menu")} />;
  if (screen === "customize") return <CustomizeScreen onBack={() => setScreen("menu")} />;

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
    </>
  );
  if (screen === "menu" && menuShop) return (
    <div style={styles.root}>
      <div style={{ padding: "16px 16px 0" }}>
        <button style={{ ...styles.btnSmall, display: "flex", alignItems: "center", gap: 6 }} onClick={() => { setMenuShop(false); refreshSlots(); }}>
          <Icon name="arrowLeft" size={14} /> Menu principal
        </button>
      </div>
      <ShopScreen />
    </div>
  );

  if (screen === "menu") return (
    <div style={styles.root}>
      {deleteSaveDialog}
      <div style={styles.menuBg} className="tm-grain">
        <WindowShades />
        <div style={styles.menuCard}>
          <div style={{ position: "relative", zIndex: 2, width: "100%", textAlign: "center" }}>
            {/* Balle de tennis dessinée à l'encre */}
            <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true" style={{ display: "block", margin: "4px auto 14px", transform: "rotate(-12deg)" }}>
              <circle cx="36" cy="36" r="31" fill="#d6ef3c" stroke="#161616" strokeWidth="4" />
              <path d="M12 16 Q30 36 12 58 M60 16 Q42 36 60 58" fill="none" stroke="#161616" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M22 10 Q28 8 32 9" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <h1 style={styles.menuTitle}>Courtside</h1>
            <div className="tm-lettering" style={{ display: "inline-block", margin: "16px 0 14px", background: T.gold, color: "#161616", border: "2.5px solid " + T.ink, padding: "2px 10px", fontSize: 16 }}>La gazette de votre carrière</div>
            <p style={styles.menuTagline}>Entraînez-vous, voyagez, signez vos sponsors et grimpez au classement, semaine après semaine.</p>
            {[0, 1, 2].map(i => {
              const meta = slotMetas[i];
              const locked = i > 0 && !multiOwned;
              if (meta) {
                return (
                  <div key={i} style={{ background: T.bg1, border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, padding: 12, marginBottom: 12, textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div className="tm-display" style={{ background: T.ink, color: "#d6ef3c", fontSize: 13, width: 22, height: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-4deg)" }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="tm-display" style={{ color: T.fg, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {meta.flag && <FlagFromEmoji emoji={meta.flag} size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />}{meta.name}
                        </div>
                        <div style={{ color: T.fg, fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                          {meta.circuit === "wta" ? "WTA" : "ATP"} · {meta.rank && meta.rank <= 1200 ? "N°" + meta.rank : (meta.circuit === "wta" ? "Non classée" : "Non classé")} · Sem. {meta.week} · {meta.year}
                        </div>
                      </div>
                      <button
                        style={{ background: "#ffffff", border: "2px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, padding: 5, cursor: "pointer", color: "#c4302b", display: "flex", flexShrink: 0 }}
                        onClick={() => deleteSave(i)} title="Effacer cette carrière"
                      ><Icon name="trash" size={16} color="#c4302b" /></button>
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
                    setAvatarInput(a => a.female ? { ...a, female: false, hairStyle: "court" } : a);
                    setScreen("create");
                  }}
                >
                  <span className="tm-display" style={{ background: locked ? "#ebe8da" : T.ink, color: locked ? "#141414" : "#d6ef3c", border: locked ? "2px solid " + T.ink : "none", boxSizing: "border-box", fontSize: 13, width: 22, height: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-4deg)" }}>{i + 1}</span>
                  <span style={{ flex: 1 }}>{locked ? "Emplacement verrouillé" : "Nouvelle carrière"}</span>
                  <Icon name={locked ? "lock" : "plus"} size={16} color={locked ? T.amber : T.green} />
                </button>
              );
            })}
            <button style={{
              ...styles.btnPrimary, marginTop: 6, marginBottom: 3,
              background: T.cyan,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }} onClick={() => setScreen("challenges")}>
              <Icon name="target" size={16} color={T.onAccent} /> Défis
              {challengeMeta && <span style={{ fontSize: 12, fontWeight: 500 }}>· en cours</span>}
              {!hasPurchased("dlc_challenges") && <Icon name="lock" size={13} color={T.onAccent} />}
            </button>
            <button style={{ ...styles.btnSecondary, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setScreen("records")}>
              <Icon name="trophy" size={16} color={T.amber} /> Records
            </button>
            <button style={{ ...styles.btnSecondary, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => (hasPurchased("custom_mode") ? setScreen("customize") : setMenuShop(true))}>
              <Icon name="edit" size={16} color={T.amber} /> Personnalisation
              {!hasPurchased("custom_mode") && <Icon name="lock" size={13} color={T.fg} />}
            </button>
            <button style={{ ...styles.btnSecondary, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setMenuShop(true)}>
              <Icon name="bag" size={16} color={T.amber} /> Boutique
            </button>
            <p style={{ display: "inline-block", background: "#ffffff", color: "#141414", border: "2px solid " + T.ink, fontSize: 11, marginTop: 22, marginBottom: 0, padding: "0 6px", fontWeight: 800 }}>v3.0</p>
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
          ? (a.female ? a : { ...a, female: true, hairStyle: "queue" })
          : (a.female ? { ...a, female: false, hairStyle: "court" } : a));
        setRosterInput(-1);
        setCreateStep(-2); // choix de la base de joueurs
      };
      return (
        <div style={styles.root}>
          <div style={styles.menuBg}>
          <WindowShades />
            <div style={{ ...styles.menuCard, gap: 14, alignItems: "stretch", maxWidth: 380 }}>
              <h2 className="tm-display" style={{ alignSelf: "center", background: T.ink, color: "#d6ef3c", fontSize: 21, fontWeight: 400, lineHeight: 1.1, margin: "0 0 2px", padding: "5px 14px", textAlign: "center", transform: "rotate(-1.5deg)", boxShadow: "3px 3px 0 #c9b6ea" }}>Quel circuit ?</h2>
              <div className="tm-lettering" style={{ color: T.fg, fontSize: 16, textAlign: "center", lineHeight: 1.25 }}>
                Choisissez le circuit de votre carrière.
              </div>
              {[
                { id: "atp", label: "Circuit masculin", sub: "Carrière d'un joueur", accent: "#1f7a45", sample: { female: false, hairStyle: "court", accessory: "bandeau", shirt: "#1f7a45" } },
                { id: "wta", label: "Circuit féminin", sub: "Carrière d'une joueuse", accent: "#5b2d8e", sample: { female: true, hairStyle: "queue", accessory: "visiere", shirt: "#5b2d8e" } },
              ].map(c => {
                return (
                  <button key={c.id} data-nofem="" onClick={() => pick(c.id)} style={{
                    display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
                    background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, borderLeft: "10px solid " + c.accent, boxShadow: "4px 4px 0 " + T.ink, borderRadius: 0,
                    padding: 14, cursor: "pointer", fontFamily: T.body,
                  }}>
                    <Avatar config={{ ...avatarInput, ...c.sample }} size={64} />
                    <span style={{ flex: 1 }}>
                      <span className="tm-display" style={{ display: "flex", alignItems: "center", gap: 6, color: c.accent, fontSize: 18, lineHeight: 1.05 }}>
                        {c.label}
                      </span>
                      <span className="tm-lettering" style={{ display: "block", color: "#141414", fontSize: 15, marginTop: 3 }}>{c.sub}</span>
                    </span>
                    <Icon name="chevronRight" size={20} color="#141414" strokeWidth={3} />
                  </button>
                );
              })}
              <button style={styles.btnSecondary} onClick={() => { setCircuit("atp"); setScreen("menu"); }}>Retour</button>
            </div>
          </div>
        </div>
      );
    }

    // ÉTAPE : BASE DE JOUEURS (Standard ou configuration personnalisée)
    if (createStep === -2) {
      const owned = hasPurchased("custom_mode");
      const cfgs = loadRosterConfigs();
      const options = [{ id: -1, name: "Standard", sub: "Les joueurs du jeu, tirés au hasard à chaque carrière" },
        ...cfgs.map((c, i) => ({ id: i, name: c.name, sub: rosterEditCount(c) + " joueur" + (rosterEditCount(c) > 1 ? "s" : "") + " personnalisé" + (rosterEditCount(c) > 1 ? "s" : "") }))];
      return (
        <div style={styles.root}>
          <div style={styles.menuBg}>
            <WindowShades />
            <div style={{ ...styles.menuCard, gap: 12, alignItems: "stretch", maxWidth: 380 }}>
              <h2 className="tm-display" style={{ alignSelf: "center", background: T.ink, color: "#d6ef3c", fontSize: 21, fontWeight: 400, lineHeight: 1.1, margin: "0 0 2px", padding: "5px 14px", textAlign: "center", transform: "rotate(-1.5deg)", boxShadow: "3px 3px 0 #c9b6ea" }}>Base de joueurs</h2>
              <div className="tm-lettering" style={{ color: T.fg, fontSize: 16, textAlign: "center", lineHeight: 1.25 }}>Avec quels joueurs voulez-vous jouer cette carrière ?</div>
              {options.map(o => {
                const locked = o.id >= 0 && !owned;
                const on = rosterInput === o.id;
                return (
                  <button key={o.id} disabled={locked} onClick={() => setRosterInput(o.id)} style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: locked ? "default" : "pointer",
                    background: on ? T.gold : locked ? "#ebe8da" : "#ffffff", color: "#141414", border: "2.5px solid " + T.ink, boxShadow: on ? "4px 4px 0 " + T.ink : locked ? "none" : "2px 2px 0 " + T.ink,
                    padding: "10px 12px", fontFamily: T.body, opacity: locked ? 0.7 : 1,
                  }}>
                    <Icon name={o.id < 0 ? "users" : "edit"} size={18} color="#141414" />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="tm-display" style={{ display: "block", fontSize: 15 }}>{o.name}</span>
                      <span style={{ display: "block", fontSize: 11.5, fontWeight: 600 }}>{o.sub}</span>
                    </span>
                    {locked && <Icon name="lock" size={15} color="#141414" />}
                  </button>
                );
              })}
              {!owned && (
                <div className="tm-lettering" style={{ fontSize: 14.5, color: "#141414", background: "#d6ef3c", border: "2px solid " + T.ink, padding: "4px 8px", lineHeight: 1.25, textAlign: "center", transform: "rotate(-0.6deg)" }}>Les bases personnalisées s'ouvrent avec le mode Personnalisation (boutique).</div>
              )}
              <button style={styles.btnPrimary} onClick={() => setCreateStep(0)}>Suivant</button>
              <button style={styles.btnSecondary} onClick={() => setCreateStep(-1)}>Retour</button>
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
          <WindowShades />
            <div style={{ ...styles.menuCard, gap: 14, alignItems: "stretch", maxWidth: 380 }}>
              <h2 className="tm-display" style={{ alignSelf: "center", background: T.ink, color: "#d6ef3c", fontSize: 21, fontWeight: 400, lineHeight: 1.1, margin: "0 0 2px", padding: "5px 14px", textAlign: "center", transform: "rotate(-1.5deg)", boxShadow: "3px 3px 0 #c9b6ea" }}>Étape 1/3 · Identité</h2>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Nom du joueur</label>
                <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                  <input style={{ ...styles.input, flex: 1, minWidth: 0 }} placeholder={circuitInput === "wta" ? "Ex: Léa Martin" : "Ex: Thomas Martin"} value={nameInput} onChange={e => setNameInput(e.target.value)} />
                  <button
                    type="button"
                    title="Nom au hasard"
                    onClick={() => setNameInput(randomFullName(nationalityInput, circuitInput === "wta"))}
                    style={{
                      flexShrink: 0, width: 46, borderRadius: 0, cursor: "pointer",
                      background: "#d6ef3c", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Icon name="dice" size={20} color="#141414" />
                  </button>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Nationalité</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 30, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                    {nationalityInput
                      ? <FlagFromEmoji emoji={(Object.values(CITIES).find(c => c.country === nationalityInput) || {}).flag} size={16} />
                      : <Icon name="flag" size={16} color="#141414" />}
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
                <div className="tm-lettering" style={{ color: T.fg, fontSize: 14, marginTop: 6 }}>
                  Elle compte pour jouer à domicile.
                </div>
              </div>

              <div>
                <label style={styles.label}>Avatar</label>
                <div style={{
                  background: "#ffffff", borderRadius: 0, padding: 14,
                  border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink,
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

    // ÉTAPE 2 (createStep 1) : profil — style, surface, stats de départ.
    // ÉTAPE 3 (createStep 2) : départ — ville, difficulté, options, récap.
    return (
      <div style={styles.root}>
        <div style={styles.menuBg}>
          <WindowShades />
          <div style={{ ...styles.menuCard, gap: 16, alignItems: "stretch", maxWidth: 380 }}>
            <h2 className="tm-display" style={{ alignSelf: "center", background: T.ink, color: "#d6ef3c", fontSize: 21, fontWeight: 400, lineHeight: 1.1, margin: "0 0 2px", padding: "5px 14px", textAlign: "center", transform: "rotate(-1.5deg)", boxShadow: "3px 3px 0 #c9b6ea" }}>{createStep === 1 ? "Étape 2/3 · Profil" : "Étape 3/3 · Départ"}</h2>
            <div style={{
              background: "#ffffff", borderRadius: 0, padding: "10px 12px",
              border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink,
              fontSize: 11.5, color: T.fg, lineHeight: 1.5,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Avatar config={avatarInput} size={40} />
              <div style={{ minWidth: 0 }}>
                <div className="tm-display" style={{ color: T.fg, fontSize: 22, lineHeight: 1.1, overflowWrap: "anywhere" }}>{nameInput}</div>
              </div>
            </div>

            {createStep === 1 && (<>
            <div>
              <label style={styles.label}>Style de jeu</label>
              <div style={styles.styleGrid}>
                {Object.values(PLAYER_STYLES).map(s => (
                  <button key={s.id} style={{ ...styles.styleBtn, ...(styleInput === s.id ? styles.styleBtnActive : {}) }} onClick={() => setStyleInput(s.id)}>
                    <Icon name={s.iconName} size={24} color={styleInput === s.id ? "#1f7a45" : "#141414"} />
                    <div style={{ fontWeight: 800, fontSize: 12, marginTop: 4 }}>{s.name}</div>
                  </button>
                ))}
              </div>
              <div className="tm-lettering" style={{ color: T.fg, fontSize: 15, lineHeight: 1.2, marginTop: 10, textAlign: "center", minHeight: 30 }}>{selectedStyle.desc}</div>
            </div>

            <div>
              <label style={styles.label}>Surface de prédilection</label>
              <div style={{ color: T.fg, fontSize: 12, fontWeight: 600, marginTop: -2, marginBottom: 8 }}>
                +{SURFACE_BONUS} à toutes vos stats en match sur cette surface.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
                {SURFACES.map(sf => (
                  <button key={sf} onClick={() => setSurfaceInput(sf)} style={{
                    ...styles.styleBtn, ...(surfaceInput === sf ? styles.styleBtnActive : {}),
                    padding: "10px 4px", gap: 4, minHeight: 64,
                  }}>
                    <SurfaceIcon name={sf} />
                    <div style={{ fontWeight: 800, fontSize: 11, textAlign: "center", lineHeight: 1.1 }}>{sf}</div>
                  </button>
                ))}
              </div>
            </div>

            </>)}

            {createStep === 2 && (<>
            <div>
              <label style={styles.label}>Ville de départ</label>
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
                          <div style={{ fontSize: 10, color: "#141414", marginTop: 2, fontWeight: 700 }}>{info?.country}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10.5, color: "#141414", fontWeight: 600, textAlign: "left", lineHeight: 1.3 }}>{desc}</div>
                      <div className="tm-num" style={{ fontSize: 11, color: "#ffffff", background: "#1f7a45", border: "2px solid " + T.ink, padding: "0 5px", fontWeight: 800 }}>{fmtMoney(money)} au départ</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={styles.label}>Difficulté</label>
              <div style={{ color: T.fg, fontSize: 12, fontWeight: 600, marginTop: -2, marginBottom: 8 }}>
                Elle multiplie votre score de carrière.
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
                      <div className="tm-display tm-num" style={{ fontSize: 12.5, color: isActive ? "#141414" : "#5b2d8e" }}>{formatMultiplier(d.scoreMul)}</div>
                    </button>
                  );
                })}
              </div>
              <div className="tm-lettering" style={{ color: T.fg, fontSize: 15, lineHeight: 1.2, marginTop: 10, textAlign: "center", minHeight: 30 }}>
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
                      background: on ? "#d6ef3c" : "#ffffff", color: "#141414", borderRadius: 0, cursor: "pointer",
                      border: "2.5px solid " + T.ink, boxShadow: on ? "3px 3px 0 " + T.ink : "none",
                    }}>
                      <input type="checkbox" checked={on} onChange={() => setGameOptionsInput(list => on ? list.filter(x => x !== o.id) : [...list, o.id])} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="tm-display" style={{ display: "block", fontSize: 13, color: "#141414" }}>{o.name}</span>
                        <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#141414" }}>{o.desc}</span>
                      </span>
                      <span className="tm-display tm-num" style={{ fontSize: 12, color: "#ffffff", background: "#1f7a45", border: "2px solid " + T.ink, padding: "0 5px", flexShrink: 0, whiteSpace: "nowrap" }}>+{Math.round(o.bonus * 100)} %</span>
                    </label>
                  );
                })}
              </div>
              <div className="tm-halftone-lilac" style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 12px", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink }}>
                <span className="tm-display" style={{ fontSize: 13, color: "#141414" }}>Multiplicateur de score</span>
                <span className="tm-display tm-num" style={{ fontSize: 20, color: "#141414", background: "#d6ef3c", border: "2.5px solid " + T.ink, padding: "0 8px", transform: "rotate(3deg)" }}>{formatMultiplier(scoreMultiplier(difficultyInput, gameOptionsInput))}</span>
              </div>
            </div>

            </>)}

            {createStep === 1 && (
            <div style={styles.statPreview}>
              <p className="tm-lettering" style={{ color: T.fg, fontSize: 14, margin: "0 0 8px" }}>Stats de départ (variation aléatoire à chaque partie)</p>
              {Object.entries({ serve: "Service", forehand: "Coup droit", backhand: "Revers", stamina: "Endurance", mental: "Mental", net: "Filet" }).map(([k, label]) => {
                const v = selectedStyle.base[k] + START_STAT_BONUS - 1;
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 90, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.3, color: T.fg }}>{label}</div>
                    <div style={{ flex: 1, height: 11, background: "#ffffff", border: "2px solid " + T.ink, borderRadius: 0, overflow: "hidden" }}>
                      <div style={{ width: v + "%", height: "100%", background: "#1f7a45", borderRight: "2px solid " + T.ink, boxSizing: "border-box" }} />
                    </div>
                    <div className="tm-display tm-num" style={{ width: 28, textAlign: "right", fontSize: 13, color: T.fg }}>{v}</div>
                  </div>
                );
              })}
            </div>

            )}

            {createStep === 1 && (
              <button style={styles.btnPrimary} onClick={() => setCreateStep(2)}>Suivant</button>
            )}

            {createStep === 2 && (<>
            {/* Récapitulatif BD : quatre cases encrées sous un bandeau noir */}
            <div style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink }}>
              <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 14, padding: "5px 10px" }}>Votre départ</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 10 }}>
                {[
                  { icon: "money", label: "Argent", value: fmtMoney(startMoney(startCityInput, gameOptionsInput)), bg: "#d6ef3c" },
                  { icon: "location", label: "Ville", value: <span style={{ display: "inline-flex", alignItems: "center", gap: 5, minWidth: 0 }}><FlagFromEmoji emoji={CITIES[startCityInput]?.flag} size={12} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{startCityInput}</span></span>, bg: "#c9b6ea" },
                  { icon: "trophy", label: "Points", value: "0 pt", bg: "#ffffff" },
                  { icon: "energy", label: "Énergie", value: "100 %", bg: "#ffffff" },
                ].map(c => (
                  <div key={c.label} style={{ background: c.bg, border: "2px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, padding: "5px 8px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>
                      <Icon name={c.icon} size={11} color="#141414" /> {c.label}
                    </div>
                    <div className="tm-display" style={{ fontSize: 15, lineHeight: 1.2, marginTop: 2, minWidth: 0 }}>{c.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              style={{ ...styles.btnPrimary, opacity: nameInput.length < 2 ? 0.4 : 1 }}
              disabled={nameInput.length < 2}
              onClick={() => {
                setSeed(newSeed());
                setCircuit(circuitInput);
                const newPlayer = createInitialPlayer(nameInput, styleInput, startCityInput, nationalityInput || undefined, avatarInput, difficultyInput, gameOptionsInput, surfaceInput);
                newPlayer.circuit = circuitInput;
                // Base de joueurs choisie : Standard, ou configuration personnalisée.
                const rosterCfg = rosterInput >= 0 && hasPurchased("custom_mode") ? loadRosterConfigs()[rosterInput] : null;
                const newDb = generateAtpDatabase(rosterCfg ? rosterEntries(rosterCfg, circuitInput) : null);
                if (rosterCfg) newPlayer.rosterName = rosterCfg.name;
                // Starter sponsor: a low-tier offer to introduce the negotiation
                // scene and let the player earn a little from the start.
                const startRanking = 1100;
                const starter = generateSponsorOffer(startRanking, 0, [], newPlayer.image, {}, 2026, newPlayer.startDifficulty);
                if (starter) {
                  // Premier sponsor : toujours négociable (pour apprendre).
                  newPlayer.sponsorOffers = [{ ...starter, nonNegotiable: false, week: 1, year: 2026 }];
                  // Rouverte au chargement tant qu'elle n'a pas été conclue.
                  newPlayer.introSponsorPending = true;
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
            </>)}
            <button style={styles.btnSecondary} onClick={createStep === 2 ? () => setCreateStep(1) : goBackToIdentity}>← Étape précédente</button>
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
          <WindowShades />
          <div style={{ ...styles.menuCard, maxWidth: 380, alignItems: "stretch" }}>
            {/* Une de fin de carrière : case BD tramée, onomatopée, sous-titre */}
            <div className={isRetirement ? "tm-halftone-yellow" : "tm-halftone-magenta"} style={{ border: "3px solid " + T.ink, boxShadow: "5px 5px 0 " + T.ink, padding: "14px 12px", textAlign: "center", marginBottom: 14, color: "#141414" }}>
              <span style={{ display: "inline-flex", width: 52, height: 52, alignItems: "center", justifyContent: "center", background: "#ffffff", border: "3px solid " + T.ink, transform: "rotate(-4deg)" }}>
                <Icon name={isRetirement ? "trophy" : "wallet"} size={30} color={isRetirement ? "#b8891f" : "#c4302b"} />
              </span>
              <h1 className="tm-display" style={{ fontSize: 30, margin: "8px 0 0", color: isRetirement ? "#141414" : "#ffffff", textShadow: isRetirement ? "none" : "2px 2px 0 " + T.ink }}>
                {isRetirement ? "Retraite" : "Fin de carrière"}
              </h1>
              <span style={{ display: "inline-block", marginTop: 6, background: T.ink, color: "#ffffff", fontSize: 11, fontWeight: 800, letterSpacing: 0.8, padding: "2px 8px", textTransform: "uppercase" }}>
                {isVoluntaryRetirement ? "Vous avez choisi de raccrocher" : isForcedRetirement ? "40 ans : il est temps de raccrocher" : "Banqueroute"}
              </span>
            </div>

            {/* Score de légende */}
            <div style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, marginBottom: 12, textAlign: "center", overflow: "hidden" }}>
              <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 14, padding: "5px 10px" }}>Score de légende</div>
              <div style={{ padding: "12px 10px 14px" }}>
                <div className="tm-display" style={{ color: tier.color, fontSize: 46, lineHeight: 1, WebkitTextStroke: "1.5px " + T.ink }}>{fmtNum(legacy)}</div>
                <span className="tm-display" style={{ display: "inline-block", marginTop: 8, padding: "2px 12px", background: tier.color, color: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, fontSize: 14, textShadow: "1px 1px 0 " + T.ink }}>{tier.label}</span>
              </div>
            </div>

            {/* Détail du score */}
            <div style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, marginBottom: 12 }}>
              <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 14, padding: "5px 10px" }}>Détail du score</div>
              <div style={{ padding: "4px 12px 10px" }}>
                {breakdown.rows.map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, padding: "5px 0", fontSize: 12.5, fontWeight: 600, borderBottom: "1.5px dashed " + T.ink }}>
                    <span>{r.label} <span style={{ fontSize: 11, opacity: 0.7 }}>({r.detail})</span></span>
                    <strong className="tm-num">{fmtNum(r.pts, { sign: true })}</strong>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 4px", fontSize: 12.5, fontWeight: 700, borderBottom: "1.5px dashed " + T.ink }}>
                  <span>Sous-total</span>
                  <strong className="tm-num">{fmtNum(breakdown.subtotal)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12.5, fontWeight: 700 }}>
                  <span>{breakdown.diffPct >= 0 ? "Bonus" : "Malus"} difficulté <span style={{ fontSize: 11, opacity: 0.7 }}>({breakdown.mulLabel})</span></span>
                  <strong className="tm-num" style={{ color: "#5b2d8e" }}>{fmtNum(breakdown.difficultyBonus, { sign: true })}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <span className="tm-display" style={{ fontSize: 14 }}>Total</span>
                  <span className="tm-display" style={{ background: tier.color, color: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, padding: "1px 8px", fontSize: 15, textShadow: "1px 1px 0 " + T.ink }}>{fmtNum(breakdown.total)}</span>
                </div>
              </div>
            </div>

            {/* Récit, en bulle manuscrite */}
            <div className="tm-lettering" style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, padding: "12px 14px", marginBottom: 12, fontSize: 16, lineHeight: 1.3, textAlign: "center" }}>
              {isRetirement
                ? `Après une longue carrière sur le circuit, ${player.name} décide de prendre une retraite bien méritée. Place à la nouvelle génération !`
                : `Le tennis professionnel est impitoyable. Faute de moyens pour continuer, ${player.name} a dû mettre un terme à son rêve.`}
            </div>

            {/* Bilan de carrière */}
            <div style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, marginBottom: 12 }}>
              <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 14, padding: "5px 10px", display: "flex", alignItems: "center", gap: 6 }}><Icon name="chart" size={13} color="#d6ef3c" /> Bilan de carrière</div>
              <div style={{ padding: "4px 12px 10px" }}>
                {[
                  { l: "Âge final", v: player.age + " ans" },
                  { l: "Meilleur classement", v: "#" + (summary.bestRank === 9999 ? "—" : summary.bestRank) },
                  { l: "Semaines n°1", v: summary.weeksNo1, hide: summary.weeksNo1 === 0 },
                  { l: "Semaines top 10", v: summary.weeksTop10, hide: summary.weeksTop10 === 0 },
                  { l: "Titres remportés", v: player.titlesWon },
                  { l: "Dont Grands Chelems", v: summary.gsTitles, hide: summary.gsTitles === 0 },
                  { l: "Victoires en carrière", v: player.careerWins, c: "#1f7a45" },
                  { l: "Meilleure série", v: summary.bestStreak + " v.", hide: summary.bestStreak < 2 },
                  { l: "Objectifs sponsors atteints", v: (player.careerObjectivesMet || 0), hide: (player.careerObjectivesMet || 0) === 0 },
                  { l: "Gains totaux", v: fmtMoney(player.totalEarnings || 0), c: "#1f7a45" },
                  { l: "Saisons jouées", v: summary.seasons },
                ].filter(row => !row.hide).map((row, i, arr) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, fontWeight: 600, borderBottom: i < arr.length - 1 ? "1.5px dashed " + T.ink : "none" }}>
                    <span>{row.l}</span><strong className="tm-num" style={{ color: row.c || "#141414" }}>{row.v}</strong>
                  </div>
                ))}
                {summary.bestRivalry && (
                  <div className="tm-lettering" style={{ marginTop: 8, padding: "6px 8px", background: "#c9b6ea", border: "2px solid " + T.ink, fontSize: 15, textAlign: "center" }}>
                    Plus grande rivalité : {summary.bestRivalry.name} ({summary.bestRivalry.wins}V–{summary.bestRivalry.losses}D)
                  </div>
                )}
              </div>
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
    // Boutons de BD : cernés d'encre épaisse, ombre décalée, case d'icône.
    const setBtn = (bg, fg, extra = {}) => ({
      width: "100%", minHeight: 54, display: "flex", alignItems: "center", gap: 10,
      padding: "8px 14px 8px 8px", cursor: "pointer", borderRadius: 0,
      background: bg, color: fg, border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink,
      fontFamily: T.display, fontWeight: 400, fontSize: 15, lineHeight: 1.1, textAlign: "left",
      ...extra,
    });
    const iconCase = (bg, rot = -4) => ({
      width: 34, height: 34, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: bg, border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, transform: "rotate(" + rot + "deg)",
    });
    const hazard = "repeating-linear-gradient(-45deg, #e0a21b 0 10px, #141414 10px 20px)";
    return (
      <div style={styles.root}>
        <style>{BD_PRESS_CSS}</style>
        {deleteSaveDialog}
        <div style={{ ...styles.menuBg, padding: "40px 20px 28px", flexDirection: "column", alignItems: "center", justifyContent: "flex-start" }}>
          <WindowShades />
          <div style={{ ...styles.menuCard, maxWidth: 380, alignItems: "stretch", gap: 16, padding: "28px 20px 22px" }}>
            {/* En-tête BD : bandeau violet tramé, roue crantée dans une case penchée */}
            <div className="tm-halftone-magenta" style={{ margin: "-28px -20px 2px", borderBottom: "3px solid " + T.ink, padding: "16px 18px 14px", display: "flex", alignItems: "center", gap: 12, color: "#ffffff" }}>
              <span style={{ width: 50, height: 50, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#d6ef3c", border: "3px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, transform: "rotate(-6deg)" }}>
                <Icon name="cog" size={30} color="#141414" strokeWidth={2} />
              </span>
              <div style={{ minWidth: 0 }}>
                <h1 className="tm-display" style={{ color: "#d6ef3c", fontSize: 32, lineHeight: 1, margin: 0, WebkitTextStroke: "1.5px " + T.ink, textShadow: "3px 3px 0 " + T.ink, transform: "rotate(-2deg)", transformOrigin: "left center" }}>Réglages</h1>
                <p className="tm-lettering" style={{ display: "inline-block", margin: "8px 0 0", background: "#ffffff", color: "#141414", border: "2px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, padding: "1px 8px", fontSize: 14, transform: "rotate(-1deg)" }}>Paramètres de la partie en cours</p>
              </div>
            </div>

            {/* Pages d'aide : case tramée lilas, récitatif, gros bouton vert */}
            <div style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink }}>
              <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 14, padding: "5px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#d6ef3c", color: "#141414", border: "2px solid #ffffff", fontSize: 13, textTransform: "none", transform: "rotate(-6deg)" }}>i</span>
                Pages d'aide
              </div>
              <div className="tm-halftone-lilac" style={{ padding: "12px 12px 14px" }}>
                <div className="tm-lettering" style={{ background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, padding: "8px 10px", fontSize: 15, lineHeight: 1.25, marginBottom: 14, transform: "rotate(-0.5deg)" }}>
                  L'aide de chaque page s'ouvre à votre première visite, puis reste disponible via le bouton « i » en haut à droite. Vous pouvez la faire réapparaître automatiquement sur toutes les pages.
                </div>
                <button
                  className="tm-bd-press tm-halftone-cyan"
                  style={setBtn("#1f7a45", "#ffffff", { transform: "rotate(-1deg)", textShadow: "1px 1px 0 " + T.ink, textTransform: "uppercase" })}
                  onClick={() => {
                    setPlayer(p => ({ ...p, seenHelp: [] }));
                    setActiveTab("hub");
                    setScreen("hub");
                  }}
                >
                  <span style={iconCase("#ffffff")}><Icon name="lightbulb" size={22} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>Réafficher les pages d'aide</span>
                </button>
              </div>
            </div>

            {/* Séparateur encré */}
            <div aria-hidden="true" style={{ borderTop: "2px dashed " + T.ink, margin: "2px 0" }} />

            {/* Back to game */}
            <button
              className="tm-bd-press tm-halftone-yellow"
              style={setBtn("#d6ef3c", "#141414", { textTransform: "uppercase" })}
              onClick={() => setScreen("hub")}
            >
              <span style={iconCase("#ffffff")}><Icon name="arrowLeft" size={18} color="#141414" strokeWidth={3} /></span>
              <span style={{ flex: 1 }}>Retour au jeu</span>
            </button>

            {/* Main menu */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                className="tm-bd-press"
                style={setBtn("#ffffff", "#141414", { textTransform: "uppercase" })}
                onClick={() => returnToMenu()}
              >
                <span style={iconCase("#c9b6ea", 4)}><Icon name="home" size={20} /></span>
                <span style={{ flex: 1 }}>Menu principal</span>
              </button>
              {/* Bulle : pointe vers le bouton du menu */}
              <div style={{ position: "relative", alignSelf: "center", maxWidth: 300 }}>
                <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true" style={{ position: "absolute", left: 40, top: -11, overflow: "visible" }}>
                  <path d="M2 14 L8 0 L18 14" fill="#ffffff" stroke={T.ink} strokeWidth="2.5" strokeLinejoin="round" />
                </svg>
                <div className="tm-lettering" style={{ background: "#ffffff", color: "#141414", border: "2.5px solid " + T.ink, borderRadius: "22px / 16px", boxShadow: "2px 2px 0 " + T.ink, fontSize: 14.5, textAlign: "center", padding: "6px 14px", lineHeight: 1.2 }}>
                  La carrière est sauvegardée et reste disponible depuis le menu.
                </div>
              </div>
            </div>

            {/* Danger zone : panneau d'avertissement, bordure à rayures */}
            <div style={{ background: hazard, border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, padding: 7, marginTop: 6 }}>
              <div style={{ background: "#ffffff", color: "#141414", border: "2.5px solid " + T.ink }}>
                <div className="tm-display" style={{ background: "#c4302b", backgroundImage: "radial-gradient(rgba(20,20,20,0.22) 1.3px, transparent 1.5px)", backgroundSize: "6px 6px", color: "#ffffff", fontSize: 15, padding: "6px 10px", borderBottom: "2.5px solid " + T.ink, display: "flex", alignItems: "center", gap: 9, textShadow: "1px 1px 0 " + T.ink }}>
                  <span style={{ width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#e0a21b", border: "2px solid " + T.ink, transform: "rotate(-6deg)" }}>
                    <Icon name="warning" size={17} />
                  </span>
                  Zone sensible
                </div>
                <div style={{ padding: "12px 14px 14px 10px" }}>
                  <button
                    className="tm-bd-press"
                    style={setBtn("#c4302b", "#ffffff", { fontSize: 14, textTransform: "uppercase", textShadow: "1px 1px 0 " + T.ink })}
                    onClick={() => deleteSave(slot)}
                  >
                    <span style={iconCase("#ffffff")}><Icon name="trash" size={20} /></span>
                    <span style={{ flex: 1, minWidth: 0 }}>Effacer cette carrière</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Petit secret : trois touches sur la balle ouvrent « Le mur ». */}
          <div style={{ width: "100%", maxWidth: 380, margin: "22px auto 0" }}>
            {wallTaps >= 3 ? <WallGame /> : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span aria-hidden="true" style={{ flex: 1, borderTop: "2px dashed " + T.ink, opacity: 0.35 }} />
                <button aria-label="Balle" onClick={() => setWallTaps(n => n + 1)} style={{ display: "block", background: "none", border: 0, padding: 6, cursor: "pointer", opacity: 0.55 + wallTaps * 0.15, transform: "rotate(" + (wallTaps * 25) + "deg)", transition: "transform 0.2s" }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
                    <circle cx="11" cy="11" r="9" fill="#d6ef3c" stroke="#141414" strokeWidth="2" />
                    <path d="M3.5 7 Q11 11 3.5 15 M18.5 7 Q11 11 18.5 15" fill="none" stroke="#141414" strokeWidth="1.5" />
                  </svg>
                </button>
                <span aria-hidden="true" style={{ flex: 1, borderTop: "2px dashed " + T.ink, opacity: 0.35 }} />
              </div>
            )}
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

    // ─── Écrans d'après-match, façon BD (comme l'avant-match) ───────────────
    const POST_INK = T.ink;
    // Bandeau titre : couleur selon l'issue, grosse onomatopée, tournoi + tour.
    const postHeader = (title, tone, sub) => {
      const bg = tone === "gold" ? "#d6ef3c" : tone === "win" ? "#1f7a45" : "#c4302b";
      const fg = tone === "gold" ? "#141414" : "#ffffff";
      return (
        <div style={{ background: bg, color: fg, padding: "16px 16px 14px", borderBottom: "3px solid " + POST_INK, backgroundImage: "radial-gradient(rgba(255,255,255,0.18) 1.4px, transparent 1.6px)", backgroundSize: "7px 7px", textAlign: "center" }}>
          <div className="tm-display" style={{ fontSize: 40, lineHeight: 1, color: tone === "gold" ? "#141414" : "#d6ef3c", WebkitTextStroke: "1.5px " + POST_INK, textShadow: "3px 3px 0 " + POST_INK, transform: "rotate(-3deg)", display: "inline-block" }}>{title}</div>
          <div className="tm-display" style={{ fontSize: 17, marginTop: 10, textShadow: tone === "gold" ? "none" : "1px 1px 0 " + POST_INK }}>{tourn.name}</div>
          <span className="tm-lettering" style={{ display: "inline-block", marginTop: 5, background: "#ffffff", color: "#141414", border: "2px solid " + POST_INK, padding: "0 8px", fontSize: 14 }}>{sub}</span>
        </div>
      );
    };
    // Face-à-face final : les deux portraits, le score au milieu, le vainqueur en jaune.
    const postFaces = (fr) => {
      const me = { avatar: player.avatar, name: rankingName(player.name), flag: player.nationalityFlag, won: fr.won };
      const opp = { avatar: aiAvatar(ms.opponent, player.circuit === "wta"), name: fr.opponent, flag: ms.opponent?.nat?.flag, won: !fr.won, rank: fr.opponentRank };
      const face = (x) => (
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <div style={{ position: "relative", border: "3px solid " + POST_INK, background: x.won ? "#d6ef3c" : "#ffffff", boxShadow: "3px 3px 0 " + POST_INK, overflow: "hidden", filter: x.won ? "none" : "grayscale(0.7)" }}>
            <Avatar config={{ ...x.avatar, mood: x.won ? "sourire" : "concentre" }} size={88} bare />
          </div>
          <div className="tm-display" style={{ fontSize: 13, textAlign: "center", lineHeight: 1.05, overflowWrap: "anywhere" }}>{x.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {x.flag && <FlagFromEmoji emoji={x.flag} size={12} />}
            {x.won && <span style={{ background: POST_INK, color: "#d6ef3c", fontSize: 10, fontWeight: 800, padding: "0 5px", textTransform: "uppercase" }}>Gagnant</span>}
            {x.rank && !x.won && <span className="tm-num" style={{ fontSize: 11, fontWeight: 800 }}>#{x.rank}</span>}
          </div>
        </div>
      );
      return (
        <div style={{ border: "3px solid " + POST_INK, boxShadow: "5px 5px 0 " + POST_INK, background: "linear-gradient(100deg, #d6ef3c 0 50%, #c9b6ea 50% 100%)", position: "relative", overflow: "hidden", padding: "14px 8px 10px" }}>
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(20,20,20,0.14) 1.4px, transparent 1.6px)", backgroundSize: "6px 6px" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "flex-start" }}>
            {face(me)}
            <div style={{ width: 92, flexShrink: 0, height: 94, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="tm-display" style={{ background: "#ffffff", border: "2.5px solid " + POST_INK, boxShadow: "2px 2px 0 " + POST_INK, padding: "4px 5px", fontSize: 13, lineHeight: 1.2, textAlign: "center", color: "#141414" }}>{fr.finalScore}</span>
            </div>
            {face(opp)}
          </div>
        </div>
      );
    };
    // Gains : deux cases encrées.
    const postGains = (fr) => (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[{ icon: "money", l: "Gains", v: fmtMoney(fr.prize, { sign: true }), c: "#1f7a45" }, { icon: "trending", l: "Points", v: fmtNum(fr.pts, { sign: true }) + "\u00a0pts", c: "#5b2d8e" }].map(x => (
          <div key={x.l} style={{ background: "#ffffff", border: "2.5px solid " + POST_INK, boxShadow: "3px 3px 0 " + POST_INK, padding: "8px 10px", color: "#141414" }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}><Icon name={x.icon} size={11} />{x.l}</div>
            <div className="tm-display" style={{ fontSize: 22, color: x.c }}>{x.v}</div>
          </div>
        ))}
      </div>
    );
    // Débrief : bulle de BD des commentateurs.
    const postDebrief = (fr) => fr.debrief && (
      <div style={{ position: "relative", marginTop: 4 }}>
        <span className="tm-display" style={{ position: "absolute", left: 10, top: -11, zIndex: 1, background: POST_INK, color: "#d6ef3c", fontSize: 11, padding: "1px 7px", display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="mic" size={11} color="#d6ef3c" />Les commentateurs</span>
        <div className="tm-lettering" style={{ background: "#ffffff", color: "#141414", border: "3px solid " + POST_INK, borderRadius: "28px / 22px", padding: "16px 16px 12px", fontSize: 15, lineHeight: 1.3 }}>« {fr.debrief} »</div>
      </div>
    );
    const postPanel = (title, children, extra = {}) => (
      <div style={{ background: "#ffffff", border: "3px solid " + POST_INK, boxShadow: "4px 4px 0 " + POST_INK, color: "#141414", ...extra }}>
        <div className="tm-display" style={{ background: POST_INK, color: "#ffffff", fontSize: 15, padding: "5px 12px" }}>{title}</div>
        <div style={{ padding: 12 }}>{children}</div>
      </div>
    );

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
        matchData.tactics = normalizeTactics(ms.matchData?.tactics || player.tactics);
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
          <div style={{ ...styles.screen, justifyContent: "flex-start", overflowY: "auto", paddingBottom: 24 }}>
            <WindowShades />
            {postHeader(enteringMain ? "QUALIFIÉ !" : fr.won ? "VICTOIRE !" : "DÉFAITE", fr.won ? "win" : "loss", roundName)}
            <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
              {postFaces(fr)}
              {postGains(fr)}
              {postDebrief(fr)}
              {ms.rr && (() => {
                const { g, h } = finalsRanked(ms.rr, player);
                const nameOf = id => id === "__me" ? rankingName(player.name) : ms.rr.players[id].name;
                const table = (label, ids) => (
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <div className="tm-display" style={{ display: "inline-block", background: T.ink, color: "#ffffff", fontSize: 12.5, padding: "2px 8px", marginBottom: 6 }}>Poule {label}</div>
                    {ids.map((id, i) => {
                      const r = ms.rr.table[id];
                      return (
                        <div key={id} style={{ display: "flex", justifyContent: "space-between", gap: 6, fontSize: 12, padding: "3px 0", color: id === "__me" ? "#1f7a45" : "#141414", fontWeight: id === "__me" ? 800 : 600, borderTop: i === 2 ? "2px dashed " + T.ink : "none" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {nameOf(id)}</span>
                          <span className="tm-num">{r.w}-{r.l}</span>
                        </div>
                      );
                    })}
                  </div>
                );
                return (
                  <div style={{ background: "#ffffff", padding: 14, border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, textAlign: "left", display: "flex", gap: 16, flexWrap: "wrap", color: "#141414" }}>
                    {table(ms.rr.gLabel, g)}
                    {table(ms.rr.hLabel, h)}
                  </div>
                );
              })()}

              {pnm.nextOpp && postPanel("Prochain match", (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ border: "2.5px solid " + T.ink, background: "#ffffff", flexShrink: 0 }}>
                    <Avatar config={aiAvatar(pnm.nextOpp, player.circuit === "wta")} size={56} bare />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <span className="tm-lettering" style={{ display: "inline-block", background: "#d6ef3c", border: "2px solid " + T.ink, padding: "0 7px", fontSize: 13 }}>{nextRoundLabel}</span>
                    <div className="tm-display" style={{ fontSize: 16, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}><FlagFromEmoji emoji={pnm.nextOpp.nat?.flag} size={13} />{pnm.nextOpp.name}</div>
                    <div className="tm-num" style={{ fontSize: 12, fontWeight: 800 }}>#{pnm.nextOppRank} mondial</div>
                  </div>
                </div>
              ))}

              <button style={{ ...styles.btnPrimary, width: "auto" }} onClick={onContinue}>Continuer →</button>
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

      // Conférence de presse façon BD : bandeau rouge, case de la salle de
      // presse avec le journaliste et sa bulle, puis vos réponses en bulles.
      const reporter = aiAvatar({ name: "Presse " + tourn?.name + " " + currentQ }, currentQ % 2 === 1);
      return (
        <div style={styles.root}>
          <div style={{ ...styles.screen, alignItems: "stretch", justifyContent: "flex-start", overflowY: "auto", padding: 0, paddingBottom: 20 }}>
            <WindowShades />
            {/* Bandeau */}
            <div style={{ background: "#c4302b", color: "#ffffff", padding: "12px 16px", borderBottom: "3px solid " + T.ink, backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1.4px, transparent 1.6px)", backgroundSize: "7px 7px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#ffffff", color: "#c4302b", border: "2px solid " + T.ink, fontSize: 10.5, fontWeight: 800, letterSpacing: 1, padding: "1px 6px", textTransform: "uppercase" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#c4302b", animation: "tm-live-blink 1.2s ease-in-out infinite" }} />En direct
                </span>
                <div className="tm-display" style={{ fontSize: 22, lineHeight: 1.05, marginTop: 5, textShadow: "2px 2px 0 " + T.ink }}>Conférence de presse</div>
                <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2 }}>{tourn?.name}</div>
              </div>
              <span className="tm-display" style={{ background: "#d6ef3c", color: "#141414", border: "2.5px solid " + T.ink, padding: "2px 8px", fontSize: 16 }}>{currentQ + 1}/{questions.length}</span>
            </div>
            <style>{"@keyframes tm-live-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }"}</style>

            <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Case 1 : le journaliste pose sa question */}
              <div className="tm-halftone-lilac" style={{ border: "3px solid " + T.ink, boxShadow: "5px 5px 0 " + T.ink, padding: "12px 10px 10px", position: "relative" }}>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 10 }}>
                  {[0, 1, 2, 3, 4].map(k => (
                    <span key={k} style={{ width: 26, height: 26, borderRadius: "50%", background: k === 2 ? "#d6ef3c" : "#ffffff", border: "2px solid " + T.ink, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="mic" size={14} color="#141414" /></span>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <div style={{ flexShrink: 0, border: "2.5px solid " + T.ink, background: "#ffffff", boxShadow: "2px 2px 0 " + T.ink }}>
                    <Avatar config={reporter} size={62} bare />
                  </div>
                  <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                    <div className="tm-lettering" style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, borderRadius: "26px / 20px", padding: "12px 14px", fontSize: 16, lineHeight: 1.25 }}>{q.text}</div>
                    {/* pointe de la bulle vers le journaliste */}
                    <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true" style={{ position: "absolute", left: -14, bottom: 8, overflow: "visible" }}>
                      <path d="M22 2 L0 16 L18 12" fill="#ffffff" stroke={T.ink} strokeWidth="3" strokeLinejoin="round" />
                      <path d="M22.5 3.5 L17 11" stroke="#ffffff" strokeWidth="4" />
                    </svg>
                  </div>
                </div>
                <span style={{ position: "absolute", left: 10, top: -11, background: T.ink, color: "#d6ef3c", fontSize: 10, fontWeight: 800, padding: "1px 6px", textTransform: "uppercase", letterSpacing: 0.6 }}>La question</span>
              </div>

              {/* Case 2 : vos réponses */}
              <div style={{ border: "3px solid " + T.ink, boxShadow: "5px 5px 0 " + T.ink, background: "#ffffff", padding: "12px 10px", position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: -11, background: T.ink, color: "#d6ef3c", fontSize: 10, fontWeight: 800, padding: "1px 6px", textTransform: "uppercase", letterSpacing: 0.6 }}>Votre réponse</span>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
                    {q.options.map((opt, i) => (
                      <button key={i} onClick={() => answerQuestion(opt)} className="tm-lettering" style={{
                        background: i % 2 ? "#ffffff" : "#d6ef3c", color: "#141414",
                        border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, borderRadius: "18px 18px 4px 18px",
                        padding: "9px 12px", textAlign: "left", cursor: "pointer", fontSize: 15, lineHeight: 1.25,
                      }}>« {opt.label} »</button>
                    ))}
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ border: "2.5px solid " + T.ink, background: "#d6ef3c", boxShadow: "2px 2px 0 " + T.ink }}>
                      {player.avatar ? <Avatar config={player.avatar} size={62} bare /> : <Icon name="users" size={40} />}
                    </div>
                    <span className="tm-display" style={{ fontSize: 11, maxWidth: 70, textAlign: "center", lineHeight: 1.05, overflowWrap: "anywhere" }}>{player.name}</span>
                  </div>
                </div>
              </div>

              {/* Avancement */}
              <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                {questions.map((_, i) => (
                  <span key={i} style={{ width: 22, height: 10, border: "2px solid " + T.ink, background: i < currentQ ? "#1f7a45" : i === currentQ ? "#d6ef3c" : "#ffffff" }} />
                ))}
              </div>

              <button style={{ ...styles.btnSecondary, width: "auto" }} onClick={() => setMatchState(prev => ({ ...prev, phase: "result" }))}>Passer la conférence</button>
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
      const negative = Object.values(prog).some(v => v < 0);
      return (
        <div style={styles.root}>
          <div style={{ ...styles.screen, justifyContent: "flex-start", overflowY: "auto", paddingBottom: 24 }}>
            <WindowShades />
            {fr.isTitleWin
              ? postHeader("CHAMPION !", "gold", (tourn.city || "") + " · " + player.year)
              : postHeader(fr.won ? "VICTOIRE !" : fr.eliminatedInQuali ? "ÉLIMINÉ EN QUALIFS" : "ÉLIMINÉ", fr.won ? "win" : "loss", fr.round)}
            <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
              {fr.isTitleWin && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ background: "#d6ef3c", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10, transform: "rotate(-2deg)" }}>
                    <Icon name="trophy" size={34} color="#141414" />
                    <span className="tm-lettering" style={{ fontSize: 17, color: "#141414" }}>Le trophée est à vous !</span>
                  </div>
                </div>
              )}
              {postFaces(fr)}
              {postGains(fr)}

              {fr.isTitleWin && lore && postPanel("Histoire du tournoi", (
                <>
                  <div className="tm-lettering" style={{ fontSize: 15.5, lineHeight: 1.3, marginBottom: 10 }}>{lore.history}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: T.ink, color: "#d6ef3c", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6, padding: "2px 8px", marginBottom: 4 }}><Icon name="trophy" size={12} color="#d6ef3c" /> Légendes du tournoi</div>
                  {lore.legends.map((legend, i) => (
                    <div key={i} className="tm-display" style={{ fontSize: 13.5, padding: "4px 0", borderBottom: i < lore.legends.length - 1 ? "2px dashed " + T.ink : "none" }}>• {legend}</div>
                  ))}
                  <div style={{ marginTop: 10, padding: "8px 10px", background: "#d6ef3c", border: "2.5px solid " + T.ink }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase" }}>Vainqueur {player.year}</div>
                    <div className="tm-display" style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}><FlagFromEmoji emoji={player.nationalityFlag} size={13} />{player.name}</div>
                  </div>
                </>
              ))}
              {fr.isTitleWin && !lore && postPanel("Palmarès", (
                <div className="tm-lettering" style={{ fontSize: 16, lineHeight: 1.3 }}>
                  Votre nom rejoint désormais la liste des vainqueurs de{" "}
                  <span className="tm-display" style={{ fontSize: 14, background: "#d6ef3c", border: "2px solid " + T.ink, padding: "0 5px", whiteSpace: "nowrap" }}>{tourn.name}</span>.
                  {" "}Une belle ligne ajoutée à votre carrière.
                </div>
              ))}

              {postDebrief(fr)}

              {hasProg && postPanel("Bilan du tournoi", (
                <>
                  <div className="tm-lettering" style={{ fontSize: 14, marginBottom: 8 }}>
                    {ms.totalMatchesInTournament} match{ms.totalMatchesInTournament > 1 ? "s" : ""} · {fr.isTitleWin ? "titre et bonus !" : negative ? "performance décevante…" : "progrès pendant le tournoi"}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {Object.entries(prog).map(([k, v]) => (
                      <span key={k} style={{ border: "2px solid " + T.ink, background: v >= 0 ? "#1f7a45" : "#c4302b", color: "#ffffff", fontSize: 12, fontWeight: 800, padding: "2px 7px" }}>
                        {statLabels[k] || k} {fmtStatDelta(v)}
                      </span>
                    ))}
                  </div>
                </>
              ))}

              <button style={{ ...styles.btnPrimary, width: "auto" }} onClick={() => {
                setScreen("hub");
                setActiveTab("hub");
                setMatchState(null);
                // Medical diagnosis for an injury picked up during the tournament
                if (player.injuryNoticePending) {
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
      // Analyste vidéo : 1 = les 6 stats adverses, 2 = + sa forme du jour.
      const scoutLevel = Math.max(0, Math.min(2, sumStaffEffect(player.staff || [], "scouting")));
      // Affiche de match façon BD : bandeau à la couleur de la surface,
      // face-à-face des deux portraits, fiche de scouting, forme du jour.
      const SURF_BG = { "Gazon": "#1f7a45", "Terre battue": "#c4622d", "Dur": "#2c6fd1", "Indoor": "#5b2d8e" };
      const surfBg = SURF_BG[tourn.surface] || T.ink;
      const ink = T.ink;
      const panel = { background: T.bg1, border: "3px solid " + ink, boxShadow: "4px 4px 0 " + ink };
      const bandTitle = (txt) => (
        <div className="tm-display" style={{ background: ink, color: "#ffffff", fontSize: 15, padding: "5px 10px", letterSpacing: 0.5 }}>{txt}</div>
      );
      const formBar = (label, val) => (
        <div style={{ display: "grid", gridTemplateColumns: "58px minmax(0, 1fr) 44px", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase" }}>{label}</span>
          <div style={{ height: 14, border: "2.5px solid " + ink, background: "#ffffff" }}>
            <div style={{ height: "100%", width: Math.round(val) + "%", background: val > 60 ? "#1f7a45" : val > 30 ? "#e0a21b" : "#c4302b", borderRight: val > 0 && val < 100 ? "2.5px solid " + ink : "none" }} />
          </div>
          <span className="tm-num" style={{ fontSize: 13, fontWeight: 800, textAlign: "right" }}>{Math.round(val)}%</span>
        </div>
      );
      const portrait = (avatar, flag, name, rank, me) => (
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ border: "3px solid " + ink, background: me ? "#ffffff" : "#ffffff", boxShadow: "4px 4px 0 " + ink, overflow: "hidden", transform: "rotate(" + (me ? -2.5 : 2.5) + "deg)" }}>
            <Avatar config={avatar} size={112} bare />
          </div>
          <div className="tm-display" style={{ marginTop: 4, fontSize: 15, lineHeight: 1.05, textAlign: "center", color: "#141414", overflowWrap: "anywhere" }}>{name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {flagEmojiToCode(flag) && <FlagFromEmoji emoji={flag} size={14} />}
            <span className="tm-num" style={{ fontSize: 13, fontWeight: 800, background: me ? T.blue : "#ffffff", color: me ? "#ffffff" : "#141414", border: "2px solid " + ink, padding: "0 6px" }}>#{rank}</span>
          </div>
        </div>
      );
      return (
        <div style={styles.root}>
          <div style={{ ...styles.screen, paddingBottom: 0 }}>
            <WindowShades />
            {/* Bandeau du tournoi */}
            <div style={{ background: surfBg, color: "#ffffff", padding: "14px 16px 12px", borderBottom: "3px solid " + ink, backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1.4px, transparent 1.6px)", backgroundSize: "7px 7px" }}>
              <span style={{ display: "inline-block", background: T.gold, color: "#141414", border: "2px solid " + ink, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", padding: "1px 7px" }}>{tierLabel(tourn.tier)} · {tourn.surface}</span>
              <div className="tm-display" style={{ fontSize: 28, lineHeight: 1.02, marginTop: 6, textShadow: "2px 2px 0 " + ink }}>{tourn.name}</div>
              <span className="tm-lettering" style={{ display: "inline-block", marginTop: 6, background: "#ffffff", color: "#141414", border: "2px solid " + ink, padding: "1px 8px", fontSize: 14 }}>{roundName}</span>
            </div>

            <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Face-à-face : les deux portraits côte à côte, « VS » entre les deux */}
              <div style={{
                border: panel.border, boxShadow: panel.boxShadow, position: "relative", overflow: "hidden",
                background: "linear-gradient(100deg, #d6ef3c 0 50%, #c9b6ea 50% 100%)",
                padding: "16px 8px 12px",
              }}>
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(20,20,20,0.16) 1.4px, transparent 1.6px)", backgroundSize: "6px 6px" }} />
                <div aria-hidden="true" style={{ position: "absolute", top: -10, bottom: -10, left: "50%", width: 4, marginLeft: -2, background: ink, transform: "rotate(10deg)" }} />
                <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 0 }}>
                  {portrait(player.avatar, player.nationalityFlag, rankingName(player.name), ranking, true)}
                  {/* « VS » : étoile à pointes courtes, assez large pour que le
                      lettrage respire à l'intérieur ; ombre d'encre décalée. */}
                  <div style={{ width: 66, flexShrink: 0, height: 118, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="-4 -4 112 112" width="70" height="70" aria-hidden="true" style={{ transform: "rotate(-8deg)" }}>
                      <polygon points="50.0,2.0 59.8,13.3 74.0,8.4 76.9,23.1 91.6,26.0 86.7,40.2 98.0,50.0 86.7,59.8 91.6,74.0 76.9,76.9 74.0,91.6 59.8,86.7 50.0,98.0 40.2,86.7 26.0,91.6 23.1,76.9 8.4,74.0 13.3,59.8 2.0,50.0 13.3,40.2 8.4,26.0 23.1,23.1 26.0,8.4 40.2,13.3" fill={ink} transform="translate(4 4)" />
                      <polygon points="50.0,2.0 59.8,13.3 74.0,8.4 76.9,23.1 91.6,26.0 86.7,40.2 98.0,50.0 86.7,59.8 91.6,74.0 76.9,76.9 74.0,91.6 59.8,86.7 50.0,98.0 40.2,86.7 26.0,91.6 23.1,76.9 8.4,74.0 13.3,59.8 2.0,50.0 13.3,40.2 8.4,26.0 23.1,23.1 26.0,8.4 40.2,13.3" fill="#c4302b" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
                      <circle cx="50" cy="50" r="27" fill="#ffffff" stroke={ink} strokeWidth="3" />
                      <text x="50" y="50" dy="0.36em" textAnchor="middle" fontFamily={T.display} fontSize="25" letterSpacing="-0.5" fill="#141414">VS</text>
                    </svg>
                  </div>
                  {portrait(aiAvatar(ms.opponent, player.circuit === "wta"), ms.opponent.nat?.flag, ms.opponent.name, ms.opponentRank, false)}
                </div>
              </div>

              {/* Scouting */}
              <div style={panel}>
                {bandTitle("Scouting adverse")}
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Style de jeu</span>
                    <span style={{ fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Icon name={PLAYER_STYLES[ms.opponent.style]?.iconName} size={15} color={T.fg} />
                      {PLAYER_STYLES[ms.opponent.style]?.name}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ background: "#1f7a45", color: "#ffffff", border: "2.5px solid " + ink, padding: "6px 8px" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>Point fort</div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{oppProfile.strength.label} <span className="tm-num">{Math.round(oppProfile.strength.value)}</span></div>
                    </div>
                    <div style={{ background: "#c4302b", color: "#ffffff", border: "2.5px solid " + ink, padding: "6px 8px" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}><Icon name="target" size={11} color="#ffffff" /> Point faible</div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{oppProfile.weakness.label} <span className="tm-num">{Math.round(oppProfile.weakness.value)}</span></div>
                    </div>
                  </div>
                  {scoutLevel > 0 && (
                    <div style={{ border: "2.5px solid " + ink, background: T.lilac, color: "#141414", padding: "6px 8px" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Rapport de l'analyste vidéo</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "3px 10px" }}>
                        {[["serve", "Service"], ["forehand", "Coup droit"], ["backhand", "Revers"], ["stamina", "Endurance"], ["mental", "Mental"], ["net", "Filet"]].map(([k, l]) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 4, fontSize: 12, fontWeight: 700 }}>
                            <span>{l}</span><span className="tm-num" style={{ fontWeight: 800 }}>{Math.round(ms.opponent.stats[k] ?? 0)}</span>
                          </div>
                        ))}
                      </div>
                      {scoutLevel >= 2 && (
                        <div style={{ marginTop: 5, fontSize: 12, fontWeight: 800 }}>
                          Forme du jour : {(m.oppForm || 0) >= 4 ? "en grande forme" : (m.oppForm || 0) <= -4 ? "en difficulté" : "habituelle"}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Cote globale</span>
                    <span className="tm-display" style={{ fontSize: 20, background: T.gold, color: "#141414", border: "2.5px solid " + ink, padding: "0 8px" }}>{getRating(ms.opponent.stats)}</span>
                  </div>
                </div>
              </div>

              {/* Forme du jour et format */}
              <div style={panel}>
                {bandTitle("Forme du jour")}
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {formBar("Vous", player.energy)}
                  {formBar("Adv.", m.oppEnergy)}
                  {player.energy < 40 && <div role="alert" style={{ display: "flex", alignItems: "center", gap: 7, background: "#c4302b", color: "#ffffff", border: "2.5px solid " + ink, boxShadow: "2px 2px 0 " + ink, padding: "4px 8px", fontSize: 12, fontWeight: 800 }}><Icon name="warning" size={13} color="#ffffff" style={{ flexShrink: 0 }} /> Énergie faible : performance réduite</div>}
                  {m.oppEnergy < 50 && <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#ffffff", color: "#141414", border: "2.5px solid " + ink, borderLeft: "8px solid #1f7a45", padding: "4px 8px", fontSize: 12, fontWeight: 800 }}><Icon name="lightbulb" size={13} color="#1f7a45" style={{ flexShrink: 0 }} /> Adversaire fatigué par ses précédents matchs</div>}
                  <div style={{ borderTop: "2px solid " + ink, paddingTop: 8, fontSize: 12.5, fontWeight: 800 }}>
                    {ms.isGrandSlam ? "3 sets gagnants · tie-break à 10 pts au 5e set"
                      : ms.tournament?.tier === "GrandSlam" ? "2 sets gagnants · tie-break à 10 pts au 3e set"
                      : "2 sets gagnants · tie-break à 7 pts à 6-6"}
                  </div>
                </div>
              </div>
            </div>

            <button style={{ ...styles.btnPrimary, width: "auto", alignSelf: "stretch", margin: "18px 16px 24px" }} onClick={() => {
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
          {/* Hauteur exacte de l'écran sous la barre d'état (flex: none : ne pas
              grandir au-delà) ; la barre d'actions du bas réserve elle-même la
              zone de la barre d'accueil. La page ne défile donc pas. */}
          <div style={{ ...styles.screen, flex: "none", height: "calc(100dvh - env(safe-area-inset-top, 0px))", minHeight: 0, overflowY: "auto" }}>
            {/* Bandeau du tournoi, à la couleur de la surface (comme l'avant-match) */}
            <div style={{
              background: LIVE_SURF_BG[tourn.surface] || T.ink, color: "#ffffff",
              backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1.4px, transparent 1.6px)", backgroundSize: "7px 7px",
              borderBottom: "3px solid " + T.ink, padding: "10px 16px 10px", display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#c4302b", color: "#ffffff", border: "2px solid " + T.ink, fontSize: 10.5, fontWeight: 800, letterSpacing: 1, padding: "1px 6px", textTransform: "uppercase" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ffffff", animation: !matchPaused ? "tm-live-blink 1.2s ease-in-out infinite" : "none" }} />
                  En direct · {tierLabel(tourn.tier)}
                </span>
                <div className="tm-display" style={{ fontSize: 21, lineHeight: 1.05, marginTop: 5, textShadow: "2px 2px 0 " + T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tourn.name}</div>
                <span className="tm-lettering" style={{ display: "inline-block", marginTop: 4, background: "#ffffff", color: "#141414", border: "2px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, padding: "0 7px", fontSize: 13 }}>{roundName}</span>
              </div>
            </div>
            <style>{"@keyframes tm-live-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }"}</style>

            {/* Stadium scoreboard */}
            <div style={{
              margin: "14px 16px 12px",
              background: T.bg1,
              border: "3px solid " + T.ink,
              overflow: "hidden",
              boxShadow: "5px 5px 0 " + T.ink,
            }}>
              <div style={{
                background: T.ink, color: T.paper,
                padding: "6px 16px",
                display: "flex",
                alignItems: "center",
              }}>
                <span style={{ flex: 1, color: T.paper, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase" }}>Joueur</span>
                {setsPlayed.map((_, i) => (
                  <span key={i} style={{
                    width: 42, textAlign: "center",
                    color: "#ffffff", fontSize: 9.5, fontWeight: 800,
                    fontFamily: T.mono, letterSpacing: 0.2,
                  }}>SET {i + 1}</span>
                ))}
                <span style={{
                  width: 48, textAlign: "center",
                  color: T.gold,
                  fontSize: 9.5, fontWeight: 800,
                  fontFamily: T.mono, letterSpacing: 0.2,
                  marginLeft: 4, paddingLeft: 4,
                  transition: "color 0.2s",
                }}>PT</span>
              </div>
              {/* Server for the next game = the same rotation the engine
                  uses to advance (m.nextServerIsPlayer). */}
              {(() => null)()}
              {[
                { name: rankingName(player.name), flag: player.nationalityFlag || "", isP: true },
                { name: ms.opponent.name, flag: ms.opponent.nat?.flag || "", isP: false },
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
                  display: "flex", alignItems: "center", padding: "8px 0 8px 12px",
                  borderTop: ri === 1 ? "2.5px solid " + T.ink : "none",
                  background: row.isP ? "rgba(214,239,60,0.22)" : "transparent",
                }}>
                  <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    {/* Tennis-ball glyph in front of the current server */}
                    <span style={{
                      width: 14, height: 14, borderRadius: 7, flexShrink: 0,
                      background: isServing ? "#d6ef3c" : "transparent",
                      border: isServing ? "2px solid " + T.ink : "none",
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
                    <span style={{ width: 34, height: 34, flexShrink: 0, border: "2px solid " + T.ink, background: row.isP ? T.gold : "#ffffff", overflow: "hidden" }}>
                      <Avatar config={row.isP ? player.avatar : aiAvatar(ms.opponent, player.circuit === "wta")} size={30} bare />
                    </span>
                    <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                      <span className="tm-display" style={{ color: T.fg, fontSize: 14, lineHeight: 1.05, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.name}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 800, color: T.fg3 }}><FlagFromEmoji emoji={row.flag} size={10} />#{row.isP ? ranking : ms.opponentRank}</span>
                    </span>
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
                        fontSize: 26, fontWeight: 400,
                        fontFamily: T.display, fontVariantNumeric: "tabular-nums",
                        letterSpacing: -0.5, lineHeight: 1,
                        color: !s.completed ? T.magenta : (won ? T.fg : T.fg4),
                      }}>{display}{tbSup}</span>
                    );
                  })}
                  {/* PT cell — running point score for the current game (0/15/30/40/AV/JEU) */}
                  <span style={{
                    width: 48, textAlign: "center",
                    fontSize: livePoint ? (((row.isP ? livePoint.p : livePoint.o) || "").length > 2 ? 16 : 22) : 18,
                    fontWeight: 400, fontFamily: T.display, fontVariantNumeric: "tabular-nums",
                    letterSpacing: -0.3, lineHeight: 1,
                    color: "#141414", background: livePoint ? T.gold : T.bg2,
                    alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "center",
                    borderLeft: "2.5px solid " + T.ink, marginLeft: 4, margin: "-8px 0",
                    textShadow: "none",
                    transition: "color 0.2s, font-size 0.15s",
                  }}>{livePoint ? (row.isP ? livePoint.p : livePoint.o) : "—"}</span>
                </div>
                );
              })}
            </div>

            {/* Forme : énergie des deux joueurs et élan (−5 à +5) */}
            <div style={{ margin: "0 16px 12px", background: T.bg1, border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, padding: "7px 10px", display: "grid", gridTemplateColumns: "minmax(0,1fr) 92px minmax(0,1fr)", gap: 10, alignItems: "center" }}>
              {[{ e: m.playerEnergy, l: "Vous" }, null, { e: m.oppEnergy, l: "Adv." }].map((it, i) => it ? (
                <div key={i} style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 2 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}><Icon name="energy" size={10} />{it.l}</span>
                    <span className="tm-num">{Math.round(it.e)}</span>
                  </div>
                  <div style={{ height: 9, border: "2px solid " + T.ink, background: "#ffffff", direction: i === 2 ? "rtl" : "ltr" }}>
                    <div style={{ height: "100%", width: Math.round(it.e) + "%", background: it.e > 60 ? "#1f7a45" : it.e > 30 ? "#e0a21b" : "#c4302b" }} />
                  </div>
                </div>
              ) : (
                <div key={i} title="Élan : la dynamique du match" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 2 }}>Élan</div>
                  <div style={{ position: "relative", height: 9, border: "2px solid " + T.ink, background: "linear-gradient(90deg, #d6ef3c 0 50%, #c9b6ea 50% 100%)" }}>
                    {/* Élan net (le vôtre moins celui de l'adversaire) : à gauche s'il est
                        pour vous, à droite s'il est pour lui, avec la même amplitude. */}
                    <div style={{ position: "absolute", top: -4, width: 6, height: 13, marginLeft: -3, background: T.ink, left: (50 - clampMomentum((m.playerMomentum || 0) - (m.oppMomentum || 0)) * 10) + "%", transition: "left 0.3s" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Fil des commentaires : cases de BD, les temps forts en grand */}
            <div ref={feedBoxRef} style={{ ...styles.eventFeed, flex: "1 1 0", minHeight: 160, maxHeight: "none", padding: "4px 16px 18px" }}>
              <BoxShade boxRef={feedBoxRef} side="top" />
              {ms.eventLog.length === 0 && (
                <div className="tm-lettering" style={{ background: "#ffffff", color: "#141414", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, fontSize: 16, textAlign: "center", padding: 14, margin: "6px 0" }}>
                  {matchPaused ? "Match en pause · appuyez sur Reprendre pour commencer."
                    : startCountdown > 0 ? <>Préparez-vous… début du match dans <strong className="tm-num">{startCountdown}</strong></>
                    : "Premier jeu…"}
                </div>
              )}
              {ms.eventLog.map((b, i) => {
                const fade = Math.max(0.6, 1 - i * 0.05);
                if (b.type === "dilemma") {
                  const decisive = /Duel|Smash/.test(b.title || "");
                  return (
                    <div key={b.id} className="tm-halftone-lilac" style={{ ...styles.eventItem, opacity: fade, border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, color: "#141414" }}>
                      <span style={{ display: "inline-block", background: T.ink, color: T.gold, fontSize: 10, fontWeight: 800, letterSpacing: 1, padding: "1px 6px", textTransform: "uppercase", marginBottom: 5 }}>{decisive ? "Point décisif" : "Décision"}{b.title ? " · " + b.title : ""}</span>
                      {b.choice && <div style={{ fontSize: 12, marginBottom: 3 }}>{b.title === "Smash" ? "Frappe" : "Choix"} : <strong>{b.choice}</strong></div>}
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{withFlags(b.text || "")}</div>
                    </div>
                  );
                }
                // Blessure en match : case BD rouge tramée avec onomatopée.
                if (b.type === "injury") {
                  return (
                    <div key={b.id} style={{ ...styles.eventItem, background: "#c4302b", backgroundImage: "radial-gradient(rgba(20,20,20,0.22) 1.3px, transparent 1.5px)", backgroundSize: "6px 6px", opacity: fade, position: "relative", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, color: "#ffffff", padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 34, height: 34, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "2.5px solid " + T.ink, transform: "rotate(-4deg)" }}>
                        <Icon name="bandage" size={19} color="#c4302b" />
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span className="tm-display" style={{ display: "inline-block", fontSize: 20, lineHeight: 1, color: "#d6ef3c", WebkitTextStroke: "1.2px " + T.ink, textShadow: "2px 2px 0 " + T.ink, transform: "rotate(-3deg)", marginBottom: 4 }}>AÏE !</span>
                        <div style={{ fontSize: 13.5, fontWeight: 800, textShadow: "1px 1px 0 " + T.ink }}>{withFlags(b.text)}</div>
                      </div>
                    </div>
                  );
                }
                const good = ["break_clean", "break_grind", "rebreak", "tb_won", "set_won", "hold_easy", "hold_tough"].includes(b.type);
                const bad = ["lose_serve", "opp_rebreak", "tb_lost", "set_lost"].includes(b.type);
                const big = b.type === "set_won" || b.type === "set_lost";
                // Dernier set : l'étiquette annonce l'issue du match.
                const tag = b.type === "set_won" ? (b.matchEnd ? "MATCH GAGNÉ !" : "SET !") : b.type === "set_lost" ? (b.matchEnd ? "MATCH PERDU" : "SET PERDU")
                  : ["break_clean", "break_grind", "rebreak"].includes(b.type) ? "BREAK !"
                  : ["lose_serve", "opp_rebreak"].includes(b.type) ? "BREAKÉ"
                  : b.type === "tb_won" ? "TIE-BREAK !" : b.type === "tb_lost" ? "TIE-BREAK"
                  : null;
                const band = good ? "#1f7a45" : bad ? "#c4302b" : T.bg4;
                return (
                  <div key={b.id} style={{
                    ...styles.eventItem, opacity: fade, position: "relative",
                    background: big ? (good ? T.gold : "#ffffff") : "#ffffff", color: "#141414",
                    border: "2.5px solid " + T.ink, borderLeft: "8px solid " + band,
                    boxShadow: (big || tag ? "4px 4px 0 " : "2px 2px 0 ") + T.ink,
                    padding: big ? "12px 14px" : "9px 12px",
                  }}>
                    {tag && <span className="tm-display" style={{ float: "right", marginLeft: 8, fontSize: big ? 18 : 13, color: good ? "#1f7a45" : "#c4302b", transform: "rotate(-4deg)", lineHeight: 1 }}>{tag}</span>}
                    <span style={{ fontSize: big ? 14.5 : 13.5, fontWeight: big ? 800 : 600 }}>{withFlags(b.text)}</span>
                  </div>
                );
              })}
            </div>

            {/* Dilemma overlay */}
            {ms.pendingDilemma && ms.pendingDilemma.minigame && (
              <div className="tm-paper" style={{ position: "fixed", inset: 0, zIndex: 250, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: 16, gap: 12 }}>
                {/* Score du match, toujours visible pendant le mini-jeu */}
                {(() => {
                  const pg = m.pendingGame;
                  // Avantage joueur au moment du mini-jeu : AV contre 40.
                  const pt = !pg ? null : pg.isTiebreak ? { p: String(pg.pPts), o: String(pg.oPts) } : { p: pg.pp > pg.op ? "AV" : "40", o: pg.op > pg.pp ? "AV" : "40" };
                  return (
                    <div style={{ width: "100%", maxWidth: 400, background: "#ffffff", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, flexShrink: 0 }}>
                      {[{ name: rankingName(player.name), isP: true }, { name: ms.opponent.name, isP: false }].map((row, ri) => (
                        <div key={ri} style={{ display: "flex", alignItems: "center", borderTop: ri ? "2px solid " + T.ink : "none", background: row.isP ? "rgba(214,239,60,0.22)" : "transparent" }}>
                          <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 7, padding: "5px 10px" }}>
                            {/* Balle devant le serveur, comme sur l'écran du match */}
                            {(() => {
                              // Au tie-break, isPlayerServing est le premier serveur :
                              // 1 point puis 2 chacun (même règle que le moteur).
                              const playerServes = !pg ? false : pg.isTiebreak
                                ? ((Math.floor(((pg.seq || []).length + 1) / 2) % 2) === 0) === !!pg.isPlayerServing
                                : !!pg.isPlayerServing;
                              const isServing = !!pg && (row.isP ? playerServes : !playerServes);
                              return (
                                <span style={{ width: 14, height: 14, borderRadius: 7, flexShrink: 0, position: "relative", background: isServing ? "#d6ef3c" : "transparent", border: isServing ? "2px solid " + T.ink : "none" }}>
                                  {isServing && (
                                    <svg viewBox="0 0 14 14" style={{ position: "absolute", inset: 0 }}>
                                      <path d="M 1 5 Q 7 7 13 5" fill="none" stroke="#000" strokeWidth="0.6" opacity="0.6" />
                                      <path d="M 1 9 Q 7 11 13 9" fill="none" stroke="#000" strokeWidth="0.6" opacity="0.6" />
                                    </svg>
                                  )}
                                </span>
                              );
                            })()}
                            <span className="tm-display" style={{ minWidth: 0, fontSize: 13, color: "#141414", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.name}</span>
                          </span>
                          {setsPlayed.map((st, i) => (
                            <span key={i} className="tm-display" style={{ width: 30, textAlign: "center", fontSize: 17, color: !st.completed ? T.magenta : "#141414" }}>{row.isP ? st.pGames : st.oGames}</span>
                          ))}
                          <span className="tm-display" style={{ width: 44, alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#141414", background: T.gold, borderLeft: "2.5px solid " + T.ink }}>{pt ? (row.isP ? pt.p : pt.o) : "—"}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div style={{ flex: 1 }} />
                <MatchMiniGame
                  kind={ms.pendingDilemma.minigame}
                  oppName={ms.opponent.name}
                  oppStats={ms.opponent.stats}
                  myStats={player.stats}
                  history={m.serveZones || []}
                  stake={m.pendingGame && m.pendingGame.isTiebreak
                    ? (m.pendingGame.pPts + 1 >= m.pendingGame.target && m.pendingGame.pPts + 1 - m.pendingGame.oPts >= 2 ? "Balle de set pour vous" : "Balle de set à sauver")
                    : m.pendingGame && !m.pendingGame.isPlayerServing ? "Balle de break" : "Balle de jeu"}
                  myMental={player.stats.mental}
                  oppAvatar={aiAvatar(ms.opponent, player.circuit === "wta")}
                  myAvatar={player.avatar}
                  onDone={(win, text, zone, label) => resolveMiniGame(ms.pendingDilemma.minigame, win, text, zone, label)}
                />
                <div style={{ flex: 1 }} />
              </div>
            )}
            {ms.pendingDilemma && !ms.pendingDilemma.minigame && (
              <div style={styles.dilemmaOverlay}>
                <div style={styles.dilemmaCard}>
                  <span style={{ display: "inline-block", background: ms.pendingDilemma.isMatchFix ? "#c4302b" : T.ink, color: "#ffffff", border: "2px solid " + T.ink, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8, padding: "1px 7px", textTransform: "uppercase", marginBottom: 6 }}>{ms.pendingDilemma.isMatchFix ? "Proposition illégale" : "Décision · Choix tactique"}</span>
                  <div className="tm-display" style={{ color: "#141414", fontSize: 18, lineHeight: 1.15 }}>{ms.pendingDilemma.title}</div>
                  <div className="tm-lettering" style={{ color: "#141414", fontSize: 16, margin: "8px 0 16px", lineHeight: 1.3 }}>{ms.pendingDilemma.desc.replace("{o}", ms.opponent.name)}</div>
                  {ms.pendingDilemma.isMatchFix && (
                    <div role="alert" style={{ margin: "-6px 0 16px", display: "flex", alignItems: "stretch", background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, color: "#141414", fontSize: 12.5, fontWeight: 700, lineHeight: 1.4 }}>
                      <span style={{ flexShrink: 0, width: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "#c4302b", borderRight: "2.5px solid " + T.ink }}><Icon name="warning" size={17} color="#ffffff" /></span>
                      <span style={{ padding: "7px 10px" }}>Truquer un match est passible d'une suspension de 10 à 12 semaines et ruine votre réputation si vous êtes démasqué.</span>
                    </div>
                  )}
                  {ms.pendingDilemma.options.filter(opt => !opt.requiresCoach || player.staff.some(s => s.role === "Coach")).map((opt, i) => (
                    <button
                      key={i}
                      style={{ ...styles.dilemmaBtn, display: "flex", alignItems: "center", gap: 12 }}
                      onClick={() => resolveDilemma(opt, ms.pendingDilemma)}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 0,
                        background: "#d6ef3c", border: "2.5px solid " + T.ink,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, transform: "rotate(-4deg)",
                      }}>
                        <Icon name={opt.iconName || "target"} size={18} color="#141414" strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontWeight: 800, fontSize: 13.5 }}>{opt.label}</div>
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
                  borderTop: "3px solid " + T.ink,
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <button
                    onClick={togglePause}
                    aria-label={running ? "Mettre en pause" : "Reprendre le match"}
                    style={{
                      width: 58, height: 58, borderRadius: 0, flexShrink: 0,
                      border: "3px solid " + T.ink, cursor: "pointer",
                      background: running ? T.bg1 : T.magenta,
                      color: running ? T.fg : "#ffffff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "4px 4px 0 " + T.ink,
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
                      <span style={{ fontSize: 11.5, fontWeight: 800, background: running ? "#1f7a45" : "#e0a21b", color: running ? "#ffffff" : "#141414", border: "2px solid " + T.ink, padding: "1px 7px", textTransform: "uppercase", letterSpacing: 0.3 }}>
                        {running ? (startCountdown > 0 && ms.eventLog.length === 0 ? "Début dans " + startCountdown + " s" : "Match en cours") : "En pause"}
                      </span>
                    </div>
                  </div>
                  {/* Pause tactique : met le match en pause et ouvre le plan de jeu */}
                  <button
                    onClick={() => {
                      if (running) {
                        setPausedBoth(true);
                        if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
                      }
                      setTacticsOpen(true);
                    }}
                    style={{
                      minHeight: 52, padding: "0 14px", flexShrink: 0, cursor: "pointer",
                      border: "3px solid " + T.ink, background: T.gold, color: "#141414",
                      boxShadow: "4px 4px 0 " + T.ink, fontFamily: T.display, fontSize: 15, textTransform: "uppercase",
                    }}
                  >Tactique</button>
                  {tacticsOpen && (() => {
                    const tac = normalizeTactics(m.tactics);
                    // Conseil seulement si un coach est engagé (jamais en mode sans staff).
                    const hasCoach = (player.staff || []).some(st => st.role === "Coach");
                    const advice = hasCoach ? coachAdvice(player.stats, ms.opponent.stats, tourn.surface) : { key: null, value: null };
                    // Étoiles : une pour le coach, jusqu'à deux de plus avec un analyste vidéo.
                    const scouting = Math.max(0, Math.min(2, sumStaffEffect(player.staff || [], "scouting")));
                    const stars = adviceStars(player.stats, ms.opponent.stats, tourn.surface, (hasCoach ? 1 : 0) + scouting);
                    const hasStars = stars.length > 0 || (hasCoach && advice.key);
                    const setTac = (key, value) => {
                      const next = { ...tac, [key]: value };
                      setMatchState(prev => prev ? ({ ...prev, matchData: { ...prev.matchData, tactics: next } }) : prev);
                      setPlayer(p => ({ ...p, tactics: next }));
                    };
                    return (
                      <div ref={tacticsBoxRef} role="dialog" aria-label="Plan de jeu" className="tm-paper" style={{
                        position: "fixed", inset: 0, zIndex: 250, overflowY: "auto",
                        padding: "16px 16px calc(16px + env(safe-area-inset-bottom, 0px))",
                        display: "flex", flexDirection: "column", gap: 10,
                      }}>
                        <BoxShade boxRef={tacticsBoxRef} side="top" />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "3px solid " + T.ink, paddingBottom: 4 }}>
                          <span className="tm-display" style={{ fontSize: 22 }}>Plan de jeu</span>
                          <span style={{ background: T.ink, color: "#ffffff", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3, padding: "1px 6px", textTransform: "uppercase", maxWidth: "58%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Contre {ms.opponent.name}</span>
                        </div>
                        {hasCoach && <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <div className="tm-lettering" style={{ flex: 1, background: "#ffffff", color: "#141414", border: "2.5px solid " + T.ink, borderRadius: "50% / 40%", padding: "9px 14px", fontSize: 15, textAlign: "center" }}>« {advice.text} »</div>
                          <div style={{ alignSelf: "center", background: T.ink, color: "#d6ef3c", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase", textAlign: "center", padding: "3px 6px", transform: "rotate(-4deg)" }}>Votre<br />coach</div>
                        </div>}
                        {TACTIC_DEFS.map(d => (
                          <div key={d.key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11.5, fontWeight: 800 }}>
                              <span style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>{d.label}</span>
                              <span style={{ color: T.blue, fontWeight: 700, textAlign: "right" }}>{d.hints[tac[d.key]]}</span>
                            </div>
                            <div role="radiogroup" aria-label={d.label} style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", border: "2.5px solid " + T.ink, background: T.bg1 }}>
                              {d.options.map((label, i) => {
                                const on = tac[d.key] === i;
                                const suggested = (advice.key === d.key && advice.value === i) || stars.some(st => st.key === d.key && st.value === i);
                                return (
                                  <button key={i} role="radio" aria-checked={on} onClick={() => setTac(d.key, i)} style={{
                                    minHeight: 42, border: 0, borderRight: i < 2 ? "2px solid " + T.ink : 0, cursor: "pointer",
                                    background: on ? T.gold : "transparent", color: on ? "#141414" : T.fg,
                                    fontFamily: T.body, fontWeight: 800, fontSize: 11.5, position: "relative",
                                  }}>
                                    {label}
                                    {suggested && !on && <span style={{ position: "absolute", top: 1, right: 3, fontSize: 13, lineHeight: 1, color: T.magenta, WebkitTextStroke: "0.5px " + T.ink }}>★</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        <div className="tm-lettering" style={{ fontSize: 14, lineHeight: 1.25, color: "#141414", background: "#ffffff", border: "2px solid " + T.ink, padding: "5px 9px" }}>{hasStars ? (scouting > 0 ? (hasCoach ? "★ = conseils de votre coach et de votre analyste. " : "★ = conseils de votre analyste. ") : "★ = conseil du coach. ") : ""}Les effets dépendent de votre profil, de celui de l'adversaire et de la surface.</div>
                        <button
                          style={{ ...styles.btnPrimary, marginTop: "auto", background: T.green }}
                          onClick={() => { setTacticsOpen(false); if (!running) togglePause(); }}
                        >Reprendre le match ▶&#xFE0E;</button>
                        <BoxShade boxRef={tacticsBoxRef} side="bottom" />
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
            {m.matchComplete && (
              <div style={{
                position: "sticky", bottom: 0, marginTop: "auto", zIndex: 5, flexShrink: 0,
                padding: "14px 16px calc(16px + env(safe-area-inset-bottom, 0px))",
                background: T.bg1,
                // Même bande de séparation que la barre de contrôle du match.
                borderTop: "3px solid " + T.ink,
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
      {cardPick && (
        <TrainingCards
          mod={cardPick}
          energyCost={baseTrainingEnergy(cardPick)}
          gains={Object.fromEntries(TRAINING_CARDS.map(c => [c.id, programmeGain(player, cardPick, c)]))}
          noStaff={hasGameOption(player, "no_staff") || challengeActive("seul")}
          statLabel={{ serve: "Service", forehand: "Coup droit", backhand: "Revers", stamina: "Endurance", mental: "Mental", net: "Filet" }[cardPick.stat] || cardPick.name}
          odds={Object.fromEntries(TRAINING_CARDS.map(c => [c.id, trainingOdds(c, trainingOddsCtx)]))}
          oddsCtx={trainingOddsCtx}
          onPick={(id, outcome) => { const mod = cardPick; setCardPick(null); runTraining(mod, id, outcome); }}
          onClose={() => setCardPick(null)}
        />
      )}
      {sponsorNegotiation && (
        <SponsorNegotiationOverlay
          data={{ ...sponsorNegotiation, onWalkAway: (offerId) => {
            setPlayer(p => ({ ...p, sponsorOffers: (p.sponsorOffers || []).filter(o => o.id !== offerId) }));

          } }}
          player={player}
          ranking={ranking}
          onSign={acceptSponsorOffer}
          onClose={() => {
            setPlayer(p => ({ ...p, sponsorOffers: [], introSponsorPending: false }));
            setSponsorNegotiation(null);
          }}
        />
      )}
      <div style={styles.screen}>
        <div style={styles.topBar}>
          <BarShade side="top" show={winEdges.top} />
          {/* Manchette de la gazette : logo, aide, trophées, réglages */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div className="tm-display" style={{ fontSize: 26, lineHeight: 0.9, background: T.ink, color: T.gold, padding: "4px 10px 6px", transform: "rotate(-2deg)" }}>Courtside</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { key: "help", label: "Aide de cette page", onClick: () => setHelpTab(activeTab), icon: "info", bg: T.bg1 },
                { key: "trophies", label: "Trophées", onClick: () => {
                  setShowHallOfFame(true);
                  if ((player.unseenTrophies || 0) > 0) setPlayer(p => ({ ...p, unseenTrophies: 0 }));
                }, icon: "trophy", bg: T.gold, badge: player.unseenTrophies || 0 },
                { key: "settings", label: "Réglages", onClick: () => setScreen("settings"), icon: "cog", bg: T.bg1 },
              ].map(b => (
                <button key={b.key} onClick={b.onClick} aria-label={b.label} title={b.label} style={{
                  width: 42, height: 42, position: "relative", cursor: "pointer",
                  background: b.bg, border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, borderRadius: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", color: b.key === "trophies" ? "#161616" : T.fg,
                }}>
                  <Icon name={b.icon} size={19} strokeWidth={2.2} />
                  {b.badge > 0 && (
                    <span style={{
                      position: "absolute", top: -8, right: -8,
                      background: T.magenta, color: "#ffffff", border: "2px solid " + T.ink,
                      fontSize: 10, fontWeight: 800, padding: "0 4px", minWidth: 18, textAlign: "center",
                    }}>{b.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {/* Bandeau du joueur sur deux étages, entre deux traits d'encre :
              nom complet et classement en haut, situation de la semaine en bas. */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: "2.5px solid " + T.ink, borderBottom: "2.5px solid " + T.ink, padding: "6px 0", minWidth: 0 }}>
            <div style={{ width: 42, height: 42, flexShrink: 0, overflow: "hidden", border: "2px solid " + T.ink }}>
              {player.avatar ? <Avatar config={player.avatar} size={38} /> : <Icon name="racquet" size={20} color={T.fg} />}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 800, fontSize: 14, lineHeight: 1.15, textTransform: "uppercase", overflowWrap: "anywhere" }}>{player.name}</span>
                <span className="tm-num" style={{ flexShrink: 0, fontSize: 12, fontWeight: 800, color: "#ffffff", background: T.blue, border: "2px solid " + T.ink, padding: "0 5px" }}>#{ranking}</span>
              </div>
              <div className="tm-num" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap", minWidth: 0 }}>
                <span>Sem. {player.week} · {player.year}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}><FlagFromEmoji emoji={CITIES[player.location]?.flag} size={9} />{player.location}</span>
                <span style={{ color: player.money >= 0 ? T.fg : T.red }}>{fmtMoney(player.money)}</span>
                {/* Énergie en tampon BD : couleur selon le niveau, jauge sous le chiffre */}
                {(() => {
                  const e = Math.max(0, Math.min(100, Math.round(player.energy)));
                  const c = e > 60 ? "#1f7a45" : e > 30 ? "#e0a21b" : "#c4302b";
                  return (
                    <span title="Énergie" style={{ display: "inline-flex", flexDirection: "column", flexShrink: 0, border: "2px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, background: "#ffffff", transform: "rotate(-2deg)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 2, background: c, color: c === "#e0a21b" ? "#141414" : "#ffffff", padding: "0 5px 0 3px", fontFamily: T.display, fontSize: 12, lineHeight: "16px" }}>
                        <Icon name="energy" size={11} strokeWidth={2.6} />{e}
                      </span>
                      <span style={{ height: 3, background: "#ffffff", borderTop: "1.5px solid " + T.ink }}>
                        <span style={{ display: "block", height: "100%", width: e + "%", background: T.ink }} />
                      </span>
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
        {activeGroup.screens.length > 1 && (
          <div style={styles.subTabs}>
            {activeGroup.screens.map(sc => {
              const on = activeTab === sc.id;
              return (
                <button key={sc.id} onClick={() => setActiveTab(sc.id)} style={{ ...styles.subTab, ...(on ? styles.subTabActive : {}), position: "relative", overflow: "visible" }}>
                  <Icon name={sc.icon} size={17} halo={on} />
                  {sc.label}
                  {sc.id === "finance" && hasNewSponsorOffer && <BangBadge size={22} top="calc(50% - 11px)" right={3} />}
                </button>
              );
            })}
          </div>
        )}
        <div style={{ ...styles.content, paddingBottom: 110 }}>
          {wildcardBlocked && (
            <div onClick={() => setWildcardBlocked(null)} style={{ position: "fixed", inset: 0, background: "var(--tm-overlay)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
              <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "6px 6px 0 " + T.ink, maxWidth: 400, width: "100%" }}>
                <div className="tm-display" style={{ background: wildcardBlocked.injury ? "#c4302b" : "#e0a21b", color: wildcardBlocked.injury ? "#ffffff" : "#141414", fontSize: 18, padding: "6px 12px", borderBottom: "3px solid " + T.ink, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name={wildcardBlocked.injury ? "bandage" : "ticket"} size={18} color={wildcardBlocked.injury ? "#ffffff" : "#141414"} /> {wildcardBlocked.title}
                </div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="tm-lettering" style={{ fontSize: 17, lineHeight: 1.25 }}>{wildcardBlocked.lead}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>{wildcardBlocked.body}</div>
                  <button style={styles.btnPrimary} onClick={() => setWildcardBlocked(null)}>Compris</button>
                </div>
              </div>
            </div>
          )}
          {travelWarning && (
            <div onClick={() => setTravelWarning(null)} style={{ position: "fixed", inset: 0, background: "var(--tm-overlay)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
              <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "6px 6px 0 " + T.ink, maxWidth: 400, width: "100%" }}>
                <div className="tm-display" style={{ background: "#c4302b", color: "#ffffff", fontSize: 18, padding: "6px 12px", borderBottom: "3px solid " + T.ink }}>Êtes-vous sûr ?</div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="tm-lettering" style={{ fontSize: 17, lineHeight: 1.25 }}>
                    {elide("Le " + travelWarning.name)} commence la semaine prochaine à {travelWarning.city}… et vous êtes encore à {player.location} !
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>
                    Si vous avancez sans voyager, vous déclarez forfait{travelWarning.entryFee ? " et perdez les " + fmtMoney(travelWarning.entryFee) + " d'inscription" : ""}.
                  </div>
                  {(() => {
                    const cost = travelCostBetween(player.location, travelWarning.city);
                    const canPay = player.money >= cost;
                    return (
                      <button style={styles.btnPrimary} onClick={() => {
                        setTravelWarning(null);
                        if (canPay) travelTo(travelWarning.city);
                        else { setTravelSearch(travelWarning.city); setActiveTab("travel"); }
                      }}>
                        Voyager à {travelWarning.city} ({fmtMoney(cost)})
                      </button>
                    );
                  })()}
                  <button style={{ ...styles.btnSecondary, color: "#c4302b", boxShadow: "2px 2px 0 " + T.ink }} onClick={() => { setTravelWarning(null); advanceWeek(); }}>
                    Avancer quand même (forfait)
                  </button>
                  <button style={styles.btnSecondary} onClick={() => setTravelWarning(null)}>Annuler</button>
                </div>
              </div>
            </div>
          )}
          {confirmRetire && (
            <div onClick={() => setConfirmRetire(false)} style={{ position: "fixed", inset: 0, background: "var(--tm-overlay)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
              <div role="dialog" aria-label="Prendre sa retraite" onClick={e => e.stopPropagation()} style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "6px 6px 0 " + T.ink, maxWidth: 400, width: "100%" }}>
                <div className="tm-display" style={{ background: "#c4302b", color: "#ffffff", fontSize: 18, padding: "6px 12px", borderBottom: "3px solid " + T.ink }}>Êtes-vous sûr ?</div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="tm-lettering" style={{ fontSize: 17, lineHeight: 1.25 }}>Êtes-vous sûr de vouloir prendre votre retraite ?</div>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>Cette action est irréversible.</div>
                  <button style={{ ...styles.btnPrimary, background: "#c4302b" }} onClick={doRetire}>Prendre sa retraite</button>
                  <button style={styles.btnSecondary} onClick={() => setConfirmRetire(false)}>Annuler</button>
                </div>
              </div>
            </div>
          )}
          {helpTab && PAGE_HELP[helpTab] && (
            <div onClick={() => setHelpTab(null)} style={{
              position: "fixed", inset: 0, background: "var(--tm-overlay)", zIndex: 400,
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            }}>
              <div className="tm-paper" onClick={e => e.stopPropagation()} style={{
                border: "3px solid " + T.ink, boxShadow: "6px 6px 0 " + T.ink, color: "#141414",
                maxWidth: 440, width: "100%", maxHeight: "80vh", overflowY: "auto",
              }}>
                {/* En-tête BD : case « i », étiquette et titre de la page */}
                <div className="tm-halftone-cyan" style={{ borderBottom: "3px solid " + T.ink, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="tm-display" style={{ width: 34, height: 34, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#d6ef3c", color: "#141414", border: "2.5px solid " + T.ink, fontSize: 20, textTransform: "none", transform: "rotate(-4deg)" }}>i</span>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ display: "inline-block", background: T.ink, color: "#ffffff", fontSize: 10, fontWeight: 800, letterSpacing: 1, padding: "1px 6px", textTransform: "uppercase" }}>Aide</span>
                    <div className="tm-display" style={{ color: "#ffffff", fontSize: 21, lineHeight: 1.05, marginTop: 3, textShadow: "2px 2px 0 " + T.ink }}>{PAGE_HELP[helpTab].title}</div>
                  </div>
                </div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {PAGE_HELP[helpTab].items.map((it, i) => (
                  <div key={i} style={{ background: "#ffffff", border: "2px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink }}>
                    <div className="tm-display" style={{ background: i % 2 ? "#c9b6ea" : "#d6ef3c", borderBottom: "2px solid " + T.ink, fontSize: 13, padding: "3px 9px" }}>{it[0]}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.45, padding: "6px 9px 8px" }}>{withFlags(it[1])}</div>
                  </div>
                ))}
                <button style={{ ...styles.btnPrimary, marginTop: 4 }} onClick={() => setHelpTab(null)}>Compris</button>
                </div>
              </div>
            </div>
          )}
          {activeTab === "hub" && player.challenge && <ChallengePanel player={player} atpDb={atpDb} repayDebt={repayDebt} />}
          {activeTab === "hub" && <HubScreen player={player} news={news} advanceWeek={requestAdvanceWeek} rating={rating} ranking={ranking} totalPts={totalPts} cancelEnrollment={cancelEnrollment} isAdvancingWeek={isAdvancingWeek} acceptWildcard={acceptWildcard} declineWildcard={declineWildcard} retire={retire} setTournamentDetail={setTournamentDetail} />}
          {activeTab === "calendar" && <CalendarScreen player={player} ranking={ranking} calFilters={calFilters} setCalFilters={setCalFilters} enrollTournament={enrollTournament} cancelEnrollment={cancelEnrollment} setTournamentDetail={setTournamentDetail} />}
          {activeTab === "travel" && <TravelScreen player={player} travelTo={travelTo} initialSearch={travelSearch} onSearchUsed={() => setTravelSearch("")} />}
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
          {activeTab === "finance" && <FinanceScreen player={player} ranking={ranking} markSponsorOfferSeen={markSponsorOfferSeen} acceptSponsorOffer={acceptSponsorOffer} declineSponsorOffer={declineSponsorOffer} requestCancelSponsor={setConfirmCancelSponsor} sponsorCancelCost={sponsorCancelCost} setTournamentDetail={setTournamentDetail} />}
          {activeTab === "shop" && <ShopScreen />}
          {activeTab === "social" && <SocialScreen player={player} posts={news} setNews={setNews} setPlayer={setPlayer} adjustLife={adjustLife} />}
        </div>
        {!flightAnim && !sponsorNegotiation && (
          <nav style={styles.bottomNav}>
            <BarShade side="bottom" show={winEdges.bottom} />
            {NAV_GROUPS.map(g => {
              const isActive = activeGroup.id === g.id;
              return (
                <button
                  key={g.id}
                  style={{ ...styles.navBtn, ...(isActive ? styles.navBtnActive : {}), position: "relative", overflow: "visible" }}
                  onClick={() => setActiveTab(isActive ? activeTab : (lastScreenByGroup.current[g.id] || g.screens[0].id))}
                >
                  {g.id === "office" && hasNewSponsorOffer && <BangBadge size={22} top={-12} right={4} />}
                  <Icon name={g.icon} size={20} color={isActive ? "#161616" : T.fg} strokeWidth={2.1} />
                  <span style={{ fontSize: 10.5, fontWeight: 800 }}>{g.label}</span>
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
            <div className="tm-paper" style={{ border: "3px solid " + T.ink, boxShadow: "6px 6px 0 " + T.ink, maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto", color: "#141414" }}>
              {/* En-tête : case tramée avec drapeau d'arrivée */}
              <div className="tm-halftone-yellow" style={{ borderBottom: "3px solid " + T.ink, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 40, height: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "2.5px solid " + T.ink, transform: "rotate(-4deg)" }}>
                  <Icon name="flag" size={22} color="#1f7a45" />
                </span>
                <div>
                  <div className="tm-display" style={{ fontSize: 22, lineHeight: 1 }}>Bilan saison {r.year}</div>
                  <div className="tm-lettering" style={{ fontSize: 15, marginTop: 2 }}>Bienvenue dans la saison {r.year + 1} !</div>
                </div>
              </div>
              <div style={{ padding: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div style={{ background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>Classement final</div>
                  <div className="tm-display" style={{ fontSize: 22, color: "#5b2d8e" }}>#{r.endOfYearRanking}</div>
                  {rankDelta !== null && (
                    <span style={{ display: "inline-block", background: rankDelta > 0 ? "#1f7a45" : rankDelta < 0 ? "#c4302b" : "#ffffff", color: rankDelta ? "#ffffff" : "#141414", border: "2px solid " + T.ink, fontSize: 11, fontWeight: 800, padding: "0 6px" }}>
                      {rankDelta > 0 ? "↑ +" + rankDelta : rankDelta < 0 ? "↓ " + rankDelta : "→ 0"} place{Math.abs(rankDelta) > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div style={{ background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>Points</div>
                  <div className="tm-display" style={{ fontSize: 22, color: "#1f7a45" }}>{r.endOfYearPoints}</div>
                </div>
              </div>
              <div style={{ background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, marginBottom: 12 }}>
                <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 13, padding: "4px 10px" }}>La saison</div>
                <div style={{ padding: "2px 10px 6px" }}>
                  {[
                    ["Victoires", r.wins, "#1f7a45"],
                    ["Défaites", r.losses, "#c4302b"],
                    ["Taux de victoire", winRate + " %", winRate >= 50 ? "#1f7a45" : "#c4302b"],
                    ["Titres", r.titles, "#5b2d8e"],
                    ["Gains saison", fmtMoney(r.earnings, { sign: true }), "#1f7a45"],
                  ].map(([l, v, c], i, arr) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, padding: "5px 0", borderBottom: i < arr.length - 1 ? "1.5px dashed " + T.ink : "none" }}>
                      <span>{l}</span><strong className="tm-num" style={{ color: c }}>{v}</strong>
                    </div>
                  ))}
                </div>
              </div>
              {typeof r.legacyScore === "number" && (() => {
                const prevScore = prev && typeof prev.legacyScore === "number" ? prev.legacyScore : null;
                const delta = prevScore !== null ? r.legacyScore - prevScore : null;
                const tier = legacyTier(r.legacyScore);
                // Même détail que l'écran de fin de carrière.
                const breakdown = computeLegacyBreakdown(player);
                return (
                  <>
                    <div style={{ background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, marginBottom: 12, textAlign: "center" }}>
                      <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 13, padding: "4px 10px" }}>Score de légende</div>
                      <div style={{ padding: "8px 10px 10px" }}>
                        <div className="tm-display" style={{ color: tier.color, fontSize: 32, lineHeight: 1, WebkitTextStroke: "1.2px " + T.ink }}>{fmtNum(r.legacyScore)}</div>
                        <span className="tm-display" style={{ display: "inline-block", marginTop: 6, padding: "1px 10px", background: tier.color, color: "#ffffff", border: "2px solid " + T.ink, fontSize: 12.5, textShadow: "1px 1px 0 " + T.ink }}>{tier.label}</span>
                        {delta !== null && (
                          <div className="tm-lettering" style={{ color: delta > 0 ? "#1f7a45" : delta < 0 ? "#c4302b" : "#141414", fontSize: 15, marginTop: 6 }}>
                            {delta > 0 ? "↑ " + fmtNum(delta, { sign: true }) : delta < 0 ? "↓ " + fmtNum(delta, { sign: true }) : "→ 0"} cette saison
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, marginBottom: 12 }}>
                      <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 13, padding: "4px 10px" }}>Détail du score</div>
                      <div style={{ padding: "2px 10px 8px" }}>
                        {breakdown.rows.map((row, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, padding: "4px 0", borderBottom: "1.5px dashed " + T.ink, fontSize: 12, fontWeight: 600 }}>
                            <span>{row.label}</span>
                            <span style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                              <span style={{ fontSize: 10.5, opacity: 0.7 }}>{row.detail}</span>
                              <strong className="tm-num" style={{ minWidth: 50, textAlign: "right" }}>{fmtNum(row.pts)}</strong>
                            </span>
                          </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 2px", fontSize: 12.5, fontWeight: 700 }}>
                          <span>Sous-total</span>
                          <strong className="tm-num">{fmtNum(breakdown.subtotal)}</strong>
                        </div>
                        {breakdown.difficultyBonus !== 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: breakdown.difficultyBonus > 0 ? "#1f7a45" : "#c4302b", fontSize: 12.5, fontWeight: 700 }}>
                            <span>{breakdown.diffPct > 0 ? "Bonus" : "Malus"} difficulté ({breakdown.mulLabel})</span>
                            <strong className="tm-num">{fmtNum(breakdown.difficultyBonus, { sign: true })}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
              <button style={styles.btnPrimary} onClick={dismissSeasonRecap}>Continuer →</button>
              </div>
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
            <div className="tm-fade-up tm-paper" style={{ border: "3px solid " + T.ink, boxShadow: "6px 6px 0 " + T.ink, color: "#141414", maxWidth: 400, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
              <div className="tm-halftone-magenta" style={{ borderBottom: "3px solid " + T.ink, padding: "10px 14px" }}>
                <span style={{ display: "inline-block", background: T.ink, color: "#ffffff", fontSize: 10, fontWeight: 800, letterSpacing: 1, padding: "1px 6px", textTransform: "uppercase" }}>Défi</span>
                <div className="tm-display" style={{ fontSize: 22, lineHeight: 1.05, marginTop: 5, color: "#ffffff", textShadow: "2px 2px 0 " + T.ink }}>{def.name}</div>
              </div>
              <div style={{ padding: 14 }}>
              <div className="tm-lettering" style={{ fontSize: 16, lineHeight: 1.3, marginBottom: 12 }}>{def.context}</div>
              <div className="tm-halftone-yellow" style={{ border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, padding: "10px 12px", marginBottom: 12 }}>
                <div className="tm-display" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}><Icon name="target" size={16} color="#141414" /> {def.objectiveLabel}</div>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4, marginLeft: 24 }}>{def.deadlineLabel}</div>
              </div>
              {def.perks.map((pk, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, fontWeight: 600, lineHeight: 1.45, marginBottom: 6 }}>
                  <span style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#c9b6ea", border: "2px solid " + T.ink }}><Icon name="chevronRight" size={10} color="#141414" /></span> <span>{pk}</span>
                </div>
              ))}
              <button style={{ ...styles.btnPrimary, marginTop: 10 }} onClick={() => setPlayer(p => ({ ...p, challenge: { ...p.challenge, introSeen: true } }))}>C'est parti</button>
              </div>
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
            <div className="tm-fade-up tm-paper" style={{ border: "3px solid " + T.ink, boxShadow: "6px 6px 0 " + T.ink, color: "#141414", maxWidth: 380, width: "100%", maxHeight: "88vh", overflowY: "auto" }}>
              {/* Bandeau : jaune tramé si réussi, rouge tramé si échoué ; icône dans une case penchée */}
              <div className={ok ? "tm-halftone-yellow" : undefined} style={{ ...(ok ? {} : { background: "#c4302b", backgroundImage: "radial-gradient(rgba(20,20,20,0.22) 1.3px, transparent 1.5px)", backgroundSize: "6px 6px", color: "#ffffff" }), borderBottom: "3px solid " + T.ink, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ display: "inline-flex", width: 48, height: 48, flexShrink: 0, alignItems: "center", justifyContent: "center", background: "#ffffff", border: "3px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, transform: "rotate(-4deg)" }}>
                  <Icon name={ok ? "trophy" : "fail"} size={28} color={ok ? "#1f7a45" : "#c4302b"} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <span style={{ display: "inline-block", background: T.ink, color: "#ffffff", fontSize: 10.5, fontWeight: 800, letterSpacing: 1, padding: "1px 7px", textTransform: "uppercase" }}>{def ? def.name : "Défi"}</span>
                  <div className="tm-display" style={{ fontSize: 24, lineHeight: 1.05, marginTop: 4, color: ok ? "#141414" : "#ffffff", textShadow: ok ? "none" : "2px 2px 0 " + T.ink }}>{ok ? "Défi réussi !" : "Défi échoué"}</div>
                </div>
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {ok ? (
                <div className="tm-lettering" style={{ fontSize: 17, lineHeight: 1.25 }}>
                  Médaille <strong style={{ display: "inline-block", background: (MEDAL_INFO[res.medal] || {}).color, color: "#ffffff", border: "2px solid " + T.ink, padding: "0 6px", textShadow: "1px 1px 0 " + T.ink }}>{(MEDAL_INFO[res.medal] || {}).label}</strong> · {res.weeks} semaine{res.weeks > 1 ? "s" : ""}
                </div>
              ) : (
                <div className="tm-lettering" style={{ fontSize: 17, lineHeight: 1.25 }}>{res.reason}</div>
              )}
              <div style={{ background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, padding: "4px 12px 8px", textAlign: "left" }}>
                {(res.rows || []).map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "2px dashed " + T.ink }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ color: "#141414", fontSize: 12.5, fontWeight: 800 }}>{r.label}</span>
                      <span style={{ display: "block", color: "#141414", fontSize: 11, fontWeight: 600 }}>{r.detail}</span>
                    </span>
                    <span className="tm-num" style={{ color: "#141414", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{fmtNum(r.pts)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
                  <span className="tm-display" style={{ fontSize: 14 }}>Score du défi</span>
                  <span className="tm-display tm-num" style={{ background: "#5b2d8e", color: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, padding: "0 8px", fontSize: 17 }}>{fmtNum(res.score || 0)}</span>
                </div>
              </div>
              {!ok && def && (
                <button style={{ ...styles.btnPrimary, marginBottom: 0 }} onClick={() => startChallenge(def, { name: player.name, nationality: player.nationality, circuit: player.circuit || "atp" })}>Réessayer</button>
              )}
              <button style={{ ...styles.btnSecondary, boxShadow: "2px 2px 0 " + T.ink }} onClick={() => setPlayer(seen)}>{ok ? "Continuer la partie" : "Continuer quand même"}</button>
              <button style={styles.btnSecondary} onClick={() => returnToMenu(seen)}>Menu principal</button>
              </div>
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
            zIndex: 240, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}>
            <div className="tm-fade-up tm-paper" style={{
              border: "3px solid " + T.ink, boxShadow: "6px 6px 0 " + T.ink, color: "#141414",
              maxWidth: 380, width: "100%", maxHeight: "88vh", overflowY: "auto",
            }}>
              <div className={evDef ? "tm-halftone-magenta" : "tm-halftone-yellow"} style={{ borderBottom: "3px solid " + T.ink, padding: "10px 14px" }}>
                <span style={{ display: "inline-block", background: T.ink, color: "#ffffff", fontSize: 10, fontWeight: 800, letterSpacing: 1, padding: "1px 6px", textTransform: "uppercase" }}>{evDef ? "Défi · " + evDef.name : "Événement de la semaine"}</span>
                <div className="tm-display" style={{ fontSize: 19, lineHeight: 1.1, marginTop: 5, color: evDef ? "#ffffff" : "#141414", textShadow: evDef ? "2px 2px 0 " + T.ink : "none" }}>{ev.title}</div>
              </div>
              <div style={{ padding: 14 }}>
              <div className="tm-lettering" style={{ fontSize: 16, lineHeight: 1.3, marginBottom: 14 }}>
                {typeof ev.body === "function" ? ev.body(player) : ev.body}
              </div>
              {ev.options.map((opt, i) => {
                const eff = opt.effects || {};
                const chips = [];
                if (eff.money) chips.push({ label: fmtMoney(eff.money, { sign: true }), color: eff.money > 0 ? T.green : T.red });
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
                    background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink,
                    borderRadius: 0, color: "#141414", textAlign: "left",
                    cursor: "pointer", marginBottom: 10, fontFamily: T.body,
                    fontSize: 13,
                  }}>
                    <div className="tm-display" style={{ fontSize: 14, lineHeight: 1.15, marginBottom: 7 }}>{opt.label}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {chips.map((c, j) => (
                        <span key={j} style={{
                          fontSize: 10.5, fontWeight: 800, padding: "1px 6px",
                          borderRadius: 0, background: c.color, color: (c.color === T.amber || c.color === "var(--tm-amber)") ? "#141414" : "#ffffff", border: "2px solid " + T.ink,
                          display: "inline-flex", alignItems: "center", gap: 3,
                        }}>
                          {c.label}
                          {c.icon && <Icon name={c.icon} size={10} color={(c.color === T.amber || c.color === "var(--tm-amber)") ? "#141414" : "#ffffff"} />}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
              </div>
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
          <div className="tm-paper" style={{ position: "fixed", inset: 0, zIndex: 250, overflowY: "auto" }} onClick={() => setShowHallOfFame(false)}>
            <div onClick={e => e.stopPropagation()} style={{ maxWidth: 440, margin: "0 auto", minHeight: FULL_H, color: "#141414" }}>
              {/* En-tête BD : bandeau noir collant, compteur en tampon */}
              <div style={{ position: "sticky", top: 0, zIndex: 2, background: T.ink, color: "#ffffff", padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, borderBottom: "3px solid " + T.ink }}>
                <button aria-label="Fermer" onClick={() => setShowHallOfFame(false)} style={{ width: 34, height: 34, flexShrink: 0, background: "#ffffff", border: "2.5px solid " + T.ink, color: T.ink, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="x" size={18} strokeWidth={2.6} />
                </button>
                <div className="tm-display" style={{ flex: 1, fontSize: 22, lineHeight: 1, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="trophy" size={20} color="#d6ef3c" halo /> Hall of Fame
                </div>
                <span className="tm-display" style={{ background: "#d6ef3c", color: "#141414", border: "2.5px solid #ffffff", padding: "1px 8px", fontSize: 16, transform: "rotate(3deg)" }}>{got} / {total}</span>
              </div>

              {/* Récompenses à réclamer */}
              {claimableCount > 0 && (
                <div className="tm-halftone-yellow" style={{ margin: "14px 16px 0", padding: "10px 12px", border: "3px solid " + T.ink, boxShadow: "4px 4px 0 " + T.ink, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 34, height: 34, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "2.5px solid " + T.ink, transform: "rotate(-4deg)" }}>
                    <Icon name="money" size={18} color="#1f7a45" />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="tm-display" style={{ fontSize: 16 }}>{fmtMoney(claimableTotal)} à réclamer</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 1 }}>{claimableCount} récompense{claimableCount > 1 ? "s" : ""} en attente</div>
                  </div>
                  <button className="tm-display" onClick={claimAll} style={{ background: "#1f7a45", color: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, padding: "7px 10px", fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" }}>Tout réclamer</button>
                </div>
              )}

              {/* Catégories */}
              <div style={{ padding: 16 }}>
                {Object.entries(byCategory).map(([catKey, trophies]) => {
                  const cat = TROPHY_CATEGORIES[catKey];
                  const catGot = trophies.filter(t => unlocked.has(t.id)).length;
                  return (
                    <div key={catKey} style={{ marginBottom: 22 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span className="tm-display" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.ink, color: "#ffffff", padding: "2px 9px", fontSize: 13 }}>
                          <Icon name={cat.iconName} size={13} color="#d6ef3c" halo /> {cat.label}
                        </span>
                        <div style={{ flex: 1, borderTop: "2px dashed " + T.ink }} />
                        <span className="tm-num" style={{ fontSize: 12, fontWeight: 800 }}>{catGot} / {trophies.length}</span>
                      </div>

                      {trophies.map(t => {
                        const isUnlocked = unlocked.has(t.id);
                        const result = isUnlocked ? { unlocked: true } : t.check(player);
                        const rarity = RARITY[t.rarity];
                        const hasProgress = result.progress && !isUnlocked;
                        const reward = RARITY_REWARD[t.rarity] || 0;
                        const isClaimed = claimed.has(t.id);
                        return (
                          <div key={t.id} style={{
                            background: isUnlocked ? "#ffffff" : "#eeeae0", marginBottom: 10,
                            border: "2.5px solid " + T.ink, boxShadow: isUnlocked ? "3px 3px 0 " + T.ink : "none",
                            opacity: isUnlocked ? 1 : 0.75, display: "flex", alignItems: "stretch",
                          }}>
                            {/* Médaille à la couleur de la rareté */}
                            <div style={{ width: 52, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isUnlocked ? rarity.color : "#d9d4c7", borderRight: "2.5px solid " + T.ink }}>
                              <span style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "2.5px solid " + T.ink }}>
                                <Icon name={isUnlocked ? "trophy" : "lock"} size={17} color={isUnlocked ? rarity.color : "#8a8478"} strokeWidth={2.2} />
                              </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0, padding: "8px 10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span className="tm-display" style={{ fontSize: 14, lineHeight: 1.15 }}>{t.name}</span>
                                <span style={{ background: isUnlocked ? rarity.color : "#ffffff", color: isUnlocked ? "#ffffff" : "#141414", border: "2px solid " + T.ink, fontSize: 9.5, fontWeight: 800, padding: "0 5px", textTransform: "uppercase" }}>{rarity.label}</span>
                              </div>
                              <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 3, lineHeight: 1.4 }}>{t.desc}</div>
                              {hasProgress && (
                                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                                  <div style={{ flex: 1, height: 9, background: "#ffffff", border: "2px solid " + T.ink }}>
                                    <div style={{ height: "100%", width: Math.min(100, result.progress.current / result.progress.target * 100) + "%", background: "#d6ef3c", borderRight: "2px solid " + T.ink }} />
                                  </div>
                                  <span className="tm-num" style={{ fontSize: 10.5, fontWeight: 800 }}>{fmtNum(result.progress.current)} / {fmtNum(result.progress.target)}</span>
                                </div>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", padding: "0 10px 0 4px", flexShrink: 0 }}>
                              {isUnlocked && !isClaimed ? (
                                <button className="tm-display" onClick={(e) => { e.stopPropagation(); claimTrophy(t.id, reward); }} style={{ background: "#1f7a45", color: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, padding: "5px 8px", fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" }}>{fmtMoney(reward, { sign: true })}</button>
                              ) : isUnlocked ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 800 }}><Icon name="check" size={12} color="#1f7a45" strokeWidth={3} /> {fmtMoney(reward)}</span>
                              ) : (
                                <span style={{ fontSize: 11, fontWeight: 800, color: "#6f6a5f" }}>{fmtMoney(reward, { sign: true })}</span>
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
          <div style={{ position: "fixed", inset: 0, background: T.overlay, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 300 }} onClick={() => setConfirmCancelSponsor(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "6px 6px 0 " + T.ink, maxWidth: 360, width: "100%" }}>
              <div className="tm-display" style={{ background: "#c4302b", color: "#ffffff", fontSize: 18, padding: "6px 12px", borderBottom: "3px solid " + T.ink }}>Résiliation</div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="tm-lettering" style={{ fontSize: 17, lineHeight: 1.25 }}>Résilier le contrat avec {s.brand} ?</div>
                <div style={{ border: "2px solid " + T.ink, padding: "4px 10px" }}>
                  {[
                    ["Indemnité de rupture (6 mois au plus)", rupture],
                    ...(objPenalty > 0 ? [["Objectif non atteint", objPenalty]] : []),
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5, fontWeight: 600, padding: "5px 0", borderBottom: "1.5px dashed " + T.ink }}>
                      <span>{l}</span><span className="tm-num" style={{ color: "#c4302b", fontWeight: 800 }}>{fmtMoney(-v, { sign: true })}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                    <span className="tm-display" style={{ fontSize: 13.5 }}>Total</span>
                    <span className="tm-display" style={{ background: "#c4302b", color: "#ffffff", border: "2px solid " + T.ink, padding: "0 7px", fontSize: 14 }}>{fmtMoney(-penalty, { sign: true })}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.45 }}>
                  Vous perdrez le revenu hebdomadaire de {fmtMoney(s.weeklyPay)} et le bonus titre de {fmtMoney(s.titleBonus)}.
                </div>
                <button style={{ ...styles.btnPrimary, background: "#c4302b" }} onClick={() => { cancelSponsor(s); setConfirmCancelSponsor(null); }}>Confirmer la résiliation</button>
                <button style={styles.btnSecondary} onClick={() => setConfirmCancelSponsor(null)}>Annuler</button>
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
          <div style={{ position: "fixed", inset: 0, background: T.overlay, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 300 }} onClick={() => setSponsorReplaceModal(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", color: "#141414", border: "3px solid " + T.ink, boxShadow: "6px 6px 0 " + T.ink, maxWidth: 400, width: "100%" }}>
              <div className="tm-display" style={{ background: "#e0a21b", color: "#141414", fontSize: 18, padding: "6px 12px", borderBottom: "3px solid " + T.ink }}>Remplacer un sponsor</div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="tm-lettering" style={{ fontSize: 17, lineHeight: 1.25 }}>
                  Vous avez déjà atteint la limite d'{catLabel}{(offer.cat === "other") ? "s" : ""}…
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.45 }}>
                  Pour signer avec <strong>{offer.brand}</strong>, choisissez un sponsor à résilier. Le coût de résiliation sera prélevé (indemnité de rupture, plus la pénalité d'objectif si celui-ci n'est pas atteint).
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
                        width: "100%", textAlign: "left", fontFamily: T.body, color: "#141414",
                        background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink,
                        borderRadius: 0, padding: 10, cursor: canAfford ? "pointer" : "not-allowed",
                        opacity: canAfford ? 1 : 0.5, display: "flex", alignItems: "center", gap: 10,
                      }}
                    >
                      <span style={{ width: 28, height: 28, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#c4302b", color: "#ffffff", border: "2px solid " + T.ink, fontWeight: 800, fontSize: 14 }}>✕</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="tm-display" style={{ fontSize: 14 }}>{s.brand}</div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 2 }}>{fmtMoney(s.weeklyPay)}/sem · {s.weeksLeft} sem. restantes</div>
                      </div>
                      <span className="tm-display" style={{ flexShrink: 0, background: "#c4302b", color: "#ffffff", border: "2px solid " + T.ink, padding: "0 6px", fontSize: 13 }}>{fmtMoney(-penalty, { sign: true })}</span>
                    </button>
                  );
                })}
                <button style={styles.btnSecondary} onClick={() => setSponsorReplaceModal(null)}>Annuler</button>
              </div>
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
            <div className="tm-paper" style={{ border: "3px solid " + T.ink, boxShadow: "6px 6px 0 " + T.ink, maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto", color: "#141414" }} onClick={e => e.stopPropagation()}>
              {/* En-tête : bandeau à la couleur de la catégorie */}
              <div style={{ background: tierColor(t.tier), borderBottom: "3px solid " + T.ink, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ display: "inline-block", background: "#ffffff", color: "#141414", border: "2px solid " + T.ink, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, padding: "0 6px", textTransform: "uppercase" }}>{tierLabel(t.tier)}</span>
                  <div className="tm-display" style={{ color: "#ffffff", fontSize: 22, lineHeight: 1.05, marginTop: 5, textShadow: "2px 2px 0 " + T.ink, overflowWrap: "anywhere" }}>{t.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ffffff", fontSize: 12.5, fontWeight: 800, marginTop: 4 }}><FlagFromEmoji emoji={cityInfo?.flag} size={14} /> {t.city}, {cityInfo?.country}</div>
                </div>
                <button aria-label="Fermer" style={{ background: "#ffffff", border: "2px solid " + T.ink, color: T.ink, fontSize: 16, fontWeight: 800, cursor: "pointer", width: 32, height: 32, flexShrink: 0 }} onClick={() => setTournamentDetail(null)}>✕</button>
              </div>

              <div style={{ padding: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[
                    ["Surface", <span key="s" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><SurfaceIcon name={t.surface} size={16} />{t.surface}</span>, "#141414"],
                    ["Semaine", "Semaine " + t.week, "#141414"],
                    ["Dotation totale", fmtMoney(t.prize), "#1f7a45"],
                    ["Points (vainqueur)", fmtNum(t.points) + "\u00a0pts", "#5b2d8e"],
                  ].map(([l, v, c]) => (
                    <div key={l} style={{ background: "#ffffff", border: "2px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink, padding: "6px 8px" }}>
                      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>{l}</div>
                      <div style={{ color: c, fontFamily: T.display, fontSize: 16, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>

                {[
                  ["clipboard", "Format", [
                    ["Tableau principal", fmt.drawSize + " joueurs"],
                    ["Tours", fmt.mainRounds.length + " (" + fmt.mainRounds.join(" → ") + ")"],
                    ["Format", (fmt.setsToWin === 3 && !isWTA() ? "3 sets gagnants" : "2 sets gagnants") + (fmt.setsToWin === 3 && !isWTA() && (fmt.qualiRounds || 0) > 0 ? " · qualifs en 2 sets gagnants" + (t.id === "wimbledon" ? " (3 au dernier tour)" : "") : "")],
                    ["Têtes de série", getSeedCount(fmt) + (fmt.byeSeeds > 0 ? " · exemption au 1er tour pour le top " + fmt.byeSeeds : "")],
                    ["Qualifications", fmt.qualiRounds + " tours"],
                  ]],
                  ["target", "Critères d'accès", [
                    ["Entrée directe", "top " + fmt.directCut],
                    ["Qualifs ouvertes", "jusqu'au top " + (fmt.qualiCut === 9999 ? "∞" : fmt.qualiCut)],
                  ]],
                ].map(([icon, title, rows]) => (
                  <div key={title} style={{ background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, marginBottom: 12 }}>
                    <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 13, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}><Icon name={icon} size={12} color="#d6ef3c" halo /> {title}</div>
                    <div style={{ padding: "2px 10px 6px" }}>
                      {rows.map(([l, v], i) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "5px 0", borderBottom: i < rows.length - 1 ? "1.5px dashed " + T.ink : "none", fontSize: 12.5 }}>
                          <span style={{ fontWeight: 600 }}>{l}</span>
                          <strong style={{ textAlign: "right" }}>{v}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="tm-halftone-yellow" style={{ border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, marginBottom: 12 }}>
                  <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 13, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}><Icon name="user" size={12} color="#d6ef3c" /> Votre situation</div>
                  <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ background: "#ffffff", border: "2px solid " + T.ink, padding: "0 6px", fontWeight: 800 }}>#{ranking}</span>
                      {entry.status === "direct" && <span style={{ background: "#1f7a45", color: "#ffffff", border: "2px solid " + T.ink, padding: "0 6px", fontWeight: 800 }}>✓ Entrée directe{entry.protected ? " (classement protégé)" : ""}</span>}
                      {entry.status === "qualifying" && <span style={{ background: "#e0a21b", border: "2px solid " + T.ink, padding: "0 6px", fontWeight: 800 }}>Qualifs requises</span>}
                      {entry.status === "blocked" && <span style={{ background: "#c4302b", color: "#ffffff", border: "2px solid " + T.ink, padding: "0 6px", fontWeight: 800 }}>Classement insuffisant</span>}
                      {playerIsSeed && <span style={{ background: "#ffffff", border: "2px solid " + T.ink, padding: "0 6px", fontWeight: 800 }}>Tête de série · exempté au 1er tour</span>}
                    </div>
                    <div>Distance : {fmtKm(dist)} ({fmtMoney(travelCost)} de voyage)</div>
                    {t.entryFee > 0 && <div>Frais d'inscription : {fmtMoney(t.entryFee)}</div>}
                  </div>
                </div>

                <button style={styles.btnSecondary} onClick={() => setTournamentDetail(null)}>Fermer</button>
              </div>
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
            <div className="tm-paper" style={{ padding: 14, border: "3px solid " + T.ink, boxShadow: "6px 6px 0 " + T.ink, maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto", color: "#141414" }} onClick={e => e.stopPropagation()}>
              {/* En-tête : portrait, rang, nom, pays, style */}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ border: "3px solid " + T.ink, background: "#ffffff", boxShadow: "3px 3px 0 " + T.ink, flexShrink: 0, transform: "rotate(-2deg)" }}>
                  <Avatar config={aiAvatar(p, player.circuit === "wta")} size={78} bare />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="tm-num" style={{ display: "inline-block", background: T.gold, border: "2px solid " + T.ink, fontSize: 12, fontWeight: 800, padding: "0 6px" }}>#{adjustedRank} mondial</span>
                  <div className="tm-display" style={{ fontSize: 21, lineHeight: 1.05, marginTop: 5, overflowWrap: "anywhere" }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, marginTop: 4 }}><FlagFromEmoji emoji={p.nat.flag} size={13} />{p.nat.country} · {styleInfo.name}</div>
                </div>
                <button aria-label="Fermer" style={{ background: "#ffffff", border: "2px solid " + T.ink, color: T.ink, fontSize: 16, fontWeight: 800, cursor: "pointer", width: 32, height: 32, flexShrink: 0 }} onClick={() => setAtpPlayerDetail(null)}>✕</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ background: "#ffffff", border: "2px solid " + T.ink, padding: "6px 8px" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>Points ATP</div>
                  <div style={{ color: "#5b2d8e", fontFamily: T.display, fontSize: 18 }}>{fmtNum(p.points)}</div>
                </div>
                <div style={{ background: "#ffffff", border: "2px solid " + T.ink, padding: "6px 8px" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>Âge</div>
                  <div style={{ color: T.fg, fontFamily: T.display, fontSize: 18 }}>{p.age || "—"} ans</div>
                </div>
                <div style={{ background: "#ffffff", border: "2px solid " + T.ink, padding: "6px 8px" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>Cote globale</div>
                  <div style={{ color: T.fg, fontFamily: T.display, fontSize: 18 }}>{getRating(p.stats)}</div>
                </div>
                <div style={{ background: "#ffffff", border: "2px solid " + T.ink, padding: "6px 8px" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>Win rate (saison)</div>
                  <div style={{ color: "#1f7a45", fontFamily: T.display, fontSize: 18 }}>{winRate}%</div>
                </div>
              </div>

              <div style={{ background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, padding: 12, marginBottom: 12 }}>
                <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 13, margin: "-12px -12px 10px", padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}><Icon name="chart" size={11} /> Saison en cours</div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#141414", fontSize: 12.5, fontWeight: 600, padding: "4px 0", borderBottom: "2px dashed " + T.ink }}>
                  <span>Victoires</span><strong className="tm-num" style={{ color: "#1f7a45" }}>{p.seasonWins}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#141414", fontSize: 12.5, fontWeight: 600, padding: "4px 0", borderBottom: "2px dashed " + T.ink }}>
                  <span>Défaites</span><strong className="tm-num" style={{ color: "#c4302b" }}>{p.seasonLosses}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#141414", fontSize: 12.5, fontWeight: 600, padding: "4px 0", borderBottom: "2px dashed " + T.ink }}>
                  <span>Titres</span><strong className="tm-num" style={{ color: "#5b2d8e", display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="trophy" size={11} /> {p.seasonTitles}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#141414", fontSize: 12.5, fontWeight: 600, padding: "4px 0" }}>
                  <span>Gains saison</span><strong className="tm-num" style={{ color: "#1f7a45" }}>{fmtMoney(p.seasonEarnings || 0)}</strong>
                </div>
              </div>

              <div style={{ background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, padding: 12, marginBottom: 12 }}>
                <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 13, margin: "-12px -12px 10px", padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}><Icon name="target" size={11} /> Profil</div>
                <div style={{ color: "#141414", fontSize: 12.5, fontWeight: 600, lineHeight: 1.9 }}>
                  Point fort : <strong style={{ background: "#1f7a45", color: "#ffffff", border: "2px solid " + T.ink, padding: "0 5px" }}>{profile.strength.label} ({Math.round(profile.strength.value)})</strong><br />
                  Point faible : <strong style={{ background: "#c4302b", color: "#ffffff", border: "2px solid " + T.ink, padding: "0 5px" }}>{profile.weakness.label} ({Math.round(profile.weakness.value)})</strong>
                </div>
              </div>

              <div style={{ background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, padding: 12, marginBottom: 12 }}>
                <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 13, margin: "-12px -12px 10px", padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}><Icon name="trending" size={11} /> Compétences</div>
                {Object.entries(p.stats).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                      <span style={{ color: "#141414", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.3 }}>{statLabels[k] || k}</span>
                      <span className="tm-num" style={{ color: "#141414", fontWeight: 800 }}>{Math.round(v)}</span>
                    </div>
                    <div style={{ height: 10, background: "#ffffff", border: "2px solid " + T.ink, overflow: "hidden" }}>
                      <div style={{ width: v + "%", height: "100%", background: v >= 80 ? "#1f7a45" : v >= 60 ? "#e0a21b" : "#5b2d8e", borderRight: v < 100 ? "2px solid " + T.ink : "none", boxSizing: "border-box" }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, padding: 12, marginBottom: 12 }}>
                <div className="tm-display" style={{ background: T.ink, color: "#ffffff", fontSize: 13, margin: "-12px -12px 10px", padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}>Derniers résultats</div>
                {p.recentResults && p.recentResults.length > 0 ? (
                  p.recentResults.slice(0, 6).map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < Math.min(5, p.recentResults.length - 1) ? "1.5px dashed " + T.ink : "none", fontSize: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div
                          onClick={tournamentIdByName(r.tournament) ? () => setTournamentDetail(tournamentIdByName(r.tournament)) : undefined}
                          style={{ color: "#141414", fontWeight: 700, cursor: tournamentIdByName(r.tournament) ? "pointer" : "default", textDecoration: tournamentIdByName(r.tournament) ? "underline" : "none", textDecorationColor: T.ink, textDecorationThickness: 2, textUnderlineOffset: 3 }}
                        >{r.tournament}</div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 2, background: r.isWinner ? "#d6ef3c" : "#ffffff", color: "#141414", border: "2px solid " + T.ink, fontSize: 10, fontWeight: 800, padding: "0 5px" }}>{r.isWinner && <Icon name="trophy" size={10} />} {r.roundReached}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="tm-num" style={{ color: "#1f7a45", fontSize: 11.5, fontWeight: 800 }}>{fmtMoney(r.prize, { sign: true })}</div>
                        <div className="tm-num" style={{ color: "#5b2d8e", fontSize: 11, fontWeight: 800 }}>+{r.pts}p</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="tm-lettering" style={{ color: "#141414", fontSize: 15, lineHeight: 1.25, background: "#ffffff", border: "2px dashed " + T.ink, padding: "6px 9px", textAlign: "center" }}>Aucun résultat enregistré — avancez quelques semaines.</div>
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

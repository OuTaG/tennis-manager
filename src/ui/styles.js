// Styles partagés des composants.
import { T } from "./theme.js";

// ─── STYLES : DA « gazette BD » ─────────────────────────────────────────────
// Cases de BD cernées d'encre avec une ombre décalée, angles droits,
// papier journal tramé sur tout l'écran, boutons d'impression pleins.
export const RADIUS = 0;
export const INK_BORDER = "2.5px solid " + T.ink;
// Papier journal tramé (fond de l'écran, bandeaux du haut et du bas).
export const PAPER = {
  backgroundColor: T.bg0,
  backgroundImage: "radial-gradient(" + T.dot + " 1.1px, transparent 1.3px)",
  backgroundSize: "6px 6px",
};
export const cardBase = {
  background: T.bg1,
  border: INK_BORDER,
  borderRadius: RADIUS,
  boxShadow: "3px 3px 0 " + T.ink,
};

export const styles = {
  // ROOT / LAYOUT
  root: { ...PAPER, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: T.body, color: T.fg, maxWidth: 440, margin: "0 auto", position: "relative" },
  screen: { flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" },
  content: { flex: 1, overflowY: "auto", paddingBottom: 110 },

  header: {
    background: T.bg1, padding: "14px 16px",
    borderBottom: "1px solid " + T.brd,
    display: "flex", alignItems: "center", gap: 12,
  },
  // TOP BAR — simple, opaque, sans verre dépoli
  topBar: {
    position: "sticky", top: 0, zIndex: 50,
    ...PAPER,
    padding: "10px 14px 8px",
    display: "flex", flexDirection: "column", gap: 7,
  },


  // BOTTOM NAV — rangée de cases, la rubrique active en jaune
  bottomNav: {
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
    width: "100%", maxWidth: 440,
    background: T.bg1,
    borderTop: "3px solid " + T.ink,
    display: "flex", justifyContent: "space-between",
    padding: "0 0 env(safe-area-inset-bottom, 0px)", zIndex: 100,
  },
  navBtn: {
    flex: 1, minWidth: 0, minHeight: 56,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
    background: "none", border: "none", borderRight: "2px solid " + T.ink, color: T.fg, cursor: "pointer",
    padding: "7px 2px 6px", borderRadius: 0,
    fontFamily: T.body, textTransform: "uppercase", letterSpacing: 0.5,
  },
  navBtnActive: { background: T.gold, color: "#161616" },

  // Sous-onglets (segmented control)
  subTabs: {
    display: "flex", gap: 0, padding: 0, margin: "12px 16px 0",
    background: T.bg1, border: INK_BORDER, borderRadius: 0,
  },
  subTab: {
    flex: 1, padding: "10px 8px", minHeight: 44, border: "none", borderRadius: 0,
    background: "transparent", color: T.fg, cursor: "pointer",
    fontFamily: T.body, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
  subTabActive: { background: T.ink, color: T.paper },

  // MENU
  menuBg: {
    minHeight: "100vh",
    ...PAPER,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    position: "relative",
  },
  menuCard: {
    ...cardBase,
    borderRadius: 0, padding: 28,
    width: "100%", maxWidth: 380,
    display: "flex", flexDirection: "column", alignItems: "stretch", gap: 14,
    position: "relative", overflow: "hidden",
    boxShadow: "6px 6px 0 " + T.ink,
  },
  courtLines: { position: "absolute", inset: 0, opacity: 0, pointerEvents: "none" },
  courtLine: { position: "absolute", left: "5%", right: "5%", height: 1, background: T.green },
  menuLogo: { fontSize: 48, textAlign: "center", marginBottom: 4 },
  menuTitle: {
    color: T.gold, background: T.ink, fontSize: 36, fontWeight: 400, textAlign: "center",
    margin: "0 auto", padding: "6px 14px 8px", transform: "rotate(-2deg)", alignSelf: "center",
    letterSpacing: -0.5, fontFamily: T.display, lineHeight: 1, textTransform: "uppercase",
  },
  menuSub: { color: T.clay, fontSize: 18, fontFamily: T.display, fontWeight: 500, display: "block", marginTop: 2 },
  // Récitatif de BD : encadré blanc, lettrage à la main.
  menuTagline: {
    color: "#161616", background: "#ffffff", fontFamily: T.hand, fontWeight: 700,
    fontSize: 16, lineHeight: 1.25, textAlign: "center",
    border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink,
    padding: "8px 12px", margin: "0 0 20px", transform: "rotate(0.6deg)",
  },

  // BUTTONS — pleins, arrondis, avec un liseré qui les rend "pressables"
  btnPrimary: {
    display: "block", width: "100%", padding: "13px 18px", minHeight: 52,
    background: T.magenta, color: "#ffffff", border: "3px solid " + T.ink,
    borderRadius: 0, fontSize: 19, fontWeight: 400,
    cursor: "pointer", letterSpacing: 0.3,
    fontFamily: T.display, textTransform: "uppercase",
    boxShadow: "4px 4px 0 " + T.ink,
    marginBottom: 4,
    transition: "transform 0.08s, box-shadow 0.08s",
  },
  btnSecondary: {
    display: "block", width: "100%", padding: "12px 16px", minHeight: 48,
    background: T.bg1, color: T.fg,
    border: INK_BORDER,
    borderRadius: 0, fontSize: 14, fontWeight: 800,
    cursor: "pointer", fontFamily: T.body, textTransform: "uppercase", letterSpacing: 0.4,
  },
  btnSmall: {
    padding: "9px 14px", minHeight: 40,
    background: T.bg1, color: T.fg,
    border: "2px solid " + T.ink,
    borderRadius: 0, fontSize: 12.5, fontWeight: 800,
    cursor: "pointer", fontFamily: T.body, letterSpacing: 0.3, textTransform: "uppercase",
  },

  // INPUTS
  inputGroup: { width: "100%" },
  label: { color: T.fg3, fontSize: 13, display: "block", marginBottom: 8, fontWeight: 600 },
  input: {
    width: "100%", padding: "13px 14px",
    background: T.bg1, border: INK_BORDER,
    borderRadius: 0, color: T.fg, fontSize: 15, outline: "none",
    boxSizing: "border-box", fontFamily: T.body,
  },

  // STYLE BUTTONS
  styleGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 },
  styleBtn: {
    background: T.bg1, border: INK_BORDER,
    borderRadius: 0, padding: 12,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    cursor: "pointer", color: T.fg, transition: "box-shadow 0.12s",
  },
  styleBtnActive: { border: INK_BORDER, background: T.gold, color: "#161616", boxShadow: "3px 3px 0 " + T.ink },

  // STAT PREVIEW
  statPreview: { width: "100%", background: T.bg2, borderRadius: 0, padding: 14, boxSizing: "border-box", border: "1px solid " + T.brd },
  statBarRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  statLabel: { color: T.fg3, fontSize: 12, width: 80, flexShrink: 0, fontWeight: 500 },
  statBarBg: { flex: 1, height: 8, background: T.bg3, borderRadius: 4, overflow: "hidden" },
  statBarFill: { height: "100%", background: T.green, borderRadius: 4, transition: "width 0.3s" },
  statVal: { color: T.fg2, fontSize: 12, width: 30, textAlign: "right", fontFamily: T.body, fontVariantNumeric: "tabular-nums" },

  // NOTIF — toast en bas, au-dessus du dock (zone du pouce)
  notif: {
    position: "fixed", bottom: 96, top: "auto", left: "50%", transform: "translateX(-50%)",
    padding: "11px 16px", borderRadius: 0,
    color: T.fg, fontSize: 14, fontWeight: 500,
    zIndex: 999, width: "calc(100% - 40px)", maxWidth: 380, textAlign: "left",
    background: T.bg1, border: INK_BORDER, boxShadow: "4px 4px 0 " + T.ink,
    borderLeftWidth: 6,
    boxShadow: "0 6px 20px " + T.shadow,
    fontFamily: T.body,
  },

  // SECTIONS / HEADERS
  section: { padding: "16px", borderBottom: "1px solid " + T.brd },
  tabContent: { padding: "16px 16px 0" },
  sectionTitle: {
    color: T.fg, fontSize: 24, fontWeight: 400,
    letterSpacing: -0.2, textTransform: "uppercase",
    marginBottom: 14, fontFamily: T.display, lineHeight: 1.05,
    borderBottom: "3px solid " + T.ink, paddingBottom: 4,
  },

  // CARDS
  playerCard: {
    ...cardBase,
    display: "flex", gap: 14, alignItems: "center",
    padding: 18, marginBottom: 14,
    position: "relative", overflow: "hidden",
  },
  bigAvatar: {
    fontSize: 36, background: T.bg2, borderRadius: 0, padding: 12,
    border: "1px solid " + T.brd,
  },
  badge: {
    background: T.bg1, color: T.fg,
    borderRadius: 0, padding: "3px 8px",
    fontSize: 11.5, fontWeight: 800,
    border: "2px solid " + T.ink, letterSpacing: 0.3, textTransform: "uppercase",
  },

  // ENERGY
  energyBar: { display: "flex", alignItems: "center", gap: 12 },
  energyLabel: { color: T.fg3, fontSize: 12, fontWeight: 600, flexShrink: 0, width: 70 },
  energyTrack: { flex: 1, height: 8, background: T.bg3, borderRadius: 4, overflow: "hidden" },
  energyFill: { height: "100%", borderRadius: 4, transition: "width 0.4s ease-out" },
  energyVal: { color: T.fg, fontWeight: 600, fontSize: 13, width: 44, textAlign: "right", fontFamily: T.body, fontVariantNumeric: "tabular-nums" },

  // QUICK GRID
  quickGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 },
  quickCard: { ...cardBase, padding: "12px 6px", textAlign: "center" },
  quickVal: { color: T.fg, fontWeight: 800, fontSize: 24, fontFamily: T.display, fontVariantNumeric: "tabular-nums" },
  quickLbl: { color: T.fg4, fontSize: 11, fontWeight: 500, marginTop: 2 },

  // ALERT BOXES
  alertBox: {
    background: T.bg1, border: INK_BORDER, borderLeft: "8px solid " + T.gold,
    borderRadius: 0, padding: 13,
    color: T.fg, fontSize: 13, marginBottom: 12,
    lineHeight: 1.5,
  },
  statusRow: { ...cardBase, padding: "4px 14px", marginBottom: 14 },
  statusItem: {
    display: "flex", justifyContent: "space-between",
    padding: "11px 0", borderBottom: "1px solid " + T.brd,
    fontSize: 13, color: T.fg3, alignItems: "center",
  },

  // MATCH
  vsCard: {
    ...cardBase,
    display: "flex", alignItems: "center", justifyContent: "space-around",
    margin: 16, padding: 18, position: "relative", overflow: "hidden",
  },
  vsPlayer: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, zIndex: 1 },
  vsAvatar: { fontSize: 28 },
  vsName: { color: T.fg, fontWeight: 600, fontSize: 14, textAlign: "center" },
  vsRating: { color: T.green, fontSize: 12, fontWeight: 600, fontFamily: T.mono },
  vsVs: { color: T.clay, fontWeight: 600, fontSize: 22, fontFamily: T.display, zIndex: 1 },

  // SCOREBOARD
  scoreBoard: { ...cardBase, margin: "0 16px 14px", padding: 16 },
  scoreRowHeader: {
    display: "flex", alignItems: "center", marginBottom: 10,
    color: T.fg4, fontSize: 11, fontWeight: 600,
  },
  scoreSetHeader: { width: 38, textAlign: "center" },
  scoreRow: { display: "flex", alignItems: "center", marginBottom: 8 },
  scoreName: { color: T.fg, fontWeight: 600, fontSize: 14, flex: 1 },
  scoreSet: {
    fontSize: 24, fontWeight: 600, width: 38, textAlign: "center",
    fontFamily: T.body, fontVariantNumeric: "tabular-nums",
    position: "relative", color: T.fg,
  },
  tbSup: { fontSize: 9, color: T.fg4, marginLeft: 2, fontFamily: T.mono },

  // EVENT FEED
  eventFeed: { padding: "14px 16px", maxHeight: 260, overflowY: "auto" },
  eventItem: {
    background: T.bg1, borderRadius: 0, padding: "11px 14px",
    marginBottom: 8, color: T.fg, fontSize: 14, lineHeight: 1.45,
    border: "2px solid " + T.ink,
    animation: "tm-fade-up 0.25s ease-out both",
  },

  infoChip: {
    background: T.bg2, border: "1px solid " + T.brd,
    borderRadius: 0, padding: "5px 11px",
    color: T.fg3, fontSize: 12, fontWeight: 500,
    letterSpacing: 0, textTransform: "none",
  },
  resultPill: {
    background: T.bg1, borderRadius: 0, padding: "12px 18px",
    color: T.fg, fontWeight: 600, fontSize: 15,
    border: "1px solid " + T.brd2, fontFamily: T.mono,
  },

  // FILTERS — pastilles arrondies
  filterGroup: { marginBottom: 12 },
  filterLabel: { color: T.fg4, fontSize: 12, fontWeight: 600, marginBottom: 6 },
  filterBtn: {
    padding: "7px 12px", background: T.bg1,
    border: "2px solid " + T.ink, borderRadius: 0,
    color: T.fg, fontSize: 12.5, fontWeight: 700,
    cursor: "pointer", fontFamily: T.body, letterSpacing: 0,
  },
  filterBtnActive: { border: "2px solid " + T.ink, color: "#161616", background: T.gold },

  // TOURNAMENT CARDS
  tournCard: { ...cardBase, padding: 16, marginBottom: 10, cursor: "pointer" },
  tournHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 10 },
  tierBadge: { fontSize: 11, fontWeight: 600, textAlign: "right", flexShrink: 0 },
  tournChip: { background: T.bg2, borderRadius: 0, padding: "4px 9px", fontSize: 12, color: T.fg3, fontWeight: 500, border: "1px solid " + T.brd },

  // TRAINING/STAFF
  trainingCard: { ...cardBase, padding: 16, marginBottom: 10 },
  staffCard: { ...cardBase, padding: 14, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" },

  // ATP / STATS
  atpCard: { ...cardBase, padding: 20, marginBottom: 14, position: "relative", overflow: "hidden" },
  skillsCard: { ...cardBase, padding: 16, marginBottom: 14 },
  historyCard: { background: T.bg2, borderRadius: 0, padding: 12, marginBottom: 6, border: "1px solid " + T.brd },

  momentumChip: {
    background: T.bg1, border: "2px solid " + T.ink,
    borderRadius: 0, padding: "5px 10px",
    fontSize: 12, fontWeight: 800, flexShrink: 0,
  },

  // DILEMMA — "bottom sheet", à portée de pouce
  dilemmaOverlay: {
    position: "fixed", inset: 0,
    background: T.overlay,
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    padding: 0, zIndex: 50,
  },
  dilemmaCard: {
    background: T.bg1, borderRadius: "22px 22px 0 0", padding: "18px 18px calc(22px + env(safe-area-inset-bottom, 0px))",
    borderTop: "1px solid " + T.brd2,
    maxWidth: 440, width: "100%", maxHeight: "85vh", overflowY: "auto",
    boxShadow: "0 -6px 24px " + T.shadow,
    animation: "tm-fade-up 0.25s ease-out both",
  },
  dilemmaBtn: {
    width: "100%", padding: "12px 14px",
    background: T.bg2, border: "1px solid " + T.brd2,
    borderRadius: 0, color: T.fg, textAlign: "left",
    cursor: "pointer", marginBottom: 8, fontFamily: T.body,
    fontSize: 14, transition: "background 0.15s",
  },

  // ATP ROW
  atpRow: {
    background: T.bg1, borderRadius: 0, padding: "11px 14px",
    marginBottom: 4, display: "flex", alignItems: "center",
    justifyContent: "space-between",
    border: "1px solid " + T.brd, cursor: "pointer",
  },

  // NEWS
  newsCard: { ...cardBase, padding: 18, marginBottom: 12 },
};

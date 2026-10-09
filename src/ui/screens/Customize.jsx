// Écran « Personnalisation » (achat de la boutique) : modifier le nom, la
// nationalité et le portrait de tous les joueurs de la base, dans trois
// configurations enregistrées sur l'appareil. La base « Standard » ne
// change jamais.
import { useMemo, useRef, useState } from "react";
import { NAT_BY_CODE } from "../../data/names.js";
import { ROSTER_SLOTS, baseRoster, loadRosterConfigs, rosterEditCount, rosterEntries, saveRosterConfigs, setRosterEdit } from "../../engine/roster.js";
import { Avatar, AvatarBuilder, aiAvatar } from "../avatar.jsx";
import { FlagFromEmoji, Icon } from "../icons.jsx";
import { BoxShade } from "../scrollShade.jsx";
import { FULL_H, styles } from "../styles.js";
import { T } from "../theme.js";

const INK = "#141414";
const PER_PAGE = 40;
const NATS = Object.values(NAT_BY_CODE).sort((a, b) => a.country.localeCompare(b.country, "fr"));

const band = (txt) => (
  <div className="tm-display" style={{ background: INK, color: "#ffffff", fontSize: 14, padding: "4px 10px" }}>{txt}</div>
);

export function CustomizeScreen({ onBack }) {
  const [configs, setConfigs] = useState(() => loadRosterConfigs());
  const [slot, setSlot] = useState(0);
  const [circuit, setCircuitTab] = useState("atp");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null); // { index, name, code, avatar }
  const [confirmReset, setConfirmReset] = useState(false);
  const sheetRef = useRef(null);
  const female = circuit === "wta";
  const cfg = configs[slot];

  const update = (nextCfg) => {
    const next = configs.map((c, i) => (i === slot ? nextCfg : c));
    setConfigs(next);
    saveRosterConfigs(next);
  };

  const entries = useMemo(() => rosterEntries(cfg, circuit), [cfg, circuit]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? entries.filter(e => e.name.toLowerCase().includes(q) || e.nat.country.toLowerCase().includes(q)) : entries;
  }, [entries, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const curPage = Math.min(page, pages - 1);
  const shown = filtered.slice(curPage * PER_PAGE, (curPage + 1) * PER_PAGE);

  const openEditor = (e) => setEditing({ index: e.index, name: e.name, code: e.code, avatar: e.avatar || aiAvatar({ name: baseRoster(circuit)[e.index].name }, female), edited: e.edited });
  const saveEditor = () => {
    const base = baseRoster(circuit)[editing.index];
    const name = editing.name.trim() || base.name;
    const edit = {};
    if (name !== base.name) edit.name = name;
    if (editing.code !== base.code) edit.code = editing.code;
    edit.avatar = { ...editing.avatar, female };
    update(setRosterEdit(cfg, circuit, editing.index, edit));
    setEditing(null);
  };
  const resetPlayer = () => { update(setRosterEdit(cfg, circuit, editing.index, null)); setEditing(null); };

  return (
    <div style={styles.root}>
      <div className="tm-paper" style={{ minHeight: FULL_H, padding: "16px 16px 40px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <button style={{ ...styles.btnSmall, alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6 }} onClick={onBack}>
          <Icon name="arrowLeft" size={14} /> Menu principal
        </button>
        <div style={{ borderBottom: "3px solid " + INK, paddingBottom: 4 }}>
          <div className="tm-display" style={{ fontSize: 28, lineHeight: 1 }}>Personnalisation</div>
          <div className="tm-lettering" style={{ fontSize: 15, lineHeight: 1.25, color: INK, marginTop: 4 }}>Modifiez les noms, nationalités et portraits des joueurs. Choisissez la base au lancement d'une carrière.</div>
        </div>

        {/* Les trois configurations */}
        <div style={{ background: "#ffffff", border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK }}>
          {band("Configuration")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(" + ROSTER_SLOTS + ", minmax(0, 1fr))", borderBottom: "2.5px solid " + INK }}>
            {configs.map((c, i) => (
              <button key={i} onClick={() => { setSlot(i); setPage(0); setConfirmReset(false); }} style={{
                minHeight: 50, border: 0, borderRight: i < ROSTER_SLOTS - 1 ? "2.5px solid " + INK : 0, cursor: "pointer",
                background: i === slot ? T.gold : "#ffffff", color: INK, fontFamily: T.body, padding: "4px 4px",
              }}>
                <div style={{ fontWeight: 800, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                <div style={{ fontSize: 10.5, fontWeight: 700 }}>{rosterEditCount(c)} modif.</div>
              </button>
            ))}
          </div>
          <div style={{ padding: 10, display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase" }} htmlFor="tm-cfg-name">Nom</label>
            <input id="tm-cfg-name" value={cfg.name} maxLength={24} onChange={e => update({ ...cfg, name: e.target.value })} style={{ ...styles.input, flex: 1, minWidth: 0 }} />
          </div>
        </div>

        {/* Circuit et recherche */}
        <div style={{ display: "flex", gap: 6 }}>
          {[["atp", "Circuit masculin"], ["wta", "Circuit féminin"]].map(([id, label]) => (
            <button key={id} onClick={() => { setCircuitTab(id); setPage(0); }} style={{ ...styles.filterBtn, ...(circuit === id ? styles.filterBtnActive : {}), flex: 1 }}>{label}</button>
          ))}
        </div>
        <input value={query} placeholder="Rechercher un joueur ou un pays…" onChange={e => { setQuery(e.target.value); setPage(0); }} style={styles.input} />

        {/* Liste des joueurs */}
        <div style={{ background: "#ffffff", border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK }}>
          {band(filtered.length + " joueur" + (filtered.length > 1 ? "s" : ""))}
          {shown.map((e, k) => (
            <button key={e.index} onClick={() => openEditor(e)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", cursor: "pointer",
              background: e.edited ? "#d6ef3c" : "#ffffff", color: INK, border: 0,
              borderTop: k ? "2px dashed " + INK : 0, fontFamily: T.body, textAlign: "left",
            }}>
              <span className="tm-num" style={{ width: 46, flexShrink: 0, fontWeight: 800, fontSize: 12 }}>#{e.index + 1}</span>
              <span style={{ width: 32, height: 32, flexShrink: 0, border: "2px solid " + INK, overflow: "hidden", background: "#ffffff" }}>
                <Avatar config={e.avatar ? { ...e.avatar, female } : aiAvatar({ name: e.name }, female)} size={28} bare />
              </span>
              <FlagFromEmoji emoji={e.nat.flag} size={13} />
              <span style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
              {e.edited && <span style={{ fontSize: 10, fontWeight: 800, background: INK, color: T.gold, padding: "1px 5px", textTransform: "uppercase" }}>Modifié</span>}
            </button>
          ))}
          {shown.length === 0 && <div className="tm-lettering" style={{ padding: 16, textAlign: "center", fontSize: 15 }}>Aucun joueur trouvé…</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <button style={{ ...styles.btnSmall, opacity: curPage === 0 ? 0.4 : 1 }} disabled={curPage === 0} onClick={() => setPage(curPage - 1)}>←</button>
          <span className="tm-num" style={{ fontWeight: 800 }}>{curPage + 1} / {pages}</span>
          <button style={{ ...styles.btnSmall, opacity: curPage >= pages - 1 ? 0.4 : 1 }} disabled={curPage >= pages - 1} onClick={() => setPage(curPage + 1)}>→</button>
        </div>

        {/* Remise à zéro de la configuration */}
        {confirmReset ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...styles.btnSecondary, flex: 1, background: "#c4302b", color: "#ffffff", boxShadow: "2px 2px 0 " + INK }} onClick={() => { update({ name: cfg.name, atp: {}, wta: {} }); setConfirmReset(false); }}>Tout effacer</button>
            <button style={{ ...styles.btnSecondary, flex: 1 }} onClick={() => setConfirmReset(false)}>Annuler</button>
          </div>
        ) : (
          <button style={{ ...styles.btnSecondary, opacity: rosterEditCount(cfg) ? 1 : 0.4 }} disabled={!rosterEditCount(cfg)} onClick={() => setConfirmReset(true)}>Réinitialiser « {cfg.name} »</button>
        )}
      </div>

      {/* Fiche d'édition d'un joueur */}
      {editing && (
        <div ref={sheetRef} className="tm-paper" style={{ position: "fixed", inset: 0, zIndex: 300, overflowY: "auto", padding: 16 }}>
          <BoxShade boxRef={sheetRef} side="top" />
          <div style={{ maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "3px solid " + INK, paddingBottom: 4 }}>
              <span className="tm-display" style={{ fontSize: 22 }}>Joueur #{editing.index + 1}</span>
              <span style={{ background: INK, color: "#ffffff", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase", padding: "1px 6px", whiteSpace: "nowrap" }}>{female ? "Circuit féminin" : "Circuit masculin"}</span>
            </div>
            <div>
              <label style={styles.label} htmlFor="tm-edit-name">Nom affiché</label>
              <input id="tm-edit-name" value={editing.name} maxLength={28} onChange={e => setEditing({ ...editing, name: e.target.value })} style={styles.input} />
            </div>
            <div>
              <label style={styles.label} htmlFor="tm-edit-nat">Nationalité</label>
              <select id="tm-edit-nat" value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value })} style={{ ...styles.input, appearance: "auto" }}>
                {NATS.map(n => <option key={n.code} value={n.code}>{n.country}</option>)}
              </select>
            </div>
            <div style={{ background: "#ffffff", border: "2.5px solid " + INK, boxShadow: "3px 3px 0 " + INK, padding: 12 }}>
              <AvatarBuilder config={{ ...editing.avatar, female }} onChange={(a) => setEditing({ ...editing, avatar: a })} stickyTop={0} />
            </div>
            <button style={styles.btnPrimary} onClick={saveEditor}>Enregistrer</button>
            {editing.edited && <button style={styles.btnSecondary} onClick={resetPlayer}>Rétablir le joueur d'origine</button>}
            <button style={styles.btnSecondary} onClick={() => setEditing(null)}>Annuler</button>
          </div>
          <BoxShade boxRef={sheetRef} side="bottom" />
        </div>
      )}
    </div>
  );
}

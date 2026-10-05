// Écran Bureau › Finances.
import { tournamentEarningsFromHistory, tournamentIdByName } from "../../engine/history.js";
import { SPONSOR_CAPS } from "../../engine/sponsors.js";
import { Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

export function FinanceScreen({ player, acceptSponsorOffer, declineSponsorOffer, requestCancelSponsor, sponsorCancelCost, setTournamentDetail }) {
  const balance = player.money;
  const earned = player.totalEarnings || 0;
  const spent = player.totalSpent || 0;
  const net = earned - spent;
  const staffWeekly = player.staff.reduce((a, s) => a + s.cost, 0);
  const sponsors = player.sponsors || [];
  const offers = player.sponsorOffers || [];
  const weeklySponsorIncome = sponsors.reduce((a, s) => a + s.weeklyPay, 0);
  const weeklyOutflow = player.weeklyExpenses + staffWeekly;
  const weeklyNet = weeklySponsorIncome - weeklyOutflow;

  // Top tournois : classés par gains d'une même édition (semaine + année),
  // pas cumulés sur plusieurs années.
  const topTournaments = (player.tournamentEarnings || tournamentEarningsFromHistory(player.matchHistory))
    .filter(e => e.prize > 0)
    .sort((a, b) => b.prize - a.prize || (b.year * 52 + b.week) - (a.year * 52 + a.week))
    .slice(0, 5);

  const tierColors = {
    premium: T.ball, high: T.green, mid: T.fg2, low: T.fg3, entry: T.fg5,
  };
  const tierLabels = {
    premium: "Premium", high: "Haut de gamme", mid: "Standard", low: "Modeste", entry: "Local",
  };

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Finances</div>

      {/* Hero balance card */}
      <div className="tm-court" style={{
        background: T.bg1,
        borderRadius: 14, padding: 24, marginBottom: 14,
        border: "1px solid " + T.brd, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 200,
          background: "none",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}>
          <div className="tm-eyebrow" style={{ marginBottom: 6 }}>Solde actuel</div>
          <div className="tm-num" style={{
            color: balance >= 0 ? T.green : T.red,
            fontSize: 40, fontWeight: 800, lineHeight: 1, letterSpacing: -1,
          }}>{balance.toLocaleString()} €</div>
        </div>
      </div>

      {/* Earned / Spent */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
        <div style={{ background: T.bg1, borderRadius: 10, padding: 14, border: "1px solid " + T.brd }}>
          <div className="tm-eyebrow" style={{ color: T.green, marginBottom: 4 }}>↑ Gains</div>
          <div className="tm-num" style={{ color: T.fg, fontWeight: 800, fontSize: 18 }}>+{earned.toLocaleString()}€</div>
        </div>
        <div style={{ background: T.bg1, borderRadius: 10, padding: 14, border: "1px solid " + T.brd }}>
          <div className="tm-eyebrow" style={{ color: T.red, marginBottom: 4 }}>↓ Dépenses</div>
          <div className="tm-num" style={{ color: T.fg, fontWeight: 800, fontSize: 18 }}>−{spent.toLocaleString()}€</div>
        </div>
      </div>

      {/* ACTIVE SPONSORS */}
      <div style={{ marginBottom: 18 }}>
        {(() => {
          const eqCount = sponsors.filter(s => (s.cat || "other") === "equipment").length;
          const otCount = sponsors.filter(s => (s.cat || "other") === "other").length;
          return (
            <div className="tm-eyebrow" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <span>Sponsors actifs</span>
              <span style={{ color: "var(--tm-blue)" }}>Équip. {eqCount}/{SPONSOR_CAPS.equipment}</span>
              <span style={{ color: T.fg5 }}>·</span>
              <span style={{ color: T.ball }}>Autres {otCount}/{SPONSOR_CAPS.other}</span>
            </div>
          );
        })()}
        {sponsors.length === 0 ? (
          <div style={{
            background: T.bg1, borderRadius: 10, padding: 18, textAlign: "center",
            color: T.fg5, fontSize: 12, fontStyle: "italic",
            border: "1px dashed " + T.brd2,
          }}>Aucun contrat actif</div>
        ) : sponsors.map((s) => {
          const cat = s.cat || "other";
          const catLabel = cat === "equipment" ? "Équipementier" : "Sponsor";
          const catColor = cat === "equipment" ? "var(--tm-blue)" : T.ball;
          return (
            <div key={s.id} style={{
              background: T.bg1, borderRadius: 10, padding: 14, marginBottom: 8,
              border: "1px solid " + T.brd, borderLeft: "3px solid " + catColor,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: 0.5, textTransform: "none",
                      color: catColor, background: T.bg3, padding: "2px 6px", borderRadius: 4,
                    }}>{catLabel}</span>
                  </div>
                  <div style={{ color: T.fg, fontSize: 14, fontWeight: 700 }}>{s.brand}</div>
                  <div className="tm-eyebrow" style={{ color: tierColors[s.tier], marginTop: 2 }}>{tierLabels[s.tier]}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="tm-num" style={{ color: T.green, fontSize: 14, fontWeight: 700 }}>+{s.weeklyPay}€<span style={{ color: T.fg5, fontWeight: 500 }}>/sem</span></div>
                  <div className="tm-num" style={{ color: T.fg4, fontSize: 10, marginTop: 2 }}>{s.weeksLeft} sem. restantes</div>
                </div>
              </div>
              <div style={{ marginTop: 8, color: T.fg3, fontSize: 11 }}>
                Bonus titre · <span className="tm-num" style={{ color: T.ball }}>+{s.titleBonus.toLocaleString()}€</span>
              </div>
              <button
                style={{ ...styles.btnSmall, marginTop: 10, color: T.red, borderColor: "var(--tm-redBrd)", width: "100%" }}
                onClick={() => requestCancelSponsor(s)}
              >
                Résilier · −{sponsorCancelCost(s).toLocaleString()}€
              </button>
            </div>
          );
        })}
      </div>

      {/* WEEKLY BALANCE */}
      <div style={{
        background: T.bg1, borderRadius: 12, padding: 16, marginBottom: 14,
        border: "1px solid " + T.brd,
      }}>
        <div className="tm-eyebrow" style={{ marginBottom: 12 }}>Bilan hebdomadaire</div>
        {[
          { label: "Revenus sponsors", v: weeklySponsorIncome, color: T.green, sign: "+" },
          { label: "Charges de vie", v: player.weeklyExpenses, color: T.red, sign: "−" },
          { label: "Staff", v: staffWeekly, color: T.red, sign: "−" },
        ].map((row, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between",
            color: T.fg3, fontSize: 13, padding: "8px 0",
            borderBottom: "1px solid " + T.brd,
          }}>
            <span>{row.label}</span>
            <span className="tm-num" style={{ color: row.color, fontWeight: 600 }}>{row.sign}{row.v}€</span>
          </div>
        ))}
        <div style={{
          display: "flex", justifyContent: "space-between",
          color: T.fg, fontSize: 14, padding: "12px 0 0", fontWeight: 700,
        }}>
          <span>Net hebdo</span>
          <span className="tm-num" style={{ color: weeklyNet >= 0 ? T.green : T.red, fontSize: 16 }}>
            {weeklyNet >= 0 ? "+" : ""}{weeklyNet}€
          </span>
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between",
          color: T.fg, fontSize: 14, padding: "8px 0 0", fontWeight: 700,
        }}>
          <span>Bilan carrière</span>
          <span className="tm-num" style={{ color: net >= 0 ? T.green : T.red, fontSize: 16 }}>
            {net >= 0 ? "+" : ""}{net.toLocaleString()}€
          </span>
        </div>
      </div>

      {topTournaments.length > 0 && (
        <div style={{ background: T.bg1, borderRadius: 12, padding: 16, marginBottom: 14, border: "1px solid " + T.brd }}>
          <div className="tm-eyebrow" style={{ marginBottom: 12 }}><Icon name="trophy" size={11} /> Top tournois</div>
          {topTournaments.map((e, i) => {
            const tid = e.tid || tournamentIdByName(e.name);
            return (
              <div
                key={e.name + e.week + e.year}
                onClick={tid && setTournamentDetail ? () => setTournamentDetail(tid) : undefined}
                style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "9px 0", gap: 10,
                  borderBottom: i < topTournaments.length - 1 ? "1px solid " + T.brd : "none",
                  alignItems: "center", cursor: tid ? "pointer" : "default",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: T.fg, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: tid ? "underline" : "none", textDecorationColor: T.fg5, textUnderlineOffset: 3 }}>{e.name}{tid ? " ›" : ""}</div>
                  <div style={{ color: T.fg4, fontSize: 11, marginTop: 2 }}>S{e.week} · {e.year}</div>
                </div>
                <span className="tm-num" style={{ color: T.green, fontWeight: 700, fontSize: 13 }}>+{e.prize.toLocaleString()}€</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

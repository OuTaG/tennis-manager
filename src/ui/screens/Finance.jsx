// Écran Bureau › Finances.
import { tournamentEarningsFromHistory, tournamentIdByName } from "../../engine/history.js";
import { SPONSOR_CAPS, sponsorSlotWarning } from "../../engine/sponsors.js";
import { Icon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

export function FinanceScreen({ player, ranking, acceptSponsorOffer, declineSponsorOffer, requestCancelSponsor, sponsorCancelCost, setTournamentDetail }) {
  const balance = player.money;
  const earned = player.totalEarnings || 0;
  const spent = player.totalSpent || 0;
  const net = earned - spent;
  const staffWeekly = player.staff.reduce((a, s) => a + s.cost, 0);
  const sponsors = player.sponsors || [];
  // Offres reçues en cours de saison (celles des phases de négociation
  // passent par la table de négociation).
  const offers = (player.sponsorOffers || []).filter(o => o.midSeason);
  const nowAbs = player.year * 52 + player.week;
  const weeklySponsorIncome = sponsors.reduce((a, s) => a + s.weeklyPay, 0);
  const weeklyOutflow = player.weeklyExpenses + staffWeekly;
  const weeklyNet = weeklySponsorIncome - weeklyOutflow;

  // Top tournois : classés par gains d'une même édition (semaine + année),
  // pas cumulés sur plusieurs années.
  const topTournaments = (player.tournamentEarnings || tournamentEarningsFromHistory(player.matchHistory))
    .filter(e => e.prize > 0)
    .sort((a, b) => b.prize - a.prize || (b.year * 52 + b.week) - (a.year * 52 + a.week))
    .slice(0, 5);

  const tierLabels = {
    premium: "Premium", high: "Haut de gamme", mid: "Standard", low: "Modeste", entry: "Local",
  };

  const INK = T.ink;
  const panel = { background: "#ffffff", color: "#141414", border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, marginBottom: 14 };
  const band = (txt, right) => (
    <div style={{ background: INK, color: "#ffffff", padding: "5px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <span className="tm-display" style={{ fontSize: 14 }}>{txt}</span>{right}
    </div>
  );
  const chip = (bg, fg) => ({ display: "inline-block", background: bg, color: fg, border: "2px solid " + INK, fontSize: 10.5, fontWeight: 800, padding: "0 6px", textTransform: "uppercase", letterSpacing: 0.3 });
  const eqCount = sponsors.filter(s => (s.cat || "other") === "equipment").length;
  const otCount = sponsors.filter(s => (s.cat || "other") === "other").length;

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Finances</div>

      {/* Solde */}
      <div className={balance >= 0 ? "tm-halftone-yellow" : "tm-halftone-magenta"} style={{ border: "3px solid " + INK, boxShadow: "5px 5px 0 " + INK, padding: "14px 16px", marginBottom: 14, color: "#141414" }}>
        <span style={chip(INK, "#ffffff")}>Solde actuel</span>
        <div className="tm-display" style={{ fontSize: 40, lineHeight: 1.05, marginTop: 6, color: balance >= 0 ? "#141414" : "#ffffff", textShadow: balance >= 0 ? "none" : "2px 2px 0 " + INK }}>{balance.toLocaleString()} €</div>
      </div>

      {/* Gains / Dépenses */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        {[["Gains", "+" + earned.toLocaleString() + " €", "#1f7a45"], ["Dépenses", "−" + spent.toLocaleString() + " €", "#c4302b"]].map(([l, v, c]) => (
          <div key={l} style={{ background: "#ffffff", color: "#141414", border: "3px solid " + INK, boxShadow: "3px 3px 0 " + INK, overflow: "hidden" }}>
            <div className="tm-display" style={{ background: c, color: "#ffffff", fontSize: 12.5, padding: "3px 10px", borderBottom: "2.5px solid " + INK }}>{l}</div>
            <div className="tm-display" style={{ fontSize: 18, padding: "8px 10px" }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Sponsors actifs */}
      <div style={panel}>
        {band("Sponsors actifs", (
          <span style={{ display: "flex", gap: 5 }}>
            <span style={chip("#2c6fd1", "#ffffff")}>Équip. {eqCount}/{SPONSOR_CAPS.equipment}</span>
            <span style={chip("#d6ef3c", "#141414")}>Autres {otCount}/{SPONSOR_CAPS.other}</span>
          </span>
        ))}
        {sponsors.length === 0 ? (
          <div className="tm-lettering" style={{ padding: 16, textAlign: "center", fontSize: 15 }}>Aucun contrat actif…</div>
        ) : sponsors.map((s, k) => {
          const cat = s.cat || "other";
          const catLabel = cat === "equipment" ? "Équipementier" : "Sponsor";
          return (
            <div key={s.id} style={{ padding: 12, borderTop: k ? "2px dashed " + INK : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <span style={cat === "equipment" ? chip("#2c6fd1", "#ffffff") : chip("#d6ef3c", "#141414")}>{catLabel}</span>
                    <span style={chip("#ffffff", "#141414")}>{tierLabels[s.tier]}</span>
                  </div>
                  <div className="tm-display" style={{ fontSize: 17, marginTop: 5 }}>{s.brand}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="tm-display" style={{ color: "#1f7a45", fontSize: 16 }}>+{s.weeklyPay} €<span style={{ fontSize: 11 }}>/sem</span></div>
                  <div style={{ fontSize: 11, fontWeight: 800, marginTop: 2 }}>{s.weeksLeft} sem. restantes</div>
                </div>
              </div>
              <div className="tm-lettering" style={{ marginTop: 6, fontSize: 14 }}>
                Bonus titre : +{s.titleBonus.toLocaleString()} €
              </div>
              <button
                style={{ ...styles.btnSmall, marginTop: 8, width: "100%", background: "#ffffff", color: "#c4302b", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, fontWeight: 800 }}
                onClick={() => requestCancelSponsor(s)}
              >
                Résilier · −{sponsorCancelCost(s).toLocaleString()} €
              </button>
            </div>
          );
        })}
      </div>

      {/* Offres en cours de saison */}
      {offers.length > 0 && (
        <div style={panel}>
          {band("Offres du moment", <span style={chip("#d6ef3c", "#141414")}>{offers.length} offre{offers.length > 1 ? "s" : ""}</span>)}
          {offers.map((o, k) => {
            const med = (o.objectiveLevels || []).find(l => l.level === "medium") || (o.objectiveLevels || [])[1];
            const left = Math.max(1, o.expiresAbs - nowAbs);
            const warn = sponsorSlotWarning(player, o, ranking ?? 9999);
            return (
              <div key={o.id} className="tm-halftone-yellow" style={{ padding: 12, borderTop: k ? "2px dashed " + INK : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      <span style={o.cat === "equipment" ? chip("#2c6fd1", "#ffffff") : chip("#ffffff", "#141414")}>{o.cat === "equipment" ? "Équipementier" : "Sponsor"}</span>
                      <span style={chip("#ffffff", "#141414")}>{tierLabels[o.tier]}</span>
                    </div>
                    <div className="tm-display" style={{ fontSize: 17, marginTop: 5 }}>{o.brand}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="tm-display" style={{ color: "#1f7a45", fontSize: 16 }}>+{o.weeklyPay} €<span style={{ fontSize: 11 }}>/sem</span></div>
                    <div style={{ fontSize: 11, fontWeight: 800, marginTop: 2 }}>Expire dans {left} sem.</div>
                  </div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 6, lineHeight: 1.45 }}>
                  Bonus titre : +{o.titleBonus.toLocaleString()} €
                  {med && <><br />Objectif : {med.label} (+{Math.round((o.baseReward || 0) * (med.rewardMul || 1)).toLocaleString()} € / −{Math.round((o.basePenalty || 0) * (med.penaltyMul || 1)).toLocaleString()} €)</>}
                </div>
                {warn && <div style={{ marginTop: 6, background: "#ffffff", border: "2px solid " + INK, padding: "4px 7px", fontSize: 11.5, fontWeight: 700, lineHeight: 1.4 }}>{warn.short}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button className="tm-display" style={{ flex: 1, background: "#1f7a45", color: "#ffffff", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, padding: "7px 8px", fontSize: 13, cursor: "pointer" }} onClick={() => acceptSponsorOffer(o)}>
                    {warn ? "Remplacer un contrat" : "Signer"}
                  </button>
                  <button style={{ ...styles.btnSmall, background: "#ffffff", color: INK, border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, fontWeight: 800 }} onClick={() => declineSponsorOffer(o)}>Refuser</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bilan hebdomadaire */}
      <div style={panel}>
        {band("Bilan hebdomadaire")}
        <div style={{ padding: "4px 12px 12px" }}>
          {[
            { label: "Revenus sponsors", v: weeklySponsorIncome, color: "#1f7a45", sign: "+" },
            { label: "Charges de vie", v: player.weeklyExpenses, color: "#c4302b", sign: "−" },
            { label: "Staff", v: staffWeekly, color: "#c4302b", sign: "−" },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 700, padding: "8px 0", borderBottom: "2px dashed " + INK }}>
              <span>{row.label}</span>
              <span className="tm-num" style={{ color: row.color, fontWeight: 800 }}>{row.sign}{row.v} €</span>
            </div>
          ))}
          {[["Net hebdo", weeklyNet, weeklyNet], ["Bilan carrière", net, net]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <span className="tm-display" style={{ fontSize: 14 }}>{l}</span>
              <span className="tm-display" style={{ fontSize: 15, background: v >= 0 ? "#1f7a45" : "#c4302b", color: "#ffffff", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, padding: "1px 8px" }}>
                {v >= 0 ? "+" : ""}{v.toLocaleString()} €
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Meilleurs tournois */}
      {topTournaments.length > 0 && (
        <div style={panel}>
          {band(<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="trophy" size={13} color="#d6ef3c" /> Meilleurs tournois</span>)}
          {topTournaments.map((e, i) => {
            const tid = e.tid || tournamentIdByName(e.name);
            return (
              <div
                key={e.name + e.week + e.year}
                onClick={tid && setTournamentDetail ? () => setTournamentDetail(tid) : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                  borderTop: i ? "2px dashed " + INK : 0, cursor: tid ? "pointer" : "default",
                  background: i === 0 ? "rgba(214,239,60,0.3)" : "#ffffff",
                }}
              >
                <span className="tm-display" style={{ width: 28, height: 28, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: i === 0 ? "#d6ef3c" : INK, color: i === 0 ? "#141414" : "#ffffff", border: "2px solid " + INK, fontSize: 14 }}>{i + 1}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}{tid ? " ›" : ""}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, marginTop: 1 }}>Semaine {e.week} · {e.year}</div>
                </div>
                <span className="tm-display" style={{ color: "#1f7a45", fontSize: 14.5 }}>+{e.prize.toLocaleString()} €</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Écran Joueur › Vie.
import { LIFE_ACTIVITIES } from "../../data/life.js";
import { lifeCaps } from "../../engine/player.js";
import { Icon, StatIcon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

// Life screen: 3 life-stat bars + grid of leisure activities
export function LifeScreen({ player, doLifeActivity }) {
  const happiness = Math.round(player.happiness ?? 70);
  const popularity = Math.round(player.popularity ?? 20);
  const image = Math.round(player.image ?? 60);
  const absWeek = (player.year || 0) * 52 + (player.week || 0);
  const activitiesThisWeek = (player.lifeActivitiesWeekKey || 0) === absWeek
    ? (player.lifeActivitiesThisWeek || 0)
    : 0;

  // Jauge BD : case encrée, picto BD, chiffre en Archivo, barre cernée.
  const lifeStat = (label, value, color, icon) => (
    <div style={{ background: "#ffffff", color: "#141414", padding: "8px 8px 9px", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, marginBottom: 4 }}>
        <StatIcon name={icon} size={20} />
        <span className="tm-display tm-num" style={{ color: "#141414", fontSize: 20, lineHeight: 1 }}>{value}</span>
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ height: 10, border: "2px solid " + T.ink, background: "#ffffff" }}>
        <div style={{ width: value + "%", height: "100%", background: color, borderRight: value > 0 && value < 100 ? "2px solid " + T.ink : "none", transition: "width .3s" }} />
      </div>
    </div>
  );

  // Étiquette BD d'un coût ou d'un gain : picto BD + montant signé,
  // vert si c'est favorable, rouge sinon.
  const effectChip = (key, icon, amount, good, suffix = "") => (
    <span key={key} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "#ffffff", border: "2px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink,
      padding: "1px 7px 1px 3px",
    }}>
      <StatIcon name={icon} size={16} />
      <span className="tm-display tm-num" style={{ fontSize: 12.5, color: good ? "#1f7a45" : "#c4302b", whiteSpace: "nowrap" }}>
        {amount > 0 ? "+" : "−"}{Math.abs(amount).toLocaleString()}{suffix}
      </span>
    </span>
  );

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Vie personnelle</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {lifeStat("Bonheur", happiness, "#1f7a45", "happiness")}
        {lifeStat("Popularité", popularity, "#5b2d8e", "popularity")}
        {lifeStat("Image", image, "#c4572b", "image")}
      </div>
      {(() => {
        const caps = lifeCaps(player);
        return (
          <div style={{ color: T.fg4, fontSize: 12, lineHeight: 1.5, margin: "-6px 2px 14px" }}>
            Votre classement limite votre notoriété : popularité max <strong className="tm-num" style={{ color: "#141414" }}>{caps.popularity}</strong>, image max <strong className="tm-num" style={{ color: "#141414" }}>{caps.image}</strong>. Grimpez au classement pour aller plus haut.
          </div>
        );
      })()}

      {image < 20 && (
        <div style={styles.alertBox}>
          <strong style={{ color: T.red }}>Image très basse</strong> — sponsors méfiants, presse hostile.
        </div>
      )}
      {happiness < 15 && (
        <div style={styles.alertBox}>
          <strong style={{ color: T.red }}>Bonheur au plus bas</strong> — entraînement ralenti et léger malus mental en match.
        </div>
      )}

      <div style={{ ...styles.sectionTitle, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>Activités</span>
        <span style={{ display: "inline-block", fontFamily: T.body, background: activitiesThisWeek >= 2 ? "#c4302b" : "#ffffff", color: activitiesThisWeek >= 2 ? "#ffffff" : "#141414", border: "2px solid " + T.ink, fontSize: 11, fontWeight: 800, padding: "0 6px", letterSpacing: 0.3, textTransform: "none" }}>
          {activitiesThisWeek}/2 cette semaine
        </span>
      </div>

      {LIFE_ACTIVITIES.map(act => {
        const lastUsed = (player.activityCooldowns || {})[act.id];
        const cdRemaining = lastUsed !== undefined ? Math.max(0, (act.cooldown || 0) - (absWeek - lastUsed)) : 0;
        const onCooldown = cdRemaining > 0;
        const atWeeklyLimit = activitiesThisWeek >= 2;
        const hasResources = player.money >= act.cost && (act.energyCost <= 0 || player.energy >= act.energyCost + 2);
        const canDo = hasResources && !onCooldown && !atWeeklyLimit;
        return (
          <div key={act.id} className="tm-card" style={{ ...styles.trainingCard, opacity: onCooldown ? 0.55 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 0,
                  background: "#ffffff", border: "2.5px solid " + T.ink, boxShadow: "2px 2px 0 " + T.ink,
                  transform: "rotate(-4deg)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon name={act.iconName} size={18} color="#1f7a45" strokeWidth={2.2} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="tm-display" style={{ color: "#141414", fontSize: 14 }}>{act.name}</div>
                  <div style={{ color: T.fg4, fontSize: 11, marginTop: 2 }}>{act.desc}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap" }}>
              {act.cost > 0 && effectChip("cost", "money", -act.cost, false, " €")}
              {act.energyCost !== 0 && effectChip("energy", "energy", -act.energyCost, act.energyCost < 0)}
              {act.happiness !== 0 && effectChip("happiness", "happiness", act.happiness, act.happiness > 0)}
              {act.popularity !== 0 && effectChip("popularity", "popularity", act.popularity, act.popularity > 0)}
              {act.image !== 0 && effectChip("image", "image", act.image, act.image > 0)}
            </div>

            <button
              style={{
                ...styles.btnSmall, width: "100%",
                background: canDo ? "#1f7a45" : "#ffffff",
                color: canDo ? "#ffffff" : "#6b6b6b",
                border: "2.5px solid " + T.ink,
                boxShadow: canDo ? "2px 2px 0 " + T.ink : "none",
                fontFamily: T.display, fontWeight: 400, textTransform: "uppercase",
                opacity: canDo ? 1 : 0.7,
              }}
              disabled={!canDo}
              onClick={() => doLifeActivity(act)}
            >
              {onCooldown
                ? "Disponible dans " + cdRemaining + " sem"
                : atWeeklyLimit ? "Limite hebdo atteinte"
                : "Faire"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

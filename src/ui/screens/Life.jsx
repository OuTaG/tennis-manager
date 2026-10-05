// Écran Joueur › Vie.
import { LIFE_ACTIVITIES } from "../../data/life.js";
import { lifeCaps } from "../../engine/player.js";
import { Icon } from "../icons.jsx";
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

  const lifeStat = (label, value, color, icon) => (
    <div style={{ background: T.bg2, borderRadius: 10, padding: 12, border: "1px solid " + T.brd }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name={icon} size={14} color={color} />
          <span style={{ color: T.fg, fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>{label}</span>
        </div>
        <span className="tm-num" style={{ color: color, fontSize: 15, fontWeight: 800 }}>{value}</span>
      </div>
      <div style={{ height: 6, background: T.bg4, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: value + "%", height: "100%", background: color, borderRadius: 3, transition: "width .3s" }} />
      </div>
    </div>
  );

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Vie personnelle</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {lifeStat("Bonheur", happiness, "var(--tm-amber)", "heart")}
        {lifeStat("Popularité", popularity, T.green, "sparkles")}
        {lifeStat("Image", image, "var(--tm-blue)", "users")}
      </div>
      {(() => {
        const caps = lifeCaps(player);
        return (
          <div style={{ color: T.fg4, fontSize: 12, lineHeight: 1.5, margin: "-6px 2px 14px" }}>
            Votre classement limite votre notoriété : popularité max <strong className="tm-num" style={{ color: T.fg2 }}>{caps.popularity}</strong>, image max <strong className="tm-num" style={{ color: T.fg2 }}>{caps.image}</strong>. Grimpez au classement pour aller plus haut.
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
        <span style={{ color: T.fg5, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "none" }}>
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
                  width: 36, height: 36, borderRadius: 10,
                  background: T.bg3, border: "1px solid " + T.brd2,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon name={act.iconName} size={18} color={T.green} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: T.fg, fontWeight: 700, fontSize: 13 }}>{act.name}</div>
                  <div style={{ color: T.fg4, fontSize: 11, marginTop: 2 }}>{act.desc}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              {act.cost > 0 && <span style={styles.tournChip}>−<span className="tm-num">{act.cost.toLocaleString()}€</span></span>}
              {act.energyCost > 0 && <span style={{ ...styles.tournChip, display: "inline-flex", alignItems: "center", gap: 2 }}>−<span className="tm-num">{act.energyCost}</span><Icon name="energy" size={10} /></span>}
              {act.energyCost < 0 && <span style={{ ...styles.tournChip, color: T.green, display: "inline-flex", alignItems: "center", gap: 2 }}>+<span className="tm-num">{-act.energyCost}</span><Icon name="energy" size={10} /></span>}
              {act.happiness !== 0 && (
                <span style={{ ...styles.tournChip, color: act.happiness > 0 ? "var(--tm-amber)" : T.red, borderColor: T.brd, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  {act.happiness > 0 ? "+" : ""}{act.happiness}
                  <Icon name="heart" size={10} color={act.happiness > 0 ? "var(--tm-amber)" : T.red} />
                </span>
              )}
              {act.popularity !== 0 && (
                <span style={{ ...styles.tournChip, color: act.popularity > 0 ? T.green : T.red, borderColor: T.brd, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  {act.popularity > 0 ? "+" : ""}{act.popularity}
                  <Icon name="sparkles" size={10} color={act.popularity > 0 ? T.green : T.red} />
                </span>
              )}
              {act.image !== 0 && (
                <span style={{ ...styles.tournChip, color: act.image > 0 ? "var(--tm-blue)" : T.red, borderColor: T.brd, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  {act.image > 0 ? "+" : ""}{act.image}
                  <Icon name="users" size={10} color={act.image > 0 ? "var(--tm-blue)" : T.red} />
                </span>
              )}
            </div>

            <button
              style={{
                ...styles.btnSmall, width: "100%",
                background: canDo ? T.green : T.bg3,
                color: canDo ? T.bg0 : T.fg4,
                borderColor: "transparent",
                opacity: canDo ? 1 : 0.6,
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

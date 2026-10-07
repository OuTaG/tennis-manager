// Écran Bureau › Social.
import { useState } from "react";
import { adjustLife } from "../../engine/player.js";
import { withBdEmoji } from "../bdEmoji.jsx";
import { FlagFromEmoji, Icon, SurfaceIcon } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";

export const SOCIAL_HISTORY_WEEKS = 5;

export function SocialScreen({ player, posts, setNews, setPlayer, adjustLife }) {
  const [activeFeed, setActiveFeed] = useState("world");
  // Both feeds only show the last 5 weeks (current week + the 4 previous ones).
  const nowAbs = (player.year || 0) * 52 + (player.week || 0);
  const filtered = (posts || []).filter(p => {
    const postAbs = (p.year || 0) * 52 + (p.week || 0);
    if (nowAbs - postAbs >= SOCIAL_HISTORY_WEEKS) return false;
    return activeFeed === "personal" ? p.feed === "personal" : p.feed !== "personal";
  });

  const handleReply = (postId, option) => {
    // Apply effects
    setPlayer(prev => adjustLife({ ...prev }, {
      happiness: option.effects?.happiness || 0,
      popularity: option.effects?.popularity || 0,
      image: option.effects?.image || 0,
    }));
    // Mark post as replied to remove the reply UI
    setNews(prev => prev.map(p => p.id === postId ? { ...p, repliedWith: option.label } : p));
  };

  // Like toggle — only increments/decrements the like counter, no other effect.
  const toggleLike = (postId) => {
    setNews(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const liked = !p.likedByUser;
      return {
        ...p,
        likedByUser: liked,
        likes: Math.max(0, (p.likes || 0) + (liked ? 1 : -1)),
      };
    }));
  };

  // Style BD : un réseau social dessiné dans une case de bande dessinée.
  const INK = T.ink;
  const TYPE_STYLE = {
    press:  { bg: "#2c6fd1", icon: "document" },
    brand:  { bg: "#5b2d8e", icon: "briefcase" },
    player: { bg: "#1f7a45", icon: "racquet" },
    fan:    { bg: "#c9b6ea", icon: "user", fg: "#141414" },
  };
  const counterChip = (on, onBg) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    background: on ? onBg : "#ffffff", color: on ? "#ffffff" : "#141414",
    border: "2px solid " + INK, boxShadow: on ? "0 0 0 " + INK : "2px 2px 0 " + INK,
    transform: on ? "translate(2px, 2px)" : "none",
    padding: "2px 8px", fontSize: 11.5, fontWeight: 800, fontFamily: T.body, lineHeight: 1.4,
  });

  const renderPost = (p, idx) => {
    const author = p.author || { handle: "@unknown", name: "Anonyme", verified: false, type: "fan" };
    const ts = TYPE_STYLE[author.type] || TYPE_STYLE.fan;
    const avatarFg = ts.fg || "#ffffff";
    const trending = (p.likes || 0) >= 5000;
    const tilt = idx % 3 === 0 ? -0.35 : idx % 3 === 1 ? 0.3 : 0;
    return (
      <div key={p.id} className="tm-fade-up" style={{
        position: "relative", background: "#ffffff", color: "#141414",
        borderRadius: 0, padding: "12px 12px 12px", marginBottom: 16,
        border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK,
        transform: "rotate(" + tilt + "deg)",
      }}>
        {/* Tampon « tendance » */}
        {trending && (
          <span className="tm-display" style={{
            position: "absolute", top: -11, right: 10, zIndex: 1,
            background: "#c4302b", color: "#ffffff", border: "2px solid " + INK,
            boxShadow: "2px 2px 0 " + INK, padding: "1px 7px", fontSize: 10.5,
            transform: "rotate(4deg)", display: "inline-flex", alignItems: "center", gap: 4,
          }}>
            <Icon name="fire" size={11} color="#ffffff" /> Tendance
          </span>
        )}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div className={author.type === "fan" || !TYPE_STYLE[author.type] ? "tm-halftone-lilac" : undefined} style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: author.type === "fan" || !TYPE_STYLE[author.type] ? undefined : ts.bg,
            border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={ts.icon} size={18} color={avatarFg} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              <span className="tm-display" style={{ color: "#141414", fontSize: 13.5, lineHeight: 1.1 }}>{author.name}</span>
              {author.verified && (
                <span title="Compte vérifié" style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 16, height: 16, background: "#2c6fd1", color: "#ffffff",
                  border: "2px solid " + INK, transform: "rotate(-8deg)",
                  fontSize: 10, fontWeight: 900, lineHeight: 1,
                }}>✓</span>
              )}
              {author.flag && <FlagFromEmoji emoji={author.flag} size={11} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
              <span style={{ color: "#4a4a4a", fontSize: 11.5, fontWeight: 600 }}>{author.handle}</span>
              <span style={{
                background: INK, color: "#ffffff", fontSize: 9.5, fontWeight: 800,
                padding: "0 5px", letterSpacing: 0.3, lineHeight: 1.5,
              }}>S{p.week}</span>
            </div>
          </div>
        </div>

        {/* Content : bulle de BD */}
        <div style={{
          position: "relative", background: "#ffffff", color: "#141414",
          border: "2.5px solid " + INK, borderRadius: 16,
          padding: "9px 12px", fontSize: 13.5, lineHeight: 1.45, fontWeight: 500,
          marginBottom: p.tournamentMeta ? 10 : 12, marginLeft: 4,
        }}>
          {/* Queue de la bulle, pointée vers l'avatar */}
          <span aria-hidden="true" style={{
            position: "absolute", top: -8, left: 14, width: 12, height: 12,
            background: "#ffffff", borderLeft: "2.5px solid " + INK, borderTop: "2.5px solid " + INK,
            transform: "rotate(45deg) skew(8deg, 8deg)",
          }} />
          {withBdEmoji(p.content, 17)}
        </div>

        {/* Tournament chips if any */}
        {p.tournamentMeta && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ ...styles.tournChip, background: "#ffffff", color: "#141414", fontWeight: 700, fontSize: 11.5 }}><SurfaceIcon name={p.tournamentMeta.surface} /> {p.tournamentMeta.surface}</span>
            <span style={{ ...styles.tournChip, background: "#ffffff", color: "#141414", fontWeight: 700, fontSize: 11.5 }}><Icon name="location" size={11} /> {p.tournamentMeta.city}</span>
            <span className="tm-halftone-yellow" style={{ ...styles.tournChip, background: undefined, color: "#141414", fontWeight: 800, fontSize: 11.5, boxShadow: "2px 2px 0 " + INK, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Icon name="trophy" size={11} color="#141414" />
              <FlagFromEmoji emoji={p.tournamentMeta.winner.flag} size={12} />
              {p.tournamentMeta.winner.name}
            </span>
          </div>
        )}

        {/* Like/RT counts */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: "2px dashed " + INK, paddingTop: 9 }}>
          <button
            onClick={() => toggleLike(p.id)}
            style={{ ...counterChip(p.likedByUser, "#c4302b"), cursor: "pointer" }}
            title={p.likedByUser ? "Ne plus aimer" : "Aimer"}
          >
            <Icon name="heart" size={13} color={p.likedByUser ? "#ffffff" : "#141414"} />
            <span className="tm-num" style={{ fontWeight: 800 }}>{(p.likes || 0).toLocaleString()}</span>
          </button>
          <span style={counterChip(false)}>
            <Icon name="news" size={13} color="#141414" /> <span className="tm-num" style={{ fontWeight: 800 }}>{(p.retweets || 0).toLocaleString()}</span>
          </span>
          {p.likedByUser && (
            <span className="tm-lettering" aria-hidden="true" style={{ color: "#c4302b", fontSize: 16, transform: "rotate(-6deg)", display: "inline-block" }}>Smack !</span>
          )}
        </div>

        {/* Replies (if replyable and not already answered) */}
        {p.replyable && p.replies && !p.repliedWith && (
          <div style={{ marginTop: 12, paddingTop: 8, borderTop: "2.5px solid " + INK }}>
            <div className="tm-lettering" style={{ color: "#5b2d8e", fontSize: 16, marginBottom: 6, transform: "rotate(-1.5deg)", display: "inline-block" }}>Répondre</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {p.replies.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleReply(p.id, opt)}
                  style={{
                    background: "#ffffff", border: "2.5px solid " + INK, boxShadow: "3px 3px 0 " + INK,
                    borderRadius: 0, padding: "8px 12px",
                    color: "#141414", fontSize: 12.5, fontWeight: 700, fontFamily: T.body,
                    textAlign: "left", cursor: "pointer",
                  }}
                >« {withBdEmoji(opt.label, 16)} »</button>
              ))}
            </div>
          </div>
        )}

        {/* Already replied */}
        {p.repliedWith && (
          <div className="tm-halftone-lilac" style={{
            marginTop: 12, border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK,
            borderRadius: 0, padding: "8px 12px",
            color: "#141414", fontSize: 12.5, fontWeight: 600, fontStyle: "italic",
          }}>
            Votre réponse : « {withBdEmoji(p.repliedWith, 16)} »
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Social</div>

      {/* L'appli sociale, dessinée comme une case de BD */}
      <div style={{ border: "3px solid " + INK, boxShadow: "5px 5px 0 " + INK, background: "#ffffff", marginBottom: 14 }}>
        {/* Barre de l'appli */}
        <div style={{ background: INK, color: "#ffffff", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span className="tm-display" style={{ fontSize: 15, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="chat" size={15} color="#d6ef3c" /> Fil d'actu
          </span>
          <span className="tm-lettering" style={{ color: "#d6ef3c", fontSize: 14, transform: "rotate(-3deg)", display: "inline-block" }}>Bzzz ! Bzzz !</span>
        </div>

        {/* Choix du fil : contrôle segmenté cerné d'encre */}
        <div style={{ display: "flex" }}>
          {[
            { id: "world", label: "Monde", icon: "news" },
            { id: "personal", label: "Pour vous", icon: "chat" },
          ].map((f, i) => {
            const active = activeFeed === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFeed(f.id)}
                className={"tm-display" + (active ? " tm-halftone-yellow" : "")}
                style={{
                  flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 6px", border: 0, borderLeft: i ? "3px solid " + INK : 0,
                  borderRadius: 0, background: active ? undefined : "#ffffff",
                  color: "#141414", fontSize: 13, cursor: "pointer",
                  boxShadow: active ? "inset 0 -4px 0 " + INK : "none",
                }}
              >
                <Icon name={f.icon} size={14} color="#141414" />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="tm-paper" style={{ border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, padding: "24px 18px", textAlign: "center", color: "#141414" }}>
          <Icon name={activeFeed === "personal" ? "chat" : "news"} size={24} color="#141414" style={{ display: "block", margin: "0 auto 8px" }} />
          <div className="tm-lettering" style={{ fontSize: 16, lineHeight: 1.3 }}>
            {activeFeed === "personal"
              ? "Aucun post vous concernant pour l'instant. Jouez quelques matchs."
              : "Le fil est calme. Avancez les semaines."}
          </div>
        </div>
      ) : (
        <div style={{ padding: "0 3px" }}>{filtered.map(renderPost)}</div>
      )}
    </div>
  );
}

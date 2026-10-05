// Écran Bureau › Social.
import { useState } from "react";
import { adjustLife } from "../../engine/player.js";
import { FlagFromEmoji, Icon, SurfaceIcon, withFlags } from "../icons.jsx";
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

  const renderPost = (p) => {
    const author = p.author || { handle: "@unknown", name: "Anonyme", verified: false, type: "fan" };
    const typeColor = author.type === "press" ? "var(--tm-blue)"
                     : author.type === "brand" ? "var(--tm-amber)"
                     : author.type === "player" ? T.green
                     : T.fg4;
    return (
      <div key={p.id} className="tm-fade-up" style={{
        background: T.bg1, borderRadius: 12, padding: 14, marginBottom: 8,
        border: "1px solid " + T.brd,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 19, flexShrink: 0,
            background: T.bg3, border: "1px solid " + T.brd2,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: typeColor, fontWeight: 800, fontSize: 14,
          }}>
            <Icon name={author.type === "press" ? "document" : author.type === "brand" ? "briefcase" : author.type === "player" ? "racquet" : "user"} size={16} color={T.fg3} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              <span style={{ color: T.fg, fontWeight: 700, fontSize: 13 }}>{author.name}</span>
              {author.verified && (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 13, height: 13, borderRadius: 7,
                  background: "var(--tm-blue)", color: "#fff",
                  fontSize: 8, fontWeight: 900,
                }}>✓</span>
              )}
              {author.flag && <FlagFromEmoji emoji={author.flag} size={11} />}
              <span style={{ color: T.fg5, fontSize: 11 }}>{author.handle}</span>
              <span style={{ color: T.fg5, fontSize: 11 }}>·</span>
              <span style={{ color: T.fg5, fontSize: 11 }}>S{p.week}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ color: T.fg2, fontSize: 13, lineHeight: 1.5, marginBottom: p.tournamentMeta ? 8 : 12, marginLeft: 48 }}>
          {withFlags(p.content)}
        </div>

        {/* Tournament chips if any */}
        {p.tournamentMeta && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, marginLeft: 48 }}>
            <span style={styles.tournChip}><SurfaceIcon name={p.tournamentMeta.surface} /> {p.tournamentMeta.surface}</span>
            <span style={styles.tournChip}><Icon name="location" size={11} /> {p.tournamentMeta.city}</span>
            <span style={{ ...styles.tournChip, color: T.green, borderColor: T.greenBrd, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Icon name="trophy" size={11} />
              <FlagFromEmoji emoji={p.tournamentMeta.winner.flag} size={12} />
              {p.tournamentMeta.winner.name}
            </span>
          </div>
        )}

        {/* Like/RT counts */}
        <div style={{ display: "flex", gap: 16, color: T.fg5, fontSize: 11, marginLeft: 48 }}>
          <button
            onClick={() => toggleLike(p.id)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "none", border: "none", padding: 0, cursor: "pointer",
              color: p.likedByUser ? T.red : T.fg5,
              fontSize: 11, fontFamily: T.body,
            }}
            title={p.likedByUser ? "Ne plus aimer" : "Aimer"}
          >
            <Icon name="heart" size={12} color={p.likedByUser ? T.red : T.fg5} />
            <span className="tm-num">{(p.likes || 0).toLocaleString()}</span>
          </button>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Icon name="news" size={12} /> <span className="tm-num">{(p.retweets || 0).toLocaleString()}</span>
          </span>
        </div>

        {/* Replies (if replyable and not already answered) */}
        {p.replyable && p.replies && !p.repliedWith && (
          <div style={{ marginTop: 12, marginLeft: 48, paddingTop: 10, borderTop: "1px solid " + T.brd }}>
            <div style={{ color: T.fg5, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "none", marginBottom: 6 }}>Répondre</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {p.replies.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleReply(p.id, opt)}
                  style={{
                    background: T.bg2, border: "1px solid " + T.brd2,
                    borderRadius: 10, padding: "8px 12px",
                    color: T.fg, fontSize: 12, fontFamily: T.body,
                    textAlign: "left", cursor: "pointer",
                  }}
                >« {opt.label} »</button>
              ))}
            </div>
          </div>
        )}

        {/* Already replied */}
        {p.repliedWith && (
          <div style={{
            marginTop: 12, marginLeft: 48, paddingTop: 10, borderTop: "1px solid " + T.brd,
            background: T.bg2, borderRadius: 8, padding: "8px 12px",
            color: T.fg3, fontSize: 12, fontStyle: "italic",
          }}>
            Votre réponse : « {p.repliedWith} »
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionTitle}>Social</div>

      {/* Feed switcher */}
      <div style={{
        display: "flex", gap: 0, marginBottom: 14,
        borderRadius: 10, overflow: "hidden",
        border: "1px solid " + T.brd2,
      }}>
        <button
          onClick={() => setActiveFeed("world")}
          style={{
            flex: 1, padding: "10px 12px",
            background: activeFeed === "world" ? T.bg2 : "transparent",
            color: activeFeed === "world" ? T.fg : T.fg4,
            border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "none",
            borderBottom: activeFeed === "world" ? "2px solid " + T.green : "2px solid transparent",
          }}
        >Monde</button>
        <button
          onClick={() => setActiveFeed("personal")}
          style={{
            flex: 1, padding: "10px 12px",
            background: activeFeed === "personal" ? T.bg2 : "transparent",
            color: activeFeed === "personal" ? T.fg : T.fg4,
            border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "none",
            borderBottom: activeFeed === "personal" ? "2px solid " + T.green : "2px solid transparent",
          }}
        >Pour vous</button>
      </div>

      {filtered.length === 0 ? (
        <div style={{
          background: T.bg1, borderRadius: 12, padding: 32, textAlign: "center",
          color: T.fg5, fontSize: 12, border: "1px dashed " + T.brd2,
        }}>
          {activeFeed === "personal"
            ? "Aucun post vous concernant pour l'instant. Jouez quelques matchs."
            : "Le fil est calme. Avancez les semaines."}
        </div>
      ) : (
        filtered.map(renderPost)
      )}
    </div>
  );
}

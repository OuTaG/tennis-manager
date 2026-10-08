// Négociation des contrats de sponsor.
import { useState, useEffect, useRef } from "react";
import { tierLabel } from "../../engine/circuit.js";
import { sponsorSlotWarning } from "../../engine/sponsors.js";
import { Icon, withFlags } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";
import { fmtMoney, fmtNum } from "../format.js";
import { random } from "../../engine/rng.js";

// ── Style BD (bande dessinée) : encre, cases cernées, ombres décalées ──
const INK = T.ink;
const BD = {
  green: "#1f7a45", purple: "#5b2d8e", ball: "#d6ef3c", lilac: "#c9b6ea",
  red: "#c4302b", amber: "#e0a21b", blue: "#2c6fd1", paper: "#ffffff", text: "#141414",
};
const bdPanel = (shadow = 4) => ({ background: BD.paper, color: BD.text, border: "3px solid " + INK, boxShadow: shadow + "px " + shadow + "px 0 " + INK });
const bdChip = (bg, fg) => ({ display: "inline-block", background: bg, color: fg, border: "2px solid " + INK, fontSize: 10.5, fontWeight: 800, padding: "0 6px", textTransform: "uppercase", letterSpacing: 0.3, lineHeight: 1.5, whiteSpace: "nowrap" });
const catChip = (cat) => cat === "equipment" ? bdChip(BD.blue, "#ffffff") : bdChip(BD.ball, BD.text);
function Band({ children, right, bg = INK, fg = "#ffffff" }) {
  return (
    <div style={{ background: bg, color: fg, padding: "5px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <span className="tm-display" style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6 }}>{children}</span>{right}
    </div>
  );
}
const bdPrimary = { ...styles.btnPrimary, background: BD.green, color: "#ffffff", border: "2.5px solid " + INK, boxShadow: "3px 3px 0 " + INK };
const bdSecondary = { ...styles.btnSecondary, background: BD.paper, color: BD.text, border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK };

export function SponsorNegotiationOverlay({ data, player, ranking, onSign, onClose }) {
  const offers = player.sponsorOffers || [];
  const results = data.results || [];
  const phaseLabel = data.phase === "intro" ? "Premier sponsor"
    : data.phase === "mid" ? "Mi-saison " + data.year
    : "Fin de saison " + data.year;

  const tierLabel = { premium: "Premium", high: "Élite", mid: "Confirmé", low: "Régional", entry: "Local" };
  const catLabel = { equipment: "Équipementier", other: "Partenaire" };

  const [view, setView] = useState("table"); // "table" | "nego"
  const [activeOffer, setActiveOffer] = useState(null);
  const [showResults, setShowResults] = useState(results.length > 0);
  // Persist each offer's negotiation state so the player can negotiate several
  // offers, come back to the table, and pick the best one to sign at the end.
  const [negStates, setNegStates] = useState({});

  const openNego = (offer) => { setActiveOffer(offer); setView("nego"); };
  const backToTable = () => { setView("table"); setActiveOffer(null); };

  const updateNegState = (offerId, s) => setNegStates(prev => ({ ...prev, [offerId]: s }));
  const dropNegState = (offerId) => setNegStates(prev => { const n = { ...prev }; delete n[offerId]; return n; });

  // ── Results splash (objectives that just came due) ──
  if (showResults) {
    const total = data.objMoney || 0;
    return (
      <div className="tm-paper" style={ovStyle()}>
        <div style={{ maxWidth: 460, width: "100%", margin: "0 auto", padding: "28px 16px 32px", boxSizing: "border-box" }}>
          <div className="tm-halftone-lilac" style={{ border: "3px solid " + INK, boxShadow: "5px 5px 0 " + INK, padding: "12px 14px", marginBottom: 16, color: BD.text }}>
            <span style={{ ...bdChip(INK, "#ffffff"), display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "normal" }}>
              <Icon name="briefcase" size={11} color="#ffffff" /> Bilan des contrats — {phaseLabel}
            </span>
            <div className="tm-display" style={{ fontSize: 26, lineHeight: 1.05, marginTop: 6 }}>Objectifs échus</div>
          </div>
          <div style={{ ...bdPanel(4), marginBottom: 4 }}>
            {results.map((r, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderTop: i ? "2px dashed " + INK : 0,
              }}>
                <div className="tm-display" style={{
                  width: 26, height: 26, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: r.met ? BD.green : BD.red, color: "#ffffff",
                  border: "2px solid " + INK, fontSize: 14,
                }}>{r.met ? "✓" : "✕"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="tm-display" style={{ fontSize: 15 }}>{r.brand}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.35 }}>
                    {r.objective?.label}{r.met ? " · réussi" : r.broken ? " · contrat rompu" : " · manqué (fin de contrat)"}
                  </div>
                </div>
                <div className="tm-display" style={{ color: r.amount >= 0 ? BD.green : BD.red, fontSize: 15, whiteSpace: "nowrap" }}>
                  {fmtMoney(r.amount, { sign: true })}
                </div>
              </div>
            ))}
          </div>
          {results.length > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span className="tm-display" style={{ fontSize: 15 }}>Total</span>
              <span className="tm-display" style={{ fontSize: 16, background: total >= 0 ? BD.green : BD.red, color: "#ffffff", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, padding: "1px 8px" }}>{fmtMoney(total, { sign: true })}</span>
            </div>
          )}
          <button style={{ ...bdPrimary, width: "100%", marginTop: 20 }} onClick={() => setShowResults(false)}>
            Voir les offres →
          </button>
        </div>
      </div>
    );
  }

  // ── Negotiation room for one offer ──
  if (view === "nego" && activeOffer) {
    return (
      <NegotiationRoom
        offer={activeOffer}
        slotWarning={sponsorSlotWarning(player, activeOffer, ranking)}
        catLabel={catLabel} tierLabel={tierLabel}
        initialState={negStates[activeOffer.id] || null}
        onStateChange={(s) => updateNegState(activeOffer.id, s)}
        isFirstNegotiation={data.phase === "intro"}
        onCancel={backToTable}
        onWalkAway={() => { onWalk(activeOffer); dropNegState(activeOffer.id); backToTable(); }}
        onDeal={(terms) => { onSign(activeOffer, terms); dropNegState(activeOffer.id); setView("table"); setActiveOffer(null); }}
      />
    );
  }

  // helper to remove an offer when the brand walks away
  function onWalk(offer) {
    if (data.onWalkAway) data.onWalkAway(offer.id);
  }

  // ── Offer table ──
  return (
    <div className="tm-paper" style={ovStyle()}>
      <div style={{ maxWidth: 460, width: "100%", margin: "0 auto", padding: "24px 16px 32px", boxSizing: "border-box" }}>
        <div className="tm-halftone-yellow" style={{ border: "3px solid " + INK, boxShadow: "5px 5px 0 " + INK, padding: "12px 14px", marginBottom: 16, color: BD.text }}>
          <span style={{ ...bdChip(INK, "#ffffff"), display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name="briefcase" size={11} color="#ffffff" /> Négociations sponsors
          </span>
          <div className="tm-display" style={{ fontSize: 28, lineHeight: 1.05, marginTop: 6 }}>{phaseLabel}</div>
          <div className="tm-lettering" style={{ fontSize: 16, marginTop: 6 }}>
            {data.phase === "intro"
              ? "Votre premier sponsor ! Touchez l'offre pour apprendre à négocier."
              : "Choisissez un sponsor pour entamer la négociation."}
          </div>
        </div>

        {/* First-negotiation coaching panel — visible only on intro phase.
            Calls out the equipment-vs-partner colour code and the negotiate-
            all-then-sign workflow. */}
        {data.phase === "intro" && offers.length > 0 && (
          <div style={{ ...bdPanel(4), marginBottom: 16 }}>
            <Band><Icon name="briefcase" size={13} color={BD.ball} /> Comment ça marche</Band>
            <ul style={{ margin: 0, padding: "10px 12px 10px 28px", fontSize: 12.5, fontWeight: 600, lineHeight: 1.5 }}>
              <li><span style={bdChip(BD.blue, "#ffffff")}>Bandeau bleu</span> = équipementier (un seul actif). <span style={bdChip(BD.ball, BD.text)}>Bandeau jaune</span> = partenaire (jusqu'à 2 actifs).</li>
              <li style={{ marginTop: 4 }}>Touchez une offre pour entrer en négociation. Vous pouvez en ouvrir plusieurs et revenir comparer avant de signer.</li>
              <li style={{ marginTop: 4 }}>« Demander + » pousse les chiffres. Trop pousser fait baisser la patience du sponsor — il peut quitter.</li>
            </ul>
          </div>
        )}

        {offers.length === 0 ? (
          <div className="tm-lettering" style={{ ...bdPanel(4), padding: "22px 16px", textAlign: "center", fontSize: 17, marginBottom: 20 }}>
            {player.image < 20
              ? "Votre image est trop dégradée : aucun sponsor ne se présente."
              : "Aucune offre cette fois. Améliorez votre classement et votre image pour attirer les marques."}
          </div>
        ) : (
          offers.map((o, oi) => {
            const med = (o.objectiveLevels || []).find(l => l.level === "medium") || (o.objectiveLevels || [])[1];
            const neg = negStates[o.id];
            const currentPay = neg ? neg.weeklyPay : o.weeklyPay;
            const currentBonus = neg ? neg.titleBonus : o.titleBonus;
            const wasNegotiated = neg && (currentPay !== o.openingWeeklyPay || currentBonus !== o.openingTitleBonus || neg.levelId !== "medium");
            const walked = neg && neg.walkedAway;
            // Visual category colour: equipment in blue, other partners in
            // yellow-ball. Helps the player tell categories apart at a glance.
            const catColor = o.cat === "equipment" ? BD.blue : BD.ball;
            // On the first-ever negotiation, gently pulse the very first card
            // so the player knows where to tap. Only when no offer has been
            // opened yet (no negotiation state stored).
            const introHighlight = data.phase === "intro" && oi === 0 && Object.keys(negStates).length === 0;
            const slotWarn = walked ? null : sponsorSlotWarning(player, o, ranking);
            return (
              <button key={o.id} onClick={() => openNego(o)} style={{
                width: "100%", textAlign: "left", cursor: "pointer",
                background: walked ? "#ebe8da" : BD.paper, color: BD.text,
                border: "3px solid " + INK,
                boxShadow: (introHighlight ? "5px 5px 0 " : "4px 4px 0 ") + INK,
                borderRadius: 0, padding: 0, marginBottom: 16, fontFamily: T.body,
                display: "block", opacity: walked ? 0.75 : 1, overflow: "visible",
                position: "relative",
              }}>
                {/* Bandeau de catégorie : bleu = équipementier, jaune = partenaire */}
                <div style={{ height: 8, background: walked ? BD.red : catColor, borderBottom: "2.5px solid " + INK }} />
                {introHighlight && (
                  <span className="tm-display" style={{
                    position: "absolute", top: -12, right: 10, zIndex: 1,
                    background: BD.red, color: "#ffffff", border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK,
                    fontSize: 11.5, padding: "1px 7px", transform: "rotate(3deg)",
                    animation: "pulse 1.4s infinite",
                  }}>Touchez ici !</span>
                )}
                <div style={{ padding: "10px 12px 12px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                      <span style={catChip(o.cat)}>{catLabel[o.cat] || "Partenaire"}</span>
                      <span style={bdChip(BD.paper, BD.text)}>{tierLabel[o.tier] || o.tier}</span>
                      {wasNegotiated && !walked && (
                        <span style={bdChip(BD.green, "#ffffff")}>Négocié</span>
                      )}
                      {walked && (
                        <span style={bdChip(BD.red, "#ffffff")}>Marque partie</span>
                      )}
                      {o.nonNegotiable && !walked && (
                        <span style={bdChip(INK, "#ffffff")}>Non-négociable</span>
                      )}
                    </div>
                    <div className="tm-display" style={{ fontSize: 18, marginTop: 5, overflowWrap: "anywhere" }}>{o.brand}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="tm-display" style={{ color: walked ? "#6b6b6b" : BD.green, fontSize: 17, textDecoration: walked ? "line-through" : "none" }}>{fmtMoney(currentPay)}</div>
                    <div style={{ fontSize: 10.5, fontWeight: 800 }}>/ sem.{wasNegotiated || o.nonNegotiable ? "" : " (négociable)"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ ...bdChip(BD.paper, BD.text), textTransform: "none", fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="trophy" size={10} /> Prime titre <span className="tm-num">{fmtMoney(currentBonus || 0)}</span></span>
                  <span style={{ ...bdChip(BD.paper, BD.text), textTransform: "none", fontSize: 11.5 }}>Durée <span className="tm-num">{Math.round((o.durationWeeks || 0) / 52 * 12)}</span> mois</span>
                  {med && <span style={{ ...bdChip(BD.lilac, BD.text), textTransform: "none", fontSize: 11.5, whiteSpace: "normal", display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="target" size={10} /> {(neg && neg.levelId ? (o.objectiveLevels || []).find(l => l.level === neg.levelId) : med).label}</span>}
                </div>
                {slotWarn && (
                  <div style={{ display: "flex", alignItems: "stretch", marginTop: 10, background: BD.paper, border: "2px solid " + INK, boxShadow: "2px 2px 0 " + INK, color: BD.text, fontSize: 11.5, lineHeight: 1.4, fontWeight: 700 }}>
                    <span style={{ flexShrink: 0, width: 24, display: "flex", alignItems: "center", justifyContent: "center", background: BD.red, borderRight: "2px solid " + INK }}>
                      <Icon name="warning" size={13} color="#ffffff" />
                    </span>
                    <span style={{ padding: "4px 8px", minWidth: 0 }}>{slotWarn.short}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                  <span className="tm-display" style={{
                    background: walked ? BD.paper : BD.green, color: walked ? BD.red : "#ffffff",
                    border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, fontSize: 12.5, padding: "3px 10px",
                  }}>
                    {walked ? "Voir le détail →" : wasNegotiated ? "Reprendre / signer →" : (o.nonNegotiable ? "Examiner →" : "Négocier →")}
                  </span>
                </div>
                </div>
              </button>
            );
          })
        )}

        {/* Premier sponsor : la signature est obligatoire, pas de sortie
            tant que l'offre est sur la table. */}
        {!(data.phase === "intro" && offers.length > 0) && (
          <button style={{ ...bdSecondary, width: "100%", marginTop: 8 }} onClick={onClose}>
            {offers.length > 0 ? "Terminer les négociations" : "Continuer"}
          </button>
        )}
        {offers.length > 0 && data.phase !== "intro" && (
          <div className="tm-lettering" style={{ color: BD.text, fontSize: 14, textAlign: "center", marginTop: 12 }}>
            Les offres non signées seront perdues. Prochaine session de négociation à la mi ou fin de saison.
          </div>
        )}
      </div>
    </div>
  );
}

export function ovStyle() {
  return {
    position: "fixed", inset: 0, zIndex: 60,
    backgroundColor: T.bg0,
    display: "flex", flexDirection: "column",
    animation: "tm-fade-up 0.25s ease-out both",
    overflowY: "auto",
  };
}

// The sequential negotiation room for a single offer.
// State is lifted to the parent (SponsorNegotiationOverlay) via initialState
// + onStateChange so the player can negotiate several offers and come back
// without losing progress on any of them.
export function NegotiationRoom({ offer, slotWarning, catLabel, tierLabel, initialState, onStateChange, isFirstNegotiation, onCancel, onWalkAway, onDeal }) {
  const levels = offer.objectiveLevels || [];
  const [levelId, setLevelId] = useState(initialState?.levelId || "medium");
  const level = levels.find(l => l.level === levelId) || levels[1] || levels[0];

  const [weeklyPay, setWeeklyPay] = useState(initialState?.weeklyPay ?? (offer.openingWeeklyPay || offer.weeklyPay));
  const [titleBonus, setTitleBonus] = useState(initialState?.titleBonus ?? (offer.openingTitleBonus || offer.titleBonus));
  const patienceMax = offer.patience || 2;
  const [patience, setPatience] = useState(initialState?.patience ?? patienceMax);
  const [log, setLog] = useState(initialState?.log || [
    { who: "brand", text: "Ravi de vous rencontrer ! Voici notre proposition. À vous de voir." },
  ]);
  const [closed, setClosed] = useState(initialState?.closed ?? false);
  const [walkedAway, setWalkedAway] = useState(initialState?.walkedAway ?? false);
  const logRef = useRef(null);

  // Mirror state up to the parent on every change so it persists across
  // navigations within the negotiation session.
  useEffect(() => {
    if (onStateChange) onStateChange({ levelId, weeklyPay, titleBonus, patience, log, closed, walkedAway });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId, weeklyPay, titleBonus, patience, log, closed, walkedAway]);

  // Auto-scroll the dialogue to the latest message.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // Premier sponsor : quand il ne reste qu'un cran de patience, on bloque
  // les demandes et on conseille de signer (la marque ne peut pas partir).
  const lastChance = isFirstNegotiation && !offer.nonNegotiable && !closed && patience <= 1 && patienceMax > 1;
  const askLocked = closed || offer.nonNegotiable || lastChance;

  const reward = Math.round((offer.baseReward || 0) * (level?.rewardMul || 1));
  const penalty = Math.round((offer.basePenalty || 0) * (level?.penaltyMul || 1));

  const stepPay = offer.negStepPay || Math.max(20, Math.round((offer.openingWeeklyPay || offer.weeklyPay) * 0.08));
  const stepBonus = offer.negStepBonus || Math.max(100, Math.round((offer.openingTitleBonus || offer.titleBonus || 1000) * 0.08));

  const pushLog = (entry) => setLog(l => [...l, entry]);

  // Ask for more money/bonus. The brand's reaction is probabilistic: even
  // within the published limit there's a non-zero refusal chance, and the
  // closer to the cap the higher the risk. Past the cap, refusal is almost
  // certain. This removes the "stop exactly at the cap" deterministic optimum.
  // Refusals consume patience; running out of patience ends the negotiation.
  const PLAYER_ASK_PAY = [
    "On peut revoir le salaire hebdomadaire à la hausse ?",
    "Honnêtement, je vaux un peu plus que ça par semaine.",
    "Le fixe hebdo me semble léger, vous pouvez pousser ?",
    "J'aimerais qu'on remonte un peu le fixe.",
    "Il faut qu'on parle du salaire, là c'est trop bas.",
    "Un effort sur le hebdo serait apprécié.",
    "D'autres marques me proposent mieux sur le fixe.",
    "Ma progression justifie un salaire plus élevé.",
    "Sur le fixe, on peut aller un cran plus haut ?",
    "Mon équipe pense que le hebdo mérite d'être revu.",
  ];
  const PLAYER_ASK_BONUS = [
    "Et si on augmentait la prime par titre ?",
    "J'aimerais être mieux récompensé quand je gagne. La prime ?",
    "On monte un peu la prime de titre ?",
    "La prime au titre me semble faible, on peut discuter ?",
    "Récompensez la gagne : la prime peut monter ?",
    "Un bonus plus costaud à la clé, ça motive.",
    "Je vise haut cette saison, faites-en autant sur la prime.",
    "Sur les primes de victoire, on peut faire mieux ?",
    "La prime titre est un peu chiche à mon goût.",
    "Mon agent tient à ce qu'on remonte la prime.",
  ];
  const BRAND_ACCEPT_PAY = [
    "C'est noté, on monte à {v}\u00a0€/semaine.",
    "Marché conclu sur ce point : {v}\u00a0€/semaine.",
    "D'accord, {v}\u00a0€/semaine, vous les valez.",
    "Va pour {v}\u00a0€ hebdo, on avance.",
    "Entendu, on aligne le fixe à {v}\u00a0€/semaine.",
    "On peut monter à {v}\u00a0€ par semaine, c'est validé.",
    "Vendu : {v}\u00a0€/semaine sur le fixe.",
    "OK, {v}\u00a0€ hebdo, ça reste dans nos moyens.",
    "On valide {v}\u00a0€/semaine. Bonne base pour travailler ensemble.",
  ];
  const BRAND_ACCEPT_BONUS = [
    "Très bien, {v}\u00a0€ par titre remporté.",
    "Entendu, la prime passe à {v}\u00a0€ par titre.",
    "Ça marche : {v}\u00a0€ pour chaque titre.",
    "Va pour {v}\u00a0€ à chaque trophée.",
    "On valide : {v}\u00a0€ par titre soulevé.",
    "OK, on cale la prime à {v}\u00a0€ par titre.",
    "Bonne motivation pour vous : {v}\u00a0€ par titre.",
    "Adjugé, {v}\u00a0€ à chaque victoire finale.",
  ];
  const BRAND_PUSHBACK = [
    "Là, vous nous serrez sérieusement…",
    "On commence à atteindre nos limites, attention.",
    "C'est ambitieux. Notre marge devient mince.",
    "On veut bien discuter, mais ne tirez pas trop sur la corde.",
    "Non, on ne peut pas aller plus haut sur ce point.",
    "On va devoir refuser cette demande-là.",
    "Ça ne passera pas au comité, désolé.",
    "Là on doit dire non, restons raisonnables.",
    "Franchement, c'est au-dessus de nos moyens.",
    "Notre direction ne signerait jamais à ce niveau.",
    "Impossible d'aller plus loin sur cette ligne.",
    "Notre plafond est atteint, on reste où on est.",
    "Refus poli mais ferme sur ce point.",
    "Nos concurrents ne paieraient pas non plus autant.",
    "Ce n'est pas dans notre grille tarifaire, désolé.",
    "On préfère en rester au chiffre précédent.",
  ];
  const BRAND_WALK = [
    "C'est au-delà de ce que nous pouvons faire. Nous préférons en rester là.",
    "Désolé, mais nous arrêtons là les discussions.",
    "Ce n'est plus raisonnable pour nous. Nous retirons notre offre.",
    "Nous mettons fin à la négociation. Bonne continuation.",
    "Impossible de continuer sur ces bases. On se retire.",
    "Nous préférons nous tourner vers un autre joueur.",
    "La discussion tourne court : nous retirons notre proposition.",
  ];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Acceptance probability based on how far we've pushed beyond the opening.
  // Returns a probability in [0, 1].
  const acceptProbFor = (current, opening, cap) => {
    const span = Math.max(1, cap - opening);
    const r = (current - opening) / span;
    if (r <= 0)    return 0.99;
    if (r <= 0.35) return 0.94;
    if (r <= 0.65) return 0.78;
    if (r <= 1.0)  return 0.55 - (r - 0.65) * 1.0; // 0.55 → 0.20 across the cap zone
    return Math.max(0.04, 0.20 - (r - 1.0) * 0.4); // past the cap: very low
  };

  const demand = (kind) => {
    if (askLocked) return;
    const nextPay   = kind === "pay"   ? weeklyPay  + stepPay   : weeklyPay;
    const nextBonus = kind === "bonus" ? titleBonus + stepBonus : titleBonus;
    const prob = kind === "pay"
      ? acceptProbFor(nextPay,   offer.openingWeeklyPay,  offer.maxWeeklyPay)
      : acceptProbFor(nextBonus, offer.openingTitleBonus, offer.maxTitleBonus);
    const accepted = random() < prob;

    pushLog({ who: "player", text: pick(kind === "pay" ? PLAYER_ASK_PAY : PLAYER_ASK_BONUS) });

    if (accepted) {
      if (kind === "pay") {
        setWeeklyPay(nextPay);
        pushLog({ who: "brand", text: pick(BRAND_ACCEPT_PAY).replace("{v}", fmtNum(nextPay)) });
      } else {
        setTitleBonus(nextBonus);
        pushLog({ who: "brand", text: pick(BRAND_ACCEPT_BONUS).replace("{v}", fmtNum(nextBonus)) });
      }
      return;
    }
    // Refusal — consumes patience without changing the amount.
    const left = patience - 1;
    setPatience(left);
    if (left <= 0) {
      pushLog({ who: "brand", text: pick(BRAND_WALK) });
      setClosed(true);
      setWalkedAway(true);
    } else {
      pushLog({ who: "brand", text: pick(BRAND_PUSHBACK) });
    }
  };

  const askLabel = offer.nonNegotiable || lastChance ? "Verrouillé" : "Demander +";
  const introAsk = isFirstNegotiation && log.length <= 1 && !askLocked;
  const termRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "9px 12px" };
  const termLabel = { fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.3 };

  return (
    <div className="tm-paper" style={ovStyle()}>
      <div style={{ maxWidth: 460, width: "100%", margin: "0 auto", padding: "18px 16px 32px", boxSizing: "border-box" }}>
        <button onClick={onCancel} className="tm-display" style={{ background: BD.paper, color: BD.text, border: "2px solid " + INK, boxShadow: "2px 2px 0 " + INK, fontSize: 12, padding: "4px 10px", cursor: "pointer", marginBottom: 14 }}>← Retour aux offres</button>

        <div style={{ ...bdPanel(5), display: "flex", alignItems: "stretch", marginBottom: 4, overflow: "hidden" }}>
          <div style={{ width: 10, flexShrink: 0, background: offer.cat === "equipment" ? BD.blue : BD.ball, borderRight: "2.5px solid " + INK }} />
          <div style={{ flex: 1, minWidth: 0, padding: "10px 12px" }}>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              <span style={catChip(offer.cat)}>{catLabel[offer.cat] || "Partenaire"}</span>
              <span style={bdChip(BD.paper, BD.text)}>{tierLabel[offer.tier] || offer.tier}</span>
            </div>
            <div className="tm-display" style={{ fontSize: 24, lineHeight: 1.05, marginTop: 6, overflowWrap: "anywhere" }}>{offer.brand}</div>
          </div>
          <div className="tm-halftone-lilac" style={{ width: 58, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "2.5px solid " + INK }}>
            <Icon name="briefcase" size={26} color={INK} />
          </div>
        </div>

        {slotWarning && (
          <div style={{ ...bdPanel(3), marginTop: 14, overflow: "hidden" }}>
            <Band bg={BD.red}><Icon name="warning" size={13} color="#ffffff" /> Emplacements pleins</Band>
            <div style={{ padding: "8px 12px", fontSize: 12.5, fontWeight: 600, lineHeight: 1.5 }}>{slotWarning.long}</div>
          </div>
        )}

        {/* First-time-only coaching strip: explains the two "Demander +"
            buttons, the patience gauge and the sign/walk-away outcomes. */}
        {isFirstNegotiation && !offer.nonNegotiable && (
          <div style={{ ...bdPanel(3), marginTop: 14, display: "flex", alignItems: "stretch", overflow: "hidden" }}>
            <div className="tm-display" style={{
              flexShrink: 0, width: 36, background: BD.ball, borderRight: "2.5px solid " + INK,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>?</div>
            <div style={{ flex: 1, minWidth: 0, padding: "9px 12px", fontSize: 12.5, fontWeight: 600, lineHeight: 1.5 }}>
              <strong className="tm-display" style={{ fontSize: 12.5, fontWeight: 400 }}>Comment négocier :</strong> appuyez sur « Demander + » pour pousser le salaire ou la prime. La jauge de patience baisse à chaque refus — si elle atteint zéro, la marque s'en va. Quand c'est bon, signez. Pour comparer avec d'autres offres avant de signer, touchez « ← Retour aux offres ».
            </div>
          </div>
        )}

        {offer.nonNegotiable && (
          <div style={{ ...bdPanel(3), marginTop: 14, overflow: "hidden" }}>
            <Band bg={BD.amber} fg={BD.text}>À prendre ou à laisser</Band>
            <div style={{ padding: "8px 12px", fontSize: 12.5, fontWeight: 600, lineHeight: 1.5 }}>
              Cette marque ne négocie pas : les conditions ci-dessous sont fermes. Vous signez tel quel ou vous passez.
            </div>
          </div>
        )}

        {/* Dialogue log — cases de BD avec bulles */}
        <div style={{ ...bdPanel(4), margin: "16px 0", overflow: "hidden" }}>
          <Band right={<span style={bdChip(BD.ball, BD.text)}>{log.length} répl.</span>}>Le face-à-face</Band>
          <div ref={logRef} className="tm-halftone-cyan" style={{ padding: "12px 12px 14px", height: 230, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 14 }}>
            {log.map((e, i) => {
              const me = e.who === "player";
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: me ? "flex-end" : "flex-start" }}>
                  <span style={{ ...bdChip(me ? BD.ball : INK, me ? BD.text : "#ffffff"), fontSize: 10, marginBottom: 4, maxWidth: "80%", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {me ? "Vous" : offer.brand}
                  </span>
                  <div className="tm-lettering" style={{
                    position: "relative", maxWidth: "84%", fontSize: 16, lineHeight: 1.2, padding: "7px 11px 8px",
                    background: me ? BD.ball : BD.paper, color: BD.text,
                    border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK,
                    overflowWrap: "anywhere",
                  }}>
                    {withFlags(e.text)}
                    {/* Queue de bulle */}
                    <span aria-hidden="true" style={{
                      position: "absolute", bottom: -7, [me ? "right" : "left"]: 14,
                      width: 11, height: 11, background: me ? BD.ball : BD.paper,
                      borderRight: "2.5px solid " + INK, borderBottom: "2.5px solid " + INK,
                      transform: "rotate(45deg)",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Objective difficulty */}
        <div style={{ ...bdPanel(4), marginBottom: 16, overflow: "hidden" }}>
          <Band><Icon name="target" size={13} color={BD.ball} /> Niveau d'objectif</Band>
          <div style={{ padding: "10px 12px 12px" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {levels.map(l => {
                const active = l.level === levelId;
                const lab = { easy: "Facile", medium: "Moyen", hard: "Ambitieux" }[l.level] || l.level;
                return (
                  <button key={l.level} className="tm-display" onClick={() => !closed && setLevelId(l.level)} style={{
                    flex: 1, minWidth: 0, padding: "7px 2px", borderRadius: 0, cursor: closed ? "default" : "pointer",
                    background: active ? BD.purple : BD.paper, color: active ? "#ffffff" : BD.text,
                    border: "2.5px solid " + INK, boxShadow: active ? "none" : "2px 2px 0 " + INK,
                    transform: active ? "translate(2px, 2px)" : "none", fontSize: 12.5,
                  }}>{lab}</button>
                );
              })}
            </div>
            {level && (
              <>
                <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 8, lineHeight: 1.35 }}>{level.label}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["Réussi", fmtMoney(reward, { sign: true }), BD.green], ["Échoué", fmtMoney(-penalty, { sign: true }), BD.red]].map(([l, v, c]) => (
                    <div key={l} style={{ flex: 1, minWidth: 0, border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, background: BD.paper, overflow: "hidden" }}>
                      <div className="tm-display" style={{ background: c, color: "#ffffff", fontSize: 11, padding: "2px 8px", borderBottom: "2px solid " + INK }}>{l}</div>
                      <div className="tm-display" style={{ color: c, fontSize: 16, padding: "5px 8px", textAlign: "center" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="tm-lettering" style={{ fontSize: 14, marginTop: 8 }}>En cas d'échec, le contrat est rompu.</div>
                <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 4, lineHeight: 1.4 }}>
                  À réaliser sur toute la durée du contrat ({offer.durationWeeks || 26} semaines).
                </div>
              </>
            )}
          </div>
        </div>

        {/* Patience gauge — only meaningful for negotiable offers. */}
        {!offer.nonNegotiable && (() => {
          const frac = Math.max(0, Math.min(1, patience / patienceMax));
          const col = walkedAway ? BD.red : frac > 0.66 ? BD.green : frac > 0.33 ? BD.amber : BD.red;
          const mood = walkedAway ? "A quitté la table"
            : frac > 0.66 ? "Détendu" : frac > 0.33 ? "Sur ses gardes" : "À bout de patience";
          return (
            <div style={{ ...bdPanel(3), padding: "8px 12px 10px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span className="tm-display" style={{ fontSize: 13 }}>Patience du sponsor</span>
                <span style={{ ...bdChip(col, col === BD.amber ? BD.text : "#ffffff") }}>{mood}</span>
              </div>
              <div style={{ height: 14, background: BD.paper, border: "2.5px solid " + INK, overflow: "hidden" }}>
                <div style={{ width: (frac * 100).toFixed(0) + "%", height: "100%", background: col, borderRight: frac > 0 && frac < 1 ? "2.5px solid " + INK : 0, boxSizing: "border-box", transition: "width 0.4s, background 0.4s" }} />
              </div>
            </div>
          );
        })()}

        {lastChance && (
          <div role="alert" style={{ ...bdPanel(5), marginBottom: 16, overflow: "hidden" }}>
            {/* Bandeau rouge tramé : case d'icône penchée + titre encré */}
            <div style={{ background: BD.red, backgroundImage: "radial-gradient(rgba(20,20,20,0.22) 1.3px, transparent 1.5px)", backgroundSize: "6px 6px", borderBottom: "3px solid " + INK, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: BD.paper, border: "2.5px solid " + INK, boxShadow: "2px 2px 0 " + INK, transform: "rotate(-4deg)" }}>
                <Icon name="warning" size={18} color={BD.red} />
              </span>
              <strong className="tm-display" style={{ color: "#ffffff", fontSize: 15, fontWeight: 400, lineHeight: 1.15, textShadow: "1.5px 1.5px 0 " + INK }}>Attention, la marque est à bout de patience.</strong>
            </div>
            <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
              <div className="tm-lettering" style={{ fontSize: 17, lineHeight: 1.2 }}>Une demande de plus et elle pourrait quitter la table.</div>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.45 }}>Pour votre premier contrat, mieux vaut ne pas prendre de risque : signez avec les conditions actuelles.</div>
            </div>
          </div>
        )}

        {/* Money terms */}
        <div style={{ ...bdPanel(4), marginBottom: 18, overflow: "hidden" }}>
          <Band>Conditions financières</Band>
          <div style={termRow}>
            <div style={{ minWidth: 0 }}>
              <div style={termLabel}>Salaire hebdomadaire</div>
              <div className="tm-display" style={{ color: BD.green, fontSize: 19 }}>{fmtMoney(weeklyPay)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {introAsk && (
                <span className="tm-display" style={{ color: BD.red, fontSize: 20, animation: "tm-bounce-x 1.1s infinite" }}>→</span>
              )}
              <button
                disabled={askLocked}
                onClick={() => demand("pay")}
                style={{
                  ...negBtnStyle(askLocked),
                  ...(introAsk ? { background: BD.ball } : null),
                }}
              >{askLabel}</button>
            </div>
          </div>
          <div style={{ ...termRow, borderTop: "2px dashed " + INK }}>
            <div style={{ minWidth: 0 }}>
              <div style={termLabel}>Prime par titre</div>
              <div className="tm-display" style={{ fontSize: 19 }}>{fmtMoney(titleBonus)}</div>
            </div>
            <button disabled={askLocked} onClick={() => demand("bonus")} style={negBtnStyle(askLocked)}>{askLabel}</button>
          </div>
          <div style={{ ...termRow, borderTop: "2px dashed " + INK }}>
            <div style={{ minWidth: 0 }}>
              <div style={termLabel}>Durée du contrat</div>
              <div className="tm-display" style={{ fontSize: 19 }}>{offer.durationWeeks} sem. <span className="tm-lettering" style={{ fontSize: 14, textTransform: "none", letterSpacing: 0 }}>(objectif sur toute la durée)</span></div>
            </div>
          </div>
        </div>

        {walkedAway ? (
          <div>
            <div className="tm-halftone-magenta" style={{ border: "3px solid " + INK, boxShadow: "4px 4px 0 " + INK, padding: "12px 14px", marginBottom: 14, textAlign: "center", color: "#ffffff" }}>
              <div style={{ marginBottom: 4 }}><Icon name="arrowLeft" size={24} color="#ffffff" /></div>
              <div className="tm-display" style={{ fontSize: 20, marginBottom: 6, textShadow: "2px 2px 0 " + INK }}>Négociation rompue</div>
              <div className="tm-lettering" style={{ fontSize: 15, lineHeight: 1.25, background: BD.paper, color: BD.text, border: "2px solid " + INK, padding: "6px 8px" }}>
                {offer.brand} a mis fin aux discussions. Vous avez été trop gourmand : cette offre est perdue.
              </div>
            </div>
            <button style={{ ...bdSecondary, width: "100%" }} onClick={onWalkAway}>
              Retour aux offres
            </button>
          </div>
        ) : (
          <>
            <button style={{ ...bdPrimary, width: "100%" }}
              onClick={() => onDeal({ weeklyPay, titleBonus, level })}>
              Signer le contrat
            </button>
            {!isFirstNegotiation && (
              <button style={{ ...bdSecondary, width: "100%", marginTop: 10, color: BD.red }} onClick={onCancel}>
                Abandonner cette offre
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function negBtnStyle(closed) {
  return {
    background: closed ? "#ebe8da" : BD.paper, color: closed ? "#6b6b6b" : BD.text,
    border: "2.5px solid " + INK, boxShadow: closed ? "none" : "2px 2px 0 " + INK,
    borderRadius: 0, padding: "7px 10px", fontSize: 12.5, fontWeight: 400, fontFamily: T.display,
    textTransform: "uppercase", cursor: closed ? "default" : "pointer", whiteSpace: "nowrap",
  };
}

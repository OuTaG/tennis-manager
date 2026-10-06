// Négociation des contrats de sponsor.
import { useState, useEffect, useRef } from "react";
import { tierLabel } from "../../engine/circuit.js";
import { sponsorSlotWarning } from "../../engine/sponsors.js";
import { Icon, withFlags } from "../icons.jsx";
import { styles } from "../styles.js";
import { T } from "../theme.js";
import { random } from "../../engine/rng.js";

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
      <div style={ovStyle()}>
        <div style={{ maxWidth: 460, width: "100%", margin: "0 auto", padding: "32px 18px" }}>
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div className="tm-eyebrow" style={{ color: T.ball, marginBottom: 6 }}>
              <Icon name="briefcase" size={11} /> Bilan des contrats — {phaseLabel}
            </div>
            <div style={{ color: T.fg, fontSize: 22, fontWeight: 900 }}>Objectifs échus</div>
          </div>
          {results.map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: T.bg1, border: "1px solid " + (r.met ? T.greenBrd : "var(--tm-redBrd)"),
              borderRadius: 0, padding: "12px 14px", marginBottom: 8,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 0, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: r.met ? T.greenSub : "var(--tm-redSub)",
                border: "1px solid " + (r.met ? T.green : T.red),
                color: r.met ? T.green : T.red, fontWeight: 900, fontSize: 13,
              }}>{r.met ? "✓" : "✕"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: T.fg, fontWeight: 700, fontSize: 14 }}>{r.brand}</div>
                <div style={{ color: T.fg4, fontSize: 11 }}>
                  {r.objective?.label}{r.met ? " · réussi" : r.broken ? " · contrat rompu" : " · manqué (fin de contrat)"}
                </div>
              </div>
              <div style={{ color: r.amount >= 0 ? T.green : T.red, fontWeight: 800, fontSize: 14, fontFamily: T.mono, whiteSpace: "nowrap" }}>
                {r.amount >= 0 ? "+" : "−"}{Math.abs(r.amount).toLocaleString()}€
              </div>
            </div>
          ))}
          {results.length > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", marginTop: 4, color: total >= 0 ? T.green : T.red, fontWeight: 800, fontSize: 15, borderTop: "1px solid " + T.brd }}>
              <span>Total</span>
              <span style={{ fontFamily: T.mono }}>{total >= 0 ? "+" : "−"}{Math.abs(total).toLocaleString()}€</span>
            </div>
          )}
          <button style={{ ...styles.btnPrimary, width: "100%", marginTop: 18 }} onClick={() => setShowResults(false)}>
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
    <div style={ovStyle()}>
      <div style={{ maxWidth: 460, width: "100%", margin: "0 auto", padding: "28px 18px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div className="tm-eyebrow" style={{ color: T.ball, marginBottom: 6 }}>
            <Icon name="briefcase" size={11} /> Négociations sponsors
          </div>
          <div style={{ color: T.fg, fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>{phaseLabel}</div>
          <div style={{ color: T.fg4, fontSize: 13, marginTop: 4 }}>
            {data.phase === "intro"
              ? "Votre premier sponsor ! Touchez l'offre pour apprendre à négocier."
              : "Choisissez un sponsor pour entamer la négociation."}
          </div>
        </div>

        {/* First-negotiation coaching panel — visible only on intro phase.
            Calls out the equipment-vs-partner colour code and the negotiate-
            all-then-sign workflow. */}
        {data.phase === "intro" && offers.length > 0 && (
          <div style={{
            background: T.bg1, border: "1px solid " + T.greenBrd,
            borderLeft: "4px solid " + T.green,
            borderRadius: 0, padding: 14, marginBottom: 14,
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <div style={{
              flexShrink: 0, width: 32, height: 32, borderRadius: 0,
              background: T.greenSub, border: "1px solid " + T.greenBrd,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="briefcase" size={16} color={T.green} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: T.fg, fontWeight: 800, fontSize: 13, marginBottom: 6, letterSpacing: 0.2 }}>
                Comment ça marche
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, color: T.fg3, fontSize: 12, lineHeight: 1.55 }}>
                <li><strong style={{ color: "var(--tm-blue)" }}>Bandeau bleu</strong> = équipementier (un seul actif). <strong style={{ color: T.ball }}>Bandeau jaune</strong> = partenaire (jusqu'à 2 actifs).</li>
                <li>Touchez une offre pour entrer en négociation. Vous pouvez en ouvrir plusieurs et revenir comparer avant de signer.</li>
                <li>« Demander + » pousse les chiffres. Trop pousser fait baisser la patience du sponsor — il peut quitter.</li>
              </ul>
            </div>
          </div>
        )}

        {offers.length === 0 ? (
          <div style={{ background: T.bg1, border: "2px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, borderRadius: 0, padding: "24px 16px", textAlign: "center", color: T.fg4, fontSize: 13, marginBottom: 20 }}>
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
            const catColor = o.cat === "equipment" ? "var(--tm-blue)" : T.ball;
            const catBg    = o.cat === "equipment" ? "var(--tm-blueSub)" : T.amberSub;
            const catBrd   = o.cat === "equipment" ? "var(--tm-blueBrd)" : "var(--tm-amberBrd)";
            // On the first-ever negotiation, gently pulse the very first card
            // so the player knows where to tap. Only when no offer has been
            // opened yet (no negotiation state stored).
            const introHighlight = data.phase === "intro" && oi === 0 && Object.keys(negStates).length === 0;
            const slotWarn = walked ? null : sponsorSlotWarning(player, o, ranking);
            return (
              <button key={o.id} onClick={() => openNego(o)} style={{
                width: "100%", textAlign: "left", cursor: "pointer",
                background: walked ? T.bg2 : T.bg1,
                border: "1px solid " + (walked ? "var(--tm-redBrd)" : wasNegotiated ? T.greenBrd : catBrd),
                borderLeft: "4px solid " + (walked ? T.red : catColor),
                borderRadius: 0, padding: 14, marginBottom: 12, fontFamily: T.body,
                display: "block", opacity: walked ? 0.7 : 1,
                boxShadow: introHighlight ? "0 0 0 2px " + T.green + ", 0 0 24px " + T.greenSub : "none",
                animation: introHighlight ? "tm-pulse-green 1.8s infinite" : "none",
                position: "relative",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ color: T.fg, fontWeight: 800, fontSize: 16 }}>{o.brand}</span>
                      {wasNegotiated && !walked && (
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, padding: "2px 6px", borderRadius: 0, background: T.greenSub, color: T.green, border: "1px solid " + T.greenBrd, textTransform: "none" }}>Négocié</span>
                      )}
                      {walked && (
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, padding: "2px 6px", borderRadius: 0, background: "var(--tm-redSub)", color: T.red, border: "1px solid var(--tm-redBrd)", textTransform: "none" }}>Marque partie</span>
                      )}
                      {o.nonNegotiable && !walked && (
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, padding: "2px 6px", borderRadius: 0, background: T.bg3, color: T.fg3, border: "2px solid " + T.ink, textTransform: "none" }}>Non-négociable</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 0, background: catColor }} />
                      <span style={{ color: T.fg4, fontSize: 11 }}>
                        {catLabel[o.cat] || "Partenaire"} · {tierLabel[o.tier] || o.tier}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: walked ? T.fg5 : T.green, fontWeight: 800, fontSize: 15, fontFamily: T.mono }}>{currentPay.toLocaleString()}€</div>
                    <div style={{ color: T.fg5, fontSize: 10 }}>/ sem.{wasNegotiated || o.nonNegotiable ? "" : " (négociable)"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={styles.tournChip}><Icon name="trophy" size={10} /> Prime titre <span className="tm-num">{(currentBonus || 0).toLocaleString()}€</span></span>
                  <span style={styles.tournChip}>Durée <span className="tm-num">{Math.round((o.durationWeeks || 0) / 52 * 12)}</span> mois</span>
                  {med && <span style={{ ...styles.tournChip, color: T.ball }}><Icon name="target" size={10} /> {(neg && neg.levelId ? (o.objectiveLevels || []).find(l => l.level === neg.levelId) : med).label}</span>}
                </div>
                {slotWarn && (
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginTop: 10, padding: "8px 10px", borderRadius: 0, background: "var(--tm-redSub)", border: "1px solid var(--tm-redBrd)", color: T.red, fontSize: 11, lineHeight: 1.4, fontWeight: 600 }}>
                    <span>{slotWarn.short}</span>
                  </div>
                )}
                <div style={{ color: walked ? T.red : T.green, fontSize: 11, fontWeight: 700, marginTop: 10 }}>
                  {walked ? "Voir le détail →" : wasNegotiated ? "Reprendre / signer →" : (o.nonNegotiable ? "Examiner →" : "Négocier →")}
                </div>
              </button>
            );
          })
        )}

        {/* Premier sponsor : la signature est obligatoire, pas de sortie
            tant que l'offre est sur la table. */}
        {!(data.phase === "intro" && offers.length > 0) && (
          <button style={{ ...styles.btnSecondary, width: "100%", marginTop: 8 }} onClick={onClose}>
            {offers.length > 0 ? "Terminer les négociations" : "Continuer"}
          </button>
        )}
        {offers.length > 0 && data.phase !== "intro" && (
          <div style={{ color: T.fg5, fontSize: 11, textAlign: "center", marginTop: 10 }}>
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
    background: T.bg0,
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
    "C'est noté, on monte à {v}€/semaine.",
    "Marché conclu sur ce point : {v}€/semaine.",
    "D'accord, {v}€/semaine, vous les valez.",
    "Va pour {v}€ hebdo, on avance.",
    "Entendu, on aligne le fixe à {v}€/semaine.",
    "On peut monter à {v}€ par semaine, c'est validé.",
    "Vendu : {v}€/semaine sur le fixe.",
    "OK, {v}€ hebdo, ça reste dans nos moyens.",
    "On valide {v}€/semaine. Bonne base pour travailler ensemble.",
  ];
  const BRAND_ACCEPT_BONUS = [
    "Très bien, {v}€ par titre remporté.",
    "Entendu, la prime passe à {v}€ par titre.",
    "Ça marche : {v}€ pour chaque titre.",
    "Va pour {v}€ à chaque trophée.",
    "On valide : {v}€ par titre soulevé.",
    "OK, on cale la prime à {v}€ par titre.",
    "Bonne motivation pour vous : {v}€ par titre.",
    "Adjugé, {v}€ à chaque victoire finale.",
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
        pushLog({ who: "brand", text: pick(BRAND_ACCEPT_PAY).replace("{v}", nextPay.toLocaleString()) });
      } else {
        setTitleBonus(nextBonus);
        pushLog({ who: "brand", text: pick(BRAND_ACCEPT_BONUS).replace("{v}", nextBonus.toLocaleString()) });
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

  return (
    <div style={ovStyle()}>
      <div style={{ maxWidth: 460, width: "100%", margin: "0 auto", padding: "24px 18px 32px" }}>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: T.fg4, fontSize: 13, cursor: "pointer", marginBottom: 12, fontFamily: T.body }}>← Retour aux offres</button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <div style={{ color: T.fg, fontSize: 22, fontWeight: 900 }}>{offer.brand}</div>
            <div style={{ color: T.fg4, fontSize: 12 }}>{catLabel[offer.cat] || "Partenaire"} · {tierLabel[offer.tier] || offer.tier}</div>
          </div>
          <Icon name="briefcase" size={26} color={T.ball} />
        </div>

        {slotWarning && (
          <div style={{
            marginTop: 12, padding: "10px 12px", borderRadius: 0,
            background: "var(--tm-redSub)", border: "1px solid var(--tm-redBrd)",
            borderLeft: "4px solid " + T.red, color: T.fg2, fontSize: 12, lineHeight: 1.5,
          }}>
            <div style={{ color: T.red, fontWeight: 800, fontSize: 11, letterSpacing: 0.2, textTransform: "none", marginBottom: 4 }}>Emplacements pleins</div>
            {slotWarning.long}
          </div>
        )}

        {/* First-time-only coaching strip: explains the two "Demander +"
            buttons, the patience gauge and the sign/walk-away outcomes. */}
        {isFirstNegotiation && !offer.nonNegotiable && (
          <div style={{
            marginTop: 12, padding: "12px 14px", borderRadius: 0,
            background: T.bg1, border: "1px solid " + T.greenBrd,
            borderLeft: "4px solid " + T.green,
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <div style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: 0,
              background: T.greenSub, border: "1px solid " + T.greenBrd,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: T.green, fontWeight: 900, fontSize: 14, fontFamily: T.mono,
            }}>?</div>
            <div style={{ flex: 1, color: T.fg3, fontSize: 12, lineHeight: 1.55 }}>
              <strong style={{ color: T.fg }}>Comment négocier :</strong> appuyez sur « Demander + » pour pousser le salaire ou la prime. La jauge de patience baisse à chaque refus — si elle atteint zéro, la marque s'en va. Quand c'est bon, signez. Pour comparer avec d'autres offres avant de signer, touchez « ← Retour aux offres ».
            </div>
          </div>
        )}

        {offer.nonNegotiable && (
          <div style={{
            marginTop: 12, padding: "10px 12px", borderRadius: 0,
            background: T.bg2, border: "2px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, color: T.fg2, fontSize: 12, lineHeight: 1.5,
          }}>
            <div style={{ color: T.amber, fontWeight: 800, fontSize: 11, letterSpacing: 0.2, textTransform: "none", marginBottom: 4 }}>À prendre ou à laisser</div>
            Cette marque ne négocie pas : les conditions ci-dessous sont fermes. Vous signez tel quel ou vous passez.
          </div>
        )}

        {/* Dialogue log */}
        <div ref={logRef} style={{ background: T.bg1, border: "2px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, borderRadius: 0, padding: 14, margin: "12px 0", height: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {log.map((e, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: e.who === "player" ? "flex-end" : "flex-start" }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.2, textTransform: "none", color: e.who === "player" ? T.green : T.fg5, marginBottom: 3, padding: "0 4px" }}>
                {e.who === "player" ? "Vous" : offer.brand}
              </div>
              <div style={{
                maxWidth: "85%", fontSize: 13, lineHeight: 1.45, padding: "9px 13px", borderRadius: 0,
                borderBottomRightRadius: e.who === "player" ? 3 : 12,
                borderBottomLeftRadius: e.who === "player" ? 12 : 3,
                background: e.who === "player" ? T.greenSub : T.bg3,
                color: e.who === "player" ? T.green : T.fg,
                border: "1px solid " + (e.who === "player" ? T.greenBrd : T.brd2),
                fontWeight: 500,
              }}>{withFlags(e.text)}</div>
            </div>
          ))}
        </div>

        {/* Objective difficulty */}
        <div className="tm-eyebrow" style={{ color: T.ball, marginBottom: 8 }}><Icon name="target" size={10} /> Niveau d'objectif</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {levels.map(l => {
            const active = l.level === levelId;
            const lab = { easy: "Facile", medium: "Moyen", hard: "Ambitieux" }[l.level] || l.level;
            return (
              <button key={l.level} onClick={() => !closed && setLevelId(l.level)} style={{
                flex: 1, padding: "8px 4px", borderRadius: 0, cursor: closed ? "default" : "pointer", fontFamily: T.body,
                background: active ? T.greenSub : T.bg2, border: "1px solid " + (active ? T.green : T.brd2),
                color: active ? T.green : T.fg3, fontWeight: 700, fontSize: 12,
              }}>{lab}</button>
            );
          })}
        </div>
        {level && (
          <div style={{ background: T.bg2, borderRadius: 0, padding: "10px 12px", marginBottom: 14, border: "2px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink }}>
            <div style={{ color: T.fg2, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{level.label}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: T.greenSub, border: "1px solid " + T.greenBrd, borderRadius: 0, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ color: T.fg5, fontSize: 9, fontWeight: 700 }}>Réussi</div>
                <div style={{ color: T.green, fontWeight: 800, fontSize: 13, fontFamily: T.mono }}>+{reward.toLocaleString()}€</div>
              </div>
              <div style={{ flex: 1, background: "var(--tm-redSub)", border: "1px solid var(--tm-redBrd)", borderRadius: 0, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ color: T.fg5, fontSize: 9, fontWeight: 700 }}>Échoué</div>
                <div style={{ color: T.red, fontWeight: 800, fontSize: 13, fontFamily: T.mono }}>−{penalty.toLocaleString()}€</div>
              </div>
            </div>
            <div style={{ color: T.fg5, fontSize: 10, marginTop: 6, fontStyle: "italic" }}>En cas d'échec, le contrat est rompu.</div>
            <div style={{ color: T.amber, fontSize: 10, marginTop: 4, lineHeight: 1.4 }}>
              À réaliser sur toute la durée du contrat ({offer.durationWeeks || 26} semaines).
            </div>
          </div>
        )}

        {/* Patience gauge — only meaningful for negotiable offers. */}
        {!offer.nonNegotiable && (() => {
          const frac = Math.max(0, Math.min(1, patience / patienceMax));
          const col = walkedAway ? T.red : frac > 0.66 ? T.green : frac > 0.33 ? T.amber : T.red;
          const mood = walkedAway ? "A quitté la table"
            : frac > 0.66 ? "Détendu" : frac > 0.33 ? "Sur ses gardes" : "À bout de patience";
          return (
            <div style={{ marginTop: 2, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span className="tm-eyebrow" style={{ color: T.fg5 }}>Patience du sponsor</span>
                <span style={{ color: col, fontSize: 11, fontWeight: 700 }}>{mood}</span>
              </div>
              <div style={{ height: 7, background: T.bg3, borderRadius: 0, overflow: "hidden", border: "2px solid " + T.ink }}>
                <div style={{ width: (frac * 100).toFixed(0) + "%", height: "100%", background: col, borderRadius: 0, transition: "width 0.4s, background 0.4s" }} />
              </div>
            </div>
          );
        })()}

        {lastChance && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, padding: "10px 12px", background: "#fff6c9", color: "#141414", border: "2.5px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink }}>
            <Icon name="warning" size={18} color="#c4302b" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12.5, lineHeight: 1.45 }}>
              <strong>Attention, la marque est à bout de patience.</strong> Une demande de plus et elle pourrait quitter la table. Pour votre premier contrat, mieux vaut ne pas prendre de risque : signez avec les conditions actuelles.
            </div>
          </div>
        )}

        {/* Money terms */}
        <div className="tm-eyebrow" style={{ marginBottom: 8 }}>Conditions financières</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.bg1, border: "2px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, borderRadius: 0, padding: "10px 12px" }}>
            <div>
              <div style={{ color: T.fg4, fontSize: 11 }}>Salaire hebdomadaire</div>
              <div style={{ color: T.green, fontWeight: 800, fontSize: 15, fontFamily: T.mono }}>{weeklyPay.toLocaleString()}€</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {isFirstNegotiation && log.length <= 1 && !askLocked && (
                <span style={{ color: T.green, fontSize: 16, animation: "tm-bounce-x 1.1s infinite" }}>→</span>
              )}
              <button
                disabled={askLocked}
                onClick={() => demand("pay")}
                style={{
                  ...negBtnStyle(askLocked),
                  animation: isFirstNegotiation && log.length <= 1 && !askLocked ? "tm-pulse-green 1.6s infinite" : "none",
                }}
              >{offer.nonNegotiable || lastChance ? "Verrouillé" : "Demander +"}</button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.bg1, border: "2px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, borderRadius: 0, padding: "10px 12px" }}>
            <div>
              <div style={{ color: T.fg4, fontSize: 11 }}>Prime par titre</div>
              <div style={{ color: T.fg, fontWeight: 800, fontSize: 15, fontFamily: T.mono }}>{titleBonus.toLocaleString()}€</div>
            </div>
            <button disabled={askLocked} onClick={() => demand("bonus")} style={negBtnStyle(askLocked)}>{offer.nonNegotiable || lastChance ? "Verrouillé" : "Demander +"}</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.bg1, border: "2px solid " + T.ink, boxShadow: "3px 3px 0 " + T.ink, borderRadius: 0, padding: "10px 12px" }}>
            <div>
              <div style={{ color: T.fg4, fontSize: 11 }}>Durée du contrat</div>
              <div style={{ color: T.fg, fontWeight: 800, fontSize: 15, fontFamily: T.mono }}>{offer.durationWeeks} sem. <span style={{ color: T.fg4, fontWeight: 600, fontSize: 12 }}>(objectif sur toute la durée)</span></div>
            </div>
          </div>
        </div>

        {walkedAway ? (
          <div>
            <div style={{ background: "var(--tm-redSub)", border: "1px solid var(--tm-redBrd)", borderRadius: 0, padding: "14px 16px", marginBottom: 12, textAlign: "center" }}>
              <div style={{ marginBottom: 6 }}><Icon name="arrowLeft" size={26} color={T.fg3} /></div>
              <div style={{ color: T.red, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Négociation rompue</div>
              <div style={{ color: T.fg3, fontSize: 12, lineHeight: 1.5 }}>
                {offer.brand} a mis fin aux discussions. Vous avez été trop gourmand : cette offre est perdue.
              </div>
            </div>
            <button style={{ ...styles.btnPrimary, width: "100%" }} onClick={onWalkAway}>
              Retour aux offres
            </button>
          </div>
        ) : (
          <>
            <button style={{ ...styles.btnPrimary, width: "100%" }}
              onClick={() => onDeal({ weeklyPay, titleBonus, level })}>
              Signer le contrat
            </button>
            {!isFirstNegotiation && (
              <button style={{ ...styles.btnSecondary, width: "100%", marginTop: 8 }} onClick={onCancel}>
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
    background: closed ? T.bg3 : T.bg3, border: "2px solid " + T.ink, color: closed ? T.fg5 : T.fg,
    borderRadius: 0, padding: "8px 12px", fontSize: 12, fontWeight: 700, fontFamily: T.body,
    cursor: closed ? "default" : "pointer", whiteSpace: "nowrap",
  };
}

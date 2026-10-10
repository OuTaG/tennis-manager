// Écran de chargement BD, affiché pendant les opérations lourdes (création de
// la base de joueurs, lecture d'une sauvegarde). Construit directement dans le
// DOM pour apparaître immédiatement, quel que soit l'écran React en cours.
// Renvoie l'élément : l'appelant le retire avec el.remove().
let cssInjected = false;

function injectCss() {
  if (cssInjected || typeof document === "undefined") return;
  cssInjected = true;
  const tag = document.createElement("style");
  tag.textContent = `
    @keyframes tm-load-bounce { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-38px) rotate(180deg); } }
    @keyframes tm-load-shadow { 0%, 100% { transform: scaleX(1); opacity: .35; } 50% { transform: scaleX(.55); opacity: .15; } }
    @keyframes tm-load-dots { 0% { content: ""; } 33% { content: "."; } 66% { content: ".."; } 100% { content: "..."; } }
    .tm-load-dots::after { content: "..."; animation: tm-load-dots 1.2s steps(1) infinite; }
  `;
  document.head.appendChild(tag);
}

export function showLoadingScreen(message = "Chargement…") {
  injectCss();
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.className = "tm-paper";
  el.style.cssText = "position:fixed;inset:0;z-index:3000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;color:#141414;padding:24px;";
  el.innerHTML = `
    <div style="position:relative;width:110px;height:110px;display:flex;align-items:flex-end;justify-content:center">
      <div style="width:64px;height:64px;border-radius:50%;background:#d6ef3c;border:5px solid #141414;box-shadow:4px 4px 0 #5b2d8e;position:relative;overflow:hidden;animation:tm-load-bounce .9s ease-in-out infinite">
        <span style="position:absolute;top:-10%;left:-62%;width:90%;height:120%;border:4px solid #fff;border-radius:50%"></span>
        <span style="position:absolute;top:-10%;right:-62%;width:90%;height:120%;border:4px solid #fff;border-radius:50%"></span>
      </div>
      <div style="position:absolute;bottom:-12px;width:58px;height:10px;border-radius:50%;background:#141414;animation:tm-load-shadow .9s ease-in-out infinite"></div>
    </div>
    <div class="tm-display" style="background:#141414;color:#d6ef3c;font-size:26px;padding:6px 16px 8px;transform:rotate(-2deg);box-shadow:5px 5px 0 #5b2d8e">Chargement<span class="tm-load-dots"></span></div>
    <div class="tm-lettering" style="font-size:18px;background:#fff;border:3px solid #141414;box-shadow:4px 4px 0 #141414;padding:6px 14px;transform:rotate(1deg)"></div>
  `;
  el.lastElementChild.textContent = message;
  document.body.appendChild(el);
  return el;
}

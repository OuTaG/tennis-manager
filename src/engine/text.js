// Petits utilitaires de texte.

// Première phrase d'un texte, sans couper sur l'initiale d'un prénom
// (« C. Alcázar », « J.-M. Dupont ») ni sur une abréviation d'une lettre.
// Renvoie le texte entier s'il n'y a pas de fin de phrase.
export function firstSentence(text) {
  if (!text) return "";
  const re = /[.!?…](?=\s|$)/gu;
  let m;
  while ((m = re.exec(text)) !== null) {
    const end = m.index;
    if (text[end] === ".") {
      // Mot juste avant le point : une seule lettre (initiale) → on continue.
      const before = text.slice(0, end).match(/([\p{L}.-]+)$/u);
      if (before && /^\p{L}(\.?-\p{L})*$/u.test(before[1])) continue;
    }
    return text.slice(0, end + 1);
  }
  return text;
}

// Effets du staff (bonus / malus).

// Aggregate all staff bonus/malus values for a given key.
// matchCtx is { surface? } to apply surface-specific bonuses.
// Extra energy per training session added by staff (positive number).
// Supprimé : le staff n'ajoute plus de coût d'énergie à l'entraînement
// (les anciennes sauvegardes gardent ce malus dans leur staff, il est ignoré).
export function staffTrainEnergyExtra(staff) {
  return 0;
}
export function sumStaffEffect(staff, key, matchCtx) {
  let total = 0;
  for (const s of staff || []) {
    if (s.bonus && s.bonus[key] !== undefined) total += s.bonus[key];
    if (s.malus && s.malus[key] !== undefined) total -= s.malus[key];
  }
  return total;
}
// Surface-aware: applies surfaceBoost if specialist's surface matches, surfaceMalus otherwise.
export function staffSurfaceModifier(staff, surface) {
  let total = 0;
  for (const s of staff || []) {
    if (!s.surface) continue;
    if (s.surface === surface) {
      total += (s.bonus?.surfaceBoost || 0);
    } else {
      total -= (s.malus?.surfaceMalus || 0);
    }
  }
  return total;
}

/*
  Openbare ingrediëntenlijst van een kookboekrecept.

  Zodat niet te herleiden is waarvoor een ingrediënt dient:
   - geen groepen ("Voor de dressing") en geen toelichtingen ("in blokjes")
   - neutrale volgorde (alfabetisch) en neutrale id's (i1, i2, …)
  Het volledige recept, met groepen en volgorde, staat alleen versleuteld.
*/
export function publicIngredients(ingredients) {
  return [...(ingredients || [])]
    .map(({ name, amount, unit, step, plural, unitPlural }) => {
      const out = { name };
      if (amount != null) out.amount = amount;
      if (unit) out.unit = unit;
      if (step) out.step = step;
      if (plural) out.plural = plural;
      if (unitPlural) out.unitPlural = unitPlural;
      return out;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "nl"))
    .map((ing, i) => ({ id: `i${i + 1}`, ...ing }));
}

/** Alleen de namen (voor bezoekers zonder wachtwoord) */
export function ingredientNames(neutral) {
  return (neutral || []).map(({ id, name }) => ({ id, name }));
}

/** Willekeurige volgorde (Fisher–Yates), elke keer anders */
export function shuffled(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

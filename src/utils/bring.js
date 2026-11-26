import { formatIngredient, scaleAmount } from "./formatIngredient";
import { absoluteUrl, recipePath } from "./seo";

/*
  Boodschappen naar Bring!

  Bring! importeert een recept via zijn eigen import-link:
    https://api.getbring.com/rest/bringrecipes/deeplink?url=…&source=web
  Bring! haalt de openbare receptpagina op, leest de ingrediënten uit de
  receptgegevens (schema.org/Recipe) en laat je in de app kiezen wat je
  nodig hebt. Kookboekrecepten zijn versleuteld; daarvoor kopieer je de
  boodschappen als tekst.
*/

const DEEPLINK = "https://api.getbring.com/rest/bringrecipes/deeplink";

// Keukenmaten: voor de supermarkt telt alleen wát je nodig hebt
const KITCHEN_UNITS = new Set(["el", "tl", "kl", "snufje", "snuf", "scheutje", "scheut", "mespunt", "mespuntje", "cm", "druppel", "handvol"]);

/**
 * Regel voor de boodschappenlijst, zoals je hem in de winkel nodig hebt:
 *  - gewicht en inhoud blijven ("225 g spaghetti")
 *  - stuks naar boven afgerond ("2 uien" in plaats van "1½ uien")
 *  - lepels, snufjes en centimeters weg ("sojasaus")
 */
export function bringLine(ingredient, factor) {
  if (ingredient.amount == null) return ingredient.name;
  const { value, unit } = scaleAmount(ingredient, factor);
  if (KITCHEN_UNITS.has(unit)) return ingredient.name;
  if (["gr", "g", "kg", "ml", "cl", "dl", "l"].includes(unit)) {
    return formatIngredient(ingredient, factor).replace(/^([\d,]+) gr /, "$1 g ");
  }
  // stuks of telwoord (blik, bosje, teentje …): hele aantallen
  const whole = Math.max(1, Math.ceil(value - 1e-9));
  return formatIngredient({ ...ingredient, amount: whole, step: 1 }, 1);
}

/** Hele recept vanaf de openbare receptpagina (Bring! rekent zelf om) */
export function bringDeeplinkForPage(recipe, servings) {
  const params = new URLSearchParams({
    url: absoluteUrl(recipePath(recipe.id)),
    source: "web",
    baseQuantity: String(recipe.servings),
    requestedQuantity: String(servings),
  });
  return `${DEEPLINK}?${params}`;
}

/*
  Kookboekrecepten: op de receptpagina staan alleen de namen van de
  ingrediënten. Bring! krijgt een eigen, niet gelinkte pagina met de
  hoeveelheden (gemaakt door scripts/prerender.js). Het adres is lastig te
  raden, maar niet geheim: schijnveiligheid, net als de sitesleutel.
*/
const BRING_SALT = "kmj-bring-2026";

export function bringPagePath(recipeId) {
  let h = 0x811c9dc5;
  for (const c of `${BRING_SALT}:${recipeId}`) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `/bring/${h.toString(36)}/`;
}

/** Kookboekrecept naar Bring!, via de verborgen pagina */
export function bringDeeplinkForBook(recipe, servings) {
  const params = new URLSearchParams({
    url: absoluteUrl(bringPagePath(recipe.id)),
    source: "web",
    baseQuantity: String(recipe.servings),
    requestedQuantity: String(servings),
  });
  return `${DEEPLINK}?${params}`;
}

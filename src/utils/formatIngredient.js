import { pluralize } from "./pluralize";

/*
  Ingrediënt-velden:
    name     enkelvoud ("ui", "rode ui", "knoflook")
    amount   hoeveelheid voor recipe.servings (laat weg voor "naar smaak")
    unit     "gr", "ml", "el", "tl", ... of een telwoord als "teentje", "blik"
    plural   (optioneel) eigen meervoud als de automatische vorm niet klopt
    step     (optioneel) afronden op deze stap, bv. 1 voor eieren of wraps
    note     (optioneel) toelichting, bv. "of sambal"
*/

// Maateenheden die nooit een meervoud krijgen; het ingrediënt ook niet ("400 gr gnocchi")
const MEASURE_UNITS = new Set([
  "gr", "g", "gram", "kg", "mg", "ml", "cl", "dl", "l", "liter",
  "el", "tl", "kl", "cm", "mespunt", "mespuntje",
]);

const FRACTIONS = { 0.25: "¼", 0.5: "½", 0.75: "¾" };

function roundTo(value, step) {
  return Math.round(value / step) * step;
}

function formatNumber(value) {
  // Nederlandse notatie met komma, maximaal 1 decimaal
  const rounded = Math.round(value * 10) / 10;
  return String(rounded).replace(".", ",");
}

function formatFraction(value) {
  const whole = Math.floor(value);
  const rest = Math.round((value - whole) * 100) / 100;
  if (rest === 0) return String(whole);
  const symbol = FRACTIONS[rest];
  if (!symbol) return formatNumber(value);
  return whole === 0 ? symbol : `${whole}${symbol}`;
}

/**
 * Schaal een hoeveelheid en kies een leesbare afronding.
 * Geeft { value, text, unit } terug.
 */
export function scaleAmount(ingredient, factor) {
  let unit = ingredient.unit || "";
  let value = ingredient.amount * factor;

  if (ingredient.step) {
    value = Math.max(ingredient.step, roundTo(value, ingredient.step));
    return { value, text: formatFraction(value), unit };
  }

  // Gewicht en volume: afronden op hele, vijf- of tientallen
  if (["gr", "g", "ml"].includes(unit)) {
    if (value >= 250) value = roundTo(value, 10);
    else if (value >= 20) value = roundTo(value, 5);
    else value = Math.max(1, Math.round(value));

    if (value >= 1000) {
      value = value / 1000;
      unit = unit === "ml" ? "l" : "kg";
      return { value, text: formatNumber(value), unit };
    }
    return { value, text: String(value), unit };
  }

  if (unit === "kg" || unit === "l") {
    return { value, text: formatNumber(value), unit };
  }

  // Lepels, stuks en telwoorden: op kwarten
  value = Math.max(0.25, roundTo(value, 0.25));
  return { value, text: formatFraction(value), unit };
}

function isPlural(value) {
  return value > 1;
}

/** Alleen de naam, in enkel- of meervoud passend bij de hoeveelheid. */
export function ingredientName(ingredient, factor = 1) {
  if (ingredient.amount == null) return ingredient.name;

  const { value, unit } = scaleAmount(ingredient, factor);
  const countable = !unit;
  if (countable && isPlural(value)) {
    return ingredient.plural || pluralize(ingredient.name);
  }
  return ingredient.name;
}

/**
 * Splits een ingrediënt op in losse delen, handig voor opmaak.
 * { amount: "2", unit: "teentjes", name: "knoflook", note }
 */
export function ingredientParts(ingredient, factor = 1) {
  if (ingredient.amount == null) {
    return { amount: "", unit: "", name: ingredient.name, note: ingredient.note || "naar smaak" };
  }

  const { value, text, unit } = scaleAmount(ingredient, factor);
  let unitText = unit;

  if (unit && !MEASURE_UNITS.has(unit) && isPlural(value)) {
    // telwoord krijgt het meervoud: 2 teentjes knoflook, 3 blikken tomaten
    unitText = ingredient.unitPlural || pluralize(unit);
  }

  return {
    amount: text,
    unit: unitText,
    name: ingredientName(ingredient, factor),
    note: ingredient.note,
  };
}

/** Volledige tekst: "2 teentjes knoflook" */
export function formatIngredient(ingredient, factor = 1) {
  const { amount, unit, name } = ingredientParts(ingredient, factor);
  return [amount, unit, name].filter(Boolean).join(" ");
}

import { singularize } from "./pluralize";
import { formatIngredient } from "./formatIngredient";
import { pluralize } from "./pluralize";

/* ------------------------------------------------------------
   Hoeveelheden
   ------------------------------------------------------------ */

const UNICODE_FRACTIONS = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };

/** "1,5" / "1½" / "1 1/2" / "½" / "2-3" → getal (of null) */
export function parseAmount(text) {
  if (text == null) return null;
  let s = String(text).trim().replace(",", ".");
  if (!s) return null;
  s = s.split(/\s*[-–]\s*/)[0]; // bereik: neem de eerste waarde

  let total = 0;
  let found = false;
  for (const [sym, val] of Object.entries(UNICODE_FRACTIONS)) {
    if (s.includes(sym)) {
      total += val;
      s = s.replace(sym, " ");
      found = true;
    }
  }
  for (const part of s.trim().split(/\s+/).filter(Boolean)) {
    const frac = part.match(/^(\d+)\/(\d+)$/);
    if (frac) {
      total += Number(frac[1]) / Number(frac[2]);
      found = true;
    } else if (!isNaN(Number(part))) {
      total += Number(part);
      found = true;
    } else {
      return null;
    }
  }
  return found ? Math.round(total * 1000) / 1000 : null;
}

/** Getal → tekst voor in een invoerveld ("1,5") */
export function amountToText(value) {
  if (value == null || value === "") return "";
  return String(Math.round(value * 1000) / 1000).replace(".", ",");
}

/* ------------------------------------------------------------
   Eenheden
   ------------------------------------------------------------ */

// Schrijfwijzen → vaste eenheid
const UNIT_ALIASES = {
  g: "gr", gr: "gr", gram: "gr", grams: "gr",
  kg: "kg", kilo: "kg", kilogram: "kg",
  ml: "ml", milliliter: "ml", cl: "cl", dl: "dl", l: "l", liter: "l",
  el: "el", eetlepel: "el", eetlepels: "el", tbsp: "el",
  tl: "tl", theelepel: "tl", theelepels: "tl", tsp: "tl",
  stuk: "", stuks: "",
};

// Telwoorden: blijven als eenheid staan en krijgen zelf het meervoud
const COUNT_UNITS = [
  "teentje", "blik", "blikje", "pak", "pakje", "zak", "zakje", "bos", "bosje", "takje",
  "plak", "plakje", "snufje", "scheut", "scheutje", "handje", "handvol", "kop", "kopje",
  "mespunt", "mespuntje", "stengel", "krop", "pot", "potje", "knijp", "beker", "bekertje",
  "glas", "schijf", "schijfje", "blaadje", "druppel", "bol", "bakje", "fles", "flesje",
];

export const UNIT_SUGGESTIONS = ["gr", "kg", "ml", "l", "el", "tl", ...COUNT_UNITS];

function matchUnit(word) {
  const w = word.toLowerCase().replace(/\.$/, "");
  if (w in UNIT_ALIASES) return { unit: UNIT_ALIASES[w] };
  if (COUNT_UNITS.includes(w)) return { unit: w };
  const single = singularize(w);
  if (COUNT_UNITS.includes(single)) return { unit: single };
  return null;
}

/* ------------------------------------------------------------
   Id's
   ------------------------------------------------------------ */

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "rode ui" → "rodeUi" (uniek binnen `taken`) */
export function ingredientId(name, taken = []) {
  const words = slugify(name).split("-").filter(Boolean);
  let base = words.map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1))).join("") || "ingredient";
  let id = base;
  let n = 2;
  while (taken.includes(id)) id = `${base}${n++}`;
  return id;
}

/* ------------------------------------------------------------
   Plakken uit een kookboek
   ------------------------------------------------------------ */

/** "2 teentjes knoflook, geperst" → { amount: 2, unit: "teentje", name: "knoflook", note: "geperst" } */
export function parseIngredientLine(line) {
  let s = line.trim().replace(/^[-•*·–]\s*/, "");
  if (!s) return null;

  let note = "";
  const paren = s.match(/\(([^)]*)\)/);
  if (paren) {
    note = paren[1].trim();
    s = s.replace(paren[0], " ").replace(/\s+/g, " ").trim();
  }
  const comma = s.indexOf(",");
  if (comma > -1) {
    note = [s.slice(comma + 1).trim(), note].filter(Boolean).join(", ");
    s = s.slice(0, comma).trim();
  }

  // hoeveelheid vooraan (ook "200g" aan elkaar)
  const amountMatch = s.match(/^((?:\d+(?:[.,]\d+)?)?\s*(?:[½¼¾⅓⅔⅛]|\d+\/\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)\s*/);
  let amount = null;
  if (amountMatch && amountMatch[1].trim()) {
    amount = parseAmount(amountMatch[1]);
    s = s.slice(amountMatch[0].length);
  }

  let unit = "";
  const [first, ...rest] = s.split(" ");
  if (amount != null && rest.length > 0) {
    const u = matchUnit(first);
    if (u) {
      unit = u.unit;
      s = rest.join(" ");
    }
  }

  let name = s.trim();
  if (/^(naar smaak|n\.?\s?s\.?)$/i.test(note)) note = "";
  if (amount != null && amount > 1 && !unit) name = singularize(name);

  return { amount, unit, name, note };
}

/** Plaktekst met één ingrediënt per regel → lijst */
export function parseIngredientList(text) {
  return text.split(/\r?\n/).map(parseIngredientLine).filter((i) => i && i.name);
}

/** Plaktekst → losse stappen (genummerd of per alinea/regel) */
export function parseSteps(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^(stap\s*)?\d+\s*[.):-]?\s+/i, ""))
    .filter(Boolean);
}

/* ------------------------------------------------------------
   Ingrediënten koppelen in de bereiding
   ------------------------------------------------------------ */

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Vervangt in de tekst:
 *  - "200 gr bloem"  → {bloem}       (hoeveelheid rekent mee)
 *  - "de bloem"      → de {bloem:naam}
 * Bestaande {placeholders} blijven ongemoeid.
 */
export function autoLinkStep(text, ingredients) {
  const sorted = [...ingredients]
    .filter((i) => i.name && i.id)
    .sort((a, b) => b.name.length - a.name.length);

  const replaceOutside = (input, regex, replacement) =>
    input
      .split(/({[^}]+})/g)
      .map((part) => (part.startsWith("{") ? part : part.replace(regex, replacement)))
      .join("");

  let out = text;
  for (const ing of sorted) {
    if (ing.amount != null) {
      const full = formatIngredient(ing, 1);
      const variants = [full, full.replace(/ (gr|ml|el|tl) /, (m, u) => `${u} `)];
      for (const v of variants) {
        out = replaceOutside(out, new RegExp(`(?<![\\p{L}\\d])${escapeRegex(v)}(?![\\p{L}])`, "giu"), `{${ing.id}}`);
      }
    }
    const names = [...new Set([ing.plural || pluralize(ing.name), ing.name])];
    for (const n of names) {
      out = replaceOutside(out, new RegExp(`(?<![\\p{L}])${escapeRegex(n)}(?![\\p{L}])`, "giu"), `{${ing.id}:naam}`);
    }
  }
  return out;
}

/** Placeholders die naar een onbekend ingrediënt wijzen */
export function unknownPlaceholders(steps, ingredients) {
  const ids = new Set(ingredients.map((i) => i.id));
  const missing = new Set();
  steps.forEach((s) =>
    (s.match(/{([^}:]+)(?::naam)?}/g) || []).forEach((m) => {
      const id = m.slice(1, -1).split(":")[0];
      if (!ids.has(id)) missing.add(id);
    })
  );
  return [...missing];
}

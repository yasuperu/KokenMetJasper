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
  teen: "teentje", tenen: "teentje", handenvol: "handvol", cm: "cm",
};

// Telwoorden: blijven als eenheid staan en krijgen zelf het meervoud
const COUNT_UNITS = [
  "teentje", "blik", "blikje", "pak", "pakje", "zak", "zakje", "bos", "bosje", "takje",
  "plak", "plakje", "snufje", "scheut", "scheutje", "handje", "handvol", "kop", "kopje",
  "mespunt", "mespuntje", "stengel", "krop", "pot", "potje", "knijp", "beker", "bekertje",
  "glas", "schijf", "schijfje", "blaadje", "druppel", "bol", "bakje", "fles", "flesje",
  "blok", "sneetje", "snee", "stukje", "stuk", "teen",
];

const SIZE_WORDS = ["klein", "kleine", "groot", "grote", "middelgroot", "middelgrote", "flink", "flinke", "ruim", "ruime"];

// Hoeveelheden in woorden
const WORD_AMOUNTS = {
  een: 1, één: 1, half: 0.5, halve: 0.5, anderhalf: 1.5, anderhalve: 1.5,
  twee: 2, drie: 3, vier: 4, vijf: 5, zes: 6,
};

export const UNIT_SUGGESTIONS = ["gr", "kg", "ml", "l", "el", "tl", ...COUNT_UNITS];

function matchUnit(word) {
  const w = word.toLowerCase().replace(/\.$/, "");
  if (w in UNIT_ALIASES) return { unit: UNIT_ALIASES[w] };
  if (w === "teen") return { unit: "teentje" };
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

  const notes = [];
  const optional = s.match(/^optioneel:?\s*/i);
  if (optional) {
    notes.push("optioneel");
    s = s.slice(optional[0].length);
  }
  let toTaste = false;
  if (/\s+naar smaak$/i.test(s)) {
    toTaste = true;
    s = s.replace(/\s+naar smaak$/i, "");
  }

  // "2x 330 ml bier" → 660 ml
  s = s.replace(/^(\d+)\s*x\s*(\d+(?:[.,]\d+)?)/i, (m, a, b) => String(Number(a) * parseAmount(b)));
  // "3 tot 4" → "3-4"
  s = s.replace(/^(\d+(?:[.,]\d+)?)\s+tot\s+(\d+(?:[.,]\d+)?)/i, "$1-$2");
  // "halve theelepel", "een snufje"
  const word = s.match(/^(\S+)\s+/);
  const startsWithAmountWord = word && WORD_AMOUNTS[word[1].toLowerCase()] != null;
  if (startsWithAmountWord) {
    s = `${WORD_AMOUNTS[word[1].toLowerCase()]} ${s.slice(word[0].length)}`;
  }

  const parens = [];
  s = s.replace(/\s*\(([^)]*)\)/g, (m, inner) => {
    parens.push(inner.trim());
    return " ";
  }).replace(/\s+/g, " ").trim();
  let note = parens.join(", ");
  const comma = s.search(/,(?!\d)/); // niet de komma in "1,5"
  if (comma > -1) {
    note = [note, s.slice(comma + 1).trim()].filter(Boolean).join(", ");
    s = s.slice(0, comma).trim();
  }

  // "Sap van 1/2 citroen" → ½ citroen (alleen het sap)
  const juice = s.match(/^(sap|rasp|schil) van (.+)$/i);
  if (juice) {
    notes.push(`alleen ${juice[1].toLowerCase() === "sap" ? "het sap" : `de ${juice[1].toLowerCase()}`}`);
    s = juice[2];
  }

  // hoeveelheid vooraan (ook "200g" aan elkaar)
  const amountMatch = s.match(
    /^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)?\s*[½¼¾⅓⅔⅛]?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)(?=\s|[a-zA-Z]|$)\s*/
  );
  let amount = null;
  if (amountMatch && amountMatch[1].trim()) {
    amount = parseAmount(amountMatch[1]);
    s = s.slice(amountMatch[0].length);
  }
  // "1 halve watermeloen"
  if (amount != null && /^(halve|half)\s+/i.test(s)) {
    amount *= 0.5;
    s = s.replace(/^(halve|half)\s+/i, "");
  }

  let unit = "";
  let words = s.split(" ");
  // "2 kleine teentjes knoflook": formaat-woord vóór de eenheid → toelichting
  if (words.length > 2 && SIZE_WORDS.includes(words[0].toLowerCase()) && matchUnit(words[1])?.unit) {
    notes.unshift(words[0].toLowerCase());
    words = words.slice(1);
    s = words.join(" ");
  }
  const [first, ...rest] = words;
  const u = rest.length > 0 ? matchUnit(first) : null;
  if (u && (amount != null || u.unit)) {
    // "Snufje zwarte peper" zonder getal → 1 snufje
    if (amount == null) amount = 1;
    unit = u.unit;
    s = rest.join(" ");
  }

  let name = s.trim();
  if (/^(naar smaak|n\.?\s?s\.?)$/i.test(note)) {
    note = "";
    toTaste = true;
  }
  if (amount != null && amount > 1 && !unit) name = singularize(name);
  // Zonder hoeveelheid vooraan: "Verse selderij" → "verse selderij"
  if (amount == null && /^[A-ZÀ-Ý][a-zà-ÿ]/.test(name)) name = name[0].toLowerCase() + name.slice(1);
  if (toTaste && amount != null) notes.push("naar smaak");
  note = [note, ...notes].filter(Boolean).join(", ");

  return { amount, unit, name, note };
}

/**
 * Plaktekst met één ingrediënt per regel → lijst.
 * Een regel als "Voor de dressing:" begint een groep.
 */
export function parseIngredientList(text) {
  let group = "";
  const out = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.endsWith(":")) {
      group = line.slice(0, -1).replace(/^voor (de |het )?/i, "").trim();
      group = group.charAt(0).toUpperCase() + group.slice(1);
      continue;
    }
    const ing = parseIngredientLine(line);
    if (ing && ing.name) out.push(group ? { ...ing, group } : ing);
  }
  return out;
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
      out = replaceOutside(out, new RegExp(`(?<![\\p{L}\\d])${escapeRegex(full)}(?![\\p{L}])`, "giu"), `{${ing.id}}`);
      // Andere schrijfwijzen: "1 liter water", "twee tenen knoflook", "3 eetlepels ketjap manis"
      const amounts = amountSpellings(ing.amount).map(escapeRegex).join("|");
      const units = unitSpellings(ing.unit).map(escapeRegex).join("|");
      const names = [...new Set([ing.name, ing.plural || pluralize(ing.name)])].map(escapeRegex).join("|");
      const pattern = units
        ? `(?<![\\p{L}\\d])(?:${amounts})\\s*(?:${units})\\s+(?:${names})(?![\\p{L}])`
        : `(?<![\\p{L}\\d])(?:${amounts})\\s+(?:${names})(?![\\p{L}])`;
      out = replaceOutside(out, new RegExp(pattern, "giu"), `{${ing.id}}`);
    }
    const names = [...new Set([ing.plural || pluralize(ing.name), ing.name])];
    for (const n of names) {
      out = replaceOutside(out, new RegExp(`(?<![\\p{L}])${escapeRegex(n)}(?![\\p{L}])`, "giu"), `{${ing.id}:naam}`);
    }
  }
  return out;
}

const NUMBER_WORDS = { 1: ["een", "één"], 0.5: ["halve", "een halve", "half"], 1.5: ["anderhalve", "anderhalf"], 2: ["twee"], 3: ["drie"], 4: ["vier"], 5: ["vijf"] };

function amountSpellings(value) {
  const plain = String(value);
  const list = [plain, plain.replace(".", ","), amountToText(value)];
  const frac = { 0.5: "½", 0.25: "¼", 0.75: "¾" }[value];
  if (frac) list.push(frac, value === 0.5 ? "1/2" : value === 0.25 ? "1/4" : "3/4");
  return [...new Set([...list, ...(NUMBER_WORDS[value] || [])])];
}

function unitSpellings(unit) {
  if (!unit) return [];
  const list = Object.entries(UNIT_ALIASES).filter(([, u]) => u === unit).map(([alias]) => alias);
  list.push(unit, pluralize(unit));
  if (unit === "gr") list.push("gram", "g");
  if (unit === "l") list.push("liter");
  if (unit === "teentje") list.push("tenen", "teen");
  return [...new Set(list)].sort((a, b) => b.length - a.length);
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

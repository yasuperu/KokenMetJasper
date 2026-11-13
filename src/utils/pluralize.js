import exceptions from "../data/pluralWords.json";

/*
  Nederlandse meervoudsvorming.

  Volgorde:
  1. Uitzonderingen uit pluralWords.json (exact, of als staart van een
     samenstelling: "laurierblad" → "laurierbladeren").
  2. Spellingsregels voor -s, -'s en -en.

  Klopt een woord niet? Voeg het toe aan src/data/pluralWords.json,
  of geef het ingrediënt een eigen "plural" veld.
*/

const VOWELS = "aeiouy";
const isVowel = (c) => VOWELS.includes(c);

// Diftongen/lange klanken die als één klinker tellen
const LONG_DIGRAPHS = ["aa", "ee", "oo", "uu", "ie", "oe", "eu", "ui", "ei", "ij", "ou", "au"];

function countSyllables(word) {
  const groups = word.toLowerCase().match(/[aeiouy]+|ij/g);
  return groups ? groups.length : 1;
}

function matchCase(original, result) {
  if (original && original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    return result[0].toUpperCase() + result.slice(1);
  }
  return result;
}

function fromExceptions(lower) {
  if (exceptions[lower]) return exceptions[lower];

  // Samenstellingen: langste staart die als uitzondering bekend is
  let best = null;
  for (const key of Object.keys(exceptions)) {
    if (key.length >= 3 && lower.endsWith(key) && (!best || key.length > best.length)) {
      best = key;
    }
  }
  if (best) return lower.slice(0, lower.length - best.length) + exceptions[best];
  return null;
}

/** Meervoud van één los woord. */
export function pluralizeWord(word) {
  if (!word) return word;
  const lower = word.toLowerCase();

  const exception = fromExceptions(lower);
  if (exception) return matchCase(word, exception);

  const last = lower[lower.length - 1];
  const last2 = lower.slice(-2);
  const last3 = lower.slice(-3);

  let result;

  if (lower.endsWith("je") || lower.endsWith("eau")) {
    // verkleinwoorden en Franse leenwoorden: blokje → blokjes
    result = lower + "s";
  } else if (last2 === "ui" || last2 === "ei" || last2 === "ij") {
    // ui → uien, prei → preien
    result = lower + "en";
  } else if (last2 === "ee") {
    result = lower + "ën";
  } else if (last2 === "ie") {
    result = lower + "s";
  } else if ("aiouy".includes(last)) {
    // klinker aan het eind: paprika's, avocado's, kiwi's
    result = lower + "'s";
  } else if (last === "e") {
    // stomme e: courgette → courgettes
    result = lower + "s";
  } else if (
    countSyllables(lower) > 1 &&
    ["el", "er", "em", "en", "um"].includes(last2) &&
    !LONG_DIGRAPHS.includes(lower.slice(-3, -1))
  ) {
    // onbeklemtoonde uitgang: wortel → wortels, peper → pepers
    result = lower + "s";
  } else {
    result = addEn(lower, last, last3);
  }

  return matchCase(word, result);
}

function addEn(lower, last, last3) {
  const beforeLast = lower[lower.length - 2];
  const vowelPair = lower.slice(-3, -1);

  // Lange klank + medeklinker
  if (!isVowel(last) && LONG_DIGRAPHS.includes(vowelPair)) {
    let stem = lower.slice(0, -1);
    let cons = last;
    // aa/ee/oo/uu: open lettergreep, één klinker valt weg (tomaat → tomaten)
    if (["aa", "ee", "oo", "uu"].includes(vowelPair)) {
      stem = lower.slice(0, -2);
    }
    if (cons === "f") cons = "v";
    if (cons === "s") cons = "z";
    return stem + cons + "en";
  }

  // Korte klank + één medeklinker: verdubbelen (kip → kippen, ananas → ananassen)
  const beforeVowel = lower[lower.length - 3];
  if (
    !isVowel(last) &&
    isVowel(beforeLast) &&
    (beforeVowel === undefined || !isVowel(beforeVowel)) &&
    !"xwy".includes(last)
  ) {
    return lower + last + "en";
  }

  return lower + "en";
}

const COUNTER_WORDS_SPLIT = / (of|en|met|in|uit|zonder) /;

/**
 * Meervoud van een (meer-woordige) ingrediëntnaam.
 *  "rode ui"                → "rode uien"
 *  "teentje knoflook"       → "teentjes knoflook"
 *  "madame jeanette peper"  → "madame jeanette pepers"
 *  "peper of sambal"        → "pepers of sambal"
 */
export function pluralize(phrase) {
  if (!phrase) return phrase;

  const lowerPhrase = phrase.toLowerCase();
  if (exceptions[lowerPhrase]) return matchCase(phrase, exceptions[lowerPhrase]);

  // Alleen het deel vóór "of", "met", ... krijgt meervoud
  const split = phrase.match(COUNTER_WORDS_SPLIT);
  if (split) {
    const head = phrase.slice(0, split.index);
    const tail = phrase.slice(split.index);
    return pluralize(head) + tail;
  }

  const words = phrase.split(" ");
  if (words.length === 1) {
    // koppeltekens: lente-ui → lente-uien
    const parts = phrase.split("-");
    parts[parts.length - 1] = pluralizeWord(parts[parts.length - 1]);
    return parts.join("-");
  }

  // "teentje knoflook", "blikje mais": het verkleinwoord is het hoofdwoord
  if (words[0].toLowerCase().endsWith("je")) {
    words[0] = pluralizeWord(words[0]);
    return words.join(" ");
  }

  words[words.length - 1] = pluralize(words[words.length - 1]);
  return words.join(" ");
}

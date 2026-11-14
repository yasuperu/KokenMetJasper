/*
  Bron van een recept:
    { type: "book",   book, author, page, url }   → versleuteld
    { type: "social", url, creator }              → link naar post of website
  Oudere recepten hebben geen type; een "book"-veld betekent kookboek.
*/

const PLATFORMS = [
  [/instagram\.com/, "Instagram"],
  [/tiktok\.com/, "TikTok"],
  [/youtube\.com|youtu\.be/, "YouTube"],
  [/facebook\.com|fb\.watch/, "Facebook"],
  [/pinterest\./, "Pinterest"],
  [/(twitter|x)\.com/, "X"],
  [/threads\.net/, "Threads"],
];

export function sourceType(source) {
  if (!source) return "own";
  if (source.type) return source.type;
  return source.book ? "book" : source.url ? "social" : "own";
}

/** "Instagram", "TikTok" of de domeinnaam ("leukerecepten.nl") */
export function platformName(url) {
  if (!url) return "";
  for (const [pattern, name] of PLATFORMS) if (pattern.test(url)) return name;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function isSocialPlatform(url) {
  return PLATFORMS.some(([pattern]) => pattern.test(url || ""));
}

// Volg- en affiliate-codes die niets met de pagina zelf te maken hebben
const TRACKING = /^(utm_.*|referrer|ref|ref_src|aff.*|affiliate.*|igsh|igshid|cplk|fbclid|gclid|mc_.*|si|s)$/i;

/** "https://…/p/boek/123/?Referrer=…&utm_source=…" → "https://…/p/boek/123/" */
export function cleanUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url.trim());
    [...u.searchParams.keys()].forEach((k) => TRACKING.test(k) && u.searchParams.delete(k));
    u.hash = "";
    return u.toString();
  } catch {
    return url.trim();
  }
}

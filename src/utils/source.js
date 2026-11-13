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

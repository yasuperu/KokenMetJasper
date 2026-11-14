// Waar de beheerpagina recepten opslaat
export const GITHUB = {
  owner: "yasuperu",
  repo: "KokenMetJasper",
  branch: "main",
  recipesDir: "src/data/recipes",
  imagesDir: "public/images/recipes",
  lockFile: "src/data/lock.json",
};

/** Pad uit het recept ("images/recipes/x.jpg") → volledige URL op de site */
export function imageUrl(path) {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${process.env.PUBLIC_URL}/${path.replace(/^\//, "")}`;
}

/**
 * srcSet met de kleine WebP-versies uit scripts/optimize-images.js,
 * alleen voor foto's die in de site zelf staan.
 */
export function imageSrcSet(path, widths = [480, 720, 960]) {
  if (!path || !/^images\/recipes\/[^/]+\.(jpe?g|png|webp)$/i.test(path)) return undefined;
  const base = path.replace(/^images\/recipes\//, "").replace(/\.[^.]+$/, "");
  return widths.map((w) => `${imageUrl(`images/recipes/opt/${base}-${w}.webp`)} ${w}w`).join(", ");
}

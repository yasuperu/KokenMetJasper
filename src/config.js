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

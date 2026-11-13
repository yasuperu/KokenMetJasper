import { sourceType } from "./source";

/*
  Recepten van social media kunnen de bereiding afschermen tot de bezoeker
  de originele post heeft geopend, zodat de maker de klik krijgt.
  Dit is een beleefdheid, geen beveiliging: de tekst staat gewoon in de site.
*/

const KEY = "kmj-post-bezocht";

export function isGated(recipe) {
  return Boolean(recipe?.gate) && sourceType(recipe.source) === "social" && Boolean(recipe.source?.url);
}

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function hasVisitedPost(id) {
  return read().includes(id);
}

export function markPostVisited(id) {
  try {
    const list = read();
    if (!list.includes(id)) localStorage.setItem(KEY, JSON.stringify([...list, id]));
  } catch {}
}

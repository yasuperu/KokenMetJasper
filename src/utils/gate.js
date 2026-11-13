import { sourceType } from "./source";
import { decryptJSON, encryptJSON } from "./crypto";

/*
  Recepten van social media kunnen de bereiding afschermen tot de bezoeker
  de originele post heeft geopend, zodat de maker de klik krijgt.

  De bereiding staat versleuteld in de repo ("gatedSteps"), zodat hij op
  GitHub niet leesbaar of doorzoekbaar is. De sleutel zit in de site zelf,
  zodat elke bezoeker hem na de klik kan ontsleutelen: een slot op de deur,
  geen kluis. Echt geheime recepten (kookboeken) gebruiken het wachtwoord.
*/

const SITE_KEY = "koken-met-jasper/bereiding";
const SITE_KEY_ITERATIONS = 1000; // snelheid boven sterkte; de sleutel is toch openbaar

export function encryptSteps(instructions) {
  return encryptJSON(instructions, SITE_KEY, SITE_KEY_ITERATIONS);
}

export function decryptSteps(payload) {
  return decryptJSON(payload, SITE_KEY);
}

const KEY = "kmj-post-bezocht";

export function isGated(recipe) {
  return (
    Boolean(recipe?.gate || recipe?.gatedSteps) && sourceType(recipe.source) === "social" && Boolean(recipe.source?.url)
  );
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

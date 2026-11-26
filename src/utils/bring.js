import { GITHUB } from "../config";
import { formatIngredient, scaleAmount } from "./formatIngredient";
import { absoluteUrl, recipePath } from "./seo";

/*
  Boodschappen naar Bring!

  Bring! importeert recepten via een link naar zijn eigen import:
    https://api.getbring.com/rest/bringrecipes/deeplink?url=…&source=web
  Bring! haalt dat adres zelf op en leest de ingrediënten uit de
  receptgegevens (schema.org/Recipe).

  Om alleen de aangevinkte ingrediënten mee te sturen, zetten we ze als
  klein receptbestand (.json) op de branch "boodschappen" van de repo en
  laten Bring! dat bestand importeren. Alleen mogelijk met het GitHub-token
  uit het beheer. Oude lijsten (ouder dan een dag) worden opgeruimd.
*/

const API = "https://api.github.com";
const BRANCH = "boodschappen";
const DIR = "lijsten";
const DEEPLINK = "https://api.getbring.com/rest/bringrecipes/deeplink";

// Keukenmaten: voor de supermarkt telt alleen wát je nodig hebt
const KITCHEN_UNITS = new Set(["el", "tl", "kl", "snufje", "snuf", "scheutje", "scheut", "mespunt", "mespuntje", "cm", "druppel", "handvol"]);

/**
 * Regel voor de boodschappenlijst, zoals je hem in de winkel nodig hebt:
 *  - gewicht en inhoud blijven ("225 g spaghetti")
 *  - stuks naar boven afgerond ("2 uien" in plaats van "1½ uien")
 *  - lepels, snufjes en centimeters weg ("sojasaus")
 */
export function bringLine(ingredient, factor) {
  if (ingredient.amount == null) return ingredient.name;
  const { value, unit } = scaleAmount(ingredient, factor);
  if (KITCHEN_UNITS.has(unit)) return ingredient.name;
  if (["gr", "g", "kg", "ml", "cl", "dl", "l"].includes(unit)) {
    return formatIngredient(ingredient, factor).replace(/^([\d,]+) gr /, "$1 g ");
  }
  // stuks of telwoord (blik, bosje, teentje …): hele aantallen
  const whole = Math.max(1, Math.ceil(value - 1e-9));
  return formatIngredient({ ...ingredient, amount: whole, step: 1 }, 1);
}

export function bringDeeplink(url, servings) {
  const params = new URLSearchParams({
    url,
    source: "web",
    baseQuantity: String(servings),
    requestedQuantity: String(servings),
  });
  return `${DEEPLINK}?${params}`;
}

/** Hele recept vanaf de openbare receptpagina (Bring! rekent zelf om) */
export function bringDeeplinkForPage(recipe, servings) {
  const params = new URLSearchParams({
    url: absoluteUrl(recipePath(recipe.id)),
    source: "web",
    baseQuantity: String(recipe.servings),
    requestedQuantity: String(servings),
  });
  return `${DEEPLINK}?${params}`;
}

/** Klein receptbestand in schema.org-vorm met alleen de gekozen ingrediënten */
export function bringRecipeJSON(recipe, lines, servings) {
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    url: absoluteUrl(recipePath(recipe.id)),
    recipeYield: `${servings} personen`,
    recipeIngredient: lines,
  };
}

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

async function gh(token, path, options = {}) {
  const res = await fetch(`${API}/repos/${GITHUB.owner}/${GITHUB.repo}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    if (res.status === 401) throw new Error("Je GitHub-token is ongeldig of verlopen. Log opnieuw in via het beheer.");
    if (res.status === 403) throw new Error("Je GitHub-token mag niet schrijven in de repo.");
    throw new Error(`GitHub gaf fout ${res.status}.`);
  }
  return res.status === 204 ? true : res.json();
}

async function ensureBranch(token) {
  if (await gh(token, `/git/ref/heads/${BRANCH}`)) return;
  const main = await gh(token, `/git/ref/heads/${GITHUB.branch}`);
  await gh(token, "/git/refs", {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: main.object.sha }),
  });
}

async function cleanupOldLists(token) {
  const files = (await gh(token, `/contents/${DIR}?ref=${BRANCH}`)) || [];
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const f of files) {
    const stamp = Number((f.name.match(/-(\d{13})\.json$/) || [])[1]);
    if (stamp && stamp < dayAgo) {
      await gh(token, `/contents/${f.path}`, {
        method: "DELETE",
        body: JSON.stringify({ message: "Oude boodschappenlijst opgeruimd", branch: BRANCH, sha: f.sha }),
      }).catch(() => {});
    }
  }
}

/**
 * Zet de gekozen ingrediënten klaar voor Bring! en geef de importlink terug.
 */
export async function createBringImport(token, recipe, lines, servings) {
  await ensureBranch(token);
  const name = `${recipe.id}-${Date.now()}.json`;
  const json = JSON.stringify(bringRecipeJSON(recipe, lines, servings), null, 2);
  await gh(token, `/contents/${DIR}/${name}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `Boodschappen: ${recipe.title}`,
      branch: BRANCH,
      content: toBase64(json),
    }),
  });
  cleanupOldLists(token).catch(() => {});
  const fileUrl = `https://raw.githubusercontent.com/${GITHUB.owner}/${GITHUB.repo}/${BRANCH}/${DIR}/${name}`;
  return bringDeeplink(fileUrl, servings);
}

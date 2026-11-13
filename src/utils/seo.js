import site from "../site.json";
import { formatIngredient, ingredientName } from "./formatIngredient";
import { sourceType, platformName } from "./source";

/*
  Gedeeld door de site (titel/meta per pagina) en scripts/prerender.js
  (statische HTML per recept, met structured data voor Google).
*/

export const recipePath = (id) => `/recept/${id}/`;
export const absoluteUrl = (path = "/") => site.url.replace(/\/$/, "") + path;

export function absoluteImage(image) {
  if (!image) return absoluteUrl(`/${site.image}`);
  if (/^https?:/.test(image)) return image;
  return absoluteUrl(`/${image.replace(/^\//, "")}`);
}

/** {id} en {id:naam} vervangen door gewone tekst */
export function plainInstruction(text, ingredients) {
  const byId = Object.fromEntries((ingredients || []).map((i) => [i.id, i]));
  return text.replace(/{([^}:]+)(?::naam)?}/g, (m, id) => {
    const ing = byId[id];
    if (!ing) return "";
    if (m.endsWith(":naam}")) return ingredientName(ing, 1);
    return formatIngredient(ing, 1);
  });
}

function joinNames(names) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} en ${names[names.length - 1]}`;
}

export function recipeDescription(recipe) {
  if (recipe.description) return recipe.description;
  const type = sourceType(recipe.source);
  if (recipe.locked || type === "book") {
    const s = recipe.source || {};
    return `${recipe.title} uit het kookboek ${s.book || ""}${s.author ? ` van ${s.author}` : ""}. Bewaard in de receptenverzameling van ${site.name}.`;
  }
  const names = (recipe.ingredients || [])
    .filter((i) => i.amount != null && !/\b(water|zout|peper|olie)\b/i.test(i.name))
    .slice(0, 4)
    .map((i) => i.name);
  const base = `Recept voor ${recipe.title.toLowerCase()} voor ${recipe.servings} personen`;
  return names.length ? `${base}, met ${joinNames(names)}. Hoeveelheden rekenen mee met het aantal personen.` : `${base}.`;
}

export function recipeTitle(recipe) {
  return `${recipe.title} – recept | ${site.name}`;
}

export function recipeJsonLd(recipe) {
  const url = absoluteUrl(recipePath(recipe.id));
  const crumbs = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Recepten", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: recipe.title, item: url },
    ],
  };

  // Kookboekrecepten: geen ingrediënten openbaar, dus geen Recipe-schema
  if (recipe.locked) {
    return { "@context": "https://schema.org", "@graph": [{ "@type": "WebPage", name: recipe.title, url, description: recipeDescription(recipe) }, crumbs] };
  }

  const ingredients = recipe.ingredients || [];
  const data = {
    "@type": "Recipe",
    name: recipe.title,
    url,
    image: [absoluteImage(recipe.image)],
    description: recipeDescription(recipe),
    author: { "@type": "Person", name: site.author },
    recipeYield: `${recipe.servings} personen`,
    recipeCategory: recipe.category || undefined,
    keywords: (recipe.tags || []).join(", ") || undefined,
    inLanguage: "nl",
    recipeIngredient: ingredients.map((i) =>
      [formatIngredient(i, 1), i.note ? `(${i.note})` : ""].filter(Boolean).join(" ")
    ),
    recipeInstructions: (recipe.instructions || []).map((step, n) => ({
      "@type": "HowToStep",
      position: n + 1,
      text: plainInstruction(step, ingredients),
    })),
  };
  if (sourceType(recipe.source) === "social" && recipe.source?.url) {
    data.isBasedOn = recipe.source.url;
  }
  return { "@context": "https://schema.org", "@graph": [data, crumbs] };
}

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: absoluteUrl("/"),
    inLanguage: "nl",
    description: site.description,
  };
}

export function sourceLabel(source) {
  const type = sourceType(source);
  if (type === "book") return `uit ${source.book}`;
  if (type === "social") return `via ${platformName(source.url)}${source.creator ? ` (${source.creator})` : ""}`;
  return "";
}

export { site };

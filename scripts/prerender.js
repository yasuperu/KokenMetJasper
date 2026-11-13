/*
  Na "react-scripts build": maak voor elke pagina een echte HTML-file.

  - build/index.html               homepage met titel, beschrijving en links
  - build/recept/<id>/index.html   per recept: titel, meta, Open Graph,
                                   structured data (schema.org/Recipe) en
                                   de inhoud als gewone HTML
  - build/404.html                 noindex; vangt ook /keukenkastje op
  - build/sitemap.xml

  Zo krijgt Google per recept een pagina met status 200 en de juiste
  gegevens, ook zonder JavaScript uit te voeren. In de browser neemt de
  React-app het daarna gewoon over.
*/
const fs = require("fs");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src") + path.sep;
const BUILD = path.join(ROOT, "build");

// src/ gebruikt ES-modules; vertaal ze voor Node naar CommonJS
const loadJs = Module._extensions[".js"];
Module._extensions[".js"] = function (module, filename) {
  if (!filename.startsWith(SRC)) return loadJs(module, filename);
  const { code } = babel.transformSync(fs.readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
  });
  module._compile(code, filename);
};

const seo = require(path.join(SRC, "utils/seo.js"));
const { formatIngredient } = require(path.join(SRC, "utils/formatIngredient.js"));
const { sourceType, platformName } = require(path.join(SRC, "utils/source.js"));
const site = require(path.join(SRC, "site.json"));

const recipesDir = path.join(SRC, "data/recipes");
const recipes = fs
  .readdirSync(recipesDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(recipesDir, f), "utf8")))
  .sort((a, b) => a.title.localeCompare(b.title, "nl"));

const template = fs.readFileSync(path.join(BUILD, "index.html"), "utf8");

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function page({ title, description, path: urlPath, image, type = "website", jsonLd, noindex, body }) {
  const url = urlPath ? seo.absoluteUrl(urlPath) : null;
  const tags = [
    noindex ? `<meta name="robots" content="noindex, nofollow">` : "",
    url ? `<link rel="canonical" href="${esc(url)}">` : "",
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    url ? `<meta property="og:url" content="${esc(url)}">` : "",
    `<meta property="og:image" content="${esc(seo.absoluteImage(image))}">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${esc(seo.absoluteImage(image))}">`,
    jsonLd
      ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`
      : "",
  ].join("");

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}">`)
    .replace("</head>", `${tags}</head>`);
  if (body) html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return html;
}

function write(rel, content) {
  const file = path.join(BUILD, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

/* ---------------- homepage ---------------- */

const homeBody = `<main class="container prerender">
<h1>${esc(site.name)}</h1>
<p>${esc(site.description)}</p>
<h2>Recepten</h2>
<ul>${recipes
  .map((r) => `<li><a href="${seo.recipePath(r.id)}">${esc(r.title)}</a>${r.category ? ` – ${esc(r.category)}` : ""}</li>`)
  .join("")}</ul>
</main>`;

write(
  "index.html",
  page({
    title: `${site.name} – favoriete recepten van thuis`,
    description: site.description,
    path: "/",
    jsonLd: seo.homeJsonLd(),
    body: homeBody,
  })
);

/* ---------------- recepten ---------------- */

for (const r of recipes) {
  const type = sourceType(r.source);
  let source = "";
  if (type === "book") {
    source = `<p>Uit het kookboek <cite>${esc(r.source.book)}</cite>${r.source.author ? ` van ${esc(r.source.author)}` : ""}${r.source.page ? `, pagina ${esc(r.source.page)}` : ""}.</p>`;
  } else if (type === "social" && r.source.url) {
    source = `<p>Bron: <a href="${esc(r.source.url)}" rel="nofollow noopener">${esc(r.source.creator || "origineel")}</a> op ${esc(platformName(r.source.url))}</p>`;
  }

  let content = "";
  if (!r.locked) {
    content = `<h2>Ingrediënten</h2><p>Voor ${r.servings} personen.</p><ul>${(r.ingredients || [])
      .map((i) => `<li>${esc(formatIngredient(i, 1))}${i.note ? ` (${esc(i.note)})` : ""}</li>`)
      .join("")}</ul><h2>Bereiding</h2><ol>${(r.instructions || [])
      .map((s) => `<li>${esc(seo.plainInstruction(s, r.ingredients))}</li>`)
      .join("")}</ol>`;
  }

  const body = `<main class="container prerender">
<p><a href="/">← Alle recepten</a></p>
<h1>${esc(r.title)}</h1>
<p>${esc(seo.recipeDescription(r))}</p>
${source}
${content}
</main>`;

  write(
    `recept/${r.id}/index.html`,
    page({
      title: seo.recipeTitle(r),
      description: seo.recipeDescription(r),
      path: seo.recipePath(r.id),
      image: r.image,
      type: "article",
      jsonLd: seo.recipeJsonLd(r),
      body,
    })
  );
}

/* ---------------- 404 (ook voor beheer) ---------------- */

write(
  "404.html",
  page({
    title: `Pagina niet gevonden | ${site.name}`,
    description: site.description,
    noindex: true,
  })
);

/* ---------------- sitemap ---------------- */

const urls = ["/", ...recipes.map((r) => seo.recipePath(r.id))];
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${esc(seo.absoluteUrl(u))}</loc></url>`)
    .join("\n")}\n</urlset>\n`
);

console.log(`Prerender: homepage, ${recipes.length} recepten, 404 en sitemap geschreven.`);

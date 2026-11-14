/*
  Na "react-scripts build": maak voor elke pagina een echte HTML-file,
  gerenderd met dezelfde React-componenten als de site (server-side
  rendering). De browser neemt die HTML daarna over (hydrateRoot), zodat
  de pagina meteen compleet in beeld staat.

  - build/index.html               homepage met titel, beschrijving en links
  - build/recept/<id>/index.html   per recept: titel, meta, Open Graph,
                                   structured data (schema.org/Recipe) en
                                   de inhoud als gewone HTML
  - build/404.html                 noindex; vangt ook /jk (beheer) op
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

// De site draait op de hoofdmap van het domein
process.env.PUBLIC_URL = "";

// require.context bestaat alleen in webpack; bied een eenvoudige versie aan
global.__requireContext = (dir, rel, deep, pattern) => {
  const base = path.resolve(dir, rel);
  const files = fs.readdirSync(base).filter((f) => pattern.test(`./${f}`));
  const ctx = (key) => require(path.join(base, key));
  ctx.keys = () => files.map((f) => `./${f}`);
  return ctx;
};

// src/ gebruikt ES-modules en JSX; vertaal ze voor Node naar CommonJS
const loadJs = Module._extensions[".js"];
Module._extensions[".js"] = function (module, filename) {
  if (!filename.startsWith(SRC)) return loadJs(module, filename);
  const source = fs
    .readFileSync(filename, "utf8")
    .replace(/require\.context\(/g, "__requireContext(__dirname, ");
  const { code } = babel.transformSync(source, {
    filename,
    babelrc: false,
    configFile: false,
    presets: [[require.resolve("@babel/preset-react"), { runtime: "automatic" }]],
    plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
  });
  module._compile(code, filename);
};

const React = require("react");
const { renderToString } = require("react-dom/server");
const { StaticRouter } = require("react-router");
const { AppShell } = require(path.join(SRC, "App.js"));

function renderPage(location) {
  return renderToString(React.createElement(StaticRouter, { location }, React.createElement(AppShell)));
}

const seo = require(path.join(SRC, "utils/seo.js"));
const site = require(path.join(SRC, "site.json"));

const recipesDir = path.join(SRC, "data/recipes");
const recipes = fs
  .readdirSync(recipesDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(recipesDir, f), "utf8")))
  .sort((a, b) => a.title.localeCompare(b.title, "nl"));

let template = fs.readFileSync(path.join(BUILD, "index.html"), "utf8");

// De twee lettertypen die op elke pagina boven de vouw staan meteen ophalen
const mediaDir = path.join(BUILD, "static", "media");
const fontPreloads = fs.existsSync(mediaDir)
  ? fs
      .readdirSync(mediaDir)
      .filter((f) => /^(fraunces-latin-full-normal|inter-latin-wght-normal)\..*\.woff2$/.test(f))
      .map((f) => `<link rel="preload" href="/static/media/${f}" as="font" type="font/woff2" crossorigin>`)
      .join("")
  : "";
template = template.replace("</head>", `${fontPreloads}</head>`);

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

write(
  "index.html",
  page({
    title: `${site.name} – favoriete recepten van thuis`,
    description: site.description,
    path: "/",
    jsonLd: seo.homeJsonLd(),
    body: renderPage("/"),
  })
);

/* ---------------- recepten ---------------- */

for (const r of recipes) {
  write(
    `recept/${r.id}/index.html`,
    page({
      title: seo.recipeTitle(r),
      description: seo.recipeDescription(r),
      path: seo.recipePath(r.id),
      image: r.image,
      type: "article",
      jsonLd: seo.recipeJsonLd(r),
      body: renderPage(seo.recipePath(r.id)),
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

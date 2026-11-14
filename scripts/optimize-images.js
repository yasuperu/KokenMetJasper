/*
  Maakt van elke receptfoto kleinere WebP-versies voor de kaarten en de
  receptpagina: public/images/recipes/opt/<naam>-480, -720 en -960.webp.
  Draait vóór "npm start" en "npm run build"; bestaande versies worden
  alleen opnieuw gemaakt als de foto nieuwer is.
*/
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DIR = path.join(__dirname, "..", "public", "images", "recipes");
const OUT = path.join(DIR, "opt");
const WIDTHS = [480, 720, 960];

(async () => {
  if (!fs.existsSync(DIR)) return;
  fs.mkdirSync(OUT, { recursive: true });
  const photos = fs.readdirSync(DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  let made = 0;
  for (const file of photos) {
    const src = path.join(DIR, file);
    const base = file.replace(/\.[^.]+$/, "");
    for (const width of WIDTHS) {
      const dest = path.join(OUT, `${base}-${width}.webp`);
      if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs) continue;
      await sharp(src).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 72 }).toFile(dest);
      made++;
    }
  }
  console.log(`Foto's: ${photos.length} gevonden, ${made} WebP-versies gemaakt.`);
})().catch((e) => {
  console.error("Foto's optimaliseren mislukt:", e.message);
  process.exit(1);
});

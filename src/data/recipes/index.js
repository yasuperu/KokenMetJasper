/*
  Alle recepten staan als JSON-bestand in deze map.
  Ze worden beheerd via /admin (of met de hand bewerkt).
*/
function importAll(r) {
  return r.keys().map((file) => r(file));
}

const recipes = importAll(require.context("./", false, /\.json$/));

export default recipes;

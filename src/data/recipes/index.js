function importAll(r) {
  return r
    .keys()
    .filter((file) => file !== "./index.js")
    .map((file) => r(file).default);
}

const recipes = importAll(
  require.context("./", true, /\.js$/)
);

export default recipes;
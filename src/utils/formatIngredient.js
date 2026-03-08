import pluralWords from "../data/pluralWords.json";

export function formatIngredient(ingredient, factor) {

  let amount = ingredient.amount * factor;
  let unit = ingredient.unit;
  let name = ingredient.name;

  // grams → kg
  if (unit === "gr" && amount >= 1000) {
    amount = amount / 1000;
    unit = "kg";
  }

  amount = Math.round(amount * 10) / 10;

  // pluralization
  if (amount !== 1) {
    if (pluralWords[name]) {
      name = pluralWords[name];
    }
  }

  return `${amount}${unit ? " " + unit : ""} ${name}`;
}
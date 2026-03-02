export function formatAmount(ingredient, factor) {
  let amount = ingredient.amount * factor;
  let unit = ingredient.unit;

  // Convert grams to kilo if >= 1000
  if (unit === "gr" && amount >= 1000) {
    amount = amount / 1000;
    unit = "kg";
  }

  // Round nicely
  amount = Math.round(amount * 10) / 10;

  // Choose singular/plural
  let name =
    amount === 1
      ? ingredient.singular
      : ingredient.plural;

  return `${amount}${unit ? " " + unit : ""} ${name}`;
}

// Use inside instructions
export function formatInstruction(text, ingredientMap) {
  return text.replace(/{(.*?)}/g, (_, key) => {
    return ingredientMap[key] || "";
  });
}
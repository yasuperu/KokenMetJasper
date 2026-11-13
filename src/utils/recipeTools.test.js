import { parseAmount, parseIngredientLine, parseSteps, autoLinkStep, ingredientId, unknownPlaceholders } from "./recipeTools";
import { singularize, singularizeWord } from "./pluralize";

test.each([
  ["uien", "ui"], ["tomaten", "tomaat"], ["paprika's", "paprika"], ["kippen", "kip"],
  ["druiven", "druif"], ["citroenen", "citroen"], ["eieren", "ei"], ["wortels", "wortel"],
  ["aardappels", "aardappel"], ["aardappelen", "aardappel"], ["courgettes", "courgette"],
  ["teentjes", "teentje"], ["bonen", "boon"], ["radijzen", "radijs"], ["blikken", "blik"],
  ["ananassen", "ananas"], ["avocado's", "avocado"], ["sjalotten", "sjalot"],
])("enkelvoud van %s is %s", (plural, single) => {
  expect(singularizeWord(plural)).toBe(single);
});

test("enkelvoud van woordgroepen", () => {
  expect(singularize("rode uien")).toBe("rode ui");
  expect(singularize("teentjes knoflook")).toBe("teentje knoflook");
});

test.each([
  ["1,5", 1.5], ["½", 0.5], ["1½", 1.5], ["1 1/2", 1.5], ["3/4", 0.75], ["2-3", 2], ["", null], ["abc", null],
])("parseAmount(%s)", (text, value) => {
  expect(parseAmount(text)).toBe(value);
});

test.each([
  ["200 gr bloem", { amount: 200, unit: "gr", name: "bloem", note: "" }],
  ["200g bloem", { amount: 200, unit: "gr", name: "bloem", note: "" }],
  ["3 uien, gesnipperd", { amount: 3, unit: "", name: "ui", note: "gesnipperd" }],
  ["2 teentjes knoflook (geperst)", { amount: 2, unit: "teentje", name: "knoflook", note: "geperst" }],
  ["1 blik tomatenblokjes", { amount: 1, unit: "blik", name: "tomatenblokjes", note: "" }],
  ["2 eetlepels olijfolie", { amount: 2, unit: "el", name: "olijfolie", note: "" }],
  ["½ tl komijn", { amount: 0.5, unit: "tl", name: "komijn", note: "" }],
  ["- 4 rode paprika's", { amount: 4, unit: "", name: "rode paprika", note: "" }],
  ["peper en zout", { amount: null, unit: "", name: "peper en zout", note: "" }],
])("parseIngredientLine(%s)", (line, expected) => {
  expect(parseIngredientLine(line)).toEqual(expected);
});

test("parseSteps haalt nummering weg", () => {
  expect(parseSteps("1. Snijd de ui.\n\n2) Bak de ui.\nStap 3: Klaar.")).toEqual([
    "Snijd de ui.", "Bak de ui.", "Klaar.",
  ]);
});

test("ingredientId", () => {
  expect(ingredientId("rode ui")).toBe("rodeUi");
  expect(ingredientId("crème fraîche")).toBe("cremeFraiche");
  expect(ingredientId("ui", ["ui"])).toBe("ui2");
});

test("autoLinkStep koppelt hoeveelheden en namen", () => {
  const ings = [
    { id: "ui", name: "ui", amount: 2, unit: "" },
    { id: "rodeUi", name: "rode ui", amount: 1, unit: "" },
    { id: "bloem", name: "bloem", amount: 200, unit: "gr" },
  ];
  expect(autoLinkStep("Snipper de uien en de rode ui. Voeg 200 gr bloem toe.", ings)).toBe(
    "Snipper de {ui:naam} en de {rodeUi:naam}. Voeg {bloem} toe."
  );
  expect(autoLinkStep("Bak {ui} met de bloem.", ings)).toBe("Bak {ui} met de {bloem:naam}.");
  expect(autoLinkStep("Uitstekend", ings)).toBe("Uitstekend");
});

test("unknownPlaceholders", () => {
  expect(unknownPlaceholders(["{ui} en {kaas:naam}"], [{ id: "ui" }])).toEqual(["kaas"]);
});

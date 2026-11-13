import { amountsOnFirstMention, unusedIngredients, parseAmount, parseIngredientLine, parseIngredientList, parseSteps, autoLinkStep, ingredientId, unknownPlaceholders } from "./recipeTools";
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

test.each([
  ["2 tenen knoflook, fijngehakt", { amount: 2, unit: "teentje", name: "knoflook", note: "fijngehakt" }],
  ["1 teen knoflook", { amount: 1, unit: "teentje", name: "knoflook", note: "" }],
  ["Optioneel: halve theelepel verkruimelde trassi", { amount: 0.5, unit: "tl", name: "verkruimelde trassi", note: "optioneel" }],
  ["Halve eetlepel palmsuiker", { amount: 0.5, unit: "el", name: "palmsuiker", note: "" }],
  ["3 tot 4 eetlepels zonnebloemolie", { amount: 3, unit: "el", name: "zonnebloemolie", note: "" }],
  ["2x 330 ml bruin bier", { amount: 660, unit: "ml", name: "bruin bier", note: "" }],
  ["Een snufje zout", { amount: 1, unit: "snufje", name: "zout", note: "" }],
  ["Peper en zout naar smaak", { amount: null, unit: "", name: "peper en zout", note: "" }],
  ["1 eetlepel sambal oelek (naar smaak)", { amount: 1, unit: "el", name: "sambal oelek", note: "naar smaak" }],
  ["2 handenvol bladspinazie", { amount: 2, unit: "handvol", name: "bladspinazie", note: "" }],
  ["500 milliliter olie", { amount: 500, unit: "ml", name: "olie", note: "" }],
  ["1 blok tempeh", { amount: 1, unit: "blok", name: "tempeh", note: "" }],
  ["2 sneetjes bruin brood", { amount: 2, unit: "sneetje", name: "bruin brood", note: "" }],
  ["Verse selderij", { amount: null, unit: "", name: "verse selderij", note: "" }],
])("parseIngredientLine(%s) – kookboekschrijfwijzen", (line, expected) => {
  expect(parseIngredientLine(line)).toEqual(expected);
});

test("groepen bij plakken", () => {
  const list = parseIngredientList("2 el olie\nVoor de sesamdressing:\n2 el mayonaise");
  expect(list[0].group).toBeUndefined();
  expect(list[1]).toEqual({ amount: 2, unit: "el", name: "mayonaise", note: "", group: "Sesamdressing" });
});

test.each([
  ["1/2 tl komijnpoeder", { amount: 0.5, unit: "tl", name: "komijnpoeder", note: "" }],
  ["1 1/2 el olie", { amount: 1.5, unit: "el", name: "olie", note: "" }],
  ["1,5 el balsamicoazijn", { amount: 1.5, unit: "el", name: "balsamicoazijn", note: "" }],
  ["2,5 dl room, lauw", { amount: 2.5, unit: "dl", name: "room", note: "lauw" }],
  ["1 halve watermeloen", { amount: 0.5, unit: "", name: "watermeloen", note: "" }],
  ["2 kleine teentjes knoflook", { amount: 2, unit: "teentje", name: "knoflook", note: "kleine" }],
  ["Snufje zwarte peper", { amount: 1, unit: "snufje", name: "zwarte peper", note: "" }],
  ["Sap van 1/2 citroen", { amount: 0.5, unit: "", name: "citroen", note: "alleen het sap" }],
  ["1 blok tempeh (250 gram), in reepjes", { amount: 1, unit: "blok", name: "tempeh", note: "250 gram, in reepjes" }],
  ["1 el Loonse (of Luikse) perenstroop (of bruine suiker)", { amount: 1, unit: "el", name: "Loonse perenstroop", note: "of Luikse, of bruine suiker" }],
  ["2 naan", { amount: 2, unit: "", name: "naan", note: "" }],
])("parseIngredientLine(%s) – lastige gevallen", (line, expected) => {
  expect(parseIngredientLine(line)).toEqual(expected);
});

test("autoLinkStep herkent andere schrijfwijzen", () => {
  const ings = [
    { id: "water", name: "water", amount: 1, unit: "l" },
    { id: "knoflook", name: "knoflook", amount: 2, unit: "teentje" },
    { id: "ketjap", name: "ketjap manis", amount: 3, unit: "el" },
    { id: "zout", name: "zout", amount: 1, unit: "tl" },
  ];
  expect(autoLinkStep("Breng 1 liter water en 1 theelepel zout aan de kook.", ings)).toBe("Breng {water} en {zout} aan de kook.");
  expect(autoLinkStep("Hak twee tenen knoflook fijn.", ings)).toBe("Hak {knoflook} fijn.");
  expect(autoLinkStep("Voeg 3 eetlepels ketjap manis toe.", ings)).toBe("Voeg {ketjap} toe.");
});

test("amountsOnFirstMention zet de hoeveelheid bij de eerste vermelding", () => {
  const ings = [
    { id: "ui", name: "ui", amount: 1 },
    { id: "olie", name: "olie", amount: 2, unit: "el" },
    { id: "zout", name: "zout" },
  ];
  expect(
    amountsOnFirstMention(["Snijd de {ui:naam}.", "Bak de {ui:naam} in {olie:naam}.", "Voeg {olie} en {zout:naam} toe."], ings)
  ).toEqual(["Snijd {ui}.", "Bak de {ui:naam} in {olie}.", "Voeg {olie:naam} en {zout:naam} toe."]);
  expect(amountsOnFirstMention(["Blus met het {olie:naam}."], ings)).toEqual(["Blus met {olie}."]);
  expect(amountsOnFirstMention(["Weeg {ui:naam} af."], ings)).toEqual(["Weeg {ui} af."]);
  expect(amountsOnFirstMention(["Bak {ui} en {ui:naam}."], ings)).toEqual(["Bak {ui} en {ui:naam}."]);
});

test("unusedIngredients", () => {
  const ings = [{ id: "ui", name: "ui", amount: 1 }, { id: "mayo", name: "mayonaise", amount: 2, unit: "el" }];
  expect(unusedIngredients(["Snijd de {ui:naam}."], ings).map((i) => i.id)).toEqual(["mayo"]);
});

test.each([
  ["🌱 1 zak aardappelkroketjes (ca. 600 g)", { amount: 1, unit: "zak", name: "aardappelkroketjes", note: "ca. 600 g" }],
  ["🌱 ca. 4 grote augurken, in blokjes", { amount: 4, unit: "", name: "grote augurk", note: "in blokjes, ongeveer" }],
  ["🌱 2 rijpe avocado’s", { amount: 2, unit: "", name: "rijpe avocado", note: "" }],
  ["🌱 flinke snuf zout", { amount: 1, unit: "snuf", name: "zout", note: "flinke" }],
  ["🌱 fijngemalen zwarte peper", { amount: null, unit: "", name: "fijngemalen zwarte peper", note: "" }],
])("parseIngredientLine(%s) – Instagram-schrijfwijzen", (line, expected) => {
  expect(parseIngredientLine(line)).toEqual(expected);
});

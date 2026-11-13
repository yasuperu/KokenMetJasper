import { pluralize, pluralizeWord } from "./pluralize";
import { formatIngredient, ingredientName } from "./formatIngredient";

describe("pluralizeWord", () => {
  test.each([
    ["ui", "uien"],
    ["prei", "preien"],
    ["ei", "eieren"],
    ["paprika", "paprika's"],
    ["avocado", "avocado's"],
    ["kiwi", "kiwi's"],
    ["tomaat", "tomaten"],
    ["banaan", "bananen"],
    ["peer", "peren"],
    ["boon", "bonen"],
    ["druif", "druiven"],
    ["kaas", "kazen"],
    ["citroen", "citroenen"],
    ["limoen", "limoenen"],
    ["biet", "bieten"],
    ["kip", "kippen"],
    ["ananas", "ananassen"],
    ["sjalot", "sjalotten"],
    ["wortel", "wortels"],
    ["peper", "pepers"],
    ["komkommer", "komkommers"],
    ["appel", "appels"],
    ["aardappel", "aardappelen"],
    ["courgette", "courgettes"],
    ["aubergine", "aubergines"],
    ["teentje", "teentjes"],
    ["bouillonblokje", "bouillonblokjes"],
    ["rotivel", "rotivellen"],
    ["biefstuk", "biefstukken"],
    ["laurierblad", "laurierbladeren"],
    ["champignon", "champignons"],
    ["blik", "blikken"],
    ["knijp", "knijpen"],
    ["abrikoos", "abrikozen"],
    ["radijs", "radijzen"],
    ["perzik", "perziken"],
  ])("%s → %s", (single, plural) => {
    expect(pluralizeWord(single)).toBe(plural);
  });
});

describe("pluralize (meerdere woorden)", () => {
  test.each([
    ["rode ui", "rode uien"],
    ["teentje knoflook", "teentjes knoflook"],
    ["madame jeanette peper", "madame jeanette pepers"],
    ["peper of sambal", "pepers of sambal"],
    ["lente-ui", "lente-uien"],
    ["grote zoete aardappel", "grote zoete aardappelen"],
  ])("%s → %s", (single, plural) => {
    expect(pluralize(single)).toBe(plural);
  });
});

describe("formatIngredient", () => {
  const ui = { id: "ui", name: "ui", amount: 1, unit: "" };
  const knoflook = { id: "k", name: "knoflook", amount: 2, unit: "teentje" };
  const gnocchi = { id: "g", name: "verse gnocchi", amount: 400, unit: "gr" };
  const paprika = { id: "p", name: "paprika", amount: 2, unit: "" };
  const wraps = { id: "w", name: "wrap", amount: 4, unit: "", step: 1 };

  test("enkelvoud en meervoud volgen de hoeveelheid", () => {
    expect(formatIngredient(ui, 1)).toBe("1 ui");
    expect(formatIngredient(ui, 2)).toBe("2 uien");
    expect(formatIngredient(ui, 0.5)).toBe("½ ui");
    expect(formatIngredient(paprika, 0.5)).toBe("1 paprika");
    expect(formatIngredient(paprika, 0.75)).toBe("1½ paprika's");
  });

  test("telwoord krijgt het meervoud, niet het ingrediënt", () => {
    expect(formatIngredient(knoflook, 1)).toBe("2 teentjes knoflook");
    expect(formatIngredient(knoflook, 0.5)).toBe("1 teentje knoflook");
  });

  test("maateenheden blijven gelijk", () => {
    expect(formatIngredient(gnocchi, 1)).toBe("400 gr verse gnocchi");
    expect(formatIngredient(gnocchi, 3)).toBe("1,2 kg verse gnocchi");
    expect(formatIngredient({ name: "kurkuma", amount: 0.5, unit: "tl" }, 1)).toBe("½ tl kurkuma");
  });

  test("step rondt af op hele stuks", () => {
    expect(formatIngredient(wraps, 0.25)).toBe("1 wrap");
    expect(formatIngredient(wraps, 1.25)).toBe("5 wraps");
  });

  test("naam los voor in de bereiding", () => {
    expect(ingredientName(ui, 3)).toBe("uien");
    expect(ingredientName(knoflook, 3)).toBe("knoflook");
  });
});

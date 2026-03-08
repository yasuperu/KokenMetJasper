import vegetarischeroti from "../../photos/surinaamse-roti-kip-masala-1611503768.jpg"

const recipe = {
  id: "vegetarische-roti",
  title: "Vegetarische Roti",
  image: vegetarischeroti,
  tags: ["Vegetarisch", "Surinaams"],

  servings: 4,

  ingredients: [
    { id: "vegaKip", name: "vega kipstukjes", amount: 500, unit: "gr" },
    { id: "aardappels", name: "vastkokende aardappels", amount: 400, unit: "gr" },
    { id: "sperziebonen", name: "sperziebonen", amount: 500, unit: "gr" },
    { id: "water", name: "gekookt water", amount: 400, unit: "ml" },
    { id: "masala", name: "masala kruiden", amount: 3, unit: "el" },
    { id: "bouillon", name: "bouillonblokje", amount: 1, unit: "" },
    { id: "rotivellen", name: "rotivellen", amount: 4, unit: "" },
    { id: "peper", name: "madame jeanette peper of sambal", amount: 1, unit: "" },
    { id: "ui", name: "ui", amount: 1, unit: "" },
    { id: "knoflook", name: "teentje knoflook", amount: 2, unit: "" },
    { id: "ketchup", name: "ketchup", amount: 1, unit: "knijp" }
  ],

  instructions: [
    "Snipper {ui} en {knoflook}. Fruit deze even aan in een goede laag olie.",
    "Haal de {ui} en {knoflook} uit de pan na een minuut fruiten en bak {vegaKip} aan.",
    "Schil en snijd {aardappels} in kleinere stukken. Voeg de {ui}, {knoflook} en {aardappels} toe aan de {vegaKip} in de wokpan.",
    "Bak alles goed aan en voeg {masala}, {bouillon} en {ketchup} toe.",
    "Voeg beetje bij beetje {water} toe. De {vegaKip} en {aardappels} mogen niet geheel onder water staan.",
    "Voeg als laatste {peper} toe. Let op, deze heel toevoegen en proef regelmatig. Als de peper openbreekt, wordt de roti snel pittig.",
    "Blijf water toevoegen en laat het voor 25 minuten doorpruttelen.",
    "Haal de madame jeanette peper uit de roti (optioneel snijd fijn en serveer naast de roti) en voeg als laatste {sperziebonen} toe, gesneden in stukken van 3 à 4 cm, voor ongeveer 15 minuten tot ze gaar zijn en laat het vocht indikken tot een geweste consistentie.",
    "Verwarm {rotivellen} in een pan of in de magnetron en serveer naast de roti."
  ]
};

export default recipe;
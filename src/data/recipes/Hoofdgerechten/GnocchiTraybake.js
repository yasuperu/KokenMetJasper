import gnocchitraybake from "../../photos/surinaamse-roti-kip-masala-1611503768.jpg"

const recipe = {
  id: "gnocchi-traybake",
  title: "Gnocchi Traybake",
  image: gnocchitraybake,
  tags: ["Vegetarisch", "Oven"],

  servings: 4,

  ingredients: [
    { id: "gnocchi", name: "verse gnocchi", amount: 400, unit: "gr" },
    { id: "paprika", name: "paprika", amount: 2, unit: "" },
    { id: "rodeUi", name: "rode ui", amount: 1, unit: "" },
    { id: "spekjes", name: "plantaardige spekjes", amount: 140, unit: "gr" },
    { id: "cherryTomaten", name: "cherry tomaten", amount: 250, unit: "gr" },
    { id: "pestoRosso", name: "pesto rosso", amount: 95, unit: "gr" },
    { id: "olie", name: "olie", amount: 2, unit: "el" },
    { id: "gerooktePaprika", name: "gerookte paprikapoeder", amount: 2, unit: "tl" },
    { id: "kurkuma", name: "kurkuma", amount: 0.5, unit: "tl" },
    { id: "basilicum", name: "gedroogde basilicum", amount: 1, unit: "tl" },
    { id: "dille", name: "dille", amount: 1, unit: "tl" },
    { id: "oregano", name: "oregano", amount: 1, unit: "tl" },
    { id: "chilipoeder", name: "chilipoeder", amount: 1, unit: "naar smaak" }
  ],

  instructions: [
    "Voorverwarm de oven naar 200 graden of gebruik een airfryer.",
    "Snijd {paprika} en {rodeUi} in grove stukken en voeg samen met {gnocchi} en {spekjes} in een kom.",
    "Voeg {pestoRosso}, {olie}, {gerooktePaprika}, {kurkuma}, {basilicum}, {dille}, {oregano} en {chilipoeder} toe en mix goed.",
    "Plaats de ingrediënten op een ovenplaat of airfryerbak.",
    "Verdeel als laatste {cherryTomaten} en stop het in de oven of airfryer voor 17 minuten.",
    "Verdeel alle ingrediënten halverwege een keer om te zorgen dat het gelijk bakt."
  ]
};

export default recipe;
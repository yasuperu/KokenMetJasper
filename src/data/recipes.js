const recipes = [
  {
    id: 1,
    title: "Spaghetti Bolognese",
    image: "/images/spaghetti.jpg",
    tags: ["Pasta", "Italiaans"],
    servings: 4,
    ingredients: [
      { id: "spaghetti", name: "Spaghetti", singular: "Spaghetti", plural: "Spaghetti", unit: "gr", amount: 400 },
      { id: "gehakt", name: "Gehakt", singular: "Gehakt", plural: "Gehakt", unit: "gr", amount: 500 },
      { id: "ui", name: "Ui", singular: "ui", plural: "uien", unit: "", amount: 1 },
      { id: "paprika", name: "Paprika", singular: "paprika", plural: "paprika's", unit: "", amount: 2 }
    ],
    instructions: [
      { text: "Kook {spaghetti}. test" },
      { text: "Bak {gehakt}." },
      { text: "Snijd {ui}." },
      { text: "Voeg {paprika} toe." },
      { text: "Meng alles samen en serveer." }
    ]
  }
];

export default recipes;
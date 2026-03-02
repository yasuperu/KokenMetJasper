import { useParams } from "react-router-dom";
import { useState } from "react";
import recipes from "../data/recipes";
import ServingsSelector from "../components/ServingsSelector";
import { formatAmount, formatInstruction } from "../utils";

function RecipePage() {
  const { id } = useParams();
  const recipe = recipes.find(r => r.id === parseInt(id));

  const [servings, setServings] = useState(recipe.servings);
  const factor = servings / recipe.servings;

  // Create ingredient lookup
  const ingredientMap = {};
  recipe.ingredients.forEach(ingredient => {
    ingredientMap[ingredient.id] = formatAmount(ingredient, factor);
  });

  return (
    <div className="recipe-page">
      <h1>{recipe.title}</h1>
      <img src={recipe.image} alt={recipe.title} />

      <ServingsSelector servings={servings} setServings={setServings} />

      <h2>Boodschappenlijst</h2>
      <ul>
        {recipe.ingredients.map(ingredient => (
          <li key={ingredient.id}>{formatAmount(ingredient, factor)}</li>
        ))}
      </ul>

      <h2>Bereiding</h2>
      <ol>
        {recipe.instructions.map((step, index) => (
          <li key={index}>{formatInstruction(step.text, ingredientMap)}</li>
        ))}
      </ol>
    </div>
  );
}

export default RecipePage;
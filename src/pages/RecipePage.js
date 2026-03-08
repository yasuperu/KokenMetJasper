import { useParams } from "react-router-dom";
import { useState } from "react";
import recipes from "../data/recipes";
import ServingsSelector from "../components/ServingsSelector";
import { formatIngredient } from "../utils/formatIngredient";

function RecipePage() {

  const { id } = useParams();

  const recipe = recipes.find(r => r.id === id);

  const [servings, setServings] = useState(recipe.servings);

  const factor = servings / recipe.servings;

  // Create ingredient lookup map
  const ingredientMap = {};

  recipe.ingredients.forEach((ingredient) => {
    ingredientMap[ingredient.id] = formatIngredient(ingredient, factor);
  });

  // Replace placeholders in instructions
  function formatInstruction(text) {
    return text.replace(/{(.*?)}/g, (_, key) => ingredientMap[key] || "");
  }

  if (!recipe) {
    return <div>Recipe not found</div>;
  }

  return (
    <div className="recipe-page">

      <h1>{recipe.title}</h1>

      {recipe.image && (
        <img
          src={recipe.image}
          alt={recipe.title}
          className="recipe-image"
        />
      )}

      <ServingsSelector
        servings={servings}
        setServings={(value) => {
          if (value < 1) value = 1;
          setServings(value);
        }}
      />

      <h2>Boodschappenlijst</h2>

      <ul>
        {recipe.ingredients.map((ingredient) => (
          <li key={ingredient.id}>
            {formatIngredient(ingredient, factor)}
          </li>
        ))}
      </ul>

      <h2>Bereiding</h2>

      <ol>
        {recipe.instructions.map((step, index) => (
          <li key={index}>
            {formatInstruction(step)}
          </li>
        ))}
      </ol>

    </div>
  );
}

export default RecipePage;
import { Link } from "react-router-dom";

function RecipeCard({ recipe }) {
  return (
    <div className="recipe-card">
      <img src={recipe.image} alt={recipe.title} />
      <h3>{recipe.title}</h3>
      <div className="tags">
        {recipe.tags.map(tag => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <Link to={`/recipe/${recipe.id}`}>Bekijk Recept</Link>
    </div>
  );
}

export default RecipeCard;
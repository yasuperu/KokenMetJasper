import { Link } from "react-router-dom";

function RecipeCard({ recipe }) {
  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card-link">

      <div className="recipe-card">

        {recipe.image && (
          <img src={recipe.image} alt={recipe.title} />
        )}

        <div className="recipe-card-content">
          <h3>{recipe.title}</h3>

          {recipe.tags && (
            <div className="tags">
              {recipe.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
        </div>

      </div>

    </Link>
  );
}

export default RecipeCard;
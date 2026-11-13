import { Link } from "react-router-dom";
import { DOODLES } from "./Doodles";

const ACCENTS = ["plum", "carrot", "leaf", "rose", "mustard", "cobalt"];
const PLACEHOLDERS = [DOODLES.Beet, DOODLES.Tomato, DOODLES.PeaPod, DOODLES.Carrot];

function RecipeCard({ recipe, index = 0 }) {
  const accent = ACCENTS[index % ACCENTS.length];
  const Placeholder = PLACEHOLDERS[index % PLACEHOLDERS.length];

  return (
    <Link to={`/recipe/${recipe.id}`} className={`recipe-card accent-${accent}`}>
      <div className="recipe-card-image">
        {recipe.image ? (
          <img src={recipe.image} alt="" loading="lazy" />
        ) : (
          <Placeholder className="recipe-card-placeholder" />
        )}
      </div>

      <div className="recipe-card-content">
        <h3>{recipe.title}</h3>
        <p className="recipe-card-meta">
          {recipe.ingredients.length} ingrediënten · {recipe.servings} personen
        </p>

        {recipe.tags && (
          <ul className="tags">
            {recipe.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}

export default RecipeCard;

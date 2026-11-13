import { Link } from "react-router-dom";
import { DOODLES } from "./Doodles";
import { imageUrl } from "../config";
import { recipePath } from "../utils/seo";
import { platformName, sourceType } from "../utils/source";

const ACCENTS = ["plum", "carrot", "leaf", "rose", "mustard", "cobalt"];
const PLACEHOLDERS = [DOODLES.Beet, DOODLES.Tomato, DOODLES.PeaPod, DOODLES.Carrot];

function RecipeCard({ recipe, index = 0 }) {
  const accent = ACCENTS[index % ACCENTS.length];
  const Placeholder = PLACEHOLDERS[index % PLACEHOLDERS.length];
  const image = imageUrl(recipe.image);

  return (
    <Link to={recipePath(recipe.id)} className={`recipe-card accent-${accent}`}>
      <div className="recipe-card-image">
        {image ? (
          <img src={image} alt="" loading="lazy" />
        ) : (
          <Placeholder className="recipe-card-placeholder" />
        )}
        {recipe.locked && (
          <span className="card-badge" title="Recept uit een kookboek, met wachtwoord">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" />
              <path d="M8 11V8a4 4 0 018 0v3" fill="none" stroke="currentColor" strokeWidth="2.2" />
            </svg>
            Kookboek
          </span>
        )}
      </div>

      <div className="recipe-card-content">
        {recipe.category && <p className="recipe-card-category">{recipe.category}</p>}
        <h3>{recipe.title}</h3>
        <p className="recipe-card-meta">
          {sourceType(recipe.source) === "book" ? (
            <>uit <cite>{recipe.source.book}</cite></>
          ) : (
            <>
              {(recipe.ingredients || []).length} ingrediënten · {recipe.servings} personen
              {sourceType(recipe.source) === "social" && <> · via {platformName(recipe.source.url)}</>}
            </>
          )}
        </p>

        {recipe.tags?.length > 0 && (
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

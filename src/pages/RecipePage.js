import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import recipes from "../data/recipes";
import ServingsSelector from "../components/ServingsSelector";
import { formatIngredient, ingredientName, ingredientParts } from "../utils/formatIngredient";
import { Leaf, Whisk } from "../components/Doodles";

/*
  In de bereiding:
    {id}       → hoeveelheid + naam   ("2 teentjes knoflook")
    {id:naam}  → alleen de naam        ("knoflook", "uien")
*/
function renderInstruction(text, ingredientsById, factor) {
  const parts = text.split(/({[^}]+})/g);
  return parts.map((part, i) => {
    const match = part.match(/^{([^}:]+)(?::(naam))?}$/);
    if (!match) return part;
    const ingredient = ingredientsById[match[1]];
    if (!ingredient) return part;
    const label = match[2] ? ingredientName(ingredient, factor) : formatIngredient(ingredient, factor);
    return (
      <span key={i} className="ing-ref">
        {label}
      </span>
    );
  });
}

function RecipePage() {
  const { id } = useParams();
  const recipe = recipes.find((r) => r.id === id);

  const [servings, setServings] = useState(recipe ? recipe.servings : 1);
  const [printPhoto, setPrintPhoto] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = recipe ? `${recipe.title} · Koken met Jasper` : "Koken met Jasper";
  }, [recipe]);

  if (!recipe) {
    return (
      <main className="container not-found">
        <h1>Recept niet gevonden</h1>
        <Link to="/kokenmetjasper" className="back-link">← Terug naar alle recepten</Link>
      </main>
    );
  }

  const factor = servings / recipe.servings;
  const ingredientsById = Object.fromEntries(recipe.ingredients.map((i) => [i.id, i]));

  return (
    <main className={printPhoto ? "recipe-page print-photo" : "recipe-page"}>
      <Link to="/kokenmetjasper" className="back-link no-print">← Alle recepten</Link>

      <header className="recipe-header">
        <div className="recipe-header-text">
          {recipe.tags && (
            <ul className="tags">
              {recipe.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          )}
          <h1>{recipe.title}</h1>
          <p className="recipe-meta">
            {recipe.ingredients.length} ingrediënten · {recipe.instructions.length} stappen
            <span className="print-only"> · voor {servings} {servings === 1 ? "persoon" : "personen"}</span>
          </p>

          <div className="recipe-tools no-print">
            <ServingsSelector servings={servings} setServings={setServings} />
            <div className="print-tools">
              <button type="button" className="btn-print" onClick={() => window.print()}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 9V3h10v6M7 17H4v-7a1 1 0 011-1h14a1 1 0 011 1v7h-3M7 14h10v7H7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
                Recept printen
              </button>
              {recipe.image && (
                <label className="checkbox">
                  <input type="checkbox" checked={printPhoto} onChange={(e) => setPrintPhoto(e.target.checked)} />
                  Foto mee printen
                </label>
              )}
            </div>
          </div>
        </div>

        {recipe.image && (
          <div className="recipe-image-wrap">
            <img src={recipe.image} alt={recipe.title} className="recipe-image" />
          </div>
        )}
      </header>

      <div className="recipe-body">
        <section className="ingredients">
          <h2>
            <Leaf className="h2-icon" /> Ingrediënten
          </h2>
          <p className="ingredients-for">
            voor {servings} {servings === 1 ? "persoon" : "personen"}
          </p>
          <ul>
            {recipe.ingredients.map((ingredient) => {
              const p = ingredientParts(ingredient, factor);
              return (
                <li key={ingredient.id}>
                  <span className="qty">
                    {p.amount} {p.unit}
                  </span>
                  <span className="ing-name">
                    {p.name}
                    {p.note && <span className="ing-note"> ({p.note})</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="steps">
          <h2>
            <Whisk className="h2-icon" /> Bereiding
          </h2>
          <ol>
            {recipe.instructions.map((step, index) => (
              <li key={index}>
                <span className="step-number" aria-hidden="true">{index + 1}</span>
                <p>{renderInstruction(step, ingredientsById, factor)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <p className="print-only print-footer">Koken met Jasper</p>
    </main>
  );
}

export default RecipePage;

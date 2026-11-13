import { Fragment } from "react";
import { formatIngredient, ingredientName, ingredientParts } from "../utils/formatIngredient";
import { Leaf, Whisk } from "./Doodles";

/*
  In de bereiding:
    {id}       → hoeveelheid + naam   ("2 teentjes knoflook")
    {id:naam}  → alleen de naam        ("knoflook", "uien")
*/
export function renderInstruction(text, ingredientsById, factor) {
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

function RecipeContent({ ingredients, instructions, servings, factor, stepsReplacement }) {
  const ingredientsById = Object.fromEntries(ingredients.map((i) => [i.id, i]));

  return (
    <div className="recipe-body">
      <section className="ingredients">
        <h2>
          <Leaf className="h2-icon" /> Ingrediënten
        </h2>
        <p className="ingredients-for">
          voor {servings} {servings === 1 ? "persoon" : "personen"}
        </p>
        <ul>
          {ingredients.map((ingredient, index) => {
            const p = ingredientParts(ingredient, factor);
            const group = ingredient.group || "";
            const newGroup = group && group !== (ingredients[index - 1]?.group || "");
            return (
              <Fragment key={ingredient.id}>
              {newGroup && <li className="ing-group">{group}</li>}
              <li>
                <span className="qty">
                  {p.amount} {p.unit}
                </span>
                <span className="ing-name">
                  {p.name}
                  {p.note && <span className="ing-note"> ({p.note})</span>}
                </span>
              </li>
              </Fragment>
            );
          })}
        </ul>
      </section>

      {stepsReplacement || (
      <section className="steps">
        <h2>
          <Whisk className="h2-icon" /> Bereiding
        </h2>
        <ol>
          {instructions.map((step, index) => (
            <li key={index}>
              <span className="step-number" aria-hidden="true">{index + 1}</span>
              <p>{renderInstruction(step, ingredientsById, factor)}</p>
            </li>
          ))}
        </ol>
      </section>
      )}
    </div>
  );
}

export default RecipeContent;

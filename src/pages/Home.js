import { useMemo, useState } from "react";
import recipes from "../data/recipes";
import RecipeCard from "../components/RecipeCard";
import SearchBar from "../components/SearchBar";
import { Beet, Carrot, Chili, Garlic, Leaf, LemonSlice, PeaPod, Tomato, Whisk } from "../components/Doodles";

const normalize = (text) =>
  text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function Home() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);

  const allTags = useMemo(
    () => [...new Set(recipes.flatMap((r) => [r.category, ...(r.tags || [])].filter(Boolean)))].sort(),
    []
  );

  const query = normalize(search.trim());
  const filteredRecipes = recipes
    .filter((recipe) => !activeTag || recipe.category === activeTag || (recipe.tags || []).includes(activeTag))
    .filter((recipe) => {
      if (!query) return true;
      const haystack = [
        recipe.title,
        recipe.category,
        recipe.source?.book,
        recipe.source?.author,
        ...(recipe.tags || []),
        ...(recipe.ingredients || []).map((i) => i.name),
      ].join(" ");
      return normalize(haystack).includes(query);
    })
    .sort((a, b) => a.title.localeCompare(b.title, "nl"));

  return (
    <main>
      <section className="hero">
        <div className="hero-doodles" aria-hidden="true">
          <Leaf className="d d1" />
          <LemonSlice className="d d2" />
          <Tomato className="d d3" />
          <PeaPod className="d d4" />
          <Garlic className="d d5" />
          <Chili className="d d6" />
          <Beet className="d d7" />
          <Carrot className="d d8" />
          <Whisk className="d d9" />
          <Leaf className="d d10" color="var(--cobalt)" />
        </div>

        <div className="hero-text">
          <p className="eyebrow">Het receptenboek van</p>
          <h1>
            <span className="h-plum">Koken</span> <span className="h-small">met</span>{" "}
            <span className="h-carrot">Jasper</span>
          </h1>
          <p className="hero-lead">
            Eerlijke, makkelijke gerechten voor elke dag. Pas het aantal personen
            aan en alle hoeveelheden rekenen vanzelf mee — ook als je het recept
            uitprint.
          </p>
        </div>
      </section>

      <section className="container">
        <div className="filters">
          <SearchBar search={search} setSearch={setSearch} />

          {allTags.length > 0 && (
            <div className="tag-filter" role="group" aria-label="Filter op categorie">
              <button
                type="button"
                className={!activeTag ? "chip active" : "chip"}
                onClick={() => setActiveTag(null)}
              >
                Alles
              </button>
              {allTags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={activeTag === tag ? "chip active" : "chip"}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredRecipes.length > 0 ? (
          <div className="recipe-grid">
            {filteredRecipes.map((recipe, index) => (
              <RecipeCard key={recipe.id} recipe={recipe} index={index} />
            ))}
          </div>
        ) : (
          <p className="empty">Geen recepten gevonden. Probeer een ander woord.</p>
        )}
      </section>
    </main>
  );
}

export default Home;

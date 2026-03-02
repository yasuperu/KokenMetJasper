import { useState } from "react";
import recipes from "../data/recipes";
import RecipeCard from "../components/RecipeCard";
import SearchBar from "../components/SearchBar";

function Home() {
  const [search, setSearch] = useState("");

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <SearchBar search={search} setSearch={setSearch} />
      <div className="recipe-grid">
        {filteredRecipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}

export default Home;
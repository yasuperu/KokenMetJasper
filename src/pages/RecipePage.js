import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import recipes from "../data/recipes";
import ServingsSelector from "../components/ServingsSelector";
import RecipeContent from "../components/RecipeContent";
import LockedContent from "../components/LockedContent";
import SourceNote from "../components/SourceNote";
import { checkPassword, decryptJSON } from "../utils/crypto";
import StepsGate from "../components/StepsGate";
import { decryptSteps, hasVisitedPost, isGated, markPostVisited } from "../utils/gate";
import passwordLock from "../data/lock.json";
import { forgetPassword, getPassword, setPassword } from "../utils/passwordStore";
import { imageUrl } from "../config";
import useSeo from "../hooks/useSeo";
import { formatMinutes, recipeDescription, recipePath, recipeTimes, recipeTitle } from "../utils/seo";
import NotFound from "./NotFound";

function RecipePage() {
  const { id } = useParams();
  const recipe = recipes.find((r) => r.id === id);

  const [servings, setServings] = useState(recipe ? recipe.servings : 1);
  const [printPhoto, setPrintPhoto] = useState(false);
  const [content, setContent] = useState(
    recipe && !recipe.locked ? { ingredients: recipe.ingredients, instructions: recipe.instructions || [] } : null
  );
  const gated = isGated(recipe);
  const [stepsVisible, setStepsVisible] = useState(() => !gated || hasVisitedPost(recipe.id));
  const [gateError, setGateError] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [recipe]);

  useSeo(
    recipe
      ? {
          title: recipeTitle(recipe),
          description: recipeDescription(recipe),
          path: recipePath(recipe.id),
          image: recipe.image,
        }
      : { noindex: true }
  );

  // Versleutelde bereiding (social media) pas ontsleutelen als hij getoond mag worden
  const [stepsReady, setStepsReady] = useState(!recipe?.gatedSteps);
  useEffect(() => {
    if (!stepsVisible || !recipe?.gatedSteps || stepsReady) return;
    let cancelled = false;
    decryptSteps(recipe.gatedSteps)
      .then((instructions) => {
        if (cancelled) return;
        setContent((c) => ({ ...c, instructions }));
        setStepsReady(true);
      })
      .catch(() => !cancelled && setGateError("De bereiding kon niet geladen worden."));
    return () => {
      cancelled = true;
    };
  }, [stepsVisible, stepsReady, recipe]);

  // Automatisch ontgrendelen met een onthouden wachtwoord
  useEffect(() => {
    if (!recipe?.locked) return;
    const saved = getPassword();
    if (!saved) return;
    let cancelled = false;
    setBusy(true);
    decryptJSON(recipe.locked, saved)
      .then((data) => !cancelled && setContent(data))
      .catch(() => {})
      .finally(() => !cancelled && setBusy(false));
    return () => {
      cancelled = true;
    };
  }, [recipe]);

  // Afgeschermde bereiding: met een onthouden wachtwoord meteen tonen
  useEffect(() => {
    if (!gated || stepsVisible) return;
    const saved = getPassword();
    if (saved) checkPassword(passwordLock, saved).then((ok) => ok && setStepsVisible(true));
  }, [gated, stepsVisible]);

  function visitPost() {
    markPostVisited(recipe.id);
    // even wachten zodat het nieuwe tabblad eerst opent
    setTimeout(() => setStepsVisible(true), 400);
  }

  async function unlockSteps(password) {
    setBusy(true);
    setGateError("");
    const ok = await checkPassword(passwordLock, password);
    setBusy(false);
    if (ok) {
      setPassword(password, true);
      setStepsVisible(true);
    } else {
      setGateError("Dat wachtwoord klopt niet.");
    }
  }

  async function unlock(password, remember) {
    setBusy(true);
    setUnlockError("");
    try {
      const data = await decryptJSON(recipe.locked, password);
      setPassword(password, remember);
      setContent(data);
    } catch {
      setUnlockError("Dat wachtwoord klopt niet.");
    } finally {
      setBusy(false);
    }
  }

  function lock() {
    forgetPassword();
    setContent(null);
  }

  if (!recipe) return <NotFound />;

  const factor = servings / recipe.servings;
  const times = recipeTimes(recipe);
  const image = imageUrl(recipe.image);
  const unlocked = Boolean(content);

  return (
    <main className={printPhoto ? "recipe-page print-photo" : "recipe-page"}>
      <Link to="/" className="back-link no-print">← Alle recepten</Link>

      <header className="recipe-header">
        <div className="recipe-header-text">
          {(recipe.category || recipe.tags?.length > 0) && (
            <ul className="tags">
              {[recipe.category, ...(recipe.tags || [])].filter(Boolean).map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          )}
          <h1>{recipe.title}</h1>
          {recipe.description && <p className="recipe-description">{recipe.description}</p>}
          <SourceNote source={recipe.source} />
          {times.total > 0 && (
            <p className="recipe-times">
              {times.prep > 0 && <span>Voorbereiden <strong>{formatMinutes(times.prep)}</strong></span>}
              {times.cook > 0 && <span>Koken <strong>{formatMinutes(times.cook)}</strong></span>}
            </p>
          )}
          {unlocked && (
            <p className="recipe-meta">
              {content.ingredients.length} ingrediënten
              {stepsReady && <> · {content.instructions.length} stappen</>}
              <span className="print-only"> · voor {servings} {servings === 1 ? "persoon" : "personen"}</span>
            </p>
          )}

          {unlocked && (
            <div className="recipe-tools no-print">
              <ServingsSelector servings={servings} setServings={setServings} />
              <div className="print-tools">
                <button type="button" className="btn-print" onClick={() => window.print()}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 9V3h10v6M7 17H4v-7a1 1 0 011-1h14a1 1 0 011 1v7h-3M7 14h10v7H7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                  Recept printen
                </button>
                {image && (
                  <label className="checkbox">
                    <input type="checkbox" checked={printPhoto} onChange={(e) => setPrintPhoto(e.target.checked)} />
                    Foto mee printen
                  </label>
                )}
                {recipe.locked && (
                  <button type="button" className="btn-link" onClick={lock}>
                    Vergrendel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {image && (
          <div className="recipe-image-wrap">
            <img src={image} alt={recipe.title} className="recipe-image" />
          </div>
        )}
      </header>

      {unlocked ? (
        <RecipeContent
          ingredients={content.ingredients}
          instructions={content.instructions}
          servings={servings}
          factor={factor}
          stepsReplacement={
            stepsVisible && stepsReady ? null : (
              <StepsGate
                source={recipe.source}
                onVisit={visitPost}
                onPassword={unlockSteps}
                error={gateError}
                busy={busy}
              />
            )
          }
        />
      ) : (
        <LockedContent source={recipe.source} onUnlock={unlock} error={unlockError} busy={busy} />
      )}

      <p className="print-only print-footer">
        Koken met Jasper
        {recipe.source?.book &&
          ` · ${recipe.source.adapted ? "gebaseerd op" : "uit"} ${recipe.source.book}${recipe.source.author ? `, ${recipe.source.author}` : ""}`}
      </p>
    </main>
  );
}

export default RecipePage;

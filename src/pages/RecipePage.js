import { Link, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import recipes from "../data/recipes";
import ServingsSelector from "../components/ServingsSelector";
import RecipeContent from "../components/RecipeContent";
import LockedContent from "../components/LockedContent";
import LockedSteps from "../components/LockedSteps";
import { shuffled } from "../utils/publicIngredients";
import SourceNote from "../components/SourceNote";
import { checkPassword, decryptJSON } from "../utils/crypto";
import StepsGate from "../components/StepsGate";
import { bringDeeplinkForBook, bringDeeplinkForPage, bringLine } from "../utils/bring";
import { readToken } from "../utils/githubToken";
import { decryptSteps, hasVisitedPost, isGated, markPostVisited } from "../utils/gate";
import passwordLock from "../data/lock.json";
import { forgetPassword, getPassword, setPassword } from "../utils/passwordStore";
import { imageSrcSet, imageUrl } from "../config";
import useSeo from "../hooks/useSeo";
import { formatMinutes, recipeDescription, recipePath, recipeTimes, recipeTitle } from "../utils/seo";
import NotFound from "./NotFound";

function RecipePage() {
  const { id } = useParams();
  const recipe = recipes.find((r) => r.id === id);

  const [servings, setServings] = useState(recipe ? recipe.servings : 1);
  const [printPhoto, setPrintPhoto] = useState(false);
  // Kookboekrecepten: ingrediënten openbaar (als ze erin staan), bereiding versleuteld
  const publicContent = (r) =>
    !r ? null
    : !r.locked ? { ingredients: r.ingredients, instructions: r.instructions || [] }
    : r.ingredients ? { ingredients: r.ingredients, instructions: [] }
    : null;
  const [content, setContent] = useState(() => publicContent(recipe));
  const [bookOpen, setBookOpen] = useState(false);
  // Niet ontgrendeld: openbare ingrediënten elke keer in een andere volgorde
  // (pas na het laden, zodat de vooraf gebouwde HTML gelijk blijft)
  const showShuffled = useCallback(() => {
    if (recipe?.locked && recipe.ingredients) {
      setContent({ ingredients: shuffled(recipe.ingredients), instructions: [] });
    }
  }, [recipe]);
  useEffect(() => {
    if (!getPassword()) showShuffled();
  }, [showShuffled]);
  const gated = isGated(recipe);
  const [stepsVisible, setStepsVisible] = useState(!gated);
  useEffect(() => {
    if (gated && hasVisitedPost(recipe.id)) setStepsVisible(true);
  }, [gated, recipe]);
  const [gateError, setGateError] = useState("");

  // Boodschappen: alleen als het wachtwoord op dit apparaat is onthouden
  // (of als je via het beheer met GitHub bent ingelogd)
  const [loggedIn, setLoggedIn] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (readToken()) return setLoggedIn(true);
    const saved = getPassword();
    if (saved) checkPassword(passwordLock, saved).then((ok) => ok && setLoggedIn(true));
  }, []);

  async function copyShopping() {
    const factorNow = servings / recipe.servings;
    const lines = (content?.ingredients || []).map((i) => bringLine(i, factorNow));
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  }

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
      .then((data) => {
        if (cancelled) return;
        setContent(data);
        setBookOpen(true);
      })
      .catch(() => !cancelled && showShuffled())
      .finally(() => !cancelled && setBusy(false));
    return () => {
      cancelled = true;
    };
  }, [recipe, showShuffled]);

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
      setLoggedIn(true);
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
      setBookOpen(true);
      setLoggedIn(true);
    } catch {
      setUnlockError("Dat wachtwoord klopt niet.");
    } finally {
      setBusy(false);
    }
  }

  function lock() {
    forgetPassword();
    setContent(publicContent(recipe));
    showShuffled();
    setBookOpen(false);
  }

  if (!recipe) return <NotFound />;

  const factor = servings / recipe.servings;
  const times = recipeTimes(recipe);
  const image = imageUrl(recipe.image);
  const unlocked = Boolean(content);
  const stepsKnown = recipe.locked ? bookOpen : stepsReady;
  // Kookboekrecept zonder wachtwoord: alleen de namen van de ingrediënten
  const namesOnly = Boolean(recipe.locked) && !bookOpen;
  // Bring! leest een openbare pagina: de receptpagina, of bij kookboekrecepten
  // de verborgen Bring!-pagina met hoeveelheden
  const bringable = !recipe.locked || Boolean(recipe.bringIngredients);
  const bringHref = recipe.locked ? bringDeeplinkForBook(recipe, servings) : bringDeeplinkForPage(recipe, servings);

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
              {stepsKnown && <> · {content.instructions.length} stappen</>}
              <span className="print-only"> · voor {servings} {servings === 1 ? "persoon" : "personen"}</span>
            </p>
          )}

          {unlocked && (
            <div className="recipe-tools no-print">
              {!namesOnly && <ServingsSelector servings={servings} setServings={setServings} />}
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
                {loggedIn && bringable && (
                  <a
                    className="btn-print"
                    href={bringHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 5h2l2 10h10l2-7H7.5M10 19.5a1 1 0 100-.01M17 19.5a1 1 0 100-.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Naar Bring!
                  </a>
                )}
                {loggedIn && !bringable && (
                  <button type="button" className="btn-print" onClick={copyShopping}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 5h2l2 10h10l2-7H7.5M10 19.5a1 1 0 100-.01M17 19.5a1 1 0 100-.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {copied ? "Gekopieerd!" : "Kopieer boodschappen"}
                  </button>
                )}
                {recipe.locked && bookOpen && (
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
            <picture>
              {/* Telefoons: hooguit 720 px, scherp genoeg en veel lichter */}
              <source media="(max-width: 860px)" srcSet={imageSrcSet(recipe.image, [480, 720])} sizes="88vw" />
              <img
                src={image}
                srcSet={imageSrcSet(recipe.image)}
                sizes="520px"
                alt={recipe.title}
                className="recipe-image"
                fetchPriority="high"
              />
            </picture>
          </div>
        )}
      </header>

      {unlocked ? (
        <RecipeContent
          ingredients={content.ingredients}
          instructions={content.instructions}
          servings={servings}
          factor={factor}
          namesOnly={namesOnly}
          stepsReplacement={
            recipe.locked && !bookOpen ? (
              <LockedSteps source={recipe.source} onUnlock={unlock} error={unlockError} busy={busy} />
            ) : stepsVisible && stepsReady ? null : (
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

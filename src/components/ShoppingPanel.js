import { useState } from "react";
import { bringDeeplinkForPage, bringLine, createBringImport } from "../utils/bring";
import { readToken } from "../utils/githubToken";

/**
 * Boodschappen: gekozen ingrediënten naar Bring!, kopiëren of delen.
 * Alleen zichtbaar voor wie in deze browser via /jk met GitHub is ingelogd.
 */
function ShoppingPanel({ recipe, ingredients, selected, setSelected, servings, factor, onClose }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { type, text, link }

  const chosen = ingredients.filter((i) => selected.has(i.id));
  const lines = chosen.map((i) => bringLine(i, factor));
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function toBring() {
    if (!lines.length) return;
    setBusy(true);
    setStatus(null);
    // Venster meteen openen (anders blokkeert de browser het), daarna het adres invullen
    const win = window.open("about:blank", "_blank");
    try {
      const link = await createBringImport(readToken(), recipe, lines, servings);
      if (win) {
        win.location.href = link;
        setStatus({ type: "ok", text: "Bring! is geopend in een nieuw tabblad.", link });
      } else {
        setStatus({ type: "ok", text: "Klaar. Open de lijst in Bring!:", link });
      }
    } catch (err) {
      if (win) win.close();
      setStatus({ type: "error", text: err.message });
    }
    setBusy(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setStatus({ type: "ok", text: `${lines.length} ingrediënten gekopieerd.` });
    } catch {
      setStatus({ type: "error", text: "Kopiëren lukte niet in deze browser." });
    }
  }

  async function share() {
    try {
      await navigator.share({ title: `Boodschappen: ${recipe.title}`, text: lines.join("\n") });
    } catch {}
  }

  return (
    <div className="shopping-panel no-print" role="region" aria-label="Boodschappen">
      <div className="shopping-head">
        <h2>Boodschappen</h2>
        <button type="button" className="btn-link" onClick={onClose}>Sluiten</button>
      </div>
      <p className="hint">
        Vink in de ingrediëntenlijst uit wat je al in huis hebt. De hoeveelheden zijn voor {servings}{" "}
        {servings === 1 ? "persoon" : "personen"}.
      </p>
      <div className="shopping-select">
        <button type="button" className="btn-link" onClick={() => setSelected(new Set(ingredients.map((i) => i.id)))}>
          Alles aan
        </button>
        <button type="button" className="btn-link" onClick={() => setSelected(new Set())}>
          Alles uit
        </button>
      </div>
      <div className="shopping-actions">
        <button type="button" className="btn-primary" onClick={toBring} disabled={busy || !lines.length}>
          {busy ? "Bezig…" : `Naar Bring! (${lines.length})`}
        </button>
        <button type="button" className="btn-secondary" onClick={copy} disabled={!lines.length}>
          Kopieer lijst
        </button>
        {canShare && (
          <button type="button" className="btn-secondary" onClick={share} disabled={!lines.length}>
            Delen
          </button>
        )}
      </div>
      {!recipe.locked && (
        <p className="hint">
          Werkt het niet?{" "}
          <a href={bringDeeplinkForPage(recipe, servings)} target="_blank" rel="noopener noreferrer">
            Stuur het hele recept naar Bring!
          </a>{" "}
          en kies daar welke ingrediënten je wilt.
        </p>
      )}
      {status && (
        <p className={status.type === "error" ? "form-error" : "shopping-status"} role="status">
          {status.text}{" "}
          {status.link && (
            <a href={status.link} target="_blank" rel="noopener noreferrer">
              Open in Bring!
            </a>
          )}
        </p>
      )}
    </div>
  );
}

export default ShoppingPanel;

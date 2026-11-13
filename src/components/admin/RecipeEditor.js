import { useRef, useState } from "react";
import ServingsSelector from "../ServingsSelector";
import RecipeContent, { renderInstruction } from "../RecipeContent";
import { formatIngredient } from "../../utils/formatIngredient";
import {
  amountToText,
  autoLinkStep,
  ingredientId,
  parseAmount,
  parseIngredientList,
  parseSteps,
  unknownPlaceholders,
  UNIT_SUGGESTIONS,
} from "../../utils/recipeTools";
import { resizeImage } from "../../utils/image";
import { imageUrl } from "../../config";
import { platformName, sourceType } from "../../utils/source";

export const CATEGORIES = [
  "Ontbijt", "Brunch", "Lunch", "Brood", "Soep", "Salade", "Voorgerecht", "Hoofdgerecht",
  "Bijgerecht", "Pasta", "Ovenschotel", "Dessert", "Taart & gebak", "Koekjes",
  "Snack", "Borrelhapje", "Saus & dressing", "Drankje",
];

const OTHER = "__anders__";

let keyCounter = 0;
const newKey = () => `k${Date.now().toString(36)}${keyCounter++}`;

/* ------------------------------------------------------------
   Recept ↔ formulier
   ------------------------------------------------------------ */

export function recipeToDraft(recipe, content) {
  const ingredients = content?.ingredients || recipe?.ingredients || [];
  return {
    id: recipe?.id || "",
    title: recipe?.title || "",
    category: recipe?.category || "Hoofdgerecht",
    tagsText: (recipe?.tags || []).join(", "),
    servings: recipe?.servings || 4,
    image: recipe?.image || "",
    newImage: null,
    description: recipe?.description || "",
    sourceType: recipe?.locked ? "book" : sourceType(recipe?.source),
    source: { book: "", author: "", page: "", url: "", creator: "", ...(recipe?.source || {}) },
    ingredients: ingredients.map((i) => ({
      key: newKey(),
      id: i.id,
      amountText: amountToText(i.amount),
      unit: i.unit || "",
      name: i.name || "",
      note: i.note || "",
      whole: i.step === 1,
      plural: i.plural || "",
      group: i.group || "",
    })),
    instructions: [...(content?.instructions || recipe?.instructions || [])],
  };
}

export function draftIngredients(draft) {
  const taken = draft.ingredients.map((r) => r.id).filter(Boolean);
  return draft.ingredients
    .filter((row) => row.name.trim())
    .map((row) => {
      let id = row.id;
      if (!id) {
        id = ingredientId(row.name, taken);
        taken.push(id);
      }
      const ing = { id, name: row.name.trim() };
      const amount = parseAmount(row.amountText);
      if (amount != null) ing.amount = amount;
      if (row.unit.trim()) ing.unit = row.unit.trim();
      if (row.whole) ing.step = 1;
      if (row.note.trim()) ing.note = row.note.trim();
      if (row.plural.trim()) ing.plural = row.plural.trim();
      if (row.group?.trim()) ing.group = row.group.trim();
      return ing;
    });
}

export function validateDraft(draft) {
  const problems = [];
  if (!draft.title.trim()) problems.push("Geef het recept een titel.");
  if (!(draft.servings >= 1)) problems.push("Aantal personen moet minstens 1 zijn.");
  const ings = draftIngredients(draft);
  if (ings.length === 0) problems.push("Voeg minstens één ingrediënt toe.");
  draft.ingredients.forEach((row) => {
    if (row.amountText.trim() && parseAmount(row.amountText) == null) {
      problems.push(`Hoeveelheid "${row.amountText}" bij ${row.name || "een ingrediënt"} is geen getal.`);
    }
  });
  const steps = draft.instructions.filter((s) => s.trim());
  if (steps.length === 0) problems.push("Voeg minstens één stap toe.");
  const missing = unknownPlaceholders(steps, ings);
  if (missing.length) problems.push(`De bereiding verwijst naar onbekende ingrediënten: ${missing.map((m) => `{${m}}`).join(", ")}.`);
  if (draft.sourceType === "book" && !draft.source.book.trim()) problems.push("Vul de titel van het kookboek in.");
  if (draft.sourceType === "social") {
    try {
      const u = new URL(draft.source.url.trim());
      if (!/^https?:$/.test(u.protocol)) throw new Error();
    } catch {
      problems.push("Vul een geldige link naar de post of website in (beginnend met https://).");
    }
  }
  return problems;
}

/* ------------------------------------------------------------
   Editor
   ------------------------------------------------------------ */

function RecipeEditor({ draft, setDraft, onSave, onCancel, saving, bookUnlocked, isNew }) {
  const [pasteIngredients, setPasteIngredients] = useState(null);
  const [pasteSteps, setPasteSteps] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const [nameOnly, setNameOnly] = useState(false);
  const [previewServings, setPreviewServings] = useState(null);
  const [problems, setProblems] = useState([]);
  const [customCategory, setCustomCategory] = useState(
    Boolean(draft.category) && !CATEGORIES.includes(draft.category)
  );
  const stepRefs = useRef({});

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const updateSource = (patch) => setDraft((d) => ({ ...d, source: { ...d.source, ...patch } }));

  const ingredients = draftIngredients(draft);

  /* ---- ingrediënten ---- */

  function updateRow(key, patch) {
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    }));
  }

  function ensureId(key) {
    setDraft((d) => {
      const taken = d.ingredients.map((r) => r.id).filter(Boolean);
      return {
        ...d,
        ingredients: d.ingredients.map((r) =>
          r.key === key && !r.id && r.name.trim() ? { ...r, id: ingredientId(r.name, taken) } : r
        ),
      };
    });
  }

  function addRows(rows) {
    setDraft((d) => {
      const taken = d.ingredients.map((r) => r.id).filter(Boolean);
      const newRows = rows.map((p) => {
        const id = p.name ? ingredientId(p.name, taken) : "";
        if (id) taken.push(id);
        return {
          key: newKey(),
          id,
          amountText: amountToText(p.amount),
          unit: p.unit || "",
          name: p.name || "",
          note: p.note || "",
          whole: false,
          plural: "",
          group: p.group || "",
        };
      });
      return { ...d, ingredients: [...d.ingredients, ...newRows] };
    });
  }

  function moveRow(index, delta) {
    setDraft((d) => {
      const list = [...d.ingredients];
      const target = index + delta;
      if (target < 0 || target >= list.length) return d;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...d, ingredients: list };
    });
  }

  function removeRow(key) {
    setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((r) => r.key !== key) }));
  }

  /* ---- bereiding ---- */

  function setStep(index, text) {
    setDraft((d) => {
      const list = [...d.instructions];
      list[index] = text;
      return { ...d, instructions: list };
    });
  }

  function moveStep(index, delta) {
    setDraft((d) => {
      const list = [...d.instructions];
      const target = index + delta;
      if (target < 0 || target >= list.length) return d;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...d, instructions: list };
    });
  }

  function removeStep(index) {
    setDraft((d) => ({ ...d, instructions: d.instructions.filter((_, i) => i !== index) }));
  }

  function insertPlaceholder(id) {
    if (activeStep == null) return;
    const el = stepRefs.current[activeStep];
    const token = nameOnly ? `{${id}:naam}` : `{${id}}`;
    const text = draft.instructions[activeStep] || "";
    const start = el ? el.selectionStart : text.length;
    const end = el ? el.selectionEnd : text.length;
    setStep(activeStep, text.slice(0, start) + token + text.slice(end));
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      }
    });
  }

  function autoLinkAll() {
    setDraft((d) => ({ ...d, instructions: d.instructions.map((s) => autoLinkStep(s, draftIngredients(d))) }));
  }

  /* ---- foto ---- */

  async function chooseImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImage(file);
      update({ newImage: resized });
    } catch (err) {
      alert(err.message);
    }
    e.target.value = "";
  }

  /* ---- opslaan ---- */

  function submit(e) {
    e.preventDefault();
    const found = validateDraft(draft);
    if (draft.sourceType === "book" && !bookUnlocked) {
      found.push("Ontgrendel eerst het kookboek-wachtwoord (bovenaan de beheerpagina).");
    }
    setProblems(found);
    if (found.length === 0) onSave();
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const ingredientsById = Object.fromEntries(ingredients.map((i) => [i.id, i]));
  const previewImage = draft.newImage?.dataUrl || imageUrl(draft.image);
  const pServings = previewServings || draft.servings;

  return (
    <form className="editor" onSubmit={submit}>
      <div className="editor-head">
        <h1>{isNew ? "Nieuw recept" : draft.title || "Recept bewerken"}</h1>
        <div className="editor-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>Annuleren</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Opslaan…" : "Opslaan"}
          </button>
        </div>
      </div>

      {problems.length > 0 && (
        <div className="notice notice-error" role="alert">
          <strong>Nog niet compleet:</strong>
          <ul>{problems.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}

      {/* ---------- Basis ---------- */}
      <fieldset className="panel">
        <legend>Algemeen</legend>
        <div className="field-grid">
          <label className="field field-wide">
            <span>Titel</span>
            <input value={draft.title} onChange={(e) => update({ title: e.target.value })} required />
          </label>
          <div className="field">
            <label htmlFor="category">Categorie</label>
            <select
              id="category"
              value={customCategory ? OTHER : draft.category}
              onChange={(e) => {
                if (e.target.value === OTHER) {
                  setCustomCategory(true);
                  update({ category: "" });
                } else {
                  setCustomCategory(false);
                  update({ category: e.target.value });
                }
              }}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value={OTHER}>Anders…</option>
            </select>
            {customCategory && (
              <input
                aria-label="Eigen categorie"
                placeholder="Eigen categorie"
                value={draft.category}
                onChange={(e) => update({ category: e.target.value })}
                autoFocus
              />
            )}
          </div>
          <label className="field">
            <span>Aantal personen</span>
            <input
              type="number"
              min="1"
              value={draft.servings}
              onChange={(e) => update({ servings: Math.max(1, Number(e.target.value) || 1) })}
            />
          </label>
          <label className="field field-wide">
            <span>Korte omschrijving <small>(optioneel; verschijnt onder de titel en in Google)</small></span>
            <textarea
              rows={2}
              maxLength={300}
              value={draft.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="bv. Romige curry met kikkererwten, klaar in 30 minuten."
            />
          </label>
          <label className="field field-wide">
            <span>Tags <small>(met komma's: Vegetarisch, Oven, Snel)</small></span>
            <input value={draft.tagsText} onChange={(e) => update({ tagsText: e.target.value })} />
          </label>
        </div>

        <div className="image-field">
          {previewImage ? (
            <img src={previewImage} alt="" className="image-preview" />
          ) : (
            <div className="image-preview image-empty">Geen foto</div>
          )}
          <div>
            <label className="btn-secondary file-button">
              {previewImage ? "Andere foto kiezen" : "Foto kiezen"}
              <input type="file" accept="image/*" onChange={chooseImage} hidden />
            </label>
            {previewImage && (
              <button type="button" className="btn-link" onClick={() => update({ image: "", newImage: null })}>
                Foto verwijderen
              </button>
            )}
            <p className="hint">Wordt automatisch verkleind. Gebruik bij kookboekrecepten alleen je eigen foto.</p>
          </div>
        </div>
      </fieldset>

      {/* ---------- Bron ---------- */}
      <fieldset className="panel">
        <legend>Bron</legend>
        <div className="source-choice" role="radiogroup" aria-label="Bron van het recept">
          {[
            ["own", "Eigen recept", "Gewoon openbaar op de site."],
            ["social", "Social media of website", "Openbaar, met een link naar het origineel."],
            ["book", "Uit een kookboek", "Versleuteld; bezoekers zien het geblurd."],
          ].map(([value, label, help]) => (
            <label key={value} className={draft.sourceType === value ? "source-option active" : "source-option"}>
              <input
                type="radio"
                name="sourceType"
                value={value}
                checked={draft.sourceType === value}
                onChange={() => update({ sourceType: value })}
              />
              <strong>{label}</strong>
              <small>{help}</small>
            </label>
          ))}
        </div>

        {draft.sourceType === "social" && (
          <>
            <div className="field-grid">
              <label className="field field-wide">
                <span>Link naar de post of pagina</span>
                <input
                  type="url"
                  placeholder="https://www.instagram.com/p/…"
                  value={draft.source.url}
                  onChange={(e) => updateSource({ url: e.target.value })}
                />
              </label>
              <label className="field field-wide">
                <span>Van wie <small>(optioneel, bv. @accountnaam of naam van de blog)</small></span>
                <input value={draft.source.creator} onChange={(e) => updateSource({ creator: e.target.value })} />
              </label>
            </div>
            {draft.source.url && platformName(draft.source.url) && (
              <p className="hint">Wordt getoond als: bron op {platformName(draft.source.url)}.</p>
            )}
          </>
        )}

        {draft.sourceType === "book" && (
          <>
            {!bookUnlocked && (
              <p className="notice notice-warn">
                Ontgrendel eerst het kookboek-wachtwoord bovenaan de beheerpagina, anders kan het recept
                niet versleuteld worden.
              </p>
            )}
            <div className="field-grid">
              <label className="field field-wide">
                <span>Titel van het kookboek</span>
                <input value={draft.source.book} onChange={(e) => updateSource({ book: e.target.value })} />
              </label>
              <label className="field">
                <span>Auteur</span>
                <input value={draft.source.author} onChange={(e) => updateSource({ author: e.target.value })} />
              </label>
              <label className="field">
                <span>Pagina</span>
                <input value={draft.source.page} onChange={(e) => updateSource({ page: e.target.value })} />
              </label>
              <label className="field field-wide">
                <span>Link naar het boek <small>(optioneel, bv. de uitgever)</small></span>
                <input type="url" value={draft.source.url} onChange={(e) => updateSource({ url: e.target.value })} />
              </label>
            </div>
            <p className="hint">
              Openbaar zichtbaar: titel, categorie, tags, foto, omschrijving en de bronvermelding. De
              ingrediënten en bereiding worden met je wachtwoord versleuteld voordat ze worden opgeslagen.
            </p>
          </>
        )}
      </fieldset>

      {/* ---------- Ingrediënten ---------- */}
      <fieldset className="panel">
        <legend>Ingrediënten <small>voor {draft.servings} personen</small></legend>
        <p className="hint">
          Schrijf de naam in het <strong>enkelvoud</strong> (ui, tomaat). Het meervoud gaat vanzelf; controleer
          het in de kolom rechts.
        </p>

        <div className="ing-table">
          <div className="ing-row ing-row-head" aria-hidden="true">
            <span>Hoeveelheid</span><span>Eenheid</span><span>Naam (enkelvoud)</span><span>Toelichting</span><span>Voorbeeld ×1 / ×2</span><span />
          </div>
          {draft.ingredients.map((row, index) => {
            const ing = ingredients.find((i) => i.id === row.id) || draftIngredients({ ingredients: [row] })[0];
            return (
              <div className="ing-row" key={row.key}>
                <input
                  aria-label="Hoeveelheid"
                  placeholder="bv. 1,5"
                  value={row.amountText}
                  onChange={(e) => updateRow(row.key, { amountText: e.target.value })}
                  className={row.amountText && parseAmount(row.amountText) == null ? "invalid" : ""}
                />
                <input
                  aria-label="Eenheid"
                  list="units"
                  placeholder="—"
                  value={row.unit}
                  onChange={(e) => updateRow(row.key, { unit: e.target.value })}
                />
                <input
                  aria-label="Naam"
                  placeholder="bv. rode ui"
                  value={row.name}
                  onChange={(e) => updateRow(row.key, { name: e.target.value })}
                  onBlur={() => ensureId(row.key)}
                />
                <input
                  aria-label="Toelichting"
                  placeholder="bv. fijngesneden"
                  value={row.note}
                  onChange={(e) => updateRow(row.key, { note: e.target.value })}
                />
                <span className="ing-preview">
                  {row.group && <span className="ing-group-tag">{row.group}</span>}
                  {ing ? (
                    <>
                      {formatIngredient(ing, 1)}
                      <br />
                      <span>{formatIngredient(ing, 2)}</span>
                    </>
                  ) : "—"}
                  <details className="ing-more">
                    <summary>meer</summary>
                    <label className="checkbox">
                      <input type="checkbox" checked={row.whole} onChange={(e) => updateRow(row.key, { whole: e.target.checked })} />
                      Alleen hele stuks
                    </label>
                    <label className="field">
                      <span>Groep (bv. Dressing)</span>
                      <input value={row.group} onChange={(e) => updateRow(row.key, { group: e.target.value })} placeholder="geen" />
                    </label>
                    <label className="field">
                      <span>Eigen meervoud</span>
                      <input value={row.plural} onChange={(e) => updateRow(row.key, { plural: e.target.value })} placeholder="automatisch" />
                    </label>
                    {row.id && <code className="ing-id">{`{${row.id}}`}</code>}
                  </details>
                </span>
                <span className="row-tools">
                  <button type="button" onClick={() => moveRow(index, -1)} aria-label="Omhoog">↑</button>
                  <button type="button" onClick={() => moveRow(index, 1)} aria-label="Omlaag">↓</button>
                  <button type="button" onClick={() => removeRow(row.key)} aria-label="Verwijderen">×</button>
                </span>
              </div>
            );
          })}
          <datalist id="units">{UNIT_SUGGESTIONS.map((u) => <option key={u} value={u} />)}</datalist>
        </div>

        <div className="panel-actions">
          <button type="button" className="btn-secondary" onClick={() => addRows([{}])}>+ Ingrediënt</button>
          <button type="button" className="btn-secondary" onClick={() => setPasteIngredients(pasteIngredients == null ? "" : null)}>
            Lijst plakken
          </button>
        </div>

        {pasteIngredients != null && (
          <div className="paste-box">
            <label className="field">
              <span>Eén ingrediënt per regel, bijvoorbeeld uit een kookboek</span>
              <textarea
                rows={6}
                value={pasteIngredients}
                placeholder={"200 gr bloem\n3 uien, gesnipperd\n2 teentjes knoflook\nzout en peper\nVoor de dressing:\n2 el olijfolie"}
                onChange={(e) => setPasteIngredients(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                addRows(parseIngredientList(pasteIngredients));
                setPasteIngredients(null);
              }}
            >
              Omzetten en toevoegen
            </button>
          </div>
        )}
      </fieldset>

      {/* ---------- Bereiding ---------- */}
      <fieldset className="panel">
        <legend>Bereiding</legend>
        <p className="hint">
          Klik in een stap en daarna op een ingrediënt om het in te voegen. <code>{"{ui}"}</code> toont de
          hoeveelheid die meerekent ("2 uien"), <code>{"{ui:naam}"}</code> alleen de naam ("uien").
        </p>

        <div className="chip-bar">
          <label className="checkbox">
            <input type="checkbox" checked={nameOnly} onChange={(e) => setNameOnly(e.target.checked)} />
            Alleen naam
          </label>
          {ingredients.map((i) => (
            <button
              type="button"
              key={i.id}
              className="chip"
              disabled={activeStep == null}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertPlaceholder(i.id)}
            >
              {i.name}
            </button>
          ))}
        </div>

        <ol className="step-editor">
          {draft.instructions.map((step, index) => (
            <li key={index}>
              <span className="step-number">{index + 1}</span>
              <div className="step-fields">
                <textarea
                  ref={(el) => (stepRefs.current[index] = el)}
                  rows={2}
                  value={step}
                  onFocus={() => setActiveStep(index)}
                  onChange={(e) => setStep(index, e.target.value)}
                />
                {/{/.test(step) && (
                  <p className="step-preview">{renderInstruction(step, ingredientsById, 1)}</p>
                )}
              </div>
              <span className="row-tools">
                <button type="button" onClick={() => moveStep(index, -1)} aria-label="Omhoog">↑</button>
                <button type="button" onClick={() => moveStep(index, 1)} aria-label="Omlaag">↓</button>
                <button type="button" onClick={() => removeStep(index)} aria-label="Verwijderen">×</button>
              </span>
            </li>
          ))}
        </ol>

        <div className="panel-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              update({ instructions: [...draft.instructions, ""] });
              setActiveStep(draft.instructions.length);
            }}
          >
            + Stap
          </button>
          <button type="button" className="btn-secondary" onClick={() => setPasteSteps(pasteSteps == null ? "" : null)}>
            Tekst plakken
          </button>
          <button type="button" className="btn-secondary" onClick={autoLinkAll} title="Zoekt ingrediënten in de tekst en koppelt ze">
            Ingrediënten automatisch koppelen
          </button>
        </div>

        {pasteSteps != null && (
          <div className="paste-box">
            <label className="field">
              <span>Eén stap per regel (nummers worden weggehaald)</span>
              <textarea rows={6} value={pasteSteps} onChange={(e) => setPasteSteps(e.target.value)} />
            </label>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                const steps = parseSteps(pasteSteps).map((s) => autoLinkStep(s, ingredients));
                update({ instructions: [...draft.instructions.filter((s) => s.trim()), ...steps] });
                setPasteSteps(null);
              }}
            >
              Toevoegen en koppelen
            </button>
          </div>
        )}
      </fieldset>

      {/* ---------- Voorbeeld ---------- */}
      <fieldset className="panel preview-panel">
        <legend>Voorbeeld</legend>
        <ServingsSelector servings={pServings} setServings={setPreviewServings} />
        <RecipeContent
          ingredients={ingredients}
          instructions={draft.instructions.filter((s) => s.trim())}
          servings={pServings}
          factor={pServings / draft.servings}
        />
      </fieldset>

      <div className="editor-foot">
        <button type="button" className="btn-secondary" onClick={onCancel}>Annuleren</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Opslaan…" : "Opslaan"}
        </button>
      </div>
    </form>
  );
}

export default RecipeEditor;

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GitHubClient } from "../utils/github";
import { GITHUB, imageUrl } from "../config";
import { checkPassword, decryptJSON, encryptJSON, LOCK_CHECK } from "../utils/crypto";
import { getPassword, setPassword as storePassword } from "../utils/passwordStore";
import { slugify } from "../utils/recipeTools";
import RecipeEditor, { draftIngredients, recipeToDraft } from "../components/admin/RecipeEditor";
import useSeo from "../hooks/useSeo";
import { recipePath } from "../utils/seo";

const TOKEN_KEY = "kmj-gh-token";

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

/* ============================================================
   Inloggen met een GitHub-token
   ============================================================ */

function TokenSetup({ onToken, error }) {
  const [value, setValue] = useState("");
  const newTokenUrl = "https://github.com/settings/personal-access-tokens/new";

  return (
    <div className="admin-narrow">
      <h1>Beheer</h1>
      <p className="lead">
        Hier voeg je recepten toe en pas je ze aan. Opslaan gebeurt direct in je GitHub-repo; de site
        wordt daarna automatisch opnieuw gepubliceerd.
      </p>

      <div className="panel">
        <h2>Eenmalig koppelen met GitHub</h2>
        <ol className="setup-steps">
          <li>
            Open{" "}
            <a href={newTokenUrl} target="_blank" rel="noopener noreferrer">
              een nieuwe fine-grained token
            </a>{" "}
            op GitHub.
          </li>
          <li>Naam: <em>Koken met Jasper beheer</em>. Kies een vervaldatum (bijvoorbeeld 1 jaar).</li>
          <li>
            <strong>Repository access:</strong> <em>Only select repositories</em> → <code>{GITHUB.owner}/{GITHUB.repo}</code>.
          </li>
          <li>
            <strong>Permissions:</strong> <em>Contents</em> → <em>Read and write</em>. Optioneel:{" "}
            <em>Actions</em> → <em>Read-only</em> (om de publicatiestatus te zien).
          </li>
          <li>Klik op <em>Generate token</em> en plak hem hieronder.</li>
        </ol>
        <form
          className="unlock-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) onToken(value.trim());
          }}
        >
          <input
            type="password"
            placeholder="github_pat_…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="GitHub-token"
          />
          <button type="submit" className="btn-primary">Koppelen</button>
        </form>
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="hint">
          De token wordt alleen in deze browser bewaard. Gebruik dit dus alleen op je eigen apparaat.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Kookboek-wachtwoord
   ============================================================ */

function BookPasswordPanel({ lock, password, onUnlocked, onCreate }) {
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (password) {
    return (
      <div className="panel panel-compact panel-ok">
        <span>🔓 Kookboek-wachtwoord is ontgrendeld. Boekrecepten worden versleuteld opgeslagen.</span>
      </div>
    );
  }

  const isNew = !lock?.data;

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (isNew) {
      if (value.length < 8) return setError("Kies minstens 8 tekens.");
      if (value !== confirm) return setError("De wachtwoorden zijn niet gelijk.");
      setBusy(true);
      try {
        await onCreate(value);
      } catch (err) {
        setError(err.message);
      }
      setBusy(false);
    } else {
      setBusy(true);
      const ok = await checkPassword(lock, value);
      setBusy(false);
      if (ok) onUnlocked(value);
      else setError("Dat wachtwoord klopt niet.");
    }
  }

  return (
    <form className="panel panel-compact" onSubmit={submit}>
      <h2>{isNew ? "Kookboek-wachtwoord instellen" : "Kookboek-wachtwoord"}</h2>
      <p className="hint">
        {isNew
          ? "Recepten uit kookboeken worden hiermee versleuteld. Kies er een die je onthoudt: zonder dit wachtwoord zijn die recepten niet meer te lezen, ook niet voor jou."
          : "Nodig om boekrecepten toe te voegen of te bewerken."}
      </p>
      <div className="unlock-row">
        <input
          type="password"
          placeholder={isNew ? "Nieuw wachtwoord" : "Wachtwoord"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete={isNew ? "new-password" : "current-password"}
        />
        {isNew && (
          <input
            type="password"
            placeholder="Nogmaals"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        )}
        <button type="submit" className="btn-primary" disabled={busy || !value}>
          {busy ? "Bezig…" : isNew ? "Instellen" : "Ontgrendel"}
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}

/* ============================================================
   Publicatiestatus
   ============================================================ */

function DeployStatus({ client, trigger }) {
  const [run, setRun] = useState(undefined);

  useEffect(() => {
    let timer;
    let stopped = false;
    let tries = 0;
    async function poll() {
      try {
        const latest = await client.latestDeploy();
        if (stopped) return;
        setRun(latest);
        tries++;
        const busy = latest && latest.status !== "completed";
        // Na opslaan even blijven kijken tot de nieuwe run klaar is
        if ((busy || (trigger && tries < 4)) && tries < 60) timer = setTimeout(poll, 8000);
      } catch {
        if (!stopped) setRun(null);
      }
    }
    poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [client, trigger]);

  if (run === undefined || run === null) return null;
  const when = new Date(run.updated_at).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" });
  let label = "Site is bijgewerkt";
  let cls = "status-ok";
  if (run.status !== "completed") {
    label = "Site wordt bijgewerkt…";
    cls = "status-busy";
  } else if (run.conclusion !== "success") {
    label = "Publiceren is mislukt";
    cls = "status-error";
  }
  return (
    <a className={`deploy-status ${cls}`} href={run.html_url} target="_blank" rel="noopener noreferrer">
      <span className="dot" /> {label} <small>({when})</small>
    </a>
  );
}

/* ============================================================
   Beheerpagina
   ============================================================ */

function Admin() {
  const [token, setToken] = useState(readToken);
  const [tokenError, setTokenError] = useState("");
  const client = useMemo(() => (token ? new GitHubClient(token) : null), [token]);

  const [recipes, setRecipes] = useState(null); // [{ data, sha, path }]
  const [lock, setLock] = useState(null);
  const [bookPassword, setBookPassword] = useState("");
  const [loadError, setLoadError] = useState("");

  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(null); // { sha, path, isNew, original }
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deployTrigger, setDeployTrigger] = useState(0);

  useSeo({ title: "Beheer | Koken met Jasper", noindex: true });

  const load = useCallback(async () => {
    if (!client) return;
    setLoadError("");
    try {
      await client.verify();
      const files = (await client.listDir(GITHUB.recipesDir)).filter((f) => f.name.endsWith(".json"));
      const loaded = await Promise.all(
        files.map(async (f) => {
          const file = await client.readJSON(f.path);
          return { data: file.data, sha: file.sha, path: f.path };
        })
      );
      loaded.sort((a, b) => a.data.title.localeCompare(b.data.title, "nl"));
      setRecipes(loaded);
      const lockFile = await client.readJSON(GITHUB.lockFile);
      setLock(lockFile?.data || {});
    } catch (err) {
      setLoadError(err.message);
      if (/token/i.test(err.message)) {
        setTokenError(err.message);
        setToken("");
      }
    }
  }, [client]);

  useEffect(() => {
    load();
  }, [load]);

  // Onthouden wachtwoord (van de receptpagina of eerder) automatisch proberen
  useEffect(() => {
    if (!lock?.data || bookPassword) return;
    const saved = getPassword();
    if (saved) checkPassword(lock, saved).then((ok) => ok && setBookPassword(saved));
  }, [lock, bookPassword]);

  function connect(value) {
    try {
      localStorage.setItem(TOKEN_KEY, value);
    } catch {}
    setTokenError("");
    setToken(value);
  }

  function disconnect() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
    setToken("");
    setRecipes(null);
  }

  async function createLock(password) {
    const payload = await encryptJSON(LOCK_CHECK, password);
    await client.writeJSON(GITHUB.lockFile, payload, "Kookboek-wachtwoord ingesteld");
    setLock(payload);
    setBookPassword(password);
    storePassword(password, false);
  }

  /* ---- bewerken ---- */

  function startNew() {
    setDraft(recipeToDraft(null));
    setEditing({ isNew: true });
    setMessage("");
    window.scrollTo(0, 0);
  }

  async function startEdit(entry) {
    setMessage("");
    let content = null;
    if (entry.data.locked) {
      if (!bookPassword) {
        setMessage("Ontgrendel eerst het kookboek-wachtwoord om dit recept te bewerken.");
        window.scrollTo(0, 0);
        return;
      }
      try {
        content = await decryptJSON(entry.data.locked, bookPassword);
      } catch {
        setMessage("Dit recept is met een ander wachtwoord versleuteld.");
        return;
      }
    }
    setDraft(recipeToDraft(entry.data, content));
    setEditing({ isNew: false, sha: entry.sha, path: entry.path, original: entry.data });
    window.scrollTo(0, 0);
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const taken = (recipes || []).map((r) => r.data.id);
      let id = draft.id;
      if (editing.isNew) {
        const base = slugify(draft.title) || "recept";
        id = base;
        let n = 2;
        while (taken.includes(id)) id = `${base}-${n++}`;
      }

      // Foto eerst
      let image = draft.image;
      if (draft.newImage) {
        const fileName = `${id}-${Date.now().toString(36)}.jpg`;
        await client.writeFile(`${GITHUB.imagesDir}/${fileName}`, { base64: draft.newImage.base64 }, `Foto voor ${draft.title}`);
        image = `images/recipes/${fileName}`;
      }
      const oldImage = editing.original?.image;
      if (oldImage && oldImage !== image && oldImage.startsWith("images/recipes/")) {
        await client.deleteFile(`public/${oldImage}`, `Oude foto van ${draft.title} verwijderd`).catch(() => {});
      }

      const ingredients = draftIngredients(draft);
      const instructions = draft.instructions.map((s) => s.trim()).filter(Boolean);
      const recipe = {
        id,
        title: draft.title.trim(),
        category: draft.category.trim(),
        tags: draft.tagsText.split(",").map((t) => t.trim()).filter(Boolean),
        servings: draft.servings,
        image,
      };

      if (draft.description.trim()) recipe.description = draft.description.trim();

      const pick = (keys) =>
        Object.fromEntries(keys.map((k) => [k, String(draft.source[k] || "").trim()]).filter(([, v]) => v));

      if (draft.sourceType === "book") {
        recipe.source = { type: "book", ...pick(["book", "author", "page", "url"]) };
        recipe.locked = await encryptJSON({ ingredients, instructions }, bookPassword);
      } else {
        if (draft.sourceType === "social") {
          recipe.source = { type: "social", ...pick(["url", "creator"]) };
          if (draft.gate) recipe.gate = true;
        }
        recipe.ingredients = ingredients;
        recipe.instructions = instructions;
      }

      const path = `${GITHUB.recipesDir}/${id}.json`;
      await client.writeJSON(
        path,
        recipe,
        `${editing.isNew ? "Recept toegevoegd" : "Recept bijgewerkt"}: ${recipe.title}`,
        editing.isNew ? undefined : editing.sha
      );

      setDraft(null);
      setEditing(null);
      setMessage(`"${recipe.title}" is opgeslagen. Over een paar minuten staat het op de site.`);
      setDeployTrigger((n) => n + 1);
      await load();
    } catch (err) {
      setMessage(`Opslaan mislukt: ${err.message}`);
    }
    setSaving(false);
    window.scrollTo(0, 0);
  }

  async function remove(entry) {
    if (!window.confirm(`"${entry.data.title}" definitief verwijderen?`)) return;
    try {
      await client.deleteFile(entry.path, `Recept verwijderd: ${entry.data.title}`);
      if (entry.data.image?.startsWith("images/recipes/")) {
        await client.deleteFile(`public/${entry.data.image}`, `Foto van ${entry.data.title} verwijderd`).catch(() => {});
      }
      setMessage(`"${entry.data.title}" is verwijderd.`);
      setDeployTrigger((n) => n + 1);
      await load();
    } catch (err) {
      setMessage(`Verwijderen mislukt: ${err.message}`);
    }
  }

  /* ---- weergave ---- */

  if (!client) {
    return (
      <main className="admin">
        <TokenSetup onToken={connect} error={tokenError} />
      </main>
    );
  }

  const isError = /mislukt|klopt niet|ander wachtwoord|eerst/i.test(message);

  return (
    <main className="admin">
      {message && (
        <div className={`notice ${isError ? "notice-error" : "notice-ok"}`} role="status">
          {message}
        </div>
      )}

      {draft ? (
        <>
          {draft.sourceType === "book" && (
            <BookPasswordPanel lock={lock} password={bookPassword} onUnlocked={setBookPassword} onCreate={createLock} />
          )}
          <RecipeEditor
            draft={draft}
            setDraft={setDraft}
            onSave={save}
            onCancel={() => {
              setDraft(null);
              setEditing(null);
            }}
            saving={saving}
            bookUnlocked={Boolean(bookPassword)}
            isNew={editing?.isNew}
          />
        </>
      ) : (
        <>
          <div className="admin-head">
            <div>
              <h1>Beheer</h1>
              <DeployStatus client={client} trigger={deployTrigger} />
            </div>
            <div className="editor-actions">
              <button type="button" className="btn-link" onClick={disconnect}>Ontkoppel GitHub</button>
              <button type="button" className="btn-primary" onClick={startNew}>+ Nieuw recept</button>
            </div>
          </div>

          {lock && (
            <BookPasswordPanel lock={lock} password={bookPassword} onUnlocked={setBookPassword} onCreate={createLock} />
          )}

          {loadError && <div className="notice notice-error">{loadError}</div>}
          {!recipes && !loadError && <p className="hint">Recepten laden…</p>}

          {recipes && (
            <ul className="admin-list">
              {recipes.map((entry) => (
                <li key={entry.path}>
                  {entry.data.image ? (
                    <img src={imageUrl(entry.data.image)} alt="" />
                  ) : (
                    <span className="admin-thumb" />
                  )}
                  <div className="admin-list-text">
                    <strong>{entry.data.title}</strong>
                    <small>
                      {[entry.data.category, entry.data.locked && `🔒 ${entry.data.source?.book || "kookboek"}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </div>
                  <div className="admin-list-actions">
                    <Link to={recipePath(entry.data.id)} className="btn-link">Bekijk</Link>
                    <button type="button" className="btn-secondary" onClick={() => startEdit(entry)}>Bewerk</button>
                    <button type="button" className="btn-link danger" onClick={() => remove(entry)}>Verwijder</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

export default Admin;

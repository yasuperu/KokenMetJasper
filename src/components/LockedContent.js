import { useState } from "react";
import { Leaf, Whisk } from "./Doodles";

// Neptekst: de echte inhoud staat versleuteld en is hier niet aanwezig.
const FAKE_INGREDIENTS = [[3, 14], [4, 9], [2, 17], [5, 11], [3, 8], [4, 15], [2, 12], [3, 10]];
const FAKE_STEPS = [62, 88, 45, 97, 70, 54];

const bar = (width) => "▬".repeat(Math.max(2, Math.round(width / 4)));

function LockedContent({ source, onUnlock, error, busy }) {
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  function submit(e) {
    e.preventDefault();
    if (password) onUnlock(password, remember);
  }

  return (
    <div className="locked">
      <div className="recipe-body locked-blur" aria-hidden="true">
        <section className="ingredients">
          <h2>
            <Leaf className="h2-icon" /> Ingrediënten
          </h2>
          <ul>
            {FAKE_INGREDIENTS.map(([q, n], i) => (
              <li key={i}>
                <span className="qty">{bar(q * 4)}</span>
                <span className="ing-name">{bar(n * 4)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="steps">
          <h2>
            <Whisk className="h2-icon" /> Bereiding
          </h2>
          <ol>
            {FAKE_STEPS.map((w, i) => (
              <li key={i}>
                <span className="step-number">{i + 1}</span>
                <p>{bar(w * 3)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <form className="unlock-card" onSubmit={submit}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="lock-icon">
          <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill="var(--mustard)" stroke="var(--ink)" strokeWidth="1.8" />
          <path d="M8 10.5V8a4 4 0 018 0v2.5" fill="none" stroke="var(--ink)" strokeWidth="1.8" />
        </svg>
        <h2>Recept uit een kookboek</h2>
        <p>
          Dit recept komt uit {source?.book ? <cite>{source.book}</cite> : "een kookboek"}
          {source?.author ? ` van ${source.author}` : ""}. Uit respect voor de maker staat het hier
          niet openbaar. Wil je het maken? Koop of leen het boek
          {source?.page ? ` (pagina ${source.page})` : ""}.
        </p>

        <label className="unlock-label" htmlFor="unlock-password">Wachtwoord</label>
        <div className="unlock-row">
          <input
            id="unlock-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={busy || !password}>
            {busy ? "Bezig…" : "Ontgrendel"}
          </button>
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Onthoud op dit apparaat
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
    </div>
  );
}

export default LockedContent;

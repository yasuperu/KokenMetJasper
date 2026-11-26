import { useState } from "react";
import { Whisk } from "./Doodles";

const FAKE_STEPS = [70, 92, 55, 84, 63];
const bar = (width) => "▬".repeat(Math.max(2, Math.round(width / 4)));

/**
 * Bereiding van een kookboekrecept, vergrendeld met het wachtwoord.
 * De ingrediënten staan openbaar; alleen de stappen zijn versleuteld.
 */
function LockedSteps({ source, onUnlock, error, busy }) {
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  return (
    <section className="steps steps-gated">
      <h2>
        <Whisk className="h2-icon" /> Bereiding
      </h2>
      <div className="gate">
        <ol className="locked-blur" aria-hidden="true">
          {FAKE_STEPS.map((w, i) => (
            <li key={i}>
              <span className="step-number">{i + 1}</span>
              <p>{bar(w * 3)}</p>
            </li>
          ))}
        </ol>

        <form
          className="gate-card"
          onSubmit={(e) => {
            e.preventDefault();
            if (password) onUnlock(password, remember);
          }}
        >
          <h3>Bereiding uit {source?.book ? <cite>{source.book}</cite> : "een kookboek"}</h3>
          <p className="no-print">
            Uit respect voor de maker staat de bereiding hier niet openbaar. Koop of leen het boek
            {source?.page ? ` (pagina ${source.page})` : ""}, of ontgrendel met het wachtwoord.
          </p>
          <p className="print-only">
            De bereiding staat in {source?.book || "het kookboek"}
            {source?.page ? `, pagina ${source.page}` : ""}.
          </p>
          <div className="unlock-row gate-password no-print">
            <input
              type="password"
              aria-label="Wachtwoord"
              placeholder="Wachtwoord"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={busy || !password}>
              {busy ? "Bezig…" : "Ontgrendel"}
            </button>
          </div>
          <label className="checkbox no-print">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Onthoud op dit apparaat
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
      </div>
    </section>
  );
}

export default LockedSteps;

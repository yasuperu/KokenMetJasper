import { useState } from "react";
import { Whisk } from "./Doodles";
import { platformName } from "../utils/source";

const FAKE_STEPS = [70, 92, 55, 84, 63];
const bar = (width) => "▬".repeat(Math.max(2, Math.round(width / 4)));

/**
 * Bereiding afgeschermd: eerst de originele post bekijken (of wachtwoord).
 */
function StepsGate({ source, onVisit, onPassword, error, busy }) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const platform = platformName(source.url) || "de website";

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

        <div className="gate-card">
          <h3>
            {source.adapted ? "Gebaseerd op een recept van" : "Dit recept komt van"} {source.creator || platform}
          </h3>
          <p className="no-print">
            Bekijk eerst de originele post, zodat de maker er ook iets aan heeft. Daarna verschijnt de
            bereiding hier vanzelf.
          </p>
          <p className="print-only">De bereiding vind je bij de originele post: {source.url}</p>
          <a
            className="btn-primary"
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onVisit}
          >
            Bekijk de post op {platform}
          </a>

          {!showPassword ? (
            <button type="button" className="btn-link gate-password-link" onClick={() => setShowPassword(true)}>
              Ontgrendelen met wachtwoord
            </button>
          ) : (
            <form
              className="unlock-row gate-password"
              onSubmit={(e) => {
                e.preventDefault();
                if (password) onPassword(password);
              }}
            >
              <input
                type="password"
                aria-label="Wachtwoord"
                placeholder="Wachtwoord"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" className="btn-secondary" disabled={busy || !password}>
                {busy ? "Bezig…" : "Ontgrendel"}
              </button>
            </form>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
      </div>
    </section>
  );
}

export default StepsGate;

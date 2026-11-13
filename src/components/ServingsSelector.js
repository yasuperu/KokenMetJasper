function ServingsSelector({ servings, setServings }) {
  return (
    <div className="servings" role="group" aria-label="Aantal personen">
      <button
        type="button"
        onClick={() => setServings(Math.max(1, servings - 1))}
        disabled={servings <= 1}
        aria-label="Eén persoon minder"
      >
        −
      </button>
      <span className="servings-count" aria-live="polite">
        <strong>{servings}</strong> {servings === 1 ? "persoon" : "personen"}
      </span>
      <button
        type="button"
        onClick={() => setServings(servings + 1)}
        aria-label="Eén persoon meer"
      >
        +
      </button>
    </div>
  );
}

export default ServingsSelector;

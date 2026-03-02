function ServingsSelector({ servings, setServings }) {
  return (
    <div className="servings">
      <button 
        onClick={() => setServings(servings > 1 ? servings - 1 : 1)}
      >
        -
      </button>
      <span>{servings} {servings === 1 ? "persoon" : "personen"}</span>
      <button onClick={() => setServings(servings + 1)}>+</button>
    </div>
  );
}

export default ServingsSelector;
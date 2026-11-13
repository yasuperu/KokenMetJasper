function SearchBar({ search, setSearch }) {
  return (
    <label className="search">
      <span className="visually-hidden">Zoek een recept</span>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="search-icon">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        placeholder="Zoek op recept of ingrediënt…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />
    </label>
  );
}

export default SearchBar;

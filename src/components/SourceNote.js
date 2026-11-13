function SourceNote({ source }) {
  if (!source || !source.book) return null;
  const details = [source.author, source.page && `p. ${source.page}`].filter(Boolean).join(", ");
  return (
    <p className="source-note">
      <span className="source-label">Uit het kookboek</span>{" "}
      {source.url ? (
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          <cite>{source.book}</cite>
        </a>
      ) : (
        <cite>{source.book}</cite>
      )}
      {details && <> — {details}</>}
    </p>
  );
}

export default SourceNote;

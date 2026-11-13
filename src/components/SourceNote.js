import { platformName, sourceType } from "../utils/source";

function SourceNote({ source }) {
  const type = sourceType(source);

  if (type === "book" && source.book) {
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

  if (type === "social" && source.url) {
    const platform = platformName(source.url);
    return (
      <p className="source-note">
        <span className="source-label">Bron</span>{" "}
        <a href={source.url} target="_blank" rel="noopener noreferrer nofollow">
          {source.creator ? <cite>{source.creator}</cite> : "Bekijk het origineel"}
        </a>
        {platform && <> op {platform}</>}
      </p>
    );
  }

  return null;
}

export default SourceNote;

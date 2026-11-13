import { useEffect } from "react";
import { absoluteImage, absoluteUrl, site } from "../utils/seo";

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (content == null) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!href) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Titel en meta-tags per pagina bijwerken bij navigeren in de app.
 * (De eerste keer laden krijgt dezelfde tags al uit de vooraf gebouwde HTML.)
 */
export default function useSeo({ title, description, path, image, noindex }) {
  useEffect(() => {
    const fullTitle = title || `${site.name} – favoriete recepten van thuis`;
    const desc = description || site.description;
    document.title = fullTitle;
    setMeta("name", "description", desc);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : null);
    setCanonical(noindex || !path ? null : absoluteUrl(path));
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", path ? absoluteUrl(path) : null);
    setMeta("property", "og:image", absoluteImage(image));
  }, [title, description, path, image, noindex]);
}

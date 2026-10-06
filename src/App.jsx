import { useEffect, useMemo, useState } from "react";
import { addLink, deleteLink, listLinks } from "./api.js";

const favicon = (host) => `https://www.google.com/s2/favicons?domain=${host}&sz=64`;

export default function App() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [tagText, setTagText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState(null);

  useEffect(() => {
    listLinks()
      .then(setLinks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const tagCounts = useMemo(() => {
    const counts = {};
    links.forEach((l) => l.tags.forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [links]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return links.filter((l) => {
      if (activeTag && !l.tags.includes(activeTag)) return false;
      if (!q) return true;
      return [l.title, l.host, l.url, ...l.tags].some((s) => s.toLowerCase().includes(q));
    });
  }, [links, query, activeTag]);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const tags = tagText.split(",").map((t) => t.trim()).filter(Boolean);
      const link = await addLink(url, tags);
      setLinks((prev) => [link, ...prev]);
      setUrl("");
      setTagText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const previous = links;
    setLinks((prev) => prev.filter((l) => l.id !== id));
    try {
      await deleteLink(id);
    } catch (err) {
      setLinks(previous);
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <header className="masthead">
        <h1>Linkshelf</h1>
        <p>Save a link. We fetch the title and icon. Find it again by tag or search.</p>
      </header>

      <form className="saver" onSubmit={handleSave}>
        <label className="field grow">
          <span>Link</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            inputMode="url"
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>Tags (comma separated)</span>
          <input
            value={tagText}
            onChange={(e) => setTagText(e.target.value)}
            placeholder="react, reading"
            autoComplete="off"
          />
        </label>
        <button type="submit" disabled={saving || !url.trim()}>
          {saving ? "Saving…" : "Save link"}
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="layout">
        <aside className="filters" aria-label="Filter by tag">
          <input
            type="search"
            className="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved links"
            aria-label="Search saved links"
          />
          <ul className="taglist">
            <li>
              <button
                className={`tagbtn ${activeTag === null ? "on" : ""}`}
                onClick={() => setActiveTag(null)}
              >
                All <small>{links.length}</small>
              </button>
            </li>
            {tagCounts.map(([tag, n]) => (
              <li key={tag}>
                <button
                  className={`tagbtn ${activeTag === tag ? "on" : ""}`}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  {tag} <small>{n}</small>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main>
          {loading ? (
            <p className="empty">Loading your links…</p>
          ) : links.length === 0 ? (
            <p className="empty">Nothing saved yet. Paste a link above to start your shelf.</p>
          ) : visible.length === 0 ? (
            <p className="empty">No links match. Clear the search or pick another tag.</p>
          ) : (
            <ul className="links">
              {visible.map((l) => (
                <li key={l.id} className="link">
                  <img src={favicon(l.host)} alt="" width="28" height="28" loading="lazy" />
                  <div className="meta">
                    <a href={l.url} target="_blank" rel="noopener noreferrer">
                      {l.title}
                    </a>
                    <span className="host">{l.host}</span>
                    {l.tags.length > 0 && (
                      <span className="chips">
                        {l.tags.map((t) => (
                          <button key={t} className="chip" onClick={() => setActiveTag(t)}>
                            {t}
                          </button>
                        ))}
                      </span>
                    )}
                  </div>
                  <button
                    className="del"
                    onClick={() => handleDelete(l.id)}
                    aria-label={`Delete ${l.title}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}

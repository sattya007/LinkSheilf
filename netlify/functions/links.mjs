import { getStore } from "@netlify/blobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

const readAll = async (store) => (await store.get("all", { type: "json" })) ?? [];

// Refuse obvious local/private targets so the function can't be used to probe internal hosts.
const isPrivateHost = (host) =>
  host === "localhost" ||
  host.endsWith(".local") ||
  /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) ||
  host === "[::1]";

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

async function fetchTitle(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; LinkshelfBot/1.0)" },
    });
    const html = (await res.text()).slice(0, 200_000);
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return match ? decode(match[1]) : "";
  } catch {
    return "";
  }
}

export default async (req, context) => {
  const store = getStore("bookmarks");

  if (req.method === "GET") {
    return json(await readAll(store));
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Send a JSON body with a url." }, 400);
    }

    let raw = String(body.url ?? "").trim();
    if (!raw) return json({ error: "Enter a URL to save." }, 400);
    if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

    let parsed;
    try {
      parsed = new URL(raw);
    } catch {
      return json({ error: "That doesn't look like a valid URL." }, 400);
    }
    if (isPrivateHost(parsed.hostname)) {
      return json({ error: "Local and private addresses can't be saved." }, 400);
    }

    const links = await readAll(store);
    if (links.some((l) => l.url === parsed.href)) {
      return json({ error: "You've already saved this link." }, 409);
    }

    const tags = [
      ...new Set(
        (Array.isArray(body.tags) ? body.tags : [])
          .map((t) => String(t).trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 8)
      ),
    ];

    const title = (await fetchTitle(parsed.href)) || parsed.hostname;
    const link = {
      id: crypto.randomUUID(),
      url: parsed.href,
      title,
      host: parsed.hostname.replace(/^www\./, ""),
      tags,
      createdAt: new Date().toISOString(),
    };

    await store.setJSON("all", [link, ...links]);
    return json(link, 201);
  }

  if (req.method === "DELETE") {
    const { id } = context.params;
    const links = await readAll(store);
    const next = links.filter((l) => l.id !== id);
    if (next.length === links.length) return json({ error: "Link not found." }, 404);
    await store.setJSON("all", next);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed." }, 405);
};

export const config = { path: ["/api/links", "/api/links/:id"] };

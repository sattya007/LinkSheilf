async function request(path, options) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
  return data;
}

export const listLinks = () => request("/api/links");

export const addLink = (url, tags) =>
  request("/api/links", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, tags }),
  });

export const deleteLink = (id) => request(`/api/links/${id}`, { method: "DELETE" });

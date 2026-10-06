# Linkshelf

A small bookmark manager. React (Vite) frontend, Netlify Function API, Netlify Blobs storage.
Saving a link fetches its page title on the server; the favicon comes from Google's favicon service.

## Run locally

```bash
npm install
npm run dev        # netlify dev: Vite + functions + Blobs on http://localhost:8888
```

Use `npm run dev`, not `npm run dev:ui`, or the `/api/links` routes won't exist.

## Deploy

**Git:** push this folder to GitHub, then in Netlify choose *Add new site → Import an existing project*.
The build settings come from `netlify.toml` (build `npm run build`, publish `dist`).

**CLI:**
```bash
npx netlify login
npx netlify deploy --build --prod
```

## API

| Method | Path | Body | Result |
|--------|------|------|--------|
| GET | `/api/links` | – | all links |
| POST | `/api/links` | `{ "url": "...", "tags": ["a"] }` | the new link |
| DELETE | `/api/links/:id` | – | `{ "ok": true }` |

## Notes

- All links live in one Blob key, so this is meant for a single user. Concurrent writes are last-write-wins.
- There is no login: anyone with your site URL can add and delete links. Add Netlify Identity or a password check in the function before sharing it publicly.

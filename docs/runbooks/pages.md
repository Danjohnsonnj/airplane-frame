# GitHub Pages (front end)

The Phase 3 UI is static files at the **repo root**: `index.html`, `css/`, `js/`.

## Enable Pages

1. Push `master` with the root site files.
2. GitHub → **Settings** → **Pages**.
3. **Build and deployment** → Source: **Deploy from a branch**.
4. Branch: `master` / folder: `/ (root)` → Save.
5. Wait for the site URL (typically `https://<user>.github.io/<repo>/` for a project site, or `https://<user>.github.io/` for a user site).

HTTPS only. The Worker already allows browser CORS (`Access-Control-Allow-Origin: *`).

## Local preview

```bash
# repo root
python3 -m http.server 8080
# http://127.0.0.1:8080/
```

Or: `npx --yes serve -l 8080 .`

## Auth: APP_SHARED_SECRET only

The UI field **APP_SHARED_SECRET** must match the Worker’s `APP_SHARED_SECRET` (`worker/.dev.vars` / Wrangler).

| Paste this | Do not paste this |
|------------|-------------------|
| `APP_SHARED_SECRET` | `AIRLABS_API_KEY` (Worker-only; causes **401**) |

Full table: [secrets.md](./secrets.md).

1. Open the Pages (or local) URL.
2. Paste `APP_SHARED_SECRET` into the labeled field.
3. **Save settings**, then **Refresh flights**. On **200**, the secret is kept in `localStorage` (`af_secret`) on that browser only.
4. On **401**, the app removes the stored secret, pauses auto-refresh, and shows a hint that the AirLabs key is the wrong value.

Never commit secrets. Never put `AIRLABS_API_KEY` in front-end source or the browser field.

## UAT checklist (two devices)

- [ ] Pages URL serves `index.html` over HTTPS
- [ ] Device A: set pin (search, map click, or geolocation), Refresh → cards show carrier, destination, plane type
- [ ] Radius / min altitude / refresh interval behave as expected
- [ ] Device B: same **APP_SHARED_SECRET** → flights load (pin may differ per device localStorage)
- [ ] Wrong secret / AirLabs key → unauthorized message + auto-refresh paused (not a silent empty success)

## Front-end unit tests

```bash
node --test js/lib.test.js
```

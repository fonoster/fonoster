# Fonoster Dashboard

A static React app (Vite, Tailwind, shadcn) that talks to the Fonoster API with
the browser SDK. It reads one setting, `DASHBOARD_API_URL`; sign-in methods,
sign-up, billing and cost display come from the API's `GetCapabilities`.

## Develop

```bash
npm run dev            # http://localhost:3030, API from public/config.js (Envoy on :8449)
npm test               # Vitest
npm run storybook      # stories per state, Community/Cloud and dark/light in the toolbar
npm run test:storybook # runs every story with an axe check (needs Storybook running or built)
npm run test:e2e       # Playwright, "community" and "cloud" projects, API mocked
npm run gen:tokens     # design/tokens.json → src/styles/tokens.css
```

`design/tokens.json` is the variable export of `designs/fonoster.lib.pen`
(exported with the Pencil tools). Regenerate `tokens.css` after refreshing it; a
test fails when they drift.

## Image

nginx serves `dist/`. At start-up `nginx/40-fonoster-config.sh` writes
`/config.js` and the Content-Security-Policy from `DASHBOARD_API_URL`:

```bash
docker run -p 3030:3030 -e DASHBOARD_API_URL=https://api.example.com fonoster/dashboard
```

No token is stored in the browser (security review M4). The access and id tokens
live in memory; the refresh token sits in an httpOnly, `SameSite=Strict` cookie
that the apiserver sets on `/api/session` (Envoy routes `/api` on the
dashboard's origin, so no CORS change is needed). A reload restores the session
through `POST /api/session/refresh`; signing out calls `/api/session/logout`,
which revokes the sign-in. Serve the dashboard behind the same Envoy as the API:
on another origin (a dev server without Envoy), sessions stay in memory and end
on reload. The CSP allows scripts from the dashboard's own origin only.

## Context

`mods/dashboard` is a React Router 7 framework app (`ssr: true`) on MUI 7 and Emotion. Its sign-in uses form actions and a server cookie session (`session.server.ts`). The browser SDK (`@fonoster/sdk` `WebClient`) talks gRPC-web to the apiserver through Envoy. Its settings are compiled in through `envPrefix: "DASHBOARD_"` (`core/sdk/stores/fonoster.config.ts`).

`identity-auth-modes` added two things this change relies on:
- the apiserver RPC `Capabilities/GetCapabilities`
- Identity's `ExchangeVerificationCode` and the `mustChangePassword` id-token claim

The designs are already done:
- `designs/dashboard.pen`: sign-in Cloud and Community rows, workspace Select/Empty/Switcher, an app shell with the nav expanded and collapsed, plus the feature screens
- `designs/fonoster.lib.pen`: tokens and components

The backend gaps they rely on are listed in the gaps doc (https://claude.ai/code/artifact/4bfcd60f-ad9b-43d6-9cf2-8d294301ebda).

## Goals / Non-Goals

**Goals:**
- One image for Cloud and Community, configured at run time.
- Every screen in `dashboard.pen` built on Tailwind and shadcn, with stories and tests for both variants.
- The same stack and conventions as QCobro `mods/webapp`, so people and patterns move between the products.

**Non-Goals:**
- Server rendering, SEO, or rendering anything before sign-in on the server.
- Running old MUI pages next to new ones.
- New backend features. Gaps get their own changes (see Feature order).

## Decisions

### Stack
- `vite` 6, `@vitejs/plugin-react`, `@tailwindcss/vite` with Tailwind 4, `react-router-dom` 7 in declarative mode (`<BrowserRouter>` + `<Routes>`), `@tanstack/react-query` 5.
- `react-hook-form` with zod, as today.
- shadcn components (Radix, cva, `tailwind-merge`, `clsx`) in `src/components/ui`; lucide icons; `sonner` for toasts.
- The import alias stays `~/`, so moved hooks keep their imports.
- Fonts: `@fontsource` Poppins (headings) and Roboto Mono (code and IDs), as in the library.
- Dropped: `@mui/*`, `@emotion/*`, `@react-router/{dev,node,serve}`, `isbot`, `react-router-devtools`.

*Alternative considered:* React Router framework mode with `ssr: false` (SPA mode). It keeps loaders but also keeps the framework build and the typegen. Plain Vite matches the sibling products, and the user chose it.

### Runtime config
- `index.html` loads `/config.js` before the app bundle. In the image, `docker-entrypoint.d/40-fonoster-config.sh` writes that file from `DASHBOARD_API_URL` (`window.__FONOSTER__ = {"apiUrl": "..."}`, JSON-encoded). It also writes the nginx CSP include.
- In development, `public/config.js` points at `http://localhost:8449` (Envoy).
- `src/lib/runtime.ts` reads `window.__FONOSTER__` and checks it with zod. If it is missing or invalid, the app shows a configuration error page that names the variable.
- Nothing else is read at run time. `allowInsecure` follows from the URL scheme. The reset-password and GitHub callback URLs are derived from `window.location.origin`.

### Capabilities
- `CapabilitiesProvider` calls `client.getCapabilities()` once at boot, before routing, and shows the splash screen meanwhile. `useCapabilities()` returns the typed result.
- On failure: a full-page "Can't reach the Fonoster API at <apiUrl>" with a retry button. It never falls back to guessed values: a wrong guess would show sign-in methods the server refuses.
- These replace `IS_CLOUD`, `IS_SIGNUP_ENABLED` and `IS_PRIVATE_BETA`. Screens read specific capabilities (`auth.methods`, `auth.signup`, `billing.enabled`, `costs.display`) and never an "edition".

### Session
- `src/lib/auth.tsx`, modeled on QCobro's:
  - `AuthProvider`, `useAuth()`, `RequireAuth`.
  - The session (`{ accessToken, refreshToken, idToken }`) is kept as JSON under `localStorage["fonoster.session"]`, and every read is wrapped in try/catch.
- The SDK `WebClient` is created once per session from `apiUrl`:
  - Tokens are loaded with `loginWithRefreshToken` or set directly.
  - After each refresh, the new tokens are written back.
  - A failed refresh clears the session and sends the user to `/sign-in?next=<path>`.
- The selected workspace is `localStorage["fonoster.workspace"]` plus the `:workspace` URL segment. The URL wins.
- Sign-out clears both keys and the TanStack Query cache.
- **CSP**, served by nginx:
  - `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://avatars.githubusercontent.com; font-src 'self'`
  - `connect-src 'self' <apiUrl> wss:` (the WebSocket allowance is for the test-call signaling server set in `fonoster.yaml`)
  - `frame-ancestors 'none'; base-uri 'none'; form-action 'self' https://github.com`
  - Inline styles are allowed because Radix positions popovers with `style` attributes. Inline scripts are not: the theme pre-paint script ships as `/theme.js`.
- Also served: `X-Content-Type-Options: nosniff` and `Referrer-Policy: same-origin`.

*Alternative considered:* an HttpOnly cookie through a backend-for-frontend. It means a server, which the SPA gives up on purpose. With a strict CSP, no third-party scripts, and the SDK rotating refresh tokens, localStorage is acceptable, and the user chose it.

### Sign-in flows
All screens are under `/auth/*` and render from `auth.methods` and `auth.signup`.

| Screen | Shown when | Calls |
|---|---|---|
| Sign in: email + password | `password` | `client.login(email, password)` |
| Sign in: email → Check email (6 digits, 30 s resend cooldown) | `email_code` | `sendVerificationCode`, `loginWithVerificationCode` |
| Continue with GitHub | `github` | redirect to `authorizeUrl`, callback `/oauth/github/callback` → `loginWithOauth2Code` |
| Sign up | `signup: open` and `password` | `createUser`, then sign in |
| Forgot password / Reset password | `password` | `sendResetPasswordCode`, `resetPassword` |
| Accept invite | link from the invite email | existing accept-invite HTTP bridge → sign in |
| Set password (cannot be skipped) | id token has `mustChangePassword` | `updateUser({ password })`, then refresh tokens |

- **GitHub state:** a random nonce goes into `sessionStorage` before the redirect, and the callback checks it before exchanging the code. A mismatch shows an error and does not exchange.
- **Errors:** "invalid credentials" and "invalid code" read the same, so the screens don't reveal whether an account exists. `RESOURCE_EXHAUSTED` shows "Too many attempts, try again in a few minutes".
- **2FA:** the design (`F3F82S`) needs a two-step exchange that Identity lacks. It is in the gaps.

### Invites
Invite emails link to `<appUrl>/invites?token=…` (the Identity default). The
dashboard forwards the token to the API's accept-invite bridge
(`<apiUrl>/api/identity/accept-invite`, routed by Envoy), which accepts the
membership and redirects to `appUrl`, or to `/invites/failed`. A
`sessionStorage` flag set before the redirect shows sign-in's "You're invited"
variant on the way back; a signed-in user lands on the workspace list, refreshed.

### GitHub in tests
`identity.oauth2.github.url` / `apiUrl` (defaults `https://github.com` /
`https://api.github.com`) let Identity and the capabilities' `authorizeUrl` point
at `.scripts/fake-github.mjs`, a dependency-free stand-in for the authorize page,
token exchange, `/user` and `/user/emails`. Playwright doesn't need it: it fulfils
GitHub's authorize URL itself. The callback stays at `/oauth/github/callback`,
the URL registered on Fonoster Cloud's OAuth app.

### Workspace landing
After sign-in, and after Set password when required:
- no workspaces → **Create workspace** (empty state `f3k9E`)
- one or more → **Select workspace** (`r58iR`), unless the remembered workspace still exists, in which case the app goes straight to its overview

The sidebar switcher (`H3BCE`) lists the workspaces and has "Create workspace". Member count and last activity are gaps; the cards leave them out until the API returns them.

### App shell
- `AppShell`: a sidebar of 240px, or 64px when collapsed (state in `localStorage["fonoster.nav"]`), with a top bar for the page title and user menu. It follows QCobro's `AuthedLayout.tsx`.
- The workspace switcher is at the top of the sidebar; collapsed, it shows the workspace avatar.
- The brand is the full logo when expanded and the bubble mark (`ui:Gai4K`) when collapsed.
- The active item uses the subtle `sidebar-accent` highlight. Mint is used only for calls to action.
- Billing shows only when `billing.enabled`. Cost columns show only when `costs.display`.

### Tokens
- `scripts/gen-tokens.ts` reads the variables in `designs/fonoster.lib.pen` and writes `src/styles/tokens.css`:
  - `:root` holds dark, the default, and `[data-theme="light"]` holds light.
  - shadcn names (`--background`, `--primary`, `--sidebar-accent`, ...), plus `--radius-control: 10px`.
  - Tailwind uses them through `@theme inline`.
- The `.pen` file is read only through the Pencil MCP tools, so the script works on an export the tools produce (`designs/tokens.json`). The export and the generated CSS are both committed. A test fails when the CSS is out of date with the export.

### Testing
- **Vitest** with jsdom and Testing Library: components, hooks and forms. The SDK is mocked at the `WebClient` boundary.
- **Storybook 8** with `@storybook/react-vite`:
  - toolbar decorators for theme (dark/light) and capabilities (community/cloud)
  - `@storybook/test-runner` with axe in CI
- **Playwright**, with `community` and `cloud` projects:
  - Each project serves the built app with its own `config.js`.
  - Each mocks `GetCapabilities` and the other gRPC-web calls with `page.route` (fixtures encoded with the generated protobuf classes).
  - One test per flow per variant, plus a smoke test against the live local stack, tagged `@live` and run on demand.

### Image
```
FROM node:20-alpine AS build   # npm ci (workspace), vite build
FROM nginx:1.27-alpine
COPY dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf      # SPA fallback, cache headers, CSP include
COPY nginx/40-fonoster-config.sh /docker-entrypoint.d/
```
- It listens on 3030, as today, so Envoy's `dashboard-cluster` is unchanged.
- Hashed assets get `immutable`, while `index.html` and `config.js` are not cached.

### Feature order
Screens land after the foundation and sign-in. APIs that exist come first:
1. App shell and workspace landing
2. Agents (list, create with templates, Configure/Tools/Advanced tabs, Talk drawer through `use-sip.ts` + `createTestToken`)
3. Voice apps
4. Numbers (routing to an agent, voice app or SIP user)
5. Trunks
6. Domains, SIP users, ACLs and credentials
7. Secrets and API keys (each secret is shown once)
8. Settings (General, Members, Billing behind `billing.enabled`)
9. Calls list and detail
10. Overview

Gaps come last. Each gets its own OpenSpec change first, then its screen:
- `appRef` on CDRs, and the filters that need it
- the member role update
- workspace member count and last activity
- the user's pending invites
- endpoint health
- call stats
- transcripts and latency
- eval runs
- knowledge upload
- the cost model
- 2FA

Until a gap lands, its screen region shows the design's "coming soon" state, never invented data.

## Risks / Trade-offs

- **XSS could read tokens from localStorage.** Mitigations: the strict CSP, no `dangerouslySetInnerHTML`, no third-party scripts, short-lived access tokens, and rotating refresh tokens.
- **No coexistence, so the branch can't ship half-done.** That fits the one-branch, one-release plan. The old app keeps running from `main` until the branch merges.
- **Boot needs the API.** If `GetCapabilities` fails, the app stops with a clear error. We accept that over guessing.
- **The tokens export can drift from the `.pen` file.** The export is refreshed with the tools as part of any design change, and the test only catches CSS that lags behind the export.
- **`wss:` in `connect-src` is broad.** Narrowing it would mean advertising the signaling host in capabilities; that is a later, small addition.

## Migration Plan

- The dashboard image takes `DASHBOARD_API_URL` at run time. Compose and the docs change, and the old build arguments are deleted from CI.
- Users sign in once after the upgrade, because the old cookie session is not read.
- Rollback means redeploying the previous image. No data changes.

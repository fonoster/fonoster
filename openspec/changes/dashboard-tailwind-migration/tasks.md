# Tasks

Every screen from section 3 on is done when it has:
- stories for each state × {community, cloud} × {dark, light}
- Vitest tests with the SDK mocked
- one Playwright path per variant
- a clean axe check and a clean typecheck
- its old MUI page deleted

## 1. Foundation

- [x] 1.1 Replace the framework app with plain Vite:
  - `index.html`, `src/main.tsx`, `vite.config.ts` (`@vitejs/plugin-react`, `@tailwindcss/vite`, alias `~/`)
  - remove `react-router.config.ts`, `root.tsx` and the `*.server.ts` / `*.action.tsx` files
  - drop the MUI, Emotion and `@react-router/*` dependencies
- [x] 1.2 Runtime config:
  - `public/config.js` (dev), and `src/lib/runtime.ts` validating it with zod
  - a configuration error page
  - remove `envPrefix` and `core/sdk/stores/fonoster.config.ts`
- [x] 1.3 Tokens:
  - export the `fonoster.lib.pen` variables to `designs/tokens.json` using the Pencil tools
  - `scripts/gen-tokens.ts` → `src/styles/tokens.css` (dark default, light), mapped with `@theme inline`
  - a test fails when the CSS is out of date
  - fonts through `@fontsource`; `/theme.js` sets the theme before the first paint
- [x] 1.4 shadcn base in `src/components/ui`: Button, Input, Label, Card, Separator, InputOTP, Form (react-hook-form + zod), Dialog, DropdownMenu, Tooltip, Tabs, Avatar, Skeleton, Sonner
- [x] 1.5 `CapabilitiesProvider` + `useCapabilities()`: a splash screen while loading, the error page with retry, typed from the SDK `Capabilities`
- [x] 1.6 `src/lib/auth.tsx`:
  - `AuthProvider`, `useAuth`, `RequireAuth`
  - `localStorage["fonoster.session"]` with the SDK token refresh written back, `next` redirect
  - sign-out clears the session, the remembered workspace and the query cache
- [x] 1.7 Test tooling:
  - Vitest with jsdom and Testing Library
  - Storybook 8 react-vite with theme and capabilities decorators, test-runner with axe
  - Playwright `community` and `cloud` projects with gRPC-web fixtures through `page.route`
- [x] 1.8 Image:
  - multi-stage build into `nginx:alpine` on :3030
  - `default.conf` with the SPA fallback, cache headers and CSP; `40-fonoster-config.sh` writes `config.js` and the CSP include
  - update compose, `.env.example*` and CI (remove the dashboard build args and `SERVER_DASHBOARD_SESSION_SECRET`)

## 2. Sign-in (review checkpoint)

- [x] 2.1 Sign in, Community (email + password, error state) and Cloud (GitHub + email code), chosen from `auth.methods`
- [x] 2.2 Check email: 6-digit InputOTP, 30 s resend cooldown, invalid and too-many-attempts states
- [x] 2.3 GitHub redirect and `/oauth/github/callback` with the `sessionStorage` nonce check
- [x] 2.4 Forgot password and Reset password
- [x] 2.5 Sign up (only when `signup: open` with `password`)
- [x] 2.6 Accept invite sign-in, and a Set password screen that can't be skipped, enforced by `mustChangePassword`
- [x] 2.7 Workspace landing: Select, Empty → Create workspace, remembered workspace

## 3. App shell (review checkpoint)

- [x] 3.1 `AppShell`: sidebar of 240 px, or 64 px collapsed (remembered), with a top bar and user menu
- [x] 3.2 Workspace switcher at the top of the sidebar, a compact avatar when collapsed, and "Create workspace"
- [x] 3.3 Navigation follows `sidebar-navigation` from the designs; the active item uses `sidebar-accent`; Billing follows `billing.enabled`
- [x] 3.4 Profile and sign-out

## 4. Screens backed by existing APIs

- [x] 4.1 Agents: list, create dialog with templates, Configure / Tools / Advanced tabs
- [x] 4.2 Talk to agent drawer (`use-sip.ts` + `createTestToken`)
- [x] 4.3 Voice apps
- [x] 4.4 Numbers, with the routing drawer (agent, voice app, SIP user)
- [x] 4.5 Trunks
- [x] 4.6 Domains, SIP users (agents), ACLs, credentials
- [x] 4.7 Secrets and API keys (each secret is shown once)
- [x] 4.8 Settings: General, Members (invite, resend, remove), Billing when `billing.enabled`
- [ ] 4.9 Calls list and detail (CDR fields; cost only when `costs.display`)
- [ ] 4.10 Overview

## 5. Backend gaps (each gets its own OpenSpec change first)

- [ ] 5.1 `appRef` on CDRs, and the calls filters by agent or app
- [ ] 5.2 Workspace member count and last activity on the Select cards
- [ ] 5.3 The user's pending invites on the landing screen
- [ ] 5.4 Member role update
- [ ] 5.5 Endpoint health, and call stats for Overview
- [ ] 5.6 Transcripts and latency (conversation event store)
- [ ] 5.7 Agent evals and knowledge upload
- [ ] 5.8 Cost model
- [ ] 5.9 Two-step sign-in (2FA)
- [ ] 5.10 Found while building section 4 (each needs a small backend or SDK change):
  - un-routing a number, and clearing a trunk/ACL/credentials link (empty strings can't clear proto3 refs)
  - IPv6 in ACLs (validator is IPv4-only)
  - `UpdateCredentialsRequest` type lacks username/password; `Privacy` enum in @fonoster/types says `ID` for PRIVATE
  - API keys can only be WORKSPACE_ADMIN; no member role update RPC
  - no counts or reverse lookups (numbers per trunk/app, what uses an ACL/credential)
  - no import-from-YAML, webhook "send test", endpoint health, or phone/chat test calls

## 6. Cleanup and verification

- [ ] 6.1 `grep -r "@mui\|@emotion\|react-router\"" mods/dashboard/src` is empty, and the old design-system folder is gone
- [ ] 6.2 `npm run typecheck`, `vitest run`, `test-storybook` and `playwright test` pass for both projects
- [ ] 6.3 Live check against the local stack, for Community (password) and Cloud (email code; GitHub with a real OAuth app when credentials are available)
- [ ] 6.4 The image runs with only `DASHBOARD_API_URL`; the CSP header is present and inline scripts are blocked

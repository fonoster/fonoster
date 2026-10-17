## Why

The dashboard no longer matches the product. Its designs (`designs/dashboard.pen`, built on the
`designs/fonoster.lib.pen` library) cover agents, voice apps, numbers, calls, workspaces and
per-deployment sign-in. The current app is a different shape:

- It is a React Router 7 SSR app on MUI and Emotion. Rendering on the server buys nothing: every
  page is behind sign-in and every call goes from the browser to the apiserver through the SDK.
  SSR does cost us, though. Two copies of React in one tree broke the server render during this
  refresh, and the server keeps a session cookie with its own secret (`SERVER_DASHBOARD_SESSION_SECRET`).
- Its settings are fixed when the image is built (`DASHBOARD_EDITION`, `DASHBOARD_API_URL`,
  `DASHBOARD_AUTH_GITHUB_*`, `DASHBOARD_PRIVATE_BETA_ENABLED`, `DASHBOARD_RESET_PASSWORD_URL`).
  So one image can't serve both Cloud and Community, and a self-hosted operator can't point it
  at their own API without rebuilding.
- Sign-in has no Community variants, and nothing makes invitees set a password. After sign-in
  there's no screen for choosing or creating a workspace.

The two other products on this stack (QCobro `mods/webapp`, Proyecta `packages/dashboard`) run
plain Vite SPAs on Tailwind and shadcn. That setup has worked well for them.

## What Changes

- **Rebuild `mods/dashboard` in place as a plain Vite SPA:**
  - `@vitejs/plugin-react`, `@tailwindcss/vite`, `react-router-dom` in declarative mode, TanStack Query.
  - No SSR, no React Router framework mode, no MUI and no Emotion.
  - The old pages are replaced, not run side by side with the new ones.
- **One runtime setting:** `DASHBOARD_API_URL`.
  - The image is nginx serving static files. At start-up it writes `/config.js` (`window.__FONOSTER__ = { apiUrl }`) and fills the CSP `connect-src` from that same value.
  - Everything else comes from `Capabilities/GetCapabilities`: sign-in methods, sign-up policy, GitHub client id and authorize URL, billing, cost display, domain and app URL.
  - The build-time `DASHBOARD_*` arguments and `SERVER_DASHBOARD_SESSION_SECRET` are removed.
- **Session in `localStorage`**, the way QCobro does it. The SDK's access and refresh tokens are kept under one key and refreshed by the SDK. A strict Content-Security-Policy limits what scripts can run.
- **Design tokens generated from `fonoster.lib.pen`** into `src/styles/tokens.css` (dark is the default, light also ships), using shadcn variable names.
- **Sign-in shaped by capabilities:**
  - Cloud: GitHub plus an emailed code.
  - Community: email and password, with forgot and reset password.
  - Open sign-up when `signup: open`.
  - Accepting an invite, with a forced Set password screen when the id token has `mustChangePassword`.
- **Workspace landing after sign-in:** select a workspace, or create the first one when there are none. The switcher sits at the top of a sidebar that collapses (240px / 64px). When collapsed, the brand is the bubble mark.
- **Feature screens in order:** the ones whose APIs exist first. Screens that need backend work come last, each behind its own follow-up change.
- **Testing on every screen:**
  - Storybook stories for each state × {community, cloud} × {dark, light}
  - Vitest and Testing Library tests
  - Playwright `community` and `cloud` projects
  - an axe check

## Capabilities

### New Capabilities

- `dashboard`: how the web app is configured, signs people in and picks the workspace.

### Modified Capabilities

None. This change uses `capabilities` and `identity` (from `identity-auth-modes`) as they are.

## Impact

- `mods/dashboard`: every file is rewritten. The `*.service.ts` TanStack hooks and `hooks/use-sip.ts` are kept where they fit.
- `mods/dashboard/Dockerfile`: a multi-stage build into `nginx:alpine` with an entrypoint script. There are no build arguments.
- `compose.yaml` / `compose.dev.yaml`: the dashboard gets `DASHBOARD_API_URL` and loses `SERVER_DASHBOARD_SESSION_SECRET`. `.env.example*` changes the same way.
- CI: the dashboard image build no longer passes edition, GitHub or API build arguments.
- **Operators:** set `DASHBOARD_API_URL` at run time. Sign-in options now follow `features.auth` in `fonoster.yaml`.
- **Users:** people with an existing cookie session sign in once more after the upgrade.

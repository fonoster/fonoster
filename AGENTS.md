# AGENTS.md

## Overview
Fonoster: the AI that answers the phone. An open-source (MIT) voice platform: Autopilot agents,
apps over WebSocket streams (protocol `fonoster` | `twilio`), numbers, trunks and SIP agents,
call records and webhooks. Used as Fonoster Cloud (app/api.fonoster.ai) and self-hosted with
Docker Compose or Helm. npm workspaces + Lerna monorepo (`mods/*`, `tools/*`), Python packages
in `python/`, Mintlify docs in `docs-site/`.

## Commands
- Develop only in the dev container (`.devcontainer/`); it starts Postgres, NATS, Routr, RTPEngine,
  MinIO and Envoy. `npm run dev [-- <component>]` runs components from source; `npm run dev:info`
  prints the dashboard login.
- Install: `npm install`. Build: `npm run build`. Lint and format check: `npm run lint`.
- Unit tests: `npm test` (mocha over `mods/!(dashboard)/**/*.test.ts`, skips `*.integration.test.ts`).
  One package: `npx cross-env LOGS_LEVEL=none NODE_ENV=development mocha --timeout 30000 'mods/<pkg>/test/**/*.test.ts'`.
- Integration tests: `npm run integration`.
- Dashboard: `npm test -w @fonoster/dashboard` (vitest), `npm run typecheck -w @fonoster/dashboard`,
  `npm run test:e2e -w @fonoster/dashboard` (Playwright).
- Docs: `npm run start:docs` (port 3333), `npm run check:docs`.
- Protos changed: `npm run generate:protos`.
- Default Verify: `npm run lint && npm run build && npm test`; dashboard area adds the dashboard tests;
  a QA area's cases per `mods/conformance/catalog/areas/<area>.md`.

## Conventions
Profile: typescript
Overrides:
- Transport is gRPC (protos in `mods/common/src/protos`, served by `mods/apiserver`), not tRPC.
- Database is Postgres only; Prisma 6 (schemas in `mods/apiserver`, `mods/identity`, `mods/billing`).
- Node `>=20.11.1` (root `engines`); the SDK is tested on Node 20, 22 and 24.
- Integration tests are `*.integration.test.ts` next to unit tests, not `test/integration/**`.
- Dashboard (`mods/dashboard`) is a plain Vite React SPA tested with vitest and Playwright, not mocha.
- Vendor adapters are subpaths of one package (`@fonoster/community/<vendor>`), never a package per vendor.
- Every non-unit test carries a case id from `mods/conformance/catalog/areas/*.md`, or is deleted.
- PRs are squash merged; the title is a conventional commit and becomes the commit on main.
  Commits need DCO sign-off (`@fonoster.com` exempt).
Examples: `mods/identity/src/exchanges/createExchangeApiKey.ts`, `mods/sipnet/src/numbers/createNumber.ts`

## Areas
| Area label | Paths | Experts |
| :--- | :--- | :--- |
| area: autopilot | mods/autopilot, mods/community | performance-engineer |
| area: media | mods/appbridge, mods/amd | realtime-comms-engineer, performance-engineer |
| area: stream | mods/voice, python/fonoster-voice | realtime-comms-engineer |
| area: sdk | mods/sdk, mods/types | release-engineer |
| area: cli | mods/ctl, mods/region-agent | ux-designer, release-engineer |
| area: dashboard | mods/dashboard, designs/ | ux-designer, visual-designer |
| area: infra | ops/, .github/workflows, .devcontainer, compose.yaml | release-engineer, security-engineer |
| area: docs | docs-site/, docs/ | technical-writer |
| area: api | mods/apiserver, mods/sipnet, mods/callrecord | database-engineer |
| area: identity | mods/identity, mods/identity-client, mods/authz | security-engineer, database-engineer |
| area: billing | mods/billing, mods/stripe-fake | database-engineer, security-engineer |

## Labels
These are the only labels; any other is deleted. An issue's kind is its native issue type (Bug,
Feature, Task), not a label. Close as "not planned" or "duplicate" instead of labeling.

| Label | Meaning | Applied by |
| :--- | :--- | :--- |
| needs-triage | Filed, not yet shaped | Issue forms |
| needs-info | Waiting on the reporter | /ps:report |
| ready | Plan approved; agents may implement | A maintainer |
| not-ready | The implementer refused; see its comment | /ps:implement |
| blocked | An agent stopped on a blocker | Any ps skill |
| needs-human | A loop limit was hit or a decision needs a maintainer | Any ps skill |
| needs-issue | A pull request with no linked issue | require-linked-issue workflow |
| breaking | Needs a major bump or a migration note | /ps:report |
| risk: high | A maintainer reviews the plan before work starts | /ps:report |
| external | Opened by someone outside the org | label-external workflow |
| good first issue | A ready issue a newcomer can take | A maintainer |
| dependencies | Dependency update | Dependabot |

Plus one `area:` label per row of `## Areas`.

## Compatibility
Breaking changes here:
- gRPC protos (`mods/common/src/protos`, `mods/identity-client/proto`) and the `@fonoster/sdk` public API.
- The session protocol and Twilio Media Streams compatibility (`docs/session-protocol.md`), Voice SDK
  (Node and Python).
- Webhook event names and payloads (`docs/webhooks.md`).
- `fonoster` CLI commands and flags (`mods/ctl`), `fonoster-region` CLI.
- Config files and keys (`config/*.example.*`, per-service YAML), Helm values (`ops/rebuild/helm`),
  install `.env` (`FONOSTER_VERSION`).
- Prisma schemas and migrations; the production deploy never migrates down.

## Risk hotspots
- `mods/identity`, `mods/authz`: auth, tokens, API keys; among the most-fixed paths.
- `mods/*/schema.prisma`, `mods/*/migrations`: production data; deploy does not touch the DB.
- `mods/billing`: money and Stripe events.
- `mods/common/src/protos`: wire contract for every client.
- `mods/appbridge`: call media and session core.
- `.github/workflows/release.yaml`, `deploy.yaml`, `ops/release`, `ops/deploy`: every merge to main releases and deploys.
- `mods/apiserver`, `mods/dashboard`: most fix commits since August.

## Release
Every merge to main with a releasable commit releases (`release.yaml`): version from conventional
commits (`ops/release/next-release.sh`), QA gate (`qa-proofs.yaml`), npm via lerna, images
(`ops/release/images.json`), GitHub release with cards, then `deploy.yaml` stages production and
switches after approval. `docs`, `chore`, `ci`, `test`, `style` ship nothing. Never put `[skip ci]`
in a PR title or body. The QA gate is skipped while the repository variable `QA_PAUSED=true`.
Every PR links an issue (`Closes #123`; the `linked-issue` check). Required checks on main:
**PR Checks passed** and **conventional PR title**.

## Expert notes
### realtime-comms-engineer
- SIP edge is Routr (fonoster/routr); media is RTPEngine and Roomr nodes (fonoster/roomr, pinned
  `@fonoster/roomr`).
- Inbound call audio is slin16 (16 kHz container, narrowband PSTN content); TTS out is 8 kHz.
- In the dev container on macOS, RTPEngine advertises `HOST_IP` for every leg, so browser calls get
  no inbound audio; tests must assert inbound RTP, not just "Connected".
### qa-engineer
- Cases live in `mods/conformance/catalog/areas/<area>.md` (dashboard, api, appbridge, autopilot,
  billing, transfers, voice-sdk); results go only in the release QA report. No manual tests.
- Tests run against fake providers (catalog provider `fake`), not real vendors; no dev-only code paths.
### database-engineer
- Prisma 6; `prisma-field-encryption` blocks Prisma 7.
### release-engineer
- Production is app/api.fonoster.ai on one droplet; `fonoster-deploy prepare` then `switch`, rolls
  back on a failed smoke test.
### technical-writer
- `docs-site/AGENTS.md` holds the docs editorial policy and vocabulary.

## Decisions
- 2026-10-16: One name per concept: Agents (Autopilot is the engine), apps/Streams with protocol
  `fonoster|twilio`, SIP agents, operators; "cell" is internal.
- 2026-10-16: `main` is the platform; work and release from main.
- 2026-10-19: Dashboard serves SaaS and self-hosted; SaaS-only UI (billing, invoices) hides in OSS mode.
- 2026-10-20: Dev container behaves like a self-host; no dev-only code paths.
- 2026-10-25: Config init generates a local CA and cert when none is given (HTTPS by default).
- 2026-10-26: Prisma 7 not planned (#935).
- 2026-10-27: Upgrade old dependency lines to current releases instead of matching old pins.
- 2026-10-28: One label standard across fonoster, routr and roomr (`## Labels`); kinds are native issue types.

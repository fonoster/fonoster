# Docs checkpoint — install-compose

Started: 2026-10-15
Current stage: PAUSED (owner, 2026-10-16) — self-host test environment wiped; restart from scratch later

**Purpose:** A developer or operator who wants Fonoster running on their own machine arrives here
first. They follow one path from a clean machine to a running stack, sign in to the dashboard and
hear a test call answered by an Autopilot app. When they leave, they have a working self-hosted
Fonoster to build on, and they know where its config and credentials live.

**Diátaxis type:** tutorial
**Reader:** self-hoster installing Fonoster for the first time (Self-hosting tab)

**Detected surfaces:** Mintlify: yes, `docs-site/` · Pencil: yes (assets go to `designs/docs.pen`) ·
OpenSpec: yes

**Placement:** new · slug `install-compose` · `self-hosting/install-compose` · nav group `Start`
(Self-hosting tab)

**Sources:** (every claim traces to one of these)
- `ops/bundle/` (compose.yaml, .env.example, README.md), `ops/release/bundle`
- `mods/common/src/config/cli/` (fonoster-config help and output from a clean-folder run)
- `mods/dashboard/src/workspaces/landing.page.tsx` ("Choose a workspace")
- `docs/try-the-new-platform.md`
- `ops/rebuild/stack`, `ops/rebuild/stack.defaults`, `ops/rebuild/compose.yaml`
- `ops/rebuild/seed.cjs`, `ops/rebuild/config/`

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | approved 2026-10-15 |
| 1 | Source | done | ops/bundle, fonoster-config help/output, dashboard labels |
| 2 | Place | done | self-hosting/install-compose, Self-hosting → Start |
| 3 | Outline | done | approved; first call split into its own page |
| 4 | Assets | skipped | commands and output only |
| 5 | Draft | done | |
| 6 | Proof | done | disk 6 GB (≈5 GB images), localhost ports, no broken links |
| 7 | Wire | done | renders at localhost:3333 |

## Friction log

Things a self-hoster would feel while following this install (input for the owner's portability
judgement, not page content).

- Install builds every image from a source checkout (several minutes) and needs Node 22 +
  `npm install` for the seed. No published images or standalone compose bundle yet.
- The script and paths are named `ops/rebuild/…`; that name leaks the project's history into a
  user-facing command.
- `try-the-new-platform.md` calls itself "a local try-out, not a production deployment"
  (dev secrets, printed passwords).

Measured on the new installer (coordinator's clean-folder run, 2026-10-15, macOS, images local):
- Archive 20 KB; `init` from the npm tarball ~7 s; `docker compose up -d` 8 s; dashboard answers ~2 s later.
- Image sizes: apiserver 1.32 GB, autopilot 817 MB, appbridge 796 MB, dashboard 53 MB, roomr 26 MB
  (~3 GB of Fonoster images, before third-party ones). Heavy: the three Node images carry the whole
  monorepo `/work`.
- Local image build ~3 min with warm layers.
- AppBridge logs a Prisma "table applications does not exist" error on first start (it reads apps before
  the apiserver's migrations finish), then recovers. Looks alarming in `docker compose logs`.
- Standard ports collide with any other Fonoster on the same host (here: platform-refresh on 8449/5060);
  moving them = edit `.env` + re-run `init` (worked). NATS host port 4222 also defaults to a common port.
- `.env` holds `OWNER_PASSWORD` in plain text (0600).

Owner's run (2026-10-15, macOS, following the page; pre-release files):
- Step 1: the release URL 404s (v0.30.0 unpublished) — the pre-release path was hidden at the bottom; moved
  into step 1, then removed again at the owner's request (owner used commands from chat).
- `$R` / long `npx -p <tgz>` path is error-prone across terminals; an alias helped. Moot once published.
- `check`: valid, but Ajv printed 6 "unknown format uri/email ignored" lines (noise). FIX NEEDED.
- `docker compose up`: **project name `fonoster` collides with a legacy install** — reused the legacy
  `fonoster_db` volume (2025-05), Postgres auth failed, appbridge restart-looped. Workaround:
  COMPOSE_PROJECT_NAME=fonoster-next. FIX NEEDED in the bundle (volume/project name) + a page note.
- AppBridge restarts once at startup (reads apps before apiserver migrations). FIX NEEDED (depends_on).
- After that: all 11 services up, catalog 37 entries, owner signed in to the dashboard.

## Decision log

- 2026-10-16 — Paused by the owner to focus on developer mode. Wiped: the test install's volumes (fonoster_postgres-data/nats-data/minio-data), the fonoster/*:0.27.0-local images, ~/Projects/fonoster-fresh-install, dist/release. Kept: legacy fonoster_db/fonoster_influxdb (2025 legacy install). Restart: rebuild with ops/release/bundle, then follow the page from step 1.

- 2026-10-15 — Page written and wired. Ends signed in to the dashboard; "Make your first call" is the next tutorial (vendor keys → agent → domain/SIP user → trunk/number → softphone). Pre-release accordion to remove at v0.30.0.

- 2026-10-15 — Installer spec written: openspec/changes/archive/2026-10-17-add-self-host-installer (curl archive → npx -p @fonoster/common fonoster-config init/info/check → docker compose up -d; keys in dashboard; local build for now).
- 2026-10-15 — Frame approved. Owner chose to fix the installer first (published images + standalone bundle, no clone/Node/"rebuild" name); tutorial teaches that path once it exists.
- 2026-10-15 — Checkpoint created; framing the page.

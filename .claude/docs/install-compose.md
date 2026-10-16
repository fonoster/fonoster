# Docs checkpoint — install-compose

Started: 2026-10-15
Current stage: 0 — Frame done; blocked on installer change

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
- `docs/try-the-new-platform.md`
- `ops/rebuild/stack`, `ops/rebuild/stack.defaults`, `ops/rebuild/compose.yaml`
- `ops/rebuild/seed.cjs`, `ops/rebuild/config/`

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | approved 2026-10-15 |
| 1 | Source | pending | |
| 2 | Place | pending | |
| 3 | Outline | pending | |
| 4 | Assets | pending | |
| 5 | Draft | pending | |
| 6 | Proof | pending | |
| 7 | Wire | pending | |

## Friction log

Things a self-hoster would feel while following this install (input for the owner's portability
judgement, not page content).

- Install builds every image from a source checkout (several minutes) and needs Node 22 +
  `npm install` for the seed. No published images or standalone compose bundle yet.
- The script and paths are named `ops/rebuild/…`; that name leaks the project's history into a
  user-facing command.
- `try-the-new-platform.md` calls itself "a local try-out, not a production deployment"
  (dev secrets, printed passwords).

## Decision log

- 2026-10-15 — Installer spec written: openspec/changes/add-self-host-installer (curl archive → npx -p @fonoster/common fonoster-config init/info/check → docker compose up -d; keys in dashboard; local build for now).
- 2026-10-15 — Frame approved. Owner chose to fix the installer first (published images + standalone bundle, no clone/Node/"rebuild" name); tutorial teaches that path once it exists.
- 2026-10-15 — Checkpoint created; framing the page.

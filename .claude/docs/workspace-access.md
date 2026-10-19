# Docs checkpoint — workspace/access

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A developer needs credentials before any API call. They learn workspaces (create, switch, region fixed), members and the three real roles, API keys (create, regenerate, delete, expiry), the WO/AP IDs, and signing in from the SDK and CLI, plus what isn't built.

**Diátaxis type:** how-to
**Reader:** developers building on Fonoster

**Placement:** new `docs-site/workspace/access.mdx` · slug `workspace/access` · nav group `Workspace`

**Sources:**
- mods/common/src/protos/identity.proto; mods/common/src/identity/roles.ts; mods/common/src/validators/identity.ts
- mods/identity/src/workspaces/*, apikeys/*, exchanges/createExchangeApiKey.ts, utils/generateAccessKey{Id,Secret}.ts, config/schemas.ts
- mods/sdk/src/client/{Client,AbstractClient}.ts, ApiKeys.ts, Workspaces.ts
- mods/ctl/src/commands/{workspaces,apikeys}/*, config/addWorkspace.ts, constants.ts
- mods/dashboard/src/{settings,api-keys,workspaces}/*, app/shell/{nav,workspace-switcher}.tsx

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | done | TODO access/credentials diagram + access/save-secret screenshot queued |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | Workspace group, MENU order (lead wires docs.json) |

## Unverified
- Invite expiry on Cloud (not stated on the page).
- First API key only from the dashboard (true for Cloud; self-hosted bootstrap may differ).
- SDK create-key output shape printed by console.log (object fields from the proto).

## Decision log
- 2026-10-19 — Workspace creation documented in the dashboard only; API keys are scoped to one workspace (ListWorkspaces returns only it).
- 2026-10-19 — CLI create output shown as the two key lines only (the real first line says "regenerated", a bug; raised).
- 2026-10-19 — Roles table from roles.ts + service checks; "not available yet" lists API key roles, role change, two-factor.

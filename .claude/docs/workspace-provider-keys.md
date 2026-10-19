# Docs checkpoint — workspace/provider-keys

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A developer wants calls on their own vendor account. They learn the catalog and its IDs, how to set/list/remove a vendor key (dashboard, SDK, CLI), what happens without one (platform key), and how deprecations reach them (webhook, Streams warnings, CLI) and what to do.

**Diátaxis type:** how-to
**Reader:** developers building on Fonoster

**Placement:** new `docs-site/workspace/provider-keys.mdx` · slug `workspace/provider-keys` · nav group `Workspace`

**Sources:**
- docs/providers.md (draft; code wins)
- mods/common/src/protos/providers.proto; mods/sdk/src/Providers.ts
- mods/apiserver/src/providers/createProvidersHandlers.ts; mods/common/src/registry/{workspaceKeys,Registry}.ts
- mods/ctl/src/commands/providers/{catalog,keys/*}.ts
- mods/dashboard/src/session/{vendor-keys,missing-keys,streams}.tsx
- mods/common/src/webhooks/events.ts; ops/bundle/config/catalog.yaml

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | done | none (no picture needed) |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | Workspace group, MENU order (lead wires docs.json) |

## Unverified
- Cloud has platform keys for all four providers.
- In-progress calls keep their key (lookup at session start, 30 s cache).
- CLI keys:list date format (likely a 1970 bug).

## Decision log
- 2026-10-19 — Didn't call the key write-only for the API (GetSecret returns it); raised as a security question.
- 2026-10-19 — Dashboard warnings placed on the Streams page (only place CatalogWarnings renders).
- 2026-10-19 — Retirement described as "when Fonoster retires" (operator action), not automatic on the date.

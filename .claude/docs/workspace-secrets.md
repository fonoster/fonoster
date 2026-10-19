# Docs checkpoint — workspace/secrets

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A developer sees Secrets in the dashboard and wants to know what they're for. Honest answer: today only vendor keys use them; agents and streams don't read secrets by name. They learn how vendor keys appear as secrets and how to manage secrets.

**Diátaxis type:** how-to
**Reader:** developers building on Fonoster

**Placement:** new `docs-site/workspace/secrets.mdx` · slug `workspace/secrets` · nav group `Workspace`

**Sources:**
- mods/common/src/protos/secrets.proto; mods/common/src/validators/secrets.ts
- mods/apiserver/src/secrets/*; mods/apiserver/schema.prisma (encrypted field)
- mods/apiserver/src/providers/createProvidersHandlers.ts (provider-key/<id>)
- mods/autopilot/src/session/hosted.ts, mods/common/src/registry/workspaceKeys.ts (only consumer)
- grep of mods/ for name-based secret reads (none)
- mods/ctl/src/commands/secrets/*; mods/dashboard/src/secrets/*

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | done | none |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | Workspace group, MENU order (lead wires docs.json) |

## Unverified
- None beyond the open questions.

## Decision log
- 2026-10-19 — Short honest page: vendor keys are the only consumer; Note says agents/streams don't read secrets (consistent with autopilot/tools).
- 2026-10-19 — Didn't repeat the dashboard's "can't be read back" claim; said members can manage secrets. Security issue raised in OPEN-QUESTIONS.

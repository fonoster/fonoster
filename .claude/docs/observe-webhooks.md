# Docs checkpoint — observe-webhooks

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A developer wants their systems told when calls start, end or fail and when records are ready. They create a webhook (Dashboard, SDK, CLI), pick events, verify the HMAC signature, handle at-least-once retries, use the delivery log and resend, and rotate the secret.

**Diátaxis type:** how-to
**Reader:** developers building on Fonoster

**Placement:** new `docs-site/observe/webhooks.mdx` · nav group `Observe`

**Sources:**
- docs/webhooks.md; openspec/specs/workspace-webhooks/spec.md
- mods/common/src/protos/webhooks.proto
- mods/common/src/webhooks/{signing,Dispatcher,events}.ts (signing, 10 s timeout, 10 s → ×2 → 1 h cap, 24 h, no redirects, whsec_ format, retired event names)
- mods/apiserver/src/webhooks/createWebhooksHandlers.ts (validation, 24 h rotation, deliveries page size 50/200, hint = last 4)
- mods/appbridge/src/Gateway.ts (recordUrl, workspaceRef = access key id)
- mods/sdk/src/Webhooks.ts; mods/ctl/src/commands/webhooks/*.ts, utils/webhookFlags.ts, utils/format.ts
- mods/dashboard/src/session/webhooks.tsx; app/shell/nav.ts

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | done | TODO webhooks/dashboard screenshot queued |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | Observe, first |

## Unverified
- Node and Python receivers not run live; Node code mirrors `verifyWebhook` in mods/common.
- `@fonoster/common` availability on npm for app developers.
- Whether Cloud sends relative or absolute `recordUrl`.

## Decision log
- 2026-10-19 — Event table kept short (fields only); full payloads deferred to reference/webhook-events.
- 2026-10-19 — Self-hosted http:// and FONOSTER_ALLOWED_DESTINATIONS reduced to a Note linking self-hosting/configure.
- 2026-10-19 — Dashboard has no edit: said plainly; edit shown via SDK/CLI.
- 2026-10-19 — eventsHook migration table kept (short) since 0.27 users land here.

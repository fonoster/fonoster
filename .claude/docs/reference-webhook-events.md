# Docs checkpoint — reference/webhook-events

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** Look-up page for every workspace webhook event: when it fires, its data fields, an example, plus the envelope, headers, delivery rules and retired 0.27 event names.

**Diátaxis type:** reference
**Reader:** developers building on Fonoster

**Placement:** new `docs-site/reference/webhook-events.mdx` · slug `reference/webhook-events` · nav group `Reference`

**Sources:**
- mods/common/src/webhooks/events.ts, signing.ts, Dispatcher.ts
- mods/appbridge/src/session/Call.ts, Gateway.ts (emitters, reasons, recordUrl)
- mods/apiserver/src/webhooks/lostCalls.ts (appbridge-lost)
- fonoster/roomr: internal/node/dial.go, control.go, types.go (busy / no_answer / failed / rejected)
- mods/common/src/registry/Registry.ts, cli.ts (provider.deprecated)
- docs/webhooks.md, docs-site/observe/webhooks.mdx

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | skipped | reference page, no picture needed |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | nav entry listed in report; docs.json not edited |

## Unverified
- Full set of call.failed reasons: room.ended reasons are passed through as-is, so other values may appear (page says so).
- appbridge-lost delay (15-20 s) from docs/webhooks.md.

## Decision log
- 2026-10-19 — Kept the endReason value appbridge-lost (it's the wire value) but described it without naming the service.
- 2026-10-19 — Did not document no_app: it's sent under workspace 'default', so no customer webhook gets it.

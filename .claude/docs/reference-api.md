# Docs checkpoint — reference/api

Started: 2026-10-19
Current stage: 7 — Wire (listed in report; lead wires docs.json)

**Purpose:** A developer looking for "the API" learns it is gRPC (grpc-web in browsers, same endpoint) plus a few HTTP routes, and is sent to the Node SDK. Owner decision: short, no per-resource docs.

**Diátaxis type:** reference
**Reader:** developers

**Placement:** new `docs-site/reference/api.mdx` · nav group `Reference`

**Sources:**
- mods/common/src/protos/*.proto (packages `fonoster.*.v1beta2`)
- ops/bundle/config/envoy.yaml (grpc-web filter, /api routed to HTTP, one listener)
- mods/apiserver/src/records/runCallRecords.ts, regions/createRegionsRouter.ts
- mods/sdk/src/client/Client.ts, WebClient.ts (default endpoints)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | MENU path |
| 3 | Outline | done | two paragraphs + cards |
| 4 | Assets | queued | reference-api/banner |
| 5 | Draft | done | |
| 6 | Proof | done | 200 on :3334 |
| 7 | Wire | done | reported |

## Unverified
- None beyond the code read.

## Decision log
- 2026-10-19 — Named /api/records and /api/regions as the HTTP routes; left out /api/session and /api/identity (dashboard internals).

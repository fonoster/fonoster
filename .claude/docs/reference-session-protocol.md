# Docs checkpoint — reference/session-protocol

Started: 2026-10-19
Current stage: 7 — Wire (listed in report; lead wires docs.json)

**Purpose:** The wire reference of `fonoster.session.v1` for clients in other languages: connection and signed handshake, every message both ways with fields, audio framing, close behavior, errors and limits. The JSON Schema wins over docs/session-protocol.md.

**Diátaxis type:** reference
**Reader:** developers writing their own session client

**Placement:** new `docs-site/reference/session-protocol.mdx` · nav group `Reference`

**Sources:**
- mods/common/schema/session.v1.json; mods/common/src/session/schema.ts (SUBSCRIBABLE_EVENTS)
- docs/session-protocol.md (draft)
- mods/appbridge/src/session/{Call,connectApp,OutputQueue}.ts, protocols/fonoster.ts, signing.ts, config.ts (DEFAULTS), audio/pcm.ts
- mods/apiserver/src/applications/session/appModel.ts (audio formats, listeners default)
- go/roomr/internal/node/dial.go (warm transfer 30 s)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | |
| 4 | Assets | skipped | reference page |
| 5 | Draft | done | |
| 6 | Proof | done | 200 on :3334 |
| 7 | Wire | done | reported |

## Unverified
- `provider_*`, `feature_not_supported` codes come from the draft doc, not traced to every emitter.
- `clear` silence within 40 ms and 20 ms caller frames: from the doc/spec, not measured.

## Decision log
- 2026-10-19 — `record.note` left out (internal). Close codes: the gateway closes with 1000 after session.end; idle sockets are terminated; app close = hang-up. No other close codes exist in the gateway.
- 2026-10-19 — Documented the app-bound headers (X-Fonoster-App-Ref/Workspace-Ref/App-Signature), which the draft omitted.

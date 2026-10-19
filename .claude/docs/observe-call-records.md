# Docs checkpoint — observe-call-records

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A developer needs what happened on a call, provably. They learn what a record holds (vCon, versions, redacted vs original), find and fetch records and recordings (Dashboard, SDK, CLI, HTTP), and verify the ES256 JWS and file hashes against the region's published keys.

**Diátaxis type:** how-to
**Reader:** developers building on Fonoster

**Placement:** new `docs-site/observe/call-records.mdx` · nav group `Observe`

**Sources:**
- docs/call-records.md; openspec/specs/call-record/spec.md
- mods/callrecord/src/{vcon,sign,recording,redact,CallRecordWriter,keys}.ts
- mods/apiserver/src/records/{createRecordsRouter,createSearchRecords}.ts (filters, page size ≤500, 403/404/410)
- mods/appbridge/src/http/keySetRoute.ts (/.well-known/call-record-keys.json); Gateway.ts (call_record.sealed)
- mods/sdk/src/CallRecords.ts, client/Client.ts (getHttpUrl); mods/ctl/src/commands/records/*.ts
- mods/dashboard/src/session/calls.tsx

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | done | TODO call-records/lifecycle diagram queued |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | Observe, second |

## Unverified
- verify-record.js not run against a live record (mirrors sign.ts and docs/call-records.md).
- Cloud regions set `jku`; `https://api.fonoster.com` is the HTTP API host on Cloud.
- Sample output of `records:list` next-page line uses a ms timestamp token (from createSearchRecords).

## Decision log
- 2026-10-19 — How-to with a short "what's in a record" section; no separate concept page (MENU has none).
- 2026-10-19 — Operator notes (signing keys, stores, analytics) left to self-hosting/call-record-keys.
- 2026-10-19 — Verify uses CLI downloads + a standalone Node script; `@fonoster/callrecord` verifyRecord not mentioned (internal).
- 2026-10-19 — Recording policy details linked to telephony/recording, not repeated.

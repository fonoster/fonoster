# Docs checkpoint — observe-retention

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** An owner or admin handling privacy needs to limit how long recordings and transcripts live and to act on erasure requests. They set per-part retention, delete a part or erase a call, and read the audit log, all via SDK or HTTP (no dashboard or CLI).

**Diátaxis type:** how-to
**Reader:** developers and workspace admins handling privacy requests

**Placement:** new `docs-site/observe/retention.mdx` · nav group `Observe`

**Sources:**
- docs/call-records.md (Retention and erasure); openspec/specs/call-record/spec.md
- mods/apiserver/src/records/{createRecordsRouter,maintenance}.ts (roles, days ≥ 1, null removes, hourly, startedAt cutoff, default reasons, 410 erased)
- mods/apiserver/src/config/schema.ts (retentionIntervalMinutes 60)
- mods/callrecord/src/CallRecordWriter.ts (RECORD_PARTS, transcript takes messages + earlier versions' contents, tombstone, AuditEntry)
- mods/appbridge/src/Gateway.ts (no call_record.sealed for erased)
- mods/apiserver/src/regions/httpAuth.ts (actor = token sub); mods/sdk/src/CallRecords.ts; mods/types/src/records.types.ts

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | skipped | how-to, no picture needed |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | Observe, third |

## Unverified
- Default role of API keys (needs owner/admin for these calls).
- Example delete_part response shape (from maintenance.ts + AuditEntry; not run live).

## Decision log
- 2026-10-19 — "SDK and HTTP only" stated in a Note at the top; Tabs are SDK / HTTP (no Dashboard/CLI tabs).
- 2026-10-19 — Warning that a new policy applies to existing records immediately (runRetention has no "new calls only" filter).

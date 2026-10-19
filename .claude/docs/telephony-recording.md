# Docs checkpoint: telephony-recording

Started: 2026-10-19
Current stage: 7, Wire (lead wires docs.json)

**Purpose:** Record calls and ask for consent (`telephony/recording`). Reader: Developers who must record, or must not, and need consent.

**Diátaxis type:** how-to
**Placement:** new · `docs-site/telephony/recording.mdx` · nav group `Telephony`

**Sources:**
- docs/call-records.md
- openspec/specs/call-record/spec.md
- mods/appbridge/src/config.ts (recordingPolicy), configSchema.ts, session/Call.ts (consentPrompt)
- mods/types/src/applications.types.ts
- mods/dashboard/src/session/streams.tsx
- mods/ctl/src/utils/applicationFlags.ts

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | how-to spine |
| 4 | Assets | done | TODOs queued in ASSET-QUEUE.md |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | pending | lead edits docs.json |

## Decision log

- 2026-10-19: Workspace policy described as set by the operator on self-hosted (no API/UI).
- 2026-10-19: Flagged that the prompt text isn't translated.

## Unverified

- Cloud region default policy.
- Dashboard download location of the recording.

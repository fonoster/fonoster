# Docs checkpoint: telephony-amd

Started: 2026-10-19
Current stage: 7, Wire (lead wires docs.json)

**Purpose:** Detect answering machines (`telephony/amd`). Reader: Developers placing outbound calls who need to know who answered.

**Diátaxis type:** how-to
**Placement:** new · `docs-site/telephony/amd.mdx` · nav group `Telephony`

**Sources:**
- openspec/specs/voice-session/spec.md:269
- mods/amd/README.md (behavior only)
- mods/appbridge/src/amd/AmdListener.ts, session/Call.ts
- mods/apiserver/src/applications/session/appModel.ts
- mods/ctl/src/utils/{applicationFlags,applicationRequest}.ts
- mods/dashboard/src/session/{streams,stream-detail}.tsx, agents/tabs/advanced-tab.tsx
- mods/voice/src/types.ts

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

- 2026-10-19: No internals (classifier, model) documented.
- 2026-10-19: Documented 4 s no-speech cutoff and window-from-onset as observable timing.

## Unverified

- Twilio-protocol streams never get amd.result (adapter drops it).

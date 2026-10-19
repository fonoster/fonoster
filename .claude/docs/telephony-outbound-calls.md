# Docs checkpoint: telephony-outbound-calls

Started: 2026-10-19
Current stage: 7, Wire (lead wires docs.json)

**Purpose:** Make outbound calls (`telephony/outbound-calls`). Reader: Developers starting calls from code, CLI or an AI assistant.

**Diátaxis type:** how-to
**Placement:** new · `docs-site/telephony/outbound-calls.mdx` · nav group `Telephony`

**Sources:**
- mods/common/src/protos/calls.proto
- mods/common/src/validators/{calls,sip}.ts
- mods/apiserver/src/calls/{createCall,createIsWorkspaceNumber}.ts
- mods/sdk/src/Calls.ts
- mods/ctl/src/commands/sipnet/calls/create.ts, utils/trackCallStatus.ts
- mods/mcp/src/tools/*, schemas.ts
- docs/webhooks.md
- mods/autopilot/src/session/Agent.ts

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

- 2026-10-19: Metadata documented for streams only: live Autopilot ignores it (open question).
- 2026-10-19: Batches via MCP only; noted the in-process pacing.

## Unverified

- Exact error strings as surfaced by the SDK.

# Docs checkpoint — streams/voice-sdk

Started: 2026-10-19
Current stage: 7 — Wire (listed in report; lead wires docs.json)

**Purpose:** A developer who wants their own logic on a call builds a small phone menu in Node.js: say, gather (speech and DTMF), transfer, hangup. They create a STREAM (protocol fonoster), expose it with a tunnel, point a number at it and call it.

**Diátaxis type:** tutorial
**Reader:** developers building their own stream (WebSocket server)

**Placement:** new `docs-site/streams/voice-sdk.mdx` · slug `streams/voice-sdk` · nav group `Streams`

**Sources:**
- mods/voice/src/{VoiceServer,Session,signature,types,errors}.ts; mods/voice/examples/*; mods/voice/README.md
- docs/voice-sdk.md, docs/session-protocol.md, docs/migrating-to-sessions.md
- mods/apiserver/src/applications/session/appModel.ts (defaults, public-URL check, protocol default)
- mods/ctl/src/commands/applications/create.ts, utils/applicationFlags.ts, commands/sipnet/numbers/update.ts
- mods/sdk/src/Applications.ts; mods/dashboard/src/session/{streams,create-stream-dialog,stream-detail}.tsx; numbers/routing.ts, route-picker.tsx

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | code wins over docs/*.md drafts |
| 2 | Place | done | MENU path |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | queued | voice-sdk/session-flow diagram in ASSET-QUEUE |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334, headings present |
| 7 | Wire | done | reported to lead |

## Unverified
- Not live-run. Whole flow (ngrok + Cloud + number) untested end to end.
- `@fonoster/voice` 0.30 on npm.
- Caller experience when the URL is unreachable and no fallback is set (page says the call ends).

## Decision log
- 2026-10-19 — Plain CommonJS JS (require) to match the quickstart; Node 22.
- 2026-10-19 — Tunnel first, then create the stream, then run with publicUrl: the signed URL must match exactly, so the tutorial sets publicUrl from the start.
- 2026-10-19 — gather({ maxDigits: 1 }) so pressing 0 resolves at once (without it, gather waits for the timeout after each digit).
- 2026-10-19 — Needs a real number: streams have no browser test call. Number step in Dashboard + CLI tabs.
- 2026-10-19 — 'What just happened' section holds the explanation and the diagram, after the success.

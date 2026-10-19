# Docs checkpoint — streams/bring-your-app

Started: 2026-10-19
Current stage: 7 — Wire (listed in report; lead wires docs.json)

**Purpose:** A developer with a Twilio Media Streams or Pipecat bot runs it unchanged on Fonoster: what works, what doesn't (TwiML, speech layer, call control), creating a protocol twilio stream, and hanging up from Pipecat.

**Diátaxis type:** how-to
**Reader:** developers building their own stream (WebSocket server)

**Placement:** new `docs-site/streams/bring-your-app.mdx` · slug `streams/bring-your-app` · nav group `Streams`

**Sources:**
- docs/migrating-to-sessions.md §4; docs/session-protocol.md (Twilio protocol)
- openspec/specs/twilio-media-streams-flavor/spec.md
- mods/appbridge/src/protocols/twilio.ts, http/hangupEndpoint.ts, Gateway.ts, config.ts, session/Call.ts, apps/AppStore.ts (workspaceRef = accessKeyId)
- python/pipecat-golden/{golden_bot.py,README.md}; pipecat-ai 1.12.0 serializers/twilio.py and runner/utils.py (uv cache)
- ops/rebuild/config/gateway.yaml

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | code wins over docs/*.md drafts |
| 2 | Place | done | MENU path |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | skipped | how-to, no picture needed |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334, headings present |
| 7 | Wire | done | reported to lead |

## Unverified
- auto_hang_up=False path: call ends when Pipecat closes the socket (golden test covers it; not run here).
- Hang-up endpoint availability and base URL on Fonoster Cloud.
- Default auto_hang_up=True with Twilio creds: Twilio 404, call still ends on socket close.

## Decision log
- 2026-10-19 — Recommend auto_hang_up=False + socket close: works on every install; Pipecat's BasicAuth(account_sid, ...) can't pass Cloud's API-key check.
- 2026-10-19 — Self-hosted endpoint in an Accordion, short, with the accountSid = workspace access key ID constraint.
- 2026-10-19 — Pipecat snippet stops at transport setup; pipeline is the reader's own.

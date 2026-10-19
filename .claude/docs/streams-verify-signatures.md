# Docs checkpoint — streams/verify-signatures

Started: 2026-10-19
Current stage: 7 — Wire (listed in report; lead wires docs.json)

**Purpose:** Every stream server must check that connections come from Fonoster. The page lists the x-fonoster-* headers, what the Node and Python SDKs check, how to use their helpers in your own server, manual verification in any language, and rotating the secret.

**Diátaxis type:** how-to
**Reader:** developers building their own stream (WebSocket server)

**Placement:** new `docs-site/streams/verify-signatures.mdx` · slug `streams/verify-signatures` · nav group `Streams`

**Sources:**
- mods/voice/src/{signature,VoiceServer,Session}.ts; python/fonoster-voice/src/fonoster/voice/{signature,server}.py
- mods/appbridge/src/signing.ts, session/connectApp.ts, session/Listener.ts (headers always sent with app binding)
- docs/migrating-to-sessions.md §2-3; docs/session-protocol.md
- mods/ctl/src/commands/applications/rotate-secret.ts; mods/sdk/src/Applications.ts (rotateSigningSecret); applications.proto RotateSigningSecret
- mods/dashboard/src/session/{streams,stream-detail}.tsx (Advanced tab, Rotate secret, Rotate now); appModel.ts secretHint

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
- The combined manual verify() samples were written for this page (based on the migrating doc), not run.

## Decision log
- 2026-10-19 — Header names lowercase (as Node sees them); the gateway sends them capitalized; HTTP headers are case-insensitive.
- 2026-10-19 — Python tab states plainly it doesn't check the app signature.
- 2026-10-19 — Troubleshooting table maps the SDKs' missing/stale/mismatch reasons.

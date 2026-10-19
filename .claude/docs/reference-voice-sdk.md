# Docs checkpoint — reference/voice-sdk

Started: 2026-10-19
Current stage: 7 — Wire (listed in report; lead wires docs.json)

**Purpose:** Every VoiceServer option, Session property, method, event, error and signature helper of `@fonoster/voice` and `fonoster-voice`, Node and Python names side by side. Agrees with streams/voice-sdk, streams/python and streams/verify-signatures.

**Diátaxis type:** reference
**Reader:** developers writing a stream

**Placement:** new `docs-site/reference/voice-sdk.mdx` · nav group `Reference`

**Sources:**
- mods/voice/src/{VoiceServer,Session,signature,types,errors}.ts
- python/fonoster-voice/src/fonoster/voice/{server,session,signature,errors,__init__}.py, pyproject.toml
- docs/voice-sdk.md (draft; code wins)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | server, properties, methods, events, errors, helpers |
| 4 | Assets | skipped | reference page |
| 5 | Draft | done | |
| 6 | Proof | done | 200 on :3334 |
| 7 | Wire | done | reported |

## Unverified
- Python websockets' answer to plain HTTP (page only states Node's 426).

## Decision log
- 2026-10-19 — `note()` / `record.note` left out: marked internal in both SDKs.
- 2026-10-19 — Python gaps stated plainly (no listen(), requireAppBinding, app-bound helper); queued as open questions.

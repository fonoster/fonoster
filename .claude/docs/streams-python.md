# Docs checkpoint — streams/python

Started: 2026-10-19
Current stage: 7 — Wire (listed in report; lead wires docs.json)

**Purpose:** A Python developer puts their asyncio code on calls: install fonoster-voice, run VoiceServer or mount voice_asgi_app in FastAPI, stream LLM tokens into say(), handle barge-in, events and errors.

**Diátaxis type:** how-to
**Reader:** developers building their own stream (WebSocket server)

**Placement:** new `docs-site/streams/python.mdx` · slug `streams/python` · nav group `Streams`

**Sources:**
- python/fonoster-voice/src/fonoster/voice/{server,session,signature,errors,__init__}.py; examples/*.py; tests/test_server.py; pyproject.toml; README.md
- docs/voice-sdk.md

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
- PyPI availability and version of fonoster-voice (pyproject says 0.27.0).
- FastAPI Mount + voice_asgi_app signature check without public_url (root_path + path may double the prefix). Page says always set public_url.
- The OpenAI streaming snippet is standard openai-python v1 usage, not tested here.

## Decision log
- 2026-10-19 — Assumes a stream exists; links to the tutorial for creating one and tunneling.
- 2026-10-19 — Options table for VoiceServer from the constructor; Node vs Python diff table instead of a full method list (reference/voice-sdk owns that).
- 2026-10-19 — Didn't document voice_asgi_app's verify_signature_ kwarg (odd name; open question).

# Docs checkpoint — introduction

Started: 2026-10-19
Current stage: 7 — Wire (awaiting owner nod)

**Purpose:** A developer lands here first and wants to know what Fonoster is and which way to build. They leave knowing the two paths (Autopilot or Streams), that telephony is shared underneath, and where to start.

**Diátaxis type:** explanation
**Reader:** developers new to Fonoster

**Detected surfaces:** Mintlify: yes, docs-site/ · Pencil: yes (designs/docs.pen, busy) · OpenSpec: yes

**Placement:** update of `docs-site/introduction.mdx` · slug `introduction` · nav group `Get started`

**Sources:**
- README.md (tagline, Cloud or self-hosted)
- docs/voice-sdk.md (transfers cold/warm/refer, DTMF)
- docs/call-records.md (signed vCon with transcript and recording, consent)
- docs/webhooks.md (call.started / call.ended)
- python/fonoster-voice, python/pipecat-golden (Python SDK, Pipecat)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | combined gate with outline |
| 1 | Source | done | |
| 2 | Place | done | already in nav |
| 3 | Outline | done | approved 2026-10-19 |
| 4 | Assets | skipped | Pencil busy; TODO banner `images/introduction/banner-{light,dark}.png` |
| 5 | Draft | done | |
| 6 | Proof | done | only broken links: /quickstart, /concepts/how-fonoster-works (next pages) |
| 7 | Wire | in-progress | renders on :3334 |

## Decision log

- 2026-10-19 — The Streams card points to how-fonoster-works for now; repoint it to /streams/voice-sdk once that page exists.
- 2026-10-19 — Checkpoint created.

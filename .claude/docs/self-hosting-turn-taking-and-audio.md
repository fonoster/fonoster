# Docs checkpoint — self-hosting-turn-taking-and-audio

Started: 2026-10-19
Current stage: 7 — Wire (lead wires docs.json)

**Purpose:** An operator sets the install's and a workspace's default recording policy and the
consent prompt, and learns which turn detector and audio processing their calls use. Developer
pages (autopilot/turn-taking, telephony/recording) link here.

**Diátaxis type:** how-to
**Reader:** self-hosters (Compose)

**Placement:** new `self-hosting/turn-taking-and-audio` · nav group `Operate` (Self-hosting tab)

**Sources:**
- `mods/appbridge/src/config.ts` (recordingPolicy, callRecord.workspaces, consentPrompt), `configSchema.ts`
- `mods/appbridge/src/apps/AppStore.ts` (database apps never get `speech.detector`)
- `mods/appbridge/src/turn/createDetector.ts`, `BackchannelDetector.ts`, `SttTurnDetector.ts`, `remote.ts`
- `mods/appbridge/src/session/Call.ts` (consent prompt, filters), `docs/turn-taking.md`, `docs/operators/audio-filters.md`
- `ops/bundle/config/gateway.example.yaml`, `mods/dashboard/src/settings/general.tsx` (Access key ID)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | |
| 4 | Assets | pending | `turn-taking-and-audio/recording-precedence` queued |
| 5 | Draft | done | |
| 6 | Proof | done | curl 200 on :3334 |
| 7 | Wire | pending | lead |

## Unverified
- Workspace and install recording defaults not tested on a live call.

## Decision log
- 2026-10-19 — Detector: the code reads `speech.detector` only for YAML apps (`appStore.source: yaml`); Compose uses database apps, so every app gets `baseline`. The page says so and shows the detector table without a how-to (no install-wide setting exists; MENU forbids promising per-app detectors).
- 2026-10-19 — Audio filters: aiCoustics isn't in the 0.30 gateway image and the API can't set `filters`, so the page says no filters run in this release.
- 2026-10-19 — Kept the replay tool out (needs a source checkout; Hacking tab).

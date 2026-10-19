# Docs checkpoint — migrate-from-0-27

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A developer with apps, agents, scripts or Voice SDK code from ≤0.27 needs to know exactly what to rename or remove for 0.30. Operator steps (fonoster.yaml, repointing numbers) go to self-hosting/upgrade-from-0-27.

**Diátaxis type:** how-to
**Reader:** developers upgrading from 0.27

**Placement:** new `docs-site/migrate-from-0-27.mdx` · nav group `Get started`

**Sources:**
- mods/apiserver/src/applications/session/appModel.ts (EXTERNAL→STREAM, native→fonoster, flavor errors; zod strips endpoint/textToSpeech/speechToText silently)
- mods/common/src/assistants/sessionAssistantSchema.ts (removed: provider, apiKey, baseUrl, vad, maxSpeechWaitTimeout, eventsHook, audioFilters; patience)
- mods/ctl/src/utils/applicationRequest.ts, applicationFlags.ts (--assistant, --flavor hidden with errors; `assistant` file key)
- mods/common/src/webhooks/events.ts, Dispatcher.ts (retired event names refused with replacement)
- mods/voice/src/Session.ts, VoiceServer.ts, index.ts (named export, signingSecret/APP_SIGNING_SECRET, hold/resume, transfer modes)
- docs/migrating-to-sessions.md, docs/release-notes-sessions.md; legacy/concepts/programmable-voice.mdx, autopilot.mdx (0.27 shapes)
- ops/bundle/config/catalog.yaml (llama-3.3-70b retired → groq/openai/gpt-oss-120b)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | |
| 4 | Assets | skipped | none needed |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 |
| 7 | Wire | done | |

## Unverified
- On Fonoster Cloud, stored agents/numbers were already converted (from the cutover job note in sessionAssistantSchema and migrating-to-sessions "Autopilot: nothing").
- Whether --assistant/--flavor existed in 0.27 itself or only in pre-0.30 builds.
- The 0.27 Voice SDK example (`res.answer()`, `req.ingressNumber`) is from docs/migrating-to-sessions.md, not checked against the 0.27 tag.
- Call ref format (left as `<callRef>` in the records:download example).

## Decision log
- 2026-10-19 — audioFilters: schema message says "part of the app's configuration" but the app model has no such field; page says "Removed" with no per-agent setting. Owner to confirm.
- 2026-10-19 — Operator-only changes (fonoster.yaml keys, repointNumbersCli) left to self-hosting/upgrade-from-0-27.

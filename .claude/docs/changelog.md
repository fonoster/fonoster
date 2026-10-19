# Docs checkpoint — changelog

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** Top-level changelog, v0.30 onward. One <Update> for v0.30 with breaking changes, new features by docs group, and a self-hosting pointer; links to migrate-from-0-27.

**Diátaxis type:** reference
**Reader:** developers building on Fonoster

**Placement:** new `docs-site/changelog.mdx` · slug `changelog` · nav group `Changelog`

**Sources:**
- docs/release-notes-sessions.md
- mods/voice/src/Session.ts, package.json (verbs, alias files)
- mods/common/src/assistants/sessionAssistantSchema.ts, mods/apiserver/src/applications/session/appModel.ts
- mods/apiserver/src/records/createRecordsRouter.ts (recording route)
- docs-site pages for each feature
- Mintlify local build: frontmatter rss is supported

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | skipped | reference page, no picture needed |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | nav entry listed in report; docs.json not edited |

## Unverified
- Release date (used 'October 2026').
- Python SDK parity claim taken from the release notes.

## Decision log
- 2026-10-19 — Developer-facing; dropped NATS, env-fallback and service-name details from the draft and pointed self-hosters to upgrade-from-0-27.
- 2026-10-19 — Added features shipped in 0.30 but missing from the draft (webhooks, call records, AMD, catalog, BYO keys).

# Docs checkpoint — self-hosting-overview

Started: 2026-10-16
Current stage: 7 — Wired (awaiting owner nod)

**Purpose:** Someone who opens the Self-hosting tab learns in one short read what self-hosting
Fonoster means and whether the section is for them: what they run, what's left out on purpose,
and where to start.

**Diátaxis type:** explanation
**Reader:** developers and operators landing on the Self-hosting tab

**Detected surfaces:** Mintlify: yes, `docs-site/` · Pencil: yes (`designs/docs.pen`, banner) · OpenSpec: yes

**Placement:** update of `self-hosting/overview` (placeholder) · nav group `Start` (Self-hosting tab)

**Sources:**
- `ops/bundle/compose.yaml` (default services), `docs-site/self-hosting/install-compose.mdx`
- `docs-site/CLAUDE.md` (three readers, one tab each)
- `mods/dashboard/src/session/vendor-keys.tsx` ("Vendor keys")
- Owner decisions 2026-10-15/16: ClickHouse, observability and the regions hub are documented integrations, not in the bundle

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | approved together with the outline (owner: keep it light) |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | approved |
| 4 | Assets | skipped | banner already present |
| 5 | Draft | done | |
| 6 | Proof | done | no broken links, renders |
| 7 | Wire | done | already in nav as "Overview" |

## Decision log

- 2026-10-16 — Integration pages are mentioned without links until they exist (ClickHouse, telemetry, host private regions).
- 2026-10-16 — Checkpoint created; frame + outline approved in one gate.

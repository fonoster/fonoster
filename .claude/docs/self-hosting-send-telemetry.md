# Docs checkpoint — self-hosting-send-telemetry

Started: 2026-10-25
Current stage: 7 — Wire (done)

**Purpose:** A self-hoster who wants to see what their install is doing arrives here; they leave
with every service, Routr included, sending traces, metrics and logs to a Grafana they run, and
know how to find one call by its call ref or SIP Call-ID.

**Diátaxis type:** how-to
**Reader:** Self-hosting (operators of a Compose install)

**Detected surfaces:** Mintlify: yes, docs-site · Pencil: yes (not used) · OpenSpec: yes

**Placement:** update of docs-site/self-hosting/send-telemetry.mdx · slug `send-telemetry` · nav group Self-hosting (already wired)

**Sources:** (every claim traces to one of these)
- openspec/changes/observability-through-routr (spec delta)
- ops/bundle/compose.yaml (OTEL_* passed to routr)
- mods/appbridge/src/session/Call.ts, mods/appbridge/src/main.ts (AppBridge signals)
- fonoster/roomr feat/otel-logs: internal/telemetry/telemetry.go, internal/node/call.go, control.go
- fonoster/routr feat/otel-telemetry: mods/common/src/tracer.ts, mods/edgeport/.../telemetry/Telemetry.java
- grafana/otel-lgtm 0.38.0 (Docker Hub)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | owner approved |
| 1 | Source | done | code written in this change |
| 2 | Place | done | update in place |
| 3 | Outline | done | owner approved |
| 4 | Assets | skipped | no visual needed |
| 5 | Draft | done | |
| 6 | Proof | done | queries verified on otel-lgtm 0.38.0; no broken links; renders |
| 7 | Wire | done | already in docs.json under Self-hosting |

## Decision log

- 2026-10-25 — Proofed on the e2e stack: Tempo, Loki and Prometheus queries return the call; Loki example widened to every fonoster-* service; error-span search added.
- 2026-10-25 — Draft written; queries pending verification against otel-lgtm 0.38.0.
- 2026-10-25 — Outline approved: Grafana recipe replaces the console collector; Find a call; Spot dropped SIP messages.
- 2026-10-25 — Frame approved: one how-to, update in place. Owner: backend in docs only, no bundled profile.

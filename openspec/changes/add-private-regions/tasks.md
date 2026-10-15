> Spec drafted 2026-10-15 with the owner's decisions (PR-1..PR-5); PR-6..PR-8 are proposed defaults.

## 1. Specs and designs

- [x] 1.1 Resolve open questions (PR-9 Autopilot in the cell, PR-10 one public region, PR-11 flat fee)
- [x] 1.2 Dashboard designs (designs/dashboard.pen, row "Regions" at y=14000; no Degraded frame or re-issue dialog yet): new-workspace region picker, private region setup (token + install), Region page (status, version, nodes, re-issue, disconnect), Secrets page for private workspaces, call view via relay, offline banner
- [ ] 1.3 Conformance scenarios for enrollment, revocation, relay and status

## 2. Control plane

- [x] 2.1 `Workspace.region` (immutable), default public region migration for existing workspaces
- [x] 2.2 Region records, enrollment token issuing (ES256 JWT, single use, 24 h) and the enrollment endpoint
- [x] 2.3 NATS leaf-node accounts/credentials scoped to `region.<id>.>`, revocation
- [x] 2.4 Config sync publisher per region; pause on unsupported versions
- [x] 2.5 Content relay (streamed, access-checked, size/rate limited)
- [x] 2.6 Heartbeat consumer and region status
- [ ] 2.7 Region endpoints: store `region.endpoints` from cells, configured endpoints for public regions, expose in GetRegion

## 3. Cell

- [x] 3.1 `fonoster-region enroll <token>` and credential storage (file or Kubernetes Secret); Compose and Helm wiring
- [x] 3.2 Local secret store and `fonoster-region secrets set/list`; report set names in heartbeats
- [x] 3.3 Config sync consumer; relay responder with audit; heartbeat publisher
- [x] 3.4 Webhook delivery from the cell
- [x] 3.6 Report endpoints (SIP host/port/transport, public signaling and media addresses, RTP range) on connect and on change
- [x] 3.5 Hosted Autopilot in the cell's Compose/Helm; assistant sync; LLM keys from the cell's secrets

## 4. Dashboard and billing

- [ ] 4.6 Connection details in Settings → Region, the trunk form and SIP user settings

- [x] 4.1 Region picker in "New workspace" with confirm step (region is permanent)
- [x] 4.2 Private region setup page and Region page
- [ ] 4.3 Secrets page for private workspaces (done); app warnings for missing keys (open)
- [x] 4.4 Call content through the relay; offline states
- [ ] 4.5 Flat fee per private region in billing; usage shown, not billed (SaaS only) (partial: note in Settings → Region, no Billing page yet; see RU-B7)

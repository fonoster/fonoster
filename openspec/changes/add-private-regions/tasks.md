> Spec drafted 2026-10-15 with the owner's decisions (PR-1..PR-5); PR-6..PR-8 are proposed defaults.

## 1. Specs and designs

- [x] 1.1 Resolve open questions (PR-9 Autopilot in the cell, PR-10 one public region, PR-11 flat fee)
- [ ] 1.2 Dashboard designs: new-workspace region picker, private region setup (token + install), Region page (status, version, nodes, re-issue, disconnect), Secrets page for private workspaces, call view via relay, offline banner
- [ ] 1.3 Conformance scenarios for enrollment, revocation, relay and status

## 2. Control plane

- [ ] 2.1 `Workspace.region` (immutable), default public region migration for existing workspaces
- [ ] 2.2 Region records, enrollment token issuing (ES256 JWT, single use, 24 h) and the enrollment endpoint
- [ ] 2.3 NATS leaf-node accounts/credentials scoped to `region.<id>.>`, revocation
- [ ] 2.4 Config sync publisher per region; pause on unsupported versions
- [ ] 2.5 Content relay (streamed, access-checked, size/rate limited)
- [ ] 2.6 Heartbeat consumer and region status

## 3. Cell

- [ ] 3.1 `fonoster-region enroll <token>` and credential storage (file or Kubernetes Secret); Compose and Helm wiring
- [ ] 3.2 Local secret store and `fonoster-region secrets set/list`; report set names in heartbeats
- [ ] 3.3 Config sync consumer; relay responder with audit; heartbeat publisher
- [ ] 3.4 Webhook delivery from the cell
- [ ] 3.5 Hosted Autopilot in the cell's Compose/Helm; assistant sync; LLM keys from the cell's secrets

## 4. Dashboard and billing

- [ ] 4.1 Region picker in "New workspace" with confirm step (region is permanent)
- [ ] 4.2 Private region setup page and Region page
- [ ] 4.3 Secrets page for private workspaces; app warnings for missing keys
- [ ] 4.4 Call content through the relay; offline states
- [ ] 4.5 Flat fee per private region in billing; usage shown, not billed (SaaS only)

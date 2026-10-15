> Spec drafted 2026-10-15 with the owner's decisions (PR-1..PR-5); PR-6..PR-8 are proposed defaults.

## 1. Specs and designs

- [x] 1.1 Resolve open questions (PR-9 Autopilot in the cell, PR-10 one public region, PR-11 flat fee)
- [x] 1.2 Dashboard designs (designs/dashboard.pen, row "Regions" at y=14000; no Degraded frame or re-issue dialog yet): new-workspace region picker, private region setup (token + install), Region page (status, version, nodes, re-issue, disconnect), Secrets page for private workspaces, call view via relay, offline banner
- [ ] 1.3 Conformance scenarios for enrollment, revocation, relay and status (partial: covered by mods/region-agent/test and mods/apiserver/test/regions; no scenario files)

## 2. Control plane

- [x] 2.1 `Workspace.region` (immutable), default public region migration for existing workspaces
- [x] 2.2 Region records, enrollment token issuing (ES256 JWT, single use, 24 h) and the enrollment endpoint
- [x] 2.3 NATS leaf-node accounts/credentials scoped to `region.<id>.>`, revocation
- [x] 2.4 Config sync publisher per region; pause on unsupported versions
- [x] 2.5 Content relay (streamed, access-checked, size/rate limited)
- [x] 2.6 Heartbeat consumer and region status
- [x] 2.7 Region endpoints: store `region.endpoints` from cells, configured endpoints for public regions, expose in GetRegion

## 3. Cell

- [x] 3.1 `fonoster-region enroll <token>` and credential storage (file or Kubernetes Secret); Compose and Helm wiring
- [x] 3.2 Local secret store and `fonoster-region secrets set/list`; report set names in heartbeats
- [x] 3.3 Config sync consumer; relay responder with audit; heartbeat publisher
- [x] 3.4 Webhook delivery from the cell
- [x] 3.6 Report endpoints (SIP host/port/transport, public signaling and media addresses, RTP range) on connect and on change
- [x] 3.5 Hosted Autopilot in the cell's Compose/Helm; assistant sync; LLM keys from the cell's secrets

## 4. Dashboard and billing

- [x] 4.6 Connection details in Settings → Region, the trunk form and SIP user settings

- [x] 4.1 Region picker in "New workspace" with confirm step (region is permanent)
- [x] 4.2 Private region setup page and Region page
- [x] 4.3 Secrets page for private workspaces; app warnings for missing keys (AD-B1)
- [x] 4.4 Call content through the relay; offline states
- [ ] 4.5 Flat fee per private region in billing; usage shown, not billed (SaaS only) (partial: note in Settings → Region, no Billing page yet; see RU-B7)

## 5. Rework to the decisions of 2026-10-15 evening (PR-12..PR-21)

- [x] 5.1 Regions belong to a user (private) or the platform (public); id, display name, SIP domain; owner backfill for old private regions; `default` id and workspace migration
- [x] 5.2 User Region API (create, list, get, update, re-issue, disconnect, delete) and CreateWorkspace `region` = an offered public id or one of the caller's private regions
- [x] 5.3 Admin API on the operator key (create, list, token, publish, revoke public regions); configured public regions as the fallback
- [x] 5.4 Multi-workspace sync: snapshots keyed by workspace, secrets.needed per workspace, index/usage/relay checked against the region's workspaces
- [x] 5.5 Bring-your-own keys in public regions over the link (`region.R.secrets.get`), per call, gateway key source in the cell
- [x] 5.6 Routr domains under the region's SIP domain; sipDomain in endpoints
- [x] 5.7 `fonoster-regions` ops utility (cloud `create|list|token|publish|revoke`, region `enroll|secrets|status|run`; `fonoster-region` deprecated alias)
- [x] 5.8 Spec, contract, local stack (operator key, `default`) and cell packaging updated
- [x] 5.9 Helm value for `workspaceKeysFromCloud` (public regions on Kubernetes)

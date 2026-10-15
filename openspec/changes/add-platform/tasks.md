> Build approved 2026-10-15.

## 1. Conformance assets

- [ ] 1.1 Control-plane suite: stateless replicas, cross-replica call control, replica loss, least-loaded placement, no-capacity error
- [ ] 1.2 Bus suite: queue-group single processing, registry survival, no audio on NATS
- [ ] 1.3 Observability suite: OTLP from every service, `fonoster.call_ref` on every call signal, default profile end to end
  - Default profile checked end to end by hand on Compose (HE-B9); no automated suite yet.
- [ ] 1.4 Deployment suite: nightly e2e on Compose and Helm, release gate, `.env` ignored, `secret://` resolution
  - `mods/conformance/test/deployment.test.ts`: Helm lint/template and rendered configs loaded with `secret://` resolved (HE-B6). Missing: nightly e2e, release gate, `.env` check.
- [ ] 1.5 Regions suite: cell registration with token, outbound-only leaf link with TLS, data and keys stay in the cell, control-plane outage behavior

## 2. Implementation

- [ ] 2.1 New gateway package; move `mods/apiserver/src/voice/{stt,tts,filters}` into it
- [ ] 2.2 Strip ARI, AudioSocket and speech from the apiserver; keep management gRPC, Identity, `GetCapabilities`, call creation and webhooks
- [x] 2.3 Session registry (JetStream KV) keys for calls, rooms, nodes and gateways; least-loaded placement
  - One bucket `fonoster_sessions` with leases; nodes/rooms from the media node, calls/gateways from the gateway; placement reads it at start (HD-B3).
- [ ] 2.4 NATS subjects and queue groups for `media-control`, events and webhook dispatch
- [x] 2.5 OTel SDK in every service with `fonoster.call_ref` propagation; OTLP config in each YAML
  - Gateway, media node, Autopilot (PL-B3..B5); apiserver, region agent and the registry utility (HE-B8); traceparent over NATS (HE-B9). OTLP settings are the standard `OTEL_*` environment, not a YAML key (PL-B3).
- [ ] 2.6 Default observability profile (Grafana, Tempo, Loki, Prometheus) for Compose and Helm
  - Compose profile `observability` is written and validated with `docker compose config`; not brought up end to end, and no Helm equivalent yet (PL-B6).
  - Compose profile brought up and verified end to end (Tempo, Loki, Prometheus; HE-B9). Helm `observability.enabled` / `values-observability.yaml` written and render-tested, not installed on a cluster (HE-B7).
- [ ] 2.7 Helm chart for all deployables; Compose updated (Asterisk and InfluxDB removed, NATS JetStream and leaf nodes, optional ClickHouse)
  - `ops/rebuild/compose.yaml` and `ops/rebuild/helm/fonoster-rebuild` (gateway and media node, `helm lint` clean). Missing: apiserver, dashboard and Autopilot in the chart, ClickHouse, the root `compose.yaml` migration.
  - Compose now runs the whole platform with the control plane (apiserver, Envoy, dashboard, fakes, caller bot; appsync removed in FN-B1) and `ops/rebuild/stack` brings it up, seeds it and smoke-tests a call (ST-B1..B9). Helm still lacks the control plane.
  - Helm now has every deployable: apiserver + migrations Job, Envoy, dashboard, Autopilot, NATS + region hub, optional Postgres/MinIO (`values-cloud.yaml`, HE-B1..B5). Still missing: ClickHouse, the root `compose.yaml` migration, a cluster smoke install (HE-B7).
- [x] 2.8 Region tokens, cell registration and config sync (numbers, apps, catalog) over the leaf node
  - Built and tested in add-private-regions (tasks 2.2–2.4, 3.1, 3.3); the chart wires the region hub (HE-B1).
- [x] 2.9 Call-record index entries from cells; dashboard fetches private-cell records from the cell
  - Built and tested in add-private-regions (tasks 2.5, 3.3, 4.4: index forwarding, relay, call view).

## 3. Migration and docs

- [x] 3.1 Operator guide: deployables, ports, one YAML per service, `secret://` references
  - `docs/operators/rebuild.md` covers ports, RTP ranges, drain, limits, regions, Helm; `secret://` resolution is not implemented, so it is not documented.
  - Now documents `secret://` (HE-B2) and the cloud Helm install.
- [x] 3.2 Private-region guide: install with Compose or Helm, region token, firewall rules, upgrades, supported version window
  - `docs/operators/private-region.md` (firewall and upgrades sections added by the helm stream).
- [x] 3.3 Observability guide: OTLP endpoints, default profile, following a call by `fonoster.call_ref`
- [x] 3.4 Upgrade notes: apiserver loses voice code; new gateway and media node deployables; D9 softened to customer-operated cells
  - `docs/release-notes-sessions.md`, "Deployables and operations".
- [x] 3.5 Try-it guide: `docs/try-the-new-platform.md` (one-command local stack, seed, softphone, call records, vendor keys)

## 4. Hardening (from the review, RV-B6/RV-B7)

- [x] 4.1 NATS users and subject ACLs per service (gateway, media node, apiserver, autopilot, Routr): today any client on the NATS network can publish index entries, maintenance requests and media-control commands
  - Compose, cell and Helm; Autopilot has no NATS connection; `_INBOX.>` still shared (HD-B1).
- [x] 4.2 mTLS between Routr and the media nodes (the trusted-source allowlist, RV-B7, is the interim check)
  - Node side and Helm wiring (HD-B2); Routr's client certificate is configured in Routr.

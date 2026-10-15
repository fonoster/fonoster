> Build approved 2026-10-15.

## 1. Conformance assets

- [ ] 1.1 Control-plane suite: stateless replicas, cross-replica call control, replica loss, least-loaded placement, no-capacity error
- [ ] 1.2 Bus suite: queue-group single processing, registry survival, no audio on NATS
- [ ] 1.3 Observability suite: OTLP from every service, `fonoster.call_ref` on every call signal, default profile end to end
- [ ] 1.4 Deployment suite: nightly e2e on Compose and Helm, release gate, `.env` ignored, `secret://` resolution
- [ ] 1.5 Regions suite: cell registration with token, outbound-only leaf link with TLS, data and keys stay in the cell, control-plane outage behavior

## 2. Implementation

- [ ] 2.1 New gateway package; move `mods/apiserver/src/voice/{stt,tts,filters}` into it
- [ ] 2.2 Strip ARI, AudioSocket and speech from the apiserver; keep management gRPC, Identity, `GetCapabilities`, call creation and webhooks
- [ ] 2.3 Session registry (JetStream KV) keys for calls, rooms, nodes and gateways; least-loaded placement
- [ ] 2.4 NATS subjects and queue groups for `media-control`, events and webhook dispatch
- [ ] 2.5 OTel SDK in every service with `fonoster.call_ref` propagation; OTLP config in each YAML
  - Built for gateway, media node and the Autopilot session engine (PL-B3..B5); the apiserver and the registry utility are not instrumented yet.
- [ ] 2.6 Default observability profile (Grafana, Tempo, Loki, Prometheus) for Compose and Helm
  - Compose profile `observability` is written and validated with `docker compose config`; not brought up end to end, and no Helm equivalent yet (PL-B6).
- [ ] 2.7 Helm chart for all deployables; Compose updated (Asterisk and InfluxDB removed, NATS JetStream and leaf nodes, optional ClickHouse)
  - `ops/rebuild/compose.yaml` and `ops/rebuild/helm/fonoster-rebuild` (gateway and media node, `helm lint` clean). Missing: apiserver, dashboard and Autopilot in the chart, ClickHouse, the root `compose.yaml` migration.
  - Compose now runs the whole platform with the control plane (apiserver, Envoy, dashboard, appsync, fakes, caller bot) and `ops/rebuild/stack` brings it up, seeds it and smoke-tests a call (ST-B1..B9). Helm still lacks the control plane.
- [ ] 2.8 Region tokens, cell registration and config sync (numbers, apps, catalog) over the leaf node
- [ ] 2.9 Call-record index entries from cells; dashboard fetches private-cell records from the cell

## 3. Migration and docs

- [ ] 3.1 Operator guide: deployables, ports, one YAML per service, `secret://` references
  - `docs/operators/rebuild.md` covers ports, RTP ranges, drain, limits, regions, Helm; `secret://` resolution is not implemented, so it is not documented.
- [ ] 3.2 Private-region guide: install with Compose or Helm, region token, firewall rules, upgrades, supported version window
- [x] 3.3 Observability guide: OTLP endpoints, default profile, following a call by `fonoster.call_ref`
- [ ] 3.4 Upgrade notes: apiserver loses voice code; new gateway and media node deployables; D9 softened to customer-operated cells
- [x] 3.5 Try-it guide: `docs/try-the-new-platform.md` (one-command local stack, seed, softphone, call records, vendor keys)

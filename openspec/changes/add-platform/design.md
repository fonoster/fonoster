## Context

Today Fonoster ships three deployables (apiserver with Identity embedded, autopilot, dashboard)
next to third-party containers (Routr, Asterisk, RTPEngine, Postgres, InfluxDB, NATS). The
apiserver also drives Asterisk over ARI, terminates AudioSocket on the node that received the
call, and runs STT, TTS and audio filters in `mods/apiserver/src/voice`. NATS subjects have no
queue groups, so running several apiserver replicas duplicates work. Config moved to per-service
YAML on `next` (`unified-service-config`), and secrets may be referenced with `secret://` (D8).

The rebuild specs above the media node (`add-voice-session-gateway`, `add-media-node`,
`add-call-record`, `add-provider-registry`, `add-workspace-webhooks`) assume a control plane,
an internal bus, cells and observability. This change pins those down.

Decisions referenced from earlier planning: D3 (session registry in NATS JetStream KV), D4
(ClickHouse analytics, optional in Community), D8 (`secret://` references), D9 (private-region
boundary), MN13 (gateway audio is RTP).

## Goals / Non-Goals

**Goals:**
- Every deployable scales horizontally and is a plain container.
- One internal bus, one correlation id (the call ref), one config file per service.
- Private regions in v1 without giving us operational access to customer networks.
- Operators can follow one call end to end with standard tools.

**Non-Goals:**
- Live migration of calls between nodes or cells.
- A control plane per region (account data residency per region).
- Remote operation of customer cells by Fonoster.
- Officially tested targets other than Docker Compose and Helm (other container platforms should
  work but are not tested).

## Decisions

**PL1. The VoiceSessionGateway is TypeScript and its own deployable.**
- It reuses the STT/TTS adapters and audio-filter code that live in the apiserver today, and it
  shares a language with Autopilot and the SDK.
- It scales independently. The conformance suite and load test prove it meets the gateway budget
  (T1, T2); it can be rewritten in Go later if the numbers demand it, because the suite is
  language-neutral.
- Rejected: Go as its own deployable (every speech adapter rewritten, two core languages); Go
  inside the media node (the media node stops being barebones and speech vendors sit next to RTP).

**PL2. The apiserver is a pure control plane of N stateless replicas.**
- It serves the management gRPC API (unchanged for users), Identity, `GetCapabilities`, call
  creation and workspace webhook dispatch.
- Call creation picks the least-loaded, non-draining media node from the session registry, using
  the same counts the nodes send to Routr (MN3, MN5).
- It holds no per-call state: everything per call lives in the session registry, so any replica
  serves any request.
- Rejected: splitting into several services now (identity, routing, calls, webhooks); more
  deployables to run and version with no scaling need yet.

**PL3. NATS carries everything internal except audio.**
- `media-control` commands use NATS request and reply. Events use JetStream with queue groups, so
  replicas share work instead of duplicating it. The session registry is a JetStream KV bucket.
  Webhook dispatch is a JetStream consumer.
- Audio between the gateway and the media node is RTP (MN13), never NATS.
- One dependency we already run; NATS leaf nodes also give private cells their link (PL6).
- Rejected: gRPC between services for commands (needs service discovery and node addresses).

**PL4. OpenTelemetry everywhere, bring your own backend.**
- Every service emits OTel traces, metrics and logs. Every span, metric point and log record that
  belongs to a call carries the call ref, so one call can be followed across Routr, the media node,
  the gateway, the app session and the control plane.
- Operators point OTLP at any backend. Compose and Helm include an optional default profile:
  Grafana, Tempo, Loki and Prometheus.
- Rejected: built-in dashboards only (operators would be blind); one vendor (ties self-hosters to
  it).

**PL5. Docker Compose and Helm are both official and tested.**
- Compose for single-machine installs (today's Community path) and a Helm chart for Kubernetes
  (Cloud and larger self-hosts). The e2e suite runs nightly on both.
- Each Fonoster service reads one YAML config file with `secret://` references (D8). Fonoster
  services read no `.env`; third-party containers keep their own configuration.
- Rejected: Helm only (raises the bar for small self-hosters); Compose only (delays Kubernetes).

**PL6. Private regions ship in v1 and are customer-operated.**
- A private region is a cell: Routr, RTPEngine, media nodes, gateways, object storage, the
  analytics store and provider keys on the customer's network.
- The customer installs and upgrades the cell with our Compose or Helm, using a one-time region
  token. We only sync config to the cell: numbers, apps and the provider catalog.
- The cell links outbound-only to our control plane through a NATS leaf node over TLS. No inbound
  port is opened on the customer network.
- Call data (recordings, transcripts, traces, call records) and provider keys never leave the cell.
  The control plane keeps only the call-record index (V2).
- **This softens D9.** D9 said cells are "managed by us"; the owner chose customer-operated
  instead. We sync config; we do not install, upgrade or operate the cell.
- Rejected: Helm plus a region agent that we drive (upgrades pushed by us); full remote operation
  by Fonoster (hard to approve for enterprise security).

**PL7. One global control plane, many cells.**
- One apiserver, Identity and dashboard deployment, with its database, serves every workspace.
- Each of our regions and each private cell runs the data plane. Config and the call-record index
  are central; call data stays in cells.
- The analytics store is ClickHouse, derived from sealed call records, optional in Community (D4).
- Rejected: a control plane per region (stronger account-data residency, but cross-region features
  and a single dashboard get much harder).

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| Customer-operated cells run old versions | A published supported version window; the control plane refuses sync to cells outside it and says why |
| NATS becomes a single point of failure | Clustered NATS with JetStream replication in Helm; Compose documents the single-node limit |
| TypeScript gateway misses the latency or capacity bar | The load test (T1, T2) gates the build; the language-neutral suite allows a Go rewrite |
| OTel volume and cost | Sampling defaults per signal, always keeping traces for failed calls |
| Config sync conflicts between central edits and cell-local edits | Central config is authoritative for synced kinds; cells own only local kinds (see open question) |
| One global control plane is down | Cells keep serving calls with the last synced config; only management changes pause |

## Open Questions

1. **Version skew.** The supported window between the control plane and customer-operated cells
   (for example the current and previous minor release), and what happens outside it.
2. **Config sync conflicts.** Which config kinds a cell may change locally, and how a central edit
   meets a local one.
3. **Cell health visibility.** What a customer-operated cell reports to us (heartbeat, versions,
   capacity, error rates) without sending call data.
4. **Helm chart scope.** Whether the chart installs third-party components (Postgres, NATS,
   ClickHouse, the observability profile) or expects them to exist.
5. **OTel sampling defaults.** Head or tail sampling, the default rates, and which calls are always
   kept.
6. **Region selection for numbers.** How a number is bound to a region or cell, and how outbound
   calls pick a cell.

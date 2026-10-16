## Why

The other rebuild changes specify what happens on a call. This one specifies what holds the
platform together: which deployables exist, how they talk, how operators see them, where they run,
and how a customer runs a private region. Today the apiserver is a monolith that also drives
Asterisk over ARI, terminates AudioSocket and calls speech vendors. That couples scaling of the API
to scaling of media and speech, and it blocks private regions, because call data and provider keys
cannot be kept apart from the account data.

## What Changes

- **The VoiceSessionGateway is its own deployable, written in TypeScript (PL1).** It reuses today's
  STT/TTS adapters and audio-filter code from the apiserver and scales on its own.
- **The apiserver becomes a pure control plane of N stateless replicas (PL2).** It keeps the
  management gRPC API unchanged for users, Identity, `GetCapabilities`, call creation (it picks the
  least-loaded media node from the session registry) and workspace webhook dispatch. **BREAKING
  for operators:** ARI, AudioSocket, STT, TTS and audio filters leave the apiserver.
- **NATS carries everything internal except audio (PL3):** `media-control` request and reply,
  JetStream events with queue groups, the session registry (JetStream KV) and webhook dispatch.
  Audio between the gateway and the media node is RTP (MN13).
- **OpenTelemetry everywhere (PL4).** Every service emits traces, metrics and logs tagged with the
  call ref. Operators bring their own backend; Compose and Helm ship a default Grafana, Tempo,
  Loki and Prometheus profile.
- **Docker Compose and Helm are both official and tested nightly (PL5).** Each Fonoster service
  reads one YAML config with `secret://` references (D8); Fonoster services read no `.env`.
- **Private regions ship in v1, customer-operated (PL6).** The customer installs and upgrades a
  cell with our Compose or Helm. We only sync config (numbers, apps, the catalog). The cell links
  outbound-only to our control plane through a NATS leaf node over TLS. Call data and provider keys
  stay in the cell. This softens decision D9 ("managed by us").
- **One global control plane, many cells (PL7).** Config and the call-record index are central;
  call data lives in cells. The analytics store is ClickHouse, optional in Community (D4).

## Capabilities

### New Capabilities

- `control-plane`: the stateless apiserver, the gateway as a deployable, NATS as the internal bus,
  the session registry and call placement.
- `observability`: OpenTelemetry signals, call-ref correlation and the default backend profile.
- `deployment`: Compose and Helm as official targets, per-service YAML config, nightly e2e on both.
- `regions`: cells, the global control plane, customer-operated private regions and config sync.

### Modified Capabilities

None. (Earlier rebuild changes are not yet archived; this change refers to their capabilities.)

## Impact

- **Code:** `mods/apiserver` (loses `src/voice` media and speech code, keeps management, identity,
  call creation and webhooks), a new gateway package (takes over `src/voice/{stt,tts,filters}`),
  `mods/common` (NATS subjects, registry keys, OTel helpers, config loader), `mods/logger`
  (OTel log export).
- **Deploy:** `compose.yaml` and a new Helm chart; Asterisk and InfluxDB leave the default stack;
  NATS gains JetStream and leaf-node configuration; an optional ClickHouse and an optional
  observability profile are added.
- **Operators:** new deployables (gateway, media node), one YAML file per service, a region token
  for private cells.
- **Depends on:** `add-voice-session-gateway`, `add-media-node`, `add-call-record`,
  `add-provider-registry`, `add-workspace-webhooks`, `add-conformance-framework`.

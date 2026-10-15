# Operating the Fonoster rebuild stack

This guide covers the stack in `ops/rebuild/` (Docker Compose) and `ops/rebuild/helm/fonoster-rebuild`
(Helm): the VoiceSessionGateway, the Go media node, and the services around them. It follows
`openspec/changes/add-platform`.

## What runs

| Service | Image | Role |
| --- | --- | --- |
| `nats` | `nats` | Everything internal except audio: media-control, events, session registry (JetStream KV). |
| `postgres` | `postgres:16` | Routr's database (Routr runs with `START_INTERNAL_DB=false`). |
| `routr` | `fonoster/routr-one` | SIP edge. Nodes register to it with their session count. |
| `rtpengine` | `fonoster/rtpengine` | Carrier-side media relay. |
| `medianode` | `go/medianode/Dockerfile` | Rooms, mixing, RTP. Distroless static binary. |
| `gateway` | `mods/gateway/Dockerfile` | VoiceSessionGateway: speech, turn-taking, app sessions. |
| `autopilot` (profile) | `mods/autopilot/Dockerfile.session` | Hosted Autopilot session engine. |
| `minio` | `minio/minio` | Object storage for recordings and records. |
| `apiserver` | `ops/rebuild/docker/apiserver.Dockerfile` | Control plane API with embedded Identity; applies migrations at start. `mediaService.provider: none` (no Asterisk). |
| `envoy` | `envoyproxy/envoy` | gRPC, gRPC-Web, `/api` and the dashboard on one port (root `config/envoy.yaml`). |
| `dashboard` | `ops/rebuild/docker/dashboard.Dockerfile` | The dashboard, built with this checkout's SDK. |
| `appsync` | apiserver image | Interim: points Autopilot apps at the hosted Autopilot and writes its assistants file. |
| `fakes` (profile) | `ops/rebuild/docker/fakes.Dockerfile` | Fake TTS/STT/LLM for test deployments. |
| `sipcaller` (profile `tools`) | media node image | The SIP caller bot (smoke tests). |
| observability (profile) | otel-collector, prometheus, loki, tempo, grafana | See below. |

Each Fonoster service reads exactly one YAML file and never a `.env` file. The media node is
configured with flags or `MEDIANODE_*` environment variables (a Go binary with no config file).

## Start

To try everything on one machine (generated configs and secrets, seed, smoke test), use
`ops/rebuild/stack up` instead: see `docs/try-the-new-platform.md`. For your own deployment, fill
`ops/rebuild/config/` (`fonoster.yaml`, `gateway.yaml`, `autopilot-session.yaml`, `registry.json`,
`routr-edgeport.yaml`, `integrations.json`, and `keys/` with Identity's RSA pair and the
call-record ES256 key) or point `RB_CONFIG_DIR` at another directory.

```sh
docker compose -f ops/rebuild/compose.yaml up -d --build            # core
docker compose -f ops/rebuild/compose.yaml --profile autopilot up -d # + Autopilot sessions
```

Compose-level knobs (host ports, tags, ranges) are `${VAR:-default}` values in the file:
`RB_NATS_PORT`, `RB_SIP_PORT`, `RB_GATEWAY_PORT`, `RB_NODE_*`, `RTPENGINE_PORT_MIN/MAX`, and so on.
Set `COMPOSE_PROJECT_NAME` to run several stacks on one host.

## Ports

| Port | Proto | Who | Notes |
| --- | --- | --- | --- |
| 4222 | TCP | NATS | Internal; publish only for debugging. 8222 is monitoring (`/healthz`). |
| 7422 | TCP | NATS leaf nodes | Hub side of the regions link (see Regions). Off by default. |
| 5060 | UDP/TCP | Routr | Carrier-facing SIP. |
| 5060 | UDP/TCP | Media node | Internal SIP from Routr; do not expose to the internet. |
| 10000-10100 | UDP | RTPEngine | Carrier-facing media (`RTPENGINE_PORT_MIN/MAX`). Size to your concurrent calls. |
| 30000-30199 | UDP | Media node RTP | `MEDIANODE_RTP_PORT_MIN/MAX`. Two ports per call leg (RTP and the session leg); publish exactly this range. |
| 8080 | TCP | Gateway | Twilio-compatible Calls endpoint when `http` is set in `gateway.yaml`. |
| 4318 | TCP | OTel collector | OTLP/HTTP; observability profile. |
| 3000 | TCP | Grafana | Observability profile. |

### RTP ranges

The media node binds RTP sockets only inside `[rtp-port-min, rtp-port-max]` when both are set
(unset means any ephemeral port, fine for tests only). When the range is exhausted the node refuses
new legs rather than overrun it. Size the range at roughly two ports per concurrent call, then
publish the same range on the container, pod (host network) or firewall. `MEDIANODE_RTP_ADVERTISE`
is the address that goes into SDP; it must be reachable from Routr and RTPEngine. Behind NAT, set
it to the reachable address; on Kubernetes the chart defaults to the node's host IP.

## Encryption switch

The spec (`media-node`, "Optional TLS and SRTP") asks for a per-deployment switch: plain SIP and RTP,
or TLS signaling with SRTP media, and in encrypted mode the node refuses plaintext. That slice is not
implemented in the node yet (the README lists SRTP as a next slice), so there is no switch to flip
today. Until then, keep Routr, RTPEngine and the node on a private network, and put the node's SIP
port behind no public route. When the switch ships it will be a single setting
(`MEDIANODE_ENCRYPTION=required`) mirrored by a `medianode.encryption` chart value.

## Drain and rollout

`SIGTERM` puts the node in drain: it reports itself full (no new rooms; the gateways stop placing
calls on it), keeps existing rooms, and exits when the last room ends or `drain-wait` elapses
(default 10 min, `MEDIANODE_DRAIN_WAIT` or `-drain-wait`), ending whatever is left. The container
runtime must wait at least that long:

- Compose: `stop_grace_period` (`RB_DRAIN_GRACE`, default `10m`).
- Helm: `medianode.drainGraceSeconds` sets both `-drain-wait` and the pod's
  `terminationGracePeriodSeconds` (+15 s slack). Roll nodes one at a time (StatefulSet default).

Gateway replicas are stateless between calls, but a call lives on the replica that claimed it; roll
them one at a time (`gateway.podDisruptionBudget`) and give calls time via
`gateway.terminationGracePeriodSeconds`.

## Limits

| Setting | Default | Flag / env |
| --- | --- | --- |
| Longest call | 4 h | `-max-duration`, `MEDIANODE_MAX_DURATION` (per-app values can be lower) |
| Participants per room | 10 | `-max-participants`, `MEDIANODE_MAX_PARTICIPANTS` |
| Silent caller media timeout | 30 s | `-media-timeout`, `MEDIANODE_MEDIA_TIMEOUT` |
| Heartbeat | 2 s | `-heartbeat` |
| Call claim by a gateway | 500 ms, one retry, then 503 | fixed by the spec |

## Observability

Every service emits OpenTelemetry traces, metrics and logs over OTLP/HTTP when
`OTEL_EXPORTER_OTLP_ENDPOINT` (or a per-signal `OTEL_EXPORTER_OTLP_{TRACES,METRICS,LOGS}_ENDPOINT`)
is set, and is a complete no-op when unset: the service runs and logs to stdout. `OTEL_SERVICE_NAME`
and `OTEL_EXPORTER_OTLP_HEADERS` are honoured; `OTEL_SDK_DISABLED=true` forces it off. The TypeScript
services send OTLP with JSON bodies and the Go node with the standard SDK (HTTP/protobuf); both go to
the collector's HTTP port (4318).

Every call-scoped span, log record and metric carries `fonoster.call_ref`. To follow one call, query
Tempo (`{ span.fonoster.call_ref = "<ref>" }`) and Loki (structured metadata `fonoster_call_ref`).

Default profile:

```sh
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318 \
  docker compose -f ops/rebuild/compose.yaml --profile observability up -d
```

Grafana is on `RB_GRAFANA_PORT` (3000) with Tempo, Loki and Prometheus provisioned. To use your own
backend instead, skip the profile and point `OTEL_EXPORTER_OTLP_ENDPOINT` at it; no Grafana, Tempo,
Loki or Prometheus container runs. With Helm, set `otel.endpoint`.

Metrics: `fonoster.gateway.calls.active`, `fonoster.gateway.calls.total`,
`fonoster.medianode.rooms.active`, `fonoster.medianode.draining`, `fonoster.medianode.calls.incoming`,
`fonoster.autopilot.sessions.total`.

## Regions and cells

One global control plane (apiserver, Identity, dashboard) serves many cells. A cell is the data plane:
Routr, RTPEngine, media nodes, gateways, object storage. This stack is one cell. Cells link to the
control plane only through an **outbound** NATS leaf-node connection over TLS, so a private cell needs
no inbound port other than SIP and RTP from its carriers. Call content (recordings, transcripts,
records, provider keys) stays in the cell; only the call-record index, config and health cross the
link. If the control plane is unreachable, the cell keeps taking calls with its last synced config.

Region tokens and cell registration (task 2.8) are not built yet: `ops/rebuild/config/nats.conf` has
the commented leaf-node block the hub side will use. Upgrades in a private cell are yours; nothing
changes until you roll the images.

## Helm

```sh
helm lint ops/rebuild/helm/fonoster-rebuild
helm install fonoster ops/rebuild/helm/fonoster-rebuild \
  --set nats.url=nats://nats.fonoster:4222 \
  --set medianode.replicas=3 --set medianode.drainGraceSeconds=900 \
  --set medianode.rtp.portMin=30000 --set medianode.rtp.portMax=30199
```

The chart deploys the gateway (Deployment, ConfigMap with `gateway.yaml`, Service, PDB) and the
media node (StatefulSet, host network by default because RTP needs a UDP range, node id = pod name).
NATS, Routr, RTPEngine, Postgres and MinIO come from their own charts. Create the Secret named by
`medianode.routr.passwordSecret` (key `password`) for the nodes' Routr peer.

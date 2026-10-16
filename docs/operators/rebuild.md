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
| `autopilot` (profile) | `mods/autopilot/Dockerfile` | Hosted Autopilot session engine. |
| `minio` | `minio/minio` | Object storage for recordings and records. |
| `apiserver` | `ops/rebuild/docker/apiserver.Dockerfile` | Control plane API with embedded Identity; applies migrations at start. |
| `envoy` | `envoyproxy/envoy` | gRPC, gRPC-Web, `/api` and the dashboard on one port (root `config/envoy.yaml`). |
| `dashboard` | `ops/rebuild/docker/dashboard.Dockerfile` | The dashboard, built with this checkout's SDK. |
| `fakes` (profile) | `ops/rebuild/docker/fakes.Dockerfile` | Fake TTS/STT/LLM for test deployments. |
| `sipcaller` (profile `tools`) | media node image | The SIP caller bot (smoke tests). |

Each Fonoster service reads exactly one YAML file (mounted at `/config/<service>.yaml`) and never a
`.env` file; secrets in it are `${NAME}` placeholders the container's environment fills (Compose
passes `.env` with `env_file`). The media node reads `/config/medianode.yaml` (or `-config <file>`;
see `ops/bundle/config/medianode.example.yaml`); flags win over it, and the `MEDIANODE_*`
variables below still work as a deprecated fallback that logs a warning.

## Start

To try everything on one machine (generated configs and secrets, seed, smoke test), use
`ops/rebuild/stack up` instead: see `docs/try-the-new-platform.md`. For your own deployment, use
the self-host bundle (`ops/bundle/`, `ops/bundle/README.md`): `fonoster-config init` (in
`@fonoster/common`) generates the secrets and keys and renders `config/*.yaml` from
`config/*.example.yaml`, and `fonoster-config check` validates them.

```sh
cd ops/bundle   # or the unpacked release archive
npx -p @fonoster/common fonoster-config init
docker compose up -d                                  # core, dashboard and hosted Autopilot
```

`ops/bundle/compose.yaml` is the one Compose source. `ops/rebuild/compose.yaml` is the
development layer on it (builds from source, the `fakes` and `tools` profiles); the stack runs
`docker compose -f ops/bundle/compose.yaml -f ops/rebuild/compose.yaml`, and the root
`compose.yaml` includes both (give it the stack's env files: `.local/stack.env`, `.local/host.env`,
`.local/bundle.env`).
`compose.dev.yaml` is not a deployment: it holds the developer services for running the
TypeScript services from source.

Compose-level knobs (host ports, tags, ranges) are `${VAR:-default}` values in the file:
`RB_NATS_PORT`, `RB_SIP_PORT`, `RB_GATEWAY_PORT`, `RB_NODE_*`, `RTPENGINE_PORT_MIN/MAX`, and so on.
Set `COMPOSE_PROJECT_NAME` to run several stacks on one host.

## Ports

| Port | Proto | Who | Notes |
| --- | --- | --- | --- |
| 4222 | TCP | NATS | Internal; publish only for debugging. 8222 is monitoring (`/healthz`). |
| 7422 | TCP | NATS leaf nodes | Hub side of the regions link (see Regions). Dev stack profile `regions` only (`RB_LEAF_PORT`). |
| 5060 | UDP/TCP | Routr | Carrier-facing SIP. |
| 5060 | UDP/TCP | Media node | Internal SIP from Routr; do not expose to the internet. |
| 10000-10100 | UDP | RTPEngine | Carrier-facing media (`RTPENGINE_PORT_MIN/MAX`). Size to your concurrent calls. |
| 30000-30199 | UDP | Media node RTP | `MEDIANODE_RTP_PORT_MIN/MAX`. Two ports per call leg (RTP and the session leg); publish exactly this range. |
| 8080 | TCP | Gateway | Twilio-compatible Calls endpoint when `http` is set in `gateway.yaml`. |

### RTP ranges

The media node binds RTP sockets only inside `[rtp-port-min, rtp-port-max]` when both are set
(unset means any ephemeral port, fine for tests only). When the range is exhausted the node refuses
new legs rather than overrun it. Size the range at roughly two ports per concurrent call, then
publish the same range on the container, pod (host network) or firewall. `MEDIANODE_RTP_ADVERTISE`
is the address that goes into SDP; it must be reachable from Routr and RTPEngine. Behind NAT, set
it to the reachable address; on Kubernetes the chart defaults to the node's host IP.

## Encryption and mutual TLS toward the edge

`MEDIANODE_REQUIRE_ENCRYPTION=true` makes the node serve SIP over TLS only and require SRTP on every
leg (MN6); the TLS listener is `MEDIANODE_TLS_LISTEN` with `MEDIANODE_TLS_CERT` and
`MEDIANODE_TLS_KEY`, and `MEDIANODE_TLS_CA` verifies Routr when the node dials or registers over TLS.

**Mutual TLS** (add-platform 4.2): set `MEDIANODE_TLS_CLIENT_CA` to the CA that signs Routr's
certificate and the TLS listener requires a client certificate signed by it from every connection
(`RequireAndVerifyClientCert`); anything else fails the handshake before a SIP message is read. With
a CA set, the node also presents its own certificate when it connects to Routr over TLS, so Routr
can verify the node. Every PEM setting is a file path or a `secret://` reference whose value is the
PEM. `MEDIANODE_TRUSTED_SOURCES` (RV-B7) stays on as an extra check. Off by default locally; the
chart's `medianode.tls` (`enabled`, `listen`, `secret` with `tls.crt`/`tls.key`/`ca.crt`, `mutual`)
wires it on Kubernetes. Routr's side (a client certificate on its TLS transport) is Routr's config.

## NATS users and subject permissions

NATS is a trust boundary (add-platform 4.1): every service connects as its own user and may publish
and subscribe only on its subjects. The permission files are
`ops/rebuild/config/nats-permissions/<service>.conf` (apiserver, gateway, medianode, routr,
region-agent); the main NATS, the cell's NATS and the chart (`nats.auth`) include the ones they
serve. In short: only media nodes publish heartbeats, room events and `gateway.incoming`; only
gateways publish `callrecord.sealed` (index entries) and `registry.used`; only the apiserver
publishes `calls.create` and `callrecord.<region>.maintenance`; media-control commands come from
gateways and the apiserver; Routr publishes `routr.>` only; the region agent alone talks
`region.>`. The region hub is a separate server in operator mode with per-cell users and is
unchanged.

- **Passwords**: one per service. `ops/rebuild/stack` generates them into `.local/stack.env`
  (`NATS_<SERVICE>_PASSWORD`, added to older files on the next `up`); a cell takes them from
  `cell.env`; the chart from the Secret `nats.auth.secret` (keys `apiserver`, `gateway`,
  `medianode`, `routr`, `region-agent`).
- **Service config**: `nats: { url, user, password }` in fonoster.yaml, gateway.yaml and
  region-agent.yaml, with `password: secret://env/NATS_<SERVICE>_PASSWORD`; the media node takes
  `MEDIANODE_NATS_USER` and `MEDIANODE_NATS_PASSWORD` (a `secret://` reference is fine). Routr's
  user goes in its URL (`nats://routr:<password>@nats:4222`), so use hex passwords.
- **Not covered yet**: every service may subscribe to `_INBOX.>` (replies), so a compromised
  service could read other services' replies; per-service inbox prefixes would close that.
- `NATS_ACL_TEST=docker npm test` runs both configs in Docker and checks every allowed and refused
  subject (`mods/conformance/test/natsPermissions.test.ts`).

## Session registry

The session registry (D3) is the JetStream KV bucket `fonoster_sessions`: `nodes.<id>` and
`rooms.<ref>` (written by media nodes), `calls.<ref>` and `gateways.<ref>` (written by gateways).
Entries are leases: the bucket keeps a value 15 s after its last write, owners rewrite theirs every
2 to 5 s and delete them on a clean exit, so a crashed owner's entries expire on their own. The
apiserver reads `nodes.` at start and follows it, so a restarted replica places outbound calls at
once (it still listens to heartbeats). Without JetStream every service logs a warning and runs on
heartbeats only; `MEDIANODE_SESSION_REGISTRY=false` turns the node's writes off.

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

## Analytics

ClickHouse holds one row per call (`fonoster.call_metrics`: status, duration, turns,
interruptions, false cut-offs, recording) for dashboards and SQL. The gateway loads every sealed
record's redacted copy after sealing; a failed load is logged and never touches the call or the
record. Neither the bundle nor the local stack runs ClickHouse: point the gateway at yours
(`CLICKHOUSE_USER` and `CLICKHOUSE_PASSWORD` in `.env`):

```yaml
# gateway.yaml
callRecord:
  analytics:
    clickhouse:
      url: "https://clickhouse.example.com:8443"
      database: fonoster
      user: "${CLICKHOUSE_USER}"
      password: "${CLICKHOUSE_PASSWORD}"
```

To refill the table from the records (after a schema change, or for records sealed before
analytics was on): `fonoster-callrecord analytics rebuild
--store-config '<ObjectStoreConfig JSON>' --clickhouse-url http://localhost:8123`.

## Observability

Every service emits OpenTelemetry traces, metrics and logs over OTLP/HTTP when its config's
`telemetry.otlpEndpoint` (the bundle sets it to `${OTEL_EXPORTER_OTLP_ENDPOINT:-}`) or
`OTEL_EXPORTER_OTLP_ENDPOINT` (or a per-signal `OTEL_EXPORTER_OTLP_{TRACES,METRICS,LOGS}_ENDPOINT`)
is set, and is a complete no-op when unset: the service runs and logs to stdout. `OTEL_SERVICE_NAME`
and `OTEL_EXPORTER_OTLP_HEADERS` are honoured; `OTEL_SDK_DISABLED=true` forces it off. The TypeScript
services send OTLP with JSON bodies and the Go node with the standard SDK (HTTP/protobuf); both go to
the collector's HTTP port (4318).

Every call-scoped span, log record and metric carries `fonoster.call_ref`. To follow one call, query
Tempo (`{ span.fonoster.call_ref = "<ref>" }`) and Loki (structured metadata `fonoster_call_ref`).

Neither the bundle nor the local stack runs a collector: set `OTEL_EXPORTER_OTLP_ENDPOINT` in
`.env` to yours (e.g. `http://collector.example.com:4318`) and recreate the containers. With Helm,
set `otel.endpoint`.

Metrics: `fonoster.gateway.calls.active`, `fonoster.gateway.calls.total`,
`fonoster.medianode.rooms.active`, `fonoster.medianode.draining`, `fonoster.medianode.calls.incoming`,
`fonoster.autopilot.sessions.total`, `fonoster.apiserver.grpc.requests` (by `rpc.method` and
`rpc.grpc.status_code`), `fonoster.apiserver.records.indexed` (by `outcome`),
`fonoster.registry.commands` (the `fonoster-registry` utility, by `command` and `outcome`).

Traces cross services with a W3C `traceparent` header: the media node sends it on `call.incoming`
(the gateway's `gateway.call` span becomes its child), the gateway sends it on every media-control
command (`medianode.command` spans) and on a record's index entry while the call's span is open
(`apiserver.records.index`). The apiserver makes a span per gRPC request (`apiserver.grpc`) and joins
a `traceparent` metadata entry when a client sends one.

## Regions and cells

One global control plane (apiserver, Identity, dashboard) serves many cells. A cell is the data plane:
Routr, RTPEngine, media nodes, gateways, object storage. This stack is one cell. Cells link to the
control plane only through an **outbound** NATS leaf-node connection over TLS, so a private cell needs
no inbound port other than SIP and RTP from its carriers. Call content (recordings, transcripts,
records, provider keys) stays in the cell; only the call-record index, config and health cross the
link. If the control plane is unreachable, the cell keeps taking calls with its last synced config.

Region tokens, cell registration and config sync are described in
[Running a region](./regions.md); the control plane's region hub is the Compose
profile `regions` or the chart's `natsRegions`. Upgrades in a private cell are yours; nothing
changes until you roll the images.

## Secrets in config files (`secret://`)

A config value may be a reference instead of the secret itself (decision D8). Every Fonoster service
(apiserver and its Identity, gateway, Autopilot, region agent) resolves references once at startup,
before validating its config, and never logs the value; an error names the key path and the
reference only.

| Reference | Resolves to |
| --- | --- |
| `secret://env/NAME` | The environment variable `NAME` (must be set and non-empty). |
| `secret://file/<absolute path>` | The file's contents, without one trailing newline (`secret://file/run/secrets/db-url`). |
| `secret://k8s/<secret>#<key>` | `<FONOSTER_SECRETS_DIR>/<secret>/<key>`: a Kubernetes Secret mounted as a volume (default dir `/var/run/fonoster/secrets`). |
| `secret://k8s/<namespace>/<secret>#<key>` | The same, after checking `<namespace>` is the pod's (`POD_NAMESPACE`). |

The whole value must be the reference; text that merely contains `secret://` is left alone. The
services do not call the Kubernetes API: the chart mounts each Secret listed in a service's
`secretMounts` at `/var/run/fonoster/secrets/<secret>` and sets `FONOSTER_SECRETS_DIR` and
`POD_NAMESPACE`. For example, in `gateway.yaml`:

```yaml
providers:
  deepgram:
    adapter: deepgram
    capabilities: [tts, stt]
    credential: { value: "secret://k8s/fonoster-vendors#deepgram" }
```

## Helm

The chart `ops/rebuild/helm/fonoster-rebuild` has three values files:

| File | Installs |
| --- | --- |
| `values.yaml` (default) | The data plane only: gateway and media nodes (and, opt-in, the hosted Autopilot and a private cell's region agent). NATS, Routr, RTPEngine, Postgres and MinIO are external. |
| `values-cloud.yaml` | The whole platform, mirroring `ops/rebuild/compose.yaml`: apiserver (embedded Identity, migrations Job), Envoy, dashboard, hosted Autopilot, single-node NATS with JetStream, dev-grade Postgres and MinIO, gateway and media nodes. |
| `values-observability.yaml` | The default observability profile: OTel collector, Prometheus, Loki, Tempo and Grafana; every service exports to the collector. Combine it with either file above. |

Routr and RTPEngine come from their own charts (Routr at `routr:5060` / `routr:51907`, using the
release's Postgres database `routr` and NATS). The control plane is off by default so a private
cell's install (regionAgent) does not change.

### Cloud install

Create the Secrets first; values never hold a raw secret, configs reference them with
`secret://k8s/...`:

```sh
kubectl create secret generic fonoster-postgres --from-literal=password="$PG"
kubectl create secret generic fonoster-db \
  --from-literal=url="postgresql://postgres:$PG@fonoster-postgres:5432/fonoster" \
  --from-literal=identityUrl="postgresql://postgres:$PG@fonoster-postgres:5432/fnidentity" \
  --from-literal=key="$ENCRYPTION_KEY"   # k1.aesgcm256.… from `npx @47ng/cloak generate`
kubectl create secret generic fonoster-minio --from-literal=rootUser=minio --from-literal=rootPassword="$MINIO"
kubectl create secret generic fonoster-identity-keys --from-file=private.pem --from-file=public.pem
kubectl create secret generic fonoster-apiserver --from-literal=ownerPassword="$OWNER"
kubectl create secret generic fonoster-autopilot --from-literal=secret="$(openssl rand -hex 32)"
kubectl create secret generic medianode-peer --from-literal=password="$(openssl rand -hex 16)"
kubectl create secret generic fonoster-records-key --from-file=records.pem   # EC P-256
kubectl create secret generic fonoster-vendors --from-literal=deepgram="$DEEPGRAM_API_KEY"
kubectl create secret generic fonoster-nats-users \
  --from-literal=apiserver="$(openssl rand -hex 16)" --from-literal=gateway="$(openssl rand -hex 16)" \
  --from-literal=medianode="$(openssl rand -hex 16)" --from-literal=routr="$(openssl rand -hex 16)"

helm install fonoster ops/rebuild/helm/fonoster-rebuild \
  -f ops/rebuild/helm/fonoster-rebuild/values-cloud.yaml \
  -f ops/rebuild/helm/fonoster-rebuild/values-observability.yaml
kubectl port-forward svc/fonoster-envoy 8449      # dashboard and API on http://localhost:8449
kubectl port-forward svc/fonoster-grafana 3000
```

(The URLs above assume the release name `fonoster`; service names are `<release>-<component>`.)

- **Migrations.** Each release revision runs the Job `<release>-apiserver-migrate-<revision>`
  (`entrypoint --migrate-only`: core and Identity migrations, then the seed). The apiserver replicas
  start with `--skip-migrations` and wait until `prisma migrate status` reports both schemas up to
  date. `apiserver.migrations.job: false` restores the Compose behaviour (every replica migrates at
  start).
- **Identity** is embedded in the apiserver, as in Compose; there is no separate deployable.
- **NATS.** `nats.deploy: true` runs a single-node NATS with JetStream; for production use the
  official nats chart and set `nats.url` (with `nats.deploy: false`). `nats.auth.enabled` (on in
  values-cloud.yaml) gives each service its NATS user (see "NATS users and subject permissions");
  Routr's NATS URL then carries the `routr` user and password.
- **Region hub.** `natsRegions.enabled` runs the hub that private cells link to. Its config is the
  `region-hub.conf` written by `fonoster-region-hub-setup`, stored in `natsRegions.configSecret`;
  the leaf port is a LoadBalancer Service (`<release>-nats-regions-leaf`, 7422). Put the setup's
  `keys/region-hub/*` in `apiserver.regionHubSecret` and `region-signing.pem` in
  `apiserver.keysSecret`.
- **Postgres and MinIO** (`postgres.deploy`, `minio.deploy`) are single-replica and for trying the
  platform; point the database and store URLs in your Secrets at managed services instead.
- **Gateway RTP.** The gateway advertises its pod IP to the media nodes (`rtp.advertiseHostEnv:
  POD_IP`) unless `rtp.advertiseHost` is set.
- **Observability.** With `observability.enabled` and no `otel.endpoint`, every service exports to
  `<release>-otel-collector:4318`. To use your own backend, leave the profile off and set
  `otel.endpoint`. Grafana is anonymous-admin by default, like Compose: set
  `observability.grafana.anonymousAdmin: false` and `adminSecret` outside a laptop.

### Data plane only

```sh
helm install fonoster ops/rebuild/helm/fonoster-rebuild \
  --set nats.url=nats://nats.fonoster:4222 \
  --set medianode.replicas=3 --set medianode.drainGraceSeconds=900 \
  --set medianode.rtp.portMin=30000 --set medianode.rtp.portMax=30199
```

The gateway runs as a Deployment (ConfigMap with `gateway.yaml`, Service, PDB) and the media node as
a StatefulSet (host network by default because RTP needs a UDP range, node id = pod name). Create the
Secret named by `medianode.routr.passwordSecret` (key `password`) for the nodes' Routr peer.

`helm lint` and `helm template` run in the deployment suite (`mods/conformance/test/deployment.test.ts`),
which also loads every rendered config through its service's loader with the Secrets mounted.

# Build log: unify-config-placeholders

Decisions taken while building, for the owner to review. Each can be reversed.

## 2026-10-16

### CP-B1. Placeholders at any key, for every Fonoster service

- `loadServiceConfig` accepts `interpolatePaths: ["*"]`; the apiserver (`SHARED_VALUE_PATHS`),
  Identity, the gateway and Autopilot pass it. The allow-list existed so a value shared with a
  third-party container was written once; with secrets kept in `.env`, every secret is such a value.
- Unset variable without a default: the service refuses to start, naming the key path and the
  variable (never a value). The service-config delta spec says so.

### CP-B2. `/config` first, older locations kept as fallbacks

- Search order: `--config`, `/config`, `/opt/fonoster`, `./config` (apiserver, Identity). The
  gateway: `GATEWAY_CONFIG` / first argument, else `/config`, `/etc/fonoster`, `./config`.
  Autopilot: `--config` / `AUTOPILOT_SESSION_CONFIG`, else `autopilot.yaml` then
  `autopilot-session.yaml` in the same three folders. Helm and the cell compose keep working
  unchanged.
- The gateway and Autopilot now load through `loadServiceConfig` (strict Zod validation: the
  gateway's `gatewayConfigSchema`, Autopilot's `hostedConfigSchema`), then their own cross-field
  checks as before.

### CP-B3. `encryption.key` replaces `database.encryptionKeyEnv` (gateway, Autopilot)

- Same key and same key name as `fonoster.yaml`; the bundle writes `"${ENCRYPTION_KEY}"`. This
  fixes the bundle, where the gateway/Autopilot got the key only through an ad-hoc
  `APISERVER_ENCRYPTION_KEY` mapping. Conformance test: the gateway and Autopilot decrypt a value
  the apiserver's config key encrypted (Cloak, as prisma-field-encryption stores it).
- Helm values, the cell and dev configs use `encryption: { key: "${APISERVER_ENCRYPTION_KEY}" }`
  (the env var their pods already get). `database.urlEnv` stays (not a secret-in-env change; used
  by Helm). The region agent keeps `database.encryptionKeyEnv` (out of scope, not in the bundle).

### CP-B4. Ports take numeric strings

- A placeholder is a string after YAML parsing. `regions.public[].endpoints.sip[].port` and
  `rtpPorts.min/max` use `z.coerce.number()`; `check` validates with Ajv `coerceTypes`. The media
  node retypes a scalar that held a placeholder from its value, but a string field keeps a numeric
  secret as a string.

### CP-B5. init writes the examples with placeholders intact

- `config/<service>.yaml` for Fonoster's services (fonoster, identity, gateway, autopilot,
  medianode) is the example as written (plus the dev stack's overlays). Third-party files
  (Routr's EdgePort) still get values: Routr can't resolve `${NAME}`, and it holds no secret.
- Kept "edit the example, run init again" (re-rendered on every run) instead of shipping the
  files themselves, so the concurrent browser-calling change's edits to `*.example.yaml` merge.
- Rendering still fails at init on an unset `${NAME}` without a default.

### CP-B6. Compose passes `.env` with `env_file`

- `env_file: ${FONOSTER_ENV_FILE:-.env}` on apiserver, gateway, autopilot and the media node; their
  `environment:` blocks (MEDIANODE_*, APISERVER_ENCRYPTION_KEY, CLICKHOUSE_*, OTEL) are gone. A new
  placeholder needs no compose edit. Trade-off: every `.env` value reaches those four containers.
- Files mount at `/config/<service>.yaml` per file (not the whole folder), so Identity's private key
  and other services' files stay out of containers that don't need them. Key mounts unchanged.
- The dashboard keeps `DASHBOARD_API_URL` (its one runtime value; it has no config file).

### CP-B7. Media node: `/config/medianode.yaml`

- New `internal/fileconfig` (gopkg.in/yaml.v3 v3.0.1, taken from the local module cache; logged
  as the only new dependency). Same `${VAR}` / `${VAR:-default}` rules as interpolateEnv; unknown
  keys and bad durations are errors naming the key.
- Precedence: flags, then the file, then `MEDIANODE_*` (kept as a deprecated fallback because Helm
  and the cell still set them; one warning lists the ones used). `-config <file>` names another
  file; a missing default file is fine (env/flags only).

### CP-B8. Telemetry is a config key

- `telemetry: { otlpEndpoint: "${OTEL_EXPORTER_OTLP_ENDPOINT:-}" }` in fonoster, gateway,
  autopilot and medianode YAML. Empty = off unless the container env sets the standard OTEL_*
  variables (behavior kept). The gateway's `telemetry` handle now delegates, so modules that import
  it before the config is read still get the configured exporter. Identity standalone and the
  region agent unchanged.

### CP-B9. Owner: no analytics profile (ClickHouse is an integration)

- Removed `clickhouse`, its volume, `CLICKHOUSE_*` from `.env.example` and init's secrets, the
  gateway's ClickHouse env and the `#@if profile analytics` block. `callRecord.analytics.clickhouse`
  takes `user` / `password` (placeholders) instead of `userEnv` / `passwordEnv`; the example shows
  a commented external setup. The dev stack drops it too (no suite used it).

### CP-B10. Owner: no observability profile

- Removed otel-collector, Prometheus, Loki, Tempo and Grafana from the bundle and their files from
  `ops/bundle/config`, plus `GRAFANA_PORT` / `OTLP_HTTP_PORT`. `OTEL_EXPORTER_OTLP_ENDPOINT` stays
  in `.env.example` (empty) for the YAML key. The dev stack drops them too (nothing relied on
  them; `ops/rebuild/config` keeps its copies for Helm and manual use).

### CP-B11. Owner: no regions profile; private-region hosting is manual

- Removed `nats-regions`, its volume and leaf port, `LEAF_PORT` and the `#@if profile regions`
  block. `regions.operatorKey` only guards the public-region admin API (`/api/admin/regions…`), not
  call placement, so it left the default config too; the local public region `default` (SIP port,
  RTPEngine range on the host address) stays.
- `init` no longer generates the region hub, the region-signing key or the operator key. An
  `init --regions` was built and then removed on the owner's follow-up: fonoster-config covers the
  core install only. The manual tool is the apiserver image's `fonoster-region-hub-setup`
  (`dist/bin/regionHubSetup.js`).
- With no profile left, the renderer's `#@if` machinery and `info`'s "Profiles" line are gone.
- The dev stack keeps its hub: `nats-regions` (profile `regions`) moved to `ops/rebuild/compose.yaml`
  and the hub's `regions:` keys come from the stack's fonoster.yaml overlay.

### CP-B12. Dev stack: `.local/services.env`

- `stack up` writes `.local/services.env` (stack.env + host.env + bundle.env + vendor keys present)
  and points `FONOSTER_ENV_FILE` at it; the renderer reads the same file. Vendor keys in the
  overlays are placeholders (`credential: { value: "${DEEPGRAM_API_KEY}" }`), so the override's
  per-service vendor-key `environment:` blocks are gone.

### CP-B13. Docs: only corrections

- docs/configuration.md, docs/operators/rebuild.md (media node, analytics, observability),
  docs/operators/regions.md and docs-site/self-hosting/install-compose.mdx corrected. The new
  how-to pages are left to the coordinator (owner's change of plan).

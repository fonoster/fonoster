# Facts for the integration pages (from unify-config-placeholders, 2026-10-16)

Source: rebuild/config-pattern final report (CP-B entries in
`openspec/changes/archive/2026-10-17-unify-config-placeholders/build-log.md`). Verify against code before drafting each
page with /ps:docs.

## Send call metrics to ClickHouse (`self-hosting/send-call-metrics-to-clickhouse`)

- gateway.yaml:
  ```yaml
  callRecord:
    analytics:
      clickhouse:
        url: <url>
        database: fonoster
        table: call_metrics
        user: "${CLICKHOUSE_USER}"
        password: "${CLICKHOUSE_PASSWORD}"
  ```
- Permissions: CREATE DATABASE, CREATE TABLE, INSERT; the rebuild also TRUNCATE unless `--keep`.
- Table `fonoster.call_metrics`, ReplacingMergeTree(loaded_at) ORDER BY call_ref: call_ref, workspace_ref,
  app_ref, status, started_at, duration_seconds, caller_turns, agent_turns, interruptions, false_cutoffs,
  has_recording, loaded_at.
- Failure: a failed load logs a warning; the call and its record are unaffected.
- Backfill: `fonoster-callrecord analytics rebuild (--store-dir|--store-config <json>) --clickhouse-url <url>
  [--clickhouse-database] [--clickhouse-table] [--keep]`; credentials from CLICKHOUSE_USER / CLICKHOUSE_PASSWORD.

## Send telemetry (`self-hosting/send-telemetry`)

- `telemetry: { otlpEndpoint: "${OTEL_EXPORTER_OTLP_ENDPOINT:-}" }` in fonoster, gateway, autopilot and
  roomr YAML; empty = off. OTEL_* env still works as a fallback.
- apiserver: `apiserver.grpc` spans, `grpc.requests`, `records.indexed`.
- gateway: `gateway.call` and `roomr.command` spans, `calls.active`, `calls.total`.
- autopilot: `sessions.total`. roomr: `rooms.active`, `draining`, `calls.incoming`, logs.
- Every signal carries `fonoster.call_ref`.

## Host private regions (`private-regions/host-private-regions`) — all manual

- Hub keys (NOT yet run by anyone; test before documenting):
  `docker compose run --rm --no-deps --user "$(id -u):$(id -g)" -v ./config:/out --entrypoint node apiserver
  /work/mods/apiserver/dist/bin/regionHubSetup.js /out --leaf-tls /etc/nats/tls/leaf.crt /etc/nats/tls/leaf.key`
  → `region-hub.conf`, `keys/region-signing.pem`, `keys/region-hub/{operator.seed, account.seed,
  control-plane.creds, system.creds}` (mode 600).
- Operator key: `openssl rand -hex 24 > config/keys/region-operator.key`.
- Compose: add `nats-regions` (`nats:2.11.8-alpine`, `-c /etc/nats/nats.conf`, port 7422, mounts
  region-hub.conf, leaf TLS folder, data volume).
- fonoster.yaml `regions`: operatorKey, controlPlaneUrl, leafUrl `tls://<host>:7422`, signingKey.file, the
  four hub files. Plain `nats://` leaf needs `allowInsecureLeaf` — tests only.
- Turning this on makes `GetCapabilities.regions.private` true (needs `regions.signingKey` + `regions.hub`),
  which shows the dashboard's region UI and mounts the regions HTTP API.

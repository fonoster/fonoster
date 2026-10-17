## Why

The apiserver reads one YAML file whose secrets are `${VAR}` placeholders, but the other services
we maintain do not: the gateway and the hosted Autopilot name environment variables
(`encryptionKeyEnv: APISERVER_ENCRYPTION_KEY`, `secret://env/...`), the media node is configured
only by `MEDIANODE_*` variables, and `fonoster-config init` writes every secret into
`config/*.yaml`. Compose never set `APISERVER_ENCRYPTION_KEY` the same way for every service, so a
workspace vendor key the apiserver stored could not be decrypted by the gateway or Autopilot.

The bundle also ships two opt-in profiles (observability, analytics) that wrap third-party stacks
most self-hosters already run elsewhere.

## What Changes

- **One file per Fonoster service under `/config`.** The apiserver (`fonoster.yaml`), Identity
  (`identity.yaml`), the gateway (`gateway.yaml`), Autopilot (`autopilot.yaml`) and the media node
  (`medianode.yaml`) look in `/config` first. Older locations stay as fallbacks.
- **Secrets are placeholders.** `${VAR}` / `${VAR:-default}` may appear at any key; values come
  from the container environment, which Compose fills from `.env` (`env_file`). Services still
  never read a `.env` file. An unset variable without a default stops the service, naming the
  variable and the key path.
- **Gateway and Autopilot share the apiserver's key.** `database.encryptionKeyEnv` is replaced by
  `encryption: { key: "${ENCRYPTION_KEY}" }`, the same key as `fonoster.yaml`.
- **The media node reads `medianode.yaml`** with the same placeholder rules; `MEDIANODE_*`
  variables are a deprecated fallback that logs once.
- **Telemetry is a config key**: `telemetry: { otlpEndpoint: "${OTEL_EXPORTER_OTLP_ENDPOINT:-}" }`
  in each service (empty = off).
- **`fonoster-config init`** keeps generating secrets into `.env` but writes `config/*.yaml` with
  their placeholders intact (only `#@if` blocks and overlays are applied). `check` resolves
  placeholders from `.env` before validating and names any unset one with its file and key path.
- **Bundle**: `observability` and `analytics` profiles are removed; `regions` is the only opt-in
  profile. ClickHouse metrics and OTLP export stay as integrations pointed at the owner's own
  systems (two how-to pages).

## Impact

- Specs: `deployment` (add-platform), `service-config` (unified-service-config),
  `self-host-installer` (add-self-host-installer).
- Code: `mods/common/src/config` (loader, CLI), apiserver, identity, gateway, autopilot,
  `go/medianode/cmd/medianode`, `ops/bundle`, `ops/rebuild/stack`, `ops/release/bundle`.
- Existing installs: run `fonoster-config init` again (rewrites `config/*.yaml` without secrets)
  and recreate the containers (`docker compose up -d --force-recreate`).

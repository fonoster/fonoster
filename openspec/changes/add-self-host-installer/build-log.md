# Build log: add-self-host-installer

Decisions taken while building, for the owner to review. Each can be reversed.

## 2026-10-15

### IC-B1. The catalog key and how it is applied (task 1.2)

- `fonoster.yaml` takes `catalog: { file: /opt/fonoster/catalog.yaml }` (optional; absent = nothing
  applied, the catalog is managed only with `fonoster-registry`). Documented in
  `config/fonoster.example.yaml`.
- On every start, before serving, the apiserver runs the registry's own `apply` diff
  (`Registry.apply` over `PrismaRegistryStore`, the code behind `fonoster-registry apply --store
  database`) as actor `apiserver`. Listed entries are added or updated; entries not in the file
  are kept. Equal entries write nothing, so a restart changes no rows (tested with a full row +
  timestamp + audit-count snapshot).
- It does not go through `runWithDatabase`: that path also runs due webhook deliveries once,
  which the apiserver's own fan-out already does.
- An entry that is in the file and that an operator changed in the database (e.g. deprecated by
  hand) is set back to the file's version on the next start. The file wins for what it lists;
  operators change listed entries by changing the file.

### IC-B2. A configured catalog that can't be applied stops the apiserver

- Unreadable file or invalid YAML / entry: the apiserver logs `catalog: <reason>` (naming
  `catalog.file`) and exits 1, like any other config error, instead of serving with no catalog.

### IC-B3. JSON Schema export: a vendored converter, no new dependency (task 4.1)

- `zod-to-json-schema` is only in node_modules transitively, and `zod/v4`'s `toJSONSchema` does
  not take the v3 schemas the services use. So `@fonoster/common` gets a small converter,
  `toJsonSchema(schema)` (`mods/common/src/config/toJsonSchema.ts`), covering the Zod types the
  config schemas use; any other type throws (with its path) instead of exporting as "anything".
- It runs `strictDeep` first, so every object has `additionalProperties: false` except
  `.passthrough()` blocks and records. Keys with a default are not `required`. Refinements
  (`superRefine`, `transform`) are not exported; services still validate fully on boot.
- `format: uri|email` is emitted as documentation; validators may ignore it (the test does).
- Strings are validated as written: `check` must resolve `secret://` refs and `${VAR}` first,
  or a pattern such as `encryption.key` fails on a reference.
- Autopilot parses its schema without `strictDeep` today (inner objects such as `knowledge.s3`
  strip unknown keys); the exported schema is strict everywhere, so `check` is stricter there.
- **Entry point for the bundle build (4.2):**
  `npx tsx mods/common/scripts/export-config-schemas.ts <outDir>` writes
  `<outDir>/{apiserver,identity,gateway,autopilot}.json` (or `exportConfigSchemas(outDir)` from
  that module). `$id` is `https://fonoster.com/schemas/config/<svc>.json`.

### IC-B4. The gateway gets a Zod schema of gateway.yaml

- The gateway validates with `validateConfig` and a TypeScript type; it had no Zod schema.
  `mods/gateway/src/configSchema.ts` (`gatewayConfigSchema`) describes the file's shape. A
  compile-time check fails the gateway build if it drifts from `GatewayConfig` (keys and types;
  optionality is ignored because the package is not built with strictNullChecks).
- The gateway does not use it at load time yet (it still ignores unknown keys at runtime);
  `check` catches typos before start.

### IC-B5. Stack: catalog applied by the apiserver (task 1.3)

- `seed_catalog` and its call in `cmd_up` are gone. The stack renders `catalog: { file:
  /opt/fonoster/catalog.yaml }` into `fonoster.yaml` and `ops/rebuild/compose.yaml` mounts
  `ops/rebuild/config/catalog-seed.yaml` there (one added volume line).
- `stack smoke` passed with the change (apiserver log: `catalog: 37 entries added or changed`,
  then a call through Routr to the seeded app and a sealed record). It ran under project
  `rb-installer-core-stack` (edited in the git-ignored `.local/stack.env`): an existing `rb-stack_db`
  volume from an earlier run had a different Postgres password and was not mine to remove.
- The stack's rendered `fonoster.yaml`, `gateway.yaml` and `autopilot-session.yaml` validate
  against the exported JSON Schemas (checked by hand; `.local` is not in the repo, so the test
  uses the committed examples).

# add-self-host-installer build log

## installer-cli

### CL-B1. Region hub code moved, re-exported

- `natsJwt.ts` (NATS JWT helpers + `generateRegionHub`) moved to `mods/common/src/regions/hub/`,
  exported from `@fonoster/common` as the namespace `RegionHub` (its names, like `createUser`, would
  collide at the top level). `mods/apiserver/src/regions/natsJwt.ts` re-exports every name, so
  `../regions` imports and the apiserver tests are unchanged.
- `@fonoster/common` now declares `nkeys.js` and `ajv` (both already in the shared node_modules; no
  install).

### CL-B2. `.env` names and the bundle's ports

- Bundle names have no prefix: `HOST_IP`, `PUBLIC_URL`, `HTTP_PORT` (8449), `SIP_PORT` (5060, inside
  Routr too, so Via carries the reachable port), `RTPENGINE_PORT_MIN/MAX` (10000-10999),
  `MEDIANODE_RTP_PORT_MIN/MAX` (11000-11999), `MINIO_PORT` (9000, localhost), `SUBNET_PREFIX`
  (10.216.30, not the dev stack's 10.216.16, so both run on one machine), `OWNER_EMAIL/PASSWORD`,
  `ENCRYPTION_KEY`, `MEDIANODE_PASSWORD`, plus the third-party secrets.
- `PUBLIC_URL=http://${HOST_IP}:${HTTP_PORT}`: Compose and the renderer both expand it, so the
  dashboard works from another machine, not only `localhost`.
- `CONFIG_DIR` (default `./config`) is only for the dev override.

### CL-B3. Where services still read the environment

- Inline in YAML now: NATS passwords, the Autopilot signing secret (`{ value: }`), database URLs.
- Still environment, because the service has no YAML option yet: the gateway's and Autopilot's
  `encryptionKeyEnv` (`APISERVER_ENCRYPTION_KEY`), the media node (env-configured Go service),
  the dashboard's `DASHBOARD_API_URL`, OTel's standard `OTEL_EXPORTER_OTLP_ENDPOINT`. All are
  Compose-level wiring from `.env`; a later change can move them.

### CL-B4. Profiles drive config, not only containers

- Regions and analytics need config lines (the hub section, `callRecord.analytics`) that break the
  default start when their containers are off (the apiserver connects to `nats-regions` at boot).
  Examples carry `#@if profile <name>` / `#@end` blocks, kept when `COMPOSE_PROFILES` in `.env` lists
  the profile. Turning one on: set `COMPOSE_PROFILES`, run `init` again. Observability needs no
  config (just `--profile observability` and `OTEL_EXPORTER_OTLP_ENDPOINT`).
- `init` always generates the hub keys (D4), so turning regions on later needs no extra step.

### CL-B5. File modes

- `.env`: 0600. `config/`: 0700. Rendered `config/*.yaml` and keys: 0644. The containers run as
  uid 1001 and read the files through bind mounts, so a 0600 YAML owned by the host user would
  fail on Linux; the 0700 folder keeps other host users out instead. (Spec: secrets readable by
  the owner only; met at the folder.)

### CL-B6. Re-runs

- Existing `.env` lines are never rewritten, with two exceptions: an empty secret is filled in
  place, and `HOST_IP` changes when `--host-ip` names another address. Missing names are appended
  under `# Added by fonoster-config init (<date>)`. A kept `HOST_IP` wins over a new detection.
- A name is a secret when it ends in `_PASSWORD`, `_SECRET`, `_KEY` or `_TOKEN` and is empty in
  `.env.example`; generic ones are `s<32 hex>` (start with a letter, for NATS). Encryption key:
  `k1.aesgcm256.<base64 of 32 bytes, no + or />`. Owner password `p<16 hex>`.
- Rendered YAMLs are always rewritten from the examples (spec): owner changes go in the example
  or `.env`. The example headers say so.

### CL-B7. Host address detection

- A UDP socket "connected" to 192.0.2.1 reports the default route's source address (no packet is
  sent): no `route`/`ipconfig`/`hostname -I`, same on macOS and Linux. No address (no route) means
  exit 1 with "pass --host-ip".

### CL-B8. `check`

- JSON Schema validation with `ajv` (8.x, in node_modules). Schemas are `config/schemas/<name>.json`
  for `config/<name>.yaml` (`apiserver.json` → `fonoster.yaml`, `autopilot-session.json` →
  `autopilot.yaml` also accepted). Without schemas, check still reports unrendered `${NAME}` and
  bad `secret://` references and says key validation was skipped.
- `secret://file/opt/fonoster/...` and `/etc/fonoster/...` (container paths) are read from `config/`
  on the host; `secret://env/` from `.env`. Messages name the key path and the reference, never the
  value.
- Unknown keys get a suggestion from `suggestKey` (new, in `configHints.ts`: Levenshtein, at most a
  third of the key's length). Tests use generated "shape" schemas until 4.1's real ones exist.

### CL-B9. One renderer, two layouts

- `fonoster-config render` (not in `--help`; for the dev stack) renders a config folder from env
  files with optional YAML overlays (deep merge, `null` removes a key). `ops/rebuild/stack` copies
  `ops/bundle/config/` into `.local/config`, maps its `RB_` values to the bundle names in
  `.local/bundle.env`, writes overlays for the fakes / vendor keys (`testMode`, fake adapters,
  Autopilot credentials) and runs `node mods/common/dist/config/cli/index.js render`. Your own
  overrides: `.local/overlay.local/<file>.yaml`.
- `ops/rebuild/compose.yaml` is now an override (build sections, `fakes`, `tools`, vendor key env,
  the gateway's HTTP port); the stack runs `-f ops/bundle/compose.yaml -f ops/rebuild/compose.yaml`
  with `--project-directory ops/rebuild`. The root `compose.yaml` includes both. The old
  `autopilot` profile is gone (Autopilot is a default service).
- `RB_SIP_INTERNAL_PORT` is gone: Routr listens on `RB_SIP_PORT` inside too (same value before).

### CL-B10. Bundle copies of the dev configs

- `ops/bundle/config` holds copies of `config/envoy.yaml`, the observability files,
  `postgres-init.sql`, the NATS config and permissions, and `catalog.yaml`
  (= `ops/rebuild/config/catalog-seed.yaml`). The NATS and catalog copies have their own comments
  (no "rebuild"); `mods/conformance/test/bundle.test.ts` compares them without comments, the others
  byte for byte. `region-agent.conf` is not copied (the main NATS doesn't include it).

### CL-B11. Gateway: no platform key needed with workspace keys

- The gateway refused a vendor provider without a platform key unless `cellSecrets` was set, so a
  fresh install (no vendor keys) couldn't start. Now `workspaceKeys.enabled` also allows it; such a
  provider is skipped until a workspace has a key (the Catalog already did that). Small edit in
  `mods/gateway/src/config.ts`, test in `vendors.test.ts`.

### CL-B12. Smoke run without the catalog key

- The apiserver in this branch rejects `catalog:` (1.2 is another stream). The smoke run used
  `.local/overlay.local/fonoster.yaml` with `catalog: null` (local, not committed); after the merge
  the example's key works as is. `seed_catalog` is untouched.

### CL-B13. Smoke result

- `ops/rebuild/stack smoke` passed (16000-range ports, call answered, 6 s of audio, record indexed).
  It ran as project `rb-installer-cli-stack`: the `rb-stack_db` volume left by another worktree's
  stack holds a different Postgres password (P1000), and other streams' volumes are not mine to
  delete. Projects share volumes by name; `ops/rebuild/stack reset` in that worktree clears it.
- Full suite: 1528 passing, 123 pending, 0 failing; mocha then exits 1 from a native
  `libc++abi ... mutex lock failed` at process exit (not a test failure).

## coordinator

### CO-B1. Local bundle build (task 4.2)

- `ops/release/bundle [version]` builds the five Fonoster images as `fonoster/<svc>:<version>`, stages
  `ops/bundle`, sets `FONOSTER_VERSION`, exports the config schemas into `config/schemas/`, and
  writes `dist/release/<version>/fonoster-<version>.tar.gz` (about 20 KB) and
  `fonoster-common-<version>.tgz` (`npm pack`). The version defaults to `lerna.json` + `-local`.
  `SKIP_IMAGES=1` skips the images.
- One tarball is enough for `npx -p`: the CLI imports only `ajv`, `yaml` and `nkeys.js`, so the
  published 0.27.0 `@fonoster/logger` and `@fonoster/types` it also installs are never loaded.
  `init` from the tarball in a clean folder took about 7 s.

### CO-B2. `check` used the wrong JSON Schema draft (found at merge)

- The exported schemas declare draft 2020-12, and `check` compiled them with Ajv's draft-07 class,
  so every check failed with `no schema with key or ref ".../2020-12/schema"`. Each stream's tests
  used its own fixtures. `check` now uses `ajv/dist/2020`, and a test runs `check` against the real
  `exportConfigSchemas` output.

### CO-B3. Naming scan (task 4.3)

- The bundle build greps the staged archive for `rebuild` / `RB_` and fails on a hit. `init` output
  is covered by the CLI tests. `check`, `info` and `--help` output from the tarball was scanned by
  hand: no hits.

## install-papercuts

Fixes from the owner's first install (`.claude/docs/install-compose.md`, "Owner's run").

### IP-B1. Bundle volumes are named apart from legacy installs

- Owner kept the default project name `fonoster`. The legacy root `compose.yaml` (0.27 and older)
  named its volumes `db` and `influxdb`, so the bundle's `db` became `fonoster_db` and mounted the
  old database (old password, Postgres auth failed). The bundle's volumes are now
  `postgres-data`, `nats-data` and `minio-data`. A bundle scenario asserts no volume (declared or
  mounted) is named `db` or `influxdb`.
- The install page has one note in "Before you begin": stop a 0.27-or-older Compose install
  (`docker compose down` in its folder) and keep its volumes. Its containers share the project
  name, so running both would replace them.
- An existing pre-release bundle install with data in `fonoster_db` starts on a new, empty
  `fonoster_postgres-data`. Pre-release only; nothing migrates it.

### IP-B2. The apiserver is healthy only once migrated and serving

- Probe: `node /work/mods/apiserver/dist/bin/healthcheck.js` (new, apiserver package) calls the
  standard gRPC health check (`grpc.health.v1.Health/Check`, already served and public) on
  127.0.0.1:50051 and exits 0 on SERVING. The entrypoint applies migrations before it imports the
  server, and the server sets SERVING after it binds, so healthy means the tables exist. No HTTP
  route added: the gRPC one existed. Compose: interval 5 s, `start_period` 120 s, 30 retries.
- `gateway` and `autopilot` (reads assistants, the catalog and keys from the database) now wait
  for `apiserver: service_healthy`. Envoy stays `service_started` (it only proxies).
- The gateway's first loads of apps, registry and webhooks retry (`openUntilReady`) every 2 s with
  one warn line each (`apps not ready yet, retrying in 2s (the API server may still be applying
  migrations): <Prisma's last line>`), then an info line when loaded. After 2 minutes the last
  error is thrown and the gateway exits as before. Covers stacks without the healthcheck (Helm,
  dev).

### IP-B3. `fonoster-config check` no longer prints Ajv format warnings

- `validateFormats: false`: formats (`uri`, `email`) in the exported schemas are documentation;
  the services validate the values. Without `ajv-formats` Ajv printed "unknown format ... ignored"
  once per format. A test captures console output during `check` and asserts none.

### IP-B4. Connection details come from GetCapabilities (fixes RC-B4)

- `GetCapabilities` gains `connection = 7` (`ConnectionCapabilities`: `sip[] {host, port,
  transport}`, `signaling_addresses`, `media_addresses`, `rtp_ports {min, max}`): the default
  public region's `endpoints` from fonoster.yaml (the one with `default: true`, else the first).
  Chosen over a new route: it is public, always on, and the dashboard already reads it at boot.
  Addresses and ports only, the same values the regions API showed; no credentials. Empty lists
  when the region lists none. Bindings regenerated with protoc for capabilities.proto only.
- SDK: `Capabilities.connection` (`ConnectionDetails`), empty for an older server.
- Dashboard `useEndpoints`: with private regions, the workspace's region from the regions API
  (unchanged, so Cloud's per-region details stay right); without, `capabilities.connection`. The
  trunk carrier hint and the SIP user softphone settings show on a self-hosted install with no
  hub, and no `/api/regions*` call is made. Settings → Region stays private-regions only.
- With several public regions and no hub, the hints show the default region's details even for a
  workspace placed elsewhere. Self-hosted has one public region; left as is.

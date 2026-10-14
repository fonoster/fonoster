# Tasks

## 0. Port `next`

- [x] 0.1 Cherry-pick `31f6c6021` (loader, `interpolateEnv`, integrations schema, Autopilot
      schema, compose/CI cleanup) onto `feat/platform-refresh`; resolve conflicts with `main`
- [x] 0.2 Ported tests pass on top of `main` (loader, interpolation, Autopilot schema)

## 1. Loader (`mods/common/src/config/`)

- [x] 1.1 Path resolution: `--config`, then `/opt/fonoster/<base>.*`, then `./config/<base>.*`;
      drop `FONOSTER_CONFIG`; error when two extensions exist in one directory
- [x] 1.2 JSON/JSONC parsing with `jsonc-parser` (comments, trailing commas, line/col errors)
- [x] 1.3 Interpolation limited to declared paths; `${…}` elsewhere is a validation error
- [x] 1.4 Recursive strict schemas; full-path errors
- [x] 1.5 Moved-keys table with "did you mean" hints
- [x] 1.6 `warnLegacyEnv(prefixes)` (names only)
- [x] 1.7 `getIntegrationsFromFile` reads YAML or JSON and throws instead of exiting
- [x] 1.8 Tests for each of the above

## 2. Logger (`mods/logger`)

- [x] 2.1 `configureLogger({ level, format, transport, fluent })`; existing loggers adopt it
- [x] 2.2 Env remains the fallback until `configureLogger` is called
- [x] 2.3 Tests: logger created before configuration picks up the new level

## 3. Identity schema (`mods/identity`)

- [x] 3.1 Split `server/config.ts` into `identitySectionSchema` and the standalone wrapper
- [x] 3.2 Reconcile defaults (refresh 24h, invites 1d, smtp required only when needed, twilio
      mapped standalone)
- [x] 3.3 Standalone accepts the section shape and today's `identity.json`, via the shared loader
- [x] 3.4 Tests for both shapes and the defaults

## 4. apiserver (`mods/apiserver`)

- [x] 4.1 `src/config/schema.ts` matching `config/fonoster.example.yaml`, with `features`
- [x] 4.2 `src/config/index.ts`: memoized `getConfig()`, `setConfigForTests()`
- [x] 4.3 `envs.ts` keeps its exports, backed by `getConfig()`; no dotenv, no `assertEnvsAreSet`
- [x] 4.4 `ROOT_DOMAIN` via `setRootDomain()`; ai-coustics license from config
- [x] 4.5 `configureLogger` first in the entrypoint; legacy-env warning at boot
- [x] 4.6 `PrismaClient` with `datasourceUrl` (apiserver and identity)
- [x] 4.7 `src/bin/entrypoint.ts`: wait for DB, migrate (URL only in child env), seed, start;
      Dockerfile CMD uses it
- [x] 4.8 Test fixture + mocha `--require` hook; existing apiserver tests pass

## 5. Autopilot (`mods/autopilot`)

- [x] 5.1 Schema: `server.bindAddr`, `apiserver.endpoint`, `logs`, `conversation`,
      `integrationsFile`, `knowledgeBase`, `recordings`, `dev.skipIdentity`
- [x] 5.2 Use the shared loader (`autopilot` base name), no env of its own
- [x] 5.3 `VoiceServer` bind/port and identity address from config (`server.identityAddress`,
      kept separate from `apiserver.endpoint`: the key fetch uses TLS)
- [x] 5.4 Load integrations once at boot
- [x] 5.5 Tests

## 6. Deploy and docs

- [ ] 6.1 `config/fonoster.example.yaml`, `config/fonoster.example.jsonc`,
      `config/autopilot.example.yaml`, `config/integrations.example.yaml`
- [ ] 6.2 `compose.yaml`, `compose.dev.yaml`: apiserver `env_file: .env` + file mount; Autopilot
      file mount only; integrations mounted in both; dashboard `DASHBOARD_API_URL`
- [ ] 6.3 `.env.example`, `.env.example.dev`: third-party variables only, plus `DASHBOARD_API_URL`
- [ ] 6.4 CI workflows and root scripts use config files instead of `APISERVER_*` / `AUTOPILOT_*`
- [ ] 6.5 Migration guide with the full old-variable → key table; Identity config reference
      (covers `identity-standalone-service` 3.2) and compose example (covers its 5.2)
- [ ] 6.6 Remove `config-proposal/`; delete the `next` branch (with confirmation)

## 7. Verification

- [ ] 7.1 Unit tests pass for common, logger, identity, apiserver, autopilot
- [ ] 7.2 A bad config fails with path and hint; JSONC and YAML load identically
- [ ] 7.3 `docker compose up` with the example files: apiserver and Autopilot start with no
      `APISERVER_*` / `AUTOPILOT_*` variables

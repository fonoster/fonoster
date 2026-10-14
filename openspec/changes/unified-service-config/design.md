## Context

Today:

- **apiserver:** `mods/apiserver/src/envs.ts` computes 69 constants from env when the module is imported. It loads `.env` through dotenv in development, exits through `assertEnvsAreSet` when something is missing, and reads the RS256 key files.
- **Importers:** 21 source files import it, and 14 test files load it indirectly through `core/db`.
- **Autopilot:** `envs.ts` works the same way, with 4 importers.
- **Identity:** two code paths.
  - Embedded in the apiserver, it gets an untyped object built from those constants (`core/identityConfig.ts`).
  - Standalone, it reads a zod-validated `identity.json` (`mods/identity/src/server/config.ts`).
  - Their defaults disagree (refresh token 24h vs 30d, invite 1d vs 2d, Twilio not mapped standalone).
- **Logger:** `mods/logger` reads `*_LOGS_*` env at import time, and `getEnv` returns the first variable ending in the key.
- **Branch `next`:** commit `31f6c6021` added `mods/common/src/config/` (a YAML loader, `${VAR}` interpolation and the integrations schema, with 20 tests) and moved Autopilot onto it.

The target files are drafted in `config-proposal/` (fonoster.yaml, fonoster.jsonc, autopilot.yaml, integrations.example.yaml, .env.example, compose.example.yaml). Its README maps every variable to its new key.

## Goals / Non-Goals

**Goals**
- Each Fonoster service is configured by one validated file.
- Each value is written once.
- Mistakes fail loudly with the offending path.
- Most consumers keep their imports unchanged.

**Non-goals**
- Changing how third-party containers are configured.
- Kubernetes manifests (the files map onto Secrets, but charts are later).
- A version field or migrations of the file format.
- Hot reload.

## Decisions

### File location and format
`loadServiceConfig` resolves the file in this order:
1. `--config <path>`
2. `/opt/fonoster/<base>.{yaml,yml,json,jsonc}`
3. `./config/<base>.*`

More than one match in the same directory is an error. If no file is found, the loader warns and uses the schema defaults, which are the Community values.

There is no environment override for the path: services read no env of their own. This replaces `next`'s `FONOSTER_CONFIG`.

YAML is parsed with `yaml`; JSON and JSONC with `jsonc-parser`, which allows comments and trailing commas and reports line and column.

### Strictness and hints
- **Strict schemas:** every object schema is made strict recursively, and errors go through `zod-validation-error`.
- **Moved keys:** a table maps old key paths (for example `encryptionKey`, `defaultUser`, `smtp.auth.pass`) to new ones. When an unknown key is in that table, the error adds "did you mean `<new>`".
- **Legacy env:** `warnLegacyEnv` logs the names (never the values) of any `APISERVER_*` / `AUTOPILOT_*` variables still set.
- **No version field:** strict validation plus hints play that role. A version field can be added later if formats diverge.

### Interpolation is opt-in per path
`interpolateEnv` from `next` substitutes `${VAR}` and `${VAR:-default}` everywhere. Here it applies only to an allow-list of paths each service declares. For the apiserver those are:
- `database.url` and `identity.database.url`
- `influxdb.*`
- `mediaService.asterisk.ariUsername` / `ariPassword`
- `routr.defaultPeer.username` / `password`

`${…}` outside the allow-list is a validation error. This keeps `${VAR}` for its single purpose: values shared with a third-party container.

### Minimal churn for consumers
`mods/apiserver/src/config/index.ts` exports a memoized `getConfig()` and a `setConfigForTests()`. `envs.ts` keeps all 69 export names, now computed from `getConfig()`, so the 21 importers don't change. It drops dotenv and `assertEnvsAreSet`.

Tests load a fixture (`test/fixtures/fonoster.test.yaml`) through a mocha `--require` hook before any import. Autopilot follows the same pattern, as `next` already did.

Later commits may replace constants with direct `getConfig()` reads where it simplifies code, for example reusing the standalone `toIdentityConfig` for embedded Identity.

### One Identity schema
`mods/identity/src/server/config.ts` is split into:
- **`identitySectionSchema`**: issuer, audience, keys, tokens, security, invites, oauth2, owner and an optional database. It is reused verbatim as `fonoster.yaml`'s `identity:` section.
- **The standalone schema**: `identity.json` keeps its shape, with the same settings at the root of the file (`encryptionKey`, `issuer`, `keys`, `tokens`, `invite`, `smtp.auth`, `defaultUser`, ...) plus optional `logs`, `twilio` and `features.auth`. Standalone Identity is used by services outside Fonoster, so the shape stays stable; nothing else is carried over (validation is strict and defaults are the current ones; dependents adjust).

Defaults are reconciled to the apiserver's current behaviour:
- refresh token 24h
- invite expiration 1d
- HTTP bridge port per wrapper: 9876 for the apiserver, 9000 standalone
- SMTP required only when a feature needs it, enforced with `superRefine`

### Logger
`mods/logger` gains `configureLogger({ level, format, transport, fluent })`. Loggers keep their identity, but their level and transports come from a shared container that `configureLogger` reconfigures. That means loggers created at import time, before boot, pick up the file's settings.

Env stays the fallback for library users (SDK, ctl). Each service entrypoint calls `configureLogger(getConfig().logs)` first.

### Database URL without env
- **Prisma at runtime:** `PrismaClient` takes `datasourceUrl` from config.
- **Migrations:** `prisma migrate deploy` still reads its URL from env, so a new apiserver entrypoint (`src/bin/entrypoint.ts`) does the following:
  1. Loads config.
  2. Waits for Postgres with a TCP probe.
  3. Runs the two migrations, passing the URL only in the child process's env.
  4. Seeds.
  5. Starts the server.

  This replaces the `sed`-parsing `CMD` in the Dockerfile.

### Other env readers
- `ROOT_DOMAIN` in `mods/common/src/envs.ts` becomes `setRootDomain()` at boot plus a lazy getter for validators.
- The ai-coustics filter receives its license from `audioFilters.aiCoustics.license` instead of `process.env`.
- Autopilot gets `apiserver.endpoint`, which it also uses as `VoiceServer`'s identity address, replacing the hard-coded `api.fonoster.com` default.
- Autopilot validates its integrations file once at boot instead of re-parsing it on every call.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Config files now hold secrets | Documented as secrets (chmod 600, gitignored, a Secret on Kubernetes); examples hold placeholders |
| Import-time evaluation in tests | Memoized `getConfig` plus a fixture loaded by mocha before imports |
| Loggers created before configuration | Shared container with reconfiguration; unit-tested |
| Operators upgrading | Hints, legacy-env warning, migration guide; old variables are ignored, not half-honoured |
| `env_file: .env` exposes third-party variables to the apiserver container | Accepted; the loader only resolves the names its allow-listed paths reference |

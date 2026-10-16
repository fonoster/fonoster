## Context

`ops/rebuild/stack` (544 lines of bash) is the only way to run the rebuild. Its `up` does five jobs:
it generates secrets into `.local/stack.env` (`init_local`), detects the host address
(`detect_host_ip`), writes the service YAMLs with heredocs (`render_configs`), runs
`docker compose up --build`, and loads the provider catalog with `docker compose exec`
(`seed_catalog`). It needs a checkout, `npm install` (the region hub is generated with `tsx` from
`mods/apiserver`), `openssl`, and `RB_`-prefixed names everywhere.

Constraints:
- add-platform `deployment`: each Fonoster service reads exactly one YAML. Services never read
  `.env`. Secrets are inline or `secret://`.
- `@fonoster/common` already ships a bin (`fonoster-registry`, run as `npx -p @fonoster/common …`),
  `interpolateEnv`, `loadServiceConfig` and `configHints`.
- Owner decisions (2026-10-15): one archive per release, curl to fetch it, setup with
  `npx -p @fonoster/common fonoster-config`, commands `init`/`info`/`check` (no seed), vendor keys
  only in the dashboard, local builds for now.

## Goals / Non-Goals

**Goals:**
- Install = `curl … | tar xz` → `fonoster-config init` → `docker compose up -d`, with Docker,
  curl and Node 22 as the only prerequisites.
- One Compose source shared by the bundle and the dev stack.
- `check` catches config mistakes before containers start.

**Non-Goals:**
- Publishing images, the archive or the npm package to registries (decided at release).
- Helm (`ops/rebuild/helm` stays as it is; its docs page is separate).
- TLS, domains and production hardening (the "Secure it" page and a later change).
- Upgrades between versions beyond "re-run `init` with the new bundle".
- A demo seed.

## Decisions

### D1. Bundle layout: `ops/bundle/` is the source of the archive

```
fonoster/
  compose.yaml          # images only, profiles: default, observability, analytics, regions
  .env.example          # Compose-level values: ports, image tag, host address, third-party secrets
  config/
    fonoster.example.yaml   gateway.example.yaml   autopilot.example.yaml
    routr-edgeport.example.yaml   nats.example.conf   envoy.yaml   catalog.yaml
    schemas/*.json          # JSON Schema per service, generated at build time (D5)
  README.md             # the three commands and a link to the docs
```

Examples use `${NAME}` placeholders. `init` renders `config/<svc>.yaml` from
`config/<svc>.example.yaml` and leaves the examples in place for reference.
*Alternative:* services interpolate `${…}` from the environment at boot. Rejected: that brings
back environment config the deployment spec forbids, and makes `check` validate templates instead
of real files.

### D2. `.env` is for Compose only

`.env` holds host ports, `FONOSTER_VERSION`, the host address, and the secrets third-party
containers take through the environment (`POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, NATS user
passwords). It's also where `init` keeps every generated secret, so a re-run can render the YAMLs
again. Fonoster services get their values only from their rendered YAML, mounted read-only.
*Alternative:* a separate `secrets.json`. Rejected: one file the owner can read and back up is
simpler, and Compose already reads `.env`.

### D3. Default ports are the standard ones

SIP `5060` (UDP/TCP), dashboard and API `8449` (the legacy port), RTP `10000-10999` (RTPEngine) and
`11000-11999` (media node), MinIO `9000` bound to localhost. The dev stack keeps its 16000-range
ports in its own env file, so both can run on one machine.

### D4. `init` is TypeScript in `@fonoster/common`, using Node's `crypto`

- Secrets: `crypto.randomBytes`. The encryption key keeps the `k1.aesgcm256.<base64>` format,
  without `+` or `/`. NATS passwords start with a letter (the stack script's rule).
- Keys: RS256 (Identity) and ES256 (call records) with `generateKeyPairSync`. No `openssl`.
- Region hub: `generateRegionHub` and its NATS JWT helpers move from `mods/apiserver/src/regions/`
  into `mods/common/src/regions/hub/`. The apiserver imports them from there. `init` always
  generates the hub, so turning on the `regions` profile later needs no extra step.
- Host address: the default-route interface's IPv4. `--host-ip` overrides it.
- Idempotence: parse the existing `.env`, generate only missing names, append them, and never
  rewrite lines that already exist. Keys are generated only when their file is missing.
- File modes: `.env` and `config/*.yaml` are `0600`. Keys the containers read are `0644`. Same as
  the stack script, because the containers run as another user.

*Alternative:* port the bash script and keep requiring `openssl`. Rejected: Node is already a
prerequisite for `npx`, and one implementation means one set of tests.

### D5. `check` validates against JSON Schemas shipped in the bundle

Service schemas live in the service packages (apiserver, gateway, autopilot, identity), and
`common` can't import them (they depend on `common`). The bundle build exports each service's
Zod schema to `config/schemas/<svc>.json` (`zod-to-json-schema`). `check` validates each rendered
YAML with them (`ajv`), resolves `secret://` references with the existing `resolveSecretRefs` (without
printing values), and turns unknown keys into suggestions with `configHints`.
*Alternative:* run each image's own validation (`docker compose run --rm <svc> --check-config`).
Rejected: it needs the images pulled first and is slow. A service's own startup validation still
applies on boot.

### D6. One Compose source, an override for development

`ops/bundle/compose.yaml` is the base. `ops/rebuild/compose.yaml` turns into an override that adds
`build:` sections, the `fakes` and `tools` profiles, and the 16000-range port env. `ops/rebuild/stack`
runs `docker compose -f ops/bundle/compose.yaml -f ops/rebuild/compose.yaml`. `stack smoke` keeps
passing, so every change to the base is tested by the existing gate.

### D7. The apiserver loads the catalog on boot

A `catalog: { file: /etc/fonoster/catalog.yaml }` key in `fonoster.yaml`. On start, the apiserver
runs the registry `apply` with `--store database` semantics: add or update the listed entries,
never delete. `seed_catalog` is removed from the stack script.

### D8. Local bundle build: `ops/release/bundle [version]`

It builds each Fonoster image with the same Dockerfiles, tagged `fonoster/<svc>:<version>`. It
exports the schemas (D5), renders `compose.yaml` with that tag, packs `@fonoster/common`
(`npm pack`), and writes `dist/release/<version>/{fonoster-<version>.tar.gz, fonoster-common-<version>.tgz}`.
The local install is the documented one with one swap: `npx -p ./fonoster-common-<version>.tgz
fonoster-config init`. The version defaults to the root `lerna.json` version plus `-local`.

## Risks / Trade-offs

- [Two Compose files can fall out of step] → the override only adds things. `stack smoke` in the
  merge gate runs both together.
- [Moving the region-hub code touches the apiserver] → a pure move with re-exports. The existing
  `mods/apiserver/test/regions` tests must pass unchanged.
- [Exported JSON Schemas lose Zod refinements] → `check` is a first line of defense. Services still
  validate fully on boot and fail fast with the same hints.
- [Standard ports collide with a legacy install on the same host] → ports live in `.env`. The
  troubleshooting page covers it.
- [Node 22 as a prerequisite] → owner's call (npx utility). It's still lighter than today's
  checkout plus `npm install`.

## Migration Plan

No data migration. The dev stack keeps its `.local/` state. After D6 its configs come from the
same base. Rollback is to revert the change, because nothing on `main` depends on it.

## Open Questions

- The archive's public URL and the npm dist-tag (at release).
- Whether `init` writes a self-signed certificate for Envoy now or leaves TLS to the "Secure it"
  change. The default for this change is plain HTTP on `8449`.

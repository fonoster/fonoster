## Why

The only way to run the rebuilt Fonoster today is `ops/rebuild/stack up`: clone the repository,
`npm install`, and build every image from source. It's a developer try-out, not an install a
self-hoster can follow. The legacy install needed only Docker and a few `curl` lines. The v0.30
self-hosting docs (`docs-site/self-hosting/install-compose`) need an install at least that light,
and the owner is using that install to judge how portable the rebuild feels.

## What Changes

- A **release bundle**: each release produces `fonoster-<version>.tar.gz`. It holds `compose.yaml`
  (published images only, no `build:`), `config/` with one example per file, and `.env.example`. One
  `curl … | tar xz` line unpacks it into `./fonoster`.
- A **setup utility** in `@fonoster/common`: `npx -p @fonoster/common fonoster-config <command>`:
  - `init`: generates secrets and keys (Identity RS256, call-record ES256, encryption key, database,
    MinIO and per-service NATS passwords, the region hub). It detects the host address and writes
    `config/*.yaml` and `.env`. It never prompts, and running it again keeps existing secrets.
  - `info`: prints the dashboard URL, the owner login, the SIP address, and where config and
    credentials live.
  - `check`: validates the rendered config before start (unknown keys, missing values, bad
    `secret://` references).
- **Start** is plain `docker compose up -d`. The default profile runs the core voice path, the
  dashboard and the hosted Autopilot. Observability, analytics and regions are opt-in profiles.
  Fakes and the caller bot are not in the bundle.
- **The apiserver loads the provider catalog on boot** (idempotent), replacing the stack script's
  post-`up` `docker compose exec` step.
- **No vendor keys at install**: owners add provider keys per workspace in the dashboard (existing
  `setProviderKey`). No demo seed command.
- **One Compose source**: the bundle's `compose.yaml` is the base file. The dev stack
  (`ops/rebuild/stack`) layers its `build:`, fakes and caller bot on top through an override file,
  so the two can't drift.
- **Local build for now**: `ops/release/bundle` builds the images, the archive and an `npm pack` of
  `@fonoster/common`, so the owner can install from local files before 0.30 ships. Publishing to
  registries is decided at release time.
- Nothing the reader types or sees is named "rebuild".

## Capabilities

### New Capabilities

- `self-host-installer`: the release bundle, the `fonoster-config` utility (`init`, `info`,
  `check`), the default Compose profile, catalog load on boot, and the local bundle build.

### Modified Capabilities

None. The `deployment` capability (add-platform, still a change) keeps "one YAML per service, no
`.env`": `.env` here configures Compose and third-party containers only.

## Impact

- `mods/common`: new `fonoster-config` bin (`src/config/cli/`). The region-hub generation
  (`mods/apiserver/src/regions/natsJwt.ts`, `bin/regionHubSetup.ts`) moves into `common` so `init`
  can run it without the apiserver.
- `mods/apiserver`: catalog apply on boot, from a catalog file named in `fonoster.yaml`.
- `ops/bundle/` (new): `compose.yaml`, `config/*.example.*`, `.env.example`.
- `ops/rebuild/compose.yaml` becomes an override on `ops/bundle/compose.yaml`, and `ops/rebuild/stack`
  uses both.
- `ops/release/bundle` (new): builds the images, the archive and the npm tarball.
- `docs-site/self-hosting/install-compose.mdx` teaches this path (written after this change).

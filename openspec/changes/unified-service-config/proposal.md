## Why

Deploying Fonoster means editing a `.env` file of about 90 variables. Values that mean the same
thing are written several times (the Postgres password inside two database URLs, the InfluxDB
credentials for both the apiserver and InfluxDB, the ARI password for both the apiserver and
Asterisk), so they drift. Nothing validates the file: a misspelled `APISERVER_SMTP_HSOT` is
silently ignored and email simply stops working. Lists are comma-separated strings, nothing is
documented next to its value, secrets are mixed with ordinary settings, and the dashboard bakes
its settings into the image at build time.

Identity already moved to a validated file (`identity.json`), and a first attempt at per-service
YAML for Autopilot lives on the `next` branch. This change finishes the job for Fonoster's own
services and replaces `next`.

## What Changes

- **One config file per Fonoster service.**
  - The apiserver reads `fonoster.yaml`, with Identity as its `identity:` section.
  - Autopilot reads `autopilot.yaml`, one file shared by every replica.
  - The dashboard keeps a single runtime variable, `DASHBOARD_API_URL`. Everything else it needs comes from the apiserver (see `identity-auth-modes`).
- **YAML or JSON with comments.**
  - The format is chosen by extension (`.yaml`, `.yml`, `.json`, `.jsonc`).
  - Two files for the same service is an error.
- **Strict validation at boot.**
  - Unknown keys fail with their full path.
  - Keys that moved say where they went.
  - Old `APISERVER_*` / `AUTOPILOT_*` variables still in the environment produce one warning naming them.
  - There is no version field.
- **No environment variables of their own.** The apiserver and Autopilot read only their file, secrets included. The files are treated as secrets.
- **`${VAR}` only for shared values.** A value that a third-party container also reads from `.env` (Postgres, InfluxDB, Asterisk) is referenced with `${VAR}`, so it is written once. `${VAR}` anywhere else is an error.
- **Third-party containers are unchanged.** Routr, Asterisk, RTPEngine, Postgres, InfluxDB, NATS and AMD keep their variables in `.env`, which drops from 88 to 35 variables.
- **`features` replace editions.**
  - `fonoster.yaml` has a `features` section (auth methods, sign-up, billing, cost display, call data storage).
  - The shipped file carries Community values, and code never checks an edition.
- **Shared plumbing.**
  - The logger accepts its settings in code.
  - Prisma and the Docker entrypoint take the database URL from config.
  - Embedded and standalone Identity share one schema, with their defaults reconciled.

## Impact

- **Code:**
  - `mods/common` (loader)
  - `mods/logger` (programmatic config)
  - `mods/apiserver` (`envs.ts` backed by config, entrypoint, Prisma)
  - `mods/identity` (schema split, standalone accepts the section)
  - `mods/autopilot` (config file, VoiceServer identity address)
- **Deploy:**
  - `compose.yaml`, `compose.dev.yaml`
  - `.env.example(.dev)`
  - `config/*.example.*`
  - apiserver Dockerfile
  - CI workflows
  - root scripts
- **Operators:** existing installs must move their `APISERVER_*` / `AUTOPILOT_*` values into the two files. Moved-key hints, the legacy-env warning and a migration guide make that explicit.
- **Supersedes** the `next` branch (commit `31f6c6021` is ported here).

# Proposal

## Why

A Compose self-hoster needed Node.js and `fonoster-config` (from `@fonoster/common`) to generate
secrets and render `config/*.example.yaml` before `docker compose up` worked; the tool re-rendered
the config on every run, so settings lived in `config/overrides`, and the install folder filled
with examples and schemas. The dev container and the QA stack ran the same CLI from source, and a
region was installed from a second Compose file (`ops/rebuild/cell`) that drifted from the bundle.

## What Changes

- `ops/bundle/init.sh` (POSIX sh and openssl) replaces `fonoster-config`: `.env` with generated
  secrets, the keys, a certificate for getting started, the SIP port in
  `config/routr-edgeport.yaml`, and a summary with the login (the password stays in `.env`). The
  archive ships final `config/*.yaml`, which are the operator's to edit; no `.env.example`, no
  examples, no schemas, no npm package. `@fonoster/common` loses the `fonoster-config` bin and the
  CLI is deleted.
- Upgrades: unpack next to the install, copy `.env`, `config/keys`, `config/tls` and the edited
  files, run `./init.sh` (it moves `FONOSTER_VERSION` to its release), `docker compose up -d`.
- The Ansible role merges `fonoster_overrides` over the release's files and runs `init.sh` (no Node
  container).
- The dev container and the QA stack write their config with `ops/rebuild/merge-config.cjs` (the
  bundle's files plus overlays) and `init.sh`; the stack keeps one env file, `.local/.env`.
- A private region is the release archive with `compose.region.yaml` and `config/region/`,
  installed with `playbooks/region.yml` (shipped in the archive as `ansible/`); `ops/rebuild/cell`
  is removed.

## Impact

- New: `ops/bundle/init.sh` and its tests, `ops/bundle/compose.region.yaml`,
  `ops/bundle/config/region/`, `ops/ansible/playbooks/region.yml`,
  `ops/ansible/roles/fonoster/tasks/region.yml`, `ops/rebuild/merge-config.cjs`.
- Changed: `ops/bundle/config/*` (final names), `ops/release/{bundle,smoke}`, `release.yaml`,
  the Ansible stage, `.devcontainer/initialize.sh`, `ops/rebuild/stack`, the dashboard's region
  install command, docs.
- Removed: `mods/common/src/config/cli`, `ops/release/require-on-npm.sh`, `ops/rebuild/cell`.
- Minor release (maintainer decision 2026-10-29): no outside self-hosters or region operators yet.

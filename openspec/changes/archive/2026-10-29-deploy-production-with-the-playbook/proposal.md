# Proposal

## Why

Production is upgraded by `ops/deploy/fonoster-deploy`, a script installed by hand on the server
and run over SSH, and the settings that are not in the release (Docker's daemon settings, certbot
hooks, trace retention, `config/overrides/*`, a managed-database script) live only on the server.
The 0.35.0 outage came from one of them. The playbook in `ops/ansible` (#1204) already puts a host
on a version from an inventory; production should be deployed by it, from a private inventory, so
nothing about the server lives only on the server.

## What Changes

- `deploy.yaml` runs the playbook in two jobs. `plan` (environment `production-prepare`, no
  credential that can change production) pins the tag and the private inventory to SHAs, renders
  `.env`, overrides and overlays with vaulted values redacted, lints and syntax-checks the tag's
  playbook and reads the archive's checksum. `apply` (environment `production`, approval) runs
  `playbooks/site.yml` from those SHAs, as the `deploy` user, pinned to that checksum; a failed
  apply runs `playbooks/rollback.yml`.
- `playbooks/rollback.yml` restores the backup the switch made, starts the services, smoke-tests
  them and logs `rolled back`.
- The host role creates the `deploy` user (passwordless sudo, a `restrict` key).
- `.github/actions/ansible` installs the pinned ansible-core and the deploy credentials.
- `ops/deploy` is deleted.

## Impact

- New: `.github/actions/ansible`, `ops/ansible/playbooks/rollback.yml`,
  `ops/ansible/roles/host/tasks/deploy-user.yml`, catalog case OPS-006.
- Changed: `.github/workflows/deploy.yaml`, `stack-smoke.yaml` (`--rollback`),
  `ops/ansible/test/throwaway.sh`, `deploymentRules.test.ts`, `ops/ansible/README.md`, `AGENTS.md`.
- Removed: `ops/deploy/**`.
- Not changed: `release.yaml`'s call to `deploy.yaml`, the database, the private inventory's
  contents.

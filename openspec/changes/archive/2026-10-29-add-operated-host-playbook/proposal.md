# Proposal

## Why

Fonoster's own hosts are set up by hand: Docker's daemon settings, certbot and its hooks, the
trace retention, the managed-database overrides. Nothing in the repository describes a running
host, and the 0.35.0 outage came from state that lived only on the server. A playbook in the
repository makes each host reproducible from an inventory and applies or rolls back any release the
same way, with a plan before every change.

The Helm chart has no user and no one running it; keeping it an official target costs a nightly job
and a promise nobody checks against a cluster.

## What Changes

- `ops/ansible`: a playbook (`playbooks/site.yml`) with two roles. `host` installs Docker from
  Docker's apt repository with `userland-proxy: false` and `live-restore: true`, certbot with
  renewal hooks that stop and recreate Envoy, and the Routr trace folder with its retention.
  `fonoster` stages a release archive verified against `SHA256SUMS`, writes `.env`, overrides and
  Compose overlays from the inventory, runs `fonoster-config init` and `check` in a container,
  backs up the live install, switches it to the stage (without the example files) and smoke-tests
  the dashboard and the API. `--check` is the plan; applying an older version is the rollback.
- Releases publish `SHA256SUMS` next to the archive.
- CI: `ansible-lint` on pull requests that change `ops/ansible`; a `playbook (throwaway)` job in
  `stack-smoke.yaml` and an `operations` job in the QA gate run the playbook on the runner.
- Docker Compose is the only official target. The Helm chart stays in the repository, unsupported,
  and its nightly job is removed.

## Impact

- New: `ops/ansible/**`, catalog area `operations` (OPS-003 to OPS-005).
- Changed: `ops/release/bundle` and `release.yaml` (SHA256SUMS), `pr-checks.yaml`,
  `stack-smoke.yaml`, `qa-proofs.yaml`, `ops/rebuild/helm/fonoster-rebuild/Chart.yaml` (note).
- Not changed: production (#1205), `ops/deploy`, the bundle itself, the database.

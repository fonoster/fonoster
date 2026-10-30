# Ansible: operated hosts

One playbook puts a host on a Fonoster version: the host itself (Docker, the certificate, trace
retention) and the Docker Compose install in `/opt/fonoster`. It is how Fonoster runs its own
hosts. To self-host, use the Compose bundle (https://docs.fonoster.com/self-hosting).

Tested on Ubuntu 24.04 with ansible-core 2.21.5 (ansible-lint 26.10.1). No collections are needed.

## What it does

`playbooks/site.yml` runs two roles on each host of the `fonoster` group:

- **host** (tag `host`): Docker from Docker's apt repository, with `/etc/docker/daemon.json` set to
  `{"userland-proxy": false, "live-restore": true}`; certbot with renewal hooks that stop and
  recreate Envoy (only when `certbot_domains` is set); the Routr trace folder with a tmpfiles.d
  retention rule (`routr_traces_enabled`).
- **fonoster** (tag `fonoster`):
  1. Stages the release in `/var/lib/fonoster/releases/<version>` from `fonoster_archive` (the
     GitHub release by default, or a path on the controller), checked against `SHA256SUMS`.
  2. Writes `.env` from `fonoster_env` and `fonoster_env_secrets`, `config/overrides/<file>` from
     `fonoster_overrides` and the Compose files in `fonoster_compose_overlays`, and copies the keys
     and TLS files from `/var/lib/fonoster/{keys,tls}`.
  3. Runs `fonoster-config init` and `check` in `node:22-alpine`. It fails, naming them, when the
     release adds a `.env` name the inventory lacks. Keys and TLS files init created are kept in
     `/var/lib/fonoster/{keys,tls}`.
  4. Pulls the images, unless `fonoster/apiserver:<version>` is already on the host.
  5. Backs up `/opt/fonoster` to `/var/lib/fonoster/backups/<utc>-<from>.tgz`, then syncs the stage
     into it, without the example files, `README.md` and `config/schemas`.
  6. Runs `docker compose up -d --wait`, recreating the services whose mounted files changed.
  7. Checks from the controller that the dashboard (`fonoster_public_url`) answers 200 and the API
     (`fonoster_api_host`) answers gRPC.
  8. Logs `<utc> <from> -> <to>` in `/var/lib/fonoster/deploys.log` and keeps the last 3 stages and
     backups.

The database is never touched: a new version applies its migrations when the API server starts.
The play never prints a secret from the inventory and never rewrites the keys and TLS files in
`/var/lib/fonoster`. On a host that already runs Fonoster, copy `/opt/fonoster/config/keys` (and
`config/tls`) into `/var/lib/fonoster/keys` (and `tls`) first; the play refuses to start while
they are missing.

## Inventory

Copy `inventory.example/` to `inventory/` (git-ignored) and fill it in:

- `inventory/production.yml`: the hosts, in the `fonoster` group.
- `inventory/host_vars/<host>/main.yml`: everything that is not a secret.
- `inventory/host_vars/<host>/vault.yml`: the secrets (from `vault.example.yml`), encrypted with
  `ansible-vault encrypt`. Pass `--ask-vault-pass` (or `--vault-password-file`) to every run.

`fonoster_env` and `fonoster_env_secrets` together hold every name of the release's `.env.example`
(`FONOSTER_VERSION` comes from `fonoster_version`).

## Commands

Run them from this folder, so `ansible.cfg` applies:

```sh
ansible-playbook -i inventory/production.yml playbooks/site.yml --check --diff -e fonoster_version=0.40.0   # plan
ansible-playbook -i inventory/production.yml playbooks/site.yml -e fonoster_version=0.40.0                  # apply
ansible-playbook -i inventory/production.yml playbooks/site.yml --tags fonoster -e fonoster_version=0.39.2  # another version
ansible-playbook -i inventory/production.yml playbooks/site.yml -e fonoster_version=0.0.0-a -e fonoster_archive=/path/fonoster-0.0.0-a.tar.gz -e fonoster_common_package=/path/fonoster-common-0.0.0-a.tgz   # local build
```

`fonoster_version` has no default. The plan stages the release and pulls its images, then prints
what the switch would change. Applying an older version is the rollback. Exit 0 means the host
converged; 2 means a task failed. A run on a converged host ends with `changed=0`.

A local build comes from `ops/release/bundle <version>`, which writes the archive, the common
package and `SHA256SUMS` to `dist/release/<version>/`.

## Test

`test/throwaway.sh <a> [<b>]` builds both versions, lints, plans, applies `<a>`, applies it again,
applies `<b>` and `<a>` again, and checks the results (catalog area OPS,
`mods/conformance/catalog/areas/operations.md`). It deletes `/opt/fonoster` and `/var/lib/fonoster`
first, so it runs only on a throwaway Ubuntu 24.04 machine. CI runs it in the `playbook (throwaway)`
job of `stack-smoke.yaml` and in the QA gate:

```sh
gh workflow run stack-smoke.yaml --ref <branch>
```

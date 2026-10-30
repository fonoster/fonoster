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
  retention rule (`routr_traces_enabled`); with `deploy_authorized_key`, the `deploy` user (sudo
  without a password, its one key with `restrict`).
- **fonoster** (tag `fonoster`):
  1. Stages the release in `/var/lib/fonoster/releases/<version>` from `fonoster_archive` (the
     GitHub release by default, or a path on the controller), checked against `SHA256SUMS`.
  2. Writes `.env` from `fonoster_env` and `fonoster_env_secrets`, deep-merges each
     `fonoster_overrides` entry over the release's `config/<file>`, writes the Compose files in
     `fonoster_compose_overlays`, and copies the keys and TLS files from
     `/var/lib/fonoster/{keys,tls}`.
  3. Runs the release's `init.sh` in the stage (no Node.js). It fails, naming them, when the
     release adds a `.env` name the inventory lacks. Keys and TLS files `init.sh` created are kept
     in `/var/lib/fonoster/{keys,tls}`.
  4. Pulls the images, unless `fonoster/apiserver:<version>` is already on the host.
  5. Backs up `/opt/fonoster` to `/var/lib/fonoster/backups/<utc>-<from>.tgz`, then syncs the stage
     into it, without `README.md` and `ansible/`.
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

`fonoster_env` and `fonoster_env_secrets` together hold every name of the `.env` the release's
`init.sh` writes (`FONOSTER_VERSION` comes from `fonoster_version`).

## Commands

Run them from this folder, so `ansible.cfg` applies:

```sh
ansible-playbook -i inventory/production.yml playbooks/site.yml --check --diff -e fonoster_version=0.40.0   # plan
ansible-playbook -i inventory/production.yml playbooks/site.yml -e fonoster_version=0.40.0                  # apply
ansible-playbook -i inventory/production.yml playbooks/site.yml --tags fonoster -e fonoster_version=0.39.2  # another version
ansible-playbook -i inventory/production.yml playbooks/site.yml -e fonoster_version=0.0.0-a -e fonoster_archive=/path/fonoster-0.0.0-a.tar.gz   # local build
ansible-playbook -i inventory/production.yml playbooks/rollback.yml   # put the newest backup back
```

`fonoster_version` has no default. The plan stages the release and pulls its images, then prints
what the switch would change. Applying an older version is the rollback. `playbooks/rollback.yml`
puts the newest backup of `/opt/fonoster` back, recreates the services and smoke-tests them (with
`-e fonoster_rollback_since=<YYYYMMDDTHHMMSSZ>`, only a backup made since then). Exit 0 means the host
converged; 2 means a task failed. A run on a converged host ends with `changed=0`.

A local build comes from `ops/release/bundle <version>`, which writes the archive and `SHA256SUMS`
to `dist/release/<version>/`.

## Test

`test/throwaway.sh <a> [<b>] [--rollback]` builds both versions, lints, plans, applies `<a>`,
applies it again, applies `<b>` and `<a>` again (with `--rollback`, then `<b>` with a failing smoke
test and `playbooks/rollback.yml`), and checks the results (catalog area OPS,
`mods/conformance/catalog/areas/operations.md`). It deletes `/opt/fonoster` and `/var/lib/fonoster`
first, so it runs only on a throwaway Ubuntu 24.04 machine. CI runs it in the `playbook (throwaway)`
job of `stack-smoke.yaml` and in the QA gate:

```sh
gh workflow run stack-smoke.yaml --ref <branch>
```

## Private regions

`playbooks/region.yml` installs a private region on each host of the `regions` group: the host
role, then the fonoster role with `COMPOSE_FILE=compose.yaml:compose.region.yaml` (no API server,
dashboard or Envoy). With `fonoster_region` set, the role enrolls the region once with
`fonoster_region.enroll_token` (before NATS starts: its config includes the leaf link enroll
writes) and sets each `fonoster_region.secrets` entry in the region's secret store through stdin,
only when the set changed. The version defaults to the release the playbook ships in. Start from
`inventory.example/region.example.yml`; the steps are in
https://docs.fonoster.com/private-regions/install-region.

## Fonoster Cloud

Fonoster's production host is deployed by `.github/workflows/deploy.yaml` with this playbook, from a
private inventory repository (`vars.INFRA_INVENTORY_REPO`) that holds only
`inventory/production.yml` (the host in the `fonoster` and `production` groups, `ansible_user:
deploy`) and `inventory/group_vars/production/{main.yml,vault.yml}` (`vault.yml` encrypted). Nobody
edits the server by hand: a change to it is a change to the inventory or to this playbook, then a
deploy.

- **Plan** (environment `production-prepare`, runs on its own): pins the tag `v<version>` and the
  inventory's HEAD to SHAs, deletes every `vault.yml`, shows `.env`, overrides and overlays in the
  run summary with vaulted values as `<vaulted>`, lints and syntax-checks the tag's playbook, and
  reads the archive's SHA256 from the release's `SHA256SUMS`. It has no SSH key and no vault
  password. It fails on a version whose tag has no playbook (`version X has no playbook`) and on a
  `fonoster_env` name ending in `_PASSWORD`, `_SECRET`, `_KEY`, `_TOKEN` or `_HEADERS` with a value
  (those go in `fonoster_env_secrets`).
- **Apply** (environment `production`, waits for a reviewer's approval): runs `playbooks/site.yml
  --tags fonoster` from the plan's SHAs, as `deploy`, with the plan's archive checksum. A failed
  apply runs `playbooks/rollback.yml`, which restores the backup the switch made; an apply that
  failed before its switch made none, and nothing is restored. The run summary has from, to, the
  switch time, the backup name and the rollback's outcome.
- **By hand:** `gh workflow run deploy.yaml -f version=0.41.0` redeploys or moves to a version (and
  applies inventory changes); add `-f host_role=true` to run the host role too.
- **On the host:** `/var/lib/fonoster/deploys.log` (`<switch time> <from> -> <to>`, with `rolled
  back` after a rollback) and the backups of `/opt/fonoster` in `/var/lib/fonoster/backups`. The
  database is never touched; the switch time is the point to restore a database backup to.

GitHub setup: both environments restrict deployments to `main`, and `production` has a required
reviewer. Secrets: `INFRA_INVENTORY_TOKEN` (fine-grained, the inventory repository only, Contents:
read, with an expiry) in both; `DEPLOY_SSH_KEY` (the deploy user's private key) and
`ANSIBLE_VAULT_PASSWORD` (`openssl rand -base64 32` or longer) in `production`. Variables:
`INFRA_INVENTORY_REPO` (owner/name) and `DEPLOY_KNOWN_HOSTS` (`ssh-keyscan` of the host).

Owner checklist, once, to move a host that was set up by hand:

1. Copy the `.env` and `config/overrides/*` values from the production host into the private
   inventory by hand: non-secrets in `main.yml`, secrets in `vault.yml` (`ansible-vault encrypt`).
   `TLS_KEY` goes in `fonoster_env_secrets` too: it is a path, but its name ends in `_KEY`.
2. Set `deploy_authorized_key` to the public half of `DEPLOY_SSH_KEY` and create the `deploy` user
   with the host role.
3. Run `ansible-playbook -i inventory/production.yml playbooks/site.yml --check --diff --tags host`
   until it shows only the expected changes: `live-restore` added to `daemon.json`, the certbot
   hooks replaced, the old `stop-envoy.sh` and `start-envoy.sh` hooks removed.
4. Apply the host role alone (`--tags host`) in a maintenance window.
5. Delete `/root/use-managed-db.sh` on the host, and the keys of the old deploy script from root's
   `authorized_keys`.

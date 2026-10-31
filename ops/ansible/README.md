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
     (`fonoster_api_host`) answers gRPC, asking up to `fonoster_smoke_retries` times (default 30),
     10 s apart.
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

Fonoster's production host is deployed by `.github/workflows/deploy.yaml` with the playbook each
release ships (`fonoster/ansible` in its archive). The inventory lives on the host, in
`/etc/fonoster/inventory` (root only, 0700), which no release and no deploy touches:
`production.yml` (the host in the `fonoster` and `production` groups, `ansible_connection:
local`) and `group_vars/production/main.yml` (every value, secrets in `fonoster_env_secrets`). No
vault: the file is as private as `/opt/fonoster/.env` next to it. Nobody edits the install by hand:
a change goes in the inventory or in this playbook, then a deploy.

- **Plan** (environment `production-prepare`, runs on its own, no credential): pins the tag
  `v<version>` and the archive's SHA256 from the release's `SHA256SUMS`, checks that the archive
  carries the playbook (`version X has no playbook` otherwise) and lints it.
- **Apply** (environment `production`, waits for a reviewer's approval): over SSH as `deploy`,
  `ops/ansible/deploy-on-host.sh` installs the pinned ansible-core on the host if needed, downloads
  the archive, checks it against the plan's SHA256, prints the playbook's `--check --diff`, then
  applies `site.yml --tags fonoster`. A failed apply runs `rollback.yml`, which restores the backup
  the switch made; an apply that failed before its switch made none, and nothing is restored. The
  run summary has from, to, the switch time, the backup name and the rollback's outcome.
- **By hand:** `gh workflow run deploy.yaml -f version=0.43.0` redeploys or moves to a version (and
  applies inventory changes); add `-f host_role=true` to run the host role too.
- **On the host:** `/var/lib/fonoster/deploys.log` (`<switch time> <from> -> <to>`, with `rolled
  back` after a rollback), the backups of `/opt/fonoster` in `/var/lib/fonoster/backups`, the
  releases' playbooks in `/var/lib/fonoster/deploy`. The database is never touched; the switch time
  is the point to restore a database backup to.

GitHub setup: both environments restrict deployments to `main`, and `production` has a required
reviewer. Secret `DEPLOY_SSH_KEY` (the deploy user's private key) in `production`. Variables
`DEPLOY_HOST` (the host's address) and `DEPLOY_KNOWN_HOSTS` (`ssh-keyscan -t ed25519 <host>`).

Owner checklist, once, to move a host that was set up by hand (run the playbook on the host, from
a release's `fonoster/ansible`, with `-i /etc/fonoster/inventory/production.yml`):

1. Write `/etc/fonoster/inventory` from the host's `/opt/fonoster/.env` and
   `config/overrides/*`: non-secrets in `fonoster_env`, secrets in `fonoster_env_secrets`,
   overrides in `fonoster_overrides`, extra Compose files in `fonoster_compose_overlays`.
2. Copy `/opt/fonoster/config/keys` and `config/tls` into `/var/lib/fonoster/keys` and `tls`.
3. Set `deploy_authorized_key` to the public half of `DEPLOY_SSH_KEY` in the inventory.
4. Run `site.yml --check --diff --tags host` until it shows only the expected changes:
   `live-restore` added to `daemon.json`, the certbot hooks replaced, the old `stop-envoy.sh` and
   `start-envoy.sh` hooks removed, the `deploy` user.
5. Apply the host role alone (`--tags host`) in a maintenance window.
6. Delete `/root/use-managed-db.sh` on the host, and the keys of the old deploy script from root's
   `authorized_keys`.

### Billing

Fonoster Cloud's billing (`compose.billing.yaml`: credits, plans, admission, Stripe) runs only in
the `production` group. Every operated inventory carries `NATS_BILLING_PASSWORD` in
`fonoster_env_secrets` (`s<hex16>`), whether billing runs there or not. The steps, in this order:

1. **Before merging the release that ships billing,** add `NATS_BILLING_PASSWORD` to the
   production inventory, and check that the `fonoster/billing` repository on Docker Hub accepts
   the release's push.
2. **Merge.** The release and its deploy run with billing off.
3. **Billing alone.** In Stripe's live account: activate Stripe Tax; create the webhook endpoint
   `<PUBLIC_URL>/stripe/webhooks` for `invoice.paid`, `invoice.payment_failed`,
   `invoice.payment_action_required`, `customer.subscription.updated` and
   `customer.subscription.deleted`; set the Customer Portal to allow cancelling at the end of the
   billing period, updating payment methods and the invoice history. Billing creates its products
   and prices at start. Then add to `group_vars/production/main.yml`, with no apiserver or
   AppBridge wiring yet:

   ```yaml
   fonoster_env:
     COMPOSE_FILE: compose.yaml:compose.external-db.yaml:compose.billing.yaml:compose.traces.yaml
   fonoster_env_secrets:
     NATS_BILLING_PASSWORD: "s<hex16>"
     BILLING_DATABASE_URL: "postgresql://fonoster:<password>@<managed db>:25060/fonoster?schema=billing&sslmode=require"
     STRIPE_SECRET_KEY: "rk_live_..."
     STRIPE_WEBHOOK_SECRET: "whsec_..."
   fonoster_overrides:
     billing.yaml:
       identity: { databaseUrl: "<managed db>/fnidentity" }
   ```

   Redeploy (`gh workflow run deploy.yaml -f version=<version>`). Check that billing is healthy
   (`docker compose ps billing`), its migrations ran (`docker compose logs billing` shows
   `prisma migrate deploy` applying them; the database user must be allowed to `CREATE SCHEMA
   billing`), and that Stripe's "Send test event" on the endpoint gets a 2xx.
4. **Launch.** Add both switches in one deploy:

   ```yaml
   fonoster_overrides:
     fonoster.yaml:
       features: { billing: { enabled: true, address: "billing:50073" } }
     appbridge.yaml:
       authz: { address: "billing:50071", timeoutMs: 500 }
   ```

   The dashboard shows Billing, and AppBridge asks billing before every call: an owner without
   credits is refused.
5. **Rollback.** Remove the `fonoster.yaml` `features.billing` and `appbridge.yaml` `authz`
   overrides together with `compose.billing.yaml` from `COMPOSE_FILE`, and redeploy the same
   version. The `billing` schema stays: its migrations only add.
6. **Watch.** AppBridge `admitted without an answer from authorization`: billing didn't answer,
   so calls go through for free. Billing `usage has no price on the rate card; not billed`. Billing must consume within 7
   days, the usage stream's retention; after that, usage is lost.

An operator's changes to one owner, on the host:

```sh
docker compose exec billing fonoster-billing-admin trial   --email pedro@acme.com --days 45
docker compose exec billing fonoster-billing-admin credits --email pedro@acme.com --credits 500 --note "support case 123"
```

`trial` sets the Trial's length from its start (reopening an ended Trial); `credits` adds credits
(Trial credits on the Trial, like a top-up otherwise). `--owner <user ref>` instead of `--email`.

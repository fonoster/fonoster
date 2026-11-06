# Fonoster Cloud

Fonoster Cloud's billing (credits, plans, admission, Stripe) runs only in the `production` group.
It is not in the install archive and not on the public docs. Production's inventory adds it to each
release with the playbook's `fonoster_files` and `fonoster_inserts` (`ops/ansible/README.md`,
Inventory), from the reference files in this folder:

| File | What it is |
| :--- | :--- |
| `compose.billing.yaml` | The billing service, and NATS's `NATS_BILLING_PASSWORD` |
| `config/billing.yaml` | Billing's config; each secret is a `${NAME}` from the container's environment |
| `config/nats-permissions/billing.conf` | Billing's NATS subjects |
| `inserts.yml` | Billing's NATS user in `config/nats.conf`; `/stripe/webhooks` and `billing-cluster` in `config/envoy-tls.yaml` |
| `compose.catalog.yaml`, `config/catalog.yaml` | Cloud's whole catalog, in place of the base one |
| `compose.ops.yaml` | The ops API on the API server (`mods/ops`): its secrets, Routr's traces read-only, its state volume |
| `ops-role.sql` | The ops API's read-only database role, with column grants |

Copy this folder into the inventory as `cloud/` (next to `production.yml`). After a change here,
copy it again before approving the next release's apply.

## The inventory

In `group_vars/production/main.yml`:

```yaml
fonoster_env:
  COMPOSE_FILE: compose.yaml:compose.external-db.yaml:compose.billing.yaml:compose.traces.yaml
fonoster_env_secrets:
  NATS_BILLING_PASSWORD: "s<hex16>"
  BILLING_DATABASE_URL: "postgresql://fonoster:<password>@<managed db>:25060/billing?sslmode=require"
  STRIPE_SECRET_KEY: "rk_live_..."
  STRIPE_WEBHOOK_SECRET: "whsec_..."
fonoster_files:
  compose.billing.yaml: "{{ lookup('file', inventory_dir ~ '/cloud/compose.billing.yaml') }}"
  config/billing.yaml: "{{ lookup('file', inventory_dir ~ '/cloud/config/billing.yaml') }}"
  config/nats-permissions/billing.conf: "{{ lookup('file', inventory_dir ~ '/cloud/config/nats-permissions/billing.conf') }}"
fonoster_inserts: "{{ lookup('file', inventory_dir ~ '/cloud/inserts.yml') | from_yaml }}"
fonoster_overrides:
  # Merges over config/billing.yaml above.
  billing.yaml:
    identity: { databaseUrl: "<managed db>/fnidentity" }
  fonoster.yaml:
    features: { billing: { enabled: true, address: "billing:50073" } }
  appbridge.yaml:
    authz: { address: "billing:50071", timeoutMs: 500 }
```

`fonoster_env`, `fonoster_env_secrets` and `fonoster_overrides` keep the rest of production's
values; only the keys above are billing's.

## The catalog

`config/catalog.yaml` is everything Cloud offers, and nothing else. Production applies it on every start
in place of the base catalog. To change what Cloud offers, change this file. In `group_vars/production/main.yml`:

```yaml
fonoster_env:
  # Add compose.catalog.yaml to the value above.
  COMPOSE_FILE: compose.yaml:compose.external-db.yaml:compose.billing.yaml:compose.traces.yaml:compose.catalog.yaml
fonoster_files:
  compose.catalog.yaml: "{{ lookup('file', inventory_dir ~ '/cloud/compose.catalog.yaml') }}"
  config/catalog.cloud.yaml: "{{ lookup('file', inventory_dir ~ '/cloud/config/catalog.yaml') }}"
fonoster_overrides:
  autopilot.yaml:
    credentials:
      groq: { value: "<key>" }
      anthropic: { value: "<key>" }
      google: { value: "<key>" }
```

Each model must have a price on the rate card in force (`mods/billing/rate-cards`). A model without
one isn't billed on platform keys, and billing logs an alert. Applying a file never removes an entry from
the database, so taking something off this list leaves its row behind until it is deleted. Before a deploy, `fonoster-registry plan -f <file>` lists what the file would change.

## Setting it up

1. **Database.** Create `billing` on the managed Postgres, as the database user
   (`CREATE DATABASE billing;`). Billing migrates it at every start; its tables are in `public`.
2. **Stripe**, in the live account: activate Stripe Tax; create the webhook endpoint
   `<PUBLIC_URL>/stripe/webhooks` for `invoice.paid`, `invoice.payment_failed`,
   `invoice.payment_action_required`, `customer.subscription.updated` and
   `customer.subscription.deleted`; set the Customer Portal to allow cancelling at the end of the
   billing period, updating payment methods and the invoice history. Billing creates its products
   and prices at start.
3. **Inventory.** Copy this folder as `cloud/` and add the values above. Check that the
   `fonoster/billing` repository on Docker Hub has the release's image.
4. **Deploy** (`gh workflow run deploy.yaml -f version=<version>`). Before approving the apply, read
   its `--check --diff`: billing's files and lines are there, and nothing else of billing changed.

## After a deploy

- An unsigned `POST <PUBLIC_URL>/stripe/webhooks` answers 400 (it reached billing; 200 with the
  dashboard's page means the route is missing).
- Stripe's "Send test event" on the endpoint gets a 2xx.
- `docker compose ps billing` shows it healthy, and `docker compose logs billing` shows
  `prisma migrate deploy` applying its migrations.
- The dashboard shows Billing, and AppBridge asks billing before every call: an owner without
  credits is refused.

## When a release changes an anchor's line

Each `before` or `after` in `inserts.yml` must match exactly one line of the release's file. When
a release changes or removes that line, its plan stops before the switch with
`fonoster_inserts: <file>: after '<anchor>' matches 0 lines of this release's file`, and nothing
changes. Update the anchor in `inserts.yml` (in this repository, from that release's file), copy
it into the inventory, and run the deploy again. Do it before approving that release's apply.

## Rollback

- **Of a release:** redeploy the previous version. Billing's files and lines are applied to it the
  same way.
- **Of billing:** remove `compose.billing.yaml` from `COMPOSE_FILE`, the `fonoster.yaml`
  `features.billing` and `appbridge.yaml` `authz` overrides, `fonoster_files` and
  `fonoster_inserts` together, and redeploy the same version. The `billing` database stays: its
  migrations only add.

## Watch

- AppBridge `admitted without an answer from authorization`: billing didn't answer, so calls go
  through for free.
- Billing `usage has no price on the rate card; not billed`.
- Billing must consume within 7 days, the usage stream's retention; after that, usage is lost.

## One owner's changes, on the host

```sh
docker compose exec billing fonoster-billing-admin trial   --email owner@acme.com --days 45
docker compose exec billing fonoster-billing-admin credits --email owner@acme.com --credits 500 --note "support case 123"
```

`trial` sets the Trial's length from its start (reopening an ended Trial); `credits` adds credits
(Trial credits on the Trial, like a top-up otherwise). `--owner <user ref>` instead of `--email`.

## Ops API

Fonoster's own metrics and interop alerts (`mods/ops/README.md`), at `<api host>/api/ops`.

### 1. Database role

Run once by the admin:

```sh
pw="$(openssl rand -hex 24)"; psql "<admin url to any database>" -v password="$pw" -f ops/cloud/ops-role.sql; echo "$pw"
```

Then use that value as `<password>` in the four URLs below. On a managed Postgres add
`sslmode=require` to the admin URL; `\connect` keeps it. The password is hex so it needs no URL
escaping.

The role must exist before `features.ops` is on. It also needs `USAGE` on schema `public` in the
`billing` database, which `ops-role.sql` doesn't grant. Where that schema is locked down, run this
as its owner, connected to `billing`, or `/api/ops/metrics` answers 503:

```sql
GRANT USAGE ON SCHEMA public TO fonoster_ops;
```

When a release's query reads a new column, grant it first, or `/api/ops/metrics` answers 503. Grants
are per column on purpose; run them as the tables' owner.

### 2. Inventory

Additions to production's values:

```yaml
fonoster_env:
  COMPOSE_FILE: compose.yaml:compose.external-db.yaml:compose.billing.yaml:compose.traces.yaml:compose.ops.yaml
fonoster_env_secrets:
  OPS_SECRET: "s<hex16>"   # printf 's%s\n' "$(openssl rand -hex 16)"
  OPS_DB_FONOSTER_URL: "postgresql://fonoster_ops:<password>@<managed db>:25060/fonoster?uselibpqcompat=true&sslmode=require"
  OPS_DB_IDENTITY_URL: "postgresql://fonoster_ops:<password>@<managed db>:25060/fnidentity?uselibpqcompat=true&sslmode=require"
  OPS_DB_ROUTR_URL: "postgresql://fonoster_ops:<password>@<managed db>:25060/routr?uselibpqcompat=true&sslmode=require"
  OPS_DB_BILLING_URL: "postgresql://fonoster_ops:<password>@<managed db>:25060/billing?uselibpqcompat=true&sslmode=require"
fonoster_files:
  compose.ops.yaml: "{{ lookup('file', inventory_dir ~ '/cloud/compose.ops.yaml') }}"
fonoster_overrides:
  fonoster.yaml:
    features:
      ops:
        enabled: true
        secret: "${OPS_SECRET}"
        databases:
          fonoster: "${OPS_DB_FONOSTER_URL}"
          identity: "${OPS_DB_IDENTITY_URL}"
          routr: "${OPS_DB_ROUTR_URL}"
          billing: "${OPS_DB_BILLING_URL}"
```

- `OPS_*` go in `fonoster_env_secrets`, never `fonoster_env`.
- Bare `?sslmode=require` fails with `DEPTH_ZERO_SELF_SIGNED_CERT`.
- Use the database's direct port, not a connection pooler, or the read-only start-up options may not
  apply.
- `routr_traces_enabled` and `compose.traces.yaml` are required.

### 3. First start

The first scan reads every retained trace, so expect a delay, then alerts for what's already there.

### 4. After a deploy

- No token: 401. With the token: `/api/ops/metrics` gives 200 with `"schema":1`.
- Pass the token with `curl --config -`, never on the command line.
- `ops: interop scan failed` and `ops: metrics query failed` in the API server's log say why a 503
  happened.
- Don't test by placing production calls.

### 5. Rotating the token

Change `OPS_SECRET`, deploy, update `token=` on the Mac.

### 6. What the token reaches

Recordings of real calls. Routr redacts digest responses, URI passwords and auth headers only; phone
numbers, IPs, digest usernames, `X-Access-Key-Id`, `X-Connect-Token` and SDP bodies stay. Treat
downloads as customer data.

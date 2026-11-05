# Fonoster Cloud: billing

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

# Build log: add-workspace-webhooks

Decisions taken while building, for the owner to review. Each can be reversed.

## 2026-10-15 (overnight, owner asleep)

### WH1. Core in `@fonoster/common` (`src/webhooks`, exported as `Webhooks`)

- Event builders for the five v1 types with the spec envelope (`evt_` ids, stable across retries);
  `call_record.sealed` carries `callRef`, `version` and `recordUrl` only.
- Signing per W4 (comma-separated signatures during rotation) and `verifyWebhook()` for
  receivers (rejects timestamps more than 300 s off).
- `WebhookDispatcher`: endpoints (HTTPS only; secrets `whsec_…`, shown once), rotation windows,
  fan-out by workspace and event type, at-least-once delivery (2xx within 10 s), backoff from
  10 s doubling (capped at 1 h) for 24 h, then failed and resendable with the same event id.
- Storage behind `WebhookStore` (memory implementation only). No database tables, API, SDK or
  dashboard yet (2.1, 2.5 storage, 3.x).
- Fake receiver for suites: `FakeWebhookReceiver` in `@fonoster/conformance` (task 1.1).

### WH2. Producers not wired yet (2.2, 2.4)

- The pieces exist: the gateway records `call.started`/`call.ended` and `call.failed`-like events,
  `CallRecordWriter` has `onSealed`, the registry calls `UsageSource.notify` with
  `provider.deprecated`. Turning them into deliveries needs the workspace of each call, which lives
  in the control plane (apiserver consuming events from NATS). Not done.

## 2026-10-15 (persistence stream)

### P-B5. Endpoint and delivery tables

- `webhook_endpoints` (workspace = `access_key_id`, url, events, `secret_hash` and
  `previous_secret_hash` as `/// @encrypted` columns, `previous_until` for the rotation window) and
  `webhook_deliveries` (the delivery log: event JSON with its id, status, attempts, timestamps,
  last HTTP status, next attempt). No foreign key from deliveries to endpoints: the log outlives a
  deleted endpoint, and its pending deliveries fail.
- `PrismaWebhookStore` implements `WebhookStore` with an endpoint snapshot (`refresh()`) and
  write-behind (P-B1 in add-provider-registry). `loadDeliveries()` reads the log (newest first) and
  makes those deliveries resendable by `WebhookDispatcher.resend`.
- Encryption needs a client with the apiserver's field-encryption extension
  (`openPrismaClient({encryptionKey})`); a client without it would store secrets in clear.

### P-B6. Retries survive a dead process (adoption)

- Each process retries the deliveries it created. A store opened with `adoptOverdue` claims pending
  deliveries more than 60 s overdue (a conditional update on `next_attempt_at`, so only one process
  wins) and retries them. The gateway runs with adoption on; the registry utility does not.
- Duplicates stay possible at the edges (at-least-once); receivers dedupe by event id.

### P-B7. The gateway's producer is wired (task 2.4, gateway part)

- Gateway config `database` + `webhooks: {enabled: true}`: `main.ts` builds a
  `WebhookDispatcher` over the database store, passes its `publish` as `GatewayOptions.webhooks`
  (call.started, call.ended, call.failed), attempts due deliveries every second and reloads
  endpoints every 30 s. `provider.deprecated` is produced by the registry utility (P-B3 in
  add-provider-registry). Media node and record writer producers are not wired here.

## 2026-10-15 (control stream)

### CP-B5. Webhooks API

- New gRPC service `fonoster.webhooks.v1beta2.Webhooks`: create (secret shown once), list, get,
  update (URL and/or events), delete, rotate (previous secret verifies 24 h, W4), list
  deliveries (newest first) and resend. Every query is scoped to the caller's access key id.
- Create and update reuse the dispatcher's checks (HTTPS, known event types) through a throwaway
  `MemoryWebhookStore`. Resend opens a `PrismaWebhookStore`, loads the one delivery and calls
  `WebhookDispatcher.resend`, so it signs exactly like the gateways.
- `apps.allowInsecureWebhooks` (default false) allows http:// endpoints for local testing.
- SDK `Webhooks`; dashboard Webhooks page (endpoints, events, rotation, delivery log, resend).
  No CTL commands yet.

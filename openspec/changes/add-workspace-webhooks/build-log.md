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

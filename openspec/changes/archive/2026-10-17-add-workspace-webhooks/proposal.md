## Why

Fonoster has no platform-wide way to tell a customer's systems that something happened. The only
webhooks today are Autopilot's `eventsHook` (`conversation.started`, `conversation.ended`), which
exist for one app type, carry an inline chat history and a guessed recording URL, and say nothing
about calls that fail, records that are ready, or models that are being retired.

The rebuild retires those assistant webhooks (`rework-autopilot`) and makes the call record the
source of truth for what happened on a call (`add-call-record`). Customers still need a push
signal to feed their CRMs and pipelines. One webhook system at the workspace level serves every
app type with one delivery, signing and retry model.

## What Changes

- **Workspace webhook subscriptions.** A workspace registers one or more endpoints (HTTPS URL plus
  the event types it wants). Managed through the API, CTL and dashboard.
- **v1 event types:**
    - `call.started`: a call began (call ref, app, numbers, direction).
    - `call.ended`: a call ended (adds duration and end reason).
    - `call.failed`: a call never reached an app (rejected, busy, no answer, app unreachable,
      media node crash before a session opened), with the failure reason.
    - `call_record.sealed`: a call record was sealed; carries the call ref and a link to fetch it,
      never the record's contents.
    - `provider.deprecated`: a model, voice or provider the workspace uses was deprecated; carries
      the item, its replacement and the retire date.
- **Signed deliveries.** Every request carries an HMAC signature over the timestamp and the body,
  made with a per-workspace signing secret, so receivers can verify origin and freshness.
- **At-least-once delivery.** Failed deliveries are retried with exponential backoff. Each event
  has a stable id so receivers can drop duplicates.
- **Delivery log.** The dashboard shows recent deliveries per endpoint with status, attempts and
  response code, and lets users resend one.
- **Replaces** Autopilot's `eventsHook`, which `rework-autopilot` removes (**BREAKING** there).

## Capabilities

### New Capabilities

- `workspace-webhooks`: workspace-level event subscriptions, the v1 event types and payloads,
  signing, retries, deduplication and the delivery log.

### Modified Capabilities

None.

## Impact

- **Affected code (when built):** the apiserver (subscription CRUD, event fan-out from the event
  bus, delivery workers), the SDK and CTL (subscription management), the dashboard (subscriptions
  and delivery log).
- **Producers:** the gateway and media node (`call.started`, `call.ended`, `call.failed`), the call
  record writer (`call_record.sealed`) and the provider registry (`provider.deprecated`).
- **Related changes:** `rework-autopilot` (retires `eventsHook`), `add-call-record` (seal
  notification, failed-call records), `add-provider-registry` (deprecation notices).

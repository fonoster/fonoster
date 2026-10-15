> Build started 2026-10-15 under the owner's overnight go-ahead. Decisions: see build-log.md.

## 1. Conformance assets

- [x] 1.1 Fake receiver that records requests and can answer with chosen status codes and delays
- [x] 1.2 Scenarios: each event type's payload, signature verification, stale timestamp rejection,
      retries with backoff, dedupe by id, manual resend, secret rotation window

## 2. Implementation

- [x] 2.1 Subscription storage and API (create, list, update, delete, rotate secret)
- [x] 2.2 Event fan-out from the event bus to subscribed endpoints
- [x] 2.3 Delivery workers: signing, timeout, retries with exponential backoff, failure marking
- [x] 2.4 Producers: `call.started`, `call.ended`, `call.failed` (gateway and media node),
      `call_record.sealed` (record writer), `provider.deprecated` (registry utility)
- [x] 2.5 Delivery log storage and resend

## 3. Surfaces and docs

- [x] 3.1 SDK and CTL subscription management
- [x] 3.2 Dashboard: endpoints, event selection, delivery log, resend
- [x] 3.3 Docs: payload reference, verifying signatures, migrating from Autopilot's `eventsHook` (done: docs/webhooks.md)

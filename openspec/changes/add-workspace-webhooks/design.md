## Context

Autopilot is the only part of Fonoster that pushes events today, through the assistant
`eventsHook`. Those webhooks are tied to one app type, embed data that the call record now owns,
and have no signing, retries or delivery history. The user decided to retire them and replace them
with a single webhook system at the workspace level.

## Goals / Non-Goals

**Goals**

- One webhook system for every app type, configured per workspace.
- Small payloads that point to the source of truth (the call record) instead of copying it.
- Verifiable deliveries (signature and timestamp) and reliable delivery (retries, dedupe ids).
- Visibility: users can see what was sent, what failed and resend it.

**Non-Goals**

- Continuous export of record contents to customer storage or warehouses (out of scope in v1).
- Per-app webhooks. Filtering by app can be added later as a subscription option.
- Real-time per-message streaming; that is what listeners on the session protocol are for.

## Decisions

### W1. Workspace-level subscriptions replace the assistant `eventsHook`

A workspace owns its endpoints; any app type's calls produce the same events. *Rejected:* keeping
Autopilot's webhooks (slimmed or as they are), which would leave two webhook systems and two copies
of the same data.

### W2. Five event types in v1

`call.started`, `call.ended`, `call.failed`, `call_record.sealed`, `provider.deprecated`. More types
are added only additively.

### W3. Payloads point to the record

Every payload has an envelope: `id` (unique, stable across retries), `type`, `createdAt`,
`workspaceRef` and `data`. `call_record.sealed` carries the `callRef` and a fetch link, never the
transcript, recording or SIP trace. Payloads never contain secrets or personal data beyond the
parties' numbers already shown in the call list.

### W4. HMAC signatures with a per-workspace secret

Each request carries a timestamp and an HMAC-SHA256 signature over `timestamp + "." + body`, made
with the workspace's signing secret. Receivers reject stale timestamps. The secret is shown once on
creation, can be rotated, and both secrets verify during a rotation window.

### W5. At-least-once delivery with retries and backoff

A delivery succeeds on any 2xx response within a timeout. Otherwise it is retried with exponential
backoff for a bounded period; after that the delivery is marked failed and stays resendable from the
dashboard. Receivers deduplicate by event `id`. Delivery order is not guaranteed.

### W6. Delivery log in the dashboard

For each endpoint: recent deliveries with event type, status, attempts, last response code and
time; a manual resend. Kept for a bounded period.

## Risks / Trade-offs

- **Duplicates.** At-least-once means receivers must deduplicate; the stable `id` makes that easy.
- **Breaking for Autopilot users.** Integrations on `eventsHook` must move; covered by release notes
  and a migration guide mapping `conversation.started/ended` to `call.started/ended` and
  `call_record.sealed`.
- **Endpoint outages** can build a backlog; retries are bounded and the log makes gaps visible.

## Open Questions

1. ~~Signature header name and format.~~ Resolved: `X-Fonoster-Timestamp` (Unix seconds) and
   `X-Fonoster-Signature` (hex HMAC-SHA256 of `<timestamp>.<raw body>`, comma-separated during
   rotation), ±300 s, the same scheme as the session connection signature.
2. ~~Retry schedule and maximum retry period.~~ Decided (build): exponential from 10 s, doubling,
   capped at 1 h per gap, for up to 24 h after the first attempt; then failed and resendable.
3. Delivery timeout per attempt: 10 s (decided, build). Delivery log retention (proposed: 30 days)
   is still open.
4. Maximum endpoints per workspace, and whether endpoints can filter by app in v1.
5. Whether the signing secret is per workspace or per endpoint.

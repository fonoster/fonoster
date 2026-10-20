# Design

## Context

See proposal.md for why. The model is in the planning doc "Metering & Billing: How It Works"
(2026-10-19). Current state that shapes this design (paths under `mods/`):

- **Usage facts exist.** `usage_events` (`apiserver/schema.prisma`, model `UsageEvent`) holds every
  line with a deterministic id, owner, workspace, app, call, region and region kind, origin, meter,
  quantity, provider, model and key source. Call usage arrives with the sealed record's index entry
  (`apiserver/src/records/createIndexRecord.ts`); other usage arrives on JetStream
  `FONOSTER_USAGE` (`apiserver/src/usage/runUsageConsumer.ts`). Nothing publishes stored usage.
- **Authz is pluggable but not called for sessions.** `authz.proto` defines
  `CheckSessionAuthorized` (response: `bool authorized` only). The apiserver uses Authz only for
  `CheckMethodAuthorized` as a gRPC interceptor (`apiserver/src/core/runServices.ts:90-99`).
  AppBridge never asks. `DummyAuthzHandler` (`authz/src/server/DummyAuthzHandler.ts`) answers yes.
- **Refusing a call has a precedent.** A denied browser test is recorded as `call.started` then
  `call.failed {reason: test_call_denied}` and rejected with SIP 403
  (`appbridge/src/AppBridge.ts:442-459`), before the caller hears ringing.
- **Config.** `features.billing.enabled` exists (default false) and already refuses to start without
  `authz.enabled` (`apiserver/src/config/schema.ts:33,313`).
- **Keys.** Since `remove-platform-key-fallback`, a call never silently moves from the customer's key
  to ours, so `keySource` on a usage line is exactly whose key was used.
- **Stripe fake.** `mods/stripe-fake` answers the Stripe API subset at `2026-09-30.endive`, with test
  clocks and a `/_fake` control API.

## Goals / Non-Goals

**Goals:**

- Every billable usage line is charged exactly once, in credits, at the rate card in force when it
  happened.
- A call is admitted from our own ledger in under 5 ms. Stripe is never on a call's path.
- Our ledger and Stripe agree after each invoice; a nightly check proves it.
- Community installs run no billing code and change nothing.

**Non-Goals:**

- Private-region licenses (issuing, checking, the $25,000/year fee).
- Commits, volume discounts, an Enterprise tier, multiple currencies (USD only).
- Retention rules for usage and billing records.

## Decisions

### D1. A separate service with its own database

`mods/billing` runs as its own process (`fonoster-billing`) with its own Postgres database
`billing`, its own user and migrations. It may share the apiserver's Postgres server. No other
service reads or writes that database. It serves two gRPC services: `Authz` (for AppBridge and the
apiserver) and `Billing` (for the dashboard, through the apiserver).

Why not inside the apiserver: billing is off in Community and must not add tables or code paths
there; it also needs different scaling (the admission check is hot) and different secrets (Stripe).

### D2. Usage reaches billing through an apiserver outbox

`usage_events` gains `published_at` (null until published). In the same transaction as the insert,
nothing changes; a publisher loop in the apiserver reads unpublished rows in `recorded_at` order,
publishes each on `usage.recorded.<ownerRef>` to stream `FONOSTER_USAGE_RECORDED` with the usage id
as `Nats-Msg-Id` (JetStream deduplication), and sets `published_at`. It runs only when
`features.billing.enabled` is true.

Billing consumes the stream durably and stores each event once (`rated_lines` is keyed by usage
id). A crash between publish and marking only republishes; deduplication and the key make that
harmless.

Alternatives: billing reading `usage_events` directly (breaks "one owner per store"); a cursor RPC
over a sequence column (sequences are not commit-ordered, so a cursor can skip rows).

### D3. Rate cards are data, versioned

`rate_cards` rows: `version`, `starts_at`, and a JSON body of prices per meter, provider and model in
credits per unit (decimals allowed). A rated line's amount rounds once, half up, to whole
milli-credits (D5). A card is never edited; a new version with a later `starts_at` replaces it. The
rater picks the card in force at the usage's `occurred_at`. The first card is seeded from
`mods/billing/rate-cards/<version>.yaml`, reviewed in pull requests. Vendor-cost prices come from the
vendors' published prices; a card states its source date.

### D4. The rater is one pure function

`rate(usage, plan, card) → RatedLine {billable, reason, amountMilliCredits, rateCardVersion,
category}`. Rules in order, first match wins:

| # | When | Billable | Reason | Category |
| - | ---- | -------- | ------ | -------- |
| 1 | `regionKind` is `private` | no | `private_region` | — |
| 2 | vendor meter and `keySource` is `workspace` | no | `byok` | — |
| 3 | `amd.*` | no | `included` | — |
| 4 | `recording.seconds`, `storage.bytes` | no | `included` | — |
| 5 | `calls.concurrent` | no | `limit_only` | — |
| 6 | `call.seconds` (any origin) | yes, `max(60, seconds)` per call | `platform_minutes` | Platform minutes |
| 7 | `stt`, `tts`, `llm`, `embedding`, `eval.llm` on our key | yes, vendor cost | `platform_key` | AI usage |
| 8 | `nc.seconds` on our key | yes, vendor cost | `addon` | Add-ons |
| 9 | anything else | no | `unpriced` | — (and an alert) |

A meter with no price on the card falls to rule 9 and raises an alert rather than guessing.

### D5. Money as integer milli-credits

Per-token prices are fractions of a credit. Rated lines store `amount_milli_credits` (integer;
1 credit = 1000 milli-credits = $0.01). The ledger debits whole milli-credits. Stripe receives meter
events in milli-credits on a meter whose price is $0.00001 per unit, so Stripe's invoice equals our
sum with no rounding drift.

### D6. The ledger

`balance_ledger` is append-only: `id`, `account_id`, `kind` (`trial_grant`, `plan_grant`,
`topup_grant`, `debit`, `expiry`, `refund`, `adjustment`), `bucket` (`trial`, `plan`, `topup`),
`amount_milli_credits` (signed), `expires_at` (grants), `source` (rated line, Stripe event,
operator), `created_at`. The balance is the sum. Per-bucket remaining amounts are derived and cached
in `balance_snapshot` (rebuilt from the ledger at any time).

Debits take from the earliest-expiring bucket first: plan (or trial), then top-ups by expiry, then
the overdraft (balance below zero). Expiry entries remove what is left of a grant when it expires.

Overdraft: `max(200 credits, 10% of the last top-up)`, zero for trial accounts.

### D7. Admission

`CheckSessionAuthorizedResponse` gains `string reason = 2`. The billing service answers from
`balance_snapshot` and an in-memory count of active calls per account:

- `balance + overdraft > 0`, else `insufficient_balance`;
- active calls < the plan's concurrency limit, else `concurrency_limit`.

AppBridge calls it after resolving the app and the test-call check, before ringing. On a refusal it
records `call.failed` with the reason and rejects with SIP 402 (`insufficient_balance`) or 503
(`concurrency_limit`). The apiserver calls it in `CreateCall` before any SIP and answers
`FAILED_PRECONDITION` with the reason. Active calls are counted from `call.started` / `call.ended`
lifecycle events, which billing consumes.

If the billing service does not answer within 500 ms, AppBridge **admits** the call and logs it
(open). Billing being down must not take calls down; the overdraft bounds the exposure. This is a
decision for the owner (Q3).

### D8. Stripe through an outbox and an inbox

Billing never calls Stripe inline. Every intent to tell Stripe (create customer, subscribe, meter
event, credit grant, payment intent) is a `stripe_outbox` row written in the same transaction as the
ledger change, sent by a worker with an idempotency key equal to the row id. Webhooks land in
`stripe_events` (deduped by Stripe event id) and are applied by a second worker. Signatures are
checked with the endpoint secret.

Stripe objects per account: one customer; a subscription with the $25 licensed price and the
metered usage price (D5); a promotional credit grant per plan period and a paid credit grant per
top-up, both scoped to metered prices, mirroring our ledger grants. Stripe applies grants to the
metered line at finalization, so the invoice shows $25 plus usage less credits.

### D9. Plan credits outlive the period by the finalization grace

Stripe applies credit grants when it finalizes the invoice, which is after the period ends (up to
72 h for meter events to arrive). A grant expiring exactly at period end would miss its own
period's usage. So the plan grant (ours and Stripe's) expires at **period end + grace** (default
72 h), and the ledger stops debiting plan credits for usage with `occurred_at` after period end.
Usage of the new period during the grace window debits the new period's plan grant. (Found while
building the Stripe fake; owner to confirm, Q1.)

### D10. The billing clock

The service reads time from a `Clock` (config: `system`, or `stripe-test-clock` with a clock id).
In tests it follows the Stripe fake's test clock, so a month passes in one request.

### D11. Accounts are per owner

One billing account per owner (the identity that owns workspaces), shared by all their workspaces.
Every rated line keeps its workspace so the Billing page can split by workspace.

## Risks / Trade-offs

- [Billing down at admission → calls admitted unpaid] → bounded by the overdraft; alert on
  admission timeouts; Q3 lets the owner choose closed instead.
- [Vendor prices change] → a new rate card version; past lines stay at the old card; re-rating is an
  explicit job (reversing entries + new lines).
- [Stripe and our ledger disagree] → nightly reconciliation compares Stripe's credit balance summary
  and invoice totals with the ledger and opens an alert; our ledger is authoritative for admission.
- [Late usage after finalization] → lands on the next invoice (Stripe's meter event window allows
  35 days); the ledger debits it when it arrives.
- [Hot admission path] → served from memory, snapshot refreshed on every ledger change for that
  account; measured in conformance (p99 < 5 ms).

## Migration Plan

1. Authz `reason` field and the AppBridge/apiserver admission calls, behind `authz.enabled` (Dummy
   says yes): no behavior change anywhere.
2. Usage outbox in the apiserver, behind `features.billing.enabled`.
3. `mods/billing`: schema, rater, ledger, consumer, admission, Stripe sync, in that order; runs only
   when configured.
4. Billing page in the dashboard behind `billing.enabled`.
5. Conformance billing suite on PRs; nightly sandbox run once the owner adds the Stripe secret.

Rollback: turn `features.billing.enabled` off; admission returns to Dummy; the ledger is kept.

## Decisions (owner, 2026-10-20)

- **Q1.** Plan credits expire at period end + 72 h, paying only for usage of their own period (D9).
- **Q2.** Trial: 1,000 credits, no card needed, expiring 30 days after the grant; no overdraft.
- **Q3.** Billing unreachable at admission: the call is admitted and the timeout logged (D7).
- **Q4.** Concurrent answered calls per owner: Trial 2, Pay-as-you-go 20, raised per account.
- **Q5.** Smallest top-up $10 (1,000 credits). Auto-recharge is off until the owner turns it on;
  the form suggests a 500-credit threshold and a 2,500-credit amount.
- **Q6.** Stripe Tax on: automatic tax on the subscription and on top-ups. The owner enables Stripe
  Tax in the Stripe account.
- **Q7.** The Billing page is its own change, `add-billing-page`, with its Pencil design.
- **Q8.** The per-minute price is configuration (the rate card), defaulting to 4.8 credits a
  minute (0.08 a second). To be reviewed by the owner.
- **Q9.** The billing NATS user exists only in Cloud's deployment (a Helm value, off by default);
  self-hosted `nats.conf` files don't change.

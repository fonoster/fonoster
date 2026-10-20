# Proposal

## Why

Fonoster Cloud has to charge for what it costs us, and today nothing does. Metering
(`usage-metering`) records every quantity a call or eval uses, with whose key it ran. The Stripe
fake (`add-stripe-fake`) lets billing code run without Stripe. What is missing is the service that
turns usage into credits spent, keeps the balance, refuses calls when the balance is gone, and
keeps Stripe in step so customers get correct invoices.

The model was agreed with the owner on 2026-10-19 and 2026-10-20 (planning doc "Metering & Billing:
How It Works"): metering records facts in every edition; **billing rates them in Cloud only**. Prices
are in credits (1 credit = $0.01). Pay-as-you-go costs $25 a month and buys 2,500 plan credits, which
are spent first. Top-up credits last 12 months. AI usage on Fonoster's keys is billed at vendor cost.
Usage on the customer's own keys, private-region usage and answering-machine detection are never
billed.

## What Changes

- **A billing service, `mods/billing`** (MIT, in the monorepo, off by default). It runs only when
  `features.billing.enabled` is true and owns its own Postgres database, `billing`.
- **Rate cards**: versioned price lists in credits, never edited in place. A new card applies from
  its start date.
- **The rater**: one pure function, usage event + plan + rate card → rated line (billable or not, the
  reason, the amount in credits, the rate card version, the invoice category). Rules apply in a fixed
  order and the first match wins: private region, customer key, AMD, included storage, limits only,
  call minutes (60-second minimum per call), AI on our keys at cost, noise cancelling as an add-on.
- **The balance ledger**: append-only entries in credits (trial grant, plan grant, top-up, debit,
  expiry, refund, adjustment). The balance is their sum. Plan credits are spent first, then top-ups,
  then a small overdraft.
- **Admission**: the billing service implements the existing Authz `CheckSessionAuthorized`. AppBridge
  calls it before answering an inbound call or browser test, and the apiserver before placing an
  outbound call. A refusal carries a reason: `insufficient_balance` or `concurrency_limit`. A call
  already in progress is never cut for balance.
- **Stripe in step through an outbox**: customers, the $25 subscription, meter events for billable
  usage, credit grants for plan and top-up credits, top-up payments. A webhook inbox, deduplicated by
  event id, records what Stripe reports (paid, failed, refunded).
- **Top-ups and auto-recharge**: one-off top-ups, and an optional recharge when the balance crosses
  the customer's threshold. After 3 failed attempts auto-recharge turns off and the customer is told.
- **Usage reaches billing through an outbox in the apiserver**: each new `usage_events` row is
  published once on a JetStream stream, so billing never reads the apiserver's database.
- **A Billing API** for the dashboard (owners only). The Billing page itself is its own change,
  `add-billing-page`.
- **Billing scenarios in conformance** that drive the Stripe fake (moved here from
  `add-stripe-fake`, whose system under test this service is), and the nightly run against a real
  Stripe sandbox.

Out of scope: private-region licenses (their own change), commits and volume discounts, an
Enterprise tier, retention of usage and billing records (not decided).

## Capabilities

### New Capabilities

- `billing`: rate cards, the rater, the ledger, admission, Stripe sync, top-ups and auto-recharge,
  plans and the trial, and reconciliation.

### Modified Capabilities

- `usage-metering`: stored usage events are published once for billing.
- `voice-session`: AppBridge asks for admission before answering, and records `call.failed` with the
  refusal reason.
- `conformance`: billing scenarios with a `stripe:` block, on every pull request and nightly
  against a Stripe sandbox.

## Impact

- New: `mods/billing` (service, Prisma schema and migrations, rater, ledger, Stripe client, Authz
  server, `fonoster-billing` bin), `ops/rebuild` service and config.
- `mods/common/src/protos/authz.proto`: `CheckSessionAuthorizedResponse` gains a `reason` field
  (wire compatible); a new `Billing` gRPC service for the dashboard.
- `mods/apiserver`: usage outbox publisher; admission check in `CreateCall`; a proxy for the Billing
  API.
- `mods/appbridge`: admission check at session start.
- `mods/conformance`: `stripe:` scenario block and the billing suite; a nightly workflow.
- Community installs: no change. Billing is off, `DummyAuthzHandler` keeps answering yes, and no
  billing code runs.

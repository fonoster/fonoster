# Tasks

> Order follows the migration plan in design.md: the admission hooks first (no behavior change with
> the dummy handler), then the usage feed, then the service, then Stripe, the page and the suites.

## 1. Admission hooks

- [ ] 1.1 `authz.proto`: `string reason = 2` on `CheckSessionAuthorizedResponse`; `AuthzHandler.checkSessionAuthorized` returns `{authorized, reason?}`; Dummy answers `{authorized: true}`; verify old clients still decode the response
- [ ] 1.2 AppBridge: admission after the test-call check (`AppBridge.ts`), 500 ms timeout admits and logs, refusal records `call.failed` with the reason and rejects 402/503; verify tests for each outcome with a fake Authz server
- [ ] 1.3 apiserver `CreateCall`: admission before any SIP, `FAILED_PRECONDITION` with the reason; verify tests

## 2. Usage feed

- [ ] 2.1 `usage_events.published_at` migration and the publisher loop on `FONOSTER_USAGE_RECORDED` (`Nats-Msg-Id` = usage id), only with billing on; verify the restart scenario with the NATS harness and that nothing is published with billing off

## 3. Service skeleton and ledger

- [ ] 3.1 Scaffold `mods/billing` (config file, Prisma schema for `billing_accounts`, `subscriptions`, `rate_cards`, `rated_lines`, `balance_ledger`, `balance_snapshot`, `stripe_outbox`, `stripe_events`), `fonoster-billing` bin, the `Clock` (D10); verify migrations apply on an empty database
- [ ] 3.2 Rate cards: YAML seed, loader, card-at-time lookup; verify the "new card" scenario
- [ ] 3.3 The rater (D4) as a pure function with a table-driven test per rule and for rule order; verify every scenario under "Rated lines follow fixed rules"
- [ ] 3.4 The ledger (D6): entries, bucket order, overdraft, expiry, snapshot rebuild; verify "plan credits first" and "plan credits expire"
- [ ] 3.5 Usage consumer: durable consumer, rate, debit, all in one transaction keyed by usage id; verify "the same usage twice"

## 4. Admission service

- [ ] 4.1 Authz server in billing: `CheckSessionAuthorized` from the snapshot and active-call counts (from lifecycle events); verify "balance gone", "a long call crosses zero" and a benchmark for p99 < 5 ms

## 5. Stripe

- [ ] 5.1 Outbox worker (idempotency key = row id, backoff) and webhook inbox (signature, dedupe by event id); verify "Stripe down" and "a webhook delivered twice" against the Stripe fake
- [ ] 5.2 Accounts: customer, Pay-as-you-go subscription ($25 licensed + metered milli-credit price), trial grant; plan grant per paid period expiring at period end + grace (D9); verify "a paid month" and "usage in the last hour" with a test clock
- [ ] 5.3 Billable rated lines as meter events in milli-credits; verify an invoice total equals the ledger after a test-clock month
- [ ] 5.4 Top-ups, auto-recharge (one per crossing, off after 3 failures, notice), authentication-required handling, operator refund; verify the three top-up scenarios
- [ ] 5.6 Stripe Tax: automatic tax on the subscription and on top-ups (Q6); verify the requests ask for it, against the Stripe fake
- [ ] 5.5 Nightly reconciliation job; verify the "drift" scenario by changing the fake's state through `/_fake`

## 6. Billing API

- [ ] 6.1 `Billing` gRPC service (balance by bucket, plan, auto-recharge settings, create top-up, Customer Portal session) proxied by the apiserver for owners only; verify tests

## 7. Stack, conformance and docs

- [ ] 7.1 Billing service in `ops/rebuild` (compose service on a `billing` profile with the Stripe fake, config; the billing NATS user only where billing runs, a Helm value off by default, Q9); verify a call is refused once the balance is gone, end to end
- [ ] 7.2 The `stripe:` scenario block and the billing suite in `mods/conformance`, on PR CI against the fake; verify "a declined top-up" and "a month of usage"
- [ ] 7.3 Nightly workflow against a Stripe test-mode sandbox with the diff report and issue (needs the owner's test-mode key as a CI secret); verify one manual run
- [ ] 7.4 Docs: Billing for Cloud users (credits, plans, top-ups, auto-recharge) and the self-hosting note that billing is off; verify the docs build has no broken links

## Workflow follow-up

- Archive after merge. Next changes: `add-billing-page` (the dashboard Billing tab, Q7), then private-region licenses.

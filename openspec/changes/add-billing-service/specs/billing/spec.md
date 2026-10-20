# Spec Delta

## ADDED Requirements

### Requirement: Billing runs only when enabled

The billing service SHALL run only when `features.billing.enabled` is true, with its own database
that no other service reads or writes. With billing off, no billing code SHALL run and session
admission SHALL behave as before.

#### Scenario: Community install

- **WHEN** a self-hosted install runs with `features.billing.enabled` false
- **THEN** calls are admitted by the dummy authorization handler, usage is still recorded, and no
  request reaches a billing service or Stripe

### Requirement: Rated lines follow fixed rules

Each usage event SHALL be rated exactly once into a rated line (billable, reason, amount in
milli-credits, rate card version, invoice category) by fixed rules in a fixed order, the first match
winning: `private_region`, `byok`, `included` (answering-machine detection, recording, storage),
`limit_only`, `platform_minutes` (at least 60 s per call), `platform_key` and `addon` (vendor cost).

#### Scenario: Unpriced usage

- **WHEN** a meter has no price on the rate card
- **THEN** its line is not billable with reason `unpriced` and an alert is raised

#### Scenario: Private region on our key

- **WHEN** usage from a private region used Fonoster's TTS key
- **THEN** the rated line is not billable with reason `private_region`

#### Scenario: Customer's STT key

- **WHEN** a call's `stt.seconds` line has `keySource: workspace`
- **THEN** it is not billable with reason `byok`

#### Scenario: A short call

- **WHEN** a call lasts 20 seconds
- **THEN** its `call.seconds` line is billed as 60 seconds

#### Scenario: The same usage twice

- **WHEN** the same usage event arrives twice
- **THEN** one rated line exists and the balance is debited once

### Requirement: Rate cards are versioned

Prices SHALL come from rate cards that are never edited after they start. A usage event SHALL be
rated with the card in force at the time it happened.

#### Scenario: A new card

- **WHEN** card 2 starts on the 15th and a call happened on the 14th but arrives on the 16th
- **THEN** the call is rated with card 1

### Requirement: The balance is a ledger

The balance SHALL be the sum of append-only ledger entries in milli-credits. Credits SHALL be spent
in this order: plan (or trial) credits, then top-up credits by earliest expiry, then the overdraft.
The overdraft SHALL be the larger of 200 credits and 10% of the last top-up, and zero on a trial.
Unused grants SHALL be removed by an expiry entry when they expire.

#### Scenario: Plan credits first

- **WHEN** an account has 2,500 plan credits and 1,000 top-up credits and uses 3,000 credits
- **THEN** the plan credits reach zero and 500 top-up credits remain

#### Scenario: Plan credits expire

- **WHEN** a period ends with 300 plan credits unused and the grace period passes
- **THEN** an expiry entry removes the 300 credits and the top-up credits are untouched

### Requirement: Plans

The service SHALL support a Trial (1,000 credits once, no overdraft) and Pay-as-you-go ($25 a month,
2,500 plan credits each paid period). Plan credits SHALL stay spendable for usage of their period
until the period's invoice is finalized. Top-up credits SHALL expire 12 months after purchase.

#### Scenario: A paid month

- **WHEN** a Pay-as-you-go period's $25 payment succeeds
- **THEN** the ledger gains a 2,500-credit plan grant expiring at period end plus the grace period

#### Scenario: Usage in the last hour of the period

- **WHEN** usage from the period's last hour is rated during the grace window
- **THEN** it is paid from that period's plan credits

### Requirement: Admission from the ledger

The billing service SHALL implement `CheckSessionAuthorized` from its own ledger, without calling
Stripe, refusing with reason `insufficient_balance` when balance plus overdraft is not above zero and
with `concurrency_limit` when the account's active calls reach its plan's limit. A call in progress
SHALL never be ended for balance.

#### Scenario: Balance gone

- **WHEN** an account's balance plus overdraft is zero and an inbound call arrives
- **THEN** the call is refused with `insufficient_balance`

#### Scenario: A long call crosses zero

- **WHEN** a call in progress uses more than the balance
- **THEN** the call continues, the balance goes into the overdraft, and the next call is refused

#### Scenario: Fast answer

- **WHEN** conformance measures admission checks under load
- **THEN** the p99 answer time is under 5 ms

### Requirement: Stripe is kept in step

Every change Stripe must know of (customer, subscription, billable usage as meter events, credit
grants, payments) SHALL be written to an outbox with the ledger change and sent with an idempotency
key. Stripe webhooks SHALL be verified, stored once per event id, and applied once. Billable usage
SHALL reach Stripe in milli-credits so Stripe's invoice equals the ledger's sum.

#### Scenario: Stripe down

- **WHEN** Stripe does not answer for an hour
- **THEN** calls are admitted and rated as usual, and the outbox delivers everything once Stripe
  answers, without duplicates

#### Scenario: A webhook delivered twice

- **WHEN** Stripe delivers `invoice.paid` twice
- **THEN** it is applied once

### Requirement: Top-ups and auto-recharge

An account SHALL be able to buy top-up credits, which reach the ledger only after Stripe confirms
the payment. With auto-recharge on, crossing the customer's threshold SHALL start one off-session
payment per crossing. After 3 failed attempts in a row auto-recharge SHALL turn off and the owner
SHALL be told. A payment that needs authentication SHALL leave the balance unchanged and tell the
owner.

#### Scenario: Auto-recharge

- **WHEN** the balance falls below a 500-credit threshold with a 2,500-credit amount
- **THEN** one payment of $25 is made and, once paid, 2,500 top-up credits are added

#### Scenario: Card keeps failing

- **WHEN** three recharge payments in a row are declined
- **THEN** auto-recharge is off and the owner receives a notice

#### Scenario: Refund of unused top-up

- **WHEN** an operator refunds an unused top-up within 30 days of purchase
- **THEN** a refund entry removes those credits and Stripe refunds the payment

### Requirement: Ledger and Stripe reconcile

A nightly job SHALL compare each account's ledger with Stripe's credit balance and finalized
invoices, and SHALL alert on any difference, naming the account and both amounts.

#### Scenario: Drift

- **WHEN** Stripe's remaining credit for an account differs from the ledger after finalization
- **THEN** the job alerts with the account and both values, and changes nothing

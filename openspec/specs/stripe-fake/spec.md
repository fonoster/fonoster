# stripe-fake Specification

## Purpose
A stateful fake of the part of Stripe Billing that Fonoster's billing uses, so billing runs and is
tested end to end with no network or Stripe account, and shows what Stripe would see.

## Requirements

### Requirement: A drop-in Stripe endpoint

The fake SHALL serve Stripe's REST API for the resources it emulates at port 12111, so that the
official Stripe SDK works against it with only its base URL changed. It SHALL run as a container on
the `fakes` profile of the local and CI stacks, and every object it returns SHALL have `livemode:
false`.

#### Scenario: The Stripe SDK talks to the fake

- **WHEN** the Stripe Node SDK is created with host `localhost`, port 12111 and protocol `http` and
  calls `customers.create({ email: "ada@acme.com" })`
- **THEN** it receives a customer whose id starts with `cus_` and whose `livemode` is false
- **AND** `customers.retrieve` with that id returns the same customer

### Requirement: A Customer Portal page

With `STRIPE_FAKE_PORTAL_URL` set (the fake's address as browsers reach it), Customer Portal
sessions SHALL link to a page the fake serves, where the owner changes the default card to a test
card, cancels the plan at the period's end or renews it, through the API's own handlers and their
events. Without it, links name Stripe's host.

#### Scenario: Cancel in the portal

- **WHEN** a portal session's page is opened and its Cancel plan form is posted
- **THEN** the page answers 303 back to itself, the subscription has `cancel_at_period_end`, and a
  signed `customer.subscription.updated` is delivered; Renew plan reverses it, and an unknown
  session answers 404

### Requirement: Requests and responses follow Stripe's OpenAPI spec

The fake SHALL validate every request and every response against a pinned version of Stripe's public
OpenAPI spec. An unknown path SHALL answer 404 and an unknown or invalid parameter SHALL answer 400
`invalid_request_error`, both in Stripe's error shape `{error: {type, code, message, param}}`.

#### Scenario: Unknown parameter

- **WHEN** a client creates a customer with the parameter `colour=red`
- **THEN** the fake answers 400 with `error.type` `invalid_request_error` and `error.param` `colour`

#### Scenario: Unknown path

- **WHEN** a client calls `GET /v1/not_a_resource`
- **THEN** the fake answers 404 in Stripe's error shape

### Requirement: Idempotent requests

A POST with an `Idempotency-Key` header SHALL return the same response when repeated with the same
parameters within 24 hours, and SHALL answer `idempotency_error` when repeated with different ones.

#### Scenario: A retried grant is not granted twice

- **WHEN** a client creates a credit grant twice with the same `Idempotency-Key` and parameters
- **THEN** both responses carry the same grant id and only one grant exists

### Requirement: Billing Meters and meter events

The fake SHALL emulate Billing Meters and meter events: an `identifier` is accepted once per 24
hours, a timestamp older than 35 days is refused, and validation is asynchronous. An event for an
unknown customer or inactive meter is accepted with 200, then reported through a thin
`v1.billing.meter.error_report_triggered` event. Event summaries SHALL aggregate by minute.

#### Scenario: A repeated identifier counts once

- **WHEN** two meter events for meter `call_seconds` with identifier `usg_abc` and value 60 arrive
- **THEN** the meter's summary for that customer and minute is 60

#### Scenario: Unknown customer

- **WHEN** a meter event names a customer that does not exist
- **THEN** the request answers 200
- **AND** a `v1.billing.meter.error_report_triggered` event follows, and its full event can be read at
  `GET /v2/core/events/{id}`

### Requirement: Credit grants apply to metered usage at finalization

Credit grants SHALL apply only to metered price lines, at invoice finalization, after discounts and
before tax, in Stripe's order: priority, then earlier expiry, then promotional before paid, then
earlier effective date. Expired grants SHALL no longer apply, and the credit balance summary SHALL
reflect what remains.

#### Scenario: Plan credits are spent before top-ups and never pay the plan fee

- **WHEN** a customer with a promotional grant of $25 (expiring at period end) and a paid grant of
  $10 is invoiced $25 for the plan and $30 of metered usage
- **THEN** the invoice applies $25 of the promotional grant and $5 of the paid grant to the usage
  lines only
- **AND** the amount due is $25 for the plan, and the balance summary shows $5 of the paid grant left

### Requirement: Subscriptions and invoices cycle under a test clock

Advancing a test clock SHALL run the billing cycle in order: the subscription renews (licensed
prices in advance, metered usage in arrears), a draft invoice is created, it finalizes after the
grace period (default 1 hour, settable up to 72 hours), credits apply, payment is attempted, and
failures are retried on a schedule. Test clocks SHALL have no customer or subscription limit.

#### Scenario: A month passes

- **WHEN** a clock with an active $25/month subscription and 9,480 metered seconds is advanced one
  month and two hours
- **THEN** the events `invoice.created`, `invoice.finalized`, `payment_intent.succeeded` and
  `invoice.paid` are emitted in that order
- **AND** the invoice holds the plan line and the metered line computed from the meter's summary

### Requirement: Payments follow Stripe's test payment methods

Payment intents confirmed off session SHALL succeed or fail by payment method like Stripe's test
methods: `pm_card_visa` succeeds, `pm_card_chargeDeclined` and
`pm_card_chargeDeclinedInsufficientFunds` fail with 402 and the matching `decline_code`, and
`pm_card_authenticationRequired` requires action.

#### Scenario: Insufficient funds

- **WHEN** an off-session payment intent is confirmed with `pm_card_chargeDeclinedInsufficientFunds`
- **THEN** the request answers 402 with `decline_code` `insufficient_funds`
- **AND** a `payment_intent.payment_failed` event is emitted

### Requirement: Webhooks are signed and delivered like Stripe's

Events SHALL use Stripe's event envelope and be delivered to each registered endpoint with a
`Stripe-Signature` header `t=<unix>,v1=<hex HMAC-SHA256 of "<t>.<body>">` with the endpoint's
secret, in Stripe's order, retried with backoff on a non-2xx answer, and listed by `GET /v1/events`.

#### Scenario: Stripe's library verifies the fake's signature

- **WHEN** an endpoint receives an event from the fake and checks it with the Stripe SDK's
  `webhooks.constructEvent` and the endpoint's secret
- **THEN** the event verifies and its `type` and `data.object` match the change that caused it

#### Scenario: A failed delivery is retried

- **WHEN** the endpoint answers 500 to an event
- **THEN** the fake delivers the same event id again later, until a 2xx answer or the retry window
  ends

### Requirement: A control API for tests

The fake SHALL serve a control API under `/_fake/`, never under `/v1`: reset, snapshot and restore,
advance all clocks, set a customer's next payment outcome (succeed, decline, requires action,
timeout), fail the next N webhook deliveries, replay an event, inject a meter error report, add
latency and turn rate limiting on or off.

#### Scenario: Fail the next payment

- **WHEN** a test calls `/_fake/customers/cus_1/next_payment` with `decline` and the next invoice for
  `cus_1` is paid automatically
- **THEN** the payment fails with `card_declined`, `invoice.payment_failed` is emitted, and the
  payment after it follows the payment method again

#### Scenario: Reset

- **WHEN** a test calls `/_fake/reset`
- **THEN** every object, event and clock is gone and ids start over

### Requirement: The viewer shows what Stripe would see

The fake SHALL serve a viewer at `/` with Customers (credit balance in credits, plan and top-up
credits, meter totals, recent webhooks), Meters (meters and recent events, accepted or rejected),
Credit grants, Invoices (list and line items) and Webhooks (delivery log with status, attempts and
replay). The test clock and the controls SHALL be on every screen, and the viewer SHALL update live.

#### Scenario: Watching a payment fail

- **WHEN** the viewer is open on Webhooks and a test makes the next payment fail
- **THEN** the `invoice.payment_failed` delivery appears without a reload, with its status and a
  Replay action

#### Scenario: Credits as billing shows them

- **WHEN** a customer has a $18.40 credit balance
- **THEN** the Customers screen shows 1,840 credits ($18.40), split into plan and top-up credits

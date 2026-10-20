# Proposal

## Why

Billing (the later `add-billing-service`) talks to Stripe: Billing Meters, Credit Grants,
subscriptions, invoices, payment intents and webhooks. It has to be testable end to end on a laptop
and in PR CI, with no network and no Stripe account. Nothing off the shelf does that. stripe-mock is
stateless, localstripe is GPL and stops at invoices, PaperTiger and Vercel's emulator have no meters
or credit grants, and a real sandbox needs network, caps test clocks at three customers and can't
inject failures. The owner called this "one of the most important fakes" (2026-10-16), and it must
show what Stripe would see.

## What Changes

- A new module `mods/stripe-fake`: a stateful fake of the part of Stripe Billing that Fonoster's
  billing uses. It is a container on the `fakes` profile at port 12111, and the official Stripe SDK
  works against it by changing the base URL.
- Requests and responses are validated against Stripe's public OpenAPI spec (pinned version), with
  Stripe's error shape, idempotency keys and object ids.
- State machines for customers, payment methods, products and prices, Billing Meters and meter
  events, credit grants, subscriptions, invoices, payment intents, refunds and test clocks. Advancing
  a clock runs the billing cycle: renew, close the period, finalize after the grace period, apply
  credits, charge, retry, expire credits. Events are emitted in Stripe's order.
- Webhooks with Stripe's envelope and `Stripe-Signature` scheme, retried with backoff, plus the thin
  v2 meter error report.
- A control API under `/_fake/*` (never under `/v1`): reset, snapshot and restore, advance time,
  force the next payment's outcome, fail webhook deliveries, replay events, inject meter error
  reports, add latency, rate-limit.
- A viewer at `/`: Customers, Meters, Credit grants, Invoices and Webhooks, with the test clock and
  the controls (design: `designs/stripe-fake.pen`).
- Conformance: scenarios gain a `stripe:` block that drives the fake; the same billing scenarios run
  nightly against a real Stripe sandbox, and differences fail the job.

Out of scope here: the billing service itself, alerts, the tax engine (a flat-rate stub only),
Checkout and the customer portal, and the v2 high-volume meter stream (later, when billing needs it).

## Capabilities

### New Capabilities

- `stripe-fake`: what the fake emulates, how it behaves, its control API and its viewer.

### Modified Capabilities

- `conformance`: billing scenarios drive the Stripe fake in PR CI, and the same scenarios run nightly
  against a Stripe sandbox.

## Impact

- New `mods/stripe-fake` (TypeScript, Node 20; ajv, ws and yaml as conformance already uses) and its
  Dockerfile; the viewer as a small Vite app inside it.
- `ops/rebuild/compose.yaml`: a `stripe-fake` service on the `fakes` profile.
- `mods/conformance`: the `stripe:` scenario block and a `stripe` suite; a nightly workflow.
- A Stripe test-mode key as a CI secret for the nightly run (owner action, at build time).
- No change to any production service.

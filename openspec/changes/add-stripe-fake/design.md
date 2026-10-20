# Design

## Context

See proposal.md for why. The research brief "Metering & Billing" (2026-10-16, section "Stripe fake")
compared stripe-mock, the Stripe CLI with a sandbox, localstripe, PaperTiger and Vercel's
`@emulators/stripe`. None is stateful and covers meters, credit grants and test clocks under a
compatible license, so we build our own. The existing fakes live in `mods/conformance/src/fakes`
(TTS/STT/LLM on :7001–7003, the `fakes` compose profile in `ops/rebuild/compose.yaml`). The billing
model (credits, 1 credit = $0.01; plan credits as promotional grants expiring at period end; top-ups
as paid grants valid 12 months) is in the planning doc and drives the sample data.

## Goals / Non-Goals

**Goals:** Stripe-compatible enough that the official SDK and Fonoster's billing run unchanged
against it; fidelity proven nightly against real Stripe; failures injectable; state visible.

**Non-Goals:** emulating all of Stripe; a tax engine; Checkout, the customer portal and Connect; the
v2 meter event stream (added when billing needs its throughput); production use.

## Decisions

### D1. Own module, TypeScript, no framework

`mods/stripe-fake`: a Node 20 HTTP server (`node:http`), ajv for validation, ws for live viewer
updates, as conformance already uses. One process, in memory, with JSON snapshot and restore.

*Alternative:* build on `@emulators/core` (Vercel). A one-day spike is task 1.2. Adopt it only if its
routing, persistence and webhook delivery fit without forking.

### D2. A trimmed, pinned copy of Stripe's OpenAPI spec in the repo

`scripts/extract-openapi.ts` reads Stripe's `openapi.spec3.json` at a pinned commit and writes only
the paths and schemas the fake serves to `spec/stripe.subset.json`, which is committed. PR CI then
needs no network, and diffs show exactly what changed when the pin moves. The `Stripe-Version` the
fake answers is the pin's version; a request naming another version gets 400.

### D3. State machines per resource; events by diffing

Each resource is a small state machine (customer, payment method, setup intent, product, price,
meter, meter event, credit grant, subscription, invoice, payment intent, refund, test clock). After
every mutation the fake diffs the object and emits Stripe's event with `previous_attributes`, in the
order Stripe documents (`payment_intent.created` before `succeeded`, `invoice.finalized` before
`paid`).

### D4. Time is a clock; advancing runs the engine

Every customer belongs to a test clock (a default one when none is named). Advancing a clock steps
through due work in time order: renew subscriptions, close periods (read meter summaries), create
draft invoices, finalize after the grace period, apply credit grants (D-order of the spec), compute a
flat-rate tax line (stub: a rate per country in config, reverse charge with a VAT id), attempt
payment, schedule retries (default 3 over 7 days), expire grants. `/_fake/clock/advance` advances
every clock.

### D5. Webhooks

Endpoints come from `POST /v1/webhook_endpoints` and from a config list (for compose). Each event
goes to each endpoint with Stripe's envelope and signature (`t=<unix>,v1=<HMAC-SHA256>`), retried
with exponential backoff for up to 3 days of fake time. Meter error reports are thin v2 events, read
at `GET /v2/core/events/{id}`.

### D6. Control API under `/_fake/`

reset, snapshot and restore, clock advance, a customer's next payment outcome, fail next N webhook
deliveries, replay an event, inject a meter error report, latency, rate limit. Never under `/v1`, so
a misconfigured client pointed at real Stripe gets a 404 instead of silently mutating state.

### D7. The viewer

A small Vite + React app in `mods/stripe-fake/viewer`, built into the image and served at `/`,
reading `/_fake/state` and a WebSocket of changes. Screens and copy follow `designs/stripe-fake.pen`
(Customers, Meters, Credit grants, Invoices, Webhooks; the test clock and controls on every screen).
Money in credits and dollars, as billing shows it.

### D8. The nightly contract run

Conformance gains a `stripe:` block in scenarios and a `stripe` suite. In PR CI it runs against the
fake. A nightly workflow runs the same scenarios against a Stripe test-mode sandbox (key in a CI
secret), records event sequences, invoice totals and balance summaries for both, and opens an issue
on any difference.

## Risks / Trade-offs

- [Stripe changes behavior the fake encodes] → The nightly diff catches it; the pinned spec makes
  shape changes explicit.
- [Scope grows with billing] → New behavior lands with the billing change that needs it, under this
  capability.
- [A test-mode sandbox has limits (3 customers per clock)] → Nightly scenarios use one clock per
  scenario and clean up after themselves.

## Migration Plan

New module and a new compose service on the `fakes` profile only; nothing else changes.

## Open Questions

- The exact Stripe API version to pin. It's chosen when the billing service is specified, and the
  fake follows it.

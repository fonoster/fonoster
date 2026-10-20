# Tasks

## 1. Module and edges

- [x] 1.1 Scaffold `mods/stripe-fake` (package, tsconfig, HTTP server, in-memory store, id generator per prefix, `livemode: false`); verify a unit test that starts and stops the server
- [x] 1.2 Spike `@emulators/core` (one day); record adopt or not in build-log.md; verify the decision is written down
- [x] 1.3 `scripts/extract-openapi.ts` and the committed `spec/stripe.subset.json` at a pinned commit (D2); verify re-running the script yields no diff
- [x] 1.4 Request and response validation with ajv; Stripe error shape; 404 for unknown paths; `Stripe-Version` check; verify the "unknown parameter" and "unknown path" scenarios
- [x] 1.5 Idempotency keys (24 h replay, `idempotency_error` on different parameters); verify the "retried grant" scenario

## 2. Customers, payment methods and catalog

- [x] 2.1 Customers, setup intents, payment methods (attach, detach, list) with Stripe's test methods; verify the Stripe SDK scenario and the test-method outcomes
- [x] 2.2 Products and prices (licensed and metered, `transform_quantity`, immutability rules); verify tests that updating an immutable field is refused

## 3. Meters and credits

- [x] 3.1 Billing Meters, meter events (24 h identifier dedupe, 35-day window, async validation), adjustments, minute-aligned summaries; verify the "repeated identifier" and "unknown customer" scenarios
- [x] 3.2 Credit grants (create, list, expire, void), balance summary and balance transactions, application order; verify the "plan credits are spent before top-ups" scenario

## 4. Billing cycle

- [x] 4.1 Test clocks without limits; the engine (D4): renew, close period, draft, grace, finalize, credits, tax stub, pay, retry, expire; verify the "a month passes" scenario
- [x] 4.2 Payment intents, charges and refunds with off-session confirmation and Stripe's test methods; verify the "insufficient funds" scenario and a partial refund

## 5. Events and webhooks

- [x] 5.1 Event envelope by diffing, `GET /v1/events`, thin v2 meter error events; verify event order in the clock scenario
- [x] 5.2 Webhook endpoints, signatures, retries with backoff; verify signature checking with the Stripe SDK's `constructEvent` and the retry scenario

## 6. Control API

- [x] 6.1 `/_fake/*` (D6); verify the "fail the next payment" and "reset" scenarios, and that nothing under `/_fake` is reachable through `/v1`

## 7. Viewer

- [ ] 7.1 The Vite viewer per `designs/stripe-fake.pen` with live updates; verify Playwright tests for the two viewer scenarios

## 8. Stack and docs

- [x] 8.1 Dockerfile and a `stripe-fake` service on the `fakes` profile (`ops/rebuild/compose.yaml`); verify `docker compose --profile fakes up stripe-fake` serves `/v1/customers` and `/`
- [x] 8.2 Docs: a Hacking page for the Stripe fake (run it, the viewer, the control API); verify the docs build has no broken links

## Workflow follow-up

- Archive after merge; next change: `add-billing-service`.

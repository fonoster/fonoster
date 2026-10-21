---
prefix: BIL
title: Billing and metering
level: L2 Integration (service)
tier: pr
uut: Usage metering in AppBridge (each call's usage lines, sealed in its record) and in the apiserver (ingest, daily totals, GetUsage, the billing outbox); the billing service (mods/billing: rater, ledger, admission, the Stripe outbox and webhooks, the Billing API and the apiserver's proxy); the Stripe fake (mods/stripe-fake) and its viewer
tester: Mocha, every @fonoster package from source. Calls through the real AppBridge and Autopilot on the conformance fakes (fake Roomr node, STT, TTS and LLM); the billing service against the Stripe fake through the official Stripe SDK; the conformance runner playing the platform for the billing scenario files; Playwright for the viewer
environment: Postgres 16 and NATS with JetStream (CONFORMANCE_NATS_URL, PERSISTENCE_TEST_DATABASE_URL); the Stripe fake in the test process; Chromium for the viewer. No network, no Stripe account
cadence: every pull request (the billing job of pr-checks); proofs nightly and at release
prove: sh mods/conformance/test/billing/prove.sh {id} {junitDir}
reset: sh mods/conformance/test/billing/rebuild.sh
capabilities:
  - usage-metering
  - stripe-fake
  - billing
contracts:
  - billing
tests:
  - mods/stripe-fake/test/stripeFake.test.ts
  - mods/stripe-fake/viewer/e2e/viewer.spec.ts
  - mods/billing/test/rater.test.ts
  - mods/billing/test/ledger.test.ts
  - mods/billing/test/admission.test.ts
  - mods/billing/test/applyUsage.test.ts
  - mods/billing/test/operator.test.ts
  - mods/billing/test/stripe.test.ts
  - mods/billing/test/api.test.ts
  - mods/apiserver/test/usage/*.test.ts
  - mods/apiserver/test/billing/proxy.test.ts
  - mods/appbridge/test/usage.test.ts
  - mods/conformance/test/billingScenarios.test.ts
---

# Billing and metering

What a customer is charged, and whether a call may start. Every call, eval and stored file is
metered as facts: quantities with their attribution and whose vendor key was used, never money.
AppBridge counts a call's usage and seals it in the call record; the apiserver stores each line
once, keeps daily totals that can be rebuilt from the lines, answers `GetUsage`, and publishes
stored usage for billing. The billing service (Cloud only, off by default) rates each line once by
fixed rules against a versioned rate card, debits a ledger of credits, admits calls from that
ledger, and keeps Stripe in step through an outbox and verified webhooks. Stripe is always the
Stripe fake: a stateful fake of Stripe Billing that the official SDK talks to, with a viewer that
shows what Stripe would see.

The `billing` capability is proposed by the open change `add-billing-service` (19 of 21 tasks
done); its built scenarios are cited here. Not here: the dashboard's Billing and Usage pages
(DSH-035 to DSH-040), admission as AppBridge and CreateCall apply it (`voice-session` "Calls are
admitted before they start"), regions, private-region licenses, workspace webhooks and the call
record itself. The hand-off list says where those tests go.

## Running

```sh
docker run -d --name bil-pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16.10-alpine3.22
docker run -d --name bil-nats -p 4222:4222 nats:2.11.8 -js
export PERSISTENCE_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
export CONFORMANCE_NATS_URL=nats://127.0.0.1:4222
npm run build
npx mocha --config mods/conformance/test/billing/.mocharc.cjs            # every mocha case
(cd mods/stripe-fake && npx playwright test --config viewer/playwright.config.ts)   # the viewer
node mods/conformance/catalog/prove.cjs --area BIL                       # the proofs, one run per case
```

`prove.sh` runs the whole files that carry a case's id, not the case alone: the Stripe suites build
on the accounts and the test clock earlier tests left. The admission timing case (BIL-036) runs only
with `CONFORMANCE_TIMING_RUNS` set, as the other timing tests do.

## Systems

```mermaid
flowchart LR
  subgraph TESTER["Tester (mocha, Playwright)"]
    FAKES["Fake Roomr node, STT, TTS, LLM"]
    RUNNER["Conformance runner (plays the platform)"]
    SDK["Stripe SDK client"]
    BROWSER["Chromium"]
  end
  subgraph UUT["Unit under test"]
    AB["AppBridge (call usage)"]
    AP["Autopilot (token usage)"]
    API["Apiserver usage (ingest, totals, GetUsage, outbox)"]
    BILL["Billing service (rater, ledger, admission, outbox, webhooks, API)"]
    SF["Stripe fake and viewer"]
  end
  PG[("Postgres")]
  NATS["NATS JetStream"]
  FAKES <--> AB
  AP -- "usage.report" --> AB
  AB -- "sealed record" --> API
  API --> PG
  API -- "FONOSTER_USAGE_RECORDED" --> NATS --> BILL
  BILL --> PG
  BILL -- "outbox (idempotent)" --> SF
  SF -- "signed webhooks" --> BILL
  RUNNER --> BILL
  SDK --> SF
  BROWSER --> SF
```

## Hand-off to other areas

These tests touch metering or billing but prove behavior other areas own:

| Tests | Area |
| --- | --- |
| `mods/appbridge/test/admission.test.ts` | AppBridge (`voice-session` "Calls are admitted before they start", still uncovered there): 402 and 503 before ringing, a slow answer admits. The billing side of admission is BIL-034 to BIL-037 |
| `mods/apiserver/test/outbound/*` (CreateCall refused before any SIP) | Call flows |
| `mods/apiserver/test/regions/*`, `mods/conformance/test/regions*.test.ts`, `mods/region-agent/test/cell.test.ts` | Regions and private regions |
| `mods/apiserver/test/capabilities/getCapabilities.test.ts` (billing in the capabilities) | Control-plane API |
| `mods/dashboard` Billing and Usage pages | Dashboard (DSH-035 to DSH-040) |
| `mods/autopilot/test/session/usage.test.ts` (metered Think on a fake model) | Autopilot (APT) |

Unit tests that stay unit tests: `mods/common/test/usage/usage.test.ts` (meters, usage ids),
`mods/callrecord/test/vconUsage.test.ts`, `mods/community/test/openaiUsage.test.ts` (the vendor's
usage chunk), `mods/sdk/test/billing.test.ts`, `mods/sdk/test/usage.test.ts` and `mods/authz/test/authz.test.ts`.
`mods/billing/test/rater.test.ts` is a unit test of a pure function, but it is the proof of the
rating rules that decide every charge, so its tests carry case ids.

Built but not yet provable, so in `uncovered-scenarios.txt`: "Ringing is not metered" (needs an
outbound call that rings before the answer in the AppBridge suite), "Billing disabled", "Billing
off" and "Community install" (the switch is read at the apiserver's and the billing service's
start, with no seam a test can drive yet). Not built: the operator's refund of an unused top-up
(the outbox can send a refund, nothing asks for one).

## Cases

### BIL-001 An AI call is metered end to end

- **Spec:** usage-metering / Metered quantities / An AI call is metered end to end
- **Priority:** P0
- **Proof:** Drop `llm.tokens.out` lines from an Autopilot agent's `usage.report` in AppBridge (`Call.ts`); the end-to-end call has no output-token line and the test goes red.
- **Fault:** faults/BIL-001.patch
- **Test:** mods/apiserver/test/usage/fullstack.test.ts, mods/appbridge/test/usage.test.ts

An Autopilot call runs through the real AppBridge on the fakes, is sealed with the real record
writer, indexed twice and read back with GetUsage. The line counts must equal the fake LLM's fixed
counts and the TTS characters spoken; AppBridge's own test checks the units and attribution of the
platform lines (call, STT, TTS, recording) in the signed record.

**Pass.** Lines for `call.seconds`, `stt.seconds`, `tts.characters`, `llm.tokens.in` and `llm.tokens.out` exist with the vendor's exact counts, and GetUsage returns the same totals after a replay. **Fail.** A meter is missing, a count differs from the vendor's, or the totals differ from the lines.

### BIL-002 An undeclared meter is rejected

- **Spec:** usage-metering / Metered quantities / An undeclared meter is rejected
- **Priority:** P1
- **Proof:** Let ingest store an event that fails validation, with a default unit for a meter it does not know; `video.seconds` is stored and the test goes red.
- **Fault:** faults/BIL-002.patch
- **Test:** mods/apiserver/test/usage/ingest.test.ts, mods/apiserver/test/usage/consumer.test.ts

A batch with a `video.seconds` line and a valid line is ingested; the consumer is sent a message that
is not JSON and one for an undeclared meter.

**Pass.** Only the valid line is stored, and the consumer acknowledges the bad messages instead of retrying them forever. **Fail.** The undeclared meter is stored, or a bad message blocks the stream.

### BIL-003 Usage totals by meter and key source, with no money

- **Spec:** usage-metering / Usage API / Grouped by key source
- **Spec:** usage-metering / Usage records facts, not prices / No money on a usage line
- **Priority:** P1
- **Proof:** Map the `key_source` dimension of GetUsage to the provider column; the rows lose their key source and the test goes red.
- **Fault:** faults/BIL-003.patch
- **Test:** mods/apiserver/test/usage/getUsage.test.ts

GetUsage on seeded daily totals, grouped by key source, and with a reversed or malformed range.

**Pass.** One row per meter and key source for the caller's workspace, each with its unit, no field naming a price, cost, amount or billable flag, and `INVALID_ARGUMENT` for a bad range. **Fail.** Rows are merged across key sources, carry money, or a bad range is answered.

### BIL-004 A call's lines are attributed

- **Spec:** usage-metering / Usage attribution / A call's lines are attributed
- **Priority:** P0
- **Proof:** Leave the app reference off the usage events built from a sealed record's index entry; the stored lines have no app and the test goes red.
- **Fault:** faults/BIL-004.patch
- **Test:** mods/apiserver/test/usage/ingest.test.ts

A sealed call's index entry is stored twice; its usage lines are read back from `usage_events`.

**Pass.** Each line names the call, the app, the origin `call`, the workspace's owner, the region and its kind, and is stored once. **Fail.** An attribution field is missing or wrong.

### BIL-005 Key source is recorded per provider

- **Spec:** usage-metering / Key source per provider / One call, two key sources
- **Spec:** usage-metering / Key source per provider / Platform resources have no key source
- **Priority:** P0
- **Proof:** Make AppBridge report every vendor as used with the platform key; the call made with the workspace's own TTS key says `platform` and the test goes red.
- **Fault:** faults/BIL-005.patch
- **Test:** mods/appbridge/test/usage.test.ts, mods/apiserver/test/usage/ingest.test.ts, mods/apiserver/test/usage/evalUsage.test.ts

A call whose workspace has its own key for the TTS vendor; a call with two noise-cancelling filters
from two vendors; daily totals of two calls with different key sources; an eval whose workspace key
cannot be read.

**Pass.** Vendor lines say `workspace` exactly when the workspace's key was used, per provider; `call.seconds` and `recording.seconds` carry no key source; totals keep key sources apart; an unreadable workspace key fails with `key_unavailable` instead of falling back to the platform's. **Fail.** A line names the wrong key source, a platform line carries one, or the eval silently uses the platform key.

### BIL-006 A call that never reached an app has no call seconds

- **Spec:** usage-metering / Call seconds count from answer / Unanswered call
- **Priority:** P0
- **Proof:** Start the call's answer clock when AppBridge creates the call instead of when the app answers; a call that never reached an app is sealed with `call.seconds` and the test goes red.
- **Fault:** faults/BIL-006.patch
- **Test:** mods/appbridge/test/usage.test.ts, mods/apiserver/test/usage/ingest.test.ts

A call is offered with no app configured and ends; an index entry with no usage is stored.

**Pass.** The sealed record and its index entry have no usage, and nothing is stored for it. **Fail.** Any usage line exists for the call.

### BIL-007 Test calls and evals are metered by origin

- **Spec:** usage-metering / Origin of test calls and evals / Browser test call
- **Spec:** usage-metering / Origin of test calls and evals / Eval run
- **Priority:** P1
- **Proof:** Never mark a call from the browser test path as `browser_test` in AppBridge; its usage says origin `call` and the test goes red.
- **Fault:** faults/BIL-007.patch
- **Test:** mods/appbridge/test/usage.test.ts, mods/apiserver/test/usage/getUsage.test.ts, mods/apiserver/test/usage/evalUsage.test.ts

A browser test call (signed connect token) talks to an app; GetUsage is grouped by origin; an eval
reports its model usage.

**Pass.** The browser test's record and lines carry origin `browser_test` with its call seconds, GetUsage splits it from calls, and eval lines carry origin `eval`, only token meters and no call reference. **Fail.** A test call is metered as a call, or an eval line has a call reference or another meter.

### BIL-008 A private region's usage is marked private

- **Spec:** usage-metering / Private-region usage / Private-region call
- **Priority:** P0
- **Proof:** Mark every region `public` when building usage events from an index entry; the private region's daily total says `public` and the test goes red.
- **Fault:** faults/BIL-008.patch
- **Test:** mods/apiserver/test/usage/ingest.test.ts

A browser test call's index entry from a private region (`rg_...`) is stored.

**Pass.** Its daily total has region kind `private` and origin `browser_test`, with quantities and attribution only. **Fail.** The region kind is `public`, which would bill a private region.

### BIL-009 Token counts come only from the vendor

- **Spec:** usage-metering / Token counts come only from the vendor / Vendor reports usage
- **Spec:** usage-metering / Token counts come only from the vendor / Interrupted turn
- **Priority:** P0
- **Proof:** Stop reading an interrupted reply at once in Autopilot's metered Think instead of draining it for the vendor's usage; the cut reply has no token lines and the test goes red.
- **Fault:** faults/BIL-009.patch
- **Test:** mods/apiserver/test/usage/fullstack.test.ts, mods/appbridge/test/usage.test.ts

The caller cuts into a long reply; an Autopilot agent sends two usage reports; an app that is not an
Autopilot agent sends one, and an agent reports a meter it may not.

**Pass.** The interrupted turn is metered with the whole request's counts and no `usage_missing`; reports add up exactly; reports from other apps or for other meters are refused with `bad_message` and change nothing. **Fail.** Tokens are lost on an interruption, counts differ from the vendor's, or an app can add token lines.

### BIL-010 Missing usage is an error

- **Spec:** usage-metering / Missing usage is an error / Vendor omits usage
- **Priority:** P0
- **Proof:** Drop the `usage_missing` note when a completed request has no usage report (`createAutopilot.ts`); the record has no error and the test goes red.
- **Fault:** faults/BIL-010.patch
- **Test:** mods/apiserver/test/usage/fullstack.test.ts

The fake LLM answers without a usage report; the call goes on and ends.

**Pass.** The caller hears the reply, the call record holds `usage_missing` naming `fake/llm`, no token line exists and the other lines are metered as usual. **Fail.** The error is missing, a token line is made up, or the call stops.

### BIL-011 Usage is recorded exactly once

- **Spec:** usage-metering / Usage is recorded exactly once / Replayed record
- **Priority:** P0
- **Proof:** Add to the day's total even when the event's id was already stored; the replay doubles the totals and the test goes red.
- **Fault:** faults/BIL-011.patch
- **Test:** mods/apiserver/test/usage/ingest.test.ts

The same events are ingested twice.

**Pass.** The second ingest stores nothing new and the day's totals equal the first ingest's. **Fail.** A line or a total counts twice.

### BIL-012 Metering never blocks a call and loses no line

- **Spec:** usage-metering / Metering never blocks a call / Store down during calls
- **Priority:** P0
- **Proof:** Swallow a failed store in the usage consumer, so the message is acknowledged; the usage published while the store is down is lost and the test goes red.
- **Fault:** faults/BIL-012.patch
- **Test:** mods/apiserver/test/usage/consumer.test.ts, mods/apiserver/test/usage/ingest.test.ts

Ten usage events are published on the stream while the store fails, then the store comes back;
sealed records whose index messages never arrived are read again.

**Pass.** Nothing is stored while the store is down, all ten are stored once after, and usage missing from the ledger is recovered from the sealed records. **Fail.** A line is lost or stored twice.

### BIL-013 Daily totals are rebuildable

- **Spec:** usage-metering / Daily totals are rebuildable / Rebuild matches
- **Priority:** P1
- **Proof:** Take the earliest reading of a snapshot meter when rebuilding; the rebuilt storage total differs and the test goes red.
- **Fault:** faults/BIL-013.patch
- **Test:** mods/apiserver/test/usage/ingest.test.ts

Totals are built while ingesting, corrupted, and rebuilt from the lines; storage is snapshotted per
workspace and day.

**Pass.** Every rebuilt total equals the one before, snapshot meters keep the day's latest reading, and a day's storage is recorded once per workspace. **Fail.** A rebuilt total differs.

### BIL-014 Usage of another workspace

- **Spec:** usage-metering / Usage API / Another workspace
- **Spec:** usage-metering / Usage API / Owner across workspaces
- **Priority:** P1
- **Proof:** Count every workspace in the token as owned for `all_owned`; a member's workspace is included, a non-owner is not refused, and the test goes red.
- **Fault:** faults/BIL-014.patch
- **Test:** mods/apiserver/test/usage/getUsage.test.ts

GetUsage as a member of one workspace, and as the owner of two workspaces who is a member of a third.

**Pass.** A caller reads only their workspace; an owner gets totals for exactly the workspaces they own; `all_owned` without ownership fails with `PERMISSION_DENIED`. **Fail.** Any other workspace's usage is returned.

### BIL-015 Stored usage is published for billing once

- **Spec:** usage-metering / Stored usage is published for billing / Apiserver restarts mid-publish
- **Priority:** P0
- **Proof:** Publish without the usage id as the message id; the batch published again after a crash is kept twice and the test goes red.
- **Fault:** faults/BIL-015.patch
- **Test:** mods/apiserver/test/usage/recordedUsage.test.ts

Stored usage is published in batches, then marked unpublished (a crash after publishing) and
published again.

**Pass.** Events reach `FONOSTER_USAGE_RECORDED` oldest first with their owner, and the stream keeps one copy of each. **Fail.** An event is missing, out of order or kept twice.

### BIL-016 The Stripe SDK talks to the fake

- **Spec:** stripe-fake / A drop-in Stripe endpoint / The Stripe SDK talks to the fake
- **Priority:** P1
- **Proof:** Return `livemode: true` on the fake's objects; the created customer is live and the test goes red.
- **Fault:** faults/BIL-016.patch
- **Test:** mods/stripe-fake/test/stripeFake.test.ts

The official SDK, pointed at the fake, creates and reads a customer, prices (immutable amounts,
lookup keys), a Customer Portal session and a partial refund, every response checked against
Stripe's schema.

**Pass.** Ids carry Stripe's prefixes, `livemode` is false, and each call behaves as Stripe documents it. **Fail.** The SDK fails, a response breaks Stripe's schema, or an object is live.

### BIL-017 Unknown parameters and paths are refused in Stripe's shape

- **Spec:** stripe-fake / Requests and responses follow Stripe's OpenAPI spec / Unknown parameter
- **Spec:** stripe-fake / Requests and responses follow Stripe's OpenAPI spec / Unknown path
- **Priority:** P1
- **Proof:** Accept unknown parameters; `colour=red` creates a customer and the test goes red.
- **Fault:** faults/BIL-017.patch
- **Test:** mods/stripe-fake/test/stripeFake.test.ts

A customer is created with `colour=red`; `GET /v1/not_a_resource` is called.

**Pass.** 400 `invalid_request_error` naming `colour`, and 404 in Stripe's error shape. **Fail.** Either request succeeds or answers another shape.

### BIL-018 A retried grant is not granted twice

- **Spec:** stripe-fake / Idempotent requests / A retried grant is not granted twice
- **Priority:** P0
- **Proof:** Ignore the `Idempotency-Key` header; the retried grant is created again and the test goes red.
- **Fault:** faults/BIL-018.patch
- **Test:** mods/stripe-fake/test/stripeFake.test.ts

A credit grant is created twice with one key and the same parameters, then once more with
different parameters.

**Pass.** Both answers carry the same grant, one grant exists, and the different parameters get an idempotency error. **Fail.** A second grant exists or the mismatch is accepted.

### BIL-019 A repeated meter event identifier counts once

- **Spec:** stripe-fake / Billing Meters and meter events / A repeated identifier counts once
- **Priority:** P0
- **Proof:** Count every meter event, repeated identifier or not; the minute's summary is 120 and the test goes red.
- **Fault:** faults/BIL-019.patch
- **Test:** mods/stripe-fake/test/stripeFake.test.ts

Two events with identifier `usg_abc` and value 60; a test-clock customer's events stamped by its clock.

**Pass.** The summary for the customer and minute is 60, and an event more than five minutes past the clock is refused. **Fail.** The repeat counts, or clock time is ignored.

### BIL-020 An event for an unknown customer is reported, not refused

- **Spec:** stripe-fake / Billing Meters and meter events / Unknown customer
- **Priority:** P1
- **Proof:** Report an unknown customer under the wrong error code; the full event names another code and the test goes red.
- **Fault:** faults/BIL-020.patch
- **Test:** mods/stripe-fake/test/stripeFake.test.ts

A meter event names `cus_nobody`.

**Pass.** The request answers 200, a thin `v1.billing.meter.error_report_triggered` event follows, and `GET /v2/core/events/{id}` gives `meter_event_customer_not_found`. **Fail.** The request is refused, no thin event follows, or the full event says something else.

### BIL-021 Credit grants apply to metered usage at finalization

- **Spec:** stripe-fake / Credit grants apply to metered usage at finalization / Plan credits are spent before top-ups and never pay the plan fee
- **Priority:** P0
- **Proof:** Apply grants latest expiry first; the paid grant is spent before the promotional one and the test goes red.
- **Fault:** faults/BIL-021.patch
- **Test:** mods/stripe-fake/test/stripeFake.test.ts

A customer with a $25 promotional grant expiring after the period and a $10 paid grant is invoiced
$25 for the plan and $30 of metered usage.

**Pass.** $25 of the promotional grant and $5 of the paid grant pay the usage lines only, $25 is due for the plan, and $5 of the paid grant is left. **Fail.** Any other order, a credit on the plan line, or a wrong balance.

### BIL-022 A month passes under a test clock

- **Spec:** stripe-fake / Subscriptions and invoices cycle under a test clock / A month passes
- **Priority:** P1
- **Proof:** Stop emitting `invoice.finalized`; the month's events lose one and the test goes red.
- **Fault:** faults/BIL-022.patch
- **Test:** mods/stripe-fake/test/stripeFake.test.ts

A $25 subscription with 9,480 metered units advances one month and two hours.

**Pass.** `invoice.created`, `invoice.finalized`, `payment_intent.succeeded` and `invoice.paid` in that order, and the invoice holds the plan line and the metered line. **Fail.** An event is missing or out of order, or a line is wrong.

### BIL-023 Insufficient funds decline like Stripe's test card

- **Spec:** stripe-fake / Payments follow Stripe's test payment methods / Insufficient funds
- **Priority:** P1
- **Proof:** Answer `pm_card_chargeDeclinedInsufficientFunds` with the generic decline code; the test goes red.
- **Fault:** faults/BIL-023.patch
- **Test:** mods/stripe-fake/test/stripeFake.test.ts

An off-session payment intent is confirmed with the insufficient-funds test card.

**Pass.** 402 with `decline_code` `insufficient_funds`, and one `payment_intent.payment_failed` event. **Fail.** The payment succeeds or fails another way.

### BIL-024 Webhooks are signed and retried like Stripe's

- **Spec:** stripe-fake / Webhooks are signed and delivered like Stripe's / Stripe's library verifies the fake's signature
- **Spec:** stripe-fake / Webhooks are signed and delivered like Stripe's / A failed delivery is retried
- **Priority:** P0
- **Proof:** Sign the body without its timestamp; the Stripe SDK's `constructEvent` rejects the event and the test goes red.
- **Fault:** faults/BIL-024.patch
- **Test:** mods/stripe-fake/test/stripeFake.test.ts

An endpoint that answers 500 once receives `customer.created`; the fake's clock passes the retry
delay; a test-clock customer's events go out at once.

**Pass.** The event verifies with the endpoint's secret, its type and object match, and the same event id is delivered again after the failure. **Fail.** The signature does not verify, the event differs, or no retry comes.

### BIL-025 The control API drives the fake

- **Spec:** stripe-fake / A control API for tests / Fail the next payment
- **Spec:** stripe-fake / A control API for tests / Reset
- **Priority:** P1
- **Proof:** Keep the id counters across a reset; the first customer after it gets a new id and the test goes red.
- **Fault:** faults/BIL-025.patch
- **Test:** mods/stripe-fake/test/stripeFake.test.ts

A customer's next payment is set to decline before a subscription's first invoice; the control API
is called under `/v1`; the fake is reset.

**Pass.** The payment fails with `invoice.payment_failed`, the retry follows the card and the subscription becomes active; `/v1/_fake` is 404; after a reset nothing is left and ids start over. **Fail.** The outcome is ignored, the control API leaks into `/v1`, or state survives the reset.

### BIL-026 The viewer shows credits as billing shows them

- **Spec:** stripe-fake / The viewer shows what Stripe would see / Credits as billing shows them
- **Priority:** P2
- **Proof:** Format cents as dollars where the viewer shows credits; the Customers screen shows 18.4 credits and the test goes red.
- **Fault:** faults/BIL-026.patch
- **Test:** mods/stripe-fake/viewer/e2e/viewer.spec.ts

A customer with a $12.40 promotional grant and a $6.00 paid grant is opened in the viewer, in light
and dark.

**Pass.** 1,840 credits ($18.40), split into 1,240 plan and 600 top-up credits, and the chosen theme survives a reload. **Fail.** Another number, split or theme.

### BIL-027 The viewer shows a failed payment as it happens

- **Spec:** stripe-fake / The viewer shows what Stripe would see / Watching a payment fail
- **Priority:** P2
- **Proof:** Ignore the viewer's live-update messages; the failed payment appears only after a reload and the test goes red.
- **Fault:** faults/BIL-027.patch
- **Test:** mods/stripe-fake/viewer/e2e/viewer.spec.ts

The viewer is open on Webhooks while a test makes a subscription's first payment fail.

**Pass.** The `invoice.payment_failed` delivery appears without a reload, with its status and a Replay action. **Fail.** It does not appear live, or lacks status or Replay.

### BIL-028 Free usage is never billed

- **Spec:** billing / Rated lines follow fixed rules / Unpriced usage
- **Spec:** billing / Rated lines follow fixed rules / Private region on our key
- **Spec:** billing / Rated lines follow fixed rules / Customer's STT key
- **Priority:** P0
- **Proof:** Drop the private-region rule from the rater; a private region's TTS on our key is billed and the test goes red.
- **Fault:** faults/BIL-028.patch
- **Test:** mods/billing/test/rater.test.ts, mods/billing/test/applyUsage.test.ts

The rater's rules that bill nothing, in order: usage before billing started, a private region, the
customer's own key, included meters (AMD, recording, storage), a meter the card has no price for;
and an owner with no billing account.

**Pass.** Each line is not billable with its reason (`private_region`, `byok`, `included`, `unpriced`, `before_billing`), no debit is made, and unpriced usage is logged as an alert. **Fail.** Any of them is billed or takes another reason.

### BIL-029 Billable usage is priced from the card

- **Spec:** billing / Rated lines follow fixed rules / A short call
- **Priority:** P0
- **Proof:** Lower the minimum billed call to 30 seconds; a 20-second call is billed as 30 and the test goes red.
- **Fault:** faults/BIL-029.patch
- **Test:** mods/billing/test/rater.test.ts

Vendor meters on our key, a short call, noise cancelling, eval tokens and prices by provider and
model with `*` as the fallback.

**Pass.** Amounts are the card's price times the quantity in milli-credits, a call is billed at least 60 seconds, and each line has its invoice category. **Fail.** Any amount, minimum or category differs.

### BIL-030 Usage is rated with the card in force when it happened

- **Spec:** billing / Rate cards are versioned / A new card
- **Priority:** P0
- **Proof:** Rate with the newest card whatever the usage's time; the call of the 14th is rated with card 2 and the test goes red.
- **Fault:** faults/BIL-030.patch
- **Test:** mods/billing/test/rater.test.ts

Card 2 starts on the 15th; a call of the 14th arrives on the 16th.

**Pass.** It is rated with card 1. **Fail.** It is rated with card 2.

### BIL-031 The same usage is rated and debited once

- **Spec:** billing / Rated lines follow fixed rules / The same usage twice
- **Priority:** P0
- **Proof:** Debit even when the rated line already exists; the second arrival is debited again and the test goes red.
- **Fault:** faults/BIL-031.patch
- **Test:** mods/billing/test/applyUsage.test.ts

The same usage event is applied twice, and published twice on the stream the billing consumer reads.

**Pass.** One rated line, one debit, and the balance falls by the price once. **Fail.** A second line or debit.

### BIL-032 Plan credits are spent first and expire after the grace

- **Spec:** billing / The balance is a ledger / Plan credits first
- **Spec:** billing / The balance is a ledger / Plan credits expire
- **Priority:** P0
- **Proof:** Spend top-up credits before plan credits; 3,000 credits leave plan credits behind and the test goes red.
- **Fault:** faults/BIL-032.patch
- **Test:** mods/billing/test/ledger.test.ts

An account with 2,500 plan and 1,000 top-up credits uses 3,000; unused plan credits pass the period's
end and the grace; the sweep runs twice.

**Pass.** Plan credits reach zero with 500 top-up credits left; an expiry entry removes the unused plan credits only after the grace and leaves top-ups; each grant expires once. **Fail.** Another order, an early or missing expiry, or a top-up expires.

### BIL-033 Plan credits pay their own period

- **Spec:** billing / Plans / Usage in the last hour of the period
- **Spec:** billing / Plans / Subscribing during the Trial
- **Priority:** P0
- **Proof:** Let a grant pay usage after the period it covers; the next period's usage during the grace takes plan credits and the test goes red.
- **Fault:** faults/BIL-033.patch
- **Test:** mods/billing/test/ledger.test.ts

Usage from the period's last hour is rated during the grace window, then usage of the next period;
Trial credits left at subscription are carried to the first period's end and grace.

**Pass.** The last hour's usage is paid from that period's plan credits, the next period's from top-ups; the carried Trial credits keep the balance and expire with the first plan credits. **Fail.** Credits pay another period or the carry changes the balance.

### BIL-034 Calls are refused once balance and overdraft are gone

- **Spec:** billing / Admission from the ledger / Balance gone
- **Spec:** billing / Admission from the ledger / A long call crosses zero
- **Priority:** P0
- **Proof:** Give a trial the paid plan's overdraft; a trial at zero is admitted and the test goes red.
- **Fault:** faults/BIL-034.patch
- **Test:** mods/billing/test/admission.test.ts, mods/billing/test/ledger.test.ts

A Pay-as-you-go account spends past its balance into the overdraft and past it; a trial spends all
its credits; the next grant pays the overdraft back first.

**Pass.** Debits never stop at zero (a call in progress is never cut), the overdraft is the larger of 200 credits and 10% of the last top-up and zero on a trial, calls are admitted inside it and refused with `insufficient_balance` past it. **Fail.** A call is admitted past the overdraft, refused inside it, or the overdraft is sized otherwise.

### BIL-035 New owners, owners without billing and the concurrency limit

- **Spec:** billing / Admission from the ledger / Balance gone
- **Priority:** P0
- **Proof:** Refuse only past the plan's concurrency limit instead of at it; the call at the limit is admitted and the test goes red.
- **Fault:** faults/BIL-035.patch
- **Test:** mods/billing/test/admission.test.ts

Admission for an owner seen for the first time, for an app with no owner, and for an owner at the
plan's limit of active calls, counted from the session registry until calls end or their lease lapses.

**Pass.** A new owner starts on the Trial with 1,000 credits granted once; ownerless apps are admitted; at the limit the call is refused with `concurrency_limit` and one fewer is admitted. **Fail.** A second grant, a refusal of an ownerless app, or a wrong count at the limit.

### BIL-036 Admission answers fast

- **Spec:** billing / Admission from the ledger / Fast answer
- **Priority:** P1
- **Tier:** nightly
- **Proof:** Wait 10 ms in every admission check; the p99 is above 5 ms and the test goes red.
- **Fault:** faults/BIL-036.patch
- **Test:** mods/billing/test/admission.test.ts

After warming up, 300 admission checks are timed on Postgres. Shared runners are too noisy for a
wall-clock bound, so the test runs only with `CONFORMANCE_TIMING_RUNS` set, like the other timing
tests.

**Pass.** The p99 answer is under 5 ms. **Fail.** It is 5 ms or more.

### BIL-037 The Trial ends

- **Spec:** billing / The Trial ends / The Trial ends
- **Priority:** P0
- **Proof:** Ignore an ended Trial in admission; the owner past 30 days is admitted on their top-up and the test goes red.
- **Fault:** faults/BIL-037.patch
- **Test:** mods/billing/test/admission.test.ts, mods/billing/test/operator.test.ts

A Trial started 31 days ago with a top-up bought during it; the configured default length; a Trial
cut to three days.

**Pass.** The Trial lasts the configured days, its credits expire, the account is `ended`, and calls are refused with `trial_ended` whatever the balance. **Fail.** The Trial goes on, or its end admits calls.

### BIL-038 An operator changes one owner's Trial

- **Spec:** billing / The Trial ends / An operator changes one owner's Trial
- **Priority:** P1
- **Proof:** Reopen an ended Trial without giving back the credits it had left; the reopened Trial has none and the test goes red.
- **Fault:** faults/BIL-038.patch
- **Test:** mods/billing/test/operator.test.ts

A Trial is extended before it ends, reopened after it ended (twice), and changed for an owner on
Pay-as-you-go.

**Pass.** It ends at the new length with its credits; an ended Trial opens again with the credits it had left, given back once; a Pay-as-you-go owner's Trial cannot be changed. **Fail.** Credits are lost or given twice, or the change applies to Pay-as-you-go.

### BIL-039 An operator adds credits under the owner's plan

- **Spec:** billing / An operator adds credits / Credits for a Trial
- **Spec:** billing / An operator adds credits / Credits for Pay-as-you-go
- **Priority:** P0
- **Proof:** Make added Pay-as-you-go credits last six months instead of twelve; the grant expires early and the test goes red.
- **Fault:** faults/BIL-039.patch
- **Test:** mods/billing/test/operator.test.ts

500 credits are added to a Trial, to an ended Trial, and to a Pay-as-you-go owner.

**Pass.** Trial credits grow the balance and end with the Trial; an ended Trial refuses them; Pay-as-you-go gets a 500-credit top-up grant expiring in 12 months, sent to Stripe as a paid grant. **Fail.** Any other bucket, expiry or Stripe grant.

### BIL-040 A paid month renews the plan credits

- **Spec:** billing / Plans / A paid month
- **Priority:** P0
- **Proof:** Send the plan's credits to Stripe as a paid grant; Stripe's grants no longer match the plan's and the test goes red.
- **Fault:** faults/BIL-040.patch
- **Test:** mods/billing/test/stripe.test.ts

A Trial owner subscribes; a month of usage passes under the test clock.

**Pass.** The first paid invoice starts Pay-as-you-go with 2,500 plan credits in the ledger and a promotional grant in Stripe; the cycle invoice is paid, holds the usage less the credits that paid for it, and the next plan credits are granted. **Fail.** The plan does not start, credits differ between the ledger and Stripe, or the invoice is wrong.

### BIL-041 The ledger and Stripe are reconciled

- **Spec:** billing / Ledger and Stripe reconcile / Drift
- **Priority:** P1
- **Proof:** Tolerate a difference of up to a dollar; the 48-cent drift goes unreported and the test goes red.
- **Fault:** faults/BIL-041.patch
- **Test:** mods/billing/test/stripe.test.ts

Reconciliation runs over finalized invoices, then the ledger gains a rated line Stripe never heard
of.

**Pass.** No drift at first; then one drift naming the account, Stripe's 13 cents and the ledger's 61; nothing is changed. **Fail.** The drift is missed, misreported, or something is changed.

### BIL-042 Top-ups are credited once paid, before tax

- **Spec:** billing / Stripe computes tax / A taxed top-up
- **Priority:** P0
- **Proof:** Credit a paid top-up with the invoice's total instead of the credits bought; the taxed top-up adds 1,100 credits and the test goes red.
- **Fault:** faults/BIL-042.patch
- **Test:** mods/billing/test/stripe.test.ts, mods/stripe-fake/test/stripeFake.test.ts

A top-up of 1,000 credits, with and without a 10% tax rate; the fake's automatic tax on a one-off
invoice and on a subscription.

**Pass.** The credits reach the ledger and Stripe (a paid grant) only once Stripe confirms the payment; the subscription and top-ups ask for automatic tax; a taxed $10 top-up totals $11 and adds 1,000 credits. **Fail.** Credits before payment, tax turned into credits, or no tax asked.

### BIL-043 Auto-recharge charges once per crossing and stops after three declines

- **Spec:** billing / Top-ups and auto-recharge / Auto-recharge
- **Spec:** billing / Top-ups and auto-recharge / Card keeps failing
- **Priority:** P0
- **Proof:** Allow four declined recharges instead of three; auto-recharge stays on after the third and the test goes red.
- **Fault:** faults/BIL-043.patch
- **Test:** mods/billing/test/stripe.test.ts

The balance crosses the threshold twice before Stripe answers; then three recharges in a row are
declined.

**Pass.** One $25 payment adds 2,500 top-up credits; after three declines auto-recharge is off and the owner is told. **Fail.** Two payments, credits before payment, or auto-recharge keeps charging.

### BIL-044 A webhook delivered twice is applied once

- **Spec:** billing / Stripe is kept in step / A webhook delivered twice
- **Priority:** P0
- **Proof:** Store a redelivered event as new; Stripe's replay of `invoice.paid` credits the top-up again and the test goes red.
- **Fault:** faults/BIL-044.patch
- **Test:** mods/billing/test/stripe.test.ts

A paid top-up's `invoice.paid` is replayed through the fake's control API.

**Pass.** The balance grows by the top-up once. **Fail.** It grows twice.

### BIL-045 Stripe down does not stop rating

- **Spec:** billing / Stripe is kept in step / Stripe down
- **Priority:** P0
- **Proof:** Mark an outbox row sent when Stripe refuses it; nothing waits for Stripe to come back and the test goes red.
- **Fault:** faults/BIL-045.patch
- **Test:** mods/billing/test/stripe.test.ts

Stripe rate-limits every request while usage is rated, then answers again an hour later.

**Pass.** Usage is rated and debited at once, the meter events wait in the outbox, and once Stripe answers they are all sent, each once (12,800 milli-credits in Stripe's summary). **Fail.** Rating waits for Stripe, an event is dropped, or one is counted twice.

### BIL-046 Owners manage billing through the API

- **Spec:** billing / Top-ups and auto-recharge / Auto-recharge
- **Priority:** P1
- **Proof:** Accept an auto-recharge amount below the smallest top-up; the request succeeds and the test goes red.
- **Fault:** faults/BIL-046.patch
- **Test:** mods/billing/test/api.test.ts, mods/apiserver/test/billing/proxy.test.ts

The Billing API (balance by bucket, auto-recharge settings, top-ups, the Customer Portal) through
gRPC, and the apiserver's proxy of it. The spec has no requirement for the Billing API itself yet;
the case cites the top-up rules it enforces.

**Pass.** A new owner sees 1,000 Trial credits; auto-recharge below the smallest top-up and a top-up without a payment method are refused, with the portal to add one; the proxy asks for the caller's billing whatever owner the request names, refuses non-owners and passes refusals through. **Fail.** A rule is not enforced or another owner's billing is reachable.

### BIL-047 A month of usage, end to end

- **Spec:** billing / Plans / Subscribing during the Trial
- **Spec:** stripe-fake / Subscriptions and invoices cycle under a test clock / A month passes
- **Priority:** P0
- **Proof:** Send twice the rated amount in meter events; Stripe's usage line doubles, the ledger and Stripe disagree and the scenario goes red.
- **Fault:** faults/BIL-047.patch
- **Test:** mods/conformance/test/billingScenarios.test.ts
- **Runs:** scenarios/billing/month-of-usage.yaml

The runner plays the platform: a Trial owner subscribes, makes 160 s of calls, and the test clock
passes the period's end and its grace.

**Pass.** The cycle invoice is paid: $25 for the plan, 13 cents of usage paid by 13 cents of credits, and the ledger agrees with Stripe's credit balance within a cent. **Fail.** Any amount differs or the two balances disagree.

### BIL-048 A declined top-up adds no credits and tells the owner

- **Spec:** stripe-fake / A control API for tests / Fail the next payment
- **Priority:** P0
- **Proof:** Stop telling the owner that a top-up failed; the scenario's notices lack `topup_failed` and it goes red.
- **Fault:** faults/BIL-048.patch
- **Test:** mods/conformance/test/billingScenarios.test.ts
- **Runs:** scenarios/billing/declined-top-up.yaml

The runner plays the platform: a Pay-as-you-go owner buys 1,000 credits and the fake declines the
card.

**Pass.** Billing hears `invoice.payment_failed`, sends `topup_failed`, and adds no credits (balance 3,500). **Fail.** Credits are added or the owner is not told.

# Build log: add-stripe-fake

Decisions taken while building, for the owner to review. Each can be reversed.

## 2026-10-20 (overnight, owner asleep)

### SF1. `@emulators/core` not adopted (task 1.2)

- No hands-on spike was run; the decision is from reading what the fake needs. Most of the fake is
  Stripe's billing behavior (meters, credit application order, test clocks, the renew, grace,
  finalize and retry engine, signed webhooks), which a generic emulator core does not provide.
- What a core would give (routing, an in-memory store, ids) is about 200 lines here (`router.ts`,
  `fake.ts`), with no extra dependency to keep up with.
- Revisit if a second vendor fake (Twilio, WhatsApp) needs the same plumbing; then extract ours.

### SF2. Schema and validation

- `spec/stripe.subset.json` is extracted from stripe/openapi release `v2526` (API version
  `2026-09-30.endive`, SDK `stripe@23`): 49 paths, 942 schemas. Re-running the script on the same
  release gives no diff.
- Objects are built from the schema (every required field, Stripe's empty value), then filled.
- Tests run with `validateResponses: true`: every response is checked against Stripe's own schema
  with ajv. OpenAPI 3.0 `nullable` is translated to JSON Schema (`anyOf` with null) first.
- Fields that are not nullable in the schema are omitted rather than set to null (for example
  `discount` on a pretax credit amount).

### SF3. Behaviors written from the docs, not checked against a live account

The nightly sandbox run (8.3) settles these:

- A repeated meter event `identifier` within 24 h: the fake answers 200 and counts it once.
- Thin v2 events (`v1.billing.meter.error_report_triggered`, `GET /v2/core/events/{id}`): the public
  OpenAPI at `v2526` has no v2 paths, so the shape is hand-written.
- Credit grants apply at invoice finalization, after the period ends plus grace, so a grant that
  expires exactly at period end does not cover that period's usage. This matters for the billing
  service (plan credits); see the morning notes.

### SF4. Lists

- Lists are newest first; objects created in the same second keep insertion order (newest first),
  so event order in a clock advance is stable.

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

The nightly sandbox run (add-billing-service, task 7.3) settles these:

- A repeated meter event `identifier` within 24 h: the fake answers 200 and counts it once.
- Thin v2 events (`v1.billing.meter.error_report_triggered`, `GET /v2/core/events/{id}`): the public
  OpenAPI at `v2526` has no v2 paths, so the shape is hand-written.
- Credit grants apply at invoice finalization, after the period ends plus grace, so a grant that
  expires exactly at period end does not cover that period's usage. This matters for the billing
  service (plan credits); see the morning notes.

### SF4. Lists

- Lists are newest first; objects created in the same second keep insertion order (newest first),
  so event order in a clock advance is stable.

### SF5. Conformance and nightly moved to add-billing-service (#1046)

- The `stripe:` scenario block checks that Stripe events reached the billing service. That service
  is the system under test and does not exist yet, so the block, the suite and the nightly sandbox
  run moved to `add-billing-service` (tasks 7.2 and 7.3); the spec here no longer lists them. The fake's own SDK tests cover its behavior now.

### SF6. Viewer not built yet (task 7.1)

- Pencil only reads a `.pen` file open in the app, and `designs/stripe-fake.pen` was not open. The
  server already serves a viewer directory and the `/_fake/ws` live feed; the Vite app comes next.

### SF7. The viewer (7.1)

- `mods/stripe-fake/viewer`: React 19, Vite 6 and Tailwind 4 like the dashboard, built into
  `viewer/dist` and served at `/`. Hash routes (`#/webhooks`), so the server's fallback to
  `index.html` is enough.
- Live: one `GET /_fake/state`, then again after each change on `/_fake/ws` (debounced 80 ms). A
  dot next to the host shows whether the feed is connected.
- `/_fake/state` gained `balances` (per customer: usable promotional and paid credits) and
  `grantRemaining`, computed with the fake's own credit rules, and `prices`, to tell usage lines
  from the plan. The viewer repeats no Stripe rule.
- Look (owner, 2026-10-20): Stripe-like, blurple `#635BFF`, Inter with monospace for ids, a
  "stripe fake" wordmark, and a light/dark switch remembered per browser (the first visit follows
  the system). Dark is neutral charcoal (`#14171D`), not Stripe's marketing navy.
- Differences from the frames: the design shows one customer's data; with several customers the
  Customers screen lists them all and the controls act on the one selected. Meters have no unit in
  Stripe, so the column shows the meter's display name. "Sample data" notes are gone.
- Playwright (`npm run test:viewer -w mods/stripe-fake`, after a build): the two spec scenarios
  and the theme switch, each against a real fake on a free port.
- Root ESLint skips `viewer/**` like the dashboard: its rules assume Node globals.


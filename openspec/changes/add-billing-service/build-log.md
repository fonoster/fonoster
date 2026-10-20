# Build log: add-billing-service

Decisions taken while building, for the owner to review. Each can be reversed.

## 2026-10-21 (overnight, owner asleep)

### BS1. Built before the spec was approved

The spec (#1046) has open questions Q1–Q7. Every proposed answer is a setting in `billing.yaml`
(`plans.*`), so an answer changes a default, not code. Nothing here runs unless
`features.billing.enabled` is true.

### BS2. Admission

- AppBridge has its own small gRPC client for `CheckSessionAuthorized` (`src/admission.ts`) instead
  of depending on `@fonoster/authz`, which pulls in `@fonoster/identity`. Configured with
  `authz.address`.
- AppBridge's answered-call lease (`calls.<callRef>` in the session registry) now carries
  `workspaceRef`. Billing counts an owner's active calls from those leases; a lease not rewritten
  within the registry TTL (15 s) stops counting, so a dead AppBridge's calls don't hold the limit.
  Only answered calls count.
- A workspace with no owner (apps in AppBridge's own file) is admitted and not billed.
- A new owner gets a Trial account on their first admission (1,000 credits, 30 days, proposed in
  Q2). No separate sign-up hook was needed.

### BS3. Usage feed

- Subject `billing.usage.<owner>` on `FONOSTER_USAGE_RECORDED`, not `usage.recorded.*` as the first
  draft said: `usage.>` belongs to `FONOSTER_USAGE` and streams cannot overlap.
- When billing is first turned on, all stored usage goes out once. Usage from before the account's
  `billing_started_at` is rated `before_billing` (not billable).

### BS4. Database

- Prisma, with the client generated into `src/generated/` like Identity, so it doesn't collide with
  the apiserver's client.
- The subscription lives on the account row (one per account) instead of a `subscriptions` table.
- Plan grants carry `effective_at` and `covers_until`: a plan grant pays only for usage that
  happened in its period, and stays spendable until period end + grace (D9). Usage of the next
  period during the grace window is paid from other credits.
- A grant first pays back what the overdraft owes, so what is left of each grant always adds up to
  the balance.

### BS5. Rater

- The meter registry has no `eval.llm.*` or `calls.concurrent` meters: evals use `llm.tokens.*`
  with origin `eval`, priced like call tokens on our key. Rule 5 (`limit_only`) stays for when
  `calls.concurrent` exists.
- `rate-cards/1.yaml` is a placeholder: `call.seconds` at a proposed 0.08 credits/s (4.8
  credits/min, the old $25 for 520 minutes), and no vendor prices yet. Usage with no price is
  `unpriced` (not billed) and logged as an error.

### BS6. Stripe (group 5)

- `ensureCatalog` finds or creates the product, the $25 monthly price, the usage meter
  (`fonoster_usage_milli_credits`, sum) and the metered price ($0.00001 per milli-credit) by lookup
  key, so a restart or a second replica creates nothing twice.
- Outbox rows go to Stripe in order per account; a failing row holds that account's later rows
  (backoff 5 s doubling, at most 1 h). A declined card is an answer, not a send failure: the
  `payment_intent.payment_failed` webhook handles it.
- Only Pay-as-you-go accounts (with a subscription) send meter events. Trial usage is in the ledger
  only.
- On the first paid invoice, what is left of the trial is mirrored to Stripe as a promotional
  grant, so Stripe never charges for usage the trial paid.
- Owner notices (`auto_recharge_disabled`, `authentication_required`, `topup_failed`,
  `payment_failed`) are logged for now. Email or dashboard delivery comes with the Billing page.
- Reconciliation compares each paid invoice's usage line with the ledger's billable lines of the
  same period, in cents as Stripe rounds them. Our ledger stays authoritative; drift only alerts.
- Three bugs in the Stripe fake were found and fixed on `feat/stripe-fake` (#1045): webhooks
  queued during a delivery round waited for the next tick; events of a test-clock customer were
  held until the clock's frozen time; meter event timestamps were checked against the wall clock,
  not the customer's clock. Also added: `lookup_keys` on the price list.
- `feat/billing-stripe` merges `feat/stripe-fake` for its tests. It becomes a PR once #1045 is on
  main.

### BS7. Billing API (6.1)

- `billing.proto` (`fonoster.billing.v1beta2.Billing`): GetBilling, UpdateAutoRecharge,
  CreateTopUp, Subscribe, CreatePortalSession. The billing service serves it on `grpc.apiPort`
  (50073); the apiserver serves the same service to the dashboard only when billing is on
  (`features.billing.address`, default `authz.host:50073`).
- Owners only: the methods are granted to WORKSPACE_OWNER alone, and the apiserver also checks
  that the caller owns the workspace of the call. `owner_ref` is always the caller (`sub`), never
  taken from the request.
- The portal session creates the Stripe customer at once (not through the outbox), because the
  owner is waiting for the link. Top-ups are refused until a payment method was added there.
- The Stripe fake gained `POST /v1/billing_portal/sessions` (on #1045).
- Not in the SDK yet; the dashboard work (6.3) adds it with the page.

### BS8. Stack (7.1, partly done)

- `ops/rebuild/docker/billing.Dockerfile` builds (migrations run before the service starts;
  `billing.yaml` at `/etc/fonoster/billing.yaml`).
- The billing service connects with the shared NATS settings (`nats.user`/`password`, its own
  `_INBOX_billing` prefix).
- `nats-permissions/billing.conf` is written but no `nats.conf` includes it yet. Including it makes
  every install define `NATS_BILLING_PASSWORD` (installer, bundle, Helm), and Community installs
  don't run billing. Where Cloud runs billing is the owner's call (morning notes).
- The apiserver may publish `billing.usage.>` and create `FONOSTER_USAGE_RECORDED` (all three
  copies of `apiserver.conf`).
- Checked by hand against NATS 2.11.8 with both users: the apiserver publishes stored usage, the
  billing user consumes it with its durable consumer and watches `calls.*`, and cannot write the
  session registry.
- Not done: a compose service, and the end-to-end "a call is refused once the balance is gone".

### BS9. Stripe Tax (5.6, Q6)

- The subscription asks for `automatic_tax`, and both prices are tax-exclusive, so tax is added on
  top. `ensureCatalog` sets `tax_behavior: exclusive` on prices made before (Stripe allows setting
  it once). `stripe.automaticTax` in `billing.yaml` turns it off (default on).
- Top-ups are now one-off invoices, not bare PaymentIntents: Stripe Tax does not compute tax on a
  PaymentIntent. The outbox kind `topup_invoice` creates the invoice (`automatic_tax`,
  `pending_invoice_items_behavior: exclude`, `auto_advance: false`, metadata `purpose`/`credits`),
  attaches one tax-exclusive item and pays it, each call under its own idempotency key.
- A declined top-up's invoice is voided, so it can't be paid later outside the ledger. One that
  needs the owner to authenticate stays open for them to finish; paying it credits them through
  `invoice.paid`.
- Webhooks: `invoice.paid`, `invoice.payment_failed` and `invoice.payment_action_required` with a
  `purpose` are top-ups; the `payment_intent.*` handlers are gone. Credits come from the invoice's
  `credits` metadata, so tax never becomes credits.
- The Stripe fake: `automatic_tax` on invoices and subscriptions (renewals inherit it), tax only
  when it is on, `status: requires_location_inputs` without a country; invoice items onto a given
  draft invoice; one-off invoices leave other pending items alone unless asked; automatic tax is
  refused for prices or items with no tax behavior; `/pay` answers
  `invoice_payment_intent_requires_action` when the card needs authentication.
- Open: real Stripe refuses to finalize an automatic-tax invoice when it can't place the customer.
  The fake finalizes with no tax. The Customer Portal must collect a billing address
  (portal setting) before the owner subscribes or tops up. That's a setup step for the owner.

### BS10. The billing NATS user in Helm (7.1, Q9)

- `nats.auth.billingUser` (default false) adds the `billing` user and its permission file to the
  chart's NATS, with the password from the `billing` key of `nats.auth.secret`. Community
  installs don't change, and the compose stack and installer still leave billing out.
- The deployment suite checks both settings.

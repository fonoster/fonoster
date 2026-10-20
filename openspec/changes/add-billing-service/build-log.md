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

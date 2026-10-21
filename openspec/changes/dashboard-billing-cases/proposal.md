# Proposal

## Why

The Billing page (#1058, change `add-billing-page`) is specified and unit-tested, but no non-unit test
in the QA catalog proves it. The owner asked for billing to be tested with the rest of the dashboard
(2026-10-20).

## What Changes

- No requirement changes: the cases cite `add-billing-page`'s scenarios.
- After an upgrade the page polls for the plan's credits, as it does after a top-up, so "the plan
  credits appear once Stripe confirms the first invoice" holds without a reload.

## Impact

- Code: `mods/dashboard/src/billing/index.tsx`.
- Catalog: DSH-035 to DSH-040; the Dashboard area also reads `mods/dashboard/e2e-stack`, whose
  existing billing test becomes DSH-039.

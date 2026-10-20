# Spec Delta

## ADDED Requirements

### Requirement: Billing scenarios drive the Stripe fake

Scenarios SHALL accept a `stripe:` block that sets the Stripe fake's state and failures through its
control API (clock, next payment outcome, webhook failures, meter error reports) and checks
Stripe-side results (events in order, invoice totals, credit balance) alongside the billing
service's ledger. The billing suite SHALL run against the fake on every pull request, with no
network.

#### Scenario: A declined top-up in CI

- **WHEN** the billing suite runs a scenario whose `stripe:` block declines the next payment
- **THEN** it runs against the Stripe fake with no network access and checks that
  `invoice.payment_failed` reached the billing service and no credits were added

#### Scenario: A month of usage

- **WHEN** a scenario places calls on Fonoster's keys and advances the test clock past the period
  and its grace
- **THEN** the finalized invoice equals $25 plus the rated usage less the applied credits, and the
  ledger matches Stripe's credit balance

### Requirement: The Stripe contract suite runs nightly against a sandbox

The same billing scenarios SHALL run nightly against a dedicated Stripe test-mode sandbox. The run
SHALL record the event sequence, invoice totals and balance summaries for both, and any difference
SHALL fail the job and open an issue naming the scenario.

#### Scenario: The fake drifts from Stripe

- **WHEN** Stripe applies credits in a different order than the fake for a scenario
- **THEN** the nightly job fails and opens an issue showing both sequences

# Spec Delta

## MODIFIED Requirements

### Requirement: Cloud-only screens follow capabilities

Billing and cost displays SHALL follow `billing.enabled` and `costs.display` (`none`, `usage` or
`prices`) from the capabilities. With `billing.enabled` true, Settings SHALL have a **Billing** tab
showing the balance in credits by source (plan, top-up, trial) with expiry dates, the plan and its
next renewal, auto-recharge settings, a top-up action, and a link to the Stripe Customer Portal for
payment methods and invoices. With `billing.enabled` false there SHALL be no Billing tab and no cost
fields; billing amounts appear only where `billing.enabled` is true, such as a private region's fee.

#### Scenario: No Billing tab in this release

- WHEN the user opens Settings and `billing.enabled` is false
- THEN Settings has no Billing tab, and navigating to the billing route goes back to General

#### Scenario: Billing tab in Cloud

- WHEN an owner opens Settings and `billing.enabled` is true
- THEN the Billing tab shows the balance in credits split by plan, top-up and trial, each with its
  expiry, and a Manage payment methods link that opens the Stripe Customer Portal

#### Scenario: Region fee follows billing

- WHEN `billing.enabled` is false
- THEN a private region's monthly fee is not shown

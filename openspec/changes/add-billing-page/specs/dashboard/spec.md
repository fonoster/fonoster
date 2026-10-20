# Spec Delta

## REMOVED Requirements

### Requirement: Cloud-only screens follow capabilities

**Reason**: Its "No Billing tab in this release" scenario no longer holds: Cloud owners get a
Billing tab.

**Migration**: Replaced by "Cloud-only screens follow capabilities and ownership" below, which keeps
the capability rules and the region-fee scenario.

## ADDED Requirements

### Requirement: Cloud-only screens follow capabilities and ownership

Billing and cost displays SHALL follow `billing.enabled` and `costs.display` (`none`, `usage` or
`prices`) from the capabilities. Settings SHALL have a **Billing** tab only when `billing.enabled`
is true and the signed-in user owns the workspace. Billing amounts SHALL appear only where
`billing.enabled` is true, such as a private region's fee.

#### Scenario: No Billing tab without billing

- **WHEN** the user opens Settings and `billing.enabled` is false
- **THEN** Settings has no Billing tab, and navigating to the billing route goes back to General

#### Scenario: No Billing tab for members

- **WHEN** a workspace admin who isn't the owner opens Settings and `billing.enabled` is true
- **THEN** Settings has no Billing tab, and navigating to the billing route goes back to General

#### Scenario: Billing tab in Cloud

- **WHEN** an owner opens Settings and `billing.enabled` is true
- **THEN** the Billing tab shows the plan and when it renews or the trial ends, the balance in
  credits and the overdraft, the credits split by plan, top-up and trial with each one's expiry,
  auto-recharge, and a Manage payment methods and invoices link that opens the Stripe Customer
  Portal

#### Scenario: Region fee follows billing

- **WHEN** `billing.enabled` is false
- **THEN** a private region's monthly fee is not shown

### Requirement: Owners manage billing from the Billing tab

The Billing tab SHALL let the owner:

- upgrade from the Trial to Pay-as-you-go
- buy top-up credits
- set auto-recharge

The tab SHALL show the account that covers every workspace the owner has. It SHALL count credits
before tax, and say when a payment failed.

#### Scenario: Upgrade from the Trial

- **WHEN** a Trial owner with a payment method chooses Upgrade to Pay-as-you-go
- **THEN** the plan becomes Pay-as-you-go and the plan credits appear once Stripe confirms the
  first invoice

#### Scenario: Upgrade without a payment method

- **WHEN** a Trial owner without a payment method chooses Upgrade to Pay-as-you-go
- **THEN** the tab opens the Customer Portal to add one, and upgrading works on return

#### Scenario: A top-up

- **WHEN** an owner buys 1,000 credits
- **THEN** the tab shows the payment in progress, and the balance grows by 1,000 credits once Stripe
  confirms it, whatever tax was charged

#### Scenario: Auto-recharge below the smallest top-up

- **WHEN** an owner sets an auto-recharge amount below 1,000 credits
- **THEN** the tab refuses it and names the smallest amount

#### Scenario: A failed payment

- **WHEN** the account is `past_due`
- **THEN** the tab says the last payment failed and links to the Customer Portal to fix it

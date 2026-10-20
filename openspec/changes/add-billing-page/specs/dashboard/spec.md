# Spec Delta

## REMOVED Requirements

### Requirement: Cloud-only screens follow capabilities

**Reason**: Its "No Billing tab in this release" scenario no longer holds: Cloud owners get a
Billing page of its own.

**Migration**: Replaced by "Cloud-only screens follow capabilities and ownership" below, which keeps
the capability rules and the region-fee scenario.

## ADDED Requirements

### Requirement: Cloud-only screens follow capabilities and ownership

Billing and cost displays SHALL follow `billing.enabled` and `costs.display` (`none`, `usage` or
`prices`) from the capabilities. The Billing page and its account-menu item SHALL exist only when
`billing.enabled` is true and the signed-in user owns a workspace. Billing amounts SHALL appear only
where `billing.enabled` is true, such as a private region's fee.

#### Scenario: No billing without billing

- **WHEN** a user opens the account menu and `billing.enabled` is false
- **THEN** the menu has no Billing item, and opening `/billing` goes to the workspace picker

#### Scenario: No billing for users who own no workspace

- **WHEN** a user who owns no workspace opens the account menu and `billing.enabled` is true
- **THEN** the menu has no Billing item, and opening `/billing` goes to the workspace picker

#### Scenario: Billing page in Cloud

- **WHEN** an owner chooses Billing in the account menu and `billing.enabled` is true
- **THEN** a page of its own, outside the workspace, shows the plan and when it renews or the
  Trial ends, the balance in credits and the overdraft, the credits split by plan, top-up and trial
  with each one's expiry, auto-recharge, and a Manage payment methods and invoices link that opens
  the Stripe Customer Portal

#### Scenario: Region fee follows billing

- **WHEN** `billing.enabled` is false
- **THEN** a private region's monthly fee is not shown

### Requirement: Owners manage billing from the Billing page

The Billing page SHALL let the owner:

- upgrade from the Trial to Pay-as-you-go
- buy top-up credits
- set auto-recharge

The page SHALL show the account that covers every workspace the owner has. It SHALL count credits
before tax, say when a payment failed, and say when the Trial ended.

#### Scenario: Upgrade from the Trial

- **WHEN** a Trial owner with a payment method chooses Upgrade to Pay-as-you-go
- **THEN** the plan becomes Pay-as-you-go and the plan credits appear once Stripe confirms the
  first invoice

#### Scenario: Upgrade without a payment method

- **WHEN** a Trial owner without a payment method chooses Upgrade to Pay-as-you-go
- **THEN** the page opens the Customer Portal to add one, and upgrading works on return

#### Scenario: A top-up

- **WHEN** an owner buys 1,000 credits
- **THEN** the page shows the payment in progress, and the balance grows by 1,000 credits once Stripe
  confirms it, whatever tax was charged

#### Scenario: Auto-recharge below the smallest top-up

- **WHEN** an owner sets an auto-recharge amount below 1,000 credits
- **THEN** the page refuses it and names the smallest amount

#### Scenario: A failed payment

- **WHEN** the account is `past_due`
- **THEN** the page says the last payment failed and its primary action opens the Customer Portal

#### Scenario: The Trial ended

- **WHEN** the account's Trial ended (status `ended`)
- **THEN** the page says calls are paused in the owner's workspaces, and its primary action is
  Upgrade to Pay-as-you-go

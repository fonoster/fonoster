# Spec Delta

## ADDED Requirements

### Requirement: Paid credits show up without a reload

After a top-up or an upgrade, the Billing page SHALL keep reading the account until the paid credits
arrive, and SHALL say a payment is in progress meanwhile.

#### Scenario: Plan credits after an upgrade

- **WHEN** a Trial owner upgrades to Pay-as-you-go
- **THEN** the page says a payment is in progress, and the balance shows the plan's 2,500 credits once they arrive, without a reload

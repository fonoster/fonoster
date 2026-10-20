# Spec Delta

## ADDED Requirements

### Requirement: Stored usage is published for billing

When billing is enabled, the apiserver SHALL publish every stored usage event once on the
`FONOSTER_USAGE_RECORDED` stream, deduplicated by usage id, after it is stored. Publishing SHALL
never delay or fail ingest. With billing off, nothing SHALL be published.

#### Scenario: Apiserver restarts mid-publish

- **WHEN** the apiserver stops after publishing an event but before marking it published
- **THEN** after restart the event is published again and JetStream keeps one copy

#### Scenario: Billing off

- **WHEN** `features.billing.enabled` is false
- **THEN** usage is stored and no usage is published for billing

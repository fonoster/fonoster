# Spec Delta

## ADDED Requirements

### Requirement: Call handling offers noise cancelling from the catalog

The Call handling form of a Stream and of an Autopilot agent SHALL show a single *Noise
cancelling* select whose options are *None* and each `nc` provider the catalog offers to the
workspace (`GetCapabilities`), shown by label. Choosing a provider SHALL set the app's filter for it;
choosing *None* SHALL clear the app's filters. The form SHALL show no strength control.

#### Scenario: No noise-cancelling provider is offered

- **WHEN** the catalog offers the workspace no `nc` provider
- **THEN** the select offers *None* only

#### Scenario: Turning noise cancelling on

- **WHEN** `aicoustics` is offered and the user picks *ai-coustics* and saves
- **THEN** the app is saved with `filters: [{ name: "aiCoustics" }]`

#### Scenario: Turning it off

- **WHEN** the app has `filters: [{ name: "aiCoustics" }]` and the user picks *None* and saves
- **THEN** the app is saved with an empty `filters` list

#### Scenario: A saved filter whose provider is no longer offered

- **WHEN** the app has `filters: [{ name: "aiCoustics" }]` and the catalog no longer offers `aicoustics`
- **THEN** the select shows *ai-coustics* as unavailable and saving keeps the filter

#### Scenario: The same form serves agents

- **WHEN** the user opens an Autopilot agent's Advanced tab
- **THEN** the same *Noise cancelling* select is shown and behaves as on a Stream

### Requirement: Vendor keys offers noise-cancelling providers

The Vendor keys page SHALL list providers serving `nc` the same way as speech and language-model
providers, by label, and its copy SHALL say that noise-cancelling accounts can be brought.

#### Scenario: Adding an ai-coustics key

- **WHEN** the catalog lists `aicoustics` and the owner opens Vendor keys
- **THEN** *ai-coustics* is offered when adding a key
- **AND** after saving, the row shows the provider's label and that the workspace's own key is in use

### Requirement: The call detail flags unfiltered calls

When a call record contains a `filter.failed` event, the call detail SHALL show an *Unfiltered*
badge with the recorded reason.

#### Scenario: A filter failed

- **WHEN** the user opens a call whose record contains `filter.failed` with reason `license rejected`
- **THEN** the detail shows an *Unfiltered* badge and the reason

#### Scenario: Filtering worked

- **WHEN** the user opens a call whose app has a filter and whose record has no `filter.failed` event
- **THEN** no *Unfiltered* badge is shown

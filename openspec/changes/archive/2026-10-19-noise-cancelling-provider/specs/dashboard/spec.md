# Spec Delta

## ADDED Requirements

### Requirement: Noise cancelling is one select fed by the catalog

An app's Call handling form, and a *Noise cancelling* panel on an Autopilot agent's Advanced tab,
SHALL show a single *Noise cancelling* select whose options are *None* and each `nc` provider the
catalog offers to the workspace (`GetCapabilities`), shown by label. Choosing a provider SHALL set
the app's filter for it; choosing *None* SHALL clear the app's filters. Neither SHALL show a
strength control.

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

#### Scenario: Agents set it on the Advanced tab

- **WHEN** the user opens an Autopilot agent's Advanced tab, picks *ai-coustics* in the *Noise cancelling* panel and saves the agent
- **THEN** the agent's application is saved with `filters: [{ name: "aiCoustics" }]`
- **AND** nothing is sent before the agent is saved
- **AND** the agent's Call handling drawer shows no *Noise cancelling* select

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

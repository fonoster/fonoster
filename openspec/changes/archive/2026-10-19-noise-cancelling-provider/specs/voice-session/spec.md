# Spec Delta

## ADDED Requirements

### Requirement: An app's audio filters are set through the Applications API

An Application SHALL expose its audio filters as an ordered list `filters: [{ name, options? }]`
that can be read and written through the Applications API, the SDK and the CLI. The API SHALL
accept only filter names the running version knows and only each filter's public options, and
SHALL reject anything else before storing.

#### Scenario: Enabling noise cancelling on an app

- **WHEN** a workspace member updates app `A` with `filters: [{ name: "aiCoustics" }]`
- **THEN** reading `A` returns `filters: [{ name: "aiCoustics" }]`
- **AND** the next call to `A` runs the ai-coustics filter

#### Scenario: A public option is accepted

- **WHEN** app `A` is updated with `filters: [{ name: "aiCoustics", options: { enhancementLevel: 0.8 } }]`
- **THEN** the update succeeds and the option is stored

#### Scenario: A server-side option is rejected

- **WHEN** app `A` is updated with `filters: [{ name: "aiCoustics", options: { modelFile: "/etc/passwd" } }]`
- **THEN** the update fails with `INVALID_ARGUMENT` naming the option
- **AND** the app is unchanged

#### Scenario: An unknown filter is rejected

- **WHEN** app `A` is updated with `filters: [{ name: "krisp" }]`
- **THEN** the update fails with `INVALID_ARGUMENT` naming the filter
- **AND** the app is unchanged

#### Scenario: Clearing the filters

- **WHEN** app `A` is updated with an empty `filters` list, or with no `filters` at all (an update replaces the whole app)
- **THEN** reading `A` returns no filters
- **AND** the next call to `A` runs with unfiltered audio

## MODIFIED Requirements

### Requirement: Audio filters come from app configuration

The gateway SHALL apply the app's configured audio filters to the caller's audio before speech
recognition and turn detection. A filter that needs a provider credential SHALL receive the one the
gateway resolved from the registry for the session's workspace (provider-registry). Filtering
failures MUST degrade to unfiltered audio and SHALL be reported in the call record, whether they
happen when the filter starts or later in the call.

#### Scenario: Filter configured
- **WHEN** an app's config lists an audio filter
- **THEN** STT and the Turn Detector receive filtered caller audio from the moment speech starts (B18), including the 500 ms kept before it

#### Scenario: Filter unavailable
- **WHEN** the configured filter cannot be created
- **THEN** the call continues with unfiltered audio
- **AND** the call record contains a filter failure event

#### Scenario: Filter fails during the call
- **WHEN** a running filter throws or returns frames of the wrong length
- **THEN** the rest of the call continues with unfiltered audio
- **AND** the call record contains a `filter.failed` event with the filter's name and the reason

#### Scenario: Credential comes from the registry, never from the app
- **WHEN** an app's filter configuration carries a key or a license in its options
- **THEN** the option is rejected and the filter is not built
- **AND** the gateway starts the filter only with the credential it resolved for the workspace

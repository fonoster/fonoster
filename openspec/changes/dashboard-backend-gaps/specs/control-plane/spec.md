## ADDED Requirements

### Requirement: The Calls API carries and filters by the app that handled a call

The gRPC `Calls` API SHALL return the `appRef` of the app that handled the call on every
`CallDetailRecord` (from `ListCalls` and `GetCall`), read from the call-record index (no second store), and empty when
no app handled the call. `ListCalls` SHALL accept an optional `appRef` filter that returns only the
workspace's calls whose record carries that `appRef`. Records from other workspaces MUST NOT be
returned, whatever the filter.

#### Scenario: A call record names its app

- **WHEN** an SDK user lists or gets a call that an app handled
- **THEN** the call detail record's `appRef` is that app's ref

#### Scenario: Filter calls by app

- **WHEN** an SDK user lists calls with `appRef` set to one of the workspace's apps
- **THEN** only the workspace's calls handled by that app are returned
- **AND** calls handled by other apps, or by no app, are not returned

#### Scenario: No filter lists every app's calls

- **WHEN** an SDK user lists calls without `appRef`
- **THEN** the workspace's calls are returned whatever app handled them

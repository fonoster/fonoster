## ADDED Requirements

### Requirement: The Calls API carries and filters by the app that handled a call

The `Calls` API SHALL return, on every `CallDetailRecord`, the `appRef` of the app that handled
the call, read from the call-record index. `ListCalls` SHALL take an optional `appRef` filter: empty
means no filter, a UUID returns only the workspace's calls that app handled, and any other value
MUST fail with `INVALID_ARGUMENT`. Other workspaces' records MUST NOT be returned.

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

#### Scenario: A malformed app filter is rejected

- **WHEN** an SDK user lists calls with an `appRef` that is not a UUID
- **THEN** the request fails with `INVALID_ARGUMENT` and no calls are returned

### Requirement: ListCalls validates its number filters

`ListCalls` SHALL take optional `from` and `to` filters. Empty means no filter; any other value
MUST be a number or SIP target `CreateCall` accepts as `to` (an E.164 number, a SIP user, or a
`sip:`, `sips:` or `tel:` URI), and anything else MUST fail with `INVALID_ARGUMENT`.

#### Scenario: A malformed number filter is rejected

- **WHEN** an SDK user lists calls with a `from` or `to` that is not a number or SIP target
- **THEN** the request fails with `INVALID_ARGUMENT` and no calls are returned

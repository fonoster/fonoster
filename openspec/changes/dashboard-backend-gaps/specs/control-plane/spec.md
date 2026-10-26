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

`ListCalls` SHALL take optional `from` and `to` filters that match the call record's stored `from`
and `to` exactly, as the call carried them (an E.164 number, a SIP URI with parameters, a
display-name caller ID). Empty means no filter. A filter is a search string, not a dial target: a
value over 256 characters, or one holding a control character (CR, LF, NUL and the rest), MUST fail
with `INVALID_ARGUMENT`.

#### Scenario: Number filters match the stored from and to

- **WHEN** an SDK user lists calls with a `from` or a `to` in a form the index stores
- **THEN** only the workspace's calls with exactly that `from` or `to` are returned

#### Scenario: A malformed number filter is rejected

- **WHEN** an SDK user lists calls with a `from` or `to` over 256 characters or holding a control character
- **THEN** the request fails with `INVALID_ARGUMENT` and no calls are returned

# Spec Delta

## MODIFIED Requirements

### Requirement: Records are available through the API and the dashboard

The API SHALL fetch a record by `callRef` (latest or a given version) and search records by time
range, number, app, direction and status, within the caller's workspace. The dashboard SHALL display a record
and offer download of its recording. When a record is sealed, the platform SHALL
emit the `call_record.sealed` workspace webhook with the call ref and a link to fetch the record,
and MUST NOT include record contents in the webhook. Continuous export is not part of this version.

#### Scenario: Fetch and search

- **WHEN** a workspace member searches by number and time range
- **THEN** the matching records from that workspace are returned
- **AND** records from other workspaces are never returned

#### Scenario: Seal notification

- **WHEN** a record is sealed for a workspace subscribed to `call_record.sealed`
- **THEN** the workspace receives one `call_record.sealed` webhook with the `callRef` and a fetch link
- **AND** the webhook body contains no transcript or recording

#### Scenario: Search by direction

- **WHEN** a workspace member searches with `direction=outbound`
- **THEN** only the workspace's outbound records are returned

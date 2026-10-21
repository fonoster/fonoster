## ADDED Requirements

### Requirement: Every workspace resource follows the same contract

The apiserver SHALL serve applications, secrets, numbers, trunks, agents, credentials, domains,
ACLs and API keys with the same create, get, update, delete and list behavior described in this
capability. A resource belongs to the workspace whose `accessKeyId` created it.

#### Scenario: Created resources come back

- **WHEN** a caller creates a resource with a valid request and then gets it by the returned ref
- **THEN** the get returns the fields that were sent
- **AND** the resource appears in the workspace's list

#### Scenario: Updates are kept

- **WHEN** a caller updates a resource and then gets it
- **THEN** the get returns the updated fields and the fields that were not sent are unchanged

### Requirement: Invalid requests change nothing

A create or update request that fails validation SHALL be answered with `INVALID_ARGUMENT` and a
message naming the field at fault, and SHALL create or change nothing.

#### Scenario: A required field is missing

- **WHEN** a caller creates a resource without one of its required fields
- **THEN** the call fails with `INVALID_ARGUMENT` and the message names the field
- **AND** the workspace's list is unchanged

#### Scenario: A field has the wrong format

- **WHEN** a caller sends a field in the wrong format (for example a malformed URL or E.164 number)
- **THEN** the call fails with `INVALID_ARGUMENT` and the message names the field
- **AND** nothing is created or changed

### Requirement: Unknown refs are not found

Get, update and delete of a ref that does not exist SHALL fail with `NOT_FOUND`.

#### Scenario: Unknown ref

- **WHEN** a caller gets, updates or deletes a ref that was never created
- **THEN** each call fails with `NOT_FOUND`

### Requirement: Workspaces cannot see each other's resources

A workspace SHALL NOT read, change, delete or list another workspace's resources. A ref that
belongs to another workspace SHALL be answered exactly as an unknown ref, so a caller cannot learn
that it exists.

#### Scenario: Another workspace's ref

- **WHEN** a caller in workspace B gets, updates or deletes a ref that belongs to workspace A
- **THEN** each call fails with `NOT_FOUND`
- **AND** workspace A's resource is unchanged

#### Scenario: Lists are per workspace

- **WHEN** workspaces A and B each have resources and B lists them
- **THEN** B's list contains only B's resources

### Requirement: Lists page through every item once

List calls SHALL accept `pageSize` and `pageToken`, SHALL return at most `pageSize` items and a
`nextPageToken` that is empty on the last page, and walking the pages SHALL return every item of
the workspace exactly once.

#### Scenario: Walking the pages

- **WHEN** a workspace has more items than the page size and a caller follows `nextPageToken` until it is empty
- **THEN** every item is returned exactly once and no page is larger than `pageSize`

#### Scenario: Invalid page size

- **WHEN** a caller lists with a page size that is not a positive integer
- **THEN** the call fails with `INVALID_ARGUMENT`

### Requirement: Deleted resources are gone

A deleted resource SHALL no longer be returned by get or list, and a second delete of the same ref
SHALL fail with `NOT_FOUND`.

#### Scenario: Delete

- **WHEN** a caller deletes a resource
- **THEN** a get of its ref fails with `NOT_FOUND`, the list no longer contains it, and deleting it again fails with `NOT_FOUND`

# management-api Specification

## Purpose
The contract every workspace resource of the management API shares (applications, secrets, numbers,
trunks, agents, credentials, domains, ACLs and API keys): validation, unknown refs, workspace
isolation, pagination and deletion.

## Requirements

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

### Requirement: A Number carries the aliases its carrier sends

A Number SHALL accept `aliases`, the identifiers a carrier may send instead of the number (such as
`01234`), stored by Routr and matched only on the Number's Trunk. Create and update with a non-empty
list SHALL store it; an update without aliases SHALL keep them; `clearAliases` SHALL remove them.
Routr's refusals (an alias already used on the Trunk, an alias that isn't 1 to 60 letters, digits
or `+ * . _ -`) SHALL reach the caller as INVALID_ARGUMENT with Routr's text.

#### Scenario: Aliases are stored, kept and cleared
- **WHEN** a Number is created on a Trunk with `aliases: ["01234"]`, then updated with only a new name, then with `clearAliases: true`
- **THEN** get returns `["01234"]` after the create and after the name-only update, and no aliases after the clear

#### Scenario: An alias already used on the Trunk is refused
- **WHEN** a second Number on the same Trunk is created with an alias the first one has
- **THEN** the call fails with INVALID_ARGUMENT whose message contains `alias "<a>" is already used by Number <ref> on this Trunk`, and no Number is created

### Requirement: A Trunk carries its outbound number formats

A Trunk SHALL accept `calledNumberFormat` and `callerNumberFormat` (NUMBER_FORMAT_UNSPECIFIED,
E164, E164_WITHOUT_PLUS, NATIONAL, INTERNATIONAL) and `calledNumberPrefix` and
`callerNumberPrefix`, stored by Routr. An update that leaves one out SHALL keep it;
NUMBER_FORMAT_UNSPECIFIED SHALL reset a format and `""` SHALL clear a prefix. Routr checks the
Trunk as it would be stored, so resetting a format while its prefix is stored SHALL fail with
INVALID_ARGUMENT and Routr's text unless the prefix is cleared in the same update.

#### Scenario: Formats are stored and kept
- **WHEN** a Trunk is created with `calledNumberFormat: INTERNATIONAL` and `calledNumberPrefix: "9#"`, then updated with only a new name
- **THEN** get returns both after the create and after the update

#### Scenario: A reset clears the format with its prefix
- **WHEN** that Trunk is updated with `calledNumberFormat: NUMBER_FORMAT_UNSPECIFIED` without `calledNumberPrefix: ""`
- **THEN** the call fails with INVALID_ARGUMENT whose message contains `calledNumberPrefix needs calledNumberFormat e164-without-plus, national or international`, and the Trunk is unchanged
- **AND** the same update with `calledNumberPrefix: ""` succeeds and get returns NUMBER_FORMAT_UNSPECIFIED and no prefix

### Requirement: A new SIP agent is enabled and not private

An Agent created without `enabled` SHALL be stored enabled, and one created without `privacy`
SHALL be stored with `privacy: NONE` (Routr 3's defaults, which sipnet keeps by not sending the
fields). Routr refuses registrations and calls from a disabled Agent and sends `Privacy: id` for a
private one, so these defaults keep a new Agent working.

#### Scenario: Omitted fields take the defaults
- **WHEN** an Agent is created with only `name` and `username`
- **THEN** get returns `enabled: true` and `privacy: NONE`

### Requirement: SIP resources reach Routr with its API key

sipnet SHALL call Routr's Data API with `routr.apiKey` as a Bearer token. A key Routr doesn't
hold SHALL fail the request with an error, never OK or an empty result, and nothing SHALL be
stored.

#### Scenario: A wrong key is refused
- **WHEN** an Agent is created through sipnet with a key Routr doesn't hold
- **THEN** the call returns an error and no Agent with that username exists

### Requirement: The Roomr Peer is created once

On start, the API server SHALL create the Peer the Roomr nodes register under, with its
Credentials, when `routr.roomrPeer.password` is set. A start that finds the Peer already there
SHALL change nothing.

#### Scenario: A second start changes nothing
- **WHEN** the Peer setup runs twice
- **THEN** Routr holds one Peer with that username and one set of its Credentials, linked

### Requirement: An empty reference clears it

An update SHALL remove a reference sent as `""`: a Number's `trunkRef`, a Number's route
(`appRef` or `agentAor`), an Agent's `domainRef` or `credentialsRef`, a Trunk's
`accessControlListRef`, `inboundCredentialsRef` or `outboundCredentialsRef`, and a Domain's
`accessControlListRef`. An update that leaves a reference out SHALL keep it. A Number created or
linked without a Trunk or a route SHALL be stored without them.

#### Scenario: An empty ref clears, an absent one keeps
- **WHEN** a Number on a Trunk routed to an app is updated with only a new name, then with `trunkRef: ""` and `appRef: ""`, and an Agent on a Domain is updated with `domainRef: ""`
- **THEN** get returns the Trunk and the app after the rename, the Number without a Trunk, `appRef` or `agentAor` after the clear, and the Agent without a Domain

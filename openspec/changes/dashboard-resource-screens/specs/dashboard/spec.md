# Spec Delta

## ADDED Requirements

### Requirement: Resource screens share one shape

Every resource screen SHALL list the workspace's items with an empty state and one Create action,
and SHALL create and edit in a form that keeps the API's message when a save is refused. Deleting or
removing SHALL need `DELETE` typed; Rotate and Regenerate SHALL take one click.

#### Scenario: Empty state

- **WHEN** the workspace has no items of a resource
- **THEN** the screen shows its empty state with the Create action, and no table

#### Scenario: A refused save stays in the form

- **WHEN** the API refuses a create or a save
- **THEN** the form stays open with the API's message, and nothing in the list changes

#### Scenario: Delete needs DELETE

- **WHEN** the user chooses Delete (or Remove) on an item
- **THEN** the confirm button stays disabled until `DELETE` is typed, and the item is deleted only after it is pressed

### Requirement: Numbers route calls to an agent, an app or a SIP agent

The Numbers screen SHALL add a number with Number (E.164, entered with or without `+` and spacing,
sent as `tel:+<digits>`), Name, Trunk, City and Country, and SHALL route it to one of: an agent
(an Autopilot app), an app, or a SIP agent (`sip:<username>@<domain URI>`), or to nothing. Agents and
apps are sent as `appRef`; a SIP agent as `agentAor`. The number, city and country SHALL NOT change
after the number is added; its name, trunk and route can.

#### Scenario: Add a number routed to an agent

- **WHEN** the user adds `+1 (809) 555-0100` named Front desk on the Acme trunk, routed to the agent Receptionist
- **THEN** `CreateNumber` is sent with `telUrl: "tel:+18095550100"`, the trunk's ref and the agent's `appRef`
- **AND** the list shows the number with Routes to Receptionist

#### Scenario: Reroute a number to a SIP agent

- **WHEN** the user opens a number routed to an agent and routes it to the SIP agent `maria` on `acme.sip.<domain>`
- **THEN** `UpdateNumber` is sent with `agentAor: "sip:maria@acme.sip.<domain>"` and no `appRef`

#### Scenario: A number that isn't E.164

- **WHEN** the user enters `555-0100 ext 4` as the number
- **THEN** the form says to enter the number in E.164 format, and nothing is sent

#### Scenario: The number can't be changed

- **WHEN** the user opens a saved number
- **THEN** the number and its location are shown locked, and only name, trunk and route are editable

### Requirement: Trunks connect a carrier

A trunk SHALL have a name, an inbound URI, optional security (an ACL, inbound and outbound
credentials, Send REGISTER) and outbound URIs. With `features.sip.names: domain` the inbound URI SHALL
be one label under `pstn.<domain>` that follows the name until edited. A taken inbound URI SHALL be
refused on its field, and deleting a trunk SHALL say how many numbers stop receiving calls.

#### Scenario: Create a trunk

- **WHEN** the user creates a trunk named Acme Carrier with outbound URI `sip.acme.example:5060` over UDP
- **THEN** the inbound URI is `acme-carrier.pstn.<domain>`
- **AND** `CreateTrunk` is sent with that inbound URI and the outbound URI, and the trunk page opens

#### Scenario: Taken inbound URI

- **WHEN** the API answers `ALREADY_EXISTS` for the inbound URI
- **THEN** the Inbound URI field says the URI is taken, and the form stays open

#### Scenario: Deleting a trunk with numbers

- **WHEN** the user deletes a trunk that two numbers use
- **THEN** the confirmation says 2 numbers use this trunk and will stop receiving calls through it

### Requirement: Domains are where SIP agents register

A domain SHALL have a Name, a Domain URI, an optional access control list and egress rules. When SIP
names are enforced the URI SHALL be one label under `sip.<domain>`. The URI SHALL NOT change after
creation. An egress rule SHALL pair a pattern (a regular expression with no `:`) with one of the
workspace's numbers, which a SIP agent's matching outbound call uses as its caller ID.

#### Scenario: Create a domain with an egress rule

- **WHEN** the user creates the domain `acme` with the rule `^\+1` → `+1 809 555 0100`
- **THEN** `CreateDomain` is sent with `domainUri: "acme.sip.<domain>"` and `egressPolicies: [{ rule: "^\\+1", numberRef }]`

#### Scenario: A bad egress pattern

- **WHEN** a rule's pattern is not a valid regular expression, or contains `:`
- **THEN** the row says why, and nothing is sent

#### Scenario: The domain URI can't be changed

- **WHEN** the user opens a saved domain
- **THEN** the Domain URI is disabled and says to add a new domain instead

### Requirement: SIP agents register phones to a domain

A SIP agent SHALL have a Name, a Username (lowercase letters, digits, `.`, `_`, `-`), a Domain, optional
Credentials (None), Privacy (None or Private), Max contacts (1 to 100) and Enabled. The username SHALL
NOT change after creation. The list SHALL show each agent's address `sip:<username>@<domain URI>` and an
Enabled switch that saves on its own.

#### Scenario: Create a SIP agent

- **WHEN** the user creates `maria` on `acme.sip.<domain>` with credentials
- **THEN** `CreateAgent` is sent with the username, the domain's ref and the credentials' ref
- **AND** the list shows `sip:maria@acme.sip.<domain>`

#### Scenario: Disable from the list

- **WHEN** the user turns off a SIP agent's Enabled switch in the list
- **THEN** `UpdateAgent` is sent with `enabled: false` for that agent, with no form opened

#### Scenario: Invalid SIP agent

- **WHEN** the username has capitals or spaces, or Max contacts is 0 or above 100
- **THEN** the field says why, and nothing is sent

### Requirement: ACLs allow addresses and reject the rest

An ACL SHALL have a Name and at least one allowed IPv4 address or CIDR range. The screen SHALL say that
everything not listed is rejected, and a saved ACL SHALL show what uses it.

#### Scenario: Create an ACL

- **WHEN** the user creates an ACL with `190.80.12.0/24` and `10.0.0.5`
- **THEN** `CreateAcl` is sent with `allow: ["190.80.12.0/24", "10.0.0.5"]`

#### Scenario: Not an address

- **WHEN** an allowed entry is `10.0.0.0/33` or a host name
- **THEN** the row asks for an IPv4 address or range, and nothing is sent

### Requirement: Credentials keep passwords write-only

Credentials SHALL have a Name, a Username and a Password. The password SHALL never be shown after it is
saved; editing SHALL offer New password, left empty to keep the current one. A saved credential SHALL
show what uses it.

#### Scenario: Edit without changing the password

- **WHEN** the user renames saved credentials and leaves New password empty
- **THEN** `UpdateCredentials` is sent with no password

### Requirement: Secrets keep values write-only

A secret SHALL have a Name (3 to 32 letters, digits, `_` or `-`) and a Value. The value SHALL never be
shown after it is saved; editing SHALL offer New value, left empty to keep the current one.

#### Scenario: Create a secret

- **WHEN** the user creates `CRM_API_TOKEN` with a value
- **THEN** the list shows the secret's name and no value

#### Scenario: Invalid secret name

- **WHEN** the name is `ab` or contains a space
- **THEN** the field says why, and nothing is sent

### Requirement: API keys show their secret once

Creating an API key SHALL ask for a role and an expiry (never, 30 days, 90 days, 1 year), and SHALL show
the key's secret once, in a dialog that says it won't be shown again. Regenerate SHALL replace the
secret in one click and show the new one once. Delete SHALL ask to type `DELETE`.

#### Scenario: Create an API key

- **WHEN** the user creates a Workspace admin key that expires in 90 days
- **THEN** the dialog shows the access key ID and secret with the warning that this is the only time
- **AND** after it is closed the list shows the key without its secret

#### Scenario: Regenerate an API key

- **WHEN** the user regenerates a key
- **THEN** one confirmation replaces the secret, and the new secret is shown once

### Requirement: Webhooks deliver signed events to HTTPS endpoints

A webhook SHALL have an `https://` URL and at least one event (Call started, Call ended, Call failed,
Call record sealed, Provider deprecated). Its signing secret SHALL be shown once when it is created.
Rotate SHALL take one click and say the previous secret keeps verifying for 24 hours. The screen SHALL
list recent deliveries with their status and offer to resend one.

#### Scenario: Plain HTTP refused

- **WHEN** the user enters `http://example.com/hook`
- **THEN** the URL field says webhook URLs must use https://, and nothing is sent

#### Scenario: Create a webhook

- **WHEN** the user creates a webhook for Call ended and Call record sealed
- **THEN** the signing secret is shown once, and the list shows the URL with both events

#### Scenario: Rotate the signing secret

- **WHEN** the user rotates a webhook's signing secret
- **THEN** one confirmation says the previous secret keeps verifying for 24 hours, and the new secret is shown once

### Requirement: Members are invited and removed in Settings

Settings SHALL list the workspace's members with their role, invite a member by name, email and role
(Member or Admin), resend a pending invite, and remove a member after typing `DELETE`. The owner SHALL be
shown as Owner and SHALL NOT be removable.

#### Scenario: Invite a member

- **WHEN** an admin invites Maria, maria@acme.com, as Admin
- **THEN** the invite is sent with that role, and Maria is listed

#### Scenario: Remove a member

- **WHEN** an admin removes a member and types `DELETE`
- **THEN** the member is removed and no longer listed

### Requirement: The workspace is renamed and deleted in Settings

Settings SHALL show the workspace's access key ID with a copy action, rename the workspace, and delete it
only after its name is typed. Deleting SHALL return the user to the workspaces list.

#### Scenario: Rename the workspace

- **WHEN** the owner renames the workspace to Acme Sales
- **THEN** the new name is saved and shown in the sidebar

#### Scenario: Delete the workspace

- **WHEN** the owner deletes the workspace
- **THEN** the delete button stays disabled until the workspace's name is typed
- **AND** after deleting, the user is on the workspaces list and the workspace is gone from it

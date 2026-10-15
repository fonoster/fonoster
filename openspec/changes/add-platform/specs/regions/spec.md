# regions

## ADDED Requirements

### Requirement: One global control plane, many cells

Fonoster SHALL run one global control plane (apiserver, Identity, dashboard and their database)
for every workspace. Each of our regions and each private region SHALL be a cell that runs the data
plane: Routr, RTPEngine, media nodes, VoiceSessionGateways, object storage and the analytics store.
Config and the call-record index SHALL be central; call data SHALL stay in the cell where the call
happened.

#### Scenario: Call data stays in its cell
- **WHEN** a call runs in cell `eu-1` and its record is sealed
- **THEN** the recording, transcript, SIP trace and vCon are stored in `eu-1` object storage
- **AND** the control plane stores only the index entry (call ref, time, size, location)

#### Scenario: Control plane outage
- **WHEN** the control plane is unreachable for 10 minutes
- **THEN** cells keep accepting and placing calls with their last synced config
- **AND** management changes resume being synced once the control plane is back

### Requirement: Private regions are customer-operated

A customer SHALL be able to install and upgrade a private cell on their own network with the
official Compose stack or Helm chart and a one-time region token. Fonoster SHALL only sync config
to the cell (numbers, apps and the provider catalog) and MUST NOT install, upgrade or operate
software in the cell.

#### Scenario: Registering a private cell
- **WHEN** a customer installs the Helm chart with a valid region token
- **THEN** the cell appears in the control plane as a region of that workspace
- **AND** its numbers, apps and catalog are synced to it

#### Scenario: Upgrades are the customer's
- **WHEN** a new Fonoster release is published
- **THEN** no software in the private cell changes until the customer upgrades it

#### Scenario: Invalid token
- **WHEN** a cell starts with an expired or unknown region token
- **THEN** the control plane refuses the link and the cell reports the reason in its logs

### Requirement: Cells link outbound-only over a NATS leaf node

A cell SHALL connect to the control plane only through an outbound NATS leaf-node connection over
TLS. No inbound port on the cell's network SHALL be required for the control plane link.

#### Scenario: No inbound ports
- **WHEN** a private cell runs behind a firewall that blocks all inbound traffic except SIP and RTP from carriers
- **THEN** the cell links to the control plane and config sync works

#### Scenario: Plain-text link refused
- **WHEN** a cell attempts a leaf-node connection without TLS
- **THEN** the control plane refuses it

### Requirement: Call data and provider keys never leave the cell

Recordings, transcripts, SIP traces, call records and provider keys of a private cell MUST NOT be
sent to the control plane or to any other cell. Only the call-record index, synced config and
health information SHALL cross the link.

#### Scenario: Keys stay local
- **WHEN** a private cell uses its own Deepgram key stored in the cell's secret store
- **THEN** the key never appears in any message on the leaf-node link

#### Scenario: Dashboard access to a private record
- **WHEN** a user opens a private-cell call in the dashboard
- **THEN** the record's contents are fetched from the cell, and the control plane relays or links them without storing them

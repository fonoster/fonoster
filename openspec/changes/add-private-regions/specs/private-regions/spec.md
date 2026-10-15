# private-regions

## ADDED Requirements

### Requirement: A workspace lives in one region for its whole life

Every workspace SHALL be bound to exactly one region when it is created: one of Fonoster's public
regions or its own private region. The binding MUST NOT change afterwards. Numbers, apps, calls,
call records and outbound calls of the workspace SHALL run and be stored in that region.

#### Scenario: Region chosen at creation
- **WHEN** a user creates workspace "Acme" and picks public region `eu-west-1`
- **THEN** the workspace's region is `eu-west-1` and its calls run in `eu-west-1`

#### Scenario: Region cannot change
- **WHEN** any user or API call tries to change the region of an existing workspace
- **THEN** the request is refused with `region_immutable` and the workspace is unchanged

#### Scenario: Existing workspaces
- **WHEN** this change is deployed
- **THEN** every existing workspace is bound to the default public region

### Requirement: Creating a workspace on a private region creates the region

When a user creates a workspace and picks "Private region", the platform SHALL create the
workspace and its private region together, owned by that workspace only, and SHALL show a one-time
enrollment token and the install commands (Compose and Helm). Until the region's cell enrolls, the
workspace SHALL show the region as `waiting` and calls SHALL NOT be accepted for it.

#### Scenario: Private workspace created
- **WHEN** a user creates workspace "Acme on-prem" with "Private region"
- **THEN** a region owned by that workspace exists in state `waiting`
- **AND** the user sees an enrollment token and install commands containing it

#### Scenario: One workspace per private region
- **WHEN** a user creates another workspace
- **THEN** it cannot pick "Acme on-prem"'s private region; it gets a public region or a new private region

### Requirement: Enrollment uses a one-time token and issues the cell its own credentials

The enrollment token SHALL be a JWT signed by the control plane (ES256) whose claims carry the
region id, the workspace ref, the control-plane URL, the leaf-node URL, a unique id and an expiry
24 hours after issue. A cell SHALL enroll by presenting the token and a public key it generated;
the control plane SHALL then mark the token used and return credentials scoped to that region's
subjects only. A token MUST NOT enroll twice, and an expired, used or unknown token MUST be refused
with a reason the cell logs.

#### Scenario: Successful enrollment
- **WHEN** a cell starts with a valid unused token
- **THEN** it receives region credentials, stores them locally, connects over the leaf node and the region becomes `connected`

#### Scenario: Token replay
- **WHEN** a second cell presents the same token
- **THEN** enrollment is refused with `token_used` and the first cell stays connected

#### Scenario: Expired token
- **WHEN** a cell presents a token issued more than 24 hours earlier
- **THEN** enrollment is refused with `token_expired`

#### Scenario: Credentials are scoped
- **WHEN** an enrolled cell tries to publish or subscribe outside `region.<its id>.>`
- **THEN** the leaf node refuses it

### Requirement: Re-issuing a token or disconnecting revokes the cell

The workspace's Region page SHALL let an owner or admin re-issue an enrollment token and disconnect
the region. Enrolling with a re-issued token SHALL revoke the previous credentials. Disconnecting
SHALL revoke the current credentials immediately and put the region in `waiting`. Deleting the
workspace SHALL revoke its region.

#### Scenario: Re-enroll after losing the cell
- **WHEN** an owner re-issues a token and a new cell enrolls with it
- **THEN** the new cell is connected and the old cell's credentials are refused

#### Scenario: Disconnect
- **WHEN** an owner disconnects the region
- **THEN** the cell's next message on the link is refused and the region shows `waiting`

### Requirement: Provider keys of a private region stay in the cell

For a workspace on a private region, provider keys and other secrets SHALL be stored only in the
cell. The control plane MUST NOT receive, store or relay their values. The dashboard SHALL list the
secret names the region needs (from the workspace's apps and catalog choices) and, for each, whether
the cell reports it as set.

#### Scenario: Missing key shown
- **WHEN** an app in a private workspace uses `deepgram/nova-3` and the cell has no `deepgram` key
- **THEN** the Secrets page shows `deepgram` as "Missing in your region" with how to set it

#### Scenario: Value never leaves the cell
- **WHEN** a key is set on the cell with `fonoster-region secrets set deepgram`
- **THEN** the dashboard shows it as set and no message on the link contains its value

### Requirement: Private call content is relayed, never stored centrally

For a workspace on a private region, the dashboard SHALL read recordings, transcripts and vCons
through the control plane, which SHALL fetch them from the cell over the existing outbound link and
stream them to the browser without writing them to storage. The control plane SHALL check the
user's access first; the cell SHALL audit each read.

#### Scenario: Listen to a private recording
- **WHEN** a member opens a call of a private workspace and plays its recording
- **THEN** the audio streams from the cell through the control plane to the browser
- **AND** no copy is written outside the cell, and the cell's audit log has the read

#### Scenario: Region offline
- **WHEN** the private region is offline and a member opens a call
- **THEN** the dashboard shows the call's metadata and "Your region is offline" instead of the content

### Requirement: Region status and supported versions

A connected cell SHALL send a heartbeat every 30 seconds with its version, components, active calls
and which secrets are set. The region SHALL be `connected`, `degraded` (a component unhealthy),
`offline` (no heartbeat for 2 minutes) or `unsupported` (version outside the current and previous
minor release). For `unsupported`, config sync SHALL pause with the reason shown; calls SHALL keep
running on the last synced config.

#### Scenario: Offline after missed heartbeats
- **WHEN** a connected cell sends no heartbeat for 2 minutes
- **THEN** the region shows `offline` with the time of the last heartbeat

#### Scenario: Old cell
- **WHEN** a cell two minor releases behind connects
- **THEN** the region shows `unsupported` with the required version, and config sync is paused

### Requirement: Config syncs from the control plane to the private cell

The control plane SHALL sync to the private cell the workspace's numbers, apps (including
assistants), Routr resources (domains, agents, trunks, ACLs), the provider catalog, webhook endpoint
configuration and recording policy. Central config SHALL be authoritative; the cell SHALL own only
its secrets. Webhooks SHALL be delivered from the cell.

#### Scenario: App change reaches the cell
- **WHEN** a member edits an app of a private workspace
- **THEN** the cell receives the change within 10 seconds while connected, or on reconnect otherwise

### Requirement: Private cells run their own Autopilot

A private cell SHALL run the hosted Autopilot service itself. Autopilot apps of a private workspace
SHALL point to the cell's Autopilot; their assistants SHALL sync to the cell and their LLM keys
SHALL stay in the cell. No conversation data of a private workspace SHALL reach Fonoster's hosted
Autopilot.

#### Scenario: Autopilot call in a private region
- **WHEN** a caller reaches an Autopilot app of a private workspace
- **THEN** the cell's gateway dials the cell's Autopilot, which uses the cell's LLM key
- **AND** no transcript or LLM request leaves the cell

### Requirement: Public regions come from data; one at launch

The region picker SHALL list the public regions the platform offers plus "Private region". At
launch the only public region SHALL be `us-east-1`, which is the default. Adding a public region
SHALL need no dashboard change.

#### Scenario: Default region
- **WHEN** a user creates a workspace without changing the picker
- **THEN** the workspace is bound to `us-east-1`

### Requirement: Private regions are billed per region

A private region SHALL be billed as a flat monthly fee per region. Minutes of a private workspace
SHALL be reported for visibility and SHALL NOT be billed per minute.

#### Scenario: Usage shown, not billed
- **WHEN** a private workspace makes 1,000 minutes of calls in a month
- **THEN** its usage page shows 1,000 minutes and its bill is the region's flat fee

### Requirement: Regions report their connection details and the dashboard shows them

Every region SHALL publish its connection details: SIP endpoints (host, port, transport), the
public signaling and media addresses carriers must allowlist, and its RTP port range. A private
region's agent SHALL report them on connect and whenever they change; a public region's details
SHALL come from the control plane's configuration. The API SHALL return the details of the
workspace's region, and the dashboard SHALL show them in Settings → Region and where they are
needed: the trunk form ("Point your carrier at …" and the addresses to allowlist) and SIP user
settings (server, port, transport for a softphone).

#### Scenario: Private region reports its SIP host
- **WHEN** a private region's cell connects with SIP at `sip.acme.example:5061` over TLS and signaling address `203.0.113.10`
- **THEN** Settings → Region shows that host, port, transport and address with copy buttons
- **AND** the trunk form of that workspace tells the user to point the carrier at `sip.acme.example:5061` and allowlist `203.0.113.10`

#### Scenario: Details change
- **WHEN** the cell's public address changes and the agent reports new endpoints
- **THEN** the dashboard shows the new address within one heartbeat interval

#### Scenario: Public region
- **WHEN** a workspace in `us-east-1` opens Settings → Region or the trunk form
- **THEN** it sees `us-east-1`'s configured SIP host, ports, transports and addresses

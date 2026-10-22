# private-regions Specification

## Purpose
Customer-operated private regions: enrollment, relay, status and revocation.

## Requirements

### Requirement: A workspace lives in one region for its whole life

Every workspace SHALL be bound to exactly one region when it is created: a public region or one of
its owner's private regions. The binding MUST NOT change afterwards. Numbers, apps, calls, call
records and outbound calls of the workspace SHALL run and be stored in that region.

#### Scenario: Region chosen at creation
- **WHEN** a user creates workspace "Acme" and picks public region `us-east-2`
- **THEN** the workspace's region is `us-east-2` and its calls run in `us-east-2`

#### Scenario: Region cannot change
- **WHEN** any user or API call tries to change the region of an existing workspace
- **THEN** the request is refused with `region_immutable` and the workspace is unchanged

#### Scenario: Existing workspaces
- **WHEN** this change is deployed
- **THEN** every existing workspace on `us-east-1` or no region is bound to the public region `default`
- **AND** every existing private region belongs to the owner of the workspace it was created for

### Requirement: Users create and own private regions

A user SHALL create a private region from their account area, not from "New workspace", giving an
id, a display name and a SIP domain, and SHALL receive a one-time enrollment token. The region SHALL
belong to that user. Any workspace owned by that user MAY pick it when the workspace is created;
other users' workspaces MUST NOT. A private region SHALL receive config, secrets and calls only for
its owner's workspaces that picked it, keyed by workspace. A region used by any workspace MUST NOT
be deleted.

#### Scenario: Private region created
- **WHEN** a user creates region `acme-hq` "Acme HQ" with SIP domain `sip.acme.com`
- **THEN** a region owned by that user exists in state `waiting` and the user sees a one-time enrollment token

#### Scenario: Several workspaces in one private region
- **WHEN** the owner creates workspaces "Acme" and "Acme Labs" and picks `acme-hq` for both
- **THEN** both are bound to `acme-hq` and the region's config snapshot carries both, keyed by workspace

#### Scenario: Another user's region
- **WHEN** a different user creates a workspace and asks for `acme-hq`
- **THEN** the request is refused; that user can pick a public region or one of their own private regions

#### Scenario: Delete a region in use
- **WHEN** the owner deletes `acme-hq` while "Acme" uses it
- **THEN** the request is refused with `region_in_use`; deleting it after the last workspace is gone succeeds and revokes its cell

#### Scenario: Records from other workspaces
- **WHEN** a region sends an index entry or usage for a workspace not bound to it
- **THEN** the control plane drops it

### Requirement: Region ids, names and SIP domains

A region id SHALL be 3–32 lowercase letters, digits or hyphens, start with a letter, and never
change. Private ids SHALL be unique per owner; `default` and the public prefixes `us-`, `eu-`, `sa-`,
`ap-`, `af-`, `me-` SHALL be refused for private regions. Public ids SHALL be `default` or
`<geo>-<area>-<n>`. The display name SHALL be editable. A private region's SIP domain SHALL be
required and be a fully qualified domain name; workspaces SHALL get subdomains of it in the region
(`<label>.<sipDomain>`), and the region's connection details SHALL include it.

#### Scenario: Reserved id
- **WHEN** a user creates a private region with id `us-office`
- **THEN** the request is refused with `region_id_reserved`

#### Scenario: Same id, different owners
- **WHEN** two users each create a private region `acme-hq`
- **THEN** both succeed; creating a second `acme-hq` for the same user is refused with `region_id_taken`

#### Scenario: Workspace SIP domain
- **WHEN** workspace "Acme" with cloud domain `acme.fonoster.example` runs in a region with SIP domain `sip.acme.com`
- **THEN** the region's Routr serves `acme.sip.acme.com` and the workspace's region view shows it

### Requirement: Enrollment uses a one-time token and issues the cell its own credentials

The enrollment token SHALL be a JWT signed by the control plane (ES256) whose claims carry the
region ref, the region id and kind, the control-plane URL, the leaf-node URL, a unique id and an
expiry 24 hours after issue. Public and private regions SHALL enroll the same way. A cell SHALL
enroll by presenting the token and a public key it generated; the control plane SHALL then mark the
token used and return credentials scoped to that region's subjects only. A token MUST NOT enroll
twice, and an expired, used or unknown token MUST be refused with a reason the cell logs.

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
- **WHEN** an enrolled cell tries to publish or subscribe outside `region.<its ref>.>`
- **THEN** the leaf node refuses it

### Requirement: Re-issuing a token or disconnecting revokes the cell

The region's owner SHALL be able to re-issue an enrollment token and disconnect the region from
the region's page. Enrolling with a re-issued token SHALL revoke the previous credentials.
Disconnecting SHALL revoke the current credentials immediately and put the region in `waiting`.

#### Scenario: Re-enroll after losing the cell
- **WHEN** the owner re-issues a token and a new cell enrolls with it
- **THEN** the new cell is connected and the old cell's credentials are refused

#### Scenario: Disconnect
- **WHEN** the owner disconnects the region
- **THEN** the cell's next message on the link is refused and the region shows `waiting`

### Requirement: Provider keys of a private region stay in the cell

For a workspace on a private region, provider keys and other secrets SHALL be stored only in the
cell. The control plane MUST NOT receive, store or relay their values. The dashboard SHALL list the
secret names the region needs (from its workspaces' apps and catalog choices) and, for each, whether
the cell reports it as set.

#### Scenario: Missing key shown
- **WHEN** an app in a private workspace uses `deepgram/nova-3` and the cell has no `deepgram` key
- **THEN** the Secrets page shows `deepgram` as "Missing in your region" with how to set it

#### Scenario: Value never leaves the cell
- **WHEN** a key is set on the cell with `fonoster-region secrets set deepgram`
- **THEN** the dashboard shows it as set and no message on the link contains its value

### Requirement: Keys in public regions

Fonoster's own provider keys SHALL be set on each public region with the same secrets command as
private regions and SHALL NOT be stored in the cloud database. A workspace's bring-your-own keys SHALL
stay in the cloud as encrypted workspace Secrets; a public region SHALL fetch them over its link per
call, only for workspaces bound to it, and SHALL NOT cache, store or log them beyond that call.

#### Scenario: Bring-your-own key in a public region
- **WHEN** a workspace on public region `us-east-2` has its own `deepgram` key and receives a call
- **THEN** the region's AppBridge uses that key for the call, fetched from the cloud for that call only

#### Scenario: Private regions never get values
- **WHEN** a private region asks the cloud for a workspace key
- **THEN** the control plane refuses with `not_public`

### Requirement: Private call content is relayed, never stored centrally

For a workspace on a private region, the dashboard SHALL read recordings, transcripts and vCons
through the control plane, which SHALL fetch them from the cell over the existing outbound link and
stream them to the browser without writing them to storage. The control plane SHALL check the
user's access first; the cell SHALL audit each read. The control plane SHALL hold only the call's
metadata (the index entry, as listed in regions); the content SHALL cross the link only as replies
to a read of one record. At most 8 reads SHALL be relayed from one region at once across every
control-plane replica (the slots are leases in the database); more answer HTTP 429.

#### Scenario: Relay limit across replicas
- **WHEN** three control-plane replicas get 24 concurrent downloads from one region
- **THEN** at most 8 are relayed and the rest answer `rate_limited`; a slot of a replica that died
  frees itself when its lease runs out

#### Scenario: Listen to a private recording
- **WHEN** a member opens a call of a private workspace and plays its recording
- **THEN** the audio streams from the cell through the control plane to the browser
- **AND** no copy is written outside the cell, and the cell's audit log has the read

#### Scenario: Region offline
- **WHEN** the private region is offline and a member opens a call
- **THEN** the dashboard shows the call's metadata and "Your region is offline" instead of the content

### Requirement: Region status and supported versions

A connected cell SHALL send a heartbeat every 30 seconds with its version, components, active calls
and which secrets are set. Components SHALL be the number of Roomr nodes with a fresh heartbeat,
whether AppBridge is ready (its gRPC health check through its Service) and whether Autopilot is
ready; active calls SHALL be the sum of `rooms` in the nodes' heartbeats. The region SHALL be
`connected`, `degraded` (a component unhealthy), `offline` (no heartbeat for 2 minutes) or
`unsupported` (version outside the current and previous minor release). For `unsupported`, config
sync SHALL pause with the reason shown; calls SHALL keep running on the last synced config.

#### Scenario: Offline after missed heartbeats
- **WHEN** a connected cell sends no heartbeat for 2 minutes
- **THEN** the region shows `offline` with the time of the last heartbeat

#### Scenario: Old cell
- **WHEN** a cell two minor releases behind connects
- **THEN** the region shows `unsupported` with the required version, and config sync is paused

#### Scenario: AppBridge not ready
- **WHEN** no AppBridge replica in a connected cell passes its health check
- **THEN** the region shows `degraded` with AppBridge named as the unhealthy component

### Requirement: Config syncs from the control plane to the region

The control plane SHALL sync to a region one snapshot holding, per bound workspace, its numbers,
apps (including agents), Routr resources (domains, agents, trunks, ACLs), webhook endpoint
configuration and recording policy, plus the provider catalog those apps use. Central config SHALL be
authoritative; the cell SHALL own only its secrets. Webhooks SHALL be delivered from the cell. A
workspace missing from a snapshot SHALL be removed from the region.

#### Scenario: App change reaches the cell
- **WHEN** a member edits an app of a private workspace
- **THEN** the cell receives the change within 10 seconds while connected, or on reconnect otherwise

#### Scenario: Replica dies inside the debounce window
- **WHEN** the replica that took a config change is killed before its debounced publish
- **THEN** the change is already marked on the region row, and another replica publishes a higher
  `configVersion` carrying it within 10 seconds

#### Scenario: Workspace deleted
- **WHEN** the owner deletes "Acme Labs" from region `acme-hq`
- **THEN** the region's next snapshot no longer carries it and the cell removes its apps, webhooks and Routr resources

### Requirement: Private cells run their own Autopilot

A private cell SHALL run the hosted Autopilot service itself. Autopilot apps of a private workspace
SHALL point to the cell's Autopilot; their agents SHALL sync to the cell and their LLM keys
SHALL stay in the cell. No conversation data of a private workspace SHALL reach Fonoster's hosted
Autopilot.

#### Scenario: Autopilot call in a private region
- **WHEN** a caller reaches an Autopilot app of a private workspace
- **THEN** the cell's AppBridge dials the cell's Autopilot, which uses the cell's LLM key
- **AND** no transcript or LLM request leaves the cell

### Requirement: Public regions are created by an operator; `default` is always offered

The region picker SHALL list the offered public regions plus the user's own private regions. The
default public region's id SHALL always be `default` (geography only in its display name). Public
regions SHALL be created by an operator with the operator key held in the API server's config (create,
list, publish, revoke), and SHALL enroll with the same command customers use. A created public region
SHALL appear in pickers only after it is published and while it is connected. Configured public
regions SHALL remain a fallback (always offered) for installations without an enrolled one.

#### Scenario: Default region
- **WHEN** a user creates a workspace without changing the picker
- **THEN** the workspace is bound to `default`

#### Scenario: Admin API needs the operator key
- **WHEN** a signed-in user without the operator key calls the region admin API
- **THEN** the request is refused with `operator_key_invalid`

#### Scenario: Publish a new public region
- **WHEN** the operator creates `us-east-2`, enrolls it and publishes it
- **THEN** it appears in every user's picker once its first heartbeat arrives; revoking it withdraws it and revokes its cell

### Requirement: Region operations live in one ops utility

Region operations SHALL ship as a standalone utility, `fonoster-region`, not in the `fonoster` CLI:
`create|list|publish|revoke` (cloud side, with the operator key, for public regions) and
`enroll|secrets|status|run` (on the region machine). Users create private regions from the dashboard
or the API.

#### Scenario: Operator creates a public region
- **WHEN** the operator runs `fonoster-region create us-east-2 --name "US East (Ohio)"` with the operator key
- **THEN** the region exists unpublished and the command prints its one-time enrollment token

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
needed: the trunk form ("Point your carrier at …" and the addresses to allowlist) and SIP agent
settings (server, port, transport for a softphone). The details SHALL include the region's SIP domain.

#### Scenario: Private region reports its SIP host
- **WHEN** a private region's cell connects with SIP at `sip.acme.example:5061` over TLS and signaling address `203.0.113.10`
- **THEN** Settings → Region shows that host, port, transport and address with copy buttons
- **AND** the trunk form of that workspace tells the user to point the carrier at `sip.acme.example:5061` and allowlist `203.0.113.10`

#### Scenario: Details change
- **WHEN** the cell's public address changes and the agent reports new endpoints
- **THEN** the dashboard shows the new address within one heartbeat interval

#### Scenario: Public region
- **WHEN** a workspace in `default` opens Settings → Region or the trunk form
- **THEN** it sees `default`'s configured SIP host, ports, transports and addresses

# private-regions

## MODIFIED Requirements

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

### Requirement: Region operations live in one ops utility

Region operations SHALL ship as a standalone utility, `fonoster-region`, not in the `fonoster` CLI:
`create|list|publish|revoke` (cloud side, with the operator key, for public regions) and
`enroll|secrets|status|run` (on the region machine). Users create private regions from the dashboard
or the API.

#### Scenario: Operator creates a public region
- **WHEN** the operator runs `fonoster-region create us-east-2 --name "US East (Ohio)"` with the operator key
- **THEN** the region exists unpublished and the command prints its one-time enrollment token

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

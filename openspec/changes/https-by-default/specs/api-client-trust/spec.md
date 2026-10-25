## ADDED Requirements

### Requirement: Clients trust a CA file

The SDK (`@fonoster/sdk` in Node), the `fonoster` CLI and the `fonoster-region` agent SHALL accept a
PEM file of certificate authorities to trust when they connect to an API endpoint over TLS: the SDK
as a client option, the CLI and the region agent as `--ca-file <path>`. A connection MUST verify the
server certificate against that file in addition to the system's trusted authorities, and MUST
still verify the host name. A missing or unreadable file MUST fail before connecting, naming the
path.

#### Scenario: SDK trusts the generated CA
- **WHEN** a Node program creates the SDK client with the install's `ca.pem` and calls the API at
  `https://<host>`
- **THEN** the call succeeds

#### Scenario: CLI trusts the generated CA
- **WHEN** the owner runs `fonoster workspaces login --ca-file ./ca.pem --endpoint <host>` against
  an install that uses the generated certificate
- **THEN** login succeeds and later commands for that workspace keep using the same CA file

#### Scenario: Region agent trusts the generated CA
- **WHEN** `fonoster-region` joins a control plane that uses the generated certificate, with
  `--ca-file ./ca.pem`
- **THEN** it connects without `--allow-insecure`

#### Scenario: No CA, untrusted certificate
- **WHEN** a client connects to an install that uses the generated certificate without a CA file
- **THEN** the connection fails with a certificate error that suggests `--ca-file` (or the SDK
  option)

#### Scenario: Wrong host name
- **WHEN** a client trusts the CA but connects by a name the server certificate doesn't cover
- **THEN** the connection fails with a host name error

#### Scenario: Missing file
- **WHEN** `--ca-file` names a file that doesn't exist
- **THEN** the command exits non-zero before connecting and names the path

### Requirement: One environment variable for the CA

The SDK, the CLI and the region agent SHALL also read the CA file from one environment variable,
`FONOSTER_CA_FILE`, so scripts and CI set it once. An explicit option or flag MUST win over the
variable.

#### Scenario: CI sets the variable
- **WHEN** `FONOSTER_CA_FILE` points at the install's `ca.pem` and a CLI command runs without
  `--ca-file`
- **THEN** the command trusts that CA

#### Scenario: Flag wins
- **WHEN** both `FONOSTER_CA_FILE` and `--ca-file` are set to different files
- **THEN** the command uses the `--ca-file` one

### Requirement: Plain HTTP stays an explicit choice

`--insecure` (CLI), `allowInsecure` (SDK) and `--allow-insecure` (region agent) SHALL keep meaning
"connect without TLS" to a server that really serves plain HTTP. They MUST NOT be needed, or
suggested, to reach an install that uses the generated certificate.

#### Scenario: Plain HTTP server
- **WHEN** an install has HTTPS turned off and a client connects with `--insecure`
- **THEN** the connection uses plain HTTP and succeeds

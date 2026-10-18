# deployment Specification

## Purpose
How Fonoster is configured, packaged and released for Docker Compose and Helm.
## Requirements
### Requirement: Docker Compose and Helm are official targets

Fonoster SHALL ship a Docker Compose stack and a Helm chart as the two official deployment
targets. CI SHALL check both nightly and on every pull request that changes their inputs: the
Compose install SHALL be made from the release archive the way a self-hoster makes it and SHALL
reach a healthy apiserver and a dashboard that answers, and the Helm chart SHALL lint and render to
valid Kubernetes manifests with each values file it ships. A release SHALL be cut only by hand and
MUST NOT be published before a person approves it, after its images and install archive are built.

#### Scenario: Nightly on both targets
- **WHEN** the nightly pipeline runs
- **THEN** the release archive is installed with Docker Compose and the run fails unless the apiserver is healthy and the dashboard answers 200
- **AND** the Helm chart is linted, rendered with each shipped values file and validated, reported as its own job

#### Scenario: Release gated
- **WHEN** a release run has published its packages and images and drafted the release with the install archive
- **THEN** it waits for approval in the release-approval environment
- **AND** the GitHub release stays a draft until that approval is given

#### Scenario: Merging publishes nothing
- **WHEN** a pull request is merged into main
- **THEN** no package, image or release is published

### Requirement: One YAML config per Fonoster service, no .env

Each Fonoster service SHALL read exactly one config file (YAML, JSON or JSON with comments),
mounted at `/config/<service>.yaml` in its container. Secrets SHALL appear inline, as `secret://` references (D8), or as `${VAR}` /
`${VAR:-default}` placeholders resolved from the container environment, which Docker Compose
fills from `.env`. Compose SHALL pass each Fonoster service only the `.env` values its own config
file names (an explicit `environment:` list), never the whole `.env`, and only the service that
signs Identity's tokens (the apiserver) SHALL get Identity's private key; services that only
verify get the public key. Fonoster services MUST NOT read configuration from a `.env` file
themselves. Third-party containers keep their own configuration.

#### Scenario: Secret reference resolved
- **WHEN** the gateway config sets a provider credential to `secret://k8s/fonoster/deepgram#key`
- **THEN** the gateway starts with the resolved value and never logs it

#### Scenario: Placeholder resolved from the container environment
- **WHEN** `gateway.yaml` sets `encryption.key` to `"${ENCRYPTION_KEY}"` and Compose passes
  `ENCRYPTION_KEY` from `.env`
- **THEN** the gateway decrypts workspace vendor keys the apiserver encrypted with the same key

#### Scenario: Unset placeholder
- **WHEN** a config value is `${VAR}`, `VAR` is unset or empty and no default is given
- **THEN** the service refuses to start, naming the variable and the key path, never a value

#### Scenario: Each container gets only its own values
- **WHEN** the self-host bundle starts
- **THEN** the media node, gateway and Autopilot containers hold none of the values only another
  service's file names (for example the apiserver's NATS password or the owner's password)
- **AND** only the apiserver container mounts `keys/private.pem`; the gateway mounts `public.pem`
  and its call-record key

#### Scenario: A .env file is ignored
- **WHEN** a `.env` file in the working directory sets a value that the service's YAML sets differently
- **THEN** the service uses the YAML value

#### Scenario: Development mode reads no .env either
- **WHEN** a service starts with `NODE_ENV=development` and a `.env` file exists in the repository
- **THEN** the service does not load it

### Requirement: Each NATS user reads only its own replies

Where NATS has per-service users (Compose, cell and Helm), each user SHALL be allowed to subscribe
to replies only under its own inbox prefix, `_INBOX_<user>.>`, and every Fonoster NATS client that
connects with a user SHALL use that prefix for requests and JetStream deliveries. No user SHALL be
allowed `_INBOX.>` or another user's prefix; a user that only publishes (Routr) subscribes to
nothing.

#### Scenario: Another service's reply stays private
- **WHEN** the gateway requests a workspace key and the region agent replies
- **THEN** a media node subscribing to `_INBOX.>` or `_INBOX_gateway.>` is refused and receives nothing
- **AND** the gateway receives the reply

#### Scenario: Session registry still works
- **WHEN** services with prefixed inboxes put, get and watch session-registry entries
- **THEN** each succeeds within its own permissions

### Requirement: Every service is a plain container

Every Fonoster deployable (apiserver, VoiceSessionGateway, media node, Autopilot, dashboard) SHALL
be a single container image that needs only its config file, its ports and its dependencies'
addresses, so it can run on container platforms other than the official targets.

#### Scenario: Running with plain docker
- **WHEN** an operator runs the gateway image with `docker run`, its config file mounted and NATS reachable
- **THEN** the gateway starts, registers its health and accepts sessions

### Requirement: Deployments are closed by default

The Helm chart SHALL enable NATS users (`nats.auth.enabled: true`) by default and SHALL refuse to
render with auth off unless `nats.auth.allowUnauthenticated: true`. Envoy SHALL NOT allow every
origin with CORS: only the origins the deployment lists (Compose `CORS_ALLOWED_ORIGINS`, Helm
`envoy.corsAllowedOrigins`; none by default, the dashboard being same-origin). The media node's
NATS user SHALL only write its session-registry entries (no gets, consumers or consumer deletes).
No signing or encryption key SHALL be committed; Identity SHALL refuse to start with a key that was
once published in the repository, or with the example's placeholder encryption key. The media
node's builder image SHALL be pinned to a patched Go release by digest.

#### Scenario: Helm install without NATS users
- **WHEN** the chart is rendered with `nats.auth.enabled=false` and no `allowUnauthenticated`
- **THEN** rendering fails with a message naming `nats.auth.allowUnauthenticated`

#### Scenario: A copied development key
- **WHEN** Identity starts with the signing key formerly at `config/keys/private.pem`
- **THEN** it refuses to start and says to generate a key


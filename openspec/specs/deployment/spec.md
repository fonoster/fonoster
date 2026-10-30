# deployment Specification

## Purpose
How Fonoster is configured, packaged and released for Docker Compose.

## Requirements

### Requirement: Docker Compose is the official target

Fonoster SHALL ship a Docker Compose stack as the official deployment target. The Helm chart in
the repository is unsupported. CI SHALL check the Compose stack nightly and on every pull request
that changes its inputs: the Compose install SHALL be made from the release archive the way a
self-hoster makes it and SHALL reach a healthy apiserver and a dashboard that answers. Every push
to main that carries a releasable conventional commit (feat, fix, perf, refactor, revert, or a
breaking change) SHALL be released automatically, and MUST NOT publish anything before the QA gate
passes on that commit. A release SHALL publish its npm packages, its images, and a GitHub release
with the install archive and its `SHA256SUMS`, the notes, the QA report and the release cards.

#### Scenario: Nightly on both targets
- **WHEN** the nightly pipeline runs
- **THEN** the release archive is installed with Docker Compose and the run fails unless the apiserver is healthy and the dashboard answers 200

#### Scenario: Merging releases
- **WHEN** a pull request whose squashed title is `feat: …` is merged into main and the QA gate passes on it
- **THEN** the next minor version is published to npm and Docker Hub, tagged, and released on GitHub as latest with a dark and a light release card attached

#### Scenario: Release gated
- **WHEN** the QA gate fails on the commit being released
- **THEN** no package, image or release is published

#### Scenario: Nothing releasable
- **WHEN** a merge carries only docs, chore, ci, test or style commits
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
- **WHEN** AppBridge config sets a provider credential to `secret://k8s/fonoster/deepgram#key`
- **THEN** AppBridge starts with the resolved value and never logs it

#### Scenario: Placeholder resolved from the container environment
- **WHEN** `appbridge.yaml` sets `encryption.key` to `"${ENCRYPTION_KEY}"` and Compose passes
  `ENCRYPTION_KEY` from `.env`
- **THEN** AppBridge decrypts workspace vendor keys the apiserver encrypted with the same key

#### Scenario: Unset placeholder
- **WHEN** a config value is `${VAR}`, `VAR` is unset or empty and no default is given
- **THEN** the service refuses to start, naming the variable and the key path, never a value

#### Scenario: Each container gets only its own values
- **WHEN** the self-host bundle starts
- **THEN** the Roomr node, appbridge and Autopilot containers hold none of the values only another
  service's file names (for example the apiserver's NATS password or the owner's password)
- **AND** only the apiserver container mounts `keys/private.pem`; AppBridge mounts `public.pem`
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
- **WHEN** AppBridge requests a workspace key and the region agent replies
- **THEN** a Roomr node subscribing to `_INBOX.>` or `_INBOX_appbridge.>` is refused and receives nothing
- **AND** AppBridge receives the reply

#### Scenario: Session registry still works
- **WHEN** services with prefixed inboxes put, get and watch session-registry entries
- **THEN** each succeeds within its own permissions

### Requirement: Every service is a plain container

Every Fonoster deployable (apiserver, AppBridge, Roomr node, Autopilot, dashboard) SHALL
be a single container image that needs only its config file, its ports and its dependencies'
addresses, so it can run on container platforms other than the official targets.

#### Scenario: Running with plain docker
- **WHEN** an operator runs AppBridge image with `docker run`, its config file mounted and NATS reachable
- **THEN** AppBridge starts, registers its health and accepts sessions

### Requirement: Deployments are closed by default

The Helm chart SHALL enable NATS users (`nats.auth.enabled: true`) by default and SHALL refuse to
render with auth off unless `nats.auth.allowUnauthenticated: true`. Envoy SHALL NOT allow every
origin with CORS: only the origins the deployment lists (Compose `CORS_ALLOWED_ORIGINS`, Helm
`envoy.corsAllowedOrigins`; none by default, the dashboard being same-origin). The Roomr node's
NATS user SHALL only write its session-registry entries (no gets, consumers or consumer deletes).
No signing or encryption key SHALL be committed; Identity SHALL refuse to start with a key that was
once published in the repository, or with the example's placeholder encryption key. The media
node's builder image SHALL be pinned to a patched Go release by digest. The Compose bundle SHALL
offer HTTPS without editing its files: `.env` adding `compose.tls.yaml` to `COMPOSE_FILE`, with
`TLS_CERT` and `TLS_KEY`, SHALL make Envoy serve TLS on 443 with those files (mounted read-only),
redirect 80 to HTTPS and stop publishing the plain HTTP port; without it the default install is
unchanged. `./init.sh` SHALL warn when `PUBLIC_URL` is `http://` on a host that is not loopback or
private.

#### Scenario: Helm install without NATS users
- **WHEN** the chart is rendered with `nats.auth.enabled=false` and no `allowUnauthenticated`
- **THEN** rendering fails with a message naming `nats.auth.allowUnauthenticated`

#### Scenario: Compose bundle over HTTPS
- **WHEN** `.env` has `COMPOSE_FILE=compose.yaml:compose.tls.yaml`, `TLS_CERT`, `TLS_KEY` and
  `PUBLIC_URL=https://voice.example.com`
- **THEN** Envoy listens with TLS on 443 using those files, answers 80 with a redirect to HTTPS,
  8449 is not published, and browser calls use `wss://voice.example.com/sip`

#### Scenario: Plain HTTP on a public address
- **WHEN** `./init.sh` runs with `PUBLIC_URL=http://203.0.113.10:8449`
- **THEN** it succeeds and warns that the dashboard and API go over plain HTTP, naming how to turn
  on HTTPS

#### Scenario: A copied development key
- **WHEN** Identity starts with the signing key formerly at `config/keys/private.pem`
- **THEN** it refuses to start and says to generate a key

### Requirement: Media paths are open between the node and AppBridge

The Helm chart SHALL expose AppBridge's control-stream port as a Service that the Roomr node uses
as its session endpoint, and SHALL ship a NetworkPolicy that allows the node's RTP to AppBridge and
TCP from the node to AppBridge's control port. Both targets SHALL document the node's RTP range
and the one-node-per-host or non-overlapping-ranges rule for host networking. Compose SHALL reach
the same result with its service names.

#### Scenario: Rendered chart
- **WHEN** the chart is rendered with its default values
- **THEN** the manifests contain an AppBridge Service with the control-stream port, a NetworkPolicy allowing node-to-appbridge RTP and control traffic, and the node's RTP range

#### Scenario: Audio under default deny
- **WHEN** the cluster applies a default-deny NetworkPolicy and the chart's policies
- **THEN** a call's RTP flows between the node pod and AppBridge pod in both directions

#### Scenario: Compose publishes only RTP
- **WHEN** the release archive is installed with Docker Compose
- **THEN** the node's RTP range is published on the host, its SIP and control ports are not, and AppBridge service name resolves from the node container

### Requirement: Network isolation guards Roomr's ports

Roomr SHALL NOT authenticate `Roomr` RPCs or check the source of SIP requests: network isolation
SHALL be the security boundary. Helm SHALL admit Roomr's control port only from the apiserver and
its SIP port only from the trusted SIP proxy, by NetworkPolicy when Roomr runs on the pod network
and by a documented host firewall when `hostNetwork` is true; Compose SHALL NOT publish the
control port or the SIP port on the host.

#### Scenario: Control port closed to other pods
- **WHEN** the chart is installed with Roomr on the pod network and a pod other than the apiserver connects to Roomr's control port
- **THEN** the connection is refused or times out

### Requirement: Rolling deploys drop no calls

The Helm chart SHALL give AppBridge and Roomr a `terminationGracePeriodSeconds` at least their
drain maximum wait (control-plane "AppBridge drains on SIGTERM", roomr "Draining is a health
signal with a bounded wait"), a readiness probe that fails while draining (the gRPC health check: Roomr's on its control
port, AppBridge's on its `Session` port), and a PodDisruptionBudget each. Neither gRPC server SHALL set a
maximum connection age.

#### Scenario: Rollout with live calls
- **WHEN** AppBridge and Roomr are rolled out to a new version while 20 calls are live
- **THEN** all 20 calls continue until their parties hang up and new calls land on the new pods

#### Scenario: Rendered drain settings
- **WHEN** the chart is rendered with `roomr.drainGraceSeconds: 3600` and `appbridge.drainGraceSeconds: 3600`
- **THEN** AppBridge and Roomr pods have `terminationGracePeriodSeconds` of at least 3600 and each has a PodDisruptionBudget

### Requirement: A playbook puts a host on a Fonoster version

Fonoster SHALL ship an Ansible playbook (`ops/ansible`) that puts a host on a given version from
the release archive, verified against its `SHA256SUMS`, with `.env`, overrides and overlays from the
inventory. Check mode SHALL be the plan; another version upgrades or rolls back. It MUST NOT print
an inventory secret, touch the database or rewrite persisted keys and TLS, and MUST fail before
changing the live install on a bad checksum, an unknown `.env` name or unpersisted keys.

#### Scenario: Plan then apply
- **WHEN** the operator plans and then applies a version on a fresh Ubuntu 24.04 host
- **THEN** the plan prints no secret and leaves the live install alone
- **AND** after the apply every service is running, the live install holds no example file, README or schema, and the dashboard and the API answer

#### Scenario: Another version
- **WHEN** the operator applies another version and then the first one again
- **THEN** the first version runs again, the deploy log records both switches, and `.env`, the keys and the TLS files are byte-identical to before

#### Scenario: A second apply changes nothing
- **WHEN** the playbook is applied again with the same version and inventory
- **THEN** it reports no change, and a change to one service's config file recreates only that service

### Requirement: Production deploys run the playbook

Production SHALL be deployed by `deploy.yaml` running the playbook the release ships, on the
host, with an inventory kept on the host outside every release, in two jobs: a plan that holds no
credential, then an apply in an environment that requires approval. The apply MUST run the archive
at the checksum the plan pinned and show the playbook's check before it changes anything. A failed apply SHALL restore the backup its switch
made. The database MUST NOT be touched.

#### Scenario: The plan holds no credential
- **WHEN** a release is deployed and the plan job runs
- **THEN** it has no secret, pins the archive's SHA256, and fails a version whose archive has no playbook

#### Scenario: The apply runs what the plan showed
- **WHEN** the release's archive changes after the plan and the apply is approved
- **THEN** the apply refuses an archive that does not match the plan's SHA256, and prints the playbook's `--check --diff` before applying

#### Scenario: A failed apply restores the last backup
- **WHEN** an apply switches to a new version and its smoke test fails
- **THEN** `rollback.yml` restores the previous install, its smoke test passes and `deploys.log` records `rolled back`

#### Scenario: Billing behind its overlay
- **WHEN** the inventory turns on `compose.billing.yaml` with Stripe's keys and wires `fonoster.yaml` and `appbridge.yaml` to billing
- **THEN** the plan prints no Stripe secret, billing runs healthy, Stripe's webhooks reach it through Envoy, and a call for an owner with no credits is refused

# deployment

## ADDED Requirements

### Requirement: Docker Compose and Helm are official targets

Fonoster SHALL ship a Docker Compose stack and a Helm chart as the two official deployment
targets. The end-to-end suite SHALL run nightly against both, and a release MUST NOT ship while
either nightly run is failing.

#### Scenario: Nightly on both targets
- **WHEN** the nightly pipeline runs
- **THEN** the end-to-end suite runs once on a Compose install and once on a Helm install
- **AND** the results of both are reported separately

#### Scenario: Release blocked
- **WHEN** the latest nightly e2e run on Helm failed
- **THEN** the release pipeline refuses to publish and names the failing target

### Requirement: One YAML config per Fonoster service, no .env

Each Fonoster service SHALL read exactly one YAML config file. Secrets SHALL appear inline or as
`secret://` references (D8). Fonoster services MUST NOT read configuration from a `.env` file.
Third-party containers keep their own configuration.

#### Scenario: Secret reference resolved
- **WHEN** the gateway config sets a provider credential to `secret://k8s/fonoster/deepgram#key`
- **THEN** the gateway starts with the resolved value and never logs it

#### Scenario: A .env file is ignored
- **WHEN** a `.env` file in the working directory sets a value that the service's YAML sets differently
- **THEN** the service uses the YAML value

### Requirement: Every service is a plain container

Every Fonoster deployable (apiserver, VoiceSessionGateway, media node, Autopilot, dashboard) SHALL
be a single container image that needs only its config file, its ports and its dependencies'
addresses, so it can run on container platforms other than the official targets.

#### Scenario: Running with plain docker
- **WHEN** an operator runs the gateway image with `docker run`, its config file mounted and NATS reachable
- **THEN** the gateway starts, registers its health and accepts sessions

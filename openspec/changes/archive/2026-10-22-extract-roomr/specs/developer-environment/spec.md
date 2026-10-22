## MODIFIED Requirements

### Requirement: The dev container is the only development path

The repository SHALL offer exactly one way to develop Fonoster: its dev container. Opening it
(VS Code Dev Containers, a Codespace or the devcontainer CLI) MUST need only Docker and a
dev-container client on the host, and MUST start the dependencies (Postgres, NATS, Routr,
RTPEngine, MinIO, Envoy, and the Roomr node, which is developed in fonoster/roomr) as containers
from the self-host bundle's service definitions. The components we develop here (apiserver,
appbridge, Autopilot, dashboard) MUST NOT run as containers in development.

#### Scenario: Open the dev container
- **WHEN** a contributor opens a fresh clone in the dev container
- **THEN** the dependency containers are running and healthy (NATS, Postgres and MinIO report
  healthy; Routr, RTPEngine, the Roomr node and Envoy are running) without any further command
- **AND** no container runs the apiserver, appbridge, Autopilot or dashboard

#### Scenario: Dependencies come from the bundle
- **WHEN** `docker compose -f .devcontainer/compose.yaml config` is rendered
- **THEN** each dependency's image is the one `ops/bundle/compose.yaml` names, the Roomr node's
  pinned by digest

#### Scenario: Old commands are gone
- **WHEN** a contributor looks for `npm run start:services`, `compose.dev.yaml` or
  `.env.example.dev`
- **THEN** none exists, and CONTRIBUTING.md describes only the dev container

## REMOVED Requirements

### Requirement: One reloading script per component
**Reason**: The Roomr node moved to fonoster/roomr; it is no longer built or run from source here.
**Migration**: See "One reloading script per component we develop"; the Roomr node is a dev container service.

### Requirement: Tests run inside the dev container
**Reason**: The Go tests moved to fonoster/roomr with the node.
**Migration**: See "Tests run inside the dev container without a Go toolchain".

## ADDED Requirements

### Requirement: One reloading script per component we develop

Each component SHALL have one script inside the workspace (`npm run dev:apiserver`,
`dev:appbridge`, `dev:autopilot`, `dev:dashboard`, `dev:fakes`) that runs one component from source with the dev config, and
`npm run dev` SHALL run all of them with each output line prefixed by the component's name. A
change to a component's source MUST restart (or hot-reload) that component only.

#### Scenario: Everything up
- **WHEN** `npm run dev` runs in the workspace
- **THEN** the dashboard answers at `http://localhost:<HTTP_PORT>` on the host, the owner can sign
  in with the login `fonoster-config info --dir .dev` prints, and the apiserver has applied its
  migrations

#### Scenario: A call reaches an agent
- **WHEN** `npm run dev` runs and a SIP call is placed through Routr to a number linked to an
  Autopilot app (or "Talk to agent" is used in the dashboard)
- **THEN** the Roomr node answers it and the caller hears the agent (fake providers by default)

#### Scenario: AppBridge reload
- **WHEN** a file under `mods/appbridge/src` is saved while `npm run dev` runs
- **THEN** AppBridge restarts and the other components keep running

#### Scenario: One component alone
- **WHEN** only `npm run dev:appbridge` runs
- **THEN** AppBridge starts with `.dev/config/appbridge.yaml` and the secrets from `.dev/.env`

### Requirement: Tests run inside the dev container without a Go toolchain

`npm test`, the database tests and the dashboard tests SHALL run inside the workspace without a
root `.env` and without extra setup: the workspace's environment MUST point
`CONFORMANCE_NATS_URL` at a NATS reserved for tests and `PERSISTENCE_TEST_DATABASE_URL` at a
database reserved for tests.

#### Scenario: Unit and conformance suites
- **WHEN** `npm test` runs in the workspace
- **THEN** the suites that need NATS use the test NATS, not the dev stack's

#### Scenario: Suites that need a Roomr node
- **WHEN** a suite starts a Roomr node (AppBridge's, the apiserver's placement suites)
- **THEN** the node runs in roomr-fake, the release binary of the pinned `@fonoster/roomr` that
  `npm install` downloaded (else its Docker image), with no Go toolchain in the workspace

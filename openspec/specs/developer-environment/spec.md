# developer-environment Specification

## Purpose
The dev container and scripts every contributor uses to build and run Fonoster.
## Requirements
### Requirement: The dev container is the only development path

The repository SHALL offer exactly one way to develop Fonoster: its dev container. Opening it
(VS Code Dev Containers, a Codespace or the devcontainer CLI) MUST need only Docker and a
dev-container client on the host, and MUST start the dependencies (Postgres, NATS, Routr,
RTPEngine, MinIO, Envoy) as containers from the self-host bundle's service definitions. The
components we develop (apiserver, gateway, Autopilot, media node, dashboard) MUST NOT run as
containers in development.

#### Scenario: Open the dev container
- **WHEN** a contributor opens a fresh clone in the dev container
- **THEN** the dependency containers are running and healthy (NATS, Postgres and MinIO report
  healthy; Routr, RTPEngine and Envoy are running) without any further command
- **AND** no container runs the apiserver, gateway, Autopilot, media node or dashboard

#### Scenario: Dependencies come from the bundle
- **WHEN** `docker compose -f .devcontainer/compose.yaml config` is rendered
- **THEN** each dependency's image is the one `ops/bundle/compose.yaml` names

#### Scenario: Old commands are gone
- **WHEN** a contributor looks for `npm run start:services`, `compose.dev.yaml` or
  `.env.example.dev`
- **THEN** none exists, and CONTRIBUTING.md describes only the dev container

### Requirement: Dev config generated once, secrets never committed

The dev config SHALL be produced by `fonoster-config init` in the git-ignored `.dev/` folder
(`.dev/.env` with generated secrets and the host address, `.dev/config/` with the service files and
keys) before the dependency containers start, plus a committed dev layer of YAML overlays.
Re-generating MUST keep every existing secret.

#### Scenario: First open
- **WHEN** the dev container is created and `.dev/` does not exist
- **THEN** `.dev/.env`, `.dev/config/*.yaml` and `.dev/config/keys/` exist and `git status` shows
  none of them

#### Scenario: Re-render keeps secrets
- **WHEN** `npm run dev:config` runs inside the workspace
- **THEN** every value in `.dev/.env` is unchanged and the service files are rendered again

### Requirement: One reloading script per component

Each component SHALL have one script inside the workspace (`npm run dev:apiserver`,
`dev:gateway`, `dev:autopilot`, `dev:medianode`, `dev:dashboard`, `dev:fakes`) that runs one component from source with the dev config, and
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
- **THEN** the media node answers it and the caller hears the agent (fake providers by default)

#### Scenario: Gateway reload
- **WHEN** a file under `mods/gateway/src` is saved while `npm run dev` runs
- **THEN** the gateway restarts and the other components keep running

#### Scenario: Media node rebuild
- **WHEN** a `.go` file under `go/medianode` is saved while `npm run dev:medianode` runs
- **THEN** the media node is rebuilt and restarted; a build error is printed and the previous
  process keeps running

#### Scenario: One component alone
- **WHEN** only `npm run dev:gateway` runs
- **THEN** the gateway starts with `.dev/config/gateway.yaml` and the secrets from `.dev/.env`

### Requirement: Tests run inside the dev container

`npm test`, the database tests, the dashboard tests and the Go tests SHALL run inside the workspace
without a root `.env` and without extra setup: the workspace's environment MUST point
`CONFORMANCE_NATS_URL` at a NATS reserved for tests and `PERSISTENCE_TEST_DATABASE_URL` at a
database reserved for tests.

#### Scenario: Unit and conformance suites
- **WHEN** `npm test` runs in the workspace
- **THEN** the suites that need NATS use the test NATS, not the dev stack's

#### Scenario: Go tests
- **WHEN** `GOTOOLCHAIN=local go test ./...` runs in `go/medianode`
- **THEN** it uses the image's Go 1.25 and the test NATS


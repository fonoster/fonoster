## MODIFIED Requirements

### Requirement: One reloading script per component

Each component SHALL have one script inside the workspace (`npm run dev:apiserver`,
`dev:appbridge`, `dev:autopilot`, `dev:roomr`, `dev:dashboard`, `dev:fakes`) that runs one component from source with the dev config, and
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

#### Scenario: Roomr node rebuild
- **WHEN** a `.go` file under `go/roomr` is saved while `npm run dev:roomr` runs
- **THEN** the Roomr node is rebuilt and restarted; a build error is printed and the previous
  process keeps running

#### Scenario: One component alone
- **WHEN** only `npm run dev:appbridge` runs
- **THEN** AppBridge starts with `.dev/config/appbridge.yaml` and the secrets from `.dev/.env`

### Requirement: Tests run inside the dev container

`npm test`, the database tests, the dashboard tests and the Go tests SHALL run inside the workspace
without a root `.env` and without extra setup: the workspace's environment MUST point
`CONFORMANCE_NATS_URL` at a NATS reserved for tests and `PERSISTENCE_TEST_DATABASE_URL` at a
database reserved for tests.

#### Scenario: Unit and conformance suites
- **WHEN** `npm test` runs in the workspace
- **THEN** the suites that need NATS use the test NATS, not the dev stack's

#### Scenario: Go tests
- **WHEN** `GOTOOLCHAIN=local go test ./...` runs in `go/roomr`
- **THEN** it uses the image's Go 1.25 and the test NATS

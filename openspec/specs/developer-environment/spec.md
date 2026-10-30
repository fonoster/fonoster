# developer-environment Specification

## Purpose
The dev container and scripts every contributor uses to build and run Fonoster.

## Requirements

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

### Requirement: Dev config generated once, secrets never committed

The dev config SHALL be produced in the git-ignored `.dev/` folder before the dependency containers
start: `.dev/config/` from the bundle's config files with the committed dev layer
(`.devcontainer/config/`) and the developer's `.dev/overlay/` deep-merged over them
(`ops/rebuild/merge-config.cjs`), then `ops/bundle/init.sh --dir .dev`, which writes `.dev/.env`
with generated secrets and the host address, the keys and the generated CA and server certificate
in `.dev/config/tls/`. Re-generating MUST keep every existing secret and the CA. The dev stack SHALL
serve the dashboard and API on `https://localhost` with that certificate, the same way an install
does, and the workspace's environment SHALL set `FONOSTER_CA_FILE` to `.dev/config/tls/ca.pem` so
the SDK, the CLI and the tests trust it without extra flags.

#### Scenario: First open
- **WHEN** the dev container is created and `.dev/` does not exist
- **THEN** `.dev/.env`, `.dev/config/*.yaml`, `.dev/config/keys/` and `.dev/config/tls/` exist and
  `git status` shows none of them

#### Scenario: Re-render keeps secrets
- **WHEN** `npm run dev:config` runs inside the workspace
- **THEN** every value in `.dev/.env` and the CA are unchanged, and the service files are the
  bundle's again with the dev layer and `.dev/overlay/` merged over them

#### Scenario: Dashboard over HTTPS
- **WHEN** a developer opens `https://localhost` after the dev stack starts and accepts the
  browser's certificate warning once
- **THEN** the dashboard loads and Talk to agent connects over `wss://localhost/sip`

#### Scenario: Tools trust the dev CA
- **WHEN** a developer runs the `fonoster` CLI or an SDK example against the dev stack inside the
  workspace
- **THEN** it connects over TLS without `--insecure` or `--ca-file`

### Requirement: The dev stack offers fake providers next to the real ones

The dev container SHALL add the fake provider to the catalog and leave every real provider as the
bundle configures it: no dev config may point a real provider's name at a fake, and no code path may
treat the dev container differently. A workspace is offered the fake provider and every real vendor,
and a new agent works with no vendor key because new agents prefer keyless providers.

#### Scenario: A fresh dev container needs no keys

- **WHEN** a fresh dev container runs `npm run dev`, the owner creates an agent and calls it
- **THEN** the agent was created with the fake models and voice
- **AND** the caller hears the agent through the fake STT, TTS and LLM

#### Scenario: A vendor key takes effect on the next call

- **WHEN** the owner stores a Deepgram key in the dashboard and switches the agent's voice and transcriber to Deepgram ones
- **THEN** the next call uses Deepgram, with no config edit or restart

### Requirement: One reloading script per component we develop

Each component SHALL have one script inside the workspace (`npm run dev:apiserver`,
`dev:appbridge`, `dev:autopilot`, `dev:dashboard`, `dev:fakes`) that runs one component from source with the dev config, and
`npm run dev` SHALL run all of them with each output line prefixed by the component's name. A
change to a component's source MUST restart (or hot-reload) that component only.

#### Scenario: Everything up
- **WHEN** `npm run dev` runs in the workspace
- **THEN** the dashboard answers at `http://localhost:<HTTP_PORT>` on the host, the owner can sign
  in with the login `npm run dev:info` prints, and the apiserver has applied its
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

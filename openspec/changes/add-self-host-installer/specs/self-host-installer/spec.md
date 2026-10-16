## ADDED Requirements

### Requirement: One archive per release

Each release SHALL produce `fonoster-<version>.tar.gz`, which unpacks into a `fonoster/` folder
holding `compose.yaml`, `.env.example` and `config/` with one example per config file. The
archive's `compose.yaml` MUST reference published images pinned to `<version>` and MUST NOT contain
`build:` sections, the fake providers, or the caller bot.

#### Scenario: Unpack with one line
- **WHEN** a self-hoster runs `curl -fsSL <archive-url> | tar xz` in an empty folder
- **THEN** a `fonoster/` folder exists with `compose.yaml`, `.env.example` and `config/`

#### Scenario: Images match the archive
- **WHEN** the archive for version `0.30.0` is unpacked
- **THEN** every Fonoster image in `compose.yaml` is tagged `0.30.0`

### Requirement: init prepares an install without prompts

`fonoster-config init`, run in the bundle folder, SHALL generate every secret and key the stack
needs, detect the host address, and write `config/*.yaml` from the examples and `.env` from
`.env.example`. It MUST NOT prompt, and MUST NOT need vendor keys, a repository checkout, `openssl`
or any tool except Node 22. Written files that hold secrets MUST be readable by the owner only,
except keys the containers read, which MUST be world-readable but not writable.

#### Scenario: Fresh folder
- **WHEN** `npx -p @fonoster/common fonoster-config init` runs in a freshly unpacked bundle
- **THEN** `.env`, the service YAMLs and the keys exist, and the command prints the next step
  (`docker compose up -d`)

#### Scenario: Host address override
- **WHEN** `init` runs with `--host-ip 203.0.113.10`
- **THEN** the SIP and media config advertise `203.0.113.10` instead of the detected address

#### Scenario: No address found
- **WHEN** no host address can be detected and `--host-ip` is not given
- **THEN** `init` exits non-zero and says to pass `--host-ip`

### Requirement: init is safe to run again

Running `init` again SHALL keep every existing secret and key, add only the ones missing, and
re-render the service YAMLs from the examples and the kept values. Edits the owner made to
`.env` MUST survive.

#### Scenario: Re-run keeps secrets
- **WHEN** `init` runs a second time in the same folder
- **THEN** the database password, encryption key and signing keys are byte-for-byte unchanged

#### Scenario: New secret after an upgrade
- **WHEN** a newer bundle's `.env.example` names a secret the existing `.env` lacks
- **THEN** `init` generates only that secret and appends it to `.env`

### Requirement: Start with plain Compose

After `init`, `docker compose up -d` in the bundle folder SHALL start the core voice path (NATS,
Postgres, Routr, RTPEngine, media node, gateway, MinIO), the apiserver with Identity, Envoy, the
dashboard and the hosted Autopilot, with no build step. Observability, analytics and regions MUST
be opt-in Compose profiles.

#### Scenario: Default start
- **WHEN** the owner runs `docker compose up -d` after `init`
- **THEN** the dashboard answers on the configured port and the owner can sign in with the login
  `info` prints

#### Scenario: Opt-in observability
- **WHEN** the owner runs `docker compose --profile observability up -d`
- **THEN** the collector, Prometheus, Loki, Tempo and Grafana start next to the default services

### Requirement: Provider catalog on boot

The apiserver SHALL apply the provider catalog file named in its config on every start. The apply
MUST be idempotent and MUST NOT remove entries an operator added.

#### Scenario: First boot
- **WHEN** the apiserver starts on an empty database
- **THEN** the catalog's providers, models and voices are listed by the dashboard's provider pickers

#### Scenario: Restart
- **WHEN** the apiserver restarts with the same catalog
- **THEN** no catalog rows change

### Requirement: No vendor keys at install

A fresh install SHALL start and let the owner sign in without any speech or LLM vendor key. Vendor
keys MUST be addable per workspace in the dashboard after install.

#### Scenario: Add a key after install
- **WHEN** the owner signs in to a fresh install and saves a Deepgram key in a workspace
- **THEN** that workspace's apps can use Deepgram voices and models

### Requirement: info shows how to reach the install

`fonoster-config info` SHALL print the dashboard URL, the owner email and password, the SIP
address and port, and the paths of `.env`, `config/` and the keys. It MUST read only local files.

#### Scenario: After init
- **WHEN** the owner runs `fonoster-config info` in the bundle folder after `init`
- **THEN** the dashboard URL, owner login and SIP address are printed

#### Scenario: Before init
- **WHEN** `info` runs in a folder where `init` has not run
- **THEN** it exits non-zero and says to run `init` first

### Requirement: check validates config before start

`fonoster-config check` SHALL validate each service YAML in `config/` against that service's
config schema (unknown keys, missing required values, malformed or unresolvable `secret://`
references) and report every problem with its file and key path. It MUST exit non-zero when any
problem is found.

#### Scenario: Valid config
- **WHEN** `check` runs right after `init`
- **THEN** it reports each service as valid and exits zero

#### Scenario: Typo in a key
- **WHEN** `config/gateway.yaml` contains an unknown key `turnTakng`
- **THEN** `check` names `config/gateway.yaml` and `turnTakng`, suggests `turnTaking`, and exits
  non-zero

### Requirement: Local bundle build

`ops/release/bundle` SHALL build every Fonoster image tagged with the version, the archive, and an
`npm pack` tarball of `@fonoster/common`, into one output folder, so an install can be done from
local files with the same commands the docs show (the npm package given as a tarball path).

#### Scenario: Install from local files
- **WHEN** the owner runs `ops/release/bundle` and then installs from its output folder
- **THEN** `init`, `docker compose up -d` and sign-in succeed without network access to a
  registry for Fonoster images

### Requirement: No rebuild naming in user-facing files and output

The archive's files and the output of `init`, `info` and `check` MUST NOT contain the word
"rebuild" or the `RB_` prefix.

#### Scenario: Bundle scan
- **WHEN** the archive's files and the three commands' output are searched for `rebuild` and `RB_`
- **THEN** there are no matches

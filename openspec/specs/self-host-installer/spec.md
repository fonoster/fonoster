# self-host-installer Specification

## Purpose
The self-host bundle and the `fonoster-config` commands that install and check it.

## Requirements

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
needs, detect the host address, and write `.env` from `.env.example` and `config/*.yaml` from the
examples. Secrets and other `.env` values MUST stay `${NAME}` placeholders in `config/*.yaml`;
only `#@if` blocks are applied. It MUST NOT prompt, and MUST NOT need vendor keys, a repository
checkout, `openssl` or any tool except Node 22. Written files that hold secrets MUST be readable by
the owner only, except keys the containers read, which MUST be world-readable but not writable.

#### Scenario: Fresh folder
- **WHEN** `npx -p @fonoster/common fonoster-config init` runs in a freshly unpacked bundle
- **THEN** `.env`, the service YAMLs and the keys exist, and the command prints the next step
  (`docker compose up -d`)

#### Scenario: No secret in the service YAMLs
- **WHEN** `init` has run
- **THEN** no generated secret from `.env` appears in any `config/*.yaml`

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
Postgres, Routr, RTPEngine, Roomr node, appbridge, MinIO), the apiserver with Identity, Envoy, the
dashboard and the hosted Autopilot, with no build step. Envoy SHALL serve the dashboard and API over
HTTPS on 443 with the generated or the owner's certificate, and redirect 80 to it; plain HTTP on
`HTTP_PORT` MUST be published only when the owner turns HTTPS off. The bundle MUST have no opt-in
Compose profiles: hosting private regions is a manual addition (`fonoster-region-hub-setup` in the
apiserver image), and telemetry and call metrics go to the owner's own collector and ClickHouse
through config keys.

#### Scenario: Default start
- **WHEN** the owner runs `docker compose up -d` after `init`
- **THEN** the dashboard answers on `https://<host>` (443), `http://<host>` redirects to it, and
  the owner can sign in with the login `info` prints

#### Scenario: HTTPS turned off
- **WHEN** the owner turns HTTPS off in `.env` (to put their own TLS proxy in front) and runs
  `init` and `docker compose up -d`
- **THEN** the dashboard answers on plain HTTP on `HTTP_PORT` and nothing listens on 443

#### Scenario: Telemetry to an existing collector
- **WHEN** the owner sets `OTEL_EXPORTER_OTLP_ENDPOINT` in `.env` and recreates the containers
- **THEN** every Fonoster service exports OTLP to that endpoint

### Requirement: Provider catalog on boot

The apiserver SHALL apply the provider catalog files named in its config on every start:
`catalog.file`, then each of `catalog.files` in order. The apply MUST be idempotent and MUST NOT
remove entries an operator added.

#### Scenario: First boot
- **WHEN** the apiserver starts on an empty database
- **THEN** the catalog's providers, models and voices are listed by the dashboard's provider pickers

#### Scenario: Restart
- **WHEN** the apiserver restarts with the same catalog
- **THEN** no catalog rows change

#### Scenario: More than one catalog file
- **WHEN** the config names `catalog.file` and `catalog.files: [extra.yaml]`
- **THEN** the entries of both files are in the registry, and a file that cannot be applied stops the apiserver

### Requirement: No vendor keys at install

A fresh install SHALL start and let the owner sign in without any speech or LLM vendor key. The
bundle's `appbridge.yaml` and `autopilot.yaml` SHALL carry a platform key placeholder for every vendor
in the bundle's catalog, for the operator to replace. Vendor keys MUST also be addable per workspace
in the dashboard after install.

#### Scenario: Add a key after install
- **WHEN** the owner signs in to a fresh install and saves a Deepgram key in a workspace
- **THEN** that workspace's apps can use Deepgram voices and models

### Requirement: info shows how to reach the install

`fonoster-config info` SHALL print the dashboard URL, the owner email and password, the SIP
address and port, and the paths of `.env`, `config/` and the keys. When the generated certificate
is in use, it SHALL also print the path of `ca.pem`, say that browsers show a warning once and API
clients need `--ca-file`, and say to use a real certificate before going live. It MUST read only
local files.

#### Scenario: After init
- **WHEN** the owner runs `fonoster-config info` in the bundle folder after `init`
- **THEN** the dashboard URL (`https://`), owner login and SIP address are printed

#### Scenario: Generated certificate in use
- **WHEN** `info` runs on an install that uses the generated certificate
- **THEN** it prints the `ca.pem` path and the getting-started notice

#### Scenario: Owner's certificate in use
- **WHEN** `info` runs on an install with `TLS_CERT` and `TLS_KEY` set
- **THEN** it prints no getting-started notice

#### Scenario: Before init
- **WHEN** `info` runs in a folder where `init` has not run
- **THEN** it exits non-zero and says to run `init` first

### Requirement: check validates config before start

`fonoster-config check` SHALL resolve each service YAML's `${NAME}` placeholders from `.env`, then
validate it against that service's config schema (unknown keys, missing required values, malformed
or unresolvable `secret://` references) and report every problem with its file and key path. It
MUST exit non-zero when any problem is found.

#### Scenario: Valid config
- **WHEN** `check` runs right after `init`
- **THEN** it reports each service as valid and exits zero

#### Scenario: Unset placeholder
- **WHEN** `config/appbridge.yaml` references `${ENCRYPTION_KEY}` and `.env` has no value for it
- **THEN** `check` names `config/appbridge.yaml`, the key path and `ENCRYPTION_KEY`, and exits
  non-zero

#### Scenario: Typo in a key
- **WHEN** `config/appbridge.yaml` contains an unknown key `turnTakng`
- **THEN** `check` names `config/appbridge.yaml` and `turnTakng`, suggests `turnTaking`, and exits
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

### Requirement: init generates a certificate for getting started

When `.env` sets neither `TLS_CERT` nor `TLS_KEY`, `init` SHALL generate, in `config/tls/`, a local
certificate authority (`ca.pem`, `ca-key.pem`) and a server certificate signed by it (`server.pem`,
`server-key.pem`) covering `localhost`, `127.0.0.1`, `HOST_IP` and the host of `PUBLIC_URL`. The
private keys MUST be readable by the owner only. Generating them MUST NOT need `openssl` or any tool
except Node 22.

#### Scenario: Fresh install
- **WHEN** `init` runs in a freshly unpacked bundle
- **THEN** `config/tls/` holds the CA and a server certificate whose names include `localhost`,
  `127.0.0.1` and the detected host address, and the private keys are mode 0600

#### Scenario: Not in the archive
- **WHEN** the release archive is built
- **THEN** it contains no `config/tls/` files

### Requirement: init keeps the generated CA

Running `init` again SHALL keep the generated CA byte for byte, and SHALL reissue the server
certificate only when one of its names changed or it expires within 30 days.

#### Scenario: Re-run keeps the CA
- **WHEN** `init` runs again with the same names
- **THEN** every file in `config/tls/` is byte-for-byte unchanged

#### Scenario: New host name
- **WHEN** the owner changes `PUBLIC_URL` to `https://voice.example.com` and runs `init` again
- **THEN** the server certificate is reissued with `voice.example.com` added, and `ca.pem` is
  unchanged

### Requirement: The owner's certificate replaces the generated one

When `.env` sets `TLS_CERT` and `TLS_KEY`, `init` SHALL configure Envoy with those files and
generate nothing.

#### Scenario: Owner's certificate
- **WHEN** `.env` sets `TLS_CERT` and `TLS_KEY` to existing files
- **THEN** `init` creates nothing in `config/tls/` and Envoy is configured with the owner's files

## MODIFIED Requirements

### Requirement: One archive per release

Each release SHALL produce `fonoster-<version>.tar.gz`, which unpacks into a `fonoster/` folder
holding `init.sh`, the Compose files, `config/` with the final file of every service, and
`ansible/` (the playbook, with no inventory). The archive's `compose.yaml` MUST reference published
images pinned to `<version>` and MUST NOT contain `build:` sections, the fake providers, or the
caller bot. It MUST NOT contain `.env`, `config/keys`, `config/tls`, example files or schemas.

#### Scenario: Unpack with one line
- **WHEN** a self-hoster runs `curl -fsSL <archive-url> | tar xz` in an empty folder
- **THEN** a `fonoster/` folder exists with `init.sh`, `compose.yaml` and `config/`

#### Scenario: Images match the archive
- **WHEN** the archive for version `0.30.0` is unpacked and `./init.sh` runs
- **THEN** every Fonoster image in `compose.yaml` resolves to `0.30.0`

### Requirement: init prepares an install without prompts

`./init.sh`, run in the install folder, SHALL write `.env` with every secret the stack needs, the
signing keys and the host address (detected, or `--host-ip`), and SHALL set `SIP_PORT` in the tcp
and udp entries of `config/routr-edgeport.yaml`. It MUST NOT prompt, MUST NOT need vendor keys,
Node.js, Docker or a repository checkout, and MUST need only a POSIX shell and `openssl`. It MUST
NOT write any other file in `config/` and MUST NOT print a secret value. Files that hold secrets
MUST be readable by the owner only, except keys the containers read, which MUST be world-readable
but not writable.

#### Scenario: Fresh folder
- **WHEN** `./init.sh` runs in a freshly unpacked archive
- **THEN** `.env` (0600) and the keys exist, and it prints the dashboard URL, the owner email, where
  the password is, and the next step (`docker compose up -d`)

#### Scenario: No secret in the service YAMLs
- **WHEN** `./init.sh` has run
- **THEN** no generated secret from `.env` appears in any `config/*.yaml` or in its output

#### Scenario: Host address override
- **WHEN** `./init.sh` runs with `--host-ip 203.0.113.10`
- **THEN** `HOST_IP` in `.env` is `203.0.113.10`

#### Scenario: No address found
- **WHEN** no host address can be detected and `--host-ip` is not given
- **THEN** `./init.sh` exits 1 and says to pass `--host-ip`

### Requirement: init is safe to run again

Running `./init.sh` again SHALL keep every existing value, key, certificate and config file, fill
only empty secret lines, append only the names a newer release adds, and move `FONOSTER_VERSION`
to its own release.

#### Scenario: Re-run keeps secrets
- **WHEN** `./init.sh` runs a second time in the same folder
- **THEN** `.env`, the keys and the certificates are byte-for-byte unchanged

#### Scenario: New secret after an upgrade
- **WHEN** a newer release's `init.sh` names a secret the existing `.env` lacks
- **THEN** it generates only that secret, appends it to `.env` and names it

### Requirement: Local bundle build

`ops/release/bundle` SHALL build every Fonoster image tagged with the version, the archive and its
`SHA256SUMS` into one output folder, so an install can be done from local files with the same
commands the docs show.

#### Scenario: Install from local files
- **WHEN** the owner runs `ops/release/bundle` and then installs from its output folder
- **THEN** `./init.sh`, `docker compose up -d` and sign-in succeed without network access to a
  registry for Fonoster images

### Requirement: No rebuild naming in user-facing files and output

The archive's files and the output of `./init.sh` MUST NOT contain the word "rebuild" or the `RB_`
prefix.

#### Scenario: Bundle scan
- **WHEN** the archive's files and the output of `./init.sh` are searched for `rebuild` and `RB_`
- **THEN** there are no matches

### Requirement: init generates a certificate for getting started

When `.env` sets neither `TLS_CERT` nor `TLS_KEY`, `./init.sh` SHALL generate, in `config/tls/`, a
local certificate authority (`ca.pem`, `ca-key.pem`) and a server certificate signed by it
(`server.pem`, `server-key.pem`) covering `localhost`, `127.0.0.1`, `HOST_IP` and the host of
`PUBLIC_URL`. The CA key MUST be readable by the owner only.

#### Scenario: Fresh install
- **WHEN** `./init.sh` runs in a freshly unpacked archive
- **THEN** `config/tls/` holds the CA and a server certificate whose names include `localhost`,
  `127.0.0.1` and the host address, and `openssl verify` accepts it against `ca.pem`

#### Scenario: Not in the archive
- **WHEN** the release archive is built
- **THEN** it contains no `config/tls/` files

### Requirement: init keeps the generated CA

Running `./init.sh` again SHALL keep the generated CA byte for byte, and SHALL reissue the server
certificate only when one of its names changed or it expires within 30 days.

#### Scenario: Re-run keeps the CA
- **WHEN** `./init.sh` runs again with the same names
- **THEN** every file in `config/tls/` is byte-for-byte unchanged

#### Scenario: New host name
- **WHEN** the owner changes the host address and runs `./init.sh` again
- **THEN** the server certificate is reissued with the new address, and `ca.pem` is unchanged

### Requirement: The owner's certificate replaces the generated one

When `.env` sets `TLS_CERT` and `TLS_KEY`, `./init.sh` SHALL generate nothing in `config/tls/` and
Envoy SHALL serve the owner's files.

#### Scenario: Owner's certificate
- **WHEN** `.env` sets `TLS_CERT` and `TLS_KEY` to existing files
- **THEN** `./init.sh` creates nothing in `config/tls/` and Envoy is configured with the owner's files

## REMOVED Requirements

### Requirement: info shows how to reach the install

**Reason**: `fonoster-config` is gone; `./init.sh` prints the same summary on every run, naming
where the owner password is instead of printing it.
**Migration**: Run `./init.sh` again; `grep OWNER_PASSWORD .env` for the password.

### Requirement: check validates config before start

**Reason**: `fonoster-config` is gone; each service validates its own file at start and stops,
naming the key, when it is wrong.
**Migration**: `docker compose up -d`, then `docker compose logs <service>`.

## ADDED Requirements

### Requirement: An install upgrades in place

A Compose install SHALL upgrade by unpacking the new archive next to it, copying `.env`,
`config/keys`, `config/tls` and the config files the operator edited into it, running `./init.sh`
and `docker compose up -d` with the same `COMPOSE_PROJECT_NAME`. Every secret, key, certificate and
edited file MUST be the one that runs after.

#### Scenario: Secrets, keys and edited files survive
- **WHEN** an install of the previous release with an edited `config/fonoster.yaml` is upgraded
  with those commands
- **THEN** `.env` keeps every line but `FONOSTER_VERSION`, the keys and certificates are byte-for-byte
  unchanged, the API server runs the edited file and the dashboard answers

#### Scenario: The SIP port survives
- **WHEN** the previous install set `SIP_PORT=15060`
- **THEN** after the upgrade `config/routr-edgeport.yaml` listens on 15060

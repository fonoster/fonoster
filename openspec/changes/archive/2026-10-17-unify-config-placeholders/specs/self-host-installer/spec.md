## MODIFIED Requirements

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

### Requirement: Start with plain Compose

After `init`, `docker compose up -d` in the bundle folder SHALL start the core voice path (NATS,
Postgres, Routr, RTPEngine, media node, gateway, MinIO), the apiserver with Identity, Envoy, the
dashboard and the hosted Autopilot, with no build step. The bundle MUST have no opt-in Compose
profiles: hosting private regions is a manual addition (`fonoster-region-hub-setup` in the
apiserver image), and telemetry and call metrics go to the owner's own collector and ClickHouse
through config keys.

#### Scenario: Default start
- **WHEN** the owner runs `docker compose up -d` after `init`
- **THEN** the dashboard answers on the configured port and the owner can sign in with the login
  `info` prints

#### Scenario: Telemetry to an existing collector
- **WHEN** the owner sets `OTEL_EXPORTER_OTLP_ENDPOINT` in `.env` and recreates the containers
- **THEN** every Fonoster service exports OTLP to that endpoint

### Requirement: check validates config before start

`fonoster-config check` SHALL resolve each service YAML's `${NAME}` placeholders from `.env`, then
validate it against that service's config schema (unknown keys, missing required values, malformed
or unresolvable `secret://` references) and report every problem with its file and key path. It
MUST exit non-zero when any problem is found.

#### Scenario: Valid config
- **WHEN** `check` runs right after `init`
- **THEN** it reports each service as valid and exits zero

#### Scenario: Unset placeholder
- **WHEN** `config/gateway.yaml` references `${ENCRYPTION_KEY}` and `.env` has no value for it
- **THEN** `check` names `config/gateway.yaml`, the key path and `ENCRYPTION_KEY`, and exits
  non-zero

#### Scenario: Typo in a key
- **WHEN** `config/gateway.yaml` contains an unknown key `turnTakng`
- **THEN** `check` names `config/gateway.yaml` and `turnTakng`, suggests `turnTaking`, and exits
  non-zero

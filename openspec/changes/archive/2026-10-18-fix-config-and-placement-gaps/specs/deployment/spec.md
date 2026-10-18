## MODIFIED Requirements

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
- **WHEN** the gateway config sets a provider credential to `secret://k8s/fonoster/deepgram#key`
- **THEN** the gateway starts with the resolved value and never logs it

#### Scenario: Placeholder resolved from the container environment
- **WHEN** `gateway.yaml` sets `encryption.key` to `"${ENCRYPTION_KEY}"` and Compose passes
  `ENCRYPTION_KEY` from `.env`
- **THEN** the gateway decrypts workspace vendor keys the apiserver encrypted with the same key

#### Scenario: Unset placeholder
- **WHEN** a config value is `${VAR}`, `VAR` is unset or empty and no default is given
- **THEN** the service refuses to start, naming the variable and the key path, never a value

#### Scenario: Each container gets only its own values
- **WHEN** the self-host bundle starts
- **THEN** the media node, gateway and Autopilot containers hold none of the values only another
  service's file names (for example the apiserver's NATS password or the owner's password)
- **AND** only the apiserver container mounts `keys/private.pem`; the gateway mounts `public.pem`
  and its call-record key

#### Scenario: A .env file is ignored
- **WHEN** a `.env` file in the working directory sets a value that the service's YAML sets differently
- **THEN** the service uses the YAML value

#### Scenario: Development mode reads no .env either
- **WHEN** a service starts with `NODE_ENV=development` and a `.env` file exists in the repository
- **THEN** the service does not load it

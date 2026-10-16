## MODIFIED Requirements

### Requirement: Each Fonoster service reads one config file

The apiserver SHALL read its configuration from one `fonoster` file, Autopilot from one
`autopilot` file, the gateway from one `gateway` file and the media node from one `medianode`
file. None SHALL read environment variables of its own; values are taken from the file only,
except values the file explicitly references with `${VAR}`.

#### Scenario: Explicit path

- WHEN the apiserver starts with `--config /etc/fonoster/fonoster.yaml`
- THEN it loads that file and no other

#### Scenario: Default locations

- WHEN no `--config` is given
- THEN the service looks for `/config/<base>`, then `/opt/fonoster/<base>` and then
  `./config/<base>` with extension `.yaml`, `.yml`, `.json` or `.jsonc`, and loads the first
  directory that has one

#### Scenario: No file found

- WHEN no file exists in any default location
- THEN the service logs a warning naming the locations it tried
- AND starts with the schema defaults, which are the Community values

#### Scenario: Two files for the same service

- WHEN `fonoster.yaml` and `fonoster.jsonc` exist in the same directory
- THEN the service refuses to start and names both files

### Requirement: `${VAR}` only resolves shared values

The loader SHALL substitute `${VAR}` and `${VAR:-default}` in any string value of the file, so
secrets can stay in `.env` and reach the service through its container environment. A service MAY
still restrict substitution to declared key paths, and then SHALL reject `${…}` anywhere else.

#### Scenario: Shared database password

- WHEN `database.url` is `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/fonoster`
- AND both variables are set
- THEN the loaded URL contains their values

#### Scenario: Missing shared value

- WHEN a referenced variable is unset and has no default
- THEN the service refuses to start, naming the variable and the key path

#### Scenario: Secret as a placeholder

- WHEN `smtp.password` is `${SMTP_PASSWORD}` and `SMTP_PASSWORD` is set
- THEN the loaded password is its value

#### Scenario: Default for an optional value

- WHEN `telemetry.otlpEndpoint` is `${OTEL_EXPORTER_OTLP_ENDPOINT:-}` and the variable is unset
- THEN the value is empty and telemetry stays off

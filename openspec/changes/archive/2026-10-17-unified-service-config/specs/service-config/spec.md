# service-config

## ADDED Requirements

### Requirement: Each Fonoster service reads one config file

The apiserver SHALL read its configuration from one `fonoster` file and Autopilot from one
`autopilot` file. Neither SHALL read environment variables of its own; values are taken from the
file only, except values the file explicitly references with `${VAR}`.

#### Scenario: Explicit path

- WHEN the apiserver starts with `--config /etc/fonoster/fonoster.yaml`
- THEN it loads that file and no other

#### Scenario: Default locations

- WHEN no `--config` is given
- THEN the service looks for `/opt/fonoster/<base>` and then `./config/<base>` with extension
  `.yaml`, `.yml`, `.json` or `.jsonc`, and loads the first directory that has one

#### Scenario: No file found

- WHEN no file exists in any default location
- THEN the service logs a warning naming the locations it tried
- AND starts with the schema defaults, which are the Community values

#### Scenario: Two files for the same service

- WHEN `fonoster.yaml` and `fonoster.jsonc` exist in the same directory
- THEN the service refuses to start and names both files

### Requirement: YAML and JSON with comments are both accepted

The loader SHALL parse `.yaml`/`.yml` as YAML and `.json`/`.jsonc` as JSON with comments and
trailing commas, and SHALL validate both through the same schema.

#### Scenario: JSONC with comments

- WHEN `fonoster.jsonc` contains `// comments` and a trailing comma
- THEN it loads and produces the same configuration as the equivalent YAML

#### Scenario: Malformed file

- WHEN the file cannot be parsed
- THEN the service refuses to start with the file path and the line and column of the error

### Requirement: Configuration is validated strictly

The loader SHALL reject unknown keys and invalid values with the full key path, and SHALL point
moved keys to their new location.

#### Scenario: Misspelled key

- WHEN `smtp.hsot` is present
- THEN the service refuses to start with `smtp: unknown key "hsot"`

#### Scenario: Moved key

- WHEN a key listed in the moved-keys table is present, such as `encryptionKey`
- THEN the error says the key moved and names `encryption.key`

#### Scenario: Legacy environment variables

- WHEN `APISERVER_*` or `AUTOPILOT_*` variables are set in the service's environment
- THEN the service logs one warning listing their names, never their values
- AND ignores them

### Requirement: `${VAR}` only resolves shared values

The loader SHALL substitute `${VAR}` and `${VAR:-default}` only at key paths the service declares
as shared with third-party containers, and SHALL reject `${…}` anywhere else.

#### Scenario: Shared database password

- WHEN `database.url` is `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/fonoster`
- AND both variables are set
- THEN the loaded URL contains their values

#### Scenario: Missing shared value

- WHEN a referenced variable is unset and has no default
- THEN the service refuses to start, naming the variable and the key path

#### Scenario: Interpolation outside the allow-list

- WHEN `smtp.password` is `${SMTP_PASSWORD}`
- THEN the service refuses to start, saying `${…}` is only allowed for values shared with other
  containers

### Requirement: Features replace editions

The apiserver configuration SHALL include a `features` section (auth methods, sign-up policy,
billing, cost display, call data storage) whose defaults are the Community values, and code SHALL
decide behavior from features, never from an edition flag.

#### Scenario: Defaults

- WHEN `features` is omitted
- THEN `features.auth.methods` is `[password]`, `features.auth.signup` is `invite`,
  `features.billing.enabled` is `false` and `features.costs.display` is `usage`

#### Scenario: Billing requires authorization service

- WHEN `features.billing.enabled` is `true` and `authz.enabled` is `false`
- THEN the service refuses to start, naming both keys

### Requirement: The logger is configured from the file

Services SHALL configure the shared logger from their file's `logs` section before serving, and
loggers created earlier SHALL adopt that configuration.

#### Scenario: Logger created at import time

- WHEN a module creates a logger before the service configures logging
- AND the file sets `logs.level: debug`
- THEN that logger emits debug messages after configuration

### Requirement: Embedded and standalone Identity share one schema

The `identity:` section of `fonoster.yaml` SHALL use the same field schemas as standalone Identity,
and both SHALL produce the same defaults. Standalone Identity SHALL keep `identity.json`'s shape,
with its fields at the root of the file, since services outside Fonoster depend on it.

#### Scenario: Standalone file shape

- WHEN standalone Identity starts with `identity.json` holding `issuer`, `keys`, `encryptionKey`,
  `invite` and `defaultUser` at the root
- THEN it starts, and unknown keys fail validation like any other config file

#### Scenario: Same defaults

- WHEN `identity.tokens` is omitted in either deployment
- THEN the refresh token lifetime is 24h and invites expire after 1d

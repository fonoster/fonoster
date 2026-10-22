## MODIFIED Requirements

### Requirement: Each Fonoster service reads one config file

The apiserver SHALL read its configuration from one `fonoster` file, Autopilot from one
`autopilot` file, AppBridge from one `appbridge` file and the Roomr node from one `roomr`
file. None SHALL read environment variables of its own; values are taken from the file only,
except values the file explicitly references with `${VAR}`. The Roomr node SHALL take no
command-line flag other than `-config <path>`; every other setting lives in its file, where
`${VAR}` and `secret://` references still work.

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

#### Scenario: The Roomr node is configured by its file only
- WHEN the Roomr node starts with `-config /etc/roomr/roomr.yaml` and any other setting is needed
- THEN it reads that setting from the file and no other flag exists

#### Scenario: Autopilot ignores the apiserver's database variable
- WHEN Autopilot's config has no database URL and `APISERVER_DATABASE_URL` is set
- THEN Autopilot does not use it

#### Scenario: The Roomr node ignores deprecated variables
- WHEN the Roomr node's config omits a value and the matching `ROOMR_*` variable is set
- THEN the Roomr node uses the schema default, not the variable

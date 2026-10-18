## MODIFIED Requirements

### Requirement: Each Fonoster service reads one config file

The apiserver SHALL read its configuration from one `fonoster` file, Autopilot from one
`autopilot` file, the gateway from one `gateway` file and the media node from one `roomr`
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

#### Scenario: Autopilot ignores the apiserver's database variable
- WHEN Autopilot's config has no database URL and `APISERVER_DATABASE_URL` is set
- THEN Autopilot does not use it

#### Scenario: The media node ignores deprecated variables
- WHEN the media node's config omits a value and the matching `ROOMR_*` variable is set
- THEN the media node uses the schema default, not the variable

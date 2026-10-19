## MODIFIED Requirements

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

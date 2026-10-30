## ADDED Requirements

### Requirement: Production deploys run the playbook

Production SHALL be deployed by `deploy.yaml` running the playbook of the release's own tag
against a private inventory, in two jobs: a plan that holds no credential able to change
production, then an apply in an environment that requires approval. The apply MUST run the tag,
inventory and archive checksum the plan pinned. A failed apply SHALL restore the backup its switch
made. The database MUST NOT be touched.

#### Scenario: The plan holds no credential
- **WHEN** a release is deployed and the plan job runs
- **THEN** it has no SSH key and no vault password, prints `.env`, overrides and overlays with vaulted values redacted, and fails naming any secret-named value in `fonoster_env`

#### Scenario: The apply runs what the plan showed
- **WHEN** the tag or the inventory moves after the plan and the apply is approved
- **THEN** the apply runs the tag SHA, the inventory SHA and the archive checksum the plan pinned

#### Scenario: A failed apply restores the last backup
- **WHEN** an apply switches to a new version and its smoke test fails
- **THEN** `rollback.yml` restores the previous install, its smoke test passes and `deploys.log` records `rolled back`

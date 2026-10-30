## ADDED Requirements

### Requirement: Production deploys run the playbook

Production SHALL be deployed by `deploy.yaml` running the playbook the release ships, on the
host, with an inventory kept on the host outside every release, in two jobs: a plan that holds no
credential, then an apply in an environment that requires approval. The apply MUST run the archive
at the checksum the plan pinned and show the playbook's check before it changes anything. A failed apply SHALL restore the backup its switch
made. The database MUST NOT be touched.

#### Scenario: The plan holds no credential
- **WHEN** a release is deployed and the plan job runs
- **THEN** it has no secret, pins the archive's SHA256, and fails a version whose archive has no playbook

#### Scenario: The apply runs what the plan showed
- **WHEN** the release's archive changes after the plan and the apply is approved
- **THEN** the apply refuses an archive that does not match the plan's SHA256, and prints the playbook's `--check --diff` before applying

#### Scenario: A failed apply restores the last backup
- **WHEN** an apply switches to a new version and its smoke test fails
- **THEN** `rollback.yml` restores the previous install, its smoke test passes and `deploys.log` records `rolled back`

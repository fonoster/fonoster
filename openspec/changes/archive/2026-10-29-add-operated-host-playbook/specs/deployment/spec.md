## ADDED Requirements

### Requirement: A playbook puts a host on a Fonoster version

Fonoster SHALL ship an Ansible playbook (`ops/ansible`) that puts a host on a given version from
the release archive, verified against its `SHA256SUMS`, with `.env`, overrides and overlays from the
inventory. Check mode SHALL be the plan; another version upgrades or rolls back. It MUST NOT print
an inventory secret, touch the database or rewrite persisted keys and TLS, and MUST fail before
changing the live install on a bad checksum, an unknown `.env` name or unpersisted keys.

#### Scenario: Plan then apply
- **WHEN** the operator plans and then applies a version on a fresh Ubuntu 24.04 host
- **THEN** the plan prints no secret and leaves the live install alone
- **AND** after the apply every service is running, the live install holds no example file, README or schema, and the dashboard and the API answer

#### Scenario: Another version
- **WHEN** the operator applies another version and then the first one again
- **THEN** the first version runs again, the deploy log records both switches, and `.env`, the keys and the TLS files are byte-identical to before

#### Scenario: A second apply changes nothing
- **WHEN** the playbook is applied again with the same version and inventory
- **THEN** it reports no change, and a change to one service's config file recreates only that service

## RENAMED Requirements

- FROM: `### Requirement: Docker Compose and Helm are official targets`
- TO: `### Requirement: Docker Compose is the official target`

## MODIFIED Requirements

### Requirement: Docker Compose is the official target

Fonoster SHALL ship a Docker Compose stack as the official deployment target. The Helm chart in
the repository is unsupported. CI SHALL check the Compose stack nightly and on every pull request
that changes its inputs: the Compose install SHALL be made from the release archive the way a
self-hoster makes it and SHALL reach a healthy apiserver and a dashboard that answers. Every push
to main that carries a releasable conventional commit (feat, fix, perf, refactor, revert, or a
breaking change) SHALL be released automatically, and MUST NOT publish anything before the QA gate
passes on that commit. A release SHALL publish its npm packages, its images, and a GitHub release
with the install archive and its `SHA256SUMS`, the notes, the QA report and the release cards.

#### Scenario: Nightly on both targets
- **WHEN** the nightly pipeline runs
- **THEN** the release archive is installed with Docker Compose and the run fails unless the apiserver is healthy and the dashboard answers 200

#### Scenario: Merging releases
- **WHEN** a pull request whose squashed title is `feat: …` is merged into main and the QA gate passes on it
- **THEN** the next minor version is published to npm and Docker Hub, tagged, and released on GitHub as latest with a dark and a light release card attached

#### Scenario: Release gated
- **WHEN** the QA gate fails on the commit being released
- **THEN** no package, image or release is published

#### Scenario: Nothing releasable
- **WHEN** a merge carries only docs, chore, ci, test or style commits
- **THEN** no package, image or release is published

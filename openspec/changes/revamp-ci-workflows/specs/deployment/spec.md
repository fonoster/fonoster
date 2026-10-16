# deployment

## MODIFIED Requirements

### Requirement: Docker Compose and Helm are official targets

Fonoster SHALL ship a Docker Compose stack and a Helm chart as the two official deployment
targets. CI SHALL check both nightly and on every pull request that changes their inputs: the
Compose install SHALL be made from the release archive the way a self-hoster makes it and SHALL
reach a healthy apiserver and a dashboard that answers, and the Helm chart SHALL lint and render to
valid Kubernetes manifests with each values file it ships. A release SHALL be cut only by hand and
MUST NOT be published before a person approves it, after its images and install archive are built.

#### Scenario: Nightly on both targets
- **WHEN** the nightly pipeline runs
- **THEN** the release archive is installed with Docker Compose and the run fails unless the apiserver is healthy and the dashboard answers 200
- **AND** the Helm chart is linted, rendered with each shipped values file and validated, reported as its own job

#### Scenario: Release gated
- **WHEN** a release run has published its packages and images and drafted the release with the install archive
- **THEN** it waits for approval in the release-approval environment
- **AND** the GitHub release stays a draft until that approval is given

#### Scenario: Merging publishes nothing
- **WHEN** a pull request is merged into main
- **THEN** no package, image or release is published

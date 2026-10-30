## ADDED Requirements

### Requirement: A private region is the release archive with the region overlay

A private region SHALL run from the release archive with
`COMPOSE_FILE=compose.yaml:compose.region.yaml`: the voice path, AppBridge, the hosted Autopilot
and the region agent, without the API server, the dashboard or Envoy. It MUST publish only SIP and
RTP.

#### Scenario: Overlay services
- **WHEN** `docker compose config` runs with `COMPOSE_FILE=compose.yaml:compose.region.yaml`
- **THEN** no `apiserver`, `dashboard` or `envoy` service is listed and `region-agent` is

### Requirement: The playbook installs a private region

The archive's `ansible/playbooks/region.yml` SHALL install a private region from an inventory:
enroll once with the token, set the region's provider keys from stdin, and start it. The
dashboard's install command and the docs' MUST be the same text.

#### Scenario: Enrolled once
- **WHEN** `region.yml` is applied twice with the same inventory
- **THEN** the agent enrolls on the first run only and the second run changes nothing

#### Scenario: One install command
- **WHEN** a region owner copies the install command from the dashboard
- **THEN** it is the command on the Install a private region page

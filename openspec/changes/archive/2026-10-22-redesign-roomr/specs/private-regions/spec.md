## MODIFIED Requirements

### Requirement: Region status and supported versions

A connected cell SHALL send a heartbeat every 30 seconds with its version, components, active calls
and which secrets are set. Components SHALL be the number of Roomr nodes with a fresh heartbeat,
whether AppBridge is ready (its gRPC health check through its Service) and whether Autopilot is
ready; active calls SHALL be the sum of `rooms` in the nodes' heartbeats. The region SHALL be
`connected`, `degraded` (a component unhealthy), `offline` (no heartbeat for 2 minutes) or
`unsupported` (version outside the current and previous minor release). For `unsupported`, config
sync SHALL pause with the reason shown; calls SHALL keep running on the last synced config.

#### Scenario: Offline after missed heartbeats
- **WHEN** a connected cell sends no heartbeat for 2 minutes
- **THEN** the region shows `offline` with the time of the last heartbeat

#### Scenario: Old cell
- **WHEN** a cell two minor releases behind connects
- **THEN** the region shows `unsupported` with the required version, and config sync is paused

#### Scenario: AppBridge not ready
- **WHEN** no AppBridge replica in a connected cell passes its health check
- **THEN** the region shows `degraded` with AppBridge named as the unhealthy component

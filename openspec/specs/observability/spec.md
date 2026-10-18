# observability Specification

## Purpose
OpenTelemetry traces, metrics and logs from every service, tagged with the call ref.
## Requirements
### Requirement: Every service emits OpenTelemetry signals

Every Fonoster service SHALL emit OpenTelemetry traces, metrics and logs over OTLP to an endpoint
set in its YAML config. This covers the apiserver, the VoiceSessionGateway, the Roomr node,
Autopilot and the registry utility when it runs. With no endpoint configured, a service MUST still run and SHALL write logs locally.

#### Scenario: Signals reach the collector
- **WHEN** every service's config points OTLP at a test collector and one call runs
- **THEN** the collector receives traces, metrics and logs from the apiserver, the gateway and the Roomr node

#### Scenario: No collector configured
- **WHEN** a service starts with no OTLP endpoint
- **THEN** it serves normally and writes logs to standard output

### Requirement: Call signals carry the call ref

Every span, log record and per-call metric that belongs to a call SHALL carry the attribute
`fonoster.call_ref`, so one call can be followed across Routr headers, the Roomr node, the gateway,
the app session and the control plane.

#### Scenario: One call, one trace view
- **WHEN** a call is placed, answered by an app, transferred cold and ended
- **THEN** querying the collector for its `fonoster.call_ref` returns spans from the control plane, the Roomr node and the gateway
- **AND** the logs for that call share the same `fonoster.call_ref`

### Requirement: Bring your own backend, with a default profile

Operators SHALL be able to send signals to any OTLP-compatible backend. Docker Compose and Helm
SHALL include an optional observability profile with Grafana, Tempo, Loki and Prometheus, wired to
receive every service's signals when enabled.

#### Scenario: Default profile
- **WHEN** an operator enables the observability profile in Compose and places one call
- **THEN** Grafana shows that call's trace in Tempo, its logs in Loki and service metrics in Prometheus

#### Scenario: External backend
- **WHEN** an operator disables the profile and points OTLP at an external endpoint
- **THEN** no Grafana, Tempo, Loki or Prometheus container runs and signals reach the external endpoint


### Requirement: Logs never carry secrets

Services SHALL NOT log passwords, tokens or keys at any level. Handlers SHALL log refs and ids,
not whole requests that may carry credentials, and the shared logger (`@fonoster/logger`) SHALL
replace the values of secret fields (`password`, `secret`, `*Token`, `authorization`, `apiKey`,
`accessKeySecret`, `privateKey` and the like, at any depth) with `[redacted]` before any transport.

#### Scenario: Creating a SIP credential at verbose level
- **WHEN** `CreateCredentials` is called with a password and logs are at `verbose`
- **THEN** no log line contains the password

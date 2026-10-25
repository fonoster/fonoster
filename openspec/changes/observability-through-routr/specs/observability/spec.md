# Spec Delta

## MODIFIED Requirements

### Requirement: Every service emits OpenTelemetry signals

Every Fonoster service SHALL emit OpenTelemetry traces, metrics and logs over OTLP to an endpoint
set in its YAML config or the standard `OTEL_*` environment. This covers the apiserver, AppBridge,
the Roomr node, Autopilot, the registry utility when it runs, and Routr (EdgePort and its Node
services). With no endpoint configured, a service MUST still run and SHALL write logs locally.
EdgePort SHALL report one span per SIP transaction (method, Call-ID, transport, peer, final status)
and SHALL count and log every SIP message it drops instead of sending.

#### Scenario: Signals reach the collector
- **WHEN** every service's config points OTLP at a test collector and one call runs
- **THEN** the collector receives traces, metrics and logs from the apiserver, AppBridge, the Roomr node and Routr

#### Scenario: No collector configured
- **WHEN** a service starts with no OTLP endpoint
- **THEN** it serves normally and writes logs to standard output

#### Scenario: A dropped SIP message is visible
- **WHEN** EdgePort drops a message on a WebSocket channel it cannot write to
- **THEN** the collector receives the `routr.sip.send_dropped` counter and a log record with the method, Call-ID and peer

### Requirement: Call signals carry the call ref

Every span, log record and per-call metric that belongs to a call SHALL carry the attribute
`fonoster.call_ref`, so one call can be followed across the Roomr node, AppBridge, the app session
and the control plane. SIP-side spans SHALL carry `sip.call_id`; the Roomr node's call span SHALL
carry both, so a search by either one finds the whole call, Routr included.

#### Scenario: One call, one trace view
- **WHEN** a call is placed, answered by an app, transferred cold and ended
- **THEN** querying the collector for its `fonoster.call_ref` returns spans from the control plane, the Roomr node and AppBridge
- **AND** the logs for that call share the same `fonoster.call_ref`

#### Scenario: A call is one trace
- **WHEN** a SIP call reaches an Autopilot agent through Routr
- **THEN** its spans form one trace: Routr's `SIP INVITE`, then `roomr.call.inbound`, `appbridge.call` and `autopilot.session`, each the parent of the next
- **AND** an INVITE that arrives with a W3C `traceparent` header puts the call in that trace

#### Scenario: From a SIP dialog to the call
- **WHEN** an operator searches by the `sip.call_id` of a call's INVITE
- **THEN** they find Routr's SIP transaction spans and the Roomr node's call span, which gives the `fonoster.call_ref`

## ADDED Requirements

### Requirement: Bring your own backend, with a documented recipe

Operators SHALL be able to send signals to any OTLP-compatible backend. The bundle SHALL NOT ship a
backend. The self-hosting documentation SHALL give a recipe that runs a local backend (Grafana with
traces, logs and metrics) next to Fonoster, and how to point every service at it.

#### Scenario: Documented recipe
- **WHEN** an operator follows the documented recipe and places one call
- **THEN** Grafana shows that call's trace, its logs and service metrics

#### Scenario: External backend
- **WHEN** an operator points OTLP at an external endpoint
- **THEN** no backend container runs as part of Fonoster and signals reach the external endpoint

## REMOVED Requirements

### Requirement: Bring your own backend, with a default profile

**Reason**: Replaced by "Bring your own backend, with a documented recipe". The owner decided the
backend belongs in the documentation; the bundle's `observability` profile was dropped in 7bddf56bc.

**Migration**: Run the documented `grafana/otel-lgtm` recipe, or point OTLP at any backend.

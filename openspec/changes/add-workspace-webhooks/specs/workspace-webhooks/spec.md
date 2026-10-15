## ADDED Requirements

### Requirement: Workspaces subscribe endpoints to event types

A workspace SHALL be able to register webhook endpoints, each with an HTTPS URL and a list of event
types, and to list, update and delete them. Only subscribed event types MUST be delivered to an
endpoint.

#### Scenario: Subscribing to one event type

- **WHEN** workspace W registers `https://hooks.example.com/fonoster` for `call.ended` only
- **AND** a call in W starts and ends
- **THEN** the endpoint receives exactly one delivery, of type `call.ended`
- **AND** it receives no `call.started` delivery

#### Scenario: Plain HTTP is refused

- **WHEN** a workspace registers `http://hooks.example.com/fonoster`
- **THEN** the request fails with an error stating that webhook URLs must use HTTPS

### Requirement: v1 event types and payloads

The platform SHALL emit the event types `call.started`, `call.ended`, `call.failed`,
`call_record.sealed` and `provider.deprecated`. Every payload MUST use the envelope `id`, `type`,
`createdAt`, `workspaceRef` and `data`. `call_record.sealed` MUST carry the `callRef` and a link to
fetch the record and MUST NOT include the transcript, recording or SIP trace.

#### Scenario: A call that ends normally

- **WHEN** a call in a subscribed workspace ends after 42 seconds because the caller hung up
- **THEN** a `call.ended` delivery has `data.callRef`, `data.appRef`, `data.from`, `data.to`, `data.direction`, `data.durationSeconds` equal to 42 and `data.endReason` equal to `caller_hangup`

#### Scenario: A call that never reaches an app

- **WHEN** an outbound call gets `486 Busy Here`
- **THEN** a `call.failed` delivery has the `callRef` and `data.reason` equal to `busy`

#### Scenario: A sealed record

- **WHEN** the record for call C is sealed
- **THEN** a `call_record.sealed` delivery has `data.callRef` equal to C and `data.recordUrl` pointing to the record API
- **AND** the body contains no transcript, recording or SIP trace

#### Scenario: A deprecated model

- **WHEN** an operator deprecates `deepgram/nova-2` with replacement `deepgram/nova-3` and retire date `2027-01-31`, and workspace W uses it
- **THEN** W receives one `provider.deprecated` delivery with `data.id` `deepgram/nova-2`, `data.replacement` `deepgram/nova-3` and `data.retireOn` `2027-01-31`

### Requirement: Deliveries are signed

Every delivery SHALL carry a timestamp and an HMAC-SHA256 signature over the timestamp and the raw
body, made with the workspace's signing secret: `X-Fonoster-Timestamp` in Unix seconds and
`X-Fonoster-Signature` as the lowercase hex HMAC-SHA256 of `<timestamp>.<raw body>`. During a
rotation window the header SHALL carry one signature per valid secret, separated by commas.
Receivers SHOULD reject timestamps more than 300 seconds from their clock. The signing secret MUST be shown only once when
created and MUST be rotatable, with both old and new secrets valid during the rotation window.

#### Scenario: Verifying a delivery

- **WHEN** a receiver recomputes the HMAC over the received timestamp and body with the workspace secret
- **THEN** it matches the signature header

#### Scenario: Rotation window

- **WHEN** the workspace rotates its signing secret
- **THEN** deliveries during the rotation window carry signatures that verify with either secret
- **AND** after the window only the new secret verifies

### Requirement: At-least-once delivery with retries

A delivery SHALL count as successful only on a 2xx response within the attempt timeout. Otherwise
the platform MUST retry with exponential backoff for a bounded period and then mark the delivery
failed. Every retry of an event MUST carry the same `id`.

#### Scenario: Endpoint recovers

- **WHEN** an endpoint answers `503` twice and then `200`
- **THEN** the event is delivered three times with the same `id`
- **AND** the delivery is marked successful after the third attempt
- **AND** the gaps between attempts grow

#### Scenario: Endpoint stays down

- **WHEN** an endpoint fails every attempt until the retry period ends
- **THEN** the delivery is marked failed and is listed in the delivery log as resendable

### Requirement: Delivery log and resend

The dashboard SHALL show, per endpoint, recent deliveries with event type, status, attempt count,
last response code and time, and SHALL let users resend a delivery. A resend MUST keep the original
event `id`.

#### Scenario: Manual resend

- **WHEN** a user resends a failed `call.ended` delivery from the dashboard
- **THEN** the endpoint receives the same payload with the same `id` and a fresh signature
- **AND** the log shows the new attempt

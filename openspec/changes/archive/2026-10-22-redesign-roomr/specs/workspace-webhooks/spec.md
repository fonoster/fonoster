## MODIFIED Requirements

### Requirement: v1 event types and payloads

The platform SHALL emit the event types `call.started`, `call.ended`, `call.failed`,
`call_record.sealed` and `provider.deprecated`. AppBridge that owns a call SHALL produce
`call.started`, `call.ended` and `call.failed` (voice-session); call ending reasons come from
media-control's `reason`. When the AppBridge replica that owns an answered call dies before the call
ends, the Roomr node ends the call when the control stream breaks or the app leg goes silent (roomr
"A silent leg ends the call") and publishes `call.ended` with `cause` `app_gone`; the control plane
SHALL then send that call's `call.ended` with `endReason` `appbridge-lost`, exactly once per
`callRef` across its replicas and never in addition to one AppBridge already sent. Every payload
MUST use the envelope `id`, `type`, `createdAt`, `workspaceRef` and `data`. `call_record.sealed`
MUST carry the `callRef` and a link to fetch the record and MUST NOT include the transcript or
recording.

#### Scenario: A call that ends normally

- **WHEN** a call in a subscribed workspace ends after 42 seconds because the caller hung up
- **THEN** a `call.ended` delivery has `data.callRef`, `data.appRef`, `data.from`, `data.to`, `data.direction`, `data.durationSeconds` equal to 42 and `data.endReason` equal to `caller_hangup`

#### Scenario: AppBridge dies mid-call

- **GIVEN** an answered call C in a subscribed workspace, owned by AppBridge replica G, and two control-plane replicas
- **WHEN** G's process dies and the node ends C with `cause` `app_gone`
- **THEN** the endpoint receives exactly one `call.ended` delivery for C, with `data.endReason` equal to `appbridge-lost` and the `call.started` fields
- **AND** a call whose AppBridge ended it normally gets no second `call.ended`

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

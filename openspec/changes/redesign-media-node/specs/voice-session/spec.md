## MODIFIED Requirements

### Requirement: Session ending

A session SHALL end when the caller hangs up, when the app sends `hangup`, when the app closes its
socket, on transfer, on handoff, on fatal error or on timeout. The gateway SHALL send `session.end`
with a `reason` (`caller_hangup`, `app_hangup`, `transfer`, `handoff`, `error`, `timeout`) as its
last message when the socket is still open. The reason SHALL come from the media node's `Ended`
`cause` on the control stream (media-control): `caller_hangup` and `callee_hangup` map to
`caller_hangup`, `max_duration` to `timeout`, `media_timeout` and `node_error` to `error`, and a
control stream that closes without `Ended` to `error`.

#### Scenario: App hangs up
- **WHEN** the app sends `{ "type": "hangup" }`
- **THEN** the call is hung up
- **AND** the gateway sends `session.end` with `reason: "app_hangup"` and closes the socket

#### Scenario: App drops mid-call
- **WHEN** the app's socket closes unexpectedly during a call
- **THEN** the call is hung up
- **AND** the call record contains the drop as an event

#### Scenario: Caller hangs up
- **WHEN** the caller hangs up
- **THEN** the app receives `session.end` with `reason: "caller_hangup"`

#### Scenario: Node lost
- **WHEN** the media node's control stream closes without an `Ended` event
- **THEN** the app receives `session.end` with `reason: "error"` and the call record is sealed with `node_error`

### Requirement: The media node receives only control

The gateway SHALL send the media node only call-control commands on the per-call control stream
(`Answer`, `Reject`, `Hangup`, `Transfer`, `TransferComplete`, `Hold`, `Resume`, `SendDtmf`,
`AttachListener`, `DetachListener`, `Play`, `Stop`) and SHALL receive from it call events and
keypresses; caller audio arrives as RTP at the endpoint the gateway named in `Answer` or `Ready`.
Speech, turn detection, format conversion and the output queue MUST stay in the gateway.

#### Scenario: Speech never reaches the media node
- **WHEN** an app sends `speak`
- **THEN** the media node receives only audio frames for playout, never text or a speech command

#### Scenario: Gateway answers on the stream
- **WHEN** an inbound call's app socket opens and `session.start` is sent
- **THEN** the gateway sends `Answer` on that call's control stream with its RTP endpoint and no other message

### Requirement: An app is a WebSocket URL, a protocol and speech defaults

The platform SHALL model every app as a WebSocket URL, a protocol (`fonoster` or `twilio`), a signing secret, speech
defaults (voice and language as catalog ids), optional audio filters and an optional fallback. A
number MUST point to an app. Routr resolves the number and passes the app in `X-App-Ref`; the
media node passes every header through, and the gateway SHALL take the app from `X-App-Ref` in the
`headers` of the control stream's `Start` (media-control). It SHALL use a number lookup only as a
development fallback when `X-App-Ref` is missing and a routing file is configured, and SHALL
`Reject` the call with `404` when neither names an app. Outbound calls MUST name an app.

#### Scenario: Inbound routing
- **WHEN** `Start.headers` carries `X-App-Ref` naming app `A`, whose URL is `wss://bot.example.com/agent`
- **THEN** the gateway connects to `wss://bot.example.com/agent`

#### Scenario: Missing app reference
- **WHEN** `Start.headers` has no `X-App-Ref` and no development routing file is configured
- **THEN** the gateway sends `Reject` with `sip_status: 404` and no app socket is opened

#### Scenario: Autopilot is an ordinary app
- **WHEN** a number points to an Autopilot agent
- **THEN** the gateway connects to the hosted Autopilot's URL with the `fonoster` protocol
- **AND** the protocol is identical to that of any other app

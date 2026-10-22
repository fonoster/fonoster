## MODIFIED Requirements

### Requirement: An app is a WebSocket URL, a protocol and speech defaults

The platform SHALL model every app as a WebSocket URL, a protocol (`fonoster` or `twilio`), a signing secret, speech
defaults (voice and language as catalog ids), optional audio filters and an optional fallback. An
app's endpoint SHALL be a `ws://` or `wss://` URL. The Applications API MUST reject any other
value, at create and at update, with `INVALID_ARGUMENT` naming the field (`url`), and leave the app
unchanged. A number MUST point to an app. Routr resolves the number and passes the app in `X-App-Ref`; the
Roomr node passes every header through, and AppBridge SHALL take the app from `X-App-Ref` in the
`headers` of the control stream's `Start` (media-control) or, for outbound calls, from `app_ref`
in its `metadata`, which the caller of `CreateCall` sets. It SHALL use a number lookup only as a
development fallback when `X-App-Ref` is missing and a routing file is configured, and SHALL
`Reject` the call with `404` when neither names an app. Outbound calls MUST name an app.

#### Scenario: Inbound routing
- **WHEN** `Start.headers` carries `X-App-Ref` naming app `A`, whose URL is `wss://bot.example.com/agent`
- **THEN** AppBridge connects to `wss://bot.example.com/agent`

#### Scenario: Outbound routing
- **WHEN** `Start.metadata` carries `app_ref` naming app `A`
- **THEN** AppBridge connects to app `A`'s URL

#### Scenario: Missing app reference
- **WHEN** `Start.headers` has no `X-App-Ref` and no development routing file is configured
- **THEN** AppBridge sends `Reject` with `sip_status: 404` and no app socket is opened

#### Scenario: Autopilot is an ordinary app
- **WHEN** a number points to an Autopilot agent
- **THEN** AppBridge connects to the hosted Autopilot's URL with the `fonoster` protocol
- **AND** the protocol is identical to that of any other app

#### Scenario: App URLs are public destinations
- **WHEN** an app is created or updated with a `url` or listener URL naming an internal host
  (`localhost`, a single-label or `*.svc` name) or a private, loopback, link-local or metadata IP
- **THEN** the call fails with `INVALID_ARGUMENT`, unless the operator allows the destination
  (`apps.allowedDestinations` or `FONOSTER_ALLOWED_DESTINATIONS`); the hosted Autopilot URL from
  configuration is exempt
- **AND** when dialing an app or listener from the database, AppBridge refuses addresses that
  resolve to private ranges (Autopilot apps' URL and the operator's YAML apps are not checked)

#### Scenario: Create with an endpoint that is not a WebSocket URL
- **WHEN** an app is created with `url` `bot.example.com:50061` or `https://bot.example.com/agent`
- **THEN** the request fails with `INVALID_ARGUMENT` naming `url`
- **AND** no app is created

#### Scenario: Update to an endpoint that is not a WebSocket URL
- **WHEN** app `A` is updated with `url` `https://bot.example.com/agent`
- **THEN** the request fails with `INVALID_ARGUMENT` naming `url`
- **AND** reading `A` returns its previous URL

#### Scenario: WebSocket endpoints are accepted
- **WHEN** an app is created or updated with `url` `ws://bot.example.com/agent` or `wss://bot.example.com/agent`
- **THEN** the request succeeds and reading the app returns that URL

## REMOVED Requirements

### Requirement: Sessions are delivered over WebSocket only

**Reason**: Replaced by "Sessions are delivered over WebSocket", without the gRPC wording and its legacy scenario.

**Migration**: None; no app has a gRPC endpoint.

### Requirement: Outbound sessions open at answer

**Reason**: Replaced by "Outbound sessions open when the callee answers", without the AppBridge watch of unanswered calls.

**Migration**: None.

## ADDED Requirements

### Requirement: Sessions are delivered over WebSocket

AppBridge SHALL deliver every session to an app over exactly one WebSocket
connection per call, at the app's `ws://` or `wss://` URL, in the app's configured protocol
(`fonoster` or `twilio`).

#### Scenario: Fonoster protocol framing
- **WHEN** a call reaches an app configured with protocol `fonoster`
- **THEN** AppBridge opens one WebSocket to the app's URL
- **AND** sends every message as a JSON text frame
- **AND** sends audio only as binary frames

### Requirement: Outbound sessions open when the callee answers

For outbound calls AppBridge SHALL open the app's session only after the callee answers. Call
progress (ringing, busy, no answer, failed) SHALL be reported to the API caller and the call
record, not to the app. An outbound call that ends before the answer never reaches AppBridge; the
control plane records it (control-plane "Unanswered outbound calls are recorded as failed").

#### Scenario: Busy callee
- **WHEN** an outbound call is placed and the callee is busy
- **THEN** no WebSocket is opened to the app
- **AND** the outcome `busy` is reported to the API caller and recorded in the call record

#### Scenario: Answered callee
- **WHEN** an outbound call is answered
- **THEN** AppBridge opens the app's socket and sends `session.start` with `direction: "outbound"`

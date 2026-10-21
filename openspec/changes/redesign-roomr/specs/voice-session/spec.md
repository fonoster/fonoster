## MODIFIED Requirements

### Requirement: Session ending

A session SHALL end when the caller hangs up, when the app sends `hangup`, when the app closes its
socket, on transfer, on handoff, on fatal error or on timeout. AppBridge SHALL send `session.end`
with a `reason` (`caller_hangup`, `app_hangup`, `transfer`, `handoff`, `error`, `timeout`) as its
last message when the socket is still open. The reason SHALL come from the Roomr node's `Ended`
`cause` on the control stream (media-control), mapped as follows:

| `cause` | `session.end` `reason` |
|---|---|
| `caller_hangup`, `callee_hangup` | `caller_hangup` |
| `removed` after the app's `hangup`, or after an `EndCall`/`EndRoom` from the control plane | `app_hangup` |
| `removed` after a transfer (cold, `TransferComplete` or `refer`) | `transfer` |
| `max_duration` | `timeout` |
| `media_timeout`, `node_error`, `app_gone` | `error` |
| any cause AppBridge does not know | `error` |

A control stream that closes without `Ended` SHALL map to `error`. `busy`, `no_answer` and
`rejected` end outbound calls before any session opens, so they produce no `session.end`.

#### Scenario: App hangs up
- **WHEN** the app sends `{ "type": "hangup" }`
- **THEN** the call is hung up
- **AND** AppBridge sends `session.end` with `reason: "app_hangup"` and closes the socket

#### Scenario: App drops mid-call
- **WHEN** the app's socket closes unexpectedly during a call
- **THEN** the call is hung up
- **AND** the call record contains the drop as an event

#### Scenario: Caller hangs up
- **WHEN** the caller hangs up
- **THEN** the app receives `session.end` with `reason: "caller_hangup"`

#### Scenario: Node lost
- **WHEN** the Roomr node's control stream closes without an `Ended` event
- **THEN** the app receives `session.end` with `reason: "error"` and the call record is sealed with `node_error`

#### Scenario: Every cause mapped
- **WHEN** the node sends `Ended` with each `cause` in the table in turn
- **THEN** the app receives `session.end` with the `reason` the table gives

#### Scenario: Unknown cause
- **WHEN** the node sends `Ended` with `cause: "something_new"`
- **THEN** the app receives `session.end` with `reason: "error"`

#### Scenario: Node's audio stops
- **WHEN** the node's RTP to AppBridge stops for `mediaTimeout` (`appbridge.yaml`, 15 s by default) while the control stream stays open
- **THEN** AppBridge ends the call, the app receives `session.end` with `reason: "error"` and the call record is sealed with `media_timeout`

### Requirement: The Roomr node receives only control

AppBridge SHALL send the Roomr node only call-control commands on the per-call control stream
(`Answer`, `Reject`, `Hangup`, `Transfer`, `TransferComplete`, `Hold`, `Resume`, `SendDtmf`,
`AttachListener`, `DetachListener`, `Play`, `Stop`) and SHALL receive from it call events and
keypresses; caller audio arrives as RTP at the endpoint AppBridge named in `Answer` or `Ready`.
Speech, turn detection, format conversion and the output queue MUST stay in AppBridge.

#### Scenario: Speech never reaches the Roomr node
- **WHEN** an app sends `speak`
- **THEN** the Roomr node receives only audio frames for playout, never text or a speech command

#### Scenario: AppBridge answers on the stream
- **WHEN** an inbound call's app socket opens and `session.start` is sent
- **THEN** AppBridge sends `Answer` on that call's control stream with its RTP endpoint and no other message

### Requirement: An app is a WebSocket URL, a protocol and speech defaults

The platform SHALL model every app as a WebSocket URL, a protocol (`fonoster` or `twilio`), a signing secret, speech
defaults (voice and language as catalog ids), optional audio filters and an optional fallback. A
number MUST point to an app. Routr resolves the number and passes the app in `X-App-Ref`; the
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

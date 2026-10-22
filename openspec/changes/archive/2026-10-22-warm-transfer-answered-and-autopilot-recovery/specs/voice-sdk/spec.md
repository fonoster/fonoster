## MODIFIED Requirements

### Requirement: Events are exposed as subscriptions

The session SHALL expose `on(event, callback)` for `turn.user_started`, `turn.likely_ended`,
`turn.ended`, `turn.resumed`, `turn.backchannel`, `transcript.partial`, `turn.estimate`, `dtmf`,
`transfer.answered`, `error` and `end`. Opt-in events MUST be requested with `subscribe([...])`, which sends the
`subscribe` message.

#### Scenario: Listening for keypresses at any time

- **WHEN** the app registers `session.on("dtmf", cb)` and the caller presses `0` mid-sentence
- **THEN** `cb` is called with `{ digit: "0" }`

#### Scenario: Opting into partial transcripts

- **WHEN** the app calls `session.subscribe(["transcript.partial"])`
- **THEN** the SDK sends `subscribe` with `events: ["transcript.partial"]`
- **AND** subsequent `transcript.partial` events reach the registered callbacks

#### Scenario: Knowing the new party answered

- **WHEN** the app registers `session.on("transfer.answered", cb)` during a warm transfer and AppBridge sends `transfer.answered`
- **THEN** `cb` is called with `{ relatesTo }` set to the transfer's id

### Requirement: Call control methods map one to one

`play`, `playDtmf`, `transfer`, `completeTransfer`, `hold`, `resume`, `handoff` and `hangup` SHALL
each send exactly one corresponding session message (`play`, `dtmf.send`, `transfer`,
`transfer.complete`, `hold`, `resume`, `handoff`, `hangup`). `transfer` SHALL accept an optional
`mode` (`cold` by default, `warm` or `refer`) and pass it through unchanged. `completeTransfer` SHALL
resolve when the session ends with `reason: transfer` and reject with the `SessionError`
AppBridge answers it with (`transfer_not_answered` before the new party answered), leaving the
warm transfer pending and the session open.

#### Scenario: Transfer

- **WHEN** the app calls `transfer("+15551234567")`
- **THEN** the SDK sends `transfer` with `to: "+15551234567"`
- **AND** when AppBridge ends the session with `reason: transfer`, the call resolves

#### Scenario: Warm transfer

- **WHEN** the app calls `transfer("+15551234567", { mode: "warm" })` and later `completeTransfer()`
- **THEN** the SDK sends `transfer` with `mode: "warm"` and then `transfer.complete` with the same `id`
- **AND** the session ends with `reason: transfer` only after `transfer.complete`

#### Scenario: Handoff

- **WHEN** the app calls `handoff("app-escalation", { reason: "angry caller" })`
- **THEN** the SDK sends `handoff` with that app and payload
- **AND** the session ends with `reason: handoff`

#### Scenario: Completing before the new party answered

- **WHEN** the app calls `completeTransfer()` and AppBridge answers with the non-fatal error `transfer_not_answered`
- **THEN** `completeTransfer()` rejects with a `SessionError` with that code
- **AND** the pending `transfer(...)` call does not settle and the session stays open

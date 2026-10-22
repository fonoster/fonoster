## Why

Two dead ends found by the Transfers and DTMF QA area (XFR, #1109):

- A warm transfer's `transfer.complete` sent before the new party answers ends the app's session,
  the node refuses the completion, and the caller is left on hold with nobody once the new party
  joins. An app can't avoid it: nothing tells it the new party answered.
- After a failed transfer (`transfer_failed`), Autopilot stays in `transferring`: it says nothing,
  its idle timer is off and it never hangs up, so the caller sits in silence.

## What Changes

- AppBridge sends the app `transfer.answered` (`relatesTo` the transfer's id) when a warm
  transfer's new party answers, read from the node's ParticipantJoined for the dialed party. Like
  Twilio's warm transfers, the app completes only an answered transfer.
- A `transfer.complete` before that is refused with the non-fatal error `transfer_not_answered`
  (`relatesTo` the transfer's id): the session stays open, the caller stays on hold and nothing
  goes to the node; the app may complete again after `transfer.answered`.
- The voice SDKs expose `transfer.answered` as an event, and `completeTransfer()` /
  `complete_transfer()` reject with the refusal (a `SessionError` the app can catch) instead of
  failing the pending transfer; they resolve once the session ends with `transfer`.
- Autopilot: on `transfer_failed` it speaks `transferOptions.failedMessage` (optional; default
  "Sorry, I couldn't connect you. How else can I help?"), turns the idle timer back on and listens
  again. The agent schema and the dashboard's agent editor gain the field.

## Capabilities

### Modified Capabilities

- `voice-session`: Call control: `transfer.answered`, and `transfer.complete` refused before it.
- `voice-sdk`: the `transfer.answered` event; `completeTransfer` reports the refusal.
- `autopilot`: Built-in hangup and transfer: a failed transfer is said and the conversation goes on.

## Impact

- `mods/common` (session schema, `session.v1.json`, agent schema), `mods/appbridge` (Call.ts),
  `mods/voice`, `python/fonoster-voice` (messages, session), `mods/autopilot` (Agent, machine),
  `mods/dashboard` (agent editor), docs-site session protocol and transfers pages.
- No Roomr change: the node already reports the dialed party's ParticipantJoined.
- Proven by XFR-002 (extended), XFR-011 and XFR-013 (the SDKs wait for the event) and a new
  Autopilot case, XFR-017.

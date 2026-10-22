## 1. Session protocol

- [x] 1.1 `transfer.answered` event (`relatesTo`) and the `transfer_not_answered` error code in the session schema; `session.v1.json` and the Python messages regenerated
- [x] 1.2 AppBridge: the dialed party's ParticipantJoined during a warm transfer sends `transfer.answered`; `transfer.complete` before it is refused with `transfer_not_answered` and nothing reaches the node
- [x] 1.3 The warm-transfer scenario file expects `transfer.answered`

## 2. Voice SDKs

- [x] 2.1 TypeScript: `on("transfer.answered")`; `completeTransfer()` rejects with the refusal and resolves when the session ends with `transfer`
- [x] 2.2 Python: the same (`on("transfer.answered")`, `complete_transfer()`)

## 3. Autopilot

- [x] 3.1 `transferOptions.failedMessage` (optional) in the agent schema
- [x] 3.2 On `transfer_failed`: speak the message (or the default), arm the idle timer, back to listening
- [x] 3.3 Dashboard agent editor: "If the transfer fails" next to the transfer message

## 4. Proof

- [x] 4.1 XFR-002: the event arrives at the answer; an early complete is refused and the caller stays held; a complete after the event connects them
- [x] 4.2 XFR-011 and XFR-013: the SDK fixtures complete after `transfer.answered`
- [x] 4.3 XFR-017: Autopilot says the failure message and answers the next turn
- [x] 4.4 Docs: session protocol reference and the transfers guide

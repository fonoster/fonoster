## ADDED Requirements

### Requirement: Unanswered outbound calls are recorded as failed

An outbound call that ends before the callee answers reaches no AppBridge. The control plane SHALL
read the Roomr node's unanswered `call.ended` for the calls it placed and, once per call, SHALL have
the region's record writer seal the call's minimal record in the app's workspace and SHALL send
`call.failed` with the node's cause as the reason.

#### Scenario: Outbound call ends before the answer
- **WHEN** an outbound call to app `A` of workspace `W` ends unanswered with cause `busy`
- **THEN** the region's record writer is asked once to seal the call's record for `W`, with the
  entries `call.started`, `call.progress` and `call.failed` (`reason: "busy"`)
- **AND** `call.failed` with `reason: "busy"` is sent to the fan-out once

#### Scenario: An answered call is AppBridge's
- **WHEN** an outbound call is answered and later ends
- **THEN** the control plane writes no failed record and sends no `call.failed` for it

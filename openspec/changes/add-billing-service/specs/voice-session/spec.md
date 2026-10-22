# Spec Delta

## ADDED Requirements

### Requirement: Calls are admitted before they start

Before answering an inbound call or browser test, and before placing an outbound call, the platform
SHALL ask the authorization service whether the session may start. A refusal SHALL record
`call.failed` with the refusal's reason and reject the call (SIP 402 for `insufficient_balance`,
503 for `concurrency_limit`). An answer slower than 500 ms SHALL admit the call.

#### Scenario: Out of credits

- **WHEN** an inbound call arrives for an account the billing service refuses with
  `insufficient_balance`
- **THEN** the caller is rejected with SIP 402 before the call is answered (a 180 Ringing may come
  first), and nothing is billed
- **AND** the workspace receives `call.failed` with `reason: "insufficient_balance"`

#### Scenario: Outbound refused

- **WHEN** `CreateCall` is refused with `concurrency_limit`
- **THEN** the API returns an error naming `concurrency_limit` and no call is placed

#### Scenario: Authorization slow

- **WHEN** the authorization service takes longer than 500 ms
- **THEN** the call is admitted and the timeout is logged

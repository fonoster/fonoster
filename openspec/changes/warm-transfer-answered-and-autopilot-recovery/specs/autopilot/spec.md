## MODIFIED Requirements

### Requirement: Built-in hangup and transfer

Autopilot SHALL offer `hangup` and `transfer` as built-in tools that end with the session commands
`hangup` and `transfer`. When a transfer fails (`transfer_failed`), Autopilot SHALL speak the agent's
`transferOptions.failedMessage` (optional; default "Sorry, I couldn't connect you. How else can I
help?"), turn its idle timer back on and listen again, so the conversation goes on.

#### Scenario: Hangup tool

- **WHEN** the fake LLM calls `hangup`
- **THEN** Autopilot speaks the goodbye message and, after `output.done`, sends `hangup`

#### Scenario: Transfer tool

- **WHEN** the fake LLM calls `transfer` and the agent has a transfer number
- **THEN** Autopilot speaks the transfer message, moves to transferring and sends `transfer` with that number

#### Scenario: Transfer fails

- **WHEN** the fake LLM calls `transfer` and AppBridge answers the transfer with `error` `transfer_failed`
- **THEN** Autopilot speaks the failed-transfer message and returns to listening with its idle timer on
- **AND** the caller's next turn gets a reply from the language model

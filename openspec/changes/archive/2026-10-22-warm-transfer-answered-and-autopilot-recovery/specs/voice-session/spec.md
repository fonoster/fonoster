## MODIFIED Requirements

### Requirement: Call control

AppBridge SHALL send `dtmf` with `digit` whenever the caller presses a key, at any point of the
call. It SHALL accept `dtmf.send` (`id`, `digits`), `transfer` (`id`, `to`, optional `headers`,
optional `mode`), `transfer.complete` (`id`), `hold` (`id`, optional `music`) and `resume` (`id`)
and pass them to the Roomr node.

A `transfer`'s `to` SHALL be an E.164 number, a SIP user, a `tel:` URI or a `sip:`/`sips:` URI
without parameters, and its `headers` SHALL be at most 16 custom `X-` headers (name `X-` and up to 64
letters, digits or dashes; value a string of at most 256 characters without control characters).
The headers the platform routes by (`X-App-Ref`, `X-Call-Ref`, `X-Call-Direction`,
`X-Dod-Number`, `X-Dod-Privacy`, `X-Access-Key-Id`, `X-Is-Api-Originated-Type`, `X-Connect-Token`
and Routr's own `X-Edgeport-Ref`, `X-AppBridge-Auth`, `X-Request-Uri`, `X-Session-Count`) are
reserved, in any case. A transfer that breaks these rules SHALL be refused with `error`
`bad_message` (`relatesTo` the transfer) and nothing is sent to the Roomr node. AppBridge SHALL
add `X-Dod-Number` (the ingress number of an inbound call, the `from` of an outbound one) and
`X-Access-Key-Id` (the app's workspace) itself, so a transfer to the PSTN leaves by the call's own
workspace's trunk.

`transfer.mode` SHALL be `cold` (the default), `warm` or `refer`:

- `cold`: the Roomr node dials `to` into the caller's room. When the new party answers, the app's
  session leaves the room and ends with `reason: "transfer"`; the caller and the new party stay in
  the room, and recording continues.
- `warm`: the caller is put on hold (hold music from the transfer's optional `music`, or
  silence), the Roomr node dials `to`, and the app and the new party hear each other so the agent
  can brief them. When the new party answers, the app receives `transfer.answered` with
  `relatesTo` set to the transfer's `id`. The session ends with `reason: "transfer"` when the app
  then sends `transfer.complete` with the transfer's `id`, which connects the caller and the new
  party. A `transfer.complete` before `transfer.answered` SHALL be refused with the non-fatal
  `error` `transfer_not_answered` (`relatesTo` the transfer's `id`): nothing is sent to the Roomr
  node, the session stays open and the caller stays on hold, and the app may send
  `transfer.complete` again once the new party answered. If the new party does not answer within
  30 seconds, the app receives `error` `transfer_failed` and the caller comes back to the app.
- `refer`: the Roomr node sends a SIP REFER on the caller's leg and leaves the call once the REFER
  is accepted. The session ends with `reason: "transfer"`, and recording ends at that point.

#### Scenario: Keypress while the agent speaks
- **WHEN** the caller presses `0` while item `r1` is playing
- **THEN** the app receives `{ "type": "dtmf", "digit": "0" }` immediately

#### Scenario: Cold transfer stays in the room
- **WHEN** the app sends `transfer` `{id: "t1", to: "+15551234567"}` and the new party answers
- **THEN** the app receives `session.end` with `reason: "transfer"`
- **AND** the caller and the new party remain connected in the same room
- **AND** the call record keeps receiving audio and events until the room ends

#### Scenario: Warm transfer
- **WHEN** the app sends `transfer` `{id: "t2", to: "+15551234567", mode: "warm"}` and the new party answers
- **THEN** the app's session stays open, the app and the new party hear each other, and the caller hears hold audio
- **AND** when the app sends `transfer.complete` `{id: "t2"}` the app receives `session.end` with `reason: "transfer"`
- **AND** the caller and the new party remain connected

#### Scenario: New party answers a warm transfer
- **WHEN** the app sends `transfer` `{id: "t2", to: "+15551234567", mode: "warm"}` and the new party answers
- **THEN** the app receives `{ "type": "transfer.answered", "relatesTo": "t2" }`

#### Scenario: Completing a warm transfer before the answer
- **WHEN** the app sends `transfer.complete` `{id: "t2"}` while the new party of warm transfer `t2` is still ringing
- **THEN** the app receives `error` with `code: "transfer_not_answered"`, `fatal: false` and `relatesTo: "t2"`
- **AND** the Roomr node receives no `transfer.complete`, the session stays open and the caller stays on hold
- **AND** a `transfer.complete` `{id: "t2"}` after `transfer.answered` ends the session with `reason: "transfer"`

#### Scenario: Transfer by SIP REFER
- **WHEN** the app sends `transfer` `{id: "t3", to: "+15551234567", mode: "refer"}` and the REFER is accepted
- **THEN** the app receives `session.end` with `reason: "transfer"`
- **AND** the Roomr node no longer carries the call
- **AND** the call record notes that recording ended at the transfer

#### Scenario: Transfer with a reserved header
- **WHEN** the app sends `transfer` `{id: "t4", to: "+15551234567", headers: {"X-Dod-Number": "+15550009999"}}`
- **THEN** the app receives `error` with `code: "bad_message"` and `relatesTo: "t4"`
- **AND** the Roomr node receives no `transfer`

#### Scenario: Transfer headers
- **WHEN** an inbound call to `+15550002222` in workspace `W1` is transferred with `headers: {"X-Customer-Id": "c-42"}`
- **THEN** the Roomr node's `transfer` carries `X-Customer-Id: c-42`, `X-Dod-Number: +15550002222` and `X-Access-Key-Id: W1`

#### Scenario: Failed transfer
- **WHEN** the transfer target cannot be reached
- **THEN** the app receives `error` with `code: "transfer_failed"` and `relatesTo: "t1"`
- **AND** the session continues

While the caller is on hold the app SHALL receive no caller audio and no turn events (keypresses
still arrive), and every command except `resume`, `hangup`, `transfer`, `handoff` and `record.note`
SHALL be answered with `error` `on_hold`.

#### Scenario: Hold and resume
- **WHEN** the app sends `hold` `{id: "h1"}` and later `resume` `{id: "h2"}`
- **THEN** the caller hears hold audio (or silence) between the two commands and the conversation afterwards
- **AND** the app receives no caller audio frames and no turn events between the two

#### Scenario: Speaking while on hold
- **WHEN** the app sends `speak` while the caller is on hold
- **THEN** it receives `error` with `code: "on_hold"` and `relatesTo` set to the item's `id`

#### Scenario: Warm transfer not answered
- **WHEN** the app sends a warm `transfer` and the new party does not answer within 30 seconds
- **THEN** the app receives `error` `transfer_failed` and the caller hears the app again

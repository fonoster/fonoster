# Spec Delta

## ADDED Requirements

### Requirement: Calls say who answered

When answering machine detection ran on a call, the Calls list SHALL say who answered (Human,
Voicemail, Machine or IVR) and the call detail SHALL say it in a chip and on the Call answered row
with the confidence and the audio it was based on. A call where AMD didn't run or couldn't tell SHALL
show a dash, never a guess.

#### Scenario: A call that reached voicemail

- **WHEN** AMD found voicemail with confidence 0.94 on 820 ms of audio
- **THEN** the call's row says Voicemail, and its detail says Answered by voicemail and shows AMD, voicemail 0.94 and 820 ms on the Call answered row

#### Scenario: A call without AMD

- **WHEN** AMD didn't run on a call
- **THEN** its row shows a dash under Answered by

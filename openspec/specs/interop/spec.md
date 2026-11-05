# interop Specification

## Purpose
Which interop case a recorded Routr call proves, so evidence for each well-known far end can be
found in the recordings Routr already keeps.

## Requirements

### Requirement: Each interop case has a signaling signature

Fonoster SHALL decide, from one Routr recording alone, which far end a call faced and which interop
case it shows. The far end SHALL be decided only from the Request-URI host Routr routed on and the
address the initial INVITE came from, never from headers a caller sets. When several cases match a
call, the highest-numbered one SHALL be reported.

#### Scenario: Inbound call to a Number answered, caller hangs up
- **WHEN** a recording shows a `from-pstn` INVITE answered with a relayed 2xx, an ACK, a BYE from the caller and a 2xx to it
- **THEN** the classifier reports IOP-001

#### Scenario: Inbound call answered, Fonoster hangs up
- **WHEN** a recording shows a `from-pstn` INVITE answered with a relayed 2xx, an ACK, a BYE from the callee and a 2xx to it
- **THEN** the classifier reports IOP-002

#### Scenario: Outbound call from an app answered
- **WHEN** a recording shows a `peer-to-pstn` INVITE answered with a relayed 2xx, an ACK, a BYE and a 2xx to it
- **THEN** the classifier reports IOP-003

#### Scenario: SIP agent outbound call answered
- **WHEN** a recording shows an `agent-to-pstn` INVITE answered with a relayed 2xx, an ACK, a BYE and a 2xx to it
- **THEN** the classifier reports IOP-004

#### Scenario: Outbound call cancelled before answer
- **WHEN** a recording shows an outbound INVITE, at least one response from the far end, a CANCEL and no 2xx to the INVITE
- **THEN** the classifier reports IOP-005

#### Scenario: Inbound call cancelled by the caller
- **WHEN** a recording shows a `from-pstn` INVITE, a CANCEL from the INVITE's sender and no 2xx to the INVITE
- **THEN** the classifier reports IOP-006

#### Scenario: Outbound call busy
- **WHEN** a recording shows an outbound INVITE whose relayed final response is 486
- **THEN** the classifier reports IOP-007

#### Scenario: Outbound call declined
- **WHEN** a recording shows an outbound INVITE whose relayed final response is 603
- **THEN** the classifier reports IOP-008

#### Scenario: In-dialog re-INVITE with SDP answered
- **WHEN** a recording shows after the ACK, an INVITE with a To tag and an SDP body, and a 2xx to it
- **THEN** the classifier reports IOP-009

#### Scenario: In-dialog re-INVITE without SDP
- **WHEN** a recording shows after the ACK, an INVITE with a To tag and no body, a 2xx with SDP and an ACK with SDP
- **THEN** the classifier reports IOP-010

#### Scenario: Blind transfer by REFER
- **WHEN** a recording shows an in-dialog REFER with Refer-To, a 202 to it and a NOTIFY with `Event: refer`
- **THEN** the classifier reports IOP-011

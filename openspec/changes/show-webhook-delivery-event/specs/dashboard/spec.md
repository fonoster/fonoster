# Spec Delta

## ADDED Requirements

### Requirement: A webhook delivery shows the event it sent

A delivery in Recent deliveries SHALL open, by a click on its row or from the keyboard on its event
type, a read-only drawer titled with the event type. The drawer SHALL show the status, the attempts
and the last response, the endpoint (or that the webhook was deleted), when it was sent, and the
event Fonoster stored for it as indented JSON, never truncated, with Copy body. It SHALL say that the
key order can differ from the bytes the receiver got, so the body is not for checking a signature.

#### Scenario: Open a delivery

- **WHEN** the user opens a failed `call.ended` delivery
- **THEN** the drawer is titled `call.ended`, reads Failed with its attempts and last status, and shows the event as `JSON.stringify(event, null, 2)`
- **AND** closing it returns focus to the delivery's row

# Spec Delta

## ADDED Requirements

### Requirement: Apps have a Talk drawer

The app detail page SHALL offer a Talk to app button that opens the Talk drawer for the saved
version of the app, the same drawer as the agent's, with the numbers routed to the app listed
below the call card.

#### Scenario: Call a stream app
- **WHEN** the user opens a stream app, clicks Talk to app, then Call
- **THEN** the drawer shows "Connected" and the app's server receives a session for that app
- **AND** Hang up shows "Call ended" with Call again, and the call is recorded for the app

## MODIFIED Requirements

### Requirement: A browser call reaches the agent

The platform SHALL route an INVITE sent over the WebSocket to the token's `targetAor`, with
headers `X-Connect-Token` (a valid test token) and `X-App-Ref` (an agent or stream app of the
token's workspace), to a Roomr node, bridge its WebRTC media (ICE, DTLS-SRTP) to plain RTP through
RTPEngine, and run the app named by `X-App-Ref`, like a call from a number.

#### Scenario: Call the saved agent
- **WHEN** the browser INVITEs `sip:roomr@default` with a valid token and `X-App-Ref` of the
  workspace's Autopilot agent
- **THEN** the call is answered, the hosted Autopilot opens a session for that agent, and the
  browser receives the agent's audio

#### Scenario: Call a stream app's session
- **WHEN** the browser INVITEs `sip:roomr@default` with a valid token and `X-App-Ref` of the
  workspace's stream app
- **THEN** the call is answered and AppBridge opens a signed session to the app's URL

#### Scenario: Invalid token
- **WHEN** the INVITE carries a token that doesn't verify or has expired
- **THEN** Routr answers 403 and no session starts

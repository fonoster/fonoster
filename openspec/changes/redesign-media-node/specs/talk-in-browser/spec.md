## MODIFIED Requirements

### Requirement: A browser call reaches the agent

The platform SHALL route an INVITE sent over the WebSocket to the token's `targetAor`, with
headers `X-Connect-Token` (a valid test token) and `X-App-Ref` (an agent of the token's
workspace), to a media node, which SHALL terminate the browser's WebRTC media itself (ICE,
DTLS-SRTP, Opus) with no media relay in between, and run the app named by `X-App-Ref`, like a
call from a number. Until the node's WebRTC transport ships, the bundle MAY keep RTPEngine in the
path; once it ships, RTPEngine SHALL be removed from the browser path.

#### Scenario: Call the saved agent
- **WHEN** the browser INVITEs `sip:medianode@default` with a valid token and `X-App-Ref` of the
  workspace's Autopilot agent
- **THEN** the call is answered, the hosted Autopilot opens a session for that agent, and the
  browser receives the agent's audio

#### Scenario: Browser media lands on the node
- **WHEN** the node's WebRTC transport is enabled and a browser calls
- **THEN** the browser's ICE candidates pair with the node's WebRTC port and no RTPEngine container carries the call

#### Scenario: Invalid token
- **WHEN** the INVITE carries a token that doesn't verify or has expired
- **THEN** Routr answers 403 and no session starts

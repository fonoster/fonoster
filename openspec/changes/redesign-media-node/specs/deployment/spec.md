## ADDED Requirements

### Requirement: Media paths are open between the node and the gateway

The Helm chart SHALL expose the gateway's control-stream port as a Service that the media node is
configured with as its session endpoint, and SHALL ship a NetworkPolicy that allows UDP between the
media node's and the gateway's RTP port ranges and TCP from the node to the gateway's control port.
Both targets SHALL publish the node's WebRTC UDP port and SHALL document the node's external RTP
range and the one-node-per-host or non-overlapping-ranges rule for host networking. Compose SHALL
reach the same result with its service names and published ports.

#### Scenario: Rendered chart
- **WHEN** the chart is rendered with its default values
- **THEN** the manifests contain a gateway Service with the control-stream port, a NetworkPolicy allowing node-to-gateway RTP and control traffic, and the node's WebRTC port

#### Scenario: Audio under default deny
- **WHEN** the cluster applies a default-deny NetworkPolicy and the chart's policies
- **THEN** a call's RTP flows between the node pod and the gateway pod in both directions

#### Scenario: Compose publishes the media ports
- **WHEN** the release archive is installed with Docker Compose
- **THEN** the node's SIP, external RTP range and WebRTC port are published and the gateway service name resolves from the node container

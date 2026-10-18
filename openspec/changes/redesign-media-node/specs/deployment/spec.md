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

### Requirement: Network isolation guards Roomr's ports

Roomr SHALL NOT authenticate `Roomr` RPCs or check the source of SIP requests: network isolation
SHALL be the security boundary. Helm SHALL admit Roomr's control port only from the apiserver and
its SIP port only from the trusted SIP proxy (by NetworkPolicy, or host firewall where Roomr runs
on the host network); Compose SHALL NOT publish the control port and SHALL document that the SIP
port must be reachable only from the proxy.

#### Scenario: Control port closed to other pods
- **WHEN** the chart is installed and a pod other than the apiserver connects to Roomr's control port
- **THEN** the connection is refused or times out

### Requirement: Rolling deploys drop no calls

The Helm chart SHALL give the gateway and Roomr a `terminationGracePeriodSeconds` at least their
drain maximum wait (control-plane "The gateway drains on SIGTERM", media-node "Draining is a signal
with a bounded wait"), a readiness probe that fails while draining, and a PodDisruptionBudget each.
Neither gRPC server SHALL set a maximum connection age.

#### Scenario: Rollout with live calls
- **WHEN** the gateway and Roomr are rolled out to a new version while 20 calls are live
- **THEN** all 20 calls continue until their parties hang up and new calls land on the new pods

#### Scenario: Rendered drain settings
- **WHEN** the chart is rendered with `drain.maxWait: 3600`
- **THEN** the gateway and Roomr pods have `terminationGracePeriodSeconds` of at least 3600 and each has a PodDisruptionBudget

## ADDED Requirements

### Requirement: Media paths are open between the node and AppBridge

The Helm chart SHALL expose AppBridge's control-stream port as a Service that the Roomr node uses
as its session endpoint, and SHALL ship a NetworkPolicy that allows the node's RTP to AppBridge and
TCP from the node to AppBridge's control port. Both targets SHALL document the node's RTP range
and the one-node-per-host or non-overlapping-ranges rule for host networking. Compose SHALL reach
the same result with its service names.

#### Scenario: Rendered chart
- **WHEN** the chart is rendered with its default values
- **THEN** the manifests contain an AppBridge Service with the control-stream port, a NetworkPolicy allowing node-to-appbridge RTP and control traffic, and the node's RTP range

#### Scenario: Audio under default deny
- **WHEN** the cluster applies a default-deny NetworkPolicy and the chart's policies
- **THEN** a call's RTP flows between the node pod and AppBridge pod in both directions

#### Scenario: Compose publishes only RTP
- **WHEN** the release archive is installed with Docker Compose
- **THEN** the node's RTP range is published on the host, its SIP and control ports are not, and AppBridge service name resolves from the node container

### Requirement: Network isolation guards Roomr's ports

Roomr SHALL NOT authenticate `Roomr` RPCs or check the source of SIP requests: network isolation
SHALL be the security boundary. Helm SHALL admit Roomr's control port only from the apiserver and
its SIP port only from the trusted SIP proxy, by NetworkPolicy when Roomr runs on the pod network
and by a documented host firewall when `hostNetwork` is true; Compose SHALL NOT publish the
control port or the SIP port on the host.

#### Scenario: Control port closed to other pods
- **WHEN** the chart is installed with Roomr on the pod network and a pod other than the apiserver connects to Roomr's control port
- **THEN** the connection is refused or times out

### Requirement: Rolling deploys drop no calls

The Helm chart SHALL give AppBridge and Roomr a `terminationGracePeriodSeconds` at least their
drain maximum wait (control-plane "AppBridge drains on SIGTERM", roomr "Draining is a health
signal with a bounded wait"), a readiness probe that fails while draining (the gRPC health check: Roomr's on its control
port, AppBridge's on its `Session` port), and a PodDisruptionBudget each. Neither gRPC server SHALL set a
maximum connection age.

#### Scenario: Rollout with live calls
- **WHEN** AppBridge and Roomr are rolled out to a new version while 20 calls are live
- **THEN** all 20 calls continue until their parties hang up and new calls land on the new pods

#### Scenario: Rendered drain settings
- **WHEN** the chart is rendered with `roomr.drainGraceSeconds: 3600` and `appbridge.drainGraceSeconds: 3600`
- **THEN** AppBridge and Roomr pods have `terminationGracePeriodSeconds` of at least 3600 and each has a PodDisruptionBudget

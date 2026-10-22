## Why

The Roomr node shipped by `add-roomr` works, but it is wired to Fonoster by name: it reads
`X-App-Ref`, `X-Call-Ref` and `X-DOD-Number`, registers to Routr with `X-Session-Count`, offers
every inbound call to AppBridge replicas over NATS (`appbridge.incoming`) and waits for one of
them to claim it, and takes its commands as NATS request and reply. That coupling makes the node
hard to reuse outside Fonoster, hard to test alone, and it puts a race (the claim) on the path of
every call. The design document "Roomr node: Target Design" (2026-10-17) settles a different
shape: an isolated, generic mixer that speaks plain SIP and RTP, exposes one small gRPC
service to its controller, opens one gRPC control stream per call to a configured session
endpoint, and reports capacity and events on NATS. This change turns that design into
requirements and supersedes the current `roomr` and `media-control` specs.

Roomr is internal-only and is kept as light as possible: network isolation is the security
boundary, and the change adds no hardening requirements beyond it.

## What Changes

- **Isolation.** The node knows no other component by name. Its configuration holds an outbound
  proxy, zero or more registrations (registrar, AOR, optional digest auth, header templates), a
  session endpoint and the names of two optional headers (room, call ref). Every other SIP header
  is passed through untouched, inbound (in `Start`) and outbound (from `CreateCall`).
- **One control stream per call, audio stays on RTP.** For every call the node opens a new gRPC
  connection to the session endpoint (in Fonoster, AppBridge behind a Kubernetes Service) and
  sends `Start` with the call's identity, headers and the node's RTP endpoint; the app answers with
  `Answer` (inbound) or `Ready` (outbound) carrying its own RTP endpoint. Commands and events travel
  on that stream; audio is RTP pod to pod. If the stream breaks the node hangs up. This replaces
  the NATS offer and claim.
- **Roomr over gRPC.** Three nouns (Room, Call, Participant) and six RPCs: `CreateCall`,
  `EndCall`, `CreateRoom`, `EndRoom`, `AddParticipant`, `RemoveParticipant`, named from the
  caller's side. Roomr is the SIP and media edge, not an app server: no play, record or DTMF RPCs
  and no operations. An app plays its own audio on its RTP leg, records by adding a listener, and
  sends DTMF, holds and transfers on its control stream. `CreateCall` creates a room or joins
  `room_ref`; there is no `AnswerCall`, inbound calls are answered by the
  app on its stream. `RESOURCE_EXHAUSTED` at the node's limit. The NATS command subjects are
  retired.
- **Capacity and events on NATS.** The heartbeat gains `max_rooms`, `version` and `region`; the
  controller picks the eligible node with the most room to spare, the node is the final judge,
  and the controller retries up to 3 nodes. Events are keyed by call with sequence numbers and
  `metadata` (the former `labels`, opaque to the node), so any controller replica can follow a
  call. Roomr uses core NATS only and writes nothing to the session registry.
- **Rooms by header.** An inbound call carrying the configured room header joins the room if it
  exists on this node and creates it otherwise. Room refs are 128-bit random. The node never
  redirects. There is no room token.
- **Mixer, not an SFU.** Mix-minus at 16 kHz; participants that are SIP or plain RTP. SIP legs
  offer `opus/48000/2`, G.722, PCMU, PCMA in that order. Rooms live on one node.
- **Draining by health check.** Roomr serves `grpc.health.v1.Health` on its control port; on
  SIGTERM it reports `NOT_SERVING`, unregisters (`Expires: 0`), stops heartbeats, publishes
  `node.down`, keeps live rooms until they end or `drainWait`, then exits. It does not refuse
  calls while draining; only the `max_rooms` refusal stays.
- **Liveness per call, health per process.** "When media is expected, media must be present":
  Roomr and AppBridge each end a call whose RTP stops for `mediaTimeout` (15 s by default, like
  LiveKit; one key in `roomr.yaml` and one in `appbridge.yaml`), and the control stream's
  keepalive catches a dead peer. No component tracks another tier's members: node heartbeats go to
  the control plane only, AppBridge serves `grpc.health.v1` and publishes no heartbeat or registry
  lease, lost calls come from the node's `call.ended` (`app_gone`), sent once per `callRef`, and a
  region's status uses AppBridge readiness and the nodes' room counts.
- **Light configuration.** One `roomr.yaml` and a single `-config` flag. Optional features (SIP
  TLS, SDES-SRTP, gRPC TLS) are off by default. A minimal `roomr.yaml` is at the end of
  design.md.
- **Ports.** Inside the cluster no coordination is needed (pod IPs are unique and ports travel on
  the control stream); one RTP range serves every leg, advertised for legs that leave the
  cluster.
- **BREAKING (internal contracts):** `appbridge.incoming`, `appbridge.outbound`, the
  `media.<nodeId>.commands` subjects, `call.incoming`, `participant.add`, `participant.dial`,
  `ring`, `answer` and the `X-Session-Count` and `X-DOD-Number` built-ins are retired. Apps are not
  affected: the session protocol (`voice-session`) is unchanged.

Out of scope now, as agreed: video, rooms spanning nodes (cascading), 48 kHz mixing, seeding the
SIP proxy's affinity for room-header joins, and speech or SIP capture in the node.

## Deferred

Two things from the target design are not part of this change and become follow-up changes:

- **WebRTC participants**: browsers terminating on the node (pion/webrtc, ICE on one UDP port,
  DTLS-SRTP), `AddParticipant` with an SDP offer, and the `talk-in-browser` delta. Browser calls keep
  RTPEngine meanwhile.
- **Passthrough mode**: forwarding two-party rooms on the same codec without decoding.

## Removed from the first draft

Room token (JWT) for joins; edge mTLS and `requireEncryption`; Roomr's session-registry KV writes;
netguard and `allowedDestinations` in Roomr (tenant hold-music URLs are validated upstream by
the apiserver and AppBridge); the duplicate command-line flags; `trustedSources`; `cpu_idle`;
refusal while draining and the `draining` heartbeat field; the debug HTTP server; the OTLP log
bridge; separate public and app-leg RTP ranges; `onMissingRoom`; the unknown-field scenarios; the
`callDedupeWindow` and `outboundTransport` keys.

## Naming

The user asked for a name with the weight of "Routr", not a technical label. Candidates, each
checked for an obvious conflict with a known open-source media or telephony project or an npm/Go
package of the same name:

| Candidate | Why | Conflict check |
| --- | --- | --- |
| Tutti | Italian for "all together": the moment every voice in the score plays at once, which is exactly what a mixer does. Two syllables, easy to say in any language, sits next to Routr and Fonoster's Romance-language root (fono). | No audio, telephony, npm or Go project of that name found; tutti.ch is a Swiss classifieds site, unrelated. |
| Mixr | The obvious sibling of Routr (verb, dropped vowel). Says what it does. | `chris-mclennan/mixr` (a small Rust tool) and the defunct Microsoft "Mixer" streaming brand plus `@mixer/*` npm packages; reads as a label more than a name. |
| Chorus | Many voices as one; memorable. | Crowded: Chorus.ai (ZoomInfo), Kodi's Chorus web UI, a Nostr relay named chorus, a VST effect. |
| Timbre | The quality that makes a voice recognisable; audio-native. | npm `timbre` (archived JS audio library) and a Rust crate `timbre`; the npm name is taken. |
| Mezzo | "Middle" in Italian: the thing in the middle of every call; mezzo-soprano gives it a voice. | Only a desktop music player of that name; no telephony or package conflict found. |
| Rondo | A musical form whose theme keeps returning; short and warm. | No conflict found, but the meaning is loose for a mixer. |
| Tessera | One tile of a mosaic: each node is a tile, many tiles make the picture. | No conflict found; less voice-related than the others. |
| **Roomr** | Rooms are the core concept, and it follows the Routr pattern: Routr routes calls, Roomr hosts the rooms they meet in. | Near-collisions (Roomler, roomor) and it sounds like "rumor". |

**Chosen: Roomr** (repository `fonoster/roomr`). The room is the node's central idea, and the name
sits beside Routr as a pair: "Routr routes, Roomr hosts the room." The near-collisions found are
small and unrelated to telephony. This change uses Roomr as the product name in prose; the
capability folders stay `roomr` and `media-control`. In code and deployment the node is
`roomr`: the gRPC service `roomr.v1.Roomr`, the Go module `go/roomr`, the image `fonoster/roomr`,
the config file `roomr.yaml`, the `ROOMR_*` variables and the NATS user `roomr`. Its SIP identity
at Routr (the Peer `sip:roomr@<domain>`, username `roomr`) is unchanged, since numbers
already point at it.

## Capabilities

### Modified Capabilities

- `roomr`: inbound calls open a control stream instead of a NATS offer; codec order puts Opus
  first; registration becomes an optional configured capability (renamed from the Routr
  requirement); crash, limits and encryption are restated without component names; "Draining
  nodes take no new rooms" is removed in favour of a health-check drain; the "no recording"
  requirement is renamed to "the node never records" (recording is a listener). Added:
  room header, isolation, one RTP range, one call ref, silent legs, draining by health check, the
  room limit as the only admission limit.
- `media-control`: the NATS command contract is replaced by gRPC. Renamed and modified: the
  command list (now the Roomr RPC list), the app leg and its RTP negotiation (now on the
  control stream), outbound placement (now `CreateCall`), liveness (now capacity). Removed: NATS
  request and reply, "add a participant is the one primitive", AppBridge claim, replica
  ownership of outbound calls. Added: the control stream, room and participant RPCs, DTMF sent on
  the control stream, events keyed by call. Transfer, listeners, hold, maximum duration, ringing and endings are
  modified to travel on the stream.
- `control-plane`: node selection uses the heartbeat score and retries up to 3 nodes with
  `CreateCall`; NATS no longer carries media commands; AppBridge is reachable as a Service; the
  apiserver writes its own `placements.<callRef>` entries.
- `voice-session`: session ending, "the Roomr node receives only control" and app routing are
  restated against the control stream (`Start` headers instead of `call.incoming`).
- `deployment`: the chart allows pod-to-pod RTP, exposes AppBridge's session endpoint, guards
  Roomr's ports by network isolation and drains by readiness.
- `conformance`: a Roomr node suite covering Roomr, the control stream and the mixer.
- `workspace-webhooks`: a crashed AppBridge's calls get `call.ended` (`appbridge-lost`) from the
  node's `call.ended`, not from expired registry leases.
- `private-regions`: region status reports AppBridge readiness (gRPC health) and active calls from
  the nodes' heartbeats.
- `developer-environment`, `service-config`: the node is named Roomr: its source is `go/roomr`, its
  dev script `dev:roomr`, its config file `roomr` (the only flag is `-config`) and its variables
  `ROOMR_*`.

Requirements that stay as they are: `roomr` "DTMF is detected three ways" and "Capacity
bar"; `media-control` "Participants and tracks are kind-neutral".

## Impact

- `go/roomr`: new gRPC server (Roomr) and client (control stream), gRPC health, configuration
  schema (`sip.registrations`, `sip.roomHeader`, `sessionEndpoint`), heartbeat fields, event
  keying, Opus-first SDP, removal of the NATS command and offer paths and of the items under
  "Removed from the first draft".
- `mods/appbridge`: a gRPC server for the control stream behind a Kubernetes Service; `RtpLink`
  keeps its RTP role, the `participant.add` offer and the `appbridge.incoming` queue group go away.
- `mods/apiserver/src/outbound`: `createNodeDirectory` scores by `1 - rooms / max_rooms`,
  `placeOutboundCall` calls `CreateCall` over gRPC with `X-DOD-Number` in the pass-through
  headers and retries up to 3 nodes.
- `mods/conformance`: fakes for the session endpoint and the controller; scenario files move
  from NATS commands to gRPC.
- Helm chart and Compose: appbridge Service, NetworkPolicy for RTP, gRPC readiness probe, node RTP
  range (Compose publishes only RTP).
- The open change `fix-config-and-placement-gaps` also modifies control-plane "Call creation
  picks the least-loaded Roomr node" (skip nodes at their limit). This change's version of that
  requirement includes the same scenario, so either archive order leaves the spec consistent.
- Risk: the control stream is new code on every call; it runs beside the NATS offer behind a flag
  until the two measurements in design.md pass.

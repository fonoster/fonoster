## Why

The media node shipped by `add-media-node` works, but it is wired to Fonoster by name: it reads
`X-App-Ref`, `X-Call-Ref` and `X-DOD-Number`, registers to Routr with `X-Session-Count`, offers
every inbound call to the gateway replicas over NATS (`gateway.incoming`) and waits for one of
them to claim it, and takes its commands as NATS request and reply. That coupling makes the node
hard to reuse outside Fonoster, hard to test alone, and it puts a race (the claim) on the path of
every call. The design document "Media Node: Target Design" (2026-10-17) settles a different
shape: an isolated, generic mixer that speaks plain SIP, RTP and WebRTC, exposes one small gRPC
service to its controller, opens one gRPC control stream per call to a configured session
endpoint, and reports capacity and events on NATS. This change turns that design into
requirements and supersedes the current `media-node` and `media-control` specs.

## What Changes

- **Isolation.** The node knows no other component by name. Its configuration holds an outbound
  proxy, zero or more registrations (registrar, AOR, optional digest auth, header templates), a
  session endpoint and the names of two optional headers (room, token). Every other SIP header is
  passed through untouched, inbound (in `Start`) and outbound (from `CreateCall`).
- **One control stream per call, audio stays on RTP.** For every call the node opens a new gRPC
  connection to the session endpoint (in Fonoster, the gateway behind a Kubernetes Service) and
  sends `Start` with the call's identity, headers and the node's RTP endpoint; the app answers with
  `Answer` (inbound) or `Ready` (outbound) carrying its own RTP endpoint. Commands and events travel
  on that stream; audio is RTP pod to pod. If the stream breaks the node hangs up. This replaces
  the NATS offer and claim.
- **Roomr over gRPC.** Three nouns (Room, Call, Participant) and nine RPCs: `CreateCall`,
  `EndCall`, `CreateRoom`, `EndRoom`, `Join`, `Leave`, `Play`, `Record`, `SendDtmf`. `CreateCall`
  creates a room or joins `room_ref`; there is no `AnswerCall`, inbound calls are answered by the
  app on its stream. `RESOURCE_EXHAUSTED` at the node's limit. The NATS command subjects are
  retired.
- **Capacity and events on NATS.** The heartbeat gains `max_rooms`, `cpu_idle`, `version` and
  `region`; the controller picks the eligible node with the most room to spare, the node is the
  final judge, and the controller retries up to 3 nodes. Events are keyed by call with sequence
  numbers and labels, so any controller replica can follow a call.
- **Rooms by header, with optional JWT.** An inbound call carrying the configured room header
  joins the room if it exists on this node and creates it otherwise (`onMissingRoom: reject`
  gives 404). An optional JWT (configurable header, public key, audience, `room_ref` claim) guards
  the join. The node never redirects.
- **Mixer, not an SFU.** Mix-minus at 16 kHz, a passthrough fast path for two-party rooms on the
  same codec, participants that are SIP, plain RTP or WebRTC (ICE on one UDP port per node,
  DTLS-SRTP, Opus). SIP legs offer `opus/48000/2`, G.722, PCMU, PCMA in that order. Rooms live on
  one node.
- **Ports.** Inside the cluster no coordination is needed (pod IPs are unique and ports travel on
  the control stream); SIP and RTP legs that leave the cluster need reachable ranges; WebRTC uses
  one UDP port per node.
- **BREAKING (internal contracts):** `gateway.incoming`, `gateway.outbound`, the
  `media.<nodeId>.commands` subjects, `call.incoming`, `participant.add`, `participant.dial`,
  `ring`, `answer` and the `X-Session-Count` and `X-DOD-Number` built-ins are retired. Apps are not
  affected: the session protocol (`voice-session`) is unchanged.

Out of scope now, as agreed: video, rooms spanning nodes (cascading), 48 kHz mixing, and
seeding the SIP proxy's affinity for room-header joins.

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
capability folders stay `media-node` and `media-control`. In code and deployment the node is
`roomr`: the gRPC service `roomr.v1.Roomr`, the Go module `go/roomr`, the image `fonoster/roomr`,
the config file `roomr.yaml`, the `ROOMR_*` variables and the NATS user `roomr`. Its SIP identity
at Routr (the Peer `sip:medianode@<domain>`, username `medianode`) is unchanged, since numbers
already point at it.

## Capabilities

### Modified Capabilities

- `media-node`: rooms gain the passthrough fast path and mixed participant kinds; inbound calls
  open a control stream instead of a NATS offer; codec order puts Opus first; registration becomes
  an optional configured capability (renamed from the Routr requirement); draining, crash, limits
  and encryption are restated without component names; the "no recording" requirement is renamed
  and narrowed to speech and SIP capture because `Record` is now an operation. Added: passthrough,
  WebRTC participants, room header, room token, isolation, port ranges.
- `media-control`: the NATS command contract is replaced by gRPC. Renamed and modified: the
  command list (now the Roomr RPC list), the app leg and its RTP negotiation (now on the
  control stream), outbound placement (now `CreateCall`), liveness (now capacity). Removed: NATS
  request and reply, "add a participant is the one primitive", the gateway claim, replica
  ownership of outbound calls. Added: the control stream, room and participant RPCs, operations,
  events keyed by call. Transfer, listeners, hold, maximum duration, ringing and endings are
  modified to travel on the stream.
- `control-plane`: node selection uses the heartbeat score and retries up to 3 nodes with
  `CreateCall`; NATS no longer carries media commands; the gateway is reachable as a Service.
- `voice-session`: session ending, "the media node receives only control" and app routing are
  restated against the control stream (`Start` headers instead of `call.incoming`).
- `deployment`: the chart allows pod-to-pod RTP and exposes the gateway's session endpoint.
- `talk-in-browser`: browser media terminates on the node once WebRTC lands; RTPEngine is no
  longer in the path.
- `conformance`: a media node suite covering Roomr, the control stream and the mixer.
- `developer-environment`, `service-config`: the node is named Roomr: its source is `go/roomr`, its
  dev script `dev:roomr`, its config file `roomr` and its variables `ROOMR_*`.

Requirements that stay as they are: `media-node` "DTMF is detected three ways" and "Capacity
bar"; `media-control` "Participants and tracks are kind-neutral".

## Impact

- `go/roomr`: new gRPC server (Roomr) and client (control stream), configuration
  schema (`sip.registrations`, `sip.roomHeader`, `session.endpoint`), heartbeat fields, event
  keying, Opus-first SDP, passthrough, WebRTC transport, removal of the NATS command and offer
  paths.
- `mods/appbridge`: a gRPC server for the control stream behind a Kubernetes Service; `RtpLink`
  keeps its RTP role, the `participant.add` offer and the `gateway.incoming` queue group go away.
- `mods/apiserver/src/outbound`: `createNodeDirectory` scores by `1 - rooms / max_rooms`,
  `placeOutboundCall` calls `CreateCall` over gRPC with `X-DOD-Number` in the pass-through
  headers and retries up to 3 nodes.
- `mods/conformance`: fakes for the session endpoint and the controller; scenario files move
  from NATS commands to gRPC.
- Helm chart and Compose: gateway Service, NetworkPolicy for RTP, WebRTC port, node RTP ranges.
- The open change `fix-config-and-placement-gaps` also modifies control-plane "Call creation
  picks the least-loaded media node" (skip nodes at their limit). This change's version of that
  requirement includes the same scenario, so either archive order leaves the spec consistent.
- Risk: the control stream is new code on every call; it runs beside the NATS offer behind a flag
  until the two measurements in design.md pass.

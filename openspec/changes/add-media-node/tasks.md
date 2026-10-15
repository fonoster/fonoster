> Build approved 2026-10-15 (media-control amended after the spec review; see build-log.md).

## 1. Conformance assets

- [x] 1.1 SIP test caller and callee (SIPp or a `sipgo` harness) that can offer each codec, send DTMF three ways and play known tones
- [x] 1.0 `media-control` scenario files (`kind: media-control`) for every command and event, run against the fake node now and the Go node later
- [x] 1.2 Fake gateway and fake control plane that speak `media-control` and assert commands, events and echoed ids (Go e2e rig and `cmd/loadgen` play the gateway and the control plane's `room.create` + `participant.dial`; the TS harnesses run the scenarios; placement tests come with 3.3)
- [x] 1.3 Fake Routr registrar that records `X-Session-Count` per REGISTER
- [x] 1.4 Mix-minus checker: injects tones per participant and verifies what each participant hears
- [x] 1.5 Load harness for 200 G.711 rooms on 2 vCPU with frame-drop and keypress accounting; an Opus run reported separately (laptop numbers in MN-B17; re-run on a 2 vCPU VM before release)
- [x] 1.6 Network impairment runs (loss, jitter, reordering) on the same harness

## 2. Media node implementation (Go)

- [x] 2.1 Module skeleton with `sipgo` and `livekit/media-sdk` behind our own interfaces
- [x] 2.2 Routr registration with `X-Session-Count`, short interval and re-register on load change (verified live against Routr 2.15.1, CO-B1; fake registrar tests and a least-sessions check both ways, MN-B16)
- [x] 2.3 Inbound INVITE handling, header extraction, `call.incoming` claimed by request and reply (500 ms, one retry, then 503), `ring`, answer on command
- [x] 2.4 Codecs PCMU, PCMA, G.722, Opus and transcoding to the room format
- [x] 2.5 Rooms: mix-minus mixer, track-based participants, `unsupported_track_kind`, 10-participant limit
- [x] 2.6 Session participant audio path to and from the gateway
- [x] 2.7 `participant.dial` through Routr with progress events
- [x] 2.8 Transfer modes `cold`, `warm` and `refer`
- [x] 2.9 Hold and resume by mixing (MN17), node-fetched hold music (the warm-transfer hold comes with 2.8)
- [x] 2.10 DTMF: RFC 4733, SIP INFO, in-band fallback, de-duplication
- [x] 2.11 Listeners: per-track forks, no audio from listeners
- [x] 2.12 Optional TLS and SRTP toward the edge, with refusal of plain traffic when required (gateway leg SRTP in MN-B19; recording listeners under encryption still open)
- [x] 2.13 Maximum call duration, drain on SIGTERM, maximum wait, crash behavior with sealed records
- [x] 2.14 `node.heartbeat` every 2 s and `node.down` on clean exit; `reason` and `sipStatus` on `participant.left` and `room.ended`; media timeout

## 3. Control plane

- [x] 3.1 `media-control` contract definition over NATS request and reply (PL3) with additive-only rules
- [x] 3.4 Gateway RTP leg: `rtp` offer and answer in `participant.add`, RTP send and receive, SRTP when encryption is on (MN13)
- [x] 3.2 Session registry entries per node and per room in NATS JetStream KV (add-platform HD-B3, add-media-node HD-B4)
- [x] 3.3 Outbound placement: least-loaded non-draining node, room-to-node mapping (from heartbeats until 3.2, CB-B2)

## 4. Migration and docs

- [x] 4.1 Routr peer configuration for media nodes with `least-sessions` (plus per-app and per-number routing, CO-B4)
- [x] 4.2 Remove the Asterisk image, dialplan and ARI handling from the apiserver after cutover (CB-B3, CB-B4, CB-B6)
- [ ] 4.3 Move recording to the policy listener and AMD to a voice-worker listener
- [x] 4.4 Operator guide: RTP ports, encryption switch, drain behavior, limits (`docs/operators/cutover.md` section 5)
- [x] 4.5 Asterisk retirement notes, including the end of `{appRef}_{id}.wav` recordings and GSM (`docs/operators/cutover.md` section 6)

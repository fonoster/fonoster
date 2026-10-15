> Build deferred: do not start until the owner approves the build.

## 1. Conformance assets

- [ ] 1.1 SIP test caller and callee (SIPp or a `sipgo` harness) that can offer each codec, send DTMF three ways and play known tones
- [ ] 1.2 Fake gateway and fake control plane that speak `media-control` and assert commands, events and echoed ids
- [ ] 1.3 Fake Routr registrar that records `X-Session-Count` per REGISTER
- [ ] 1.4 Mix-minus checker: injects tones per participant and verifies what each participant hears
- [ ] 1.5 Load harness for 200 G.711 rooms on 2 vCPU with frame-drop and keypress accounting; an Opus run reported separately
- [ ] 1.6 Network impairment runs (loss, jitter, reordering) on the same harness

## 2. Media node implementation (Go)

- [ ] 2.1 Module skeleton with `sipgo` and `livekit/media-sdk` behind our own interfaces
- [ ] 2.2 Routr registration with `X-Session-Count`, short interval and re-register on load change
- [ ] 2.3 Inbound INVITE handling, header extraction, `call.incoming`, answer on command
- [ ] 2.4 Codecs PCMU, PCMA, G.722, Opus and transcoding to the room format
- [ ] 2.5 Rooms: mix-minus mixer, track-based participants, `unsupported_track_kind`, 10-participant limit
- [ ] 2.6 Session participant audio path to and from the gateway
- [ ] 2.7 `participant.dial` through Routr with progress events
- [ ] 2.8 Transfer modes `cold`, `warm` and `refer`
- [ ] 2.9 Hold and resume (pending the open question on hold behavior)
- [ ] 2.10 DTMF: RFC 4733, SIP INFO, in-band fallback, de-duplication
- [ ] 2.11 Listeners: per-track forks, no audio from listeners
- [ ] 2.12 Optional TLS and SRTP toward the edge, with refusal of plain traffic when required
- [ ] 2.13 Maximum call duration, drain on SIGTERM, maximum wait, crash behavior with sealed records

## 3. Control plane

- [ ] 3.1 `media-control` contract definition over NATS request and reply (PL3) with additive-only rules
- [ ] 3.4 Gateway RTP leg: `rtp` offer and answer in `participant.add`, RTP send and receive, SRTP when encryption is on (MN13)
- [ ] 3.2 Session registry entries per node and per room in NATS JetStream KV
- [ ] 3.3 Outbound placement: least-loaded non-draining node, room-to-node mapping

## 4. Migration and docs

- [ ] 4.1 Routr peer configuration for media nodes with `least-sessions`
- [ ] 4.2 Remove the Asterisk image, dialplan and ARI handling from the apiserver after cutover
- [ ] 4.3 Move recording to the policy listener and AMD to a voice-worker listener
- [ ] 4.4 Operator guide: RTP ports, encryption switch, drain behavior, limits
- [ ] 4.5 Asterisk retirement notes, including the end of `{appRef}_{id}.wav` recordings and GSM

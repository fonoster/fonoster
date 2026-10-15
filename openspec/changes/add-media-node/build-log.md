# add-media-node build log

## 2026-10-15 (spec review rulings, with the owner)

A separate reviewer read every rebuild spec; the owner ruled on each finding one by one.

### MN-R1. Rulings applied to the specs

- S1: Routr's `X-App-Ref` decides the app (MN14); the gateway's number routing file is dev-only.
- S2: `ring`, `reason` + `sipStatus` on endings, `node.heartbeat` / `node.down`, RTP block fields,
  listener RTP destinations, `unknown_command` for unknown commands (MN16).
- S7: `call.incoming` and `gateway.outbound` are claimed by request and reply (MN15, PL3 revised).
- S9: hold by mixing with node-fetched music; warm transfer holds the caller, 30 s no-answer (MN17).
- S6: SIP traces dropped for the first release (MN10 revised).
- Media-control scenarios (`kind: media-control`) are the next asset (tasks 1.0).

## 2026-10-15 (first Go slice)

### MN-B1. Where the code is

- `go/medianode` (module `github.com/fonoster/fonoster/go/medianode`), outside `mods/` so npm
  workspaces and lerna never see it. Go 1.25 (pinned `nats.go` v1.48 to avoid a 1.26 toolchain).
- `internal/node` (rooms, mixer, media-control), `internal/sipua` (sipgo UAS and Routr REGISTER),
  `internal/rtpio`, `internal/audio`, `internal/sdp`, `internal/caller` + `cmd/sipcaller` (the SIP
  caller bot, conformance 2.5 / media-node 1.1), `cmd/medianode`.

### MN-B2. `livekit/media-sdk` not used yet (MN7 deferred, not reversed)

- The slice needs only PCMU, L16 and RFC 4733, which are a few hundred lines; the mixer is a 20 ms
  mix-minus tick with a 4-frame inbox per participant (no real jitter buffer yet). media-sdk comes
  in with Opus, G.722, PCMA, SRTP and the jitter buffer, behind the same interfaces.

### MN-B3. Slice behavior choices

- `call.incoming` goes out only after the caller's room and RTP port exist; `answer` writes the SDP
  answer then. An INVITE with no PCMU gets 488 (other codecs are next slices).
- `hangup` before answer answers the INVITE with `sipStatus` (default 480); after answer it sends
  BYE. Ending reason is `rejected` with a status, `removed` without.
- Commands that exist in the contract but not in this version (`participant.dial`, transfers,
  listeners) answer `error` `not_implemented`; unknown ones answer `unknown_command`.
- Hold music: mono PCM16 WAV at 8 or 16 kHz, looped; anything else logs and plays silence.

### MN-B4. Results

- `go test -race ./...`: unit tests and 4 end-to-end tests (inbound slice, unclaimed → 503, reject
  404 and node BYE, heartbeats) pass.
- media-control scenarios: 11 of 20 pass against the Go node (9 need dial, transfers, listeners or
  fake-only measurements); all 20 pass against the fake node.
- voice-session through gateway → Go node → caller bot: 29 of 36 pass (7 need transfers or
  fake-only measurements). This is the first real-SIP, real-RTP run of the whole stack.
- Not yet tried against a real Routr (registration and `least-sessions` routing).

### MN-B5. Second slice: dial and transfers

- `participant.dial`, cold, warm and refer transfers go through `-outbound-proxy` (Routr in
  production, the caller bot in tests). Failed dials map 486/600 → `busy`, 408/480/487 →
  `no_answer`, anything else → `failed`, with `sipStatus`.
- Room rule: when a phone party leaves and no phone party remains, or one phone party is left
  alone, the room ends and the one left gets a BYE (a cold-transferred caller hanging up ends the
  call for the new party).
- Hold is per participant now (the caller), so a warm transfer's session and new party talk while
  the caller hears music.
- A debug endpoint (`-debug`, `GET /rooms`) shows rooms and hold state; tests read `media.held`
  from it. It is not part of media-control.
- Results: Go end-to-end tests 10/10 (race-clean). media-control scenarios on the Go node 19/20
  (listeners missing). voice-session through gateway → Go node → caller bot 35/36 (the remaining
  one drops media with a fake-only action; the real media timeout is 30 s).

### MN-B6. What Routr actually does (read from ~/Projects/routr)

- `least-sessions` reads `X-Session-Count` only from the peer's authenticated REGISTER
  (`mods/location/src/helper.ts`, `handlers/register.ts`); the count changes only on re-register.
  That matches MN3: the node re-registers on a timer and after load changes.
- A Number routes to the Peer whose `aor` equals the Number's `aorLink`, so different Numbers can
  go to different peers (media nodes next to Asterisk during cutover). But Fonoster's sipnet
  points every app-linked Number at `sip:voice@default` (`mods/sipnet/src/numbers/
  convertToRoutrNumber.ts`), so side-by-side routing needs a sipnet change (per-app or per-number
  aorLink).
- `X-App-Ref` reaches the INVITE through `Number.extraHeaders` set by sipnet; MN14 holds.
- Routr has no per-call pcap but can export HEP through `heplify` (`HEPLIFY_OPTIONS`); SIP traces
  can come back later as HEP to Homer (MN10).
- Peer auth: Credentials + Peer (`aor`, `username`, `credentialsRef`) + Number (`aorLink`,
  `trunkRef`) + Trunk. Not yet tried live; that needs a throwaway Routr with its own database.

### MN-B7. Listeners

- `listener.attach` takes one RTP destination per track and sends that participant's audio
  unmixed (silence while it is silent); listeners have no inbound path, so they cannot speak.
  `listener.detach` closes the forks. All 20 media-control scenarios now pass on the Go node.

### MN-B8. Live Routr check not done yet

- A throwaway `fonoster/routr-one:2.15.1` with its internal database stalls at start: its startup
  runs an unpinned `npx prisma`, which resolves to `prisma@8.0.0-rc.23` and never finishes. The
  shared platform-refresh Routr (external database) was deliberately left untouched. Next: a
  throwaway Routr against its own Postgres container, then Credentials + Peer
  (`sip:medianode@...`, least-sessions) + Trunk (`inboundUri`) + Number (`aorLink`,
  `extraHeaders` X-App-Ref), and a caller-bot INVITE through it. The caller bot will need a
  Request-URI host different from its destination (Routr finds the Trunk by Request-URI host).

## 2026-10-15 (media slice: codecs, jitter buffer, DTMF, encryption, limits, load)

### MN-B9. Libraries: media-sdk still not used; three small pieces instead

- `livekit/media-sdk` v0.1.1 needs Go 1.26; this module builds with the local Go 1.25 toolchain
  (`GOTOOLCHAIN=local`). MN7 stays the direction; revisit when the toolchain moves.
- G.722: `gotranspile/g722` (pure Go, the same package media-sdk wraps). SRTP: `pion/srtp/v3`.
  PCMA: our own table (40 lines). Opus: our own cgo wrapper of libopus (`internal/audio/opus.go`,
  Homebrew paths on macOS, `-lopus` on Linux). Builds without cgo, or with `-tags noopus`, drop
  Opus from offers instead of failing. Opus runs at 24 kbit/s, in-band FEC on, complexity 5
  (complexity 10 cost 2 cores for 200 rooms; 5 costs 1.25).
- New deps are Go-only (`go.mod`); nothing was added to npm.

### MN-B10. Codec negotiation

- SIP legs: PCMU, PCMA, G.722 and Opus. The node answers with the first codec in the caller's
  offer order that it supports; no common codec → `488` before any room exists. Dialed legs offer
  all four (PCMU first) plus `telephone-event/8000` on 101; Opus uses payload type 111.
- The room format stays L16 at 16 kHz; 8 kHz codecs use the existing linear up/down-sampling
  (fine for telephony; a proper resampler is a follow-up if listening tests ask for it).
- The caller bot offers any codec list (`DialOptions.Codecs`, `sipcaller` `codecs`), so each codec
  has an end-to-end test both ways (`TestEachCodecCarriesAudioBothWays`).

### MN-B11. Jitter buffer (replaces the 4-frame inbox)

- One per participant (`internal/jitter`): ordered by RTP sequence number, 40 ms playout delay,
  200 ms cap. A gap with later packets present is a loss: Opus conceals with its own PLC, the
  others repeat the last frame fading out over 3 frames. Late, duplicate and overflow packets are
  dropped and counted; an empty buffer re-prefetches; a jump of more than 200 ms resynchronizes.
- RFC 4733 packets share the stream's sequence numbers, so the buffer skips them. Without this,
  every keypress looked like 5 lost frames and added 100 ms of delay (found by the load harness).
- After 1 s above target + 40 ms the buffer skips one frame to win the delay back (counted as
  `trimmed`, not as a drop).
- Decoding moved from the receive goroutine to the room clock (stateful codecs decode in order).
  The clock replays up to 5 late ticks and counts anything beyond as missed (dropped) frames.
- The playout delay adapts: each late packet raises it one frame (up to 100 ms) by holding
  playout back one tick (counted as `stretched`); 10 s without late packets lowers it again.

### MN-B12. DTMF three ways

- SIP INFO: `application/dtmf-relay` (`Signal=7`, also 10/11 for `*`/`#`) and `application/dtmf`;
  matched to the leg by Call-ID; other bodies get `415`. Source `sip_info`.
- In-band: Goertzel on the decoded 16 kHz frames (`internal/dtmf`), only on legs without
  `telephone-event` and only until the leg sends its first INFO. A digit must last 40 ms to count
  and be absent 40 ms before the next one counts. Source `inband`.
- No double report: in-band is off whenever RFC 4733 is negotiated, and the same digit from a
  second source within 500 ms is dropped.

### MN-B13. Encryption (MN6) and the gateway leg's SRTP

- `-require-encryption`: SIP only over TLS (`-tls`, `-tls-cert`, `-tls-key`; no plain UDP/TCP
  listener; an INVITE that still arrives another way gets `403`), SIP legs must offer RTP/SAVP
  with an SDES `AES_CM_128_HMAC_SHA1_80` key (else `488`), dialed legs go out over TLS offering
  SAVP (`-tls-ca` verifies the edge). Without the switch, SAVP offers are still honored.
- Gateway leg: with encryption required, `participant.add` without `rtp.srtp` is refused with a
  new error code `encryption_required` (additive); with `srtp {suite, key}` the node answers its
  own key in its block, and plain RTP sent to that port is dropped. Listener blocks may carry
  `srtp`; the node encrypts with the listener's key since listeners only receive.
- Not done here: the gateway (TS) does not yet send `srtp`, so an encrypted deployment needs that
  gateway change before the session leg works (3.4 is checked but has no SRTP code).

### MN-B14. Limits and track kinds

- `participant.add` with any track `kind` other than `audio` (in `tracks` or `rtp.kind`) →
  `unsupported_track_kind`, room unchanged. The 11th participant → `room_full`, checked before
  any port is opened. Both have tests.
- Per-app maximum duration: optional `maxDurationSec` on `answer` or `room.create` (additive) can
  only lower the node's limit (`-max-duration`, 4 h). The call ends with `max_duration`, which the
  gateway maps to `session.end` `timeout`.

### MN-B15. Drain and crash

- SIGTERM runs `DrainAndWait(-drain-wait)`: the node reports itself full at once (an immediate
  REGISTER with `X-Session-Count: 1048576`), answers new INVITEs `503` and `room.create`
  `draining`, keeps its rooms, and exits when they end. After the maximum wait it ends the rest
  with `node_error` (apps get `session.end` `error`). A second signal stops waiting. On exit the
  node unregisters (`Expires: 0`) so Routr drops it at once.
- Crash: covered by the existing scenarios through the Go node (`node-killed`,
  `node-crash-ends-session`: `session.end` `error`, record failure `node_error`).

### MN-B16. Registration, and a live Routr check (closes MN-B8)

- Requests carry `rport` (Routr answers to where they came from, which matters behind NAT).
  The re-register threshold is configurable (`-reregister-delta`, default 5; interval
  `-register-every`, default 15 s; open question 2).
- Fake registrar tests (1.3): digest challenge, counts 0 → 2, drain → full within 250 ms, and an
  immediate REGISTER on a load change.
- Live Routr: a throwaway split stack (edgeport, dispatcher, location, connect, simpledata from
  the local images, YAML resources, no database; `e2e/testdata/routr`). Two nodes register as one
  least-sessions peer; Routr sent the call to the lighter node in both directions (A 3 vs B 0,
  then B 5 vs A 3), the call answered and carried audio. Signaling over TCP: Docker Desktop's UDP
  NAT rewrote sources so in-dialog responses got lost. The sipnet `aorLink` change (MN-B6) is
  still needed for side-by-side cutover.

### MN-B17. Load and impairment numbers (MacBook, node pinned to `GOMAXPROCS=2`)

- Harness: `cmd/loadgen` places SIP calls with the caller bot, plays the gateway over NATS
  (claim, L16 session participant, answer), sends audio both ways, presses a key on every call
  at an interval, and reads the node's counters (`GET /stats` on the debug endpoint).
- 200 G.711 rooms, 2 min: 0 dropped frames (node: 0 missed ticks, 0 late/lost/overflow; gateway
  side 1,204,489 frames, 0 sequence gaps), 4600/4600 keypresses reported once, node CPU 47% of
  one core on average (60% peak).
- 200 G.711 rooms, 30 min (the bar's duration), keypress every 10 s: 0 dropped frames (0 missed
  ticks, 0 late/lost/overflow; gateway side 18,005,978 frames, 0 sequence gaps; callers heard
  360,134 s of 360,119 s expected), 35,800/35,800 keypresses reported exactly once (200 of 200
  rooms exact), node CPU 41% of one core on average (64% peak).
- 200 Opus rooms, 1 min: 0 dropped, 2200/2200 keypresses, node CPU 125% (complexity 5; 203%
  with complexity 10). Opus-heavy load costs about 2.7x G.711.
- Impairment on the caller → node direction (keypresses impaired too), 200 G.711 rooms, 1 min
  each, with the adaptive delay; every run had 0 gaps on the node → gateway side and 2200/2200
  keypresses:
  - 2% loss: 12,034 frames concealed (the injected loss), nothing late.
  - 5% of packets held back 40 ms: 10 late + 9 concealed of 1.2 M (1,869 + 1,868 with the earlier
    fixed 40 ms delay).
  - 1% loss + up to 20 ms jitter + 2% reorder: 6,265 concealed (mostly the injected loss), 109
    late (2,121 with the fixed delay).
  - Up to 30 ms jitter alone (fixed delay): 2 late + 2 concealed.
- Caveat: a laptop core is faster than a cloud vCPU and the harness shares the machine; the bar
  should be re-run on a 2 vCPU VM before release.

## 2026-10-15 (cutover stream)

### CO-B1. First call through a real Routr (closes MN-B8)

- Throwaway rig: `fonoster/routr-one:2.15.1` with `START_INTERNAL_DB=false` and its own Postgres
  container; the image's own start command runs `npx prisma@6.12.0 migrate deploy` against the
  external database (the same path platform Compose uses), so no extra migration step is needed.
  Files: `mods/gateway/test/routr/` (compose, EdgePort config on 15560, `rig.sh`, SDK provisioning,
  location reader). Doc: `docs/operators/routr-live-test.md`.
- `routr.live.test.ts` (skipped unless `ROUTR_LIVE=1`): the node registers as Peer `medianode`
  (least-sessions) and Routr's location shows `sessionCount` 0 → 1 during the call → 0; the bot
  INVITEs `+17853178070@trunk.rig.local` through Routr; the app gets `session.start` with
  `appRef` from the Number's `x-app-ref`; audio flows both ways; the BYE crosses Routr; a node
  stopped with SIGTERM removes its route. 3/3 pass, repeatably.
- Caller bot: `DialVia(target, requestHost, ...)` and `requestHost` on `POST /calls` (Routr finds
  the Trunk by Request-URI host); `-sip-advertise` puts another host in Via and Contact (Routr in
  Docker reaches the host as `host.docker.internal`).
- The check reads Routr's internal location service (port exposed only in the rig) with a fresh
  `callId` per lookup: Routr caches `findRoutes` results per AOR + callId.

### CO-B2. The node sends SIP from its listening port, with rport (shared `sipua.go`)

- Routr stores the REGISTER's source address and port (received/rport) as the route, not the
  Contact. The node used an ephemeral client socket, so Routr's INVITEs went to a closed port
  behind NAT (Docker for Mac shows it as an outside address). Now `sipua.New` binds the UDP
  socket and the client sends from it, with `rport`. It is correct without NAT too, and needed
  behind cloud NAT. e2e tests unchanged and passing.
- New flag `-register-every` / `MEDIANODE_REGISTER_EVERY` (default 15 s). Below a change of 5
  rooms the count only reaches Routr on the timer (MN3 as built); the rig uses 2 s.

### CO-B3. Drain re-registers at once; exit unregisters

- SIGTERM now kicks a REGISTER right away, so Routr sees "full" without waiting for the timer. On
  exit the node sends REGISTER with Expires 0 before `node.down`. Without it a stopped node's
  route stayed up to 30 s and least-sessions picked it (seen live: the call never arrived). Only
  crashes leave dead routes now.

### CO-B4. Per-app and per-number routing in sipnet (task 4.1)

- `createNumberRouting` picks an app-linked Number's `aorLink`. Order: per-number pin, then a
  per-app lookup (meant for a future `Application.engine` column), then the `rebuildApps` /
  `asteriskApps` lists, then the default (`asterisk`). With no config, behavior is unchanged.
- The apiserver reads `routr.engines` and `routr.mediaNodePeer`. It creates the least-sessions
  media-node Peer (`sip:medianode@default`, `maxContacts -1`) only when a password is set. The
  Asterisk AOR now comes from `routr.defaultPeer.aor`; before, sipnet used the constant and
  ignored a customized AOR.
- Routr stores `aorLink` per Number, so flipping an app needs a rewrite: `repointNumbers` and
  `repointNumbersCli.js` (dry run by default) rewrite only Numbers with an `x-app-ref` header.
  Header names match case-insensitively. Checked live against the rig: rollback and cutover both
  changed the Number and kept its trunk and headers.
- Routr's updates need the full object (`name` on Numbers; `name` and `username` on Credentials),
  so `repointNumbers` sends the name back.

### CO-B5. Dependencies and links

- No new npm dependencies. The rig helpers use `@routr/sdk`, `@routr/common` and `@grpc/*` from
  the root `node_modules`; they are test-only and not declared in the gateway's package.json.
- Worktree link `mods/apiserver/node_modules/@fonoster/sipnet → ../../../sipnet` (not committed),
  so the apiserver typechecks against this branch's sipnet.

### CO-B6. Found along the way (not fixed here)

- `GET /api/recordings/:id` (`mods/apiserver/src/core/httpBridge.ts`) joins the raw id into a
  path, so it may allow path traversal. It is retired with Asterisk (task 4.5); worth a fix
  before then.
- RTP ports come from the OS ephemeral range; there is no configurable range yet (cutover
  runbook, section 5).

### MN-B18. Merge with the cutover and platform streams

- One implementation each: registration uses the cutover stream's `send` / `Kick` / `Unregister`
  (CO-B2, CO-B3) and listening-socket UDP with rport; this stream's `ReregisterDelta`, TLS
  listener and INFO handling sit on top. With `-require-encryption` the plain UDP socket is not
  bound at all. `Drain` calls `Kick` through `OnDrain`; `main` uses `DrainAndWait` (ends rooms
  with `node_error` after `-drain-wait`), then unregisters, then `node.down`.
- Flags from both sides kept (`-register-every` with `MEDIANODE_REGISTER_EVERY`,
  `-reregister-delta`, `-media-timeout`, `-rtp-port-min/-max`, TLS and encryption flags);
  `-max-duration`, `-max-participants` and `-drain-wait` take the platform stream's env vars.
- Caller bot: one `Options` (`Host`, `SIPAdvertise`, `TLS`, `ClientTLS`); `DialVia` is
  `DialWith` with `RequestHost`.

### MN-B19. Gateway leg SRTP (closes the gap in MN-B13)

- `mods/gateway/src/media/srtp.ts`: AES_CM_128_HMAC_SHA1_80 (RFC 3711, key derivation rate 0,
  rollover counter per SSRC) on Node's `crypto`; no new dependency.
- `RtpLink.enableSrtp()` offers `srtp {suite, key}` in `participant.add`, requires the node's
  key in the acknowledgement, encrypts what it sends and drops anything that does not
  authenticate. Switched on by the gateway config `rtp.srtp: true` (set it when nodes run with
  `-require-encryption`).
- Tests: round trip across a sequence wrap, plain/tampered/wrong-key packets dropped, and two
  SRTP legs against the Go node in encryption-required mode (pion/srtp interop; a plain leg gets
  `encryption_required`).
- Still open: recording listeners under encryption. The node requires `srtp` on listener blocks
  too, and `@fonoster/callrecord`'s Recorder does not send or decrypt it yet.

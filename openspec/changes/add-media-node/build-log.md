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

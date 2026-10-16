# Upgrading from Asterisk to the media nodes

This release retires Asterisk (cleanbreak, 2026-10-15). There is no side-by-side mode any more:
every app-linked number points at the media nodes, and the apiserver no longer talks ARI. This
runbook upgrades an existing installation in one window.

```
before: carrier ─▶ Routr ─▶ Peer sip:voice@default (Asterisk) ─ARI─▶ apiserver ─gRPC─▶ app (VoiceServer)
now:    carrier ─▶ Routr ─▶ Peer sip:medianode@default (Go media nodes, least-sessions)
                            ─media-control (NATS)─▶ gateway ─WebSocket─▶ app (session protocol)
```

Routr decides per Number: a Number goes to the Peer whose AOR equals its `aorLink`. The upgrade
changes `aorLink`, nothing else. The Number keeps its `x-app-ref` header, and the gateway uses it
to pick the app.

## 1. Before you start

1. **Media-node Peer in Routr.** Set `routr.mediaNodePeer.password` in `fonoster.yaml`. The
   apiserver then creates the Peer at start: AOR `sip:medianode@default`, username `medianode`,
   `LEAST_SESSIONS`, any number of contacts. To create it by hand, see
   `mods/gateway/test/routr/provision.ts`.
2. **Media nodes.** Run `go/medianode` (`cmd/medianode`) on each node:

   ```sh
   medianode -node-id node-a -nats nats://nats:4222 \
     -sip 0.0.0.0:5060 -sip-advertise <node IP Routr can reach> \
     -rtp 0.0.0.0 -rtp-advertise <node IP carriers and gateways can reach> \
     -registrar routr:5060 -username medianode -password "$MEDIANODE_PASSWORD" \
     -outbound-proxy routr:5060
   ```

   Every flag also reads an environment variable (`MEDIANODE_*`). Check that Routr has a route for
   `sip:medianode@default` for each node. The node logs `register failed` when it cannot
   register.
3. **Gateway.** Deploy `mods/gateway` on the same NATS. Its `apps:` list comes from the app
   migration in step 2.
4. **Hosted Autopilot.** Autopilot apps move to the hosted Autopilot. Note its session URL
   (`wss://.../session`).
5. **Test the path** with the live rig (`docs/operators/routr-live-test.md`) or a test number.

## 2. Migrate the applications

One job, `fonoster-migrate-legacy` (`mods/apiserver/dist/migration/cli.js`), converts the legacy
data once. It reads the apiserver's `fonoster.yaml` (database URL and encryption key). It is a dry
run unless you pass `--apply`, and every step is idempotent: run it again and it changes nothing.

```sh
# Dry run: prints each step's plan and notices, writes nothing
fonoster-migrate-legacy --autopilot-url wss://autopilot.example.com/session \
  --autopilot-secret-env AUTOPILOT_SIGNING_SECRET

# Apply, and write the gateway's apps list (holds signing secrets; written with mode 0600)
fonoster-migrate-legacy --apply --autopilot-url wss://autopilot.example.com/session \
  --autopilot-secret-env AUTOPILOT_SIGNING_SECRET --gateway-apps /etc/fonoster/gateway-apps.json
```

Steps, in order:

1. **Catalog.** Providers from the `Product` rows that have an adapter (credentialRef
   `<provider>-default`), and the models and voices the legacy rows name, as catalog ids
   (`elevenlabs/<voice id>`, `deepgram/nova-2`, `openai/gpt-4o-mini`). Entries already in the
   catalog are never changed: apply your own catalog (`ops/rebuild/config/catalog-seed.yaml`) first
   if you want different features or languages.
2. **App credentials.** The per-app `credentials` of TTS, STT and LLM rows become the workspace's
   vendor key for that provider; the column is cleared. A workspace that already has a different
   key keeps it (an `action` notice says so).
3. **Assistants.** Every stored assistant (the Intelligence row of an Autopilot app) becomes a
   session assistant (`docs/autopilot.md`, migration guide). An inline model key becomes the
   workspace's vendor key for that provider (the dashboard's Vendor keys; a workspace that already
   has one keeps it). An `eventsHook` becomes a workspace webhook for `call.started`, `call.ended`
   and `call_record.sealed`. Assistant audio filters move to the app. Assistants that cannot be
   converted are listed as `action` notices; fix them in the dashboard. Notices are also stored for
   the workspace (`registry_notices`, type `legacy.migrated`).
4. **Apps.** Legacy Application rows (EXTERNAL, now STREAM, with a gRPC `endpoint`; AUTOPILOT) become apps: a
   WebSocket URL, the `fonoster` protocol, a signing secret and speech defaults. Autopilot apps point at
   the hosted Autopilot and share its signing secret.

5. **Platform keys** (with `--integrations`). `integrations.json` becomes operator config keyed by
   credentialRef:

   ```sh
   fonoster-migrate-legacy --apply ... --integrations /opt/fonoster/integrations.json \
     --credentials-out /etc/fonoster/credentials.json --secrets-dir /run/secrets/fonoster
   ```

   Each key is written to its own file in `--secrets-dir` (mode 0600) and referenced as
   `secret://file/<path>`; without `--secrets-dir` the fragment names environment variables
   (`OPENAI_DEFAULT`, ...) for you to set. Copy `credentials` into the hosted Autopilot's config,
   `providers` into the gateway's, and `registry.platformCredentials` (plus `evaluations.credentials`)
   into `fonoster.yaml`. The apiserver no longer reads `integrations.json`.

How apps are mapped:

| Legacy | New |
| --- | --- |
| STREAM (was EXTERNAL), `endpoint: host:port` | `url: ws://host:port`, protocol `fonoster` |
| AUTOPILOT | `url: <hosted Autopilot>`, protocol `fonoster`; the agent config stays on the app and is read by `appRef` |
| `tts.<vendor>` + `config.voice` | `speech.voice: <vendor>/<voice>` (a catalog id) |
| STT `config.languageCode` | `speech.language` (default `en-US`) |
| — | `signingSecret`: generated once; re-runs keep it |

Act on every `action` notice before you move that app's numbers:

- Streams must serve the session protocol at their URL (the `@fonoster/voice` session SDK),
  verify signatures with the new secret (`APP_SIGNING_SECRET`), and redeploy. A gRPC VoiceServer
  stops getting calls at the cutover.
- Per-app vendor credentials move to workspace secrets (bring-your-own-key).

## 3. Move the numbers

New and updated numbers point at the media-node peer (`routr.mediaNodePeer.aor`, default
`sip:medianode@default`). Routr stores `aorLink` on each Number, so numbers created before this
release still point at `sip:voice@default` until they are rewritten:

```sh
echo '{}' > routing.json   # or {"mediaNodeAor": "sip:..."} for a custom peer AOR
ROUTR_API_ENDPOINT=routr:51907 node mods/sipnet/dist/numbers/repointNumbersCli.js routing.json            # dry run
ROUTR_API_ENDPOINT=routr:51907 node mods/sipnet/dist/numbers/repointNumbersCli.js routing.json --apply    # all app numbers
ROUTR_API_ENDPOINT=routr:51907 node mods/sipnet/dist/numbers/repointNumbersCli.js routing.json --apply --app app-ref-1
```

Only Numbers with an `x-app-ref` header are touched. Agent numbers never change.

Then remove `mediaService`, `amd`, `audioFilters`, `routr.defaultPeer` and `routr.engines` from
`fonoster.yaml` (unknown keys stop the apiserver at boot), stop the `asterisk` and `amd`
containers, and delete the `sip:voice@default` Peer in Routr.

## 4. Rollback

There is no in-place rollback: the previous release's Asterisk path is gone from this one. To go
back, redeploy the previous release's images and `fonoster.yaml`, and rewrite the Numbers to
`sip:voice@default` with that release's `repointNumbersCli.js`. Apps already on the session SDK
need their gRPC VoiceServer back. Keep the previous deployment's config until the new path has run
cleanly.

## 5. Operating media nodes (add-media-node 4.4)

| Topic | Behavior today |
| --- | --- |
| Registration | REGISTER every `-register-every` (15 s; Expires is twice that), with `X-Session-Count` = active rooms. It re-registers at once when the load changes by 5+ rooms or drops to 0. Requests go out from the SIP port with `rport`, so NAT in front of the node works. |
| Balancing | Routr picks the route with the lowest `X-Session-Count` (Peer `LEAST_SESSIONS`). A room stays on its node. |
| RTP ports | One UDP port per participant, chosen by the OS from the ephemeral range on `-rtp`. Open that range (or use host networking) between nodes, carriers and gateways. A configurable port range is not built yet. |
| Encryption | Plain RTP only. TLS and SRTP toward the edge (media-node 2.12) are not built. Keep nodes, Routr and gateways on a private network. |
| Codecs | PCMU, PCMA, G.722 and Opus on SIP legs (Opus only in images built with libopus); L16/16000 toward the gateway, which converts to each app's format (pcm16 at 8, 16 or 24 kHz, or pcmu at 8 kHz). |
| Drain | On SIGTERM a node re-registers at once as full (Routr stops choosing it) and keeps its rooms. It exits when they end or after `-drain-wait` (10 min): first it unregisters (REGISTER with Expires 0), then it sends `node.down`. Use a pod termination grace of at least `-drain-wait`. |
| Crash | Gateways see heartbeats stop (2 s period) and end the sessions. Routr keeps the dead route until it expires (2 × the REGISTER interval). |
| Limits | 10 participants per room. Calls end after 4 h. 30 s without RTP ends a leg (media timeout). A warm transfer gives up after 30 s without an answer. |
| Diagnostics | `-debug host:port` serves `GET /rooms` (rooms and hold state). It is not part of media-control; do not expose it publicly. |

## 6. What was retired (add-media-node 4.1–4.5)

| Task | Item | Status |
| --- | --- | --- |
| 4.1 | Media-node Peer `sip:medianode@default` with least-sessions (`routr.mediaNodePeer`) | done; it is now the only peer for app-linked numbers |
| 4.2 | The `asterisk` service in the compose files, the `asterisk/` image, the `ASTERISK_*` variables, `mediaService` in the apiserver config | removed |
| 4.2 | The apiserver's ARI handling (`mods/apiserver/src/voice/**`, STT/TTS inside the apiserver) and `voice.proto` with its stubs | removed |
| 4.2 | The Asterisk Peer `sip:voice@default` (`routr.defaultPeer`, `upsertDefaultPeer`) and `routr.engines` | removed |
| 4.3 | Recording through the policy listener and AMD as a voice-worker listener | open: the `mods/amd` classifier stays, its AGI/AudioSocket front end has no caller |
| 4.5 | `{appRef}_{id}.wav` recordings and `GET /api/recordings/:id` | removed; recordings come from the call record. Export old files from `/opt/fonoster/recordings` first if customers need them |
| 4.5 | GSM (Asterisk offered `g722,ulaw,alaw,gsm`). Carriers that send only GSM fail with 488 on the media nodes | check carrier settings before upgrading |
| 4.5 | The verbs `record`, `setAudioFilters`, `mute`, `unmute` | removed |

API-originated calls (`CreateCall`) are placed on the least-loaded live media node from its
heartbeats: `room.create`, `gateway.outbound`, then `participant.dial` through Routr with
`X-Dod-Number`, `X-Call-Ref`, `X-Access-Key-Id` and `X-Is-Api-Originated-Type`.

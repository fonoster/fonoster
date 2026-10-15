# Cutover: from Asterisk to the media nodes

This runbook moves calls from the old voice path to the new one, one app (or one number) at a
time. Both paths run side by side the whole time, so any step can be rolled back.

```
old:  carrier ─▶ Routr ─▶ Peer sip:voice@default (Asterisk) ─ARI─▶ apiserver ─gRPC─▶ app (VoiceServer)
new:  carrier ─▶ Routr ─▶ Peer sip:medianode@default (Go media nodes, least-sessions)
                           ─media-control (NATS)─▶ gateway ─WebSocket─▶ app (session protocol)
```

Routr decides per Number: a Number goes to the Peer whose AOR equals its `aorLink`. The cutover
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

Legacy Application rows (EXTERNAL with a gRPC `endpoint`, AUTOPILOT) become apps: a WebSocket URL,
the `native` flavor, a signing secret and speech defaults.

```sh
# Dry run: prints the plan and the notices, writes nothing
node mods/apiserver/dist/applications/migration/cli.js \
  --autopilot-url wss://autopilot.example.com/session

# Write the gateway's apps list (holds signing secrets; written with mode 0600)
node mods/apiserver/dist/applications/migration/cli.js \
  --autopilot-url wss://autopilot.example.com/session --gateway-apps /etc/fonoster/gateway-apps.json

# Write the new Application columns (url, flavor, signingSecret, speech, fallback) once they exist
node mods/apiserver/dist/applications/migration/cli.js --autopilot-url ... --apply
```

How apps are mapped:

| Legacy | New |
| --- | --- |
| EXTERNAL, `endpoint: host:port` | `url: ws://host:port` (or `--from-json` plus a URL override), flavor `native` |
| AUTOPILOT | `url: <hosted Autopilot>`, flavor `native`; the assistant config stays on the app and is read by `appRef` |
| `tts.<vendor>` + `config.voice` | `speech.voice: <vendor>/<voice>` (a catalog id) |
| STT `config.languageCode` | `speech.language` (default `en-US`) |
| — | `signingSecret`: generated once; re-runs keep it |

Act on every `action` notice before you move that app's numbers:

- EXTERNAL apps must serve the session protocol at their URL (the `@fonoster/voice` session SDK),
  verify signatures with the new secret (`APP_SIGNING_SECRET`), and redeploy. A gRPC VoiceServer
  stops getting calls at the cutover.
- Per-app vendor credentials move to workspace secrets (bring-your-own-key).

## 3. Move numbers, side by side

Set `routr.engines` in `fonoster.yaml`. New and updated numbers follow it right away:

```yaml
routr:
  engines:
    default: asterisk            # every app not listed stays on Asterisk
    rebuildApps: [app-ref-1]     # this app's numbers go to the media nodes
    asteriskApps: []             # kept on Asterisk even when default is rebuild
    numbers:                     # per-number pins win over the app (canaries)
      "+17853178070": rebuild
```

Routr stores `aorLink` on each Number, so existing numbers must be rewritten. Use the same rules in a
JSON file (`defaultEngine`, `rebuildApps`, `asteriskApps`, `numbers`, `asteriskAor`, `mediaNodeAor`):

```sh
ROUTR_API_ENDPOINT=routr:51907 node mods/sipnet/dist/numbers/repointNumbersCli.js engines.json            # dry run
ROUTR_API_ENDPOINT=routr:51907 node mods/sipnet/dist/numbers/repointNumbersCli.js engines.json --apply    # all app numbers
ROUTR_API_ENDPOINT=routr:51907 node mods/sipnet/dist/numbers/repointNumbersCli.js engines.json --apply --app app-ref-1
```

Only Numbers with an `x-app-ref` header are touched. Agent numbers never change.

Suggested order:

1. One canary number on a test app (`numbers:` pin). Call it, then check the app, the call record
   and the hang-up.
2. Internal apps, then one customer app at a time (`rebuildApps`).
3. Autopilot apps together (they share the hosted Autopilot).
4. `default: rebuild`, with stragglers in `asteriskApps`.
5. When `asteriskApps` is empty and no calls reach Asterisk for a week, retire it (section 6).

## 4. Rollback

Rollback uses the same switch:

1. Remove the app from `rebuildApps` (or set `default: asterisk`, or pin the number to `asterisk`).
2. Run `repointNumbersCli.js engines.json --apply` (with `--app` to limit it).
3. Restart the apiserver so new numbers follow the restored rules.

New calls go to Asterisk at once. Calls already on a media node finish there: Routr keeps their
dialogs. Asterisk, its Peer and the apiserver's ARI handling stay in place until section 6, so a
rollback needs no deploy. Apps that already moved to the session SDK need their gRPC VoiceServer
back for a rollback. Keep the old deployment until the app has run cleanly on the new path.

## 5. Operating media nodes (add-media-node 4.4)

| Topic | Behavior today |
| --- | --- |
| Registration | REGISTER every `-register-every` (15 s; Expires is twice that), with `X-Session-Count` = active rooms. It re-registers at once when the load changes by 5+ rooms or drops to 0. Requests go out from the SIP port with `rport`, so NAT in front of the node works. |
| Balancing | Routr picks the route with the lowest `X-Session-Count` (Peer `LEAST_SESSIONS`). A room stays on its node. |
| RTP ports | One UDP port per participant, chosen by the OS from the ephemeral range on `-rtp`. Open that range (or use host networking) between nodes, carriers and gateways. A configurable port range is not built yet. |
| Encryption | Plain RTP only. TLS and SRTP toward the edge (media-node 2.12) are not built. Keep nodes, Routr and gateways on a private network. |
| Codecs | PCMU on SIP legs; L16/16000 toward the gateway. PCMA, G.722 and Opus are next (media-node 2.4). Carriers must offer PCMU. |
| Drain | On SIGTERM a node re-registers at once as full (Routr stops choosing it) and keeps its rooms. It exits when they end or after `-drain-wait` (10 min): first it unregisters (REGISTER with Expires 0), then it sends `node.down`. Use a pod termination grace of at least `-drain-wait`. |
| Crash | Gateways see heartbeats stop (2 s period) and end the sessions. Routr keeps the dead route until it expires (2 × the REGISTER interval). |
| Limits | 10 participants per room. Calls end after 4 h. 30 s without RTP ends a leg (media timeout). A warm transfer gives up after 30 s without an answer. |
| Diagnostics | `-debug host:port` serves `GET /rooms` (rooms and hold state). It is not part of media-control; do not expose it publicly. |

## 6. Retiring Asterisk (add-media-node 4.1–4.5)

| Task | Item | When |
| --- | --- | --- |
| 4.1 | Media-node Peer `sip:medianode@default` with least-sessions (`routr.mediaNodePeer`); per-app and per-number routing (`routr.engines`, `repointNumbers`) | done: in place for the cutover |
| 4.2 | Remove the `asterisk` service from `compose.yaml` and Helm, the `asterisk/` image (`Dockerfile`, `run.sh`, `config/*.conf`: dialplan `extensions.conf`, `ari.conf`, `pjsip*.conf`, `rtp.conf`, `amd.conf`), the `ASTERISK_*` variables in `.env.example`, and `mediaService.asterisk` in the apiserver config | after `asteriskApps` is empty |
| 4.2 | Remove the apiserver's ARI handling: `mods/apiserver/src/voice/**` (`connectToAri.ts`, `VoiceDispatcher.ts`, handlers, AudioSocket, STT/TTS inside the apiserver) and `voice.proto` with its stubs (voice-session 3.1) | same time |
| 4.2 | Remove the Asterisk Peer `sip:voice@default` (`routr.defaultPeer`, `upsertDefaultPeer`) and make `rebuild` the only engine | after the above |
| 4.3 | Move recording to the policy listener and AMD to a voice-worker listener; retire the `mods/amd` AudioSocket sidecar | before 4.2 for apps that use recording or AMD |
| 4.5 | End of `{appRef}_{id}.wav` recordings in `/opt/fonoster/recordings` and of `GET /api/recordings/:id`. New recordings come from the call record and listeners. Export the old files first if customers need them. | with 4.2 |
| 4.5 | End of GSM (Asterisk offered `g722,ulaw,alaw,gsm`). Carriers that send only GSM fail with 488 on the media nodes. | check carrier settings before 4.2 |
| 4.5 | End of the verbs `record`, `setAudioFilters`, `mute`, `unmute` (voice-session) | with voice-session 3.2 |

Before 4.2, confirm all three:

- Routr's location service has no routes for `sip:voice@default`, or no Numbers point there:
  `repointNumbersCli.js` with `defaultEngine: rebuild` reports no changes.
- No calls reach Asterisk for 7 days (Asterisk CDRs or the apiserver's ARI logs).
- Every app passed its `action` notices from the app migration.

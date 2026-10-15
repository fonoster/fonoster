# Try the new platform on your machine

One command starts the whole rebuilt Fonoster on your laptop: the control plane (API server with
Identity, dashboard) and the new voice path (Routr, Go media node, VoiceSessionGateway, hosted
Autopilot), with call records in MinIO. Another seeds a demo workspace with an Autopilot app you
can call from a softphone.

```
softphone ──SIP──▶ Routr ──▶ media node ──media-control (NATS)──▶ gateway ──WebSocket──▶ hosted Autopilot
            RTP ──▶ RTPEngine ──▶ media node ◀──RTP──▶ gateway        └─▶ call record ─▶ MinIO + index
```

This is a local try-out, not a production deployment: it generates development secrets, runs the
fake speech providers unless you give it vendor keys, and prints passwords.

## Prerequisites

- Docker Desktop (or Docker Engine with Compose v2). About 6 GB of free disk for the images.
- Node.js 22 and `npm install` done in this repository (the seed uses `@fonoster/sdk`).
- `openssl` and `curl` (preinstalled on macOS).
- A softphone, if you want to talk to it: Linphone or Zoiper.

Ports are in 16000-16999, so the stack runs next to a legacy Fonoster stack. Change them in
`ops/rebuild/.local/stack.env` (created by the first `up`) if they collide with something.

| Port | What |
| --- | --- |
| 16449 | Dashboard and API (Envoy: gRPC, gRPC-Web, `/api`) |
| 16060 | SIP (Routr), UDP and TCP |
| 16100-16199/udp | Media (RTPEngine) |
| 16200-16299/udp | Media node RTP |
| 16900, 16901 | MinIO API, MinIO console |
| 16222 | NATS (debugging) |
| 16080 | The caller bot's HTTP control (smoke test) |

## Start it

```sh
ops/rebuild/stack up
```

The first run builds every image from this checkout (several minutes) and creates
`ops/rebuild/.local/` with the rendered configs, keys and generated secrets (git-ignored). Later
runs reuse them. `up` prints the dashboard URL and the login when the API server is ready.

The stack runs: NATS, Postgres (Routr, the API server and Identity each have a database), Routr,
RTPEngine, the media node, the gateway, the hosted Autopilot, MinIO, the API server (it applies
every migration, including `rebuild_persistence` and `add_call_records`, then Identity's), Envoy,
the dashboard, `appsync`, the fake providers and the caller bot. No Asterisk: the API server runs
with `mediaService.provider: none`.

## Seed the demo

```sh
ops/rebuild/stack seed
```

It uses the API (as the owner account) to create, once:

- the workspace **Demo** and a workspace API key,
- a SIP Domain `demo.fonoster.local` with the Agent `softphone` (a generated password),
- a Trunk `carrier.fonoster.local` (stands in for a carrier),
- the Autopilot app **Demo Autopilot** (a short receptionist prompt, `openai/gpt-4o-mini`),
- the Number `+17853178070` on that Trunk, pointing at the app.

`ops/rebuild/stack info` prints everything again: URLs, the dashboard login, the API key, the
softphone settings and the number. The values live in `ops/rebuild/.local/seed.json`.

## Sign in to the dashboard

Open <http://localhost:16449> and sign in with the email and password `info` prints
(`admin@fonoster.local` and a generated password). Pick the **Demo** workspace: the app, the
number, the domain and the agent are there. Apps you create in the dashboard work too: `appsync`
points every Autopilot app at the hosted Autopilot within a few seconds.

## Register a softphone

Use the values from `ops/rebuild/stack info`:

| Setting | Value |
| --- | --- |
| Username | `softphone` |
| Password | the generated agent password |
| Domain | `demo.fonoster.local` |
| Proxy / outbound proxy | `<your LAN address>:16060` (printed as "proxy") |
| Transport | TCP or UDP |
| Register | on |

Linphone: Assistant, "Use a SIP account", fill Username, Password, Domain `demo.fonoster.local`,
Transport TCP; then in the account settings set the proxy `sip:<LAN address>:16060;transport=tcp`
and enable "Outbound proxy". Zoiper: add a SIP account `softphone@demo.fonoster.local`, password,
"Outbound proxy" `<LAN address>:16060`, transport TCP. Turn off STUN/ICE in both.

## Call the app

Dial the demo number from the softphone as a call into the carrier trunk:
`sip:+17853178070@carrier.fonoster.local` (the smoke test's caller bot dials exactly this; a
softphone call has not been tried yet, see the build log ST-B10). Routr matches the trunk by the request host, finds the
Number, and sends the call to the media node with the app in `X-App-Ref`. The gateway opens a
session to the hosted Autopilot, which greets you.

Without vendor keys the speech is fake: you hear tones whose length follows the text, and the fake
recognizer "hears" two scripted sentences (6 s and 16 s into the call), so the assistant answers
twice (the fake model echoes them back). Add keys (below) for a real conversation.

No softphone? The caller bot places a call and checks the answer:

```sh
ops/rebuild/stack call
```

## Call records

Every call is sealed as a signed record (vCon) in MinIO and indexed by the API server.

- In the database: `ops/rebuild/stack compose exec postgres psql -U postgres -d fonoster -c 'select call_ref, app_ref, status, duration_seconds, location from call_records order by started_at desc limit 5'`
- Through the API: `GET http://localhost:16449/api/records` (a workspace token), or the dashboard's
  call list (it reads the index: `callRecords.listCallsFromIndex`).
- The objects: MinIO console <http://localhost:16901> (user and password in `info`), bucket
  `records`.

## Real vendors

Put the keys in your shell or in `ops/rebuild/.local/vendor.env` (git-ignored), then run `up` again:

```sh
DEEPGRAM_API_KEY=...      # speech-to-text and the default voice (deepgram/aura-2-thalia-en)
ELEVENLABS_API_KEY=...    # optional voices: elevenlabs/<voice id>
OPENAI_API_KEY=...        # the assistant's language model
```

`up` renders the gateway with the Deepgram (and ElevenLabs) adapters instead of the fakes, and the
hosted Autopilot's catalog with the OpenAI adapter instead of the fake model. Each one switches on
its own: with only `OPENAI_API_KEY` you get a real model and fake speech. Keys are passed to the
containers by name and never written to the rendered configs.

## Logs, status, stop

```sh
ops/rebuild/stack ps                 # containers
ops/rebuild/stack logs gateway       # follow one service (or all: no argument)
ops/rebuild/stack down               # stop; data stays in the volumes
ops/rebuild/stack reset              # stop and delete volumes and ops/rebuild/.local
ops/rebuild/stack smoke              # up, seed, one call, checks, down (RB_KEEP=1 keeps it up)
```

## How it fits together

- **Routr** runs with its own EdgePort on 16060 inside the container (so Via and Record-Route
  carry the port you reach) and `EXTERNAL_ADDRS` set to your LAN address. RTPEngine anchors the
  media at the same address, which both your softphone and the containers can reach.
- **Media node**: registers to Routr (UDP, inside the Docker network) as the Peer `sip:medianode@default` that the API
  server creates (`routr.mediaNodePeer`). Numbers of apps go to that Peer
  (`routr.engines.default: rebuild`).
- **Gateway**: reads apps from the API server's database (`appStore.source: database`), delivers
  workspace webhooks, writes call records to MinIO and announces them to the index on NATS.
- **Hosted Autopilot** (`mods/autopilot/src/session/main.ts`): the URL every Autopilot app points
  to (`ws://autopilot:3000`), with one signing secret.
- **appsync** (`ops/rebuild/appsync.cjs`, interim): writes the session-app columns of Autopilot
  apps and the hosted Autopilot's assistants file, because the API server does not yet do it when
  an app is created.

## Troubleshooting

- **The softphone registers but calls have no audio.** Your LAN address changed (new network):
  run `ops/rebuild/stack up` again; it re-detects it. Set `RB_HOST_IP` to force one.
- **`up` waits for the apiserver forever.** `ops/rebuild/stack logs apiserver`. A port collision
  shows up as a Compose error instead: edit the port in `ops/rebuild/.local/stack.env`.
- **Calls fail with 480 at Routr.** The media node is not registered yet: Routr takes about a
  minute to start, and the node registers every 15 s (`ops/rebuild/stack logs medianode`).
- **`seed` waits.** Routr-backed resources (domains, numbers) answer errors until Routr is up; the
  seed retries for about a minute and a half.

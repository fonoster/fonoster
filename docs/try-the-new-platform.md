# Try the new platform on your machine

> To develop Fonoster, use the dev container instead (CONTRIBUTING.md). This stack runs every
> component as a container; it is what `ops/rebuild/stack smoke` and CI use.

One command starts the whole rebuilt Fonoster on your laptop: the control plane (API server with
Identity, dashboard) and the new voice path (Routr, Go Roomr node, AppBridge, hosted
Autopilot), with call records in MinIO. Another seeds a demo workspace with an Autopilot app you
can call from a softphone.

```
softphone ──SIP──▶ Routr ──▶ Roomr node ──media-control (NATS)──▶ appbridge ──WebSocket──▶ hosted Autopilot
            RTP ──▶ RTPEngine ──▶ Roomr node ◀──RTP──▶ appbridge        └─▶ call record ─▶ MinIO + index
```

This is a local try-out, not a production deployment: it generates development secrets, runs the
fake speech providers unless you give it vendor keys, and prints passwords.

## Prerequisites

- Docker Desktop (or Docker Engine with Compose v2). About 6 GB of free disk for the images.
- Node.js 22 and `npm install` done in this repository (the seed uses `@fonoster/sdk`).
- `openssl` and `curl` (preinstalled on macOS).
- A softphone, if you want to talk to it: Linphone or Zoiper.

Ports are in 16000-16999, so the stack runs next to a legacy Fonoster stack. Change them in
`ops/rebuild/.local/.env` (created by the first `up`) if they collide with something.

| Port | What |
| --- | --- |
| 16449 | Dashboard and API over HTTPS (Envoy: gRPC, gRPC-Web, `/api`, browser calls at `/sip`) |
| 16081 | Redirects to HTTPS on 16449 |
| 16060 | SIP (Routr), UDP and TCP |
| 16100-16199/udp | Media (RTPEngine) |
| 16200-16299/udp | Roomr node RTP |
| 16900, 16901 | MinIO API, MinIO console |
| 16222 | NATS (debugging) |
| 16080 | The caller bot's HTTP control (smoke test) |

## Start it

```sh
ops/rebuild/stack up
```

The first run builds every image from this checkout (several minutes) and creates
`ops/rebuild/.local/` (git-ignored): one env file, `.local/.env`, seeded from
`ops/rebuild/stack.defaults` with the secrets `ops/bundle/init.sh` generates, plus the keys and
`.local/config`. Later runs reuse `.local/.env` and the keys. `.local/config` is regenerated on every
`up`, so don't edit it by hand: put your own settings in `.local/overlay.local/<file>.yaml`. `up` prints the dashboard URL and the login when the API server is ready.

The stack runs: NATS, Postgres (Routr, the API server and Identity each have a database), Routr,
RTPEngine, the Roomr node, AppBridge, the hosted Autopilot, MinIO, the API server (it applies
every migration, including `rebuild_persistence` and `add_call_records`, then Identity's), Envoy,
the dashboard, the fake providers and the caller bot. No Asterisk. Once the API server is up, `up`
loads the provider catalog (`ops/rebuild/config/catalog-seed.yaml`: Deepgram, ElevenLabs, OpenAI,
Groq and their models and voices, plus the fake provider with the `fakes` profile) into the
registry tables.

## Seed the demo

```sh
ops/rebuild/stack seed
```

It uses the API (as the owner account) to create, once:

- the workspace **Demo** and a workspace API key,
- a SIP Domain `demo.sip.fonoster.local` with the Agent `softphone` (a generated password),
- a Trunk `carrier.pstn.fonoster.local` (stands in for a carrier),
- the Autopilot app **Demo Autopilot** (a short receptionist prompt; its model and voice follow
  your keys, see "Real voices" below; Deepgram `nova-3` recognition with the hint "Fonoster"),
- the Number `+17853178070` on that Trunk, pointing at the app.

Running `seed` again updates the app's model and voice to match the keys you have now.
`ops/rebuild/stack info` prints everything again: URLs, the dashboard login, the API key, the
softphone settings and the number. The values live in `ops/rebuild/.local/seed.json`.

## Sign in to the dashboard

Open <https://localhost:16449> and sign in with the email and password `info` prints
(`admin@fonoster.local` and a generated password). Pick the **Demo** workspace: the app, the
number, the domain and the agent are there. Apps and agents you create in the dashboard answer
calls right away: the API server points every Autopilot app at the hosted Autopilot, which reads
the agent from the database (edits apply within a few seconds). To talk to an agent, open it and click **Talk to agent**, then
**Call**: the browser asks for the microphone and calls the saved version of the agent (Mute and
Hang up are in the panel). The panel also lists the numbers that reach the agent.

The stack serves HTTPS with a certificate it generates in `ops/rebuild/.local/config/tls/`, the
same way every install does until its owner sets a real one. The browser warns once: click through
it (Advanced, then Proceed). The certificate covers `localhost`, `127.0.0.1` and your LAN address,
so the microphone and Talk to agent work from another machine on your network too.

## Register a softphone

Use the values from `ops/rebuild/stack info`:

| Setting | Value |
| --- | --- |
| Username | `softphone` |
| Password | the generated agent password |
| Domain | `demo.sip.fonoster.local` |
| Proxy / outbound proxy | `<your LAN address>:16060` (printed as "proxy") |
| Transport | TCP or UDP |
| Register | on |

Linphone: Agent, "Use a SIP account", fill Username, Password, Domain `demo.sip.fonoster.local`,
Transport TCP; then in the account settings set the proxy `sip:<LAN address>:16060;transport=tcp`
and enable "Outbound proxy". Zoiper: add a SIP account `softphone@demo.sip.fonoster.local`, password,
"Outbound proxy" `<LAN address>:16060`, transport TCP. Turn off STUN/ICE in both.

## Call the app

Dial the demo number from the softphone as a call into the carrier trunk:
`sip:+17853178070@carrier.pstn.fonoster.local` (the smoke test's caller bot dials exactly this; a
softphone call has not been tried yet, see the build log ST-B10). Routr matches the trunk by the request host, finds the
Number, and sends the call to the Roomr node with the app in `X-App-Ref`. AppBridge opens a
session to the hosted Autopilot, which greets you.

Without vendor keys the speech is fake: you hear tones whose length follows the text, and the fake
recognizer "hears" two scripted sentences (6 s and 16 s into the call), so the agent answers
twice (the fake model echoes them back). Add keys (below) for a real conversation.

No softphone? The caller bot places a call and checks the answer:

```sh
ops/rebuild/stack call
```

Or let it ask a recorded question ("What is Fonoster?") and measure how fast the agent answers:

```sh
ops/rebuild/stack ask                    # prints the turn latency; saves .local/ask/heard.wav
RB_TRANSCRIBE=1 ops/rebuild/stack ask    # also transcribes what it heard (Deepgram key needed)
RB_QUESTION=my-question.wav RB_TURNS=2 ops/rebuild/stack ask   # 16 kHz mono 16-bit WAV
```

## Call records

Every call is sealed as a signed record (vCon) in MinIO and indexed by the API server.

- In the database: `ops/rebuild/stack compose exec postgres psql -U postgres -d fonoster -c 'select call_ref, app_ref, status, duration_seconds, location from call_records order by started_at desc limit 5'`
- Through the API: `GET https://localhost:16449/api/records` (a workspace token; `curl --cacert
  ops/rebuild/.local/config/tls/ca.pem`), or the dashboard's
  call list (it reads the index).
- The objects: MinIO console <http://localhost:16901> (user and password in `info`), bucket
  `records`.

## From the terminal

The `fonoster` CLI (`mods/ctl`) drives the same API. Build it once from this checkout and log in
with the workspace API key that `ops/rebuild/stack info` prints:

```sh
(cd mods/ctl && npx tsc -b)
alias fonoster="node $PWD/mods/ctl/bin/run.js"
fonoster workspaces:login --endpoint localhost:16449 \
  --ca-file ops/rebuild/.local/config/tls/ca.pem \
  --access-key-id <API key id> --access-key-secret <API key secret>
```

The CLI always uses TLS and trusts the stack's generated CA through `--ca-file` (or
`FONOSTER_CA_FILE`). The file is saved with the workspace, so every command below talks to the
active workspace with no extra flag.

Applications (a stream: a WebSocket URL + protocol + speech defaults; or an Autopilot agent):

```sh
fonoster applications:list
fonoster applications:get <app-ref>
fonoster applications:create --name "My bot" --url wss://bot.example.com/session \
  --voice deepgram/aura-2-thalia-en --stt-model deepgram/nova-3 --recording on
fonoster applications:create --name "Twilio bot" --url wss://bot.example.com/media --protocol twilio
fonoster applications:create --name Receptionist --agent agent.yaml
fonoster applications:update <app-ref> --patience high --listener wss://rec.example.com/ws,inbound
fonoster applications:rotate-secret <app-ref>   # the new signing secret, shown once
```

`create` prints the app's signing secret once (Autopilot agents share the hosted Autopilot's, so
none is shown). `update` changes only the flags you pass; `--from-file app.yaml` takes the same
fields as the API (`url`, `protocol`, `speech`, `audio`, `listeners`, `recording`,
`fallbackAppRef`, ... and `agent` for an Autopilot agent).

Voices and models are catalog ids; vendor keys are per workspace:

```sh
fonoster providers:catalog --kind voice
fonoster providers:keys:set deepgram          # asks for the key (no echo)
fonoster providers:keys:list
fonoster providers:keys:delete deepgram
```

Webhooks, call records and outbound calls:

```sh
fonoster webhooks:create --url https://example.com/hooks -e call.ended -e call_record.sealed
fonoster webhooks:deliveries            # the delivery log; webhooks:resend <delivery-ref>
fonoster records:list --after 2026-10-01
fonoster records:get <call-ref>
fonoster records:download <call-ref>                  # <call-ref>.wav
fonoster records:download <call-ref> --part vcon      # <call-ref>.vcon.json (signed: --part signed)
fonoster sipnet:calls:create -f <from> -t <to> -a <app-ref>   # prints each dial status
```

`webhooks` also has `list`, `get`, `update`, `delete` and `rotate`. `fonoster --help` lists every
command; `mods/ctl/README.md` has their flags.

## Real voices

Put your keys in `ops/rebuild/.local/vendor.env` (created by the first `up`, git-ignored, never
committed), one per line, then run `up` and `seed` again:

```sh
# ops/rebuild/.local/vendor.env
DEEPGRAM_API_KEY=...      # speech-to-text (nova-3) and the default voice (Aura-2)
ELEVENLABS_API_KEY=...    # optional: ElevenLabs voices (elevenlabs/<voice id>)
GROQ_API_KEY=...          # the default language model (gpt-oss-120b on Groq)
OPENAI_API_KEY=...        # optional: OpenAI models (openai/gpt-4o-mini, openai/gpt-4.1-mini)
```

```sh
ops/rebuild/stack up && ops/rebuild/stack seed
```

Exported shell variables work too. Each key becomes a platform key, and the catalog then offers
every workspace that vendor's voices and models. With the `fakes` profile (on by default) the
catalog also has the fake providers, `fake` (`mods/conformance/fakes.catalog.yaml`): a provider
like any other that needs no key.

`seed` gives the demo app what the catalog offers: Deepgram's `aura-2-thalia-en` voice and
`nova-3` transcriber, and Groq's `gpt-oss-120b` (else OpenAI's `gpt-4o-mini`), when their keys
are present; otherwise the first offered item for English. So with no keys at all the demo app
runs on the fakes (tones for speech, a scripted recognizer, an echoing model), and with only an
ElevenLabs key it gets an ElevenLabs voice and the fake transcriber.
`RB_DEFAULT_VOICE`, `RB_DEFAULT_STT` and `RB_DEFAULT_MODEL` (catalog ids, in `vendor.env` too)
override that, e.g. `RB_DEFAULT_VOICE=elevenlabs/JBFqnCBsd6RMkjVDRZzb` (George) or
`RB_DEFAULT_MODEL=openai/gpt-4.1-mini`. Every voice and model in the catalog can also be picked
per app or agent in the dashboard. A vendor's voices and models always need its key, the
platform's or the workspace's; no vendor id is ever answered by a fake.

Keys reach the containers by variable name only (AppBridge for speech, the hosted Autopilot for
language models) and are never written to the rendered configs. Workspace vendor keys added in
the dashboard (Vendor keys) replace the platform key for that workspace's calls, for speech and
language models alike.

Groq retired Llama 3.3 70B, so the catalog marks `groq/llama-3.3-70b-versatile` retired: an
agent that still names it runs on `groq/openai/gpt-oss-120b` (`groq/openai/gpt-oss-20b` is
there too).

Measured on a laptop with `ops/rebuild/stack ask` (the caller asks "What is Fonoster?" over
PCMU): from the end of the question to the first audio of the answer, about 1.5 s with
gpt-oss-120b on Groq, Deepgram nova-3 and Aura-2 (1.52 s and 1.54 s), and 1.3 s with an
ElevenLabs voice. The answers were on topic.

## Logs, status, stop

```sh
ops/rebuild/stack ps                 # containers
ops/rebuild/stack logs appbridge     # follow one service (or all: no argument)
ops/rebuild/stack down               # stop; data stays in the volumes
ops/rebuild/stack reset              # stop and delete volumes and ops/rebuild/.local
ops/rebuild/stack smoke              # up, seed, one call, checks, down (RB_KEEP=1 keeps it up)
```

## How it fits together

- **Routr** runs with its own EdgePort on 16060 inside the container (so Via and Record-Route
  carry the port you reach) and `EXTERNAL_ADDRS` set to your LAN address. RTPEngine anchors the
  media at the same address, which both your softphone and the containers can reach.
- **Browser calls** ("Talk to agent"): the dashboard gets a test token from the API server
  (`CreateTestToken`), opens SIP over WebSocket at `wss://<host>:16449/sip` (Envoy terminates TLS and proxies it
  to Routr's `ws` transport on 5062 in the container) and calls the roomr Peer with
  `X-App-Ref` naming the agent. Routr checks the token with Identity's public key; RTPEngine turns
  the browser's WebRTC (ICE, DTLS-SRTP) into plain RTP; AppBridge answers only agents of the
  token's workspace.
- **Roomr node**: registers to Routr (UDP, inside the Docker network) as the Peer `sip:roomr@default` that the API
  server creates (`routr.roomrPeer`). Numbers of apps go to that Peer.
- **AppBridge**: reads apps from the API server's database (`appStore.source: database`), delivers
  workspace webhooks, writes call records to MinIO and announces them to the index on NATS.
- **AppBridge** also reads the provider catalog (`registry.source: database`) and workspace vendor
  keys (`workspaceKeys.enabled`) from the same database.
- **Hosted Autopilot** (`mods/autopilot/src/session/main.ts`): the URL every Autopilot app points
  to (`ws://autopilot:3000`, the API server's `apps.autopilotUrl`), with one signing secret
  (`apps.autopilotSigningSecret`). Its `publicUrl` must be that same URL: Autopilot checks
  signatures against it, never the `Host` header, and serves only the app and workspace each
  signature is bound to. Agents, the catalog and workspace vendor keys come from the
  API server's database (`source: database` in `autopilot-session.yaml`).

## Troubleshooting

- **The softphone registers but calls have no audio.** Your LAN address changed (new network):
  run `ops/rebuild/stack up` again; it re-detects it. Set `RB_HOST_IP` to force one.
- **`up` waits for the apiserver forever.** `ops/rebuild/stack logs apiserver`. A port collision
  shows up as a Compose error instead: edit the port in `ops/rebuild/.local/.env`.
- **Calls fail with 480 at Routr.** The Roomr node is not registered yet: Routr takes about a
  minute to start, and the node registers every 15 s (`ops/rebuild/stack logs roomr`).
- **`seed` waits.** Routr-backed resources (domains, numbers) answer errors until Routr is up; the
  seed retries for about a minute and a half.

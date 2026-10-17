# Release notes: the session protocol

Draft for the release that makes the session protocol the only voice path. It is a new,
incompatible release: there are no compatibility shims.

## Breaking changes

1. **`voice.proto` is retired.** Apps are no longer gRPC servers. The VoiceSessionGateway
   opens one signed WebSocket to your app's URL for every call. Apps that speak `voice.proto`
   directly must move to an SDK or to the [session protocol](./session-protocol.md). An app record
   that only has a gRPC endpoint is not dialed: its calls follow the app's fallback.
2. **`@fonoster/voice` is the session SDK.** Handlers take one argument, the session. The gRPC
   `VoiceServer`, `VoiceResponse`, `(req, res)` handlers, `stream()`, `sgather()` and `dial()` are
   gone; `@fonoster/voice/session` stays as an alias for this release only.
3. **`record()`, `setAudioFilters()`, `mute()` and `unmute()` are removed.** Recording and audio
   filters are app configuration, and `hold()` / `resume()` replace mute / unmute.
4. **Asterisk is retired.** The Go media nodes answer every app-linked number
   (`sip:medianode@default`); the apiserver no longer talks ARI, serves `/api/recordings/:id`
   or creates the `sip:voice@default` peer. API-originated calls (`CreateCall`) are placed on the
   media nodes. `fonoster.yaml` loses `mediaService`, `amd`, `audioFilters`, `routr.defaultPeer`
   and `routr.engines`.
5. **Autopilot is the hosted session engine.** The previous engine (xstate machine, Silero VAD,
   gRPC voice server) is gone; `fonoster/autopilot` runs `mods/autopilot/src/session` and reads
   `autopilot-session.yaml`.
6. **Assistant webhooks are retired.** `eventsHook` and its `conversation.started` /
   `conversation.ended` events are gone. Subscribe a workspace webhook to `call.started`,
   `call.ended` (the call is over) or `call_record.sealed` (the record, with transcript, turns and
   recording, is ready). `fonoster-migrate-legacy` creates that webhook for every assistant that
   had an `eventsHook`; creating one with a retired event name is refused with the replacement.
7. **Recording URLs are no longer built by convention.** `${RECORDING_BASE_URL}/${appRef}_${id}.wav`
   is gone: a call's recording is a part of its call record (`GET /api/records/{callRef}/recording`,
   the dashboard's Calls page, `fonoster records:download`).

Also required: a **signing secret**. The SDK servers refuse to start without one and refuse
connections that are not signed by the gateway. Rotation is immediate, with no overlap window.

## Configuration: no environment fallbacks

Each Fonoster service reads its values from its config file only; a value comes from the
environment only where the file references it as `${VAR}` or `secret://env/VAR`
(fix-config-and-placement-gaps). Three fallbacks are gone:

1. **No `.env` in development.** `@fonoster/common` and `@fonoster/amd` no longer load the
   repository's `.env` when `NODE_ENV=development`, and `@fonoster/common` no longer reads
   `APISERVER_ROOT_DOMAIN` / `ROOT_DOMAIN` (the apiserver sets the root domain from
   `fonoster.yaml`'s `domain`). In the dev container `npm run dev` passes `.dev/.env` to each
   process, as Compose does; set anything else in the service's config file under `.dev/config/`.
   The AMD sidecar's `AMD_*` settings come from its container environment.
2. **Autopilot: `database.urlEnv` and the `APISERVER_DATABASE_URL` fallback are removed.**
   Autopilot used `APISERVER_DATABASE_URL` when its `database` section had no `url`. Write the
   URL in the file, as a placeholder if it lives in the environment:
   `database: { url: "${APISERVER_DATABASE_URL}" }`. `database.urlEnv` is refused at start with
   that hint, and a `database` section without `url` is refused too.
3. **Media node: `MEDIANODE_*` variables are no longer read.** Every setting is a key in
   `medianode.yaml` (`/config/medianode.yaml`, or `-config <file>`) or a flag; flags still win.
   To keep a value in the environment, reference it in the file (`nodeId: "${MEDIANODE_ID}"`,
   `registration: { password: "${MEDIANODE_PASSWORD}" }`) or pass it as
   `secret://env/NAME` for the passwords and TLS PEM settings. At start the node logs, by name
   only, every `MEDIANODE_*` variable that the file and flags do not reference. The Helm chart
   now renders `medianode.yaml` as a ConfigMap (the `medianode.*` values are unchanged) and the
   cell's Compose file mounts `ops/rebuild/cell/config/medianode.yaml`.

## New

- A **Python SDK**, `fonoster-voice`, with the same methods, events, errors and `gather` rules as
  TypeScript. Both pass the same conformance scenarios.
- `(session)` handlers (`say`, `gather`, `play`, `transfer`, `hold`, `handoff`, events, raw audio).
- `say()` reports what the caller heard (`interrupted`, `heardText`, `heardMs`). Barge-in is the
  app's decision (`interruptible`).
- `say()` takes an async iterable, to stream model tokens into one utterance.
- Cold, warm and `refer` transfers.
- The Twilio Media Streams protocol (`protocol: twilio`) for Pipecat and similar bots.
- Listen-only sockets for monitoring.

## Deployables and operations

- **New deployables.** The **VoiceSessionGateway** (`fonoster/gateway`: speech, turn-taking, app
  sessions) and the Go **media node** (`fonoster/medianode`: rooms, mixing, RTP) replace Asterisk
  and the voice code that lived in the apiserver. The apiserver keeps the management gRPC API,
  Identity, `GetCapabilities`, call creation and webhooks; it no longer talks ARI, AudioSocket or
  speech vendors.
- **One YAML per service**, with `secret://env/…`, `secret://file/…` and `secret://k8s/…`
  references instead of raw secrets ([operator guide](./operators/rebuild.md)).
- **Helm** covers the whole platform (`values-cloud.yaml`), with the apiserver's migrations as a
  Job and an optional observability profile; Compose (`ops/rebuild/compose.yaml`) is the other
  official target.
- **Private regions** are customer-operated (decision D9, softened): the customer runs the
  data plane and upgrades it; the region links to the control plane only through an outbound NATS
  leaf node ([Running a region](./operators/regions.md)).
- **Telemetry**: every service exports OTLP when `OTEL_EXPORTER_OTLP_ENDPOINT` is set; a call's trace
  runs from the media node through the gateway (a `traceparent` NATS header).

## Upgrade

See [What changed](./migrating-to-sessions.md).

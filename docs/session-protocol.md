# Session protocol reference (`fonoster.session.v1`)

Every call reaches your app as a **session**: one WebSocket connection that the VoiceSessionGateway
opens to your app's URL. Over it you receive the caller's audio and events, and you send commands.
This page is the wire reference. Most apps use an SDK instead
([voice SDK](./voice-sdk.md)), which builds `say`, `gather` and the rest from these messages.

The machine-readable definition is `mods/common/schema/session.v1.json` (JSON Schema, one schema per
message).

## Connecting

The gateway dials your app; your app never dials Fonoster. An app is configured with:

| Setting | Meaning |
| --- | --- |
| URL | `ws://` or `wss://` address the gateway connects to |
| Flavor | `native` (this page) or `twilio` (Twilio Media Streams, see below) |
| Signing secret | Used to sign every connection request |
| Speech defaults | Default voice and language, as catalog ids |
| Audio | Native flavor audio format: `pcm16` at 8, 16 or 24 kHz, or `pcmu` at 8 kHz (default `pcm16` at 16 kHz) |
| Fallback | Another app, or a message spoken before hanging up, used when your app cannot be reached |

### Verifying the connection

Each connection request carries two headers:

| Header | Value |
| --- | --- |
| `X-Fonoster-Timestamp` | Signing time, Unix seconds |
| `X-Fonoster-Signature` | Lowercase hex HMAC-SHA256 of `<timestamp>.<url>` with your signing secret |

`<url>` is your app's URL exactly as configured, query string included. Reject a request whose
signature does not match or whose timestamp is more than 300 seconds from your clock.

If the app's URL refuses connections, the gateway retries for about 2.5 seconds while the caller
hears ringing, then applies the fallback.

### Keepalive

The gateway pings every 10 seconds. A socket that answers nothing (no pong, no frame) for 30 seconds
is treated as dropped, and the call is hung up.

## Frames

- **Text frames** carry JSON messages. Every message has a `type`.
- **Binary frames** carry audio. Frames from the gateway start with **one byte holding the track id**
  (see `tracks` in `session.start`), followed by audio in the session's format. Frames you send are
  plain audio, without the byte.
- Commands may carry an `id` (any string up to 128 characters). Every event a command causes echoes
  that `id`.
- **Ignore unknown message types and unknown fields.** The protocol only ever adds types and fields;
  a breaking change would get a new protocol name.

## Session lifecycle

### `session.start` (gateway → app)

Always the first message.

```json
{
  "type": "session.start",
  "protocol": "fonoster.session.v1",
  "sessionRef": "8aa0b7b7-3f75-427e-86c2-14c2834ed4b1",
  "callRef": "room-1",
  "appRef": "support-line",
  "direction": "inbound",
  "from": "+15550001111",
  "to": "+15550002222",
  "metadata": {},
  "handoff": null,
  "audio": { "codec": "pcm16", "rate": 16000 },
  "tracks": [
    { "id": 1, "side": "inbound", "kind": "audio", "codec": "pcm16" },
    { "id": 2, "side": "outbound", "kind": "audio", "codec": "pcm16" }
  ],
  "speech": { "voice": "elevenlabs/rachel", "language": "en-US" }
}
```

Inbound calls are answered as soon as this message is sent; there is no answer command. Outbound
calls open their session only when the callee answers. `handoff` holds the payload when another app
handed the call to yours.

### `session.end` (gateway → app)

The last message, sent when the socket is still open, with a `reason`: `caller_hangup`,
`app_hangup`, `transfer`, `handoff`, `error` or `timeout`. The gateway then closes the socket.

Closing the socket yourself hangs up the call.

## Speech

### `speak` (app → gateway)

| Field | Required | Meaning |
| --- | --- | --- |
| `text` | yes | Text to speak (may be empty on the last piece) |
| `id` | no | Echoed by `output.*` events; the gateway assigns one if you leave it out |
| `last` | no | Default `true`. Send several `speak` with one `id` and `last: false` to stream text (for example LLM tokens) into one continuous utterance; the piece with `last: true` ends it |
| `voice`, `language` | no | Catalog ids overriding the app's defaults for this item |
| `interruptible` | no | Default `true`: caller speech stops it |
| `preempt` | no | Stop what is playing and play this first |

### `play` (app → gateway)

`{ "type": "play", "id": "p1", "url": "https://example.com/hold.wav", "loop": false }`. WAV files
(PCM or μ-law, any rate) are converted to the call's format. Also takes `interruptible` and
`preempt`. A file that cannot be fetched produces `error` `play_fetch_failed`.

### Output events (gateway → app)

| Event | Meaning |
| --- | --- |
| `output.started { id }` | The item began to be heard |
| `output.done { id }` | It was heard completely |
| `output.interrupted { id, heardText, heardMs }` | It was cut off (caller barge-in, `clear` or `preempt`); `heardText` holds only the words already spoken. Items dropped before they started report `heardMs: 0` |

`speak`, `play` and your own audio frames share **one output queue** played in real time: new items
queue behind earlier ones.

### Turn events (gateway → app)

The gateway's turn detector decides when the caller starts and stops talking:

| Event | Fields | Meaning |
| --- | --- | --- |
| `turn.user_started` | | The caller started talking |
| `turn.likely_ended` | `text` | The caller probably finished; a good moment to start preparing a reply |
| `turn.resumed` | | They kept talking after `turn.likely_ended` |
| `turn.ended` | `text`, `language`, `confidence`, `durationMs` | The turn is over; reply now |
| `turn.backchannel` | `text` | A short acknowledgment ("uh-huh") that is not a turn |

Each turn arrives as `turn.user_started`, zero or more (`turn.likely_ended`, `turn.resumed`) pairs,
an optional `turn.likely_ended`, then `turn.ended`.

### `subscribe` (app → gateway)

`{ "type": "subscribe", "events": ["turn.estimate", "transcript.partial"] }` turns on two opt-in
events:

- `turn.estimate { eot, speaking, kind }`: the detector's end-of-thought estimate (0 to 1), at most
  every 100 ms.
- `transcript.partial { text, language }`: interim transcripts.

### `listen.update` (app → gateway)

Changes recognition from now on: `{ "type": "listen.update", "language": "es", "hints": ["Fonoster"] }`.

## Audio

- **Caller audio:** one binary frame per 20 ms, starting with the caller's track id.
- **Your audio:** send binary frames of any length in the session's format. They join the output
  queue and play in real time.
- **`mark { name }`** (app → gateway) marks a position in the queue. The gateway answers
  `mark { name, cleared: false }` when everything queued before it was heard, or
  `mark { name, cleared: true }` when `clear` dropped it.
- **`clear`** (app → gateway) empties the whole queue. The caller hears silence within 40 ms.

## Call control (app → gateway)

| Command | Fields | Result |
| --- | --- | --- |
| `hangup` | | `session.end` with `app_hangup` |
| `dtmf.send` | `digits` | Sends keypresses on the call |
| `transfer` | `to`, `mode` (`cold` default, `warm`, `refer`), `headers` | Cold: the new party joins and your session ends with `transfer`. Warm: you stay until `transfer.complete`. Refer: SIP REFER, your session ends. A failure produces `error` `transfer_failed` |
| `transfer.complete` | `id` (of the warm transfer) | Leaves a warm transfer |
| `hold` | `music` | Puts the caller on hold |
| `resume` | | Takes the caller off hold |
| `handoff` | `app`, `payload` (JSON, 16 KB max) | Hands the call to another app: you get `session.end` with `handoff`, the other app gets `session.start` with your payload. At most 5 handoffs per call |

The caller's keypresses arrive at any time as `dtmf { digit }`.

## Errors

`error { code, message, fatal, relatesTo }`. `relatesTo` names the command that caused it. In this
version no error is fatal on its own; a session that cannot continue ends with `session.end`.

| Code | Meaning |
| --- | --- |
| `bad_message` | Unparseable JSON, a missing required field, or a limit exceeded |
| `read_only` | A listen-only socket sent a command |
| `provider_unavailable` | The speech or language provider failed |
| `provider_timeout` | The provider did not answer in time |
| `invalid_catalog_id` | A voice or language id is not in the catalog |
| `feature_not_supported` | The provider cannot do what was asked |
| `transfer_failed` | The transfer target could not be reached |
| `queue_full` | More than 120 s of output is queued |
| `play_fetch_failed` | The media could not be fetched |
| `internal` | Anything else |

The gateway never switches providers on failure; it reports the error.

## Listen-only sockets

An app can list listeners (`url`, `tracks`: `inbound`, `outbound` or `both`, up to 4). The gateway
dials each one when the session starts, signed with the app's secret. Listeners receive
`session.start`, the same events as your app, and the tracks they chose as separate binary frames
(each with its track id; sides are never mixed). Anything they send gets `error` `read_only`.

## Twilio flavor

For apps built for Twilio Media Streams (Pipecat's `TwilioFrameSerializer`, for example). The
gateway speaks the exact Media Streams messages:

| Direction | Messages |
| --- | --- |
| Gateway → app | `connected`, `start` (with `streamSid` = `sessionRef`, `callSid` = `callRef`, `mediaFormat` μ-law 8 kHz), `media` (base64 μ-law, `track: inbound`), `dtmf`, `mark`, `stop` |
| App → gateway | `media`, `mark`, `clear` |

Everything else is ignored: there is no Speech layer, transfer or TwiML. To hang up, close the socket
or call the compatible endpoint
`POST {base}/2010-04-01/Accounts/{accountSid}/Calls/{callSid}.json` with `Status=completed` and HTTP
Basic auth (it answers 200, or 404 with code `20404` for a call that already ended). With Pipecat, set
`base_url` on the serializer and `auto_hang_up` works unchanged.

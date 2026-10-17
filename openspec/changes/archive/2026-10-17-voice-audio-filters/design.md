## Context

Caller audio arrives from Asterisk over ARI external media as `slin16` — a 16 kHz container. On
PSTN calls the content is narrowband: a spectrum of a real call recording shows speech energy to
3.4 kHz and a brick wall at 4 kHz (−31 dB at 3.4–4 kHz, −86 dB above 4 kHz), which is G.711
upsampled. The default model, `quail-vf-2.2-s-16khz`, therefore matches the sample rate exactly
but sees an empty upper half. Quail Voice Focus has no 8 kHz variant; the vendor's 8 kHz models
are Multi Speaker, which preserve every voice and so cannot remove a background talker.

All caller audio passes through one function today:

```
Asterisk --AudioSocket--> AudioSocketHandler -> transcribeOnConnection -> transcriptionsStream
                                                                            |-> SpeechHandler -> Deepgram
                                                                            '-> createStreamHandler -> app (autopilot VAD)
```

That single fork is why one chain can serve both consumers.

## Goals / Non-Goals

**Goals**

- An application decides, per session and in code, whether its audio is filtered.
- The autopilot decides the same thing from configuration, with no code change.
- A missing SDK, missing license or failing model degrades to unfiltered audio, never to a failed
  call.
- Operators can tune a live application's filtering by editing YAML and running
  `applications:update`.

**Non-Goals**

- Choosing filters per *utterance*, or changing them from outside the session.
- Filtering audio played **to** the caller, or the Asterisk-side recording.
- Shipping a second filter. The registry takes one when it has been measured and earns its place.

## Decisions

### A verb, not application record configuration

Filters are requested by the application over the session stream, mirroring Pipecat's
`audio_in_filter` and LiveKit's `noise_cancellation=`. This keeps the media server free of
per-application policy, lets an app decide per call, and needs no database migration. The
autopilot is itself a voice application, so it uses the same verb with values from its assistant
config: one mechanism, two front doors.

*Alternative rejected:* a new `audioFilters` relation on `Application` (Prisma migration, proto
field, SDK, CLI and dashboard surface) to be read by the media server. More moving parts, and it
would have forced non-autopilot apps to store configuration they can express in code.

### One chain, both consumers

The chain sits at the fork, so the speech engine and the application's media stream receive the
same filtered audio. An application that wants raw audio simply does not request filters.

*Known limitation, stated rather than designed around:* an application cannot currently take
filtered audio for transcription **and** raw audio on its media stream — relevant to anyone
streaming audio for recording, analytics or voice biometrics. A `scope` field
(`stt` | `stream` | `both`, defaulting to `both`) is the natural extension and is deliberately
left out until something needs it.

### Fail-open everywhere, but tell the application

The chain already disables a filter that throws, rejects or returns the wrong frame length, and
passes audio through. This change extends that to setup: an unknown filter name, invalid options,
a missing SDK, a rejected license or a model that will not load answer the verb with an **error**
the application can log, while the call proceeds **unfiltered**. Silent degradation is the one
outcome to avoid: the failure is reported to the application, logged once by the media server, and
surfaced in the end-of-call stats.

### Secrets stay in the process that uses them

Filter options carry model and strength only. `AIC_SDK_LICENSE` is read by the apiserver, never
sent by an application, never stored in an Application record, and never written to a log. This is
what keeps `app.yaml` files safe to commit.

### Lifetime and replacement

A chain belongs to a call. Sending the verb again replaces it: the new chain is built and awaited
(`ready()`), then swapped in, and the old one is closed. Frames already in flight finish on the
old chain, which is acceptable because the two differ by processing, not by frame count or order.
Hangup closes the chain and logs one line: frames, p50/p95 per frame, and any filter that was
disabled, with the reason.

### Model loading

`ready()` is awaited when the verb is handled, so a call's first audio is not raced by model
loading; if the model is still loading, the filter passes audio through rather than stalling the
call. In production the model file is baked into the image and `autoDownload` is off, so no
network access is needed at call time. The SDK does validate its license against the vendor's
backend, which is an operational dependency worth watching.

## Risks / Trade-offs

- **Narrowband content, wideband model.** The default model has no telephony variant. A real call
  file tested well, but this is the thing to re-check per deployment, and `model` is
  per-application config so a telephony model can be swapped in without code changes.
- **Vendor in the audio path.** Mitigated by fail-open, `bypass` (keeps timing, stops enhancing)
  and the per-session opt-in, so one application can be rolled back without touching others.
- **CPU.** Roughly 1 ms of model time per 20 ms frame per call in the vendor's async worker pool.
  Concurrency per instance must be measured, and `UV_THREADPOOL_SIZE` sized, before wide rollout.
- **Cleaner audio changes VAD behavior.** Silero thresholds were tuned on raw audio; barge-in
  timing may shift on filtered sessions.

## Migration Plan

No migration. The verb is additive, the assistant field is optional, and an unset field means
today's behavior. Rollout is per application: enable one, compare against a control, widen.

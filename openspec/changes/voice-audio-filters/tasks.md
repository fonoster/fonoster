# Tasks

## 1. Contract

- [x] 1.1 Add `AudioFilter { string name; google.protobuf.Struct options; }` and
      `SetAudioFiltersRequest { string media_session_ref; repeated AudioFilter filters; }` to
      `mods/common/src/protos/voice.proto`
- [x] 1.2 Add `SetAudioFiltersRequest set_audio_filters_request = 20` to `VoiceOutStream` and
      `SetAudioFiltersResponse set_audio_filters_response = 19` (with an `error` field, since
      `VerbResponse` cannot carry one) to `VoiceInStream`
- [x] 1.3 Add the `SET_AUDIO_FILTERS_REQUEST` stream content constant and the request/response
      types to `mods/common`

## 2. Voice SDK (`mods/voice`)

- [x] 2.1 Add a `SetAudioFilters` verb class next to `verbs/StreamGather.ts`, validating the list
      shape before it goes on the wire
- [x] 2.2 Add `VoiceResponse.setAudioFilters(filters)`
- [x] 2.3 Add the `aiCoustics(options?)` helper and export it, plus the `AudioFilterConfig` type
- [x] 2.4 Tests: the verb sends what was asked, an empty list is allowed, a bad shape is rejected

## 3. API server (`mods/apiserver`)

- [x] 3.1 Add `createSetAudioFiltersHandler`: build the chain with
      `AudioFilterFactory.createChainFromConfig`, await `ready()`, swap it in, close the old one,
      and answer the verb (error on failure, call unaffected)
- [x] 3.2 Wire it into `VoiceDispatcher`
- [x] 3.3 Hold the current chain on the voice client, and run frames through it in
      `transcribeOnConnection` using `bufferToInt16` / `int16ToBuffer`
- [x] 3.4 Close the chain on hangup and log one end-of-call line: frames, p50/p95 ms per frame,
      and any filter disabled with its reason
- [x] 3.5 Tests: no filters is byte-identical, filters transform the audio, a failing setup keeps
      the call and reports the error, replacing a chain closes the old one, hangup closes it

## 4. Autopilot (`mods/autopilot`)

- [x] 4.1 Add optional `audioFilters` to `assistantSchema` in `mods/common/src/assistants`
- [x] 4.2 Parse `.yaml` / `.yml` assistant files with `js-yaml` (already a dependency), keeping
      JSON working, in `loadAssistantConfigFromFile`
- [x] 4.3 Add `setAudioFilters` to the autopilot's voice wrapper and call it before `answer()`
- [x] 4.4 Tests: YAML and JSON assistants load identically, filters are requested before answering,
      an assistant without `audioFilters` requests none

## 5. Packaging and configuration

- [x] 5.1 Keep `@ai-coustics/aic-sdk` an optional dependency of the apiserver
- [ ] 5.2 Bake the model into the apiserver image and set `autoDownload: false` in production
      config; document the pre-download step
- [x] 5.3 Add `AIC_SDK_LICENSE` to `compose.yaml` and the deployment docs as a secret

## 6. Documentation

- [x] 6.1 Voice SDK example: `setAudioFilters` before `answer`
- [x] 6.2 Autopilot example: `audioFilters` in an application YAML for
      `fonoster applications:create -f app.yaml`
- [ ] 6.3 Operations note: about 30 ms added delay, CPU per call, the vendor's license check
      needing network, and glibc-only binaries (no Alpine)

## 7. Evidence before rollout

- [ ] 7.1 Measure on real call recordings: word error rate, background leakage, latency
- [ ] 7.2 Load test one instance to find calls per core and the right `UV_THREADPOOL_SIZE`
- [ ] 7.3 Enable for one application, compare against a control, then widen

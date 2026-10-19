amd
=================

Answering-machine detection for Fonoster. An ONNX whisper-tiny classifier reads the first seconds
of a call's audio and returns a status (HUMAN, MACHINE, VOICEMAIL, IVR or UNKNOWN), a confidence,
the detector name and the latency.

AppBridge loads it for the `amd` listener: it attaches a listen-only participant to the room,
collects the caller's audio (16 kHz L16) and calls `classifyPcm`. The model ships with the package
in `amd-model/`.

```ts
import { classifyPcm } from "@fonoster/amd";

const verdict = await classifyPcm(pcm);
```

## Regression corpus

`test/fixtures/regression/` is a permanently-stored, correctly-licensed
corpus of 21 audio clips (each 5s or longer) covering all four classifier
labels — 11 human (10 real conversational clips from PolyAI/MINDS-14, CC BY
4.0, plus one scripted-narration edge case), 3 voicemail and 1 answering-
machine clip (real, CC0, from Freesound), and 2 answering-machine + 4 IVR
clips synthesized in-house (no real-world recording with a clean license
turned up for those two categories). `manifest.json` pins each clip's
*current* classifier output (`knownStatus`/`knownConfidence`), which
`test/amd/regression.test.ts` asserts against on every run — the goal is
catching a silent behavior change (model swap, feature-extractor edit,
dependency bump) rather than measuring accuracy. Where the pinned baseline
disagrees with the file's real-world label (`groundTruthLabel`), that's a
documented known accuracy gap, not a test bug — see each entry's `note`; a
few exist on purpose, to track known confusions (e.g. formal/synthesized IVR
scripts reading as MACHINE) rather than hide them.
Licensing and attribution for every third-party clip is in
`test/fixtures/regression/ATTRIBUTION.md`.

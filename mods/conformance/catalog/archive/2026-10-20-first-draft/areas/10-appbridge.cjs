module.exports = {
  prefix: "APB",
  title: "AppBridge",
  scope: "The per-call TypeScript service: the session protocol, turn-taking, the speech layer, call records and webhooks. Roomr and every provider are fakes.",
  level: "L2 Integration (service)",
  tier: "pr",
  uut: "AppBridge (mods/appbridge)",
  tester: "Conformance runner that plays the app, fake Roomr node, fake STT, TTS and LLM providers, replay tool and turn corpus",
  env: "Local with NATS; dedicated runner for timing numbers",
  cadence: "Every pull request; timing, replay and Pipecat nightly",
  diagram: `flowchart LR
  subgraph TESTER["Tester"]
    RUN["Conformance runner (plays the app)"]
    FNODE["Fake Roomr node"]
    FSTT["Fake STT"]
    FTTS["Fake TTS"]
    FLLM["Fake LLM"]
    CORPUS[("Turn corpus + scenarios")]
    HOOK["Webhook receiver"]
  end
  subgraph UUT["Unit under test"]
    APB["AppBridge: session, speech layer, turn detector, call record"]
  end
  subgraph SUP["Support"]
    NATS(("NATS"))
  end
  CORPUS --> RUN
  RUN <-->|"WebSocket (native / twilio)"| APB
  APB <-->|"MediaControl"| NATS
  NATS <--> FNODE
  APB --> FSTT
  APB --> FTTS
  APB --> FLLM
  APB -->|"events"| HOOK`,
  tests: [
    {
      name: "Session lifecycle",
      objective: "A session is created, runs and is cleaned up on hangup.",
      pre: "Fake node.",
      steps: ["Fake node sends an inbound call.", "Runner connects as the app.", "End the call from each side in turn."],
      pass: "The session starts once, ends once, and resources are released within 5 s. The call record is sealed.",
      fail: "A leaked session, a double end, or an unsealed record.",
      pri: "P0", ref: "voice-session",
    },
    {
      name: "Native flavor: full scenario set",
      runs: ["scenarios/voice-session"],
      objective: "Every native-flavor scenario passes.",
      pre: "Scenario files for voice-session.",
      steps: ["Run all voice-session scenarios."],
      pass: "All scenarios pass. None skipped.",
      fail: "Any failure or skip.",
      pri: "P0", ref: "voice-session, conformance",
    },
    {
      name: "Twilio flavor: full scenario set",
      runs: ["scenarios/twilio-media-streams-flavor"],
      objective: "Every Twilio-flavor scenario passes.",
      pre: "Scenario files for twilio-media-streams-flavor.",
      steps: ["Run all scenarios."],
      pass: "All scenarios pass.",
      fail: "Any failure.",
      pri: "P0", ref: "twilio-media-streams-flavor",
    },
    {
      name: "Turn-taking corpus",
      tier: "nightly",
      trials: { k: 5, rate: 1 },
      runs: ["scenarios/turn-taking"],
      objective: "End-of-turn decisions meet the pass bars.",
      pre: "Turn corpus and replay tool. Bars from docs/turn-taking.md.",
      steps: ["Run replay over the corpus.", "Read the report."],
      pass: "Every metric meets its bar (premature cut-in rate, late response rate, barge-in stop time).",
      fail: "Any metric misses its bar.",
      pri: "P0", ref: "turn-taking",
    },
    {
      name: "Interruption stop budget",
      tier: "nightly",
      trials: { k: 5, rate: 1 },
      objective: "Playback stops quickly when the caller interrupts.",
      pre: "Fake TTS streaming audio.",
      steps: ["Start long playback.", "Inject caller speech.", "Measure time to the last audio frame."],
      pass: "Stop time p95 within the budget (50 ms in the T1 timing bar).",
      fail: "Over budget.",
      pri: "P0", ref: "turn-taking",
    },
    {
      name: "Speech layer: STT final and partial",
      objective: "Partial and final transcripts are delivered once and in order.",
      pre: "Fake STT emits partials then a final.",
      steps: ["Stream audio.", "Read events at the app."],
      pass: "Partials arrive in order, one final per utterance, no duplicates (including provider duplicate-final bugs).",
      fail: "Duplicate, missing or reordered transcript events.",
      pri: "P0", ref: "voice-session",
    },
    {
      name: "Speech layer: TTS streaming and play",
      objective: "TTS audio is sent to the node in order and complete.",
      pre: "Fake TTS returns a known waveform.",
      steps: ["App sends say.", "Capture the audio at the fake node."],
      pass: "Captured audio equals the waveform in order and length, at the node's rate.",
      fail: "Gaps, reorder or truncation.",
      pri: "P0", ref: "voice-session",
    },
    {
      name: "Provider selection from the catalog",
      objective: "Catalog ids resolve to the right provider and settings.",
      pre: "Catalog with fake and real entries.",
      steps: ["Create apps with different catalog ids.", "Run calls.", "Check which provider receives audio."],
      pass: "The selected provider is used. An unknown id fails at save time, not at call time.",
      fail: "Wrong provider, or a call-time failure for an invalid id.",
      pri: "P1", ref: "provider-registry",
    },
    {
      name: "Call record content and signature",
      objective: "The call record is complete and tamper-evident.",
      pre: "A completed call with speech, DTMF and a transfer.",
      steps: ["Fetch the record.", "Verify the signature.", "Alter one byte and verify again."],
      pass: "Record has parties, timings, transcript, DTMF, transfer and hangup reason. Signature verifies; the altered copy fails.",
      fail: "Missing content, or tampering not detected.",
      pri: "P0", ref: "call-record",
    },
    {
      name: "Webhook delivery",
      objective: "Workspace webhooks are delivered, signed and retried.",
      pre: "Webhook endpoint that fails twice, then succeeds.",
      steps: ["Complete a call.", "Observe deliveries."],
      pass: "The event arrives with a valid signature, is retried with backoff, and is delivered once successfully. Order per call is preserved.",
      fail: "No retry, a bad signature, or reordered events.",
      pri: "P1", ref: "workspace-webhooks",
    },
    {
      name: "Twilio app unchanged",
      objective: "An existing Twilio Media Streams app works without changes.",
      pre: "Reference Twilio-style app.",
      steps: ["Point a number at the app.", "Place a call.", "Compare behavior with the reference transcript."],
      pass: "Behavior matches the reference.",
      fail: "Any difference.",
      pri: "P1", ref: "twilio-media-streams-flavor",
    },
    {
      name: "Timing: end of turn to first audio",
      tier: "nightly",
      trials: { k: 3, rate: 1 },
      objective: "The added latency of AppBridge is known and within bars.",
      pre: "Dedicated runner. Fake providers with fixed latencies.",
      steps: ["Run 200 turns (CONFORMANCE_TIMING_RUNS=200).", "Read T1 to Tn results."],
      pass: "Every T bar is met at the stated percentile.",
      fail: "A bar is missed.",
      pri: "P1", ref: "conformance",
    },
    {
      "name": "Autopilot scenario set",
      trials: { k: 3, rate: 1 },
      "runs": [
        "scenarios/autopilot"
      ],
      "objective": "Every Autopilot scenario passes.",
      "pre": "Autopilot engine, fake STT, TTS and LLM, scenario files for autopilot.",
      "steps": [
        "Run all autopilot scenarios with the conformance runner."
      ],
      "pass": "All scenarios pass and none is skipped.",
      "fail": "Any failure or skip.",
      "pri": "P0",
      "ref": "autopilot, turn-taking"
    },
  ],
};

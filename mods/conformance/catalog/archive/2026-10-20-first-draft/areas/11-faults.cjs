module.exports = {
  prefix: "FLT",
  title: "Fault injection",
  scope: "Suppress: break each dependency on purpose and check the expected behavior. Where the behavior is not written down, writing it is part of the test.",
  level: "L2/L3 Integration (negative)",
  tier: "nightly",
  uut: "AppBridge and Roomr, plus their reaction to app, provider, NATS and node failures",
  tester: "Fakes with fault switches, a NATS proxy (toxiproxy or a container restart), process kill",
  env: "Local stack with fakes",
  cadence: "Nightly; every pull request for the fast subset",
  diagram: `flowchart LR
  subgraph TESTER["Tester"]
    FAPP["Fake app (fault: slow, drop, bad frames)"]
    FPROV["Fake providers (fault: slow, error, hang)"]
    PROXY["NATS fault proxy / restarter"]
    KILL["Process killer"]
    CHECK["Expectation checker"]
  end
  subgraph UUT["Unit under test"]
    APB["AppBridge"]
    ROOMR["Roomr node"]
  end
  subgraph SUP["Support"]
    NATS(("NATS"))
  end
  FAPP <-->|"WebSocket"| APB
  FPROV <--> APB
  APB <--> PROXY
  PROXY <--> NATS
  NATS <--> ROOMR
  KILL -.-> ROOMR
  KILL -.-> APB
  CHECK -.-> APB
  CHECK -.-> ROOMR`,
  tests: [
    {
      name: "App is a slow reader",
      objective: "A slow app cannot exhaust AppBridge memory or stall the call.",
      pre: "Fake app that reads at 10% of the audio rate.",
      steps: ["Start a call with continuous inbound audio.", "Watch AppBridge memory and the call for 2 min."],
      pass: "Memory stays bounded. Per the spec, audio is dropped or the session closed with the documented code. Other sessions are unaffected.",
      fail: "Unbounded memory growth or impact on other sessions.",
      pri: "P0", ref: "voice-session",
    },
    {
      name: "App disconnects mid-call",
      objective: "A closed app socket ends the call cleanly.",
      pre: "Active call.",
      steps: ["Close the app WebSocket without a goodbye."],
      pass: "The caller is released with the documented behavior (hangup or fallback) within the timeout, and the record shows the reason.",
      fail: "The call stays up in silence.",
      pri: "P0", ref: "voice-session",
    },
    {
      name: "App sends bad and huge frames",
      objective: "Malformed input from an app is contained.",
      pre: "Fake app.",
      steps: ["Send invalid JSON, a 100 MB frame, binary before start, and 10,000 messages per second."],
      pass: "The session closes with the documented code. AppBridge keeps serving other sessions.",
      fail: "Crash, hang or CPU starvation.",
      pri: "P0", ref: "voice-session",
    },
    {
      name: "STT provider disconnects mid-stream",
      objective: "A provider drop is retried or reported.",
      pre: "Fake STT with a disconnect switch.",
      steps: ["Disconnect STT during an utterance.", "Continue speaking."],
      pass: "AppBridge reconnects or switches per policy. The app receives an error event if recovery fails. The call stays up.",
      fail: "Silent loss of transcripts without an event.",
      pri: "P0", ref: "provider-registry",
    },
    {
      name: "TTS provider slow or erroring",
      objective: "A failing TTS does not hang the turn.",
      pre: "Fake TTS with latency and error switches.",
      steps: ["Set TTS to a 10 s first-byte delay.", "Set TTS to return 500.", "Send say."],
      pass: "The app gets an error or timeout event within the budget. The call can continue.",
      fail: "A hang with dead air and no event.",
      pri: "P0", ref: "provider-registry",
    },
    {
      name: "LLM provider hangs (Autopilot)",
      objective: "Autopilot recovers from a stuck LLM call.",
      pre: "Autopilot app, fake LLM that never answers.",
      steps: ["Ask a question.", "Wait for the timeout."],
      pass: "The agent says its fallback line within the configured timeout, and the next turn works.",
      fail: "The call stalls.",
      pri: "P1", ref: "autopilot",
    },
    {
      name: "Wrong audio format from a provider",
      objective: "A provider returning an unexpected format is rejected or converted.",
      pre: "Fake TTS returning 24 kHz when 8 kHz is expected.",
      steps: ["Send say."],
      pass: "The audio is resampled or an error is raised. No chipmunk audio reaches the caller.",
      fail: "Wrong-speed audio on the call.",
      pri: "P1", ref: "provider-registry",
    },
    {
      name: "NATS restart",
      objective: "A bus restart does not kill active calls.",
      pre: "Ten active calls.",
      steps: ["Restart NATS.", "Watch calls for 60 s.", "Place a new call."],
      pass: "RTP calls continue. Control reconnects within the budget. Commands issued during the gap are retried or fail with a clear error. New calls work.",
      fail: "Dropped calls, a stuck process, or lost records.",
      pri: "P0", ref: "deployment",
    },
    {
      name: "NATS partition",
      objective: "A network partition between AppBridge and the node is detected.",
      pre: "Active call.",
      steps: ["Block NATS traffic for the node for 30 s.", "Restore."],
      pass: "The node is marked down after the timeout and the call is ended cleanly on both sides, or recovers if shorter than the timeout.",
      fail: "A zombie call, or a leaked room.",
      pri: "P1", ref: "media-control",
    },
    {
      name: "Roomr node crash mid-call",
      objective: "A node crash is detected and callers are released.",
      pre: "Active calls on one node.",
      steps: ["SIGKILL the node.", "Observe AppBridge, Routr and the records."],
      pass: "AppBridge receives node.down, ends the sessions, and seals records marked as node failure. Routr stops sending to the node.",
      fail: "Sessions stuck, or unsealed records.",
      pri: "P0", ref: "media-control",
    },
    {
      name: "AppBridge crash mid-call",
      objective: "An AppBridge crash does not leave the media node holding the call forever.",
      pre: "Active calls.",
      steps: ["Kill the AppBridge process."],
      pass: "The node ends the orphaned rooms within the timeout. The record is sealed as failed by the recovery path.",
      fail: "Orphaned rooms.",
      pri: "P0", ref: "voice-session",
    },
    {
      name: "Clock skew between services",
      objective: "Signature checks and timestamps tolerate normal skew.",
      pre: "Services with a 2 s skew, then 10 min.",
      steps: ["Start a call with each skew."],
      pass: "2 s skew works. 10 min skew is refused with a clear error.",
      fail: "Failures at 2 s, or acceptance at 10 min.",
      pri: "P2", ref: "voice-session",
    },
  ],
};

module.exports = {
  prefix: "PRD",
  title: "Production synthetic checks",
  scope: "The platform as customers see it. Short synthetic calls and one sign-in against production after every deploy and on a schedule. A failure alerts. This is the only layer that sees what pre-release gates miss.",
  level: "L5 Production",
  tier: "production",
  uut: "The deployed production platform: edge, media nodes, AppBridge, Autopilot, control plane, dashboard",
  tester: "A synthetic-check job with a SIP peer bot behind a production number, a fixture Autopilot agent in a dedicated workspace, a headless browser, and the alerting pipeline",
  env: "Production, a dedicated check workspace, a production number routed to the peer bot",
  cadence: "After every deploy and every 15 minutes; results feed the next release report",
  diagram: `flowchart LR
  subgraph TESTER["Tester"]
    JOB["Synthetic-check job"]
    PEER["Peer bot behind a production number"]
    HB["Headless browser"]
    ALERT["Alerting"]
  end
  subgraph UUT["Unit under test"]
    PROD["Production platform"]
  end
  JOB --> PEER
  JOB --> HB
  PEER <-->|"real calls"| PROD
  HB -->|"sign-in"| PROD
  JOB --> ALERT`,
  tests: [
    {
      name: "Inbound call after deploy",
      objective: "An inbound call to a production number reaches its application and gets a reply.",
      pre: "A production number linked to the fixture agent. Peer bot ready.",
      steps: ["The peer bot calls the number.", "The bot plays a phrase and records the reply.", "The bot hangs up."],
      pass: "Answered within the budget, reply audio present, call record created.",
      fail: "No answer, silence, or no record. Alert raised.",
      pri: "P0", ref: "voice-session, control-plane",
      proof: "Point the check at a number with no application; the check must fail.",
    },
    {
      name: "Outbound call after deploy",
      objective: "An outbound call created through the production API reaches the peer.",
      pre: "Check workspace with an outbound trunk.",
      steps: ["Create a call to the peer bot through the API.", "The bot answers and plays a tone.", "The bot hangs up."],
      pass: "The bot receives the call and the tone is detected both ways.",
      fail: "No call or one-way audio. Alert raised.",
      pri: "P0", ref: "control-plane, roomr",
      proof: "Use a trunk with wrong credentials in a staging run; the check must fail.",
    },
    {
      name: "DTMF after deploy",
      objective: "Digits reach the application in production.",
      pre: "Inbound check call.",
      steps: ["The bot sends 1 2 3 #.", "Read the events the fixture agent saw."],
      pass: "123# received once, in order.",
      fail: "Missing or wrong digits. Alert raised.",
      pri: "P1", ref: "voice-session",
      proof: "Send digits with the fixture's DTMF handler disabled; the check must fail.",
    },
    {
      name: "Transfer after deploy",
      objective: "A cold transfer connects the caller to a second peer.",
      pre: "Two peer bots.",
      steps: ["The fixture agent transfers the caller to the second bot.", "The second bot answers and exchanges tones."],
      pass: "transfer.result success and tones detected.",
      fail: "No transfer or dropped caller. Alert raised.",
      pri: "P1", ref: "media-control",
      proof: "Transfer to an invalid number; the check must fail.",
    },
    {
      name: "Autopilot turn after deploy",
      objective: "The hosted Autopilot answers one turn with real providers.",
      pre: "Fixture agent with the production default STT, TTS and LLM.",
      steps: ["The bot asks a fixed question.", "Record and transcribe the reply.", "Measure end-of-turn to first audio."],
      pass: "The reply contains the expected answer and the latency is within the budget set from the baseline.",
      fail: "Wrong or missing reply, or latency over budget. Alert raised.",
      pri: "P0", ref: "autopilot, turn-taking",
      trials: { k: 3, rate: 1 },
      proof: "Point the agent at a revoked LLM key; the check must fail.",
    },
    {
      name: "Dashboard sign-in after deploy",
      objective: "A user can sign in and load the overview.",
      pre: "A check user in the check workspace.",
      steps: ["Open the dashboard in a headless browser.", "Sign in.", "Wait for the overview to load."],
      pass: "Overview renders with the workspace name within the budget.",
      fail: "Sign-in fails or the page errors. Alert raised.",
      pri: "P0", ref: "dashboard, identity-client",
      proof: "Use a wrong password; the check must fail.",
    },
  ],
};

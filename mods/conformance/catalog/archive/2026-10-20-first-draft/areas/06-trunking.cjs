// The suite is generic. Everything specific to a provider lives in its fixture file
// (fixtures/trunks/<name>.yaml in mods/acceptance): trunk settings (host, auth method, transport,
// codecs, number format), number A (points at our platform), number B (routed to a SIP bot, the
// trunk peer) and the capability matrix (REFER, INFO DTMF, TLS, SRTP, early media).
// Reference mode runs against a local SIP trunk simulator. Live mode runs against whichever real
// provider the deployment is configured to use. The case ids and the code are the same in both.
module.exports = {
  prefix: "TRK",
  title: "Trunking provider",
  scope: "One generic suite for any SIP trunking provider, selected by a fixture file. It runs in reference mode against a local trunk simulator (free, every night) and in live mode against a real provider (release gate, plus a nightly canary). Provider differences are declared in the fixture's capability matrix, and the suite checks that observed behavior equals the declared one.",
  level: "L3/L4 System (trunk edge)",
  tier: "release",
  uut: "The trunk configuration and the call path between the provider and the platform: Routr, RTPEngine, Roomr, AppBridge",
  tester: "Trunk suite with a provider fixture, a SIP peer bot behind number B, the provider's REST API where it has one (to originate calls), a DTMF decoder, a quality scorer, and the declared capability matrix",
  env: "Reference mode: local stack and the trunk simulator. Live mode: production-like stack, a real provider account, test numbers and CI secrets",
  cadence: "Reference mode nightly and on changes to trunking code. Live mode as a release gate, with a nightly canary and a daily spend cap",
  diagram: `flowchart LR
  subgraph TESTER["Tester"]
    SUITE["Trunk suite"]
    FIX[("Provider fixture + capability matrix")]
    PEER["Peer bot behind number B"]
    SCORE["Quality scorer + DTMF decoder"]
    CANARY["Nightly canary (live)"]
  end
  subgraph UUT["Unit under test"]
    EDGE["Routr + RTPEngine"]
    ROOMR["Roomr node"]
    APB["AppBridge"]
  end
  subgraph SUP["Support"]
    PROV["Trunking provider: reference simulator or live"]
  end
  FIX --> SUITE
  SUITE --> PEER
  SUITE -->|"provider API (live)"| PROV
  PEER <--> PROV
  PROV <-->|"SIP trunk to number A"| EDGE
  EDGE <--> ROOMR
  ROOMR <--> APB
  PEER --> SCORE
  CANARY --> SUITE`,
  tests: [
    {
      name: "Inbound call to an application",
      objective: "An inbound call arriving over the trunk reaches the linked application.",
      pre: "Fixture loaded. Number A linked to an application whose fixture replies with a known phrase. Peer bot registered behind number B.",
      steps: ["The peer bot calls number A through the provider (or the provider API originates the call).", "The bot plays a recorded phrase.", "The bot records the reply.", "The bot hangs up."],
      pass: "The call answers, the app receives the transcript of the phrase, the reply is recorded two-way with a quality score at or above the floor, hangup ends the session, and the call record is complete.",
      fail: "No answer, one-way audio, a score below the floor, or an incomplete record.",
      pri: "P0", ref: "control-plane, roomr",
    },
    {
      name: "Outbound call",
      objective: "An outbound call through the trunk reaches the peer.",
      pre: "Outbound trunk with valid credentials. Peer bot behind number B.",
      steps: ["Create a call to number B through the API.", "The peer bot answers and plays a tone for 60 s.", "The bot hangs up."],
      pass: "The bot sees the expected caller ID. The tone is detected for the whole call with no gap over 200 ms.",
      fail: "Call rejected, wrong caller ID, or audio gaps.",
      pri: "P0", ref: "control-plane, roomr",
    },
    {
      name: "Trunk authentication and recovery",
      objective: "The trunk authenticates as configured (registration, credentials or IP) and recovers by itself.",
      pre: "Trunk configured with the auth method named in the fixture.",
      steps: ["Start the stack and read the trunk status through the API.", "Restart Routr.", "Read the status again and place an outbound call."],
      pass: "The trunk is up after start and after restart with no further action, and the call connects.",
      fail: "The trunk stays down or needs an extra action.",
      pri: "P0", ref: "control-plane, roomr",
    },
    {
      name: "Wrong credentials are refused",
      objective: "A trunk with wrong credentials or from a wrong address is refused and creates nothing.",
      pre: "Fixture with an alternate set of wrong credentials and a bot on a non-allowed address.",
      steps: ["Send an INVITE with wrong credentials.", "Send an INVITE from the non-allowed address.", "Check for sessions and rooms."],
      pass: "Both are refused with 401 or 403 and no session or room exists.",
      fail: "Either call reaches an application.",
      pri: "P0", ref: "control-plane, roomr",
    },
    {
      name: "DTMF",
      objective: "DTMF works in both directions over the trunk.",
      pre: "Active call with the peer bot.",
      steps: ["The bot sends 1 2 3 # (RFC 2833, and INFO where the matrix declares it). Read the events in the app.", "The app sends 4 5 6 #. The bot decodes them."],
      pass: "All digits arrive once and in order, both ways, for every declared method.",
      fail: "Any lost, duplicated or wrong digit.",
      pri: "P0", ref: "voice-session, roomr",
    },
    {
      name: "Transfers match the declared capabilities",
      objective: "Every transfer type the matrix declares works, and undeclared ones fail cleanly.",
      pre: "Active inbound call. A second peer bot as the target.",
      steps: ["Cold transfer.", "Warm transfer.", "REFER transfer.", "Transfer to a busy target."],
      pass: "Each declared type connects the caller and the target and reports success. Each undeclared type reports failure and keeps the caller. Observed behavior equals the matrix.",
      fail: "A dropped caller, or a difference from the matrix (the matrix is then wrong or the provider changed).",
      pri: "P1", ref: "media-control, roomr",
    },
    {
      name: "Codec negotiation",
      objective: "A common codec is chosen and the audio is correct.",
      pre: "SDP capture enabled on the bot.",
      steps: ["Place an inbound and an outbound call.", "Read the offered and answered codecs and the telephone-event payload type.", "Score the audio."],
      pass: "A common codec is chosen by our priority. telephone-event is negotiated. The quality score is at or above the codec floor.",
      fail: "No common codec, a 488 response, or a score below the floor.",
      pri: "P1", ref: "roomr",
    },
    {
      name: "Number formats",
      objective: "Numbers are accepted in the format the fixture declares.",
      pre: "Outbound trunk.",
      steps: ["Dial number B as +E.164, national and with leading zeros.", "Read the number the bot receives."],
      pass: "All formats connect to B. The provider receives its required format.",
      fail: "A format fails or reaches another number.",
      pri: "P1", ref: "control-plane",
    },
    {
      name: "Failure responses",
      objective: "Busy, unavailable and declined calls are reported correctly.",
      pre: "Outbound trunk. The peer bot can answer busy, go offline, or decline.",
      steps: ["Call B while the bot answers busy.", "Call B while the bot is unregistered.", "Call B and have the bot decline."],
      pass: "Each ends with the documented status and a call record.",
      fail: "Wrong status, a hang, or no record.",
      pri: "P1", ref: "call-record, control-plane",
    },
    {
      name: "TLS and SRTP when declared",
      objective: "Encrypted signaling and media work on providers that declare them.",
      pre: "Fixture declares tls and srtp. If it does not, the case reports the declared absence and passes only if plain transport is the only one offered.",
      steps: ["Place an inbound and an outbound call over TLS with SRTP.", "Capture the traffic at the edge."],
      pass: "Calls connect and the capture shows no clear signaling or RTP.",
      fail: "A call fails, or clear traffic appears.",
      pri: "P1", ref: "deployment, roomr",
    },
    {
      name: "Reference provider behaves as declared",
      objective: "The trunk simulator itself is correct, so reference-mode results can be trusted.",
      pre: "The simulator and its own fixture.",
      steps: ["Run the simulator's self-test: registration, INVITE flows, REFER accept and reject, DTMF methods, codec offers, failure responses.", "Compare each result with the simulator's declared matrix."],
      pass: "Every behavior equals the declared one.",
      fail: "Any difference.",
      pri: "P1", ref: "conformance",
    },
    {
      name: "Fixture validation",
      objective: "A malformed or incomplete provider fixture fails fast with a clear message.",
      pre: "Fixtures with a missing number, an unknown capability, and an empty spend limit.",
      steps: ["Load each fixture."],
      pass: "Each load fails before any call is placed, naming the problem.",
      fail: "The suite starts and fails later, or places calls.",
      pri: "P2", ref: "conformance",
    },
    {
      name: "Nightly canary",
      objective: "Detect provider-side changes between releases.",
      pre: "A live fixture and a scheduled job.",
      steps: ["Each night place one outbound and one inbound call through the peer bot.", "Check answer, tone presence and hangup."],
      pass: "Both calls complete. The job posts the result.",
      fail: "Any call fails. An issue is opened automatically.",
      pri: "P1", ref: "control-plane, roomr",
    },
    {
      name: "Spend guard",
      objective: "The live suite cannot run up an unbounded bill.",
      pre: "A daily spend limit in the live fixture.",
      steps: ["Run the suite with a limit set below its expected cost.", "Check what runs after the limit is hit."],
      pass: "The suite stops before it exceeds the limit and reports the remaining cases as Blocked, not as Pass.",
      fail: "Spend above the limit, or unrun cases reported as Pass.",
      pri: "P2", ref: "control-plane",
    },
  ],
};

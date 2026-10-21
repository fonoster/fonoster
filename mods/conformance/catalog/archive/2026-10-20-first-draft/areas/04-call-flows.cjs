module.exports = {
  prefix: "CAL",
  title: "Call flows",
  scope: "Every call flow Fonoster uses, end to end through the SIP edge, the media node and AppBridge. This is not a Routr protocol compliance suite.",
  level: 'L3 System (end to end)',
  tier: "nightly",
  uut: 'Routr, RTPEngine, Roomr node, AppBridge, apiserver and NATS together',
  tester: 'Caller bot (sipcaller) and SIP bot endpoints acting as callers, callees and softphones, a trunk peer for the PSTN rows, an app fixture, and the API client for outbound',
  env: 'Real stack (ops/rebuild/stack) with a trunk simulator; a live trunking provider for the PSTN rows',
  cadence: 'Smoke (10 calls) on every push to main; full set nightly and as a release gate',
  diagram: `flowchart LR
  subgraph TESTER["Tester"]
    BOT["sipcaller bot / SIPp"]
    SOFT["Softphone"]
    PEER["Trunk peer (bot behind a DID)"]
    FIX["App fixture"]
    CALLAPI["API client (outbound)"]
  end
  subgraph UUT["Unit under test"]
    EDGE["Routr + RTPEngine"]
    ROOMR["Roomr node"]
    APB["AppBridge"]
    API["Apiserver"]
    NATS(("NATS"))
  end
  subgraph SUP["Support"]
    CAR["Trunking provider (simulator or live)"]
  end
  BOT -->|"SIP + RTP"| EDGE
  SOFT -->|"REGISTER, INVITE"| EDGE
  PEER --> CAR
  CAR -->|"trunk"| EDGE
  CALLAPI --> API
  API --> EDGE
  EDGE --> ROOMR
  ROOMR <--> NATS
  APB <--> NATS
  APB <-->|"WebSocket"| FIX`,
  tests: [
    {
      "name": "PSTN to application",
      "objective": "An inbound PSTN call reaches the app linked to the number.",
      "pre": "Number linked to an application whose fixture replies with a known phrase. Trunk and trunk peer configured.",
      "steps": [
        "The trunk peer originates a call to the number through the trunk.",
        "The peer plays a recorded phrase.",
        "The peer records the reply.",
        "The peer hangs up."
      ],
      "pass": "The call answers within the documented time. The fixture receives the transcript of the phrase, the reply is recorded by the peer, and hangup ends the session. The call record has start, answer, end and the hangup side.",
      "fail": "No answer, one-way audio, or an incomplete record.",
      "pri": "P0",
      "ref": "voice-session, call-record"
    },
    {
      "name": "PSTN to SIP agent",
      "objective": "An inbound PSTN call reaches a registered SIP bot.",
      "pre": "SIP agent with a number. Bot registered as the agent. Trunk peer configured.",
      "steps": [
        "The peer calls the number.",
        "The agent bot answers and exchanges tones with the peer for 30 s.",
        "The agent bot hangs up.",
        "Repeat with the peer hanging up."
      ],
      "pass": "The bot receives the INVITE. Tones are detected in both directions. Each hangup ends the other leg within 2 s.",
      "fail": "No INVITE, one-way audio, or a leg that stays up.",
      "pri": "P0",
      "ref": "roomr, control-plane"
    },
    {
      "name": "PSTN to SIP agent: busy, no answer, offline",
      "objective": "Failure outcomes are reported to the caller and to the record.",
      "pre": "Same as above.",
      "steps": [
        "The peer calls while the agent bot is in another call.",
        "The peer calls and the bot does not answer until the timeout.",
        "Unregister the bot and call."
      ],
      "pass": "The peer sees the documented outcome (busy, timeout, unavailable). The call record shows the reason.",
      "fail": "The call hangs, rings forever, or the record has no reason.",
      "pri": "P1",
      "ref": "roomr"
    },
    {
      "name": "SIP agent to PSTN",
      "objective": "A registered SIP bot can call out through a trunk.",
      "pre": "Bot registered as the agent. Outbound trunk. Trunk peer as the destination.",
      "steps": [
        "The agent bot dials the peer's number.",
        "The peer answers and sends DTMF 1 2 3.",
        "Exchange tones.",
        "The bot hangs up."
      ],
      "pass": "The peer sees the configured caller ID. Tones are detected both ways. The peer decodes 123.",
      "fail": "No ring, wrong caller ID, or lost digits.",
      "pri": "P0",
      "ref": "roomr"
    },
    {
      "name": "SIP agent to SIP agent",
      "objective": "Two registered agents in the same domain can call each other.",
      "pre": "Bots A and B registered.",
      "steps": [
        "A dials B.",
        "B answers.",
        "Exchange tones for 10 s.",
        "B hangs up."
      ],
      "pass": "B receives the INVITE. Tones are detected both ways. Both legs end.",
      "fail": "No INVITE, or a stuck leg.",
      "pri": "P1",
      "ref": "roomr"
    },
    {
      "name": "Outbound call from API to an app",
      "objective": "A call created through the API connects to the app on answer.",
      "pre": "Trunk, number and application configured. Trunk peer as the callee.",
      "steps": [
        "Create a call to the peer with the application.",
        "The peer answers.",
        "The peer speaks a phrase and records the reply.",
        "The peer hangs up."
      ],
      "pass": "On answer the app session starts, the reply is recorded by the peer, and the record links the call to the application.",
      "fail": "No session on answer, or no link in the record.",
      "pri": "P0",
      "ref": "control-plane, voice-session"
    },
    {
      "name": "Outbound call: unanswered, busy, rejected",
      "objective": "Outbound failure outcomes are reported to the API consumer.",
      "pre": "Same as above.",
      "steps": [
        "Create a call and let the peer ring out.",
        "Create a call while the peer is busy.",
        "Create a call and have the peer reject it."
      ],
      "pass": "Each call ends with the documented status (no-answer, busy, declined) and a record exists. No app session starts.",
      "fail": "A wrong status, or an app session for an unanswered call.",
      "pri": "P1",
      "ref": "call-record"
    },
    {
      name: "Caller hangs up before answer",
      objective: "A CANCEL cleans up resources.",
      pre: "Inbound number linked to an application.",
      steps: ["Call the number and hang up while it is ringing.", "Check the node's rooms, AppBridge sessions and the call record."],
      pass: "No room or session remains after 5 s. The record shows an abandoned call.",
      fail: "A leaked room or session.",
      pri: "P1", ref: "roomr",
    },
    {
      name: "ACL deny and allow",
      objective: "Calls from addresses not allowed by the ACL are refused.",
      pre: "Trunk with an ACL that allows one test IP.",
      steps: ["Send an INVITE from the allowed IP.", "Send an INVITE from another IP."],
      pass: "The allowed INVITE proceeds. The other is refused with 403 and creates no session.",
      fail: "The other IP reaches an application.",
      pri: "P0", ref: "control-plane",
    },
    {
      name: "Inbound trunk authentication",
      objective: "Inbound trunks authenticate by IP and by credentials as configured.",
      pre: "One trunk by IP, one by credentials.",
      steps: ["Call through each trunk with correct data.", "Call with wrong credentials.", "Call from the wrong IP."],
      pass: "Correct requests succeed. Wrong ones return 401/403 and create no session.",
      fail: "A wrong request succeeds.",
      pri: "P0", ref: "control-plane",
    },
    {
      name: "Outbound trunk registration",
      objective: "A trunk that needs registration registers and recovers.",
      pre: "A registering outbound trunk against a test registrar.",
      steps: ["Start the stack.", "Check the registration.", "Restart the registrar.", "Place an outbound call."],
      pass: "The trunk registers, re-registers after the registrar restarts, and the call succeeds.",
      fail: "No re-registration, or an outbound failure.",
      pri: "P1", ref: "control-plane",
    },
    {
      name: "Trunk failover",
      objective: "When the first trunk fails, the next is used.",
      pre: "Two outbound trunks in priority order. First one blackholed.",
      steps: ["Place an outbound call.", "Observe which trunk is used and the time to connect."],
      pass: "The call connects through the second trunk within the failover budget (set at baseline).",
      fail: "Call fails or the budget is exceeded.",
      pri: "P1", ref: "control-plane",
    },
    {
      name: "Number formats",
      objective: "Numbers are accepted and normalised in all supported formats.",
      pre: "Outbound trunk. Trunk peer or SIP bot as the destination.",
      steps: ["Dial the same destination as +E.164, E.164 without +, national and with spaces/dashes.", "Inspect the number sent to the provider."],
      pass: "All formats connect to the same destination. The provider receives the format the trunk requires.",
      fail: "Any format fails or reaches another destination.",
      pri: "P1", ref: "control-plane",
    },
    {
      name: "Softphone registration",
      objective: "Registration works and fails correctly.",
      pre: "A SIP agent with credentials.",
      steps: ["Register with correct credentials.", "Register with wrong credentials.", "Let the registration expire.", "Re-register.", "Unregister."],
      pass: "Success returns 200 with the expected expiry. Wrong credentials return 401/403. Calls to an unregistered agent follow the offline outcome.",
      fail: "Any other result.",
      pri: "P0", ref: "control-plane",
    },
    {
      name: "Node balancing",
      tier: "nightly",
      objective: "Routr chooses the node with the fewest sessions and avoids down nodes.",
      pre: "Three Roomr nodes with different X-Session-Count.",
      steps: ["Place 20 calls.", "Stop one node.", "Place 20 more calls."],
      pass: "Calls go to the lowest-count node. No calls go to the stopped node after it is marked down.",
      fail: "Calls reach a down node, or the count is ignored.",
      pri: "P1", ref: "roomr",
    },
    {
      name: "Full node is skipped",
      objective: "A node at capacity receives no new sessions.",
      pre: "A node configured with a low session cap.",
      steps: ["Fill the node.", "Place another call."],
      pass: "The call goes to another node.",
      fail: "The call goes to the full node. This is a known gap; the test is expected to fail until fixed.",
      pri: "P1", ref: "roomr",
    },
    {
      name: "Cross-workspace X-App-Ref is refused",
      objective: "A registered softphone cannot reach an application in another workspace.",
      pre: "Softphone registered in workspace A. An application in workspace B.",
      steps: ["From the softphone, send an INVITE to the media-node peer with the X-App-Ref of B's application.", "Check for a session in B."],
      pass: "The INVITE is refused. No session starts in B.",
      fail: "A session starts. This is a known security gap; the test is expected to fail until fixed.",
      pri: "P0", ref: "roomr, identity",
    },
    {
      name: "Concurrent call limit",
      objective: "Per-workspace limits are enforced.",
      pre: "Workspace limit set to 5.",
      steps: ["Place 5 calls.", "Place a 6th."],
      pass: "The 6th is refused with the documented response. The first 5 continue.",
      fail: "The 6th is accepted, or existing calls are dropped.",
      pri: "P2", ref: "control-plane",
    },
  ],
};

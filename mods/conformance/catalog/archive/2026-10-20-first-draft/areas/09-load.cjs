module.exports = {
  prefix: "LDS",
  title: "Load and soak",
  scope: "Where the platform breaks, why, and whether it recovers. Capacity numbers are only published with the hardware, git SHA and date.",
  level: "L3 System (load)",
  tier: "release",
  uut: "Routr, RTPEngine and Roomr nodes; AppBridge workers (with fake providers)",
  tester: "SIPp / sipcaller bots generating calls, scale.ts for AppBridge sessions, Prometheus and pprof for observation",
  env: "Dedicated hardware or a rented cluster; fake STT, TTS and LLM so we measure our system, not vendors",
  cadence: "Before release and after any media-path change; soak runs 12 to 24 h",
  diagram: `flowchart LR
  subgraph TESTER["Tester"]
    GEN["Call generator: SIPp / sipcaller"]
    SCALE["scale.ts (AppBridge sessions)"]
    OBS["Prometheus, pprof, RTP stats"]
    REPORT[("Report: capacity, limiting resource")]
  end
  subgraph UUT["Unit under test"]
    EDGE["Routr + RTPEngine"]
    NODES["Roomr nodes (N)"]
    APB["AppBridge workers"]
    NATS(("NATS"))
  end
  subgraph SUP["Support"]
    FAKE["Fake STT, TTS, LLM"]
  end
  GEN --> EDGE
  EDGE --> NODES
  NODES <--> NATS
  APB <--> NATS
  SCALE --> APB
  APB --> FAKE
  OBS -.-> EDGE
  OBS -.-> NODES
  OBS -.-> APB
  OBS --> REPORT`,
  tests: [
    {
      name: "Call setup rate ramp",
      objective: "Find the calls-per-second ceiling and what fails first.",
      pre: "Stack on dedicated hardware. Calls last 30 s.",
      steps: ["Start at 1 CPS and double every 2 minutes until the failure criteria.", "Record the CPS at the first failure and the resource that saturated."],
      pass: "Ceiling and limiting resource are recorded. Below the ceiling, 99.9% of calls connect and setup time p95 is within budget (set at baseline).",
      fail: "Failures below the ceiling, or no recorded limiting resource.",
      pri: "P1", ref: "observability",
    },
    {
      name: "Concurrent calls ceiling",
      objective: "Find the highest concurrent call count with acceptable quality.",
      pre: "Calls hold for 10 min with a known audio.",
      steps: ["Ramp concurrency in steps of 100.", "At each step score a sample of calls (ViSQOL) and read CPU, memory, network.", "Stop when quality drops below the floor."],
      pass: "The number N is recorded with the limiting resource, at the quality floor.",
      fail: "Quality degrades without a recorded cause.",
      pri: "P1", ref: "roomr",
    },
    {
      name: "Registration storm",
      objective: "Many softphones re-register at once after a restart.",
      pre: "5,000 simulated registrations.",
      steps: ["Restart Routr.", "All clients re-register within 10 s.", "Place a test call during the storm."],
      pass: "All registrations succeed within the budget. The test call connects.",
      fail: "Registrations dropped, or calls fail.",
      pri: "P1", ref: "control-plane",
    },
    {
      name: "Single node capacity",
      objective: "A Roomr node's session capacity per size.",
      pre: "One node of a given size.",
      steps: ["Add two-leg rooms until quality drops (defined floor or p99 packet-out interval over 25 ms).", "Record CPU, memory, network."],
      pass: "Capacity and limiting resource recorded for each node size.",
      fail: "No limit recorded.",
      pri: "P1", ref: "roomr",
    },
    {
      name: "Fairness: one slow participant",
      objective: "A slow or stalled participant does not harm others in the room or node.",
      pre: "Rooms of five.",
      steps: ["Stall one leg's RTP (stop sending) in one room.", "Score the other legs in that room and in other rooms."],
      pass: "Other legs' scores are unchanged within tolerance. The stalled leg is removed after the dead-leg timeout.",
      fail: "Other legs degrade.",
      pri: "P0", ref: "roomr",
    },
    {
      name: "AppBridge session scale",
      objective: "AppBridge capacity per worker.",
      pre: "scale.ts, fake providers.",
      steps: ["Run 100, 500 and 1000 sessions for 60 s each.", "Record memory per session, event-loop lag, NATS message rate."],
      pass: "Numbers are recorded. Event-loop lag p99 within budget. Memory returns to baseline within 60 s after the sessions end.",
      fail: "Lag over budget, or memory not released.",
      pri: "P1", ref: "voice-session",
    },
    {
      name: "Soak 24 hours",
      objective: "No leaks or drift over a day.",
      pre: "Steady load at 50% of the ceiling.",
      steps: ["Run for 24 h.", "Sample goroutines, memory, file descriptors, ports and RTPEngine sessions every minute."],
      pass: "All series are flat (no trend above the noise band). Call success rate stays at or above 99.9%.",
      fail: "Any growing series, or a drop in success rate.",
      pri: "P1", ref: "observability",
    },
    {
      name: "Node kill under load",
      objective: "Losing a node affects only its calls.",
      pre: "Three nodes at 50% load.",
      steps: ["Kill one node with SIGKILL.", "Watch calls, node.down and new call placement."],
      pass: "The calls on that node end cleanly (caller hears hangup, records are sealed). Other calls are unaffected. New calls avoid the dead node within the detection time.",
      fail: "Other calls degrade, or new calls are routed to the dead node.",
      pri: "P0", ref: "roomr, media-control",
    },
    {
      name: "Overload behavior",
      objective: "Beyond capacity the platform refuses new calls instead of degrading all calls.",
      pre: "Load at 150% of capacity.",
      steps: ["Push beyond the ceiling.", "Score established calls."],
      pass: "New calls are refused with a clear response. Established calls keep their quality.",
      fail: "Established calls degrade.",
      pri: "P1", ref: "roomr",
    },
  ],
};

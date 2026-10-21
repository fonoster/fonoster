module.exports = {
  prefix: "ROM",
  title: "Roomr media node: function",
  scope: "The Go media node in isolation. Inputs are MediaControl commands over NATS and RTP; outputs are events and RTP.",
  level: "L2 Integration (node in isolation)",
  tier: "pr",
  uut: "go/roomr (the media node)",
  tester: "Go e2e tests and the conformance media-control scenarios, with the caller bot (sipcaller) as the SIP and RTP peer and a fake AppBridge issuing MediaControl",
  env: "Local, NATS 2.11 container, Go 1.26, race detector on",
  cadence: "Every pull request; nightly with -race",
  diagram: `flowchart LR
  subgraph TESTER["Tester"]
    FAB["Fake AppBridge (MediaControl commands, event checks)"]
    BOT["sipcaller bot (SIP + RTP legs)"]
    SC[("media-control scenario files")]
    SIG[("Fixed audio signal set")]
  end
  subgraph UUT["Unit under test"]
    NODE["Roomr node: rooms, mixer, SIP legs, forks"]
  end
  subgraph SUP["Support"]
    NATS(("NATS"))
  end
  SC --> FAB
  FAB <-->|"commands and events"| NATS
  NATS <--> NODE
  BOT <-->|"SIP + RTP"| NODE
  SIG --> BOT`,
  tests: [
    {
      name: "Command: answer",
      objective: "The node answers an inbound leg on request.",
      pre: "Node up and heartbeating. Inbound INVITE pending.",
      steps: ["Bot sends INVITE.", "Fake AppBridge receives the inbound event and sends answer.", "Bot checks 200 OK and sends ACK."],
      pass: "200 OK carries SDP with a negotiated codec. RTP flows after ACK.",
      fail: "No 200, no SDP, or no RTP.",
      pri: "P0", ref: "media-control",
    },
    {
      name: "Command: room.create and participant.add",
      objective: "A room is created and a SIP leg joins it.",
      pre: "Node up.",
      steps: ["Send room.create.", "Send participant.add for the inbound leg.", "Read events."],
      pass: "Acks arrive with the command id. participant.joined is emitted. Node session count increases by one.",
      fail: "Missing ack, event or count.",
      pri: "P0", ref: "media-control",
    },
    {
      name: "Command: participant.dial",
      objective: "The node dials out and reports progress.",
      pre: "A bot listening as the callee.",
      steps: ["Send participant.dial to the bot.", "Bot rings, then answers.", "Repeat with busy and no answer."],
      pass: "Progress events (ringing, answered) arrive in order. Busy and no-answer produce the documented failure event.",
      fail: "Missing or wrong events.",
      pri: "P0", ref: "media-control",
    },
    {
      name: "Command: participant.remove and hangup",
      objective: "Removing a participant ends its leg only.",
      pre: "A room with three legs.",
      steps: ["Send participant.remove for leg 2.", "Check legs 1 and 3.", "Send hangup for leg 1."],
      pass: "Leg 2 gets BYE. Legs 1 and 3 keep audio until hangup. participant.left is emitted for each.",
      fail: "Another leg is affected.",
      pri: "P0", ref: "media-control",
    },
    {
      name: "Command: room.end",
      objective: "Ending a room releases everything.",
      pre: "Room with two legs and a listener.",
      steps: ["Send room.end.", "Check SIP, RTP ports, goroutines and room table."],
      pass: "All legs get BYE. room.ended is emitted. Ports and goroutines return to the pre-test level within 5 s.",
      fail: "Any leak.",
      pri: "P0", ref: "media-control",
    },
    {
      name: "Mixer: each participant hears everyone but themselves",
      tier: "nightly",
      objective: "Mix-minus is correct for 2, 3 and 10 participants.",
      pre: "Bots with distinct tones.",
      steps: ["Join N bots, each playing a different tone.", "Record what each bot receives.", "Analyse frequencies."],
      pass: "Each bot hears the other N-1 tones and not its own. Level is within the documented tolerance with no clipping.",
      fail: "Own audio returns (echo), a tone is missing, or clipping.",
      pri: "P0", ref: "roomr",
    },
    {
      name: "Codecs: PCMU, PCMA, Opus and mixed",
      tier: "nightly",
      objective: "Legs with different codecs mix correctly.",
      pre: "Bots offering PCMU, PCMA, Opus.",
      steps: ["Join one bot per codec to one room.", "Play speech from each.", "Record every output."],
      pass: "Each leg receives the others in its own codec. Audio quality score is at or above the codec-pair floor (set at baseline).",
      fail: "Negotiation failure, wrong pitch or speed, or a score below the floor.",
      pri: "P0", ref: "roomr",
    },
    {
      name: "Listener (fork) attach and detach",
      objective: "A fork receives selected tracks and can be removed mid-call.",
      pre: "Room with two legs.",
      steps: ["listener.attach tracks=inbound.", "Detach.", "Attach tracks=both.", "Detach."],
      pass: "The listener receives only the selected tracks. Detach stops the stream without affecting the call.",
      fail: "Wrong tracks, or audio glitch on the call.",
      pri: "P1", ref: "media-control",
    },
    {
      name: "Recording output",
      tier: "nightly",
      objective: "Recordings are complete and in sync.",
      pre: "Recording enabled.",
      steps: ["Run a 60 s two-party call with known audio.", "End the call.", "Fetch the recording."],
      pass: "File opens, length is 60 s within 100 ms, both parties are present, and sync between tracks is within 20 ms.",
      fail: "Truncated, silent or out-of-sync file.",
      pri: "P0", ref: "roomr, call-record",
    },
    {
      name: "DTMF events in and out",
      objective: "The node reports and sends DTMF correctly.",
      pre: "Bot leg.",
      steps: ["Bot sends 2833 digits.", "Send dtmf.send from the fake AppBridge.", "Read events and bot receive log."],
      pass: "dtmf events match the digits sent. The bot receives the digits sent by the node.",
      fail: "Mismatch.",
      pri: "P0", ref: "media-control",
    },
    {
      name: "Hold and resume",
      objective: "hold/resume change the media direction.",
      pre: "Active leg.",
      steps: ["Send hold.", "Check SDP direction and RTP.", "Send resume."],
      pass: "SDP uses sendonly/inactive during hold, RTP stops as specified, and resume restores sendrecv.",
      fail: "Media continues during hold or does not resume.",
      pri: "P1", ref: "media-control",
    },
    {
      name: "Heartbeat and node.down",
      objective: "The node announces itself and its failure.",
      pre: "Node up.",
      steps: ["Observe node.heartbeat intervals.", "Kill the node process (SIGKILL).", "Observe node.down."],
      pass: "Heartbeats arrive at the configured interval with the session count. node.down arrives within the timeout.",
      fail: "No node.down, or wrong counts.",
      pri: "P0", ref: "media-control",
    },
    {
      name: "Invalid commands",
      objective: "Bad commands are rejected with errors and do not disturb other rooms.",
      pre: "Two active rooms.",
      steps: ["Send commands with an unknown roomRef, duplicate ids, missing fields, and an unknown type."],
      pass: "Each gets an error ack with a code. The two rooms keep audio.",
      fail: "Panic, a hang, or audio disruption.",
      pri: "P1", ref: "media-control",
    },
    {
      name: "Node restart reconnect",
      tier: "nightly",
      objective: "The node reconnects to NATS and resumes heartbeats.",
      pre: "Node up.",
      steps: ["Restart NATS.", "Observe the node."],
      pass: "The node reconnects without restarting. Calls on RTP continue. Heartbeats resume.",
      fail: "Node exit, or lost calls beyond the documented behavior.",
      pri: "P1", ref: "media-control",
    },
    {
      "name": "Media-control scenario set",
      "runs": [
        "scenarios/media-control"
      ],
      "objective": "Every media-control scenario passes against the fake node and the Go node.",
      "pre": "Fake node and the Go node, scenario files for media-control.",
      "steps": [
        "Run all media-control scenarios against the fake node.",
        "Run the same scenarios against the Go node."
      ],
      "pass": "Both nodes pass the same scenarios, with no skips.",
      "fail": "A scenario passes on one node and fails on the other, or is skipped.",
      "pri": "P0",
      "ref": "media-control, roomr"
    },
  ],
};

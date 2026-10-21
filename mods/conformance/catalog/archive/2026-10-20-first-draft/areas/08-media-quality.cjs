const lossLevels = [1, 2, 5, 10, 20];
const patterns = ["random", "bursty"];

const loss = lossLevels.flatMap((l) =>
  patterns.map((p) => ({
    name: `Packet loss ${l}% (${p})`,
    objective: `Audio stays intelligible and the node stays stable at ${l}% ${p} loss on the RTP leg.`,
    pre: "Node, a bot leg, and a second leg for recording. tc netem (or UDP proxy) between the bot and the node. Reference signal set.",
    steps: [
      "Establish a two-leg call.",
      `Apply ${p} loss of ${l}% on the inbound leg.`,
      "Send the reference speech file for 60 s.",
      "Record the output of the other leg.",
      "Score the output (ViSQOL) against the reference, and compute added latency, gaps and sample count.",
    ],
    pass: `Score drop against the committed baseline is within the floor for ${l}% ${p} (floor recorded in the first baseline run). Added latency within budget. No crash, no duplicate audio, no SSRC change.`,
    fail: "Score below the floor, a crash, duplicated or reordered audio, or latency over budget.",
    trials: { k: 3, rate: 1 },
    pri: l <= 5 ? "P0" : "P1", ref: "roomr",
  })),
);

module.exports = {
  prefix: "MQ",
  title: "Media quality and packet loss",
  scope: "Objective measurements of what the media path does to audio, and how it behaves when the network misbehaves. Every score is reported relative to the committed baseline, never as an absolute quality claim. Pass bars apply only on the dedicated runner; on shared runners these cases report trends and do not gate.",
  level: "L2 Integration (benchmark)",
  trials: { k: 3, rate: 1 },
  tier: "nightly",
  uut: "Roomr node, with RTPEngine in the path for the edge rows",
  tester: "Signal generator and recorder (bot legs), network impairment (tc netem or UDP proxy), quality scorer (ViSQOL), pprof",
  env: "Dedicated runner with fixed hardware (shared CI reports trends only); results stored with git SHA, hardware and date",
  cadence: "Nightly on a dedicated runner; full set before release",
  diagram: `flowchart LR
  subgraph TESTER["Tester"]
    GEN["Signal generator (bot A)"]
    REC["Recorder (bot B)"]
    SCORE["Quality scorer: ViSQOL"]
    REF[("Reference signal set")]
    IMP["Impairment: tc netem / UDP proxy"]
    REPORT[("Report: SHA, hardware, date, scores")]
  end
  subgraph UUT["Unit under test"]
    NODE["Roomr node: jitter buffer, mixer, codecs"]
    RTPE["RTPEngine (edge rows)"]
  end
  REF --> GEN
  GEN -->|"RTP"| IMP
  IMP -->|"RTP"| NODE
  NODE -.-> RTPE
  NODE -->|"RTP"| REC
  REC --> SCORE
  REF --> SCORE
  SCORE --> REPORT`,
  tests: [
    {
      name: "Baseline: clean network",
      objective: "Establish the reference score, latency and CPU with no impairment.",
      pre: "Reference signal set. No impairment.",
      steps: ["Run each reference file through a two-leg call, for each codec pair.", "Score, and measure added latency and CPU."],
      pass: "Scores, latency and CPU are recorded and committed as the baseline. Added latency under 20 ms (value confirmed at baseline).",
      fail: "No baseline stored, or a score below the codec's published floor.",
      pri: "P0", ref: "roomr",
    },
    ...loss,
    {
      name: "Jitter",
      objective: "Variable delay is absorbed by the jitter buffer.",
      pre: "Impairment tool.",
      steps: ["Apply jitter of 20, 50 and 100 ms.", "Run the reference speech.", "Score and read RTP stats."],
      pass: "Score at or above the floor for each level. Buffer growth stays bounded. Added latency returns to baseline when jitter stops.",
      fail: "Score below the floor, or latency does not recover.",
      pri: "P1", ref: "roomr",
    },
    {
      name: "Reordered packets",
      objective: "Out-of-order packets are put back in order.",
      pre: "Impairment tool.",
      steps: ["Reorder 5% and 20% of packets.", "Run reference speech.", "Compare."],
      pass: "Output has no audible reordering. Score at or above the floor.",
      fail: "Reordered audio in the output.",
      pri: "P1", ref: "roomr",
    },
    {
      name: "Duplicate packets",
      objective: "Duplicates are dropped.",
      pre: "Impairment tool.",
      steps: ["Duplicate 10% of packets.", "Run reference speech.", "Compare sample count."],
      pass: "Output length equals input length within one packet. No repeated audio.",
      fail: "Duplicated audio or a longer output.",
      pri: "P1", ref: "roomr",
    },
    {
      name: "One-way delay",
      objective: "A constant added delay does not break sync or the mix.",
      pre: "Impairment tool.",
      steps: ["Add 100, 250 and 500 ms to one leg in a three-leg room.", "Record each output."],
      pass: "Legs stay stable. Mix contains all participants. Added node latency is unchanged.",
      fail: "Drift, dropouts or a leg reset.",
      pri: "P2", ref: "roomr",
    },
    {
      name: "RTP timestamp jump and SSRC change",
      objective: "A mid-call SSRC change or timestamp jump (provider or NAT rebind) does not break the leg.",
      pre: "Bot able to change SSRC.",
      steps: ["During a call change SSRC.", "Jump the timestamp forward by 10 s.", "Continue the speech."],
      pass: "Audio continues within 200 ms. No crash, no long silence.",
      fail: "Silence, one-way audio, or a dropped call.",
      pri: "P1", ref: "roomr",
    },
    {
      name: "Silence suppression and comfort noise",
      objective: "Gaps in RTP do not create glitches or false drops.",
      pre: "Bot sending DTX/CN.",
      steps: ["Send speech with 10 s of silence (no RTP) in the middle.", "Record the output."],
      pass: "Silence plays as silence or comfort noise. Speech after the gap is intact. The leg is not marked dead.",
      fail: "Clipped first words, or a dropped leg.",
      pri: "P1", ref: "roomr",
    },
    {
      name: "Clock drift",
      objective: "A sender with +/-100 ppm drift does not grow latency over a long call.",
      pre: "Bot with a configurable clock offset.",
      steps: ["Run a 30 min call with +100 ppm and -100 ppm.", "Measure latency at start and end."],
      pass: "Latency growth under 20 ms over 30 min. No audible slip or repeat.",
      fail: "Growing latency, clicks or repeated frames.",
      pri: "P1", ref: "roomr",
    },
    {
      name: "Recording fidelity under loss",
      objective: "The recording matches what the participants heard.",
      pre: "Recording enabled. 5% random loss.",
      steps: ["Run the call.", "Compare the recording with the recorded outputs of both legs."],
      pass: "Recording length equals call length within 100 ms. Scores of recording and live output differ by less than the tolerance set at baseline.",
      fail: "Missing audio or a length mismatch.",
      pri: "P1", ref: "roomr, call-record",
    },
    {
      name: "Resource cost per participant",
      objective: "CPU, memory and allocations per participant are known and stable.",
      pre: "pprof enabled.",
      steps: ["Run rooms of 2, 5 and 10 participants for each codec for 10 min.", "Collect CPU, RSS and allocations/s."],
      pass: "Values recorded in the report. Cost per participant is linear within 20%. No allocations in the steady-state audio loop beyond the budget.",
      fail: "Non-linear growth, or allocation growth over time.",
      pri: "P1", ref: "roomr",
    },
  ],
};

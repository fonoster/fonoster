module.exports = {
  prefix: "XFR",
  title: "Transfers, DTMF and in-call control",
  scope: "The flows we run least often: every transfer type, DTMF in both directions and methods, hold, codec change, early media.",
  level: 'L3 System (end to end)',
  tier: "nightly",
  uut: 'Roomr node, AppBridge and Routr during transfer, DTMF, hold and re-INVITE',
  tester: 'sipcaller bot and SIP bot endpoints as caller and targets, a DTMF decoder, a trunk peer for the PSTN rows, an app fixture',
  env: 'Real stack; a trunk provider (or simulator) that supports REFER for the REFER rows',
  cadence: 'Nightly; release gate',
  diagram: `flowchart LR
  subgraph TESTER["Tester"]
    CALLER["Caller (bot or phone)"]
    TARGET["Transfer target (bot or phone)"]
    DEC["DTMF decoder / generator"]
    FIX["App fixture"]
  end
  subgraph UUT["Unit under test"]
    EDGE["Routr + RTPEngine"]
    ROOMR["Roomr node: room"]
    APB["AppBridge"]
  end
  subgraph SUP["Support"]
    PROV["Trunking provider (REFER)"]
  end
  CALLER --> EDGE
  EDGE --> ROOMR
  ROOMR <-->|"transfer, transfer.result"| APB
  APB <--> FIX
  ROOMR -->|"INVITE"| TARGET
  ROOMR -.->|"REFER"| PROV
  PROV -.-> TARGET
  DEC --- CALLER`,
  tests: [
    {
      "name": "Cold transfer to PSTN",
      "objective": "The app transfers the caller and drops out.",
      "pre": "Active inbound call with an app. A target bot (or trunk peer) ready to answer.",
      "steps": [
        "App sends transfer mode=cold to the target.",
        "The target answers and exchanges tones with the caller.",
        "Check the room and the app session."
      ],
      "pass": "Caller and target are connected (tones detected both ways). transfer.result is success. The app session ends and the room stays until the legs end.",
      "fail": "No connection, no result event, or the app session remains.",
      "pri": "P0",
      "ref": "media-control"
    },
    {
      "name": "Warm transfer to PSTN",
      "objective": "The app speaks to the target first, then joins the caller.",
      "pre": "Same as above.",
      "steps": [
        "App sends transfer mode=warm.",
        "The target answers. The app speaks to the target. The caller bot records its input.",
        "App completes the transfer (transfer.complete)."
      ],
      "pass": "During the consult the caller hears hold audio only, never the consult. After complete, caller and target exchange tones and the app leaves.",
      "fail": "The caller hears the consult, the join fails, or the app stays in the call.",
      "pri": "P0",
      "ref": "media-control"
    },
    {
      "name": "REFER transfer",
      "objective": "A transfer is delegated to the trunking provider with SIP REFER.",
      "pre": "Trunking provider or simulator that supports REFER. mode=refer.",
      "steps": [
        "App sends transfer mode=refer.",
        "Capture the NOTIFY progress.",
        "The target answers."
      ],
      "pass": "Our legs are released after the provider accepts and connects. transfer.result reports success.",
      "fail": "Our leg remains, or the result is wrong.",
      "pri": "P1",
      "ref": "media-control"
    },
    {
      name: "REFER not supported by the provider",
      objective: "A REFER rejected by the provider is reported and the call survives.",
      pre: "Provider or simulator that rejects REFER.",
      steps: ["App sends transfer mode=refer.", "Provider answers 4xx/5xx."],
      pass: "transfer.result is failure with the reason. The caller is still connected to the app.",
      fail: "The call drops, or no result.",
      pri: "P1", ref: "media-control",
    },
    {
      "name": "Transfer target busy, no answer, wrong number",
      "objective": "Each failure leaves the caller connected and reports the reason.",
      "pre": "Active call. Target bots that answer 486, never answer, and answer 404.",
      "steps": [
        "Transfer to the busy target.",
        "Transfer to the target that never answers until timeout.",
        "Transfer to the invalid number."
      ],
      "pass": "Each yields transfer.result failure (busy, no-answer, invalid) and the caller stays with the app.",
      "fail": "The caller is dropped or left in silence.",
      "pri": "P0",
      "ref": "media-control"
    },
    {
      "name": "Caller hangs up during transfer",
      "objective": "Resources are released if the caller leaves mid-transfer.",
      "pre": "Active call.",
      "steps": [
        "Start a transfer to a ringing target bot.",
        "The caller bot sends BYE while the target rings.",
        "Check the target and the room."
      ],
      "pass": "The target bot receives CANCEL within 2 s. No room or session remains.",
      "fail": "The target keeps ringing, or resources leak.",
      "pri": "P1",
      "ref": "media-control"
    },
    {
      "name": "Transfer from a SIP agent",
      "objective": "A SIP agent can transfer a call (different path than an app).",
      "pre": "PSTN caller (trunk peer or bot) connected to an agent bot.",
      "steps": [
        "The agent bot sends REFER, blind then attended.",
        "The target bot answers."
      ],
      "pass": "The caller is connected to the target (tones detected). The agent leg ends.",
      "fail": "No transfer, or both legs stay.",
      "pri": "P1",
      "ref": "roomr"
    },
    {
      name: "DTMF from caller (RFC 2833)",
      objective: "Digits sent as RTP events reach the app.",
      pre: "Inbound call to an app. Caller sends RFC 2833.",
      steps: ["Send 0-9, *, #, A-D.", "Read events in the app."],
      pass: "Each digit arrives once, in order, with correct duration.",
      fail: "A missing, duplicated or wrong digit.",
      pri: "P0", ref: "voice-session",
    },
    {
      name: "DTMF from caller (SIP INFO)",
      objective: "Digits sent by SIP INFO reach the app.",
      pre: "Caller sends SIP INFO.",
      steps: ["Send the same digits by INFO."],
      pass: "Same result as the RFC 2833 test.",
      fail: "Any difference.",
      pri: "P1", ref: "voice-session",
    },
    {
      name: "DTMF to caller",
      objective: "The app can send digits to the far end.",
      pre: "Outbound call to an IVR or a DTMF decoder.",
      steps: ["App sends dtmf.send 1234#.", "Read the decoder output."],
      pass: "The decoder reads 1234# exactly.",
      fail: "Digits are lost, merged or wrong.",
      pri: "P0", ref: "media-control",
    },
    {
      name: "DTMF: long and fast digits",
      objective: "Edge timing is handled.",
      pre: "Inbound call.",
      steps: ["Hold a digit for 3 s.", "Send 10 digits at 50 ms spacing.", "Send the same digit twice quickly."],
      pass: "A long press yields one digit with long duration. Fast digits are all received. Repeated digits are two events.",
      fail: "Long press repeats, or fast digits are lost.",
      pri: "P1", ref: "voice-session",
    },
    {
      "name": "Hold and resume",
      "objective": "A re-INVITE hold mutes media and resume restores it.",
      "pre": "Active call with a bot.",
      "steps": [
        "The bot sends a re-INVITE with a=sendonly.",
        "Check the media direction and the audio.",
        "The bot sends a re-INVITE with a=sendrecv."
      ],
      "pass": "During hold no audio is sent from our side and the app is told. After resume, tones flow both ways.",
      "fail": "Audio leaks while on hold, or one-way audio after resume.",
      "pri": "P1",
      "ref": "media-control"
    },
    {
      name: "Re-INVITE with codec change",
      objective: "Changing codec mid-call does not break audio.",
      pre: "Call established with PCMU.",
      steps: ["Send a re-INVITE offering PCMA only.", "Check audio."],
      pass: "The call continues with PCMA, with no gap over 200 ms.",
      fail: "Audio stops or the call drops.",
      pri: "P1", ref: "roomr",
    },
    {
      "name": "Early media and ringback",
      "objective": "The caller hears ringback or announcements before answer as configured.",
      "pre": "Outbound call to a bot that sends 183 with early media.",
      "steps": [
        "Place the call.",
        "The bot sends a tone in early media before answering."
      ],
      "pass": "The early-media tone is passed through to the caller with no clipping of its start. No audio is sent before the media path is ready.",
      "fail": "Clipped start of early media or silence.",
      "pri": "P2",
      "ref": "roomr"
    },
    {
      "name": "Caller ID and privacy",
      "objective": "Outbound caller ID and privacy headers are honored.",
      "pre": "Number with caller ID set. A SIP bot receiving the call.",
      "steps": [
        "Place an outbound call with the default caller ID.",
        "Place a call with privacy enabled.",
        "Read the From, P-Asserted-Identity and Privacy headers at the bot."
      ],
      "pass": "Default shows the configured number. Privacy sets the correct headers and hides the number.",
      "fail": "Wrong number or a leaked identity.",
      "pri": "P2",
      "ref": "control-plane"
    },
  ],
};

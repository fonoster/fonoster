module.exports = {
  prefix: "SEC",
  title: "Security and isolation",
  scope: "Workspace isolation on the API and on SIP, keys and secrets, service-to-service trust, and signing.",
  level: "L3 System (negative)",
  tier: "pr",
  uut: "Apiserver, identity, Routr, Roomr, AppBridge, NATS and webhook signing",
  tester: "An attacker-role client with legitimate credentials for workspace A, a packet capture, and a log scanner",
  env: "Full stack with two workspaces and distinct data",
  cadence: "Every pull request for the API rows; nightly for SIP and NATS rows",
  diagram: `flowchart LR
  subgraph TESTER["Tester"]
    ATK["Attacker client: legitimate user of workspace A"]
    SOFT["Registered softphone in A"]
    SCAN["Log and traffic scanner"]
  end
  subgraph UUT["Unit under test"]
    API["Apiserver + identity"]
    EDGE["Routr"]
    ROOMR["Roomr node"]
    APB["AppBridge"]
    NATS(("NATS"))
  end
  subgraph DATA["Protected data"]
    WB[("Workspace B resources")]
  end
  ATK -->|"API with A key"| API
  SOFT -->|"SIP with forged X-App-Ref"| EDGE
  EDGE --> ROOMR
  ROOMR --> NATS
  APB --> NATS
  API --> WB
  APB -.-> WB
  SCAN -.-> API
  SCAN -.-> NATS`,
  tests: [
    {
      name: "API: cross-workspace read, update, delete",
      objective: "No RPC reaches another workspace's data.",
      pre: "Resources in A and B. A's key.",
      steps: ["For every RPC, call with ids from B using A's key (see API area)."],
      pass: "All denied with no information leak.",
      fail: "Any access.",
      pri: "P0", ref: "identity",
    },
    {
      name: "SIP: forged X-App-Ref across workspaces",
      tier: "nightly",
      objective: "A registered softphone cannot start a session for another workspace's application.",
      pre: "Softphone registered in A. Application in B.",
      steps: ["Send INVITE with B's X-App-Ref to the media-node peer.", "Check for a session in B."],
      pass: "Refused. No session in B.",
      fail: "A session starts. Known gap, expected to fail until fixed.",
      pri: "P0", ref: "roomr",
    },
    {
      name: "Talk-in-browser is workspace checked",
      objective: "A browser test call cannot target an application in another workspace.",
      pre: "A user in A; an application in B.",
      steps: ["Request a test call for B's application with A's token."],
      pass: "Denied by the gateway.",
      fail: "The call starts.",
      pri: "P0", ref: "talk-in-browser",
    },
    {
      name: "Token tampering",
      objective: "Altered, replayed or unsigned tokens are rejected.",
      pre: "A valid access token.",
      steps: ["Change the workspace claim.", "Change the role claim.", "Strip the signature.", "Use an old refresh token after rotation."],
      pass: "Each is rejected.",
      fail: "Any is accepted.",
      pri: "P0", ref: "identity",
    },
    {
      name: "API key scope and revocation",
      objective: "Keys are limited to their role, and revocation is immediate.",
      pre: "A member-role key.",
      steps: ["Use an owner-only RPC with the key.", "Revoke the key.", "Use it again within 5 s."],
      pass: "Denied the first time. Revoked key fails within the documented time.",
      fail: "Role bypass, or the revoked key still works.",
      pri: "P0", ref: "identity",
    },
    {
      name: "Secrets never appear in logs or responses",
      objective: "Trunk passwords, API keys and provider keys are not leaked.",
      pre: "Secrets with a known marker value.",
      steps: ["Exercise create, get, update and failing paths.", "Scan all service logs, traces and API responses for the marker."],
      pass: "The marker appears nowhere except where the user must see it once (key creation).",
      fail: "Any occurrence.",
      pri: "P0", ref: "observability",
    },
    {
      name: "NATS authentication between services",
      tier: "nightly",
      objective: "Only services with credentials can publish and subscribe, and only on their subjects.",
      pre: "NATS with per-service credentials.",
      steps: ["Connect with no credentials.", "Connect as Routr and subscribe to _INBOX.>.", "Publish a MediaControl command from an unrelated service."],
      pass: "Unauthenticated connections are refused. Cross-service subjects are denied. Known gap: _INBOX.> is readable; expected to fail until fixed.",
      fail: "Any unauthorized subscribe or publish.",
      pri: "P0", ref: "deployment",
    },
    {
      name: "Webhook and session signatures",
      objective: "Receivers can verify messages and reject forgeries.",
      pre: "Receiver code from the docs.",
      steps: ["Verify a real delivery.", "Alter the body.", "Replay an old delivery after the tolerance."],
      pass: "The real delivery verifies. The altered and replayed ones fail.",
      fail: "Any forged message verifies.",
      pri: "P0", ref: "workspace-webhooks, voice-session",
    },
    {
      name: "Transport security",
      tier: "nightly",
      objective: "TLS and SRTP are enforced where configured.",
      pre: "TLS trunk and SRTP-required number.",
      steps: ["Connect to the API over plain HTTP.", "Place a call over SIP/TLS.", "Capture RTP on an SRTP-required call."],
      pass: "Plain HTTP is refused or redirected. The capture shows no clear RTP on the SRTP-required call.",
      fail: "Clear media or an unencrypted API.",
      pri: "P1", ref: "deployment",
    },
    {
      name: "Hostile SIP input does not crash the edge",
      tier: "nightly",
      objective: "Malformed or oversized SIP is rejected and the edge keeps serving calls.",
      pre: "Active calls and a SIP fuzz tool.",
      steps: ["Send malformed requests, giant headers, an INVITE flood and unknown methods for 5 min.", "Watch the active calls."],
      pass: "Hostile traffic is rejected. Active calls are unaffected. No crash.",
      fail: "A crash, or call degradation.",
      pri: "P1", ref: "deployment",
    },
    {
      name: "Recording and record access",
      objective: "Recordings and call records follow workspace access rules.",
      pre: "Records in A and B.",
      steps: ["With A's key, fetch B's recording URL and record id.", "Use an expired signed URL."],
      pass: "Denied for B. Expired URLs fail.",
      fail: "Access granted.",
      pri: "P0", ref: "call-record",
    },
  ],
};

const resources = ["Applications", "Numbers", "Trunks", "Agents (SIP)", "Credentials", "ACLs", "Domains", "Secrets", "API keys", "Webhooks", "Providers", "Workspaces and users", "Call records", "Usage"];

const crud = resources.map((r) => ({
  name: `${r}: input validation`,
  objective: `Every request field of ${r} rejects invalid input with a clear error and no side effects.`,
  pre: "API running. A valid API key for workspace A.",
  steps: [
    `List the request fields of every ${r} operation from the proto/SDK types.`,
    "For each field send: missing, wrong type, empty, too long, invalid format, and an unknown extra field.",
    "Record the response code and message.",
    "List the resource afterwards.",
  ],
  pass: "Each invalid request returns the documented error code (INVALID_ARGUMENT or equivalent) with the field named in the message. Nothing is created or changed.",
  fail: "A request succeeds, returns a generic or 500 error, names no field, or leaves a partial record.",
  pri: "P1", ref: "control-plane",
}));

module.exports = {
  prefix: "API",
  title: "Control-plane API, SDK and CLI",
  scope: "The API surface under the dashboard: input validation, output shape, auth, workspace isolation, and the same results from the SDK and the CLI.",
  level: 'L2 Integration (API)',
  tier: "pr",
  uut: 'Apiserver, identity service and database; the TypeScript SDK and CLI as clients',
  tester: 'Mocha test runner with a shared case file (request, expected response or error), run through SDK, CLI and raw gRPC',
  env: 'Compose stack with throwaway database and NATS',
  cadence: 'Every pull request',
  diagram: `flowchart LR
  subgraph TESTER["Tester"]
    RUN["Test runner"]
    CASES[("Shared case file")]
    TS["TypeScript SDK"]
    CLI["CLI"]
    RAW["Raw gRPC client"]
  end
  subgraph UUT["Unit under test"]
    GW["Apiserver"]
    ID["Identity service"]
    DB[("Database")]
    NATS(("NATS"))
  end
  CASES --> RUN
  RUN --> TS
  RUN --> CLI
  RUN --> RAW
  TS --> GW
  CLI --> GW
  RAW --> GW
  GW --> ID
  GW --> DB
  GW --> NATS`,
  tests: [
    ...crud,
    {
      name: "Output shape matches the types",
      objective: "Every response matches the declared types, including optional fields.",
      pre: "Seeded workspace with one of each resource.",
      steps: ["Call Get and List for every resource.", "Validate each response against the generated types and the JSON schema.", "Compare fields set to their zero value with fields that are absent."],
      pass: "All responses validate. No undeclared fields. Timestamps are ISO-8601 UTC.",
      fail: "Any schema violation.",
      pri: "P1", ref: "control-plane",
    },
    {
      name: "Pagination and ordering",
      objective: "Lists page correctly and in a stable order.",
      pre: "125 applications in one workspace.",
      steps: ["List with page size 50 until the token is empty.", "Collect all ids.", "Repeat with page size 1 and 125.", "Create an item between two page requests."],
      pass: "Every id is returned exactly once. Order is the same across runs. An empty list returns an empty array, not null.",
      fail: "Any duplicate or missing id, or unstable order.",
      pri: "P1", ref: "control-plane",
    },
    {
      name: "No credentials",
      objective: "Calls without authentication are rejected.",
      pre: "API running.",
      steps: ["Call each RPC with no key and no token."],
      pass: "Every RPC returns UNAUTHENTICATED. No data is returned.",
      fail: "Any RPC returns data or a different error.",
      pri: "P0", ref: "identity",
    },
    {
      name: "Wrong or expired credentials",
      objective: "Invalid keys and tokens are rejected.",
      pre: "A valid key; the same key revoked; a token past its expiry.",
      steps: ["Call each RPC with a random key.", "Call each RPC with the revoked key.", "Call each RPC with the expired token."],
      pass: "UNAUTHENTICATED for each.",
      fail: "Any call succeeds.",
      pri: "P0", ref: "identity",
    },
    {
      name: "Cross-workspace access is denied",
      objective: "A key from workspace A cannot read or change workspace B.",
      pre: "Resources with known ids in workspaces A and B. A key for A.",
      steps: ["With A's key, call Get, Update and Delete using ids that belong to B.", "With A's key, call List.", "Check B's data afterwards."],
      pass: "Get, Update and Delete return NOT_FOUND or PERMISSION_DENIED. List contains no B resources. B's data is unchanged.",
      fail: "Any B resource is returned or modified. Differences in error text that reveal that the id exists also fail.",
      pri: "P0", ref: "identity, control-plane",
    },
    {
      name: "Role enforcement",
      objective: "Each role can perform only its allowed operations.",
      pre: "Users with roles owner, admin and member in one workspace.",
      steps: ["For each operation, call it as each role.", "Compare with the permission table."],
      pass: "Allowed operations succeed. All others return PERMISSION_DENIED.",
      fail: "Any difference from the table.",
      pri: "P0", ref: "identity",
    },
    {
      name: "Duplicate and conflicting creates",
      objective: "Duplicate names and ids are handled as documented.",
      pre: "One application named 'sales'.",
      steps: ["Create another application named 'sales'.", "Create two applications concurrently with the same new name."],
      pass: "The documented result (ALREADY_EXISTS or allowed) is returned. Exactly one record exists when uniqueness is required.",
      fail: "Two records where one is required, or a 500.",
      pri: "P1", ref: "control-plane",
    },
    {
      name: "Delete cascade and references",
      objective: "Deleting a resource that others depend on follows the documented rule.",
      pre: "An application linked to a number; a trunk linked to a number.",
      steps: ["Delete the application.", "Read the number.", "Delete the trunk.", "Read the number."],
      pass: "Either the delete is refused with FAILED_PRECONDITION and a clear message, or the reference is cleared. No dangling references.",
      fail: "A dangling reference, or an unclear error.",
      pri: "P1", ref: "control-plane",
    },
    {
      "name": "Outbound call via API",
      tier: "nightly",
      "objective": "Creating a call places a real call and returns a reference.",
      "pre": "Trunk and number configured. A SIP bot registered as the callee.",
      "steps": [
        "Call CreateCall to the bot.",
        "The bot answers and plays a tone.",
        "The bot hangs up.",
        "Get the call record."
      ],
      "pass": "The bot receives the INVITE and the tone is detected end to end. The response contains a call reference. The call record shows start, answer and end times.",
      "fail": "No ring, no reference, or an incomplete record.",
      "pri": "P0",
      "ref": "control-plane, call-record"
    },
    {
      name: "TypeScript SDK and raw API give the same results",
      objective: "The SDK adds no behavior difference over the API.",
      pre: "The shared case file (request, expected response or error).",
      steps: ["Run every case through the SDK.", "Run every case through raw gRPC.", "Diff the results."],
      pass: "Responses and error codes are identical for all cases.",
      fail: "Any difference.",
      pri: "P1", ref: "control-plane",
    },
    {
      name: "CLI smoke per command group",
      objective: "Each CLI command group runs against a live API.",
      pre: "CLI configured with a valid key.",
      steps: ["For each command group run create, get, list, update and delete.", "Check exit codes and output format (table and JSON)."],
      pass: "Exit code 0 on success and non-zero on error. JSON output validates against the types.",
      fail: "Wrong exit code, or invalid JSON.",
      pri: "P2", ref: "ctl",
    },
    {
      name: "Rate limiting",
      objective: "Excess requests are limited without harming other workspaces.",
      pre: "Rate limit configured. Two workspaces.",
      steps: ["Send requests above the limit from workspace A.", "Send normal requests from workspace B at the same time."],
      pass: "A receives RESOURCE_EXHAUSTED with retry information. B is unaffected.",
      fail: "No limit, or B is limited.",
      pri: "P1", ref: "control-plane",
    },
    {
      "name": "Capabilities: community defaults",
      "objective": "GetCapabilities returns the community defaults.",
      "pre": "Apiserver started with no features.auth configuration.",
      "steps": [
        "Call Capabilities/GetCapabilities with no token."
      ],
      "pass": "The response lists methods [password] and signup invite, and has no GitHub block.",
      "fail": "Any other methods, or a GitHub block.",
      "pri": "P1",
      "ref": "capabilities"
    },
    {
      "name": "Capabilities: cloud configuration",
      "objective": "GetCapabilities reflects the cloud configuration and never returns secrets.",
      "pre": "features.auth.methods [github, email_code] and identity.oauth2.github set, with a client secret.",
      "steps": [
        "Call GetCapabilities.",
        "Search the whole response for the client secret value."
      ],
      "pass": "Both methods and the GitHub client id and authorize URL are returned. The secret does not appear anywhere in the response.",
      "fail": "A missing field, or the secret in the response.",
      "pri": "P0",
      "ref": "capabilities"
    },
    {
      "name": "Capabilities: public",
      "objective": "GetCapabilities needs no credentials.",
      "pre": "Apiserver running.",
      "steps": [
        "Call GetCapabilities with no token and no key."
      ],
      "pass": "The call succeeds.",
      "fail": "UNAUTHENTICATED.",
      "pri": "P1",
      "ref": "capabilities"
    },
    {
      "name": "Identity service: starts standalone",
      "objective": "The Identity service runs alone on its configured port without telephony dependencies.",
      "pre": "Identity configuration and an empty database. No NATS and no Asterisk running.",
      "steps": [
        "Start the service.",
        "Call GetPublicKey with no token."
      ],
      "pass": "The service binds the configured address and answers. It started no NATS or Asterisk/ARI connection.",
      "fail": "It needs NATS or Asterisk, or does not bind.",
      "pri": "P0",
      "ref": "identity-service"
    },
    {
      "name": "Identity service: public and protected methods",
      "objective": "Only allow-listed methods work without a token.",
      "pre": "Service running.",
      "steps": [
        "Call CreateUser, ExchangeCredentials and GetPublicKey with no token.",
        "Call CreateWorkspace with no token.",
        "Call CreateWorkspace with a valid access token."
      ],
      "pass": "The public methods are processed. CreateWorkspace with no token is rejected as unauthenticated before the handler runs. With a token the workspace owner is taken from the token.",
      "fail": "A protected method runs without a token.",
      "pri": "P0",
      "ref": "identity-service"
    },
    {
      "name": "Identity service: fail fast on missing configuration",
      "objective": "The service refuses to start with incomplete configuration.",
      "pre": "Valid configuration.",
      "steps": [
        "For each required value (database URL, signing keys) remove it and start the service.",
        "Read the exit status and error."
      ],
      "pass": "The process exits with a non-zero status and an error naming the missing value.",
      "fail": "The service starts, or the error does not name the value.",
      "pri": "P1",
      "ref": "identity-service"
    },
    {
      "name": "Identity service: database provisioning",
      "objective": "The provisioning entrypoint creates the schema on an empty database.",
      "pre": "An empty database.",
      "steps": [
        "Run the provisioning entrypoint.",
        "Inspect the schema.",
        "Run it a second time."
      ],
      "pass": "The Identity schema exists. The second run changes nothing and does not fail.",
      "fail": "Missing tables, or an error on re-run.",
      "pri": "P1",
      "ref": "identity-service"
    },
    {
      "name": "Identity service: published image",
      "objective": "The published container image runs the service.",
      "pre": "The image tag built by the release pipeline.",
      "steps": [
        "Run the image with valid configuration.",
        "Call GetPublicKey."
      ],
      "pass": "The gRPC service answers on the configured port.",
      "fail": "The container exits or does not answer.",
      "pri": "P1",
      "ref": "identity-service"
    },
    {
      "name": "Identity service: library import is server-free",
      "objective": "Importing the package as a library starts nothing.",
      "pre": "The @fonoster/identity package.",
      "steps": [
        "In a test process import buildIdentityService from the main entry.",
        "List listening sockets and loaded server-only modules."
      ],
      "pass": "No gRPC server is started and the server-only modules are not loaded.",
      "fail": "A listening socket or a loaded server module.",
      "pri": "P2",
      "ref": "identity-service"
    },
  ],
};

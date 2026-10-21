module.exports = {
  prefix: "OPS",
  title: "Deployment, upgrade, Kubernetes and observability",
  scope: "Does it install, upgrade, recover and tell us what it is doing. Functional rows run on kind or k3d; scale rows run on a rented cluster. Media results from kind are not trusted.",
  level: "L3 System (operations)",
  tier: "release",
  uut: "Compose bundle, Helm chart, all services, upgrade and migration paths, telemetry",
  tester: "Install scripts, kubectl/helm, a chaos script, the 10-call smoke, an OpenTelemetry collector with assertions",
  env: "kind or k3d (functional); a real cluster for a few days (scale); a dedicated media setup (host networking, dedicated nodes)",
  cadence: "Install, upgrade and smoke on every release candidate; chaos and scale before release",
  diagram: `flowchart LR
  subgraph TESTER["Tester"]
    INST["Install and upgrade scripts"]
    SMOKE["10-call smoke"]
    CHAOS["Chaos script: pod kill, drain, restart"]
    LOAD["Load generator"]
    OTELCHK["Telemetry assertions"]
  end
  subgraph UUT["Unit under test"]
    HELM["Helm chart / Compose bundle"]
    SVC["All services"]
    MEDIA["Roomr + RTPEngine (host networking)"]
    MIG["Data migration"]
  end
  subgraph SUP["Support"]
    K8S["kind / k3d or real cluster"]
    OTEL["OpenTelemetry collector"]
  end
  INST --> HELM
  HELM --> K8S
  HELM --> SVC
  SVC --> MEDIA
  SMOKE --> SVC
  CHAOS --> K8S
  LOAD --> MEDIA
  SVC --> OTEL
  OTELCHK --> OTEL
  INST --> MIG`,
  tests: [
    {
      "name": "Compose install from scratch",
      "objective": "The bundle starts a working self-hosted platform.",
      "pre": "A clean VM or container host with Docker. The bundle from ops/bundle.",
      "steps": [
        "Extract the install commands from ops/bundle/README.md and run them unchanged.",
        "Wait for every service health check.",
        "Run the 10-call smoke."
      ],
      "pass": "All services are healthy within the documented time. The smoke passes without any additional command.",
      "fail": "A README command fails, or another action is needed.",
      "pri": "P0",
      "ref": "self-host-installer"
    },
    {
      name: "Helm install from scratch",
      objective: "The chart installs on an empty cluster.",
      pre: "Empty kind or k3d cluster.",
      steps: ["helm install with the default values.", "Wait for readiness.", "Run the smoke."],
      pass: "All pods ready. Smoke passes.",
      fail: "Failure or crash loops.",
      pri: "P0", ref: "deployment",
    },
    {
      name: "Helm upgrade and rollback",
      objective: "Upgrading and rolling back keep data and settings.",
      pre: "Installed previous release with data.",
      steps: ["helm upgrade to the candidate.", "Run the smoke and read old data.", "helm rollback.", "Read again."],
      pass: "Data intact after both. Smoke passes after each.",
      fail: "Data loss or errors.",
      pri: "P0", ref: "deployment",
    },
    {
      "name": "Migration from v0.x",
      "objective": "An existing v0.x installation upgrades to the rebuild without data loss.",
      "pre": "A v0.x installation image seeded with applications, numbers, trunks, agents and keys by a fixture script.",
      "steps": [
        "Run the documented migration.",
        "Export every resource through the API before and after, and diff them.",
        "Run the call smoke for inbound and outbound."
      ],
      "pass": "Every resource is present and working. Differences are only those listed as retired in the migration notes.",
      "fail": "Lost data, an unlisted difference, or broken calls.",
      "pri": "P0",
      "ref": "control-plane, deployment"
    },
    {
      name: "Config change and secret rotation",
      objective: "Configuration and secret changes apply without outage.",
      pre: "Running stack.",
      steps: ["Change a service YAML value.", "Rotate a provider key and a signing secret.", "Place calls throughout."],
      pass: "Changes apply on rollout. Calls started before the change are not dropped by the config itself.",
      fail: "Dropped calls, or the old secret still in use.",
      pri: "P1", ref: "service-config",
    },
    {
      name: "Random pod kill",
      objective: "The stack recovers from losing any single pod.",
      pre: "Stack under light call load.",
      steps: ["Kill one pod of each service in turn.", "Watch the calls and recovery."],
      pass: "Each pod is replaced within the budget. Only calls on that pod are affected. New calls keep working.",
      fail: "A multi-service outage.",
      pri: "P0", ref: "deployment",
    },
    {
      name: "Rolling update with live calls",
      objective: "Updating Roomr and AppBridge does not drop active calls.",
      pre: "50 active calls.",
      steps: ["Roll out a new image for Roomr, then AppBridge.", "Watch the calls."],
      pass: "Pods drain: active calls finish on the old pod (or are handled per the documented policy) and new calls go to new pods.",
      fail: "Active calls dropped without the documented policy.",
      pri: "P0", ref: "deployment",
    },
    {
      name: "Node drain with active calls",
      objective: "Draining a Kubernetes node behaves as documented.",
      pre: "Real cluster, calls on the node.",
      steps: ["kubectl drain the node.", "Observe calls and rescheduling."],
      pass: "Calls follow the drain policy (finish within the grace period or are ended cleanly with sealed records).",
      fail: "Hard drops, or records not sealed.",
      pri: "P1", ref: "deployment",
    },
    {
      name: "Autoscaling",
      objective: "Services scale with load and back down.",
      pre: "Autoscaling enabled.",
      steps: ["Ramp load to 2x one pod's capacity.", "Hold, then drop the load."],
      pass: "Pods scale up before quality drops, and scale down after the cool-down without dropping calls.",
      fail: "Quality loss while scaling, or a drop on scale-down.",
      pri: "P1", ref: "deployment",
    },
    {
      name: "Media networking on the supported setup",
      objective: "Audio quality on Kubernetes matches the bare-metal baseline.",
      pre: "Supported media setup (host networking, dedicated nodes). Baseline from MQ-001.",
      steps: ["Run the baseline and 5% loss tests on the cluster.", "Compare scores."],
      pass: "Scores are within the tolerance of the baseline. UDP port ranges are as documented.",
      fail: "A lower score or port problems.",
      pri: "P0", ref: "deployment",
    },
    {
      name: "Cross-zone and noisy neighbors",
      objective: "Cluster placement effects are known.",
      pre: "Real cluster across zones, with a noisy workload on the same node.",
      steps: ["Place Roomr and RTPEngine in different zones.", "Run a CPU hog on the Roomr node.", "Score calls."],
      pass: "Impact is measured and recorded. Placement rules in the docs prevent the bad cases.",
      fail: "Unknown impact.",
      pri: "P2", ref: "deployment",
    },
    {
      name: "Trace for a call",
      objective: "One call produces one linked trace across services.",
      pre: "OpenTelemetry collector.",
      steps: ["Place a call.", "Query the trace by call id."],
      pass: "A single trace links Routr, node, AppBridge and the apiserver, with the span names in the spec.",
      fail: "A broken or missing trace.",
      pri: "P1", ref: "observability",
    },
    {
      name: "Metrics and health endpoints",
      objective: "Every service exposes health and the documented metrics.",
      pre: "Stack running.",
      steps: ["Scrape each service.", "Compare with the metric list in the spec."],
      pass: "All metrics in the spec exist with the right labels. Health endpoints reflect real readiness.",
      fail: "Missing metrics, or false-healthy.",
      pri: "P1", ref: "observability",
    },
    {
      "name": "Data retention and erasure",
      "objective": "Retention settings and erasure requests are honored.",
      "pre": "Records and recordings older than the retention period, created by a fixture with backdated timestamps.",
      "steps": [
        "Run the retention job.",
        "Request erasure for one call.",
        "List the records, query storage and the search index."
      ],
      "pass": "Expired data is removed. Erased data is gone from the database and object storage. Known gap: there is no CLI or UI for erasure; the test uses the API, and the missing interface is tracked as a feature gap.",
      "fail": "Data remains.",
      "pri": "P2",
      "ref": "call-record"
    },
    {
      "name": "Dev container: first open",
      "objective": "A fresh clone opens in the dev container with healthy dependencies and generated config.",
      "pre": "A fresh clone and the devcontainer CLI.",
      "steps": [
        "Build and start the dev container.",
        "Read the health of NATS, Postgres and MinIO.",
        "List .dev/ and run git status."
      ],
      "pass": "All three dependencies are healthy. .dev/.env, .dev/config/*.yaml and .dev/config/keys/ exist and git status shows them untracked or ignored.",
      "fail": "An unhealthy dependency, or secrets showing as changes.",
      "pri": "P1",
      "ref": "developer-environment"
    },
    {
      "name": "Dev container: dependencies match the bundle",
      "objective": "The dev dependencies use the same images as the release bundle.",
      "pre": "The repository.",
      "steps": [
        "Render .devcontainer/compose.yaml with docker compose config.",
        "Compare each dependency image with ops/bundle/compose.yaml."
      ],
      "pass": "Each image is identical.",
      "fail": "Any mismatch.",
      "pri": "P2",
      "ref": "developer-environment"
    },
    {
      "name": "Dev container: old commands are gone",
      "objective": "Retired development paths no longer exist.",
      "pre": "The repository.",
      "steps": [
        "Search for npm run start:services, compose.dev.yaml and the other retired commands in package.json, scripts and CONTRIBUTING.md."
      ],
      "pass": "None exists, and CONTRIBUTING.md describes only the dev container.",
      "fail": "Any retired command remains.",
      "pri": "P2",
      "ref": "developer-environment"
    },
    {
      "name": "Dev config: re-render keeps secrets",
      "objective": "Regenerating dev config does not rotate secrets.",
      "pre": "An opened dev container.",
      "steps": [
        "Hash .dev/.env.",
        "Run npm run dev:config.",
        "Hash again and compare the service files."
      ],
      "pass": "Every value in .dev/.env is unchanged and the service files are rendered again.",
      "fail": "A changed secret.",
      "pri": "P1",
      "ref": "developer-environment"
    },
    {
      "name": "Dev stack: everything up",
      "objective": "npm run dev brings up the whole platform.",
      "pre": "An opened dev container.",
      "steps": [
        "Run npm run dev.",
        "Request the dashboard on the host port.",
        "Sign in as the owner, create an agent with the fake models and call it with a SIP bot."
      ],
      "pass": "The dashboard answers, sign-in works, the Roomr node answers the call and the bot hears the agent. No provider keys were needed.",
      "fail": "Any step fails.",
      "pri": "P0",
      "ref": "developer-environment"
    },
    {
      "name": "Dev stack: reload per component",
      "objective": "Saving a file reloads only its component.",
      "pre": "npm run dev running.",
      "steps": [
        "Touch a file under mods/appbridge/src.",
        "Touch a .go file under go/roomr while npm run dev:roomr runs, once valid and once with a build error.",
        "Watch the processes."
      ],
      "pass": "AppBridge restarts and the others keep running. Roomr rebuilds and restarts, or prints the build error and keeps the previous binary running.",
      "fail": "Other components restart, or a build error kills the node.",
      "pri": "P2",
      "ref": "developer-environment"
    },
    {
      "name": "Dev tests use the test NATS",
      "objective": "Test suites run against the test NATS, not the dev stack's.",
      "pre": "Dev stack and test NATS both running.",
      "steps": [
        "Run npm test and the Go tests.",
        "Capture connections on each NATS."
      ],
      "pass": "The suites connect only to the test NATS.",
      "fail": "A connection to the dev NATS.",
      "pri": "P2",
      "ref": "developer-environment"
    },
  ],
};

module.exports = {
  prefix: "BRG",
  title: "Billing, metering and regions",
  scope: "Money and distribution: usage metering and the credit ledger against the Stripe fake, and private regions enrolled from another machine.",
  level: "L3 System",
  tier: "nightly",
  uut: "Billing service, usage metering, region agent and region enrollment",
  tester: "Stripe fake (same events and behavior as Stripe) and a scripted call generator; for regions, a second machine or container stack",
  env: "Compose stack with the Stripe fake; two stacks for the region rows",
  cadence: "Every pull request for billing; nightly for regions",
  diagram: `flowchart LR
  subgraph TESTER["Tester"]
    STRIPE["Stripe fake (events + dashboard)"]
    CALLS["Call generator with known durations"]
    R2["Second stack (private region)"]
  end
  subgraph UUT["Unit under test"]
    METER["Usage metering"]
    BILL["Billing service: rater, ledger, admission"]
    CP["Control plane"]
    RA["Region agent"]
  end
  CALLS --> METER
  METER --> BILL
  BILL <-->|"API + webhooks"| STRIPE
  CP <-->|"config sync"| RA
  RA --- R2`,
  tests: [
    {
      name: "Metering accuracy",
      objective: "Billed usage equals actual usage.",
      pre: "Calls with known durations and features (AMD, noise cancelling).",
      steps: ["Place 20 calls of known length.", "Read usage after they end."],
      pass: "Usage equals the known totals within the rounding rule. Each feature is metered separately.",
      fail: "A difference above the rounding rule.",
      pri: "P0", ref: "usage-metering",
    },
    {
      name: "Credit ledger",
      objective: "Credits are debited correctly and never go below the rule.",
      pre: "Workspace with 1,000 credits ($0.01 each).",
      steps: ["Use credits through calls.", "Read the ledger and balance."],
      pass: "Ledger entries sum to the balance. Each entry references its usage.",
      fail: "A mismatch.",
      pri: "P0", ref: "usage-metering",
    },
    {
      name: "Admission when credits run out",
      objective: "Calls are refused when the workspace cannot pay.",
      pre: "Balance near zero.",
      steps: ["Place a call that would exceed the balance."],
      pass: "The call is refused (or ended) per the documented rule, with a clear reason. Other workspaces are unaffected.",
      fail: "Unbounded negative balance.",
      pri: "P0", ref: "usage-metering",
    },
    {
      name: "Subscribe, pay and invoice",
      objective: "A plan purchase works through Stripe events.",
      pre: "Stripe fake.",
      steps: ["As owner, subscribe to a plan ($25 minimum).", "Complete payment in the fake.", "Check the workspace."],
      pass: "The plan is active after the paid event. An invoice is visible to the workspace owner role.",
      fail: "State differs from the Stripe fake's.",
      pri: "P0", ref: "usage-metering",
    },
    {
      name: "Payment failure and recovery",
      objective: "A failed payment restricts the workspace and recovery restores it.",
      pre: "Active plan.",
      steps: ["Fail the next payment in the fake.", "Observe the workspace.", "Pay successfully."],
      pass: "The workspace follows the documented grace and restriction rules, and is restored after payment.",
      fail: "No restriction, or no recovery.",
      pri: "P0", ref: "usage-metering",
    },
    {
      name: "Duplicate and out-of-order Stripe events",
      objective: "Webhook processing is idempotent.",
      pre: "Stripe fake able to replay.",
      steps: ["Send each event twice.", "Send events out of order."],
      pass: "The final state is correct and no double charge or credit occurs.",
      fail: "Double processing.",
      pri: "P0", ref: "usage-metering",
    },
    {
      "name": "Private region enrollment",
      "objective": "A private region can be enrolled from a second stack.",
      "pre": "Second stack (a second Compose project or VM) with the region agent image.",
      "steps": [
        "Create a region through the API and take the enrollment command.",
        "Run the command in the second stack from the test script.",
        "Poll the region status."
      ],
      "pass": "The region becomes online within the timeout. Config syncs. The nodes are listed.",
      "fail": "Enrollment fails or the status is wrong.",
      "pri": "P1",
      "ref": "private-regions"
    },
    {
      "name": "Call in a private region",
      "objective": "A call is handled in the region and records reach the control plane.",
      "pre": "Enrolled region and an application assigned to it.",
      "steps": [
        "A SIP bot calls a number in the region.",
        "Exchange tones and hang up.",
        "Capture RTP at the global stack's edge.",
        "Read the record through the API."
      ],
      "pass": "All media terminates inside the region (no RTP seen at the global edge). The record appears in the control plane.",
      "fail": "Media goes through another region, or the record is missing.",
      "pri": "P1",
      "ref": "private-regions"
    },
    {
      name: "Region offline",
      objective: "A lost region is shown as offline and does not affect others.",
      pre: "Enrolled region.",
      steps: ["Disconnect the region.", "Place calls in other regions.", "Reconnect."],
      pass: "The region shows offline within the timeout. Other regions are unaffected. Config resyncs on return.",
      fail: "Wrong status or cross-region impact.",
      pri: "P1", ref: "regions",
    },
    {
      name: "Placement skips unavailable nodes",
      objective: "New sessions go only to nodes that are up and have capacity.",
      pre: "Region with three nodes, one down, one full.",
      steps: ["Place 10 calls."],
      pass: "All calls land on the healthy node. Known gap: full nodes are not skipped today.",
      fail: "A call lands on a down or full node.",
      pri: "P1", ref: "regions",
    },
    {
      "name": "Region scenario set",
      "runs": [
        "scenarios/regions"
      ],
      "objective": "Every region scenario passes.",
      "pre": "Region agent and control plane, scenario files for regions.",
      "steps": [
        "Run all region scenarios with the conformance runner."
      ],
      "pass": "All scenarios pass and none is skipped.",
      "fail": "Any failure or skip.",
      "pri": "P1",
      "ref": "regions, private-regions"
    },
  ],
};

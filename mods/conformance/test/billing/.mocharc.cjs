// The Billing area (mods/conformance/catalog/areas/billing.md): metering in the apiserver and
// AppBridge, the billing service and the Stripe fake, in one mocha process. The viewer's cases run
// in Playwright (mods/stripe-fake/viewer).
const path = require("path");

const root = path.join(__dirname, "..", "..", "..", "..");

// Every @fonoster package from source (see tsconfig.json here); mocha's node-option child inherits it.
process.env.TSX_TSCONFIG_PATH = path.join(__dirname, "tsconfig.json");

/** The area's mocha test files, also read by prove.sh. */
const spec = [
  "mods/stripe-fake/test/stripeFake.test.ts",
  "mods/billing/test/rater.test.ts",
  "mods/billing/test/ledger.test.ts",
  "mods/billing/test/admission.test.ts",
  "mods/billing/test/applyUsage.test.ts",
  "mods/billing/test/operator.test.ts",
  "mods/billing/test/stripe.test.ts",
  "mods/billing/test/api.test.ts",
  "mods/apiserver/test/usage/ingest.test.ts",
  "mods/apiserver/test/usage/getUsage.test.ts",
  "mods/apiserver/test/usage/consumer.test.ts",
  "mods/apiserver/test/usage/recordedUsage.test.ts",
  "mods/apiserver/test/usage/evalUsage.test.ts",
  "mods/apiserver/test/usage/fullstack.test.ts",
  "mods/apiserver/test/billing/proxy.test.ts",
  "mods/appbridge/test/usage.test.ts",
  "mods/conformance/test/billingScenarios.test.ts"
];

module.exports = {
  "node-option": ["import=tsx"],
  spec: process.env.BIL_SPEC
    ? process.env.BIL_SPEC.split(" ").filter(Boolean)
    : spec.map((f) => path.join(root, f)),
  require: [
    path.join(root, "mods/apiserver/test/setupConfig.ts"),
    path.join(root, "mods/conformance/test/natsBusLock.ts")
  ],
  timeout: 60000,
  exit: true
};

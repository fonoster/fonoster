#!/usr/bin/env node
// Runs the `real` Playwright project with the environment read from the rebuild stack's files
// (ops/rebuild/.local/stack.env and seed.json). Values can hold spaces (the app's name), so the
// environment is set here, never through shell word-splitting.
//
//   npm run test:e2e:real [-- <playwright args>]   (after: ops/rebuild/stack up && stack seed)
//   node e2e/real-env.cjs --print                   (just show the values)
const fs = require("fs");
const path = require("path");

const local = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "ops",
  "rebuild",
  ".local"
);
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(local, "stack.env"), "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => l.split(/=(.*)/s).slice(0, 2))
);
const seedFile = path.join(local, "seed.json");
if (!fs.existsSync(seedFile)) {
  console.error("Not seeded yet: ops/rebuild/stack seed");
  process.exit(1);
}
const seed = JSON.parse(fs.readFileSync(seedFile, "utf8"));
const port = env.RB_API_PORT ?? "16449";
// The stack serves HTTPS with the certificate it generates; the SDK (cleanup) trusts its CA.
const caFile = path.join(local, "config", "tls", "ca.pem");
const out = {
  // The dashboard under test; prove.sh points it at the SPA served from source.
  E2E_REAL_URL: process.env.E2E_REAL_URL || `https://localhost:${port}`,
  // The stack's API, for tests that use the SDK directly (cleanup); the same origin by default.
  E2E_REAL_API_URL: `https://localhost:${port}`,
  E2E_REAL_EMAIL: env.RB_ADMIN_EMAIL,
  E2E_REAL_PASSWORD: env.RB_ADMIN_PASSWORD,
  E2E_REAL_WORKSPACE: seed.workspace.name,
  E2E_REAL_WORKSPACE_KEY: seed.workspace.accessKeyId,
  E2E_REAL_APP: seed.app.name
};
for (const [k, v] of Object.entries(out)) {
  if (!v) {
    console.error(`missing ${k} in the stack files`);
    process.exit(1);
  }
}
if (process.argv.includes("--print")) {
  for (const [k, v] of Object.entries(out))
    console.log(`${k}=${k.endsWith("PASSWORD") ? "***" : v}`);
  process.exit(0);
}
const { spawnSync } = require("child_process");
const args = process.argv.slice(2).filter((a) => a !== "--print");
// One worker: the real cases share one workspace and its Calls list, so calls placed in parallel
// make "the newest call" ambiguous (DSH-034 read DSH-042's call). An explicit --workers wins.
const workers = args.some((a) => a.startsWith("--workers"))
  ? []
  : ["--workers=1"];
const result = spawnSync(
  "npx",
  ["playwright", "test", ...args, ...workers, "--project", "real"],
  {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: {
      ...process.env,
      ...out,
      FONOSTER_CA_FILE: caFile,
      NODE_EXTRA_CA_CERTS: caFile
    }
  }
);
process.exit(result.status ?? 1);

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
const out = {
  E2E_REAL_URL: `http://localhost:${port}`,
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
const result = spawnSync(
  "npx",
  ["playwright", "test", ...args, "--project", "real"],
  {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: { ...process.env, ...out }
  }
);
process.exit(result.status ?? 1);

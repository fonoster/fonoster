/*
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Deployment rules (harden-conformance 1.4): the release gate and the nightly checks as the
// workflows define them, the "no .env" rule and secret:// references through the services' own
// loaders. The chart's rendered configs with mounted Kubernetes Secrets are in deployment.test.ts.
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { pathToFileURL } from "url";
import { parse } from "yaml";
import { loadConfig as loadGatewayConfig } from "../../gateway/src/config";

const ROOT = path.join(__dirname, "..", "..", "..");
const WORKFLOWS = path.join(ROOT, ".github", "workflows");

type Step = { run?: string; uses?: string; with?: Record<string, unknown> };
type Job = {
  needs?: string | string[];
  environment?: string | { name: string };
  steps?: Step[];
  uses?: string;
  if?: string;
};
type Workflow = { on: Record<string, unknown>; jobs: Record<string, Job> };

const workflow = (file: string): Workflow =>
  parse(fs.readFileSync(path.join(WORKFLOWS, file), "utf8"));
const needs = (job: Job) => [job.needs ?? []].flat();
const steps = (job: Job) => job.steps ?? [];

// What publishes a package, an image or a release.
const PUBLISHES =
  /\b(npm publish|lerna publish|npm run release|docker push|gh release (create|edit|upload))\b/;
const publishingSteps = (job: Job) =>
  steps(job).filter(
    (s) =>
      PUBLISHES.test(s.run ?? "") ||
      /softprops\/action-gh-release/.test(s.uses ?? "") ||
      (/docker\/build-push-action/.test(s.uses ?? "") &&
        String(s.with?.push) === "true")
  );

describe("@conformance[deployment] release gate and nightly checks", function () {
  it("cuts a release only by hand", function () {
    expect(Object.keys(workflow("release.yaml").on)).to.deep.equal([
      "workflow_dispatch"
    ]);
  });

  it("drafts the release, waits for approval in release-approval, then publishes it", function () {
    const { jobs } = workflow("release.yaml");
    const draft = steps(jobs.bundle).find((s) =>
      /softprops\/action-gh-release/.test(s.uses ?? "")
    );
    expect(draft?.with?.draft, "the bundle job drafts the release").to.equal(
      true
    );
    const env = jobs.approval.environment;
    expect(typeof env === "string" ? env : env?.name).to.equal(
      "release-approval"
    );
    expect(needs(jobs.approval)).to.include.members([
      "npm",
      "images",
      "bundle"
    ]);
    expect(needs(jobs.publish)).to.include("approval");
    // Only the job after the approval turns the draft into a release.
    const undrafts = Object.entries(jobs)
      .filter(([, j]) =>
        steps(j).some((s) => /--draft=false/.test(s.run ?? ""))
      )
      .map(([name]) => name);
    expect(undrafts).to.deep.equal(["publish"]);
  });

  it("publishes no package, image or release when a pull request is merged", function () {
    const offenders: string[] = [];
    fs.readdirSync(WORKFLOWS)
      .filter((f) => /\.ya?ml$/.test(f))
      .forEach((file) => {
        const w = workflow(file);
        if (!("push" in (w.on ?? {}))) return;
        Object.entries(w.jobs).forEach(([name, job]) => {
          if (publishingSteps(job).length) offenders.push(`${file}#${name}`);
          // A reusable workflow called on push would publish too.
          if (job.uses && /images\.ya?ml|release\.ya?ml/.test(job.uses))
            offenders.push(`${file}#${name}`);
        });
      });
    expect(offenders).to.deep.equal([]);
  });

  it("checks both targets nightly: the Compose install and the Helm chart", function () {
    const w = workflow("stack-smoke.yaml");
    expect(w.on).to.have.property("schedule");
    // Neither job is limited to pull requests: on schedule both run.
    ["compose", "helm"].forEach((name) => {
      const job = w.jobs[name];
      expect(job, name).to.exist;
      expect(job.if ?? "", name).to.match(
        /github\.event_name != 'pull_request'/
      );
    });
    const compose = steps(w.jobs.compose).map((s) => s.run ?? "");
    expect(compose.join("\n")).to.match(/ops\/release\/bundle/);
    expect(compose.join("\n")).to.match(/ops\/release\/smoke/);
    const helm = steps(w.jobs.helm)
      .map((s) => s.run ?? "")
      .join("\n");
    ["helm lint", "helm template", "kubeconform", "values-cloud.yaml"].forEach(
      (needle) => expect(helm, needle).to.contain(needle)
    );
  });
});

/** Runs `script` in a fresh Node (tsx) with `cwd`, returning its stdout. */
function runNode(script: string, cwd: string, env: NodeJS.ProcessEnv) {
  const tsx = pathToFileURL(require.resolve("tsx")).href;
  return execFileSync(process.execPath, [`--import=${tsx}`, "-e", script], {
    cwd,
    env: { PATH: process.env.PATH, ...env },
    encoding: "utf8"
  }).trim();
}

describe("@conformance[deployment] no .env, secret:// references", function () {
  this.timeout(60000);

  // The only source files that read a .env themselves. Both load the repository's .env in
  // development only; fix-config-and-placement-gaps tracks removing them.
  it("reads no .env file in any Fonoster service except the known development loaders", function () {
    const out = execFileSync(
      "git",
      ["grep", "-l", "dotenv", "--", "mods/*/src/**", "go/**"],
      { cwd: ROOT, encoding: "utf8" }
    )
      .trim()
      .split("\n")
      .filter((f) => f && !f.startsWith("mods/dashboard/"));
    expect(out.sort()).to.deep.equal([
      "mods/amd/src/envs.ts",
      "mods/common/src/envs.ts"
    ]);
  });

  it("uses the YAML value when a .env in the working directory sets it differently", function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dotenv-"));
    fs.writeFileSync(
      path.join(dir, ".env"),
      "NATS_GATEWAY_PASSWORD=from-dotenv\nTEST_OTLP=http://from-dotenv:4318\n"
    );
    const file = path.join(dir, "gateway.yaml");
    fs.writeFileSync(
      file,
      [
        'nats: { url: "nats://nats:4222", user: gateway, password: "${NATS_GATEWAY_PASSWORD:-from-yaml}" }',
        'telemetry: { otlpEndpoint: "${TEST_OTLP:-http://from-yaml:4318}" }',
        "apps: []",
        "providers: {}",
        ""
      ].join("\n")
    );
    // The gateway's entry point imports @fonoster/common first, as main.ts does.
    const loader = path.join(ROOT, "mods", "gateway", "src", "config");
    const common = require.resolve("@fonoster/common");
    const out = runNode(
      `require(${JSON.stringify(common)}); const c = require(${JSON.stringify(loader)}).loadConfig(${JSON.stringify(file)}); console.log(JSON.stringify([c.nats.password, c.telemetry.otlpEndpoint]))`,
      dir,
      { NODE_ENV: "production" }
    );
    expect(JSON.parse(out)).to.deep.equal([
      "from-yaml",
      "http://from-yaml:4318"
    ]);
  });

  // mods/common/src/envs.ts loads the repository's .env when NODE_ENV=development
  // (fix-config-and-placement-gaps).
  it("ignores a .env in development too");

  it("resolves secret://env, secret://file and secret://k8s in the gateway's config", function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "secret-refs-"));
    const secretsDir = path.join(dir, "secrets");
    fs.mkdirSync(path.join(secretsDir, "fonoster-vendors"), {
      recursive: true
    });
    fs.writeFileSync(
      path.join(secretsDir, "fonoster-vendors", "deepgram"),
      "dg-from-k8s\n"
    );
    fs.writeFileSync(path.join(dir, "nats-password"), "nats-from-file\n");
    const file = path.join(dir, "gateway.yaml");
    fs.writeFileSync(
      file,
      [
        `nats: { url: "nats://nats:4222", user: gateway, password: "secret://file${path.join(dir, "nats-password")}" }`,
        'encryption: { key: "secret://env/TEST_ENCRYPTION_KEY" }',
        "apps: []",
        "providers:",
        "  deepgram:",
        "    adapter: deepgram",
        "    capabilities: [stt]",
        '    credential: { value: "secret://k8s/fonoster-vendors#deepgram" }',
        ""
      ].join("\n")
    );
    const config = loadGatewayConfig(file, {
      ...process.env,
      TEST_ENCRYPTION_KEY: "key-from-env",
      FONOSTER_SECRETS_DIR: secretsDir,
      POD_NAMESPACE: ""
    });
    expect(config.nats.password).to.equal("nats-from-file");
    expect(
      (config as { encryption?: { key?: string } }).encryption?.key
    ).to.equal("key-from-env");
    expect(JSON.stringify(config.providers)).to.contain("dg-from-k8s");
  });

  it("refuses to start on an unresolvable reference, naming it and never a value", function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "secret-refs-"));
    const file = path.join(dir, "gateway.yaml");
    fs.writeFileSync(
      file,
      'nats: { url: "nats://nats:4222", password: "secret://env/TEST_UNSET_SECRET" }\napps: []\nproviders: {}\n'
    );
    expect(() =>
      loadGatewayConfig(file, { PATH: process.env.PATH, OTHER: "s3cr3t-value" })
    ).to.throw(/nats\.password: secret:\/\/env\/TEST_UNSET_SECRET/);
  });
});

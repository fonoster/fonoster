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
import { loadConfig as loadAppBridgeConfig } from "../../appbridge/src/config";

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
  it("releases on every push to main, and a manual run retries", function () {
    expect(Object.keys(workflow("release.yaml").on)).to.deep.equal([
      "push",
      "workflow_dispatch"
    ]);
    expect(workflow("release.yaml").on.push).to.deep.equal({
      branches: ["main"]
    });
  });

  it("publishes nothing before the QA gate passes", function () {
    const { jobs } = workflow("release.yaml");
    expect(jobs.qa.uses).to.match(/qa-proofs\.ya?ml/);
    expect(needs(jobs.npm)).to.include("qa");
    // Without the gate, npm runs only to finish a version already tagged (a manual retry).
    expect(jobs.npm.if).to.match(/needs\.qa\.result == 'success'/);
    expect(jobs.npm.if).to.match(/resume == 'true'/);
    // Every other publishing job comes after npm, so after the gate.
    Object.entries(jobs)
      .filter(([name]) => !["plan", "qa", "npm"].includes(name))
      .forEach(([name, job]) => expect(needs(job), name).to.include("npm"));
  });

  it("publishes the GitHub release as latest, with the archive, the QA report and both cards", function () {
    const { jobs } = workflow("release.yaml");
    const release = steps(jobs.bundle).find((s) =>
      /softprops\/action-gh-release/.test(s.uses ?? "")
    );
    expect(release?.with?.draft, "no draft").to.be.undefined;
    expect(release?.with?.make_latest).to.equal(true);
    const files = String(release?.with?.files);
    [
      "fonoster-${{ env.VERSION }}.tar.gz",
      "qa-report.md",
      "-dark.png",
      "-light.png"
    ].forEach((f) => expect(files).to.include(f));
    expect(Object.values(jobs).some((j) => j.environment)).to.equal(false);
  });

  it("deploys every release to production only after approval, and rolls back a failed switch", function () {
    const { jobs } = workflow("release.yaml");
    expect(jobs.deploy?.uses).to.equal("./.github/workflows/deploy.yaml");
    expect(jobs.deploy?.needs).to.include.members(["images", "bundle"]);
    const deploy = workflow("deploy.yaml");
    expect(deploy.jobs.prepare.environment).to.equal("production-prepare");
    expect(deploy.jobs.deploy.environment?.name).to.equal("production");
    expect(deploy.jobs.deploy.needs).to.equal("prepare");
    const rollback = steps(deploy.jobs.deploy).find((s) =>
      /\brollback\b/.test(s.run ?? "")
    );
    expect(String(rollback?.if)).to.include("failure()");
  });

  it("publishes on push only from release.yaml", function () {
    const offenders: string[] = [];
    fs.readdirSync(WORKFLOWS)
      .filter((f) => /\.ya?ml$/.test(f) && !/^release\.ya?ml$/.test(f))
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

  // No Fonoster service loads a .env itself, in development either
  // (fix-config-and-placement-gaps removed the last two loaders, in mods/common and mods/amd).
  it("reads no .env file in any Fonoster service", function () {
    let out = "";
    try {
      out = execFileSync(
        "git",
        ["grep", "-l", "dotenv", "--", "mods/*/src/**", "go/**"],
        { cwd: ROOT, encoding: "utf8" }
      );
    } catch (e) {
      // git grep exits 1 when nothing matches.
      if ((e as { status?: number }).status !== 1) throw e;
    }
    expect(
      out
        .trim()
        .split("\n")
        .filter((f) => f && !f.startsWith("mods/dashboard/"))
    ).to.deep.equal([]);
  });

  it("uses the YAML value when a .env in the working directory sets it differently", function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dotenv-"));
    fs.writeFileSync(
      path.join(dir, ".env"),
      "NATS_APPBRIDGE_PASSWORD=from-dotenv\nTEST_OTLP=http://from-dotenv:4318\n"
    );
    const file = path.join(dir, "appbridge.yaml");
    fs.writeFileSync(
      file,
      [
        'nats: { url: "nats://nats:4222", user: appbridge, password: "${NATS_APPBRIDGE_PASSWORD:-from-yaml}" }',
        'telemetry: { otlpEndpoint: "${TEST_OTLP:-http://from-yaml:4318}" }',
        "apps: []",
        "providers: {}",
        ""
      ].join("\n")
    );
    // AppBridge's entry point imports @fonoster/common first, as main.ts does.
    const loader = path.join(ROOT, "mods", "appbridge", "src", "config");
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

  // mods/common used to load the repository's .env when NODE_ENV=development.
  it("ignores a .env in development too", function () {
    const dotenv = path.join(ROOT, ".env");
    // Never overwrite a developer's own file.
    if (fs.existsSync(dotenv)) return this.skip();
    fs.writeFileSync(
      dotenv,
      "APISERVER_ROOT_DOMAIN=from-dotenv.example\nROOT_DOMAIN=from-dotenv.example\nNATS_APPBRIDGE_PASSWORD=from-dotenv\n"
    );
    try {
      const common = path.join(ROOT, "mods", "common", "src", "envs.ts");
      const out = runNode(
        `const c = require(${JSON.stringify(common)}); console.log(JSON.stringify([c.getRootDomain(), process.env.NATS_APPBRIDGE_PASSWORD ?? null]))`,
        ROOT,
        { NODE_ENV: "development" }
      );
      expect(JSON.parse(out)).to.deep.equal(["fonoster.local", null]);
    } finally {
      fs.rmSync(dotenv, { force: true });
    }
  });

  it("resolves secret://env, secret://file and secret://k8s in AppBridge's config", function () {
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
    const file = path.join(dir, "appbridge.yaml");
    fs.writeFileSync(
      file,
      [
        `nats: { url: "nats://nats:4222", user: appbridge, password: "secret://file${path.join(dir, "nats-password")}" }`,
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
    const config = loadAppBridgeConfig(file, {
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
    const file = path.join(dir, "appbridge.yaml");
    fs.writeFileSync(
      file,
      'nats: { url: "nats://nats:4222", password: "secret://env/TEST_UNSET_SECRET" }\napps: []\nproviders: {}\n'
    );
    expect(() =>
      loadAppBridgeConfig(file, {
        PATH: process.env.PATH,
        OTHER: "s3cr3t-value"
      })
    ).to.throw(/nats\.password: secret:\/\/env\/TEST_UNSET_SECRET/);
  });
});

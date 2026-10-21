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
import { execFileSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";

// prove.cjs and report.cjs on a throwaway repository: one area, a unit that adds, a "suite" that
// checks it and writes JUnit, and fault patches that break it or leave it alone.
const catalog = path.join(__dirname, "..", "catalog");

const area = `---
prefix: TST
title: Tool test
level: L1
tier: pr
uut: add.js
tester: check.js
environment: none
cadence: never
prove: node check.js {id} {junit}
capabilities:
  - math
tests:
  - none
---

# Tool test

## Systems

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`

## Cases

### TST-001 Adds

- **Spec:** math / Adding / Two numbers
- **Priority:** P0
- **Proof:** add subtracts
- **Fault:** faults/TST-001.patch

Adds.

**Pass.** 2. **Fail.** Anything else.

### TST-002 Adds again

- **Spec:** math / Adding / Two numbers
- **Priority:** P0
- **Proof:** a comment changes, which the test cannot see
- **Fault:** faults/TST-002.patch

Adds.

**Pass.** 2. **Fail.** Anything else.

### TST-003 No fault

- **Spec:** math / Adding / Two numbers
- **Priority:** P0
- **Proof:** none yet

Adds.

**Pass.** 2. **Fail.** Anything else.
`;

const spec = `# math

## Requirements

### Requirement: Adding

#### Scenario: Two numbers

- **WHEN** 1 and 1 are added
- **THEN** the result is 2
`;

// Writes a JUnit file with one test for the case: failing when add(1, 1) is not 2.
const check = `const fs = require("fs");
const [id, junit] = process.argv.slice(2);
const ok = require("./add.js")(1, 1) === 2;
fs.writeFileSync(junit, '<testsuite><testcase name="[' + id + '] adds">' + (ok ? "" : '<failure message="not 2"/>') + "</testcase></testsuite>");
process.exit(ok ? 0 : 1);
`;

function patchFor(dir: string, from: string, to: string) {
  fs.writeFileSync(path.join(dir, "add.js"), to);
  const diff = execFileSync("git", ["diff"], { cwd: dir, encoding: "utf8" });
  fs.writeFileSync(path.join(dir, "add.js"), from);
  return diff;
}

describe("@conformance/catalog prove.cjs", function () {
  this.timeout(30_000);
  let dir: string;
  let env: NodeJS.ProcessEnv;
  const add = "module.exports = (a, b) => a + b;\n";

  beforeEach(function () {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "prove-test-"));
    const cat = path.join(dir, "catalog");
    fs.mkdirSync(path.join(cat, "areas"), { recursive: true });
    fs.mkdirSync(path.join(cat, "faults"));
    fs.mkdirSync(path.join(dir, "openspec", "specs", "math"), { recursive: true });
    fs.writeFileSync(path.join(cat, "areas", "tst.md"), area);
    fs.writeFileSync(path.join(dir, "openspec", "specs", "math", "spec.md"), spec);
    fs.writeFileSync(path.join(dir, "check.js"), check);
    fs.writeFileSync(path.join(dir, "add.js"), add);
    const git = (...a: string[]) => execFileSync("git", a, { cwd: dir });
    git("init", "-q");
    git("-c", "user.email=t@t", "-c", "user.name=t", "add", ".");
    git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init");
    fs.writeFileSync(path.join(cat, "faults", "TST-001.patch"), patchFor(dir, add, "module.exports = (a, b) => a - b;\n"));
    fs.writeFileSync(path.join(cat, "faults", "TST-002.patch"), patchFor(dir, add, "// adds\n" + add));
    env = { ...process.env, CATALOG_DIR: cat, CATALOG_REPO_ROOT: dir };
  });

  afterEach(function () {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const prove = (...args: string[]) =>
    spawnSync("node", [path.join(catalog, "prove.cjs"), "--area", "TST", "--out", "junit/proofs.xml", ...args], { cwd: dir, env, encoding: "utf8" });

  it("proves a case that goes red on its fault, and reverts the fault", function () {
    const run = prove("--case", "TST-001");

    expect(run.stdout).to.match(/proven\s+TST-001/);
    expect(run.status).to.equal(0);
    expect(fs.readFileSync(path.join(dir, "add.js"), "utf8")).to.equal(add);
    const xml = fs.readFileSync(path.join(dir, "junit", "proofs.xml"), "utf8");
    expect(xml).to.contain('name="[TST-001] proof"');
    expect(xml).to.contain('<property name="proven" value="true"/>');
  });

  it("does not prove a case that stays green, or one with no fault, and exits 1", function () {
    const run = prove();

    expect(run.stdout).to.match(/UNPROVEN TST-002 .*stayed green/);
    expect(run.stdout).to.match(/UNPROVEN TST-003 .*no fault patch/);
    expect(run.status).to.equal(1);
    expect(fs.readFileSync(path.join(dir, "add.js"), "utf8")).to.equal(add);
  });

  it("does not prove a case whose command fails without a failing test for it", function () {
    fs.writeFileSync(path.join(dir, "check.js"), "process.exit(1);\n");
    execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qam", "broken"], { cwd: dir });

    const run = prove("--case", "TST-001");

    expect(run.stdout).to.match(/UNPROVEN TST-001 .*no failing test carries TST-001/);
    expect(run.status).to.equal(1);
  });

  it("refuses to touch a file with uncommitted changes", function () {
    fs.writeFileSync(path.join(dir, "add.js"), add + "// mine\n");

    const run = prove("--case", "TST-001");

    expect(run.stdout).to.match(/UNPROVEN TST-001 .*uncommitted changes in add.js/);
    expect(fs.readFileSync(path.join(dir, "add.js"), "utf8")).to.equal(add + "// mine\n");
  });

  it("report.cjs counts a proof as proven but never as a run", function () {
    prove("--case", "TST-001");
    const report = (results: string) =>
      spawnSync("node", [path.join(catalog, "report.cjs"), "--results", results, "--out", "report.md"], { cwd: dir, env, encoding: "utf8" });

    // Only the proof: the case was not run, so the gate blocks.
    expect(report("junit").status).to.equal(1);
    expect(fs.readFileSync(path.join(dir, "report.md"), "utf8")).to.match(/TST-001[^\n]*Not run/);

    // The proof and a passing run: proven.
    fs.writeFileSync(path.join(dir, "junit", "run.xml"), '<testsuite><testcase name="[TST-001] adds"/></testsuite>');
    report("junit");
    expect(fs.readFileSync(path.join(dir, "report.md"), "utf8")).to.match(/\| TST-001 \| Adds \| P0 \| [a-z]+ \| Pass \| yes \|/);
  });

  it("reads case ids from bracketed titles and from Go test names", function () {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { caseIds } = require(path.join(catalog, "lib.cjs"));

    expect(caseIds("[API-012] a title")).to.deep.equal(["API-012"]);
    expect(caseIds("TestROM012_RoomFull")).to.deep.equal(["ROM-012"]);
    expect(caseIds("TestROM012")).to.deep.equal(["ROM-012"]);
    expect(caseIds("TestROM012_RoomFull/subtest")).to.deep.equal(["ROM-012"]);
    expect(caseIds('classname="e2e" name="TestROM003_Dtmf"')).to.deep.equal(["ROM-003"]);
    expect(caseIds("TestRoomrCreateCall")).to.deep.equal([]);
    expect(caseIds("TestMain")).to.deep.equal([]);
  });
});

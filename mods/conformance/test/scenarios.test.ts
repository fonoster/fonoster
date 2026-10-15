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
import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { parse } from "yaml";
import { SCENARIOS_DIR, listScenarioFiles, loadScenarioFile, validateScenario } from "../src";

const OPENSPEC = path.join(__dirname, "..", "..", "..", "openspec");

function specFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return specFiles(p);
    return d.name === "spec.md" ? [p] : [];
  });
}

// Every "Requirement / Scenario" pair named in the OpenSpec specs (changes and archived specs).
const KNOWN_SPEC_REFS = new Set(
  specFiles(OPENSPEC).flatMap((file) => {
    const refs: string[] = [];
    let requirement = "";
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const r = /^### Requirement: (.+)$/.exec(line);
      if (r) requirement = r[1].trim();
      const s = /^#### Scenario: (.+)$/.exec(line);
      if (s) refs.push(`${requirement} / ${s[1].trim()}`);
    }
    return refs;
  })
);

describe("@conformance/scenario files", function () {
  const files = listScenarioFiles();

  it("finds scenario files for every seeded contract", function () {
    const contracts = new Set(files.map((f) => path.basename(path.dirname(f))));
    expect([...contracts]).to.include.members(["voice-session", "twilio-media-streams-flavor", "voice-sdk"]);
  });

  files.forEach((file) => {
    const rel = path.relative(SCENARIOS_DIR, file);

    it(`${rel} is valid`, function () {
      expect(() => loadScenarioFile(file)).not.to.throw();
    });

    it(`${rel} names a spec scenario that exists`, function () {
      const scenario = loadScenarioFile(file);
      expect(scenario.spec, "spec is required on seeded scenarios").to.be.a("string");
      expect(KNOWN_SPEC_REFS.has(scenario.spec!), `unknown spec reference "${scenario.spec}"`).to.equal(true);
    });
  });

  it("documents every voice-sdk fixture in FIXTURES.md", function () {
    const fixtures = fs.readFileSync(path.join(SCENARIOS_DIR, "voice-sdk", "FIXTURES.md"), "utf8");
    listScenarioFiles("voice-sdk").forEach((file) => {
      const { fixture } = loadScenarioFile(file);
      expect(fixtures, `fixture ${fixture}`).to.contain(`| \`${fixture}\` |`);
    });
  });
});

describe("@conformance/validateScenario", function () {
  const base = () =>
    parse(`
format: fonoster.scenario.v1
name: sample
contract: voice-session
role: app
steps:
  - expect: { type: session.start }
`);

  it("accepts a minimal scenario", function () {
    expect(validateScenario(base())).to.deep.equal([]);
  });

  it("rejects unknown keys so newer scenarios fail loudly on older runners", function () {
    const s = base();
    s.steps[0].expect_eventually = {};
    expect(validateScenario(s)).not.to.deep.equal([]);
  });

  it("rejects a step with two actions", function () {
    const s = base();
    s.steps[0].send = { type: "hangup" };
    expect(validateScenario(s)).not.to.deep.equal([]);
  });

  it("rejects a from that does not name an earlier label", function () {
    const s = base();
    s.steps.push({ expect: { type: "x" }, from: "later" }, { wait: { ms: 1 }, label: "later" });
    expect(validateScenario(s).join()).to.contain('does not name an earlier label');
  });

  it("rejects timing limits on non-expect steps", function () {
    const s = base();
    s.steps.push({ send: { type: "hangup" }, within_ms: 10 });
    expect(validateScenario(s).join()).to.contain("timing limits");
  });

  it("requires a fixture for voice-sdk scenarios", function () {
    const s = base();
    s.contract = "voice-sdk";
    s.role = "gateway";
    expect(validateScenario(s).join()).to.contain("fixture");
  });

  it("checks the name against the file name", function () {
    expect(validateScenario(base(), "/x/voice-session/other.yaml").join()).to.contain("file name");
  });
});

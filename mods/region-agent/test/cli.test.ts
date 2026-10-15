/**
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
import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Writable } from "stream";
import { main, parseArgs } from "../src/cli";
import { loadAgentConfig } from "../src/config";
import { FakeControlPlane } from "./fakeControlPlane";

// add-private-regions tasks 3.1 and 3.2: the `fonoster-region` commands.

function capture() {
  const lines: string[] = [];
  const out = new Writable({
    write(chunk, _enc, cb) {
      lines.push(String(chunk));
      cb();
    }
  });
  return {
    out: out as unknown as NodeJS.WriteStream,
    text: () => lines.join("")
  };
}

describe("@region-agent fonoster-region CLI", function () {
  let dir: string;
  const saved = { ...process.env };
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "region-cli-"));
    process.env.FONOSTER_REGION_DATA_DIR = dir;
    process.env.FONOSTER_REGION_SECRETS_KEY = "cli-pass";
  });
  afterEach(() => {
    process.env = { ...saved };
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("parses flags", function () {
    expect(
      parseArgs([
        "enroll",
        "tok",
        "--data-dir",
        "/x",
        "--allow-insecure",
        "--k8s-secret=s"
      ])
    ).to.deep.equal({
      _: ["enroll", "tok"],
      flags: { "data-dir": "/x", "allow-insecure": true, "k8s-secret": "s" }
    });
  });

  it("enrolls and shows the region without credentials", async function () {
    const cp = await new FakeControlPlane().start();
    const c = capture();
    await main(["enroll", cp.issue().token], c.out);
    expect(c.text()).to.match(/Enrolled region rg_testregion/);
    const s = capture();
    await main(["status"], s.out);
    expect(s.text()).to.include('"regionRef": "rg_testregion"');
    expect(s.text()).to.not.include("NATS USER JWT");
    await cp.stop();
  });

  it("sets, lists and deletes secrets without printing values", async function () {
    process.env.DG = "dg-value-1";
    const set = capture();
    await main(["secrets", "set", "deepgram", "--from-env", "DG"], set.out);
    expect(set.text()).to.not.include("dg-value-1");
    const list = capture();
    await main(["secrets", "list"], list.out);
    expect(list.text().trim()).to.equal("deepgram");
    expect(
      fs.readFileSync(path.join(dir, "secrets.enc"), "utf8")
    ).to.not.include("dg-value-1");
    const del = capture();
    await main(["secrets", "delete", "deepgram"], del.out);
    expect(del.text()).to.match(/deleted/);
    let err: Error | undefined;
    await main(["secrets", "set", "Bad Name"], capture().out).catch(
      (e) => (err = e)
    );
    expect(err?.message).to.match(/invalid secret name/);
  });

  it("resolves secret:// references in the agent config (D8)", function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-secret-"));
    const file = path.join(dir, "region-agent.yaml");
    fs.writeFileSync(
      file,
      fs
        .readFileSync(
          path.join(
            __dirname,
            "../../../ops/rebuild/cell/config/region-agent.yaml"
          ),
          "utf8"
        )
        .replace("ws://autopilot:3000", "secret://file" + path.join(dir, "ap"))
    );
    fs.writeFileSync(path.join(dir, "ap"), "ws://secret-autopilot:3000\n");
    expect(loadAgentConfig(file).autopilot?.url).to.equal(
      "ws://secret-autopilot:3000"
    );
  });

  it("loads the Compose cell's agent config", function () {
    const c = loadAgentConfig(
      path.join(__dirname, "../../../ops/rebuild/cell/config/region-agent.yaml")
    );
    expect(c.heartbeatMs).to.equal(30000);
    expect(c.autopilot?.url).to.equal("ws://autopilot:3000");
  });
});

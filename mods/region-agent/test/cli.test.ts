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
import { spawnSync } from "child_process";
import * as http from "http";
import { AddressInfo } from "net";
import { Writable } from "stream";
import { main, parseArgs } from "../src/cli";
import { loadAgentConfig } from "../src/config";
import { FakeControlPlane } from "./fakeControlPlane";

// add-private-regions tasks 3.1 and 3.2, PR-21: the `fonoster-region` commands.

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
    // The cell's region-agent.yaml reads its NATS password from here (add-platform 4.1).
    process.env.NATS_REGION_AGENT_PASSWORD = "nats-agent";
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
    expect(c.text()).to.match(
      /Enrolled private region acme-hq \(rg_testregion\)/
    );
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

  it("runs the cloud-side commands against the admin API with the operator key (PR-19)", async function () {
    const seen: { method: string; url: string; key: string; body: string }[] =
      [];
    const server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        seen.push({
          method: req.method!,
          url: req.url!,
          key: String(req.headers["x-operator-key"] ?? ""),
          body: Buffer.concat(chunks).toString()
        });
        res.setHeader("content-type", "application/json");
        if (req.headers["x-operator-key"] !== "op-key-1") {
          res.statusCode = 401;
          return res.end(JSON.stringify({ error: "operator_key_invalid" }));
        }
        if (req.method === "GET")
          return res.end(
            JSON.stringify({
              items: [
                {
                  id: "default",
                  kind: "public",
                  status: "connected",
                  displayName: "US East"
                },
                {
                  ref: "rg_aaaa",
                  id: "us-east-2",
                  kind: "public",
                  status: "waiting",
                  published: false,
                  workspaceCount: 0,
                  displayName: "US East 2"
                }
              ]
            })
          );
        if (req.url === "/api/admin/regions")
          return res.end(
            JSON.stringify({
              ref: "rg_aaaa",
              id: "us-east-2",
              token: "TOKEN-1",
              expiresAt: "2026-10-16T00:00:00.000Z"
            })
          );
        if (req.url!.endsWith("/token"))
          return res.end(
            JSON.stringify({
              token: "TOKEN-2",
              expiresAt: "2026-10-16T00:00:00.000Z"
            })
          );
        res.end(JSON.stringify({ id: "us-east-2", status: "connected" }));
      });
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const api = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    process.env.FONOSTER_API_URL = api;
    process.env.FONOSTER_OPERATOR_KEY = "op-key-1";
    try {
      const c = capture();
      await main(
        [
          "create",
          "us-east-2",
          "--name",
          "US East 2",
          "--sip-domain",
          "sip.us2.example"
        ],
        c.out
      );
      expect(c.text()).to.include("TOKEN-1");
      expect(JSON.parse(seen[0].body)).to.deep.equal({
        id: "us-east-2",
        displayName: "US East 2",
        sipDomain: "sip.us2.example"
      });
      const l = capture();
      await main(["list"], l.out);
      expect(l.text()).to.match(/^ID\s+KIND\s+STATUS/);
      expect(l.text()).to.match(/default\s+public\s+connected\s+configured/);
      expect(l.text()).to.match(/us-east-2\s+public\s+waiting\s+no\s+0/);
      const t = capture();
      await main(["token", "us-east-2"], t.out);
      expect(t.text()).to.include("TOKEN-2");
      await main(["publish", "us-east-2"], capture().out);
      await main(["revoke", "us-east-2"], capture().out);
      expect(seen.map((s) => `${s.method} ${s.url}`)).to.deep.equal([
        "POST /api/admin/regions",
        "GET /api/admin/regions",
        "POST /api/admin/regions/us-east-2/token",
        "POST /api/admin/regions/us-east-2/publish",
        "POST /api/admin/regions/us-east-2/revoke"
      ]);
      expect(seen.every((s) => s.key === "op-key-1")).to.equal(true);
      // The key never shows in the output.
      expect(c.text() + l.text() + t.text()).to.not.include("op-key-1");

      let err: Error | undefined;
      await main(["list", "--operator-key", "wrong"], capture().out).catch(
        (e) => (err = e)
      );
      expect(err?.message).to.match(/401 operator_key_invalid/);
      delete process.env.FONOSTER_OPERATOR_KEY;
      err = undefined;
      await main(["list"], capture().out).catch((e) => (err = e));
      expect(err?.message).to.match(/operator key is required/);
    } finally {
      server.close();
    }
  });

  it("keeps fonoster-regions as a deprecated alias", function () {
    const cli = path.join(__dirname, "../dist/cli.js");
    if (!fs.existsSync(cli)) this.skip();
    const alias = path.join(dir, "fonoster-regions");
    fs.symlinkSync(cli, alias);
    const old = spawnSync(process.execPath, [alias, "--help"], {
      encoding: "utf8"
    });
    expect(old.stderr).to.match(
      /fonoster-regions is deprecated; use fonoster-region /
    );
    expect(old.stdout).to.match(/^fonoster-region <command>/);
    const now = spawnSync(process.execPath, [cli, "--help"], {
      encoding: "utf8"
    });
    expect(now.stderr).to.equal("");
  });

  it("loads the Compose cell's agent config", function () {
    const c = loadAgentConfig(
      path.join(__dirname, "../../../ops/rebuild/cell/config/region-agent.yaml")
    );
    expect(c.heartbeatMs).to.equal(30000);
    expect(c.autopilot?.url).to.equal("ws://autopilot:3000");
    expect(c.nats).to.deep.equal({
      url: "nats://nats:4222",
      user: "region-agent",
      password: "nats-agent"
    });
  });
});

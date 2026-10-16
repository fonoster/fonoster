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
import http from "node:http";
import { AddressInfo } from "node:net";
import { HttpToolPort } from "../../src/session/tools";

// RV-B2: tool URLs are tenant input; the platform's own network is off limits.
describe("@autopilot/session HttpToolPort destinations", function () {
  let server: http.Server;
  let url: string;
  let hits = 0;

  before(async () => {
    server = http.createServer((_req, res) => {
      hits++;
      res.writeHead(200, { "content-type": "application/json" });
      res.end('{"open":"9"}');
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/hours`;
  });
  after(() => server.close());

  const tool = (u: string) => ({
    name: "getHours",
    description: "Opening hours",
    parameters: { type: "object", properties: {} },
    operation: { method: "get", url: u }
  });

  it("refuses private and metadata destinations", async function () {
    for (const u of [
      url,
      "http://169.254.169.254/latest/meta-data",
      "http://redis:6379/"
    ]) {
      const port = new HttpToolPort([tool(u)] as never, { allow: [] });
      const out = await port.run("getHours", {}, new AbortController().signal);
      expect(out.ok, u).to.equal(false);
      expect(out.error, u).to.match(/non-public|internal name/);
    }
    expect(hits).to.equal(0);
  });

  it("calls a destination the operator allowed", async function () {
    const port = new HttpToolPort([tool(url)] as never, {
      allow: ["127.0.0.1"]
    });
    const out = await port.run("getHours", {}, new AbortController().signal);
    expect(out).to.deep.equal({ ok: true, result: { open: "9" } });
  });
});

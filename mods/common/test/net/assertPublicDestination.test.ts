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
import {
  assertPublicDestination,
  isPrivateAddress,
  safeFetch,
  UnsafeDestinationError
} from "../../src/net";
import { MemoryWebhookStore, WebhookDispatcher } from "../../src/webhooks";

async function rejects(p: Promise<unknown>): Promise<Error> {
  try {
    await p;
  } catch (e) {
    return e as Error;
  }
  throw new Error("expected a rejection");
}

describe("@common/net assertPublicDestination (RV-B2)", function () {
  let server: http.Server;
  let base: string;
  let hits = 0;

  before(async () => {
    server = http.createServer((req, res) => {
      hits++;
      if (req.url === "/redirect") {
        res.writeHead(302, { location: "http://169.254.169.254/latest" });
        return res.end();
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end('{"ok":true}');
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  after(() => server.close());

  it("flags private, loopback, link-local, ULA, CGNAT, multicast and unspecified addresses", function () {
    for (const ip of [
      "127.0.0.1",
      "10.1.2.3",
      "172.20.0.1",
      "192.168.1.1",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "224.0.0.1",
      "255.255.255.255",
      "::1",
      "::",
      "fe80::1",
      "fd00::1",
      "ff02::1",
      "::ffff:127.0.0.1",
      "::ffff:7f00:1"
    ])
      expect(isPrivateAddress(ip), ip).to.equal(true);
    for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])
      expect(isPrivateAddress(ip), ip).to.equal(false);
  });

  it("refuses non-http schemes, private literals and internal names", async function () {
    for (const url of [
      "file:///etc/passwd",
      "gopher://example.com/",
      "http://127.0.0.1/",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]:8080/",
      "http://[fd12::1]/",
      "http://[::ffff:127.0.0.1]/",
      "http://localhost:3000/",
      "http://redis:6379/",
      "http://apiserver/",
      "https://metadata.google.internal/",
      "http://printer.local/"
    ]) {
      const e = await rejects(assertPublicDestination(url, { allow: [] }));
      expect(e, url).to.be.instanceOf(UnsafeDestinationError);
    }
  });

  it("accepts public literals and operator-allowed destinations", async function () {
    await assertPublicDestination("https://8.8.8.8/x", { allow: [] });
    await assertPublicDestination("http://127.0.0.1:9/", {
      allow: ["127.0.0.1"]
    });
    await assertPublicDestination("http://10.0.3.4/", {
      allow: ["10.0.0.0/8"]
    });
  });

  it("safeFetch refuses a private destination without connecting", async function () {
    const before = hits;
    const e = await rejects(safeFetch(`${base}/`, { policy: { allow: [] } }));
    expect(e).to.be.instanceOf(UnsafeDestinationError);
    expect(hits).to.equal(before);
  });

  it("safeFetch re-checks every redirect hop", async function () {
    const ok = await safeFetch(`${base}/`, {
      policy: { allow: ["127.0.0.1"] }
    });
    expect(await ok.json()).to.deep.equal({ ok: true });
    const e = await rejects(
      safeFetch(`${base}/redirect`, { policy: { allow: ["127.0.0.1"] } })
    );
    expect(e).to.be.instanceOf(UnsafeDestinationError);
  });

  it("webhooks refuse private endpoints at creation and at delivery", async function () {
    const strict = new WebhookDispatcher({
      store: new MemoryWebhookStore(),
      allowedDestinations: []
    });
    expect(() =>
      strict.createEndpoint({
        workspaceRef: "W",
        url: "https://169.254.169.254/hook",
        events: ["call.ended"]
      })
    ).to.throw(/not allowed/);
    // An endpoint stored while allowed is still refused by a dispatcher that does not allow it.
    const store = new MemoryWebhookStore();
    new WebhookDispatcher({
      store,
      allowInsecureUrls: true,
      allowedDestinations: ["127.0.0.1"]
    }).createEndpoint({
      workspaceRef: "W",
      url: `${base}/`,
      events: ["call.ended"]
    });
    const delivering = new WebhookDispatcher({
      store,
      allowInsecureUrls: true,
      allowedDestinations: []
    });
    const before = hits;
    delivering.publish({
      id: "evt_1",
      type: "call.ended",
      workspaceRef: "W",
      createdAt: new Date().toISOString(),
      data: {}
    } as never);
    await delivering.runDue();
    expect(hits).to.equal(before);
  });
});

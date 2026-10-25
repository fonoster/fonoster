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
import { AddressInfo } from "net";
import * as https from "https";
import { expect } from "chai";
import { certHint, controlPlaneFetch } from "../src/caFetch";
import { makeTestCa, TestCa } from "./helpers/testCa";

// api-client-trust: the region agent trusts the control plane's CA with --ca-file or
// FONOSTER_CA_FILE, still checks host names, and never suggests --allow-insecure for a
// certificate error.

describe("@region-agent[ca-file]", function () {
  this.timeout(20000);
  let ca: TestCa;
  let server: https.Server;
  let port: number;
  const savedEnv = process.env.FONOSTER_CA_FILE;

  before(async function () {
    ca = makeTestCa(["localhost", "127.0.0.1"]);
    server = https.createServer({ cert: ca.cert, key: ca.key }, (req, res) => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ path: req.url }));
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    port = (server.address() as AddressInfo).port;
  });

  after(function () {
    server.close();
  });

  afterEach(function () {
    if (savedEnv === undefined) delete process.env.FONOSTER_CA_FILE;
    else process.env.FONOSTER_CA_FILE = savedEnv;
  });

  it("reaches the control plane over TLS with the CA file", async function () {
    const fetch = controlPlaneFetch(ca.caFile)!;
    const res = await fetch(
      `https://localhost:${port}/.well-known/region-keys.json`
    );
    expect(res.ok).to.equal(true);
    expect(await res.json()).to.deep.equal({
      path: "/.well-known/region-keys.json"
    });
    expect(await (await fetch(`https://localhost:${port}/x`)).text()).to.equal(
      JSON.stringify({ path: "/x" })
    );
  });

  it("reads FONOSTER_CA_FILE when --ca-file is not given", async function () {
    process.env.FONOSTER_CA_FILE = ca.caFile;
    const res = await controlPlaneFetch()!(`https://localhost:${port}/`);
    expect(res.status).to.equal(200);
  });

  it("uses Node's fetch when no CA is named", function () {
    delete process.env.FONOSTER_CA_FILE;
    expect(controlPlaneFetch()).to.equal(undefined);
  });

  it("prefers --ca-file over FONOSTER_CA_FILE", async function () {
    process.env.FONOSTER_CA_FILE = "/nonexistent/ca.pem";
    const res = await controlPlaneFetch(ca.caFile)!(
      `https://localhost:${port}/`
    );
    expect(res.ok).to.equal(true);
  });

  it("fails on a missing file before connecting, naming the path", function () {
    expect(() => controlPlaneFetch("/nonexistent/ca.pem")).to.throw(
      "CA file /nonexistent/ca.pem could not be read"
    );
  });

  it("still checks the host name", async function () {
    const other = makeTestCa(["voice.example.com"]);
    const s = https.createServer(
      { cert: other.cert, key: other.key },
      (_q, r) => r.end("{}")
    );
    await new Promise<void>((r) => s.listen(0, "127.0.0.1", r));
    try {
      const p = (s.address() as AddressInfo).port;
      let error: Error | undefined;
      try {
        await controlPlaneFetch(other.caFile)!(`https://localhost:${p}/`);
      } catch (e) {
        error = e as Error;
      }
      expect(error?.message).to.match(/altnames|hostname|does not match/i);
    } finally {
      s.close();
    }
  });

  it("hints --ca-file, never --allow-insecure, on certificate errors", function () {
    const hinted = certHint("x: self-signed certificate in certificate chain");
    expect(hinted).to.include("--ca-file");
    expect(hinted).not.to.include("--allow-insecure");
    expect(certHint("x: ECONNREFUSED")).to.equal("x: ECONNREFUSED");
  });
});

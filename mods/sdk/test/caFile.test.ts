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
import { Server, ServerCredentials, status } from "@grpc/grpc-js";
import { expect } from "chai";
import { Client } from "../src/client/Client";
import { createCaFetch, readCaFile } from "../src/client/caTrust";
import { makeTestCa, TestCa } from "./helpers/testCa";

// api-client-trust: the SDK trusts a CA file (option or FONOSTER_CA_FILE) besides the system's
// authorities, still checks host names, and fails before connecting on a bad file.

/** Calls ExchangeCredentials; resolves with the gRPC status code and message. */
function callIdentity(
  client: Client
): Promise<{ code: number; details: string }> {
  return new Promise((resolve) => {
    const identity = client.getIdentityClient() as unknown as {
      exchangeCredentials(
        req: unknown,
        cb: (err: { code: number; details: string } | null) => void
      ): void;
      close(): void;
    };
    const {
      ExchangeCredentialsRequest
    } = require("../src/generated/node/identity_pb");
    identity.exchangeCredentials(new ExchangeCredentialsRequest(), (err) => {
      identity.close();
      resolve({ code: err?.code ?? 0, details: err?.details ?? "" });
    });
  });
}

describe("@sdk[client] CA file", function () {
  this.timeout(20000);
  let ca: TestCa;
  let grpcServer: Server;
  let grpcPort: number;
  let httpsServer: https.Server;
  let httpsPort: number;
  const savedEnv = process.env.FONOSTER_CA_FILE;

  before(async function () {
    ca = makeTestCa(["localhost", "127.0.0.1"]);
    // A TLS gRPC server with no services: a call that gets through TLS answers UNIMPLEMENTED.
    grpcServer = new Server();
    grpcPort = await new Promise<number>((resolve, reject) =>
      grpcServer.bindAsync(
        "127.0.0.1:0",
        ServerCredentials.createSsl(null, [
          { cert_chain: ca.cert, private_key: ca.key }
        ]),
        (err, port) => (err ? reject(err) : resolve(port))
      )
    );
    httpsServer = https.createServer(
      { cert: ca.cert, key: ca.key },
      (_req, res) => {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ ok: true }));
      }
    );
    await new Promise<void>((r) => httpsServer.listen(0, "127.0.0.1", r));
    httpsPort = (httpsServer.address() as AddressInfo).port;
  });

  after(function () {
    grpcServer.forceShutdown();
    httpsServer.close();
  });

  afterEach(function () {
    if (savedEnv === undefined) delete process.env.FONOSTER_CA_FILE;
    else process.env.FONOSTER_CA_FILE = savedEnv;
  });

  it("connects over TLS when it trusts the CA file", async function () {
    const client = new Client({
      endpoint: `localhost:${grpcPort}`,
      accessKeyId: "WO1",
      caFile: ca.caFile,
      withoutInterceptors: true
    });
    const { code } = await callIdentity(client);
    expect(code).to.equal(status.UNIMPLEMENTED);
  });

  it("fails the TLS handshake without the CA file", async function () {
    delete process.env.FONOSTER_CA_FILE;
    const client = new Client({
      endpoint: `localhost:${grpcPort}`,
      accessKeyId: "WO1",
      withoutInterceptors: true
    });
    const { code } = await callIdentity(client);
    expect(code).to.equal(status.UNAVAILABLE);
  });

  it("still checks the host name", async function () {
    const other = makeTestCa(["voice.example.com"]);
    const server = new Server();
    const port = await new Promise<number>((resolve, reject) =>
      server.bindAsync(
        "127.0.0.1:0",
        ServerCredentials.createSsl(null, [
          { cert_chain: other.cert, private_key: other.key }
        ]),
        (err, p) => (err ? reject(err) : resolve(p))
      )
    );
    try {
      const client = new Client({
        endpoint: `localhost:${port}`,
        accessKeyId: "WO1",
        caFile: other.caFile,
        withoutInterceptors: true
      });
      const { code } = await callIdentity(client);
      expect(code).to.equal(status.UNAVAILABLE);
    } finally {
      server.forceShutdown();
    }
  });

  it("never falls back to plain text: a plain endpoint fails the TLS handshake", async function () {
    const plain = new Server();
    const port = await new Promise<number>((resolve, reject) =>
      plain.bindAsync(
        "127.0.0.1:0",
        ServerCredentials.createInsecure(),
        (err, p) => (err ? reject(err) : resolve(p))
      )
    );
    try {
      const client = new Client({
        endpoint: `localhost:${port}`,
        accessKeyId: "WO1",
        caFile: ca.caFile,
        withoutInterceptors: true
      });
      const { code } = await callIdentity(client);
      expect(code).to.equal(status.UNAVAILABLE);
    } finally {
      plain.forceShutdown();
    }
  });

  it("reads FONOSTER_CA_FILE when no option is given", async function () {
    process.env.FONOSTER_CA_FILE = ca.caFile;
    const client = new Client({
      endpoint: `localhost:${grpcPort}`,
      accessKeyId: "WO1",
      withoutInterceptors: true
    });
    const { code } = await callIdentity(client);
    expect(code).to.equal(status.UNIMPLEMENTED);
  });

  it("prefers the option over FONOSTER_CA_FILE", async function () {
    process.env.FONOSTER_CA_FILE = "/nonexistent/ca.pem";
    const client = new Client({
      endpoint: `localhost:${grpcPort}`,
      accessKeyId: "WO1",
      caFile: ca.caFile,
      withoutInterceptors: true
    });
    const { code } = await callIdentity(client);
    expect(code).to.equal(status.UNIMPLEMENTED);
  });

  it("fails before connecting on a missing file, naming the path", function () {
    expect(
      () =>
        new Client({
          endpoint: "localhost:1",
          accessKeyId: "WO1",
          caFile: "/nonexistent/ca.pem"
        })
    ).to.throw("CA file /nonexistent/ca.pem could not be read");
    expect(() => readCaFile(__filename)).to.throw("holds no PEM certificate");
  });

  it("uses the CA for the HTTP API too", async function () {
    const fetch = createCaFetch(ca.ca);
    const res = await fetch(`https://localhost:${httpsPort}/api/records`);
    expect(res.ok).to.equal(true);
    expect(await res.json()).to.deep.equal({ ok: true });
    const client = new Client({
      endpoint: `localhost:${grpcPort}`,
      accessKeyId: "WO1",
      caFile: ca.caFile,
      withoutInterceptors: true
    });
    expect(client.getFetch()).to.be.a("function");
  });

  it("the HTTP fetch rejects a certificate from another CA", async function () {
    const other = makeTestCa(["localhost"]);
    const fetch = createCaFetch(other.ca);
    let error: Error | undefined;
    try {
      await fetch(`https://localhost:${httpsPort}/`);
    } catch (e) {
      error = e as Error;
    }
    expect(error?.message).to.match(/certificate|self[- ]signed|verify/i);
  });
});

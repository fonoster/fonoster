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
// secret:// in the started media node (harden-conformance 1.4, deployment: "Secret reference
// resolved"): the Go binary resolves its config's references at startup, and an unresolvable one
// stops it with the reference named and no value. The node resolves its NATS and SIP passwords
// before it connects, so it is pointed at a closed port: getting as far as the NATS connection
// proves the references resolved, and it never joins the shared bus (a heartbeat there would offer
// it to the placement tests that run after). Runs in the NATS job; needs Go.
import { spawn } from "child_process";
import * as fs from "fs";
import * as net from "net";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { buildMediaNode, MediaNodeBinaries } from "../src";

const NATS_URL = process.env.CONFORMANCE_NATS_URL;

function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = net.createServer().listen(0, "127.0.0.1", () => {
      const { port } = s.address() as net.AddressInfo;
      s.close(() => resolve(port));
    });
  });
}

/** Runs the node with `config` until it exits; returns its exit code and output. */
function runNode(
  bins: MediaNodeBinaries,
  config: string,
  env: Record<string, string>
): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(bins.medianode, ["-config", config], {
      env: { PATH: process.env.PATH, ...env },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 15000);
    child.stdout!.on("data", (d: Buffer) => (output += d));
    child.stderr!.on("data", (d: Buffer) => (output += d));
    child.on("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, output });
    });
  });
}

/** It resolved both passwords and stopped only at the (closed) NATS port. */
function resolvedThenConnected(result: {
  code: number | null;
  output: string;
}) {
  expect(result.output, result.output).to.not.match(
    /"msg":"(nats|sip) password"/
  );
  expect(result.output, result.output).to.match(/"msg":"nats"/);
  expect(result.code).to.equal(1);
}

describe("@conformance[deployment] secret:// in the started media node", function () {
  this.timeout(60000);
  let bins: MediaNodeBinaries | undefined;
  let dir: string;

  before(function () {
    this.timeout(180000);
    if (!NATS_URL) return this.skip();
    bins = buildMediaNode(NATS_URL);
    if (!bins) return this.skip();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "medianode-secrets-"));
  });

  async function config(
    name: string,
    natsPassword: string,
    sipPassword: string
  ) {
    const file = path.join(dir, `${name}.yaml`);
    const sip = await freePort();
    const closed = await freePort();
    fs.writeFileSync(
      file,
      [
        `nodeId: secrets-${name}`,
        `nats: { url: "nats://127.0.0.1:${closed}", user: medianode, password: "${natsPassword}" }`,
        `sip: { listen: "127.0.0.1:${sip}", advertise: 127.0.0.1 }`,
        "rtp: { host: 127.0.0.1, advertise: 127.0.0.1 }",
        `registration: { password: "${sipPassword}" }`,
        ""
      ].join("\n")
    );
    return file;
  }

  it("resolves its NATS and SIP passwords from secret://file and secret://env", async function () {
    const secret = path.join(dir, "nats-password");
    fs.writeFileSync(secret, "nats-from-file\n");
    const result = await runNode(
      bins!,
      await config(
        "ok",
        `secret://file${secret}`,
        "secret://env/TEST_SIP_PASSWORD"
      ),
      { TEST_SIP_PASSWORD: "sip-from-env" }
    );
    resolvedThenConnected(result);
  });

  it("resolves its NATS password from a mounted Kubernetes Secret (secret://k8s)", async function () {
    const secrets = path.join(dir, "secrets");
    fs.mkdirSync(path.join(secrets, "nats-users"), { recursive: true });
    fs.writeFileSync(
      path.join(secrets, "nats-users", "medianode"),
      "nats-from-k8s"
    );
    const result = await runNode(
      bins!,
      await config("k8s", "secret://k8s/fonoster/nats-users#medianode", ""),
      { FONOSTER_SECRETS_DIR: secrets, POD_NAMESPACE: "fonoster" }
    );
    resolvedThenConnected(result);
  });

  it("refuses to start on an unresolvable reference, naming it and never a value", async function () {
    const result = await runNode(
      bins!,
      await config("unset", "secret://env/TEST_UNSET_NATS_PASSWORD", ""),
      { OTHER_SECRET: "s3cr3t-value" }
    );
    expect(result.code).to.equal(1);
    expect(result.output).to.match(/"msg":"nats password"/);
    expect(result.output).to.contain("secret://env/TEST_UNSET_NATS_PASSWORD");
    expect(result.output).to.not.contain("s3cr3t-value");
  });
});

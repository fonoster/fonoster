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
import { ChildProcess, spawn } from "child_process";
import { generateKeyPairSync } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import * as net from "net";
import { NatsConnection, connect } from "nats";
import { stringify } from "yaml";
import {
  CallRecordWriter,
  decodeVcon,
  fsStores,
  verifyRecord
} from "@fonoster/callrecord";
import { FakesHarness } from "@fonoster/conformance";
import { checkHealth } from "../src/healthcheck";

// Crash harness (call-record task 1.3, conformance 3.9): kill AppBridge process mid-call and
// check that a sealed, signed record still results, listing what is missing. Needs NATS.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(
  fn: () => T | undefined | false,
  ms: number,
  what: string
): Promise<T> {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(25);
  }
}

/** A free loopback TCP port. */
async function freePort(): Promise<number> {
  const server = net.createServer();
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as net.AddressInfo).port;
  await new Promise<void>((r) => server.close(() => r()));
  return port;
}

/** Resolves once the spawned AppBridge's Session port reports SERVING (it takes calls). */
async function waitForServing(address: string, ms: number) {
  const deadline = Date.now() + ms;
  while (!(await checkHealth(address, 500))) {
    if (Date.now() > deadline)
      throw new Error(`AppBridge was not SERVING within ${ms} ms`);
    await sleep(100);
  }
}

describe("@AppBridge call record after a crash", function () {
  this.timeout(30000);
  let nc: NatsConnection;
  let appbridge: ChildProcess | undefined;
  let harness: FakesHarness;
  let dir: string;

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  afterEach(async () => {
    appbridge?.kill("SIGKILL");
    await harness?.stop();
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  it("seals a signed record with everything appended before AppBridge was killed", async function () {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "appbridge-crash-"));
    const { privateKey, publicKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256"
    });
    const keyFile = path.join(dir, "region.pem");
    fs.writeFileSync(
      keyFile,
      privateKey.export({ type: "pkcs8", format: "pem" })
    );

    harness = await new FakesHarness().start();
    const sessionAddress = `127.0.0.1:${await freePort()}`;
    harness.roomrNode.configure({ endpoint: sessionAddress });
    const urls = harness.providerUrls;
    const config = {
      nats: { url: NATS_URL },
      session: { listen: sessionAddress },
      callRecord: {
        dir: path.join(dir, "records"),
        region: "test",
        signingKey: { kid: "test-1", privateKeyFile: keyFile }
      },
      apps: [
        {
          ref: "a",
          url: harness.app.url,
          protocol: "fonoster",
          signingSecret: "s",
          speech: { voice: "fake/default", language: "en-US" }
        }
      ],
      providers: {
        fake: {
          adapter: "fake",
          capabilities: ["tts", "stt"],
          tts: { url: urls.tts },
          stt: { url: urls.stt }
        }
      }
    };
    fs.writeFileSync(path.join(dir, "appbridge.yaml"), stringify(config));
    // AppBridge takes calls once its Session port reports SERVING (grpc.health.v1). A fixed
    // sleep raced its start-up (module load, NATS connect, the session registry: measured
    // 0.6-4.3 s on a busy host).
    appbridge = spawn(
      process.execPath,
      [
        path.join(__dirname, "..", "dist", "main.js"),
        path.join(dir, "appbridge.yaml")
      ],
      {
        env: { ...process.env, LOGS_LEVEL: "error" },
        stdio: "ignore"
      }
    );
    await waitForServing(sessionAddress, 15000);

    const { callRef } = await harness.roomrNode.offerCall({
      from: "+15550001111",
      to: "+15550002222"
    });
    const { peer } = await harness.app.nextConnection(5000);
    peer.sendJson({
      type: "speak",
      id: "r1",
      text: "Hello before the crash.",
      last: true
    });
    await waitFor(
      () =>
        peer.frames.items.find(
          (f) =>
            f.kind === "json" &&
            (f.data as { type: string }).type === "output.started"
        ),
      5000,
      "output.started"
    );

    appbridge.kill("SIGKILL");
    await sleep(200);

    // Any surviving replica's sweep seals it once the deadline passes.
    const { working, store } = fsStores(path.join(dir, "records"));
    const writer = new CallRecordWriter({
      working,
      store,
      region: "test",
      key: { kid: "test-1", privateKeyPem: fs.readFileSync(keyFile, "utf8") }
    });
    expect(await writer.sweep(Date.now() + 31_000)).to.deep.equal([callRef]);

    const sealed = (await store.getSealed(callRef))!;
    const verified = verifyRecord(sealed, {
      "test-1": publicKey.export({ type: "spki", format: "pem" }).toString()
    });
    expect(verified).to.deep.equal({ ok: true, kid: "test-1" });
    const vcon = decodeVcon(sealed.signed);
    expect(vcon.fonoster).to.deep.include({ complete: false, endReason: null });
    expect((vcon.fonoster as { missing: string[] }).missing).to.include(
      "hangup"
    );
    expect(vcon.parties.map((p) => p.tel ?? p.name)).to.deep.equal([
      "+15550001111",
      "+15550002222",
      "a"
    ]);
    expect(sealed.parts[0].data.toString()).to.contain(
      "Hello before the crash."
    );
  });

  // Pending: the Roomr node ends the dead AppBridge's call when its control stream breaks
  // (`call.ended` with cause `app_gone` on NATS) and a surviving replica seals the record (above);
  // the control plane turns that `call.ended` into the workspace's `call.ended` (`appbridge-lost`,
  // redesign-roomr 15.4), which is the control-plane chunk's to build and test.
  it("sends call.ended for a call whose AppBridge was killed mid-call");
});

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
import { generateKeyPairSync } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { CallRecordWriter, fsStores, RecordEntry } from "../src";

// Two AppBridge replicas sharing one record directory (ST-5, audit #47/#48): a quiet live call on A is not
// sealed by B's sweep (A's heartbeat keeps it alive), and when A dies the call is sealed exactly
// once even with two writers sweeping at the same moment.

const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "P-256"
});
const KEY = {
  kid: "shared-dir-key",
  privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString()
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function started(callRef: string): RecordEntry[] {
  const at = Date.now();
  return [
    {
      at,
      source: "event",
      message: {
        type: "call.started",
        direction: "inbound",
        appRef: "app-1",
        workspaceRef: "WOacme",
        from: "+15550001111",
        to: "+15550002222"
      }
    },
    {
      at: at + 1,
      source: "appbridge",
      message: {
        type: "session.start",
        callRef,
        appRef: "app-1",
        from: "+15550001111",
        to: "+15550002222",
        direction: "inbound"
      }
    }
  ] as RecordEntry[];
}

describe("@callrecord two writers on one working directory", function () {
  this.timeout(20_000);
  let dir: string;
  let writers: CallRecordWriter[] = [];
  let sealed: string[];

  const writer = (heartbeatMs = 100) => {
    const { working, store } = fsStores(dir);
    const w = new CallRecordWriter({
      working,
      store,
      key: KEY,
      region: "us-east",
      heartbeatMs,
      onSealed: (e) => sealed.push(`${e.callRef}@${e.version}`)
    });
    writers.push(w);
    return w;
  };

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "callrecord-shared-"));
    sealed = [];
  });

  afterEach(() => {
    writers.forEach((w) => w.stop());
    writers = [];
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("does not seal a quiet live call of another writer", async function () {
    const a = writer();
    const b = writer();
    for (const e of started("call-quiet")) a.append("call-quiet", e);
    // Silent for longer than the sweep's deadline (300 ms here), while A is alive.
    await wait(700);
    expect(await b.sweep(Date.now(), 300)).to.deep.equal([]);
    expect(sealed).to.deep.equal([]);
    // The hangup on A seals it, once.
    a.close("call-quiet");
    await a.flush();
    expect(sealed).to.deep.equal(["call-quiet@1"]);
    expect(await b.sweep(Date.now(), 300)).to.deep.equal([]);
    expect(sealed).to.deep.equal(["call-quiet@1"]);
  });

  it("seals a dead writer's call exactly once when two writers sweep at the same moment", async function () {
    const a = writer();
    for (const e of started("call-orphan")) a.append("call-orphan", e);
    a.stop(); // A dies: no heartbeat, no hangup
    await wait(500);
    const b = writer();
    const c = writer();
    const [byB, byC] = await Promise.all([
      b.sweep(Date.now(), 300),
      c.sweep(Date.now(), 300)
    ]);
    await Promise.all([b.flush(), c.flush()]);
    expect([...byB, ...byC]).to.deep.equal(["call-orphan"]);
    expect(sealed).to.deep.equal(["call-orphan@1"]);
    const { store } = fsStores(dir);
    expect(await store.currentVersion("call-orphan")).to.equal(1);
    expect(fs.readdirSync(path.join(dir, "working"))).to.deep.equal([]);
  });

  it("lets only one of two writers seal the same call at once", async function () {
    const a = writer();
    const b = writer();
    for (const e of started("call-race")) a.append("call-race", e);
    const [x, y] = await Promise.all([
      a.seal("call-race"),
      b.seal("call-race")
    ]);
    expect(x.version).to.equal(1);
    expect(y.version).to.equal(1);
    expect(sealed).to.deep.equal(["call-race@1"]);
  });
});

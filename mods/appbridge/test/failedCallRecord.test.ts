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
import {
  CallRecordWriter,
  decodeVcon,
  fsStores,
  RecordStore,
  verifyRecord
} from "@fonoster/callrecord";
import { expect } from "chai";
import { handleMaintenance } from "../src";

// The minimal record of an unanswered outbound call (busy, no answer, rejected): no AppBridge saw
// the call, so the control plane asks the region's record writer for it (`failed_call` on
// callrecord.<region>.maintenance). No NATS: the handler is called directly.

const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "P-256"
});
const KEY = {
  kid: "cp-test",
  privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString()
};
const KEYS = {
  "cp-test": publicKey.export({ type: "spki", format: "pem" }).toString()
};

describe("@AppBridge failed_call records (redesign-roomr)", function () {
  let dir: string;
  let writer: CallRecordWriter;
  let store: RecordStore;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "failed-call-"));
    const stores = fsStores(dir);
    store = stores.store;
    writer = new CallRecordWriter({ ...stores, key: KEY, region: "r1" });
  });

  afterEach(() => {
    writer.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("seals the busy call's minimal record with its call.progress entry", async function () {
    const entries = [
      {
        type: "call.started",
        direction: "outbound",
        appRef: "app-1",
        workspaceRef: "ws-1",
        from: "+15550001111",
        to: "+15551234567"
      },
      { type: "call.progress", status: "busy", sipStatus: 486 },
      { type: "call.failed", reason: "busy", sipStatus: 486 }
    ];
    expect(
      await handleMaintenance(writer, {
        op: "failed_call",
        callRef: "out-busy",
        workspaceRef: "ws-1",
        entries,
        reason: "unanswered outbound call",
        actor: "control-plane"
      })
    ).to.deep.equal({ type: "ack" });
    await writer.flush();
    const sealed = (await store.getSealed("out-busy"))!;
    expect(verifyRecord(sealed, KEYS)).to.deep.include({ ok: true });
    const vcon = decodeVcon(sealed.signed);
    expect(vcon.fonoster).to.deep.include({
      status: "failed",
      failure: { reason: "busy", sipStatus: 486 }
    });
    const messages = sealed.parts
      .find((p) => p.name === "messages.ndjson")!
      .data.toString()
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l).message);
    expect(messages.map((m) => m.type)).to.deep.equal([
      "call.started",
      "call.progress",
      "call.failed"
    ]);
    expect(messages[1]).to.include({ status: "busy" });
  });

  it("refuses anything but the three failed-call entries", async function () {
    const bad = async (entries: unknown) =>
      expect(
        await handleMaintenance(writer, {
          op: "failed_call",
          callRef: "c1",
          entries: entries as never,
          reason: "x",
          actor: "y"
        })
      ).to.deep.equal({ type: "error", code: "bad_request" });
    await bad([]);
    await bad([{ type: "speak", text: "hi" }]);
    await bad(Array(4).fill({ type: "call.failed", reason: "busy" }));
    expect(await store.getSealed("c1")).to.equal(undefined);
  });
});

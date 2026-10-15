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
import { generateKeyPairSync } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import {
  CARD_MASK,
  CallRecordWriter,
  FsRecordStorage,
  RecordEntry,
  decodeVcon,
  keyHistoryFromSet,
  keySet,
  redactText,
  verifyRecord
} from "../src";

function keyPair(kid: string) {
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256"
  });
  return {
    kid,
    privateKeyPem: privateKey
      .export({ type: "pkcs8", format: "pem" })
      .toString(),
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString()
  };
}

const KEY = keyPair("region-1-2026");

let t = 1_700_000_000_000;
const at = () => (t += 100);

function normalCall(callRef: string): RecordEntry[] {
  const start = (appRef: string) => ({
    at: at(),
    source: "gateway" as const,
    message: {
      type: "session.start",
      callRef,
      appRef,
      from: "+15550001111",
      to: "+15550002222",
      direction: "inbound"
    }
  });
  return [
    {
      at: at(),
      source: "event",
      message: { type: "call.started", direction: "inbound", appRef: "ivr" }
    },
    start("ivr"),
    {
      at: at(),
      source: "app",
      message: {
        type: "speak",
        id: "r1",
        text: "Your card number please.",
        last: true
      }
    },
    {
      at: at(),
      source: "gateway",
      message: { type: "output.started", id: "r1" }
    },
    { at: at(), source: "gateway", message: { type: "output.done", id: "r1" } },
    { at: at(), source: "gateway", message: { type: "turn.user_started" } },
    {
      at: at(),
      source: "gateway",
      message: {
        type: "turn.ended",
        text: "It is 4111 1111 1111 1111",
        language: "en",
        confidence: 0.9,
        durationMs: 2000
      }
    },
    {
      at: at(),
      source: "app",
      message: {
        type: "speak",
        id: "r2",
        text: "Thanks. Your balance is ten dollars.",
        last: true
      }
    },
    {
      at: at(),
      source: "gateway",
      message: { type: "output.started", id: "r2" }
    },
    {
      at: at(),
      source: "gateway",
      message: {
        type: "output.interrupted",
        id: "r2",
        heardText: "Thanks.",
        heardMs: 600
      }
    },
    {
      at: at(),
      source: "app",
      message: {
        type: "record.note",
        id: "n1",
        data: { kind: "autopilot.turn", firstTokenMs: 300 }
      }
    },
    {
      at: at(),
      source: "app",
      message: { type: "handoff", app: "billing", payload: {} }
    },
    start("billing"),
    {
      at: at(),
      source: "event",
      message: { type: "call.ended", reason: "caller_hangup" }
    }
  ];
}

describe("@callrecord", function () {
  let dir: string;
  let storage: FsRecordStorage;
  let writer: CallRecordWriter;
  const sealedEvents: string[] = [];

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "callrecord-"));
    storage = new FsRecordStorage(dir);
    writer = new CallRecordWriter({
      storage,
      key: KEY,
      region: "us-east",
      onSealed: (callRef, v) => sealedEvents.push(`${callRef}@${v}`)
    });
  });

  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  function record(callRef: string, entries = normalCall(callRef)) {
    for (const e of entries) writer.append(callRef, e);
    writer.close(callRef);
    return storage.getSealed(callRef)!;
  }

  it("seals one signed vCon per call, including handed-off calls", function () {
    const sealed = record("call-1");
    expect(sealed.version).to.equal(1);
    expect(verifyRecord(sealed, { [KEY.kid]: KEY.publicKeyPem })).to.deep.equal(
      { ok: true, kid: KEY.kid }
    );
    const vcon = decodeVcon(sealed.signed);
    expect(vcon.parties.map((p) => p.role)).to.deep.equal([
      "caller",
      "callee",
      "agent",
      "agent"
    ]);
    expect(vcon.fonoster).to.include({
      endReason: "caller_hangup",
      complete: true
    });
    expect((vcon.fonoster as { missing: string[] }).missing).to.deep.equal([
      "recording",
      "sip_trace"
    ]);
    expect(storage.listWorking()).to.have.length(0);
    expect(sealedEvents).to.include("call-1@1");
  });

  it("keeps what the caller heard, marks interruptions and carries turn decisions and notes", function () {
    const vcon = decodeVcon(record("call-2").signed);
    const bodies = vcon.dialog.map((d) => d.body);
    expect(bodies).to.deep.equal([
      "Your card number please.",
      "It is 4111 1111 1111 1111",
      "Thanks."
    ]);
    expect(vcon.dialog[2]).to.deep.include({
      meta: {
        interrupted: true,
        fullText: "Thanks. Your balance is ten dollars.",
        heardMs: 600
      }
    });
    const kinds = vcon.analysis.map((a) => a.type);
    expect(kinds).to.deep.equal(["turn_decisions", "app_notes"]);
  });

  it("masks a card number in the redacted copy and leaves the original unchanged", function () {
    const sealed = record("call-3");
    const redacted = decodeVcon(sealed.redacted);
    expect(redacted.dialog[1].body).to.equal(`It is ${CARD_MASK}`);
    expect(redacted.redacted).to.deep.include({ type: "pii" });
    expect(redacted.attachments).to.have.length(0);
    expect(decodeVcon(sealed.signed).dialog[1].body).to.equal(
      "It is 4111 1111 1111 1111"
    );
  });

  it("detects tampering with a part or the payload", function () {
    const sealed = record("call-4");
    const keys = { [KEY.kid]: KEY.publicKeyPem };
    const tamperedPart = {
      ...sealed,
      parts: [{ ...sealed.parts[0], data: Buffer.from("edited") }]
    };
    expect(verifyRecord(tamperedPart, keys)).to.deep.equal({
      ok: false,
      failure: "part messages.ndjson hash mismatch"
    });
    const vcon = decodeVcon(sealed.signed);
    vcon.dialog[0].body = "something else";
    const tamperedPayload = {
      ...sealed,
      signed: {
        ...sealed.signed,
        payload: Buffer.from(JSON.stringify(vcon)).toString("base64url")
      }
    };
    expect(verifyRecord(tamperedPayload, keys)).to.deep.equal({
      ok: false,
      failure: "signature"
    });
  });

  it("never edits a sealed version; additions create a new version that points back", function () {
    const v1 = record("call-5");
    expect(() => storage.putSealed("call-5", v1)).to.throw("already sealed");
    const v2 = writer.addVersion("call-5", {
      analysis: [{ type: "summary", body: "Asked for the balance." }]
    });
    expect(v2.version).to.equal(2);
    const vcon2 = decodeVcon(v2.signed);
    expect(vcon2.amended).to.deep.include({ uuid: decodeVcon(v1.signed).uuid });
    expect(String(vcon2.amended!.content_hash)).to.match(/^sha512-/);
    expect(vcon2.vcon).to.equal("0.4.0");
    expect(vcon2.analysis.map((a) => a.type)).to.include("summary");
    expect(storage.getSealed("call-5", 1)!.signed).to.deep.equal(v1.signed);
    expect(storage.getSealed("call-5")!.version).to.equal(2);
  });

  it("seals records left behind by a crashed gateway, listing the missing hangup", function () {
    const entries = normalCall("call-6").slice(0, 7);
    for (const e of entries) writer.append("call-6", e);
    expect(writer.sweep(Date.now(), 60_000)).to.deep.equal([]);
    expect(writer.sweep(Date.now() + 60_000, 30_000)).to.deep.equal(["call-6"]);
    const vcon = decodeVcon(storage.getSealed("call-6")!.signed);
    expect(vcon.fonoster).to.deep.include({ complete: false, endReason: null });
    expect((vcon.fonoster as { missing: string[] }).missing).to.include(
      "hangup"
    );
    expect(vcon.dialog.map((d) => d.body)).to.include(
      "It is 4111 1111 1111 1111"
    );
  });

  it("publishes its key set and records point to it", function () {
    const withJku = new CallRecordWriter({
      storage,
      region: "us-east",
      key: {
        ...KEY,
        jku: "https://records.us-east.fonoster.com/.well-known/call-record-keys.json"
      }
    });
    for (const e of normalCall("call-8")) withJku.append("call-8", e);
    withJku.close("call-8");
    const sealed = storage.getSealed("call-8")!;
    const header = JSON.parse(
      Buffer.from(sealed.signed.signatures[0].protected, "base64url").toString()
    );
    expect(header).to.include({
      alg: "ES256",
      kid: KEY.kid,
      jku: "https://records.us-east.fonoster.com/.well-known/call-record-keys.json"
    });
    const published = keySet({ [KEY.kid]: KEY.publicKeyPem });
    expect(published.keys[0]).to.include({
      kty: "EC",
      crv: "P-256",
      kid: KEY.kid,
      use: "sig",
      alg: "ES256"
    });
    expect(published.keys[0]).to.not.have.property("d");
    expect(
      verifyRecord(
        sealed,
        keyHistoryFromSet(JSON.parse(JSON.stringify(published)))
      )
    ).to.deep.include({ ok: true });
  });

  it("verifies old records after the key rotates", function () {
    const sealed = record("call-7");
    const next = keyPair("region-1-2027");
    const history = {
      [KEY.kid]: KEY.publicKeyPem,
      [next.kid]: next.publicKeyPem
    };
    expect(verifyRecord(sealed, history)).to.deep.include({ ok: true });
    expect(
      verifyRecord(sealed, { [next.kid]: next.publicKeyPem })
    ).to.deep.equal({ ok: false, failure: "signature" });
  });
});

describe("@callrecord redaction rules", function () {
  it("masks valid card numbers written as digits", function () {
    expect(redactText("card 4111-1111-1111-1111 ok").text).to.equal(
      `card ${CARD_MASK} ok`
    );
    expect(redactText("ref 1234 5678 9012 3456").redactions).to.equal(0);
  });

  it("masks spoken card numbers in English and Spanish", function () {
    const en =
      "four one one one one one one one one one one one one one one one";
    expect(redactText(`it is ${en}`).text).to.equal(`it is ${CARD_MASK}`);
    const es =
      "cuatro uno uno uno uno uno uno uno uno uno uno uno uno uno uno uno";
    expect(redactText(es).redactions).to.equal(1);
  });
});

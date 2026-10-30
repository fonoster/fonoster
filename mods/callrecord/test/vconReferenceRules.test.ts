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
import {
  CallRecordWriter,
  RecordStore,
  SignedVcon,
  Vcon,
  decodeVcon,
  fsStores,
  referencedParts,
  withPartUrls
} from "../src";
import { FIXTURE_CALLS, loadFixtureCall, playFixtureCall } from "./fixtures";

// The rules vCon tools check beyond the pinned -04 schema. The analysis rule is a port of
// vcon-lib 0.10.0 `Vcon.is_valid` (src/vcon/vcon.py): every analysis has type, dialog, vendor,
// body and encoding, and each dialog index exists in that copy's dialog. API-073 runs vcon-lib
// itself in CI.

const ENCODINGS = ["json", "none", "base64url"];

function analysisProblems(vcon: Vcon): string[] {
  const errors: string[] = [];
  vcon.analysis.forEach((a, i) => {
    for (const field of ["type", "dialog", "vendor", "body", "encoding"])
      if (!(field in a))
        errors.push(
          `Analysis at index ${i} is missing required field: ${field}`
        );
    if ("encoding" in a && !ENCODINGS.includes(String(a.encoding)))
      errors.push(`Analysis at index ${i} has invalid encoding: ${a.encoding}`);
    const refs = Array.isArray(a.dialog) ? a.dialog : [a.dialog];
    if ("dialog" in a)
      for (const d of refs)
        if (!Number.isInteger(d) || d < 0 || d >= vcon.dialog.length)
          errors.push(
            `Analysis at index ${i} references invalid dialog index: ${d}`
          );
  });
  return errors;
}

function problems(signed: SignedVcon | undefined): string[] {
  expect(signed, "a signed vCon").to.not.equal(undefined);
  return analysisProblems(decodeVcon(signed!));
}

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const KEY = {
  kid: "k1",
  privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString()
};

describe("@callrecord vCon reference rules (vcon-lib 0.10.0)", function () {
  let dir: string;
  let store: RecordStore;
  let writer: CallRecordWriter;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "callrecord-rules-"));
    const stores = fsStores(dir);
    store = stores.store;
    writer = new CallRecordWriter({ ...stores, key: KEY, region: "us-east" });
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  FIXTURE_CALLS.forEach((name) => {
    it(`fixture ${name}: every analysis names its dialog in the original and the redacted copy`, async function () {
      const fixture = loadFixtureCall(name);
      await playFixtureCall(writer, fixture);
      const v = (await store.getVersion(fixture.callRef))!;
      expect(problems(v.signed)).to.deep.equal([]);
      expect(problems(v.redacted)).to.deep.equal([]);
    });
  });

  it("the redacted copy that withholds the recording points no analysis at it", async function () {
    const fixture = loadFixtureCall("card-number");
    // A recording that ends before anyone speaks: the redacted turns can't be located in it to
    // beep, so the redacted copy withholds it (LO-B9).
    await playFixtureCall(writer, {
      ...fixture,
      audio: { startMs: 300, caller: [{ fromMs: 300, toMs: 400 }], agent: [] }
    });
    const v = (await store.getVersion(fixture.callRef))!;
    expect(decodeVcon(v.signed).dialog[0].type).to.equal("recording");
    const redacted = decodeVcon(v.redacted);
    expect(redacted.dialog.some((d) => d.type === "recording")).to.equal(false);
    for (const a of redacted.analysis)
      for (const i of a.dialog as number[]) {
        expect(i).to.be.below(redacted.dialog.length);
        expect(redacted.dialog[i].type).to.not.equal("recording");
      }
    expect(problems(v.redacted)).to.deep.equal([]);
  });

  it("names the dialog after additions, deletions and erasure", async function () {
    const fixture = loadFixtureCall("card-number");
    await playFixtureCall(writer, fixture);
    const ref = fixture.callRef;
    const current = async (label: string) => {
      const v = (await store.getVersion(ref))!;
      expect(problems(v.signed), label).to.deep.equal([]);
      expect(problems(v.redacted), `${label} (redacted)`).to.deep.equal([]);
      return v;
    };
    await writer.addVersion(ref, {
      analysis: [{ type: "summary", vendor: "fonoster", body: "A payment." }]
    });
    const added = await current("addition");
    const summary = decodeVcon(added.signed).analysis.find(
      (a) => a.type === "summary"
    )!;
    expect(summary.encoding).to.equal("none");
    expect(summary.dialog).to.deep.equal(
      decodeVcon(added.signed).dialog.map((_, i) => i)
    );
    await writer.deleteParts(ref, ["recording"], {
      reason: "retention",
      actor: "system:retention"
    });
    await current("recording deleted");
    await writer.deleteParts(ref, ["transcript"], {
      reason: "request",
      actor: "u1"
    });
    await current("transcript deleted");
    const { version } = await writer.erase(ref, {
      reason: "erasure request",
      actor: "u1"
    });
    const tomb = (await store.getVersion(ref, version))!;
    expect(problems(tomb.signed)).to.deep.equal([]);
  });

  describe("withPartUrls", function () {
    const vcon = (): Vcon => ({
      vcon: "0.4.0",
      uuid: "u",
      created_at: "2026-10-30T00:00:00.000Z",
      parties: [],
      dialog: [
        { type: "recording", url: "parts/recording.wav" },
        { type: "text", body: "hi" },
        { type: "recording", url: "parts/../escape.wav" },
        { type: "recording", url: "https://elsewhere.test/parts/a.wav" }
      ],
      analysis: [],
      attachments: [
        { purpose: "session_messages", url: "parts/messages ndjson&x=1" }
      ]
    });

    it("rewrites only parts/<name> urls, with the name encoded", function () {
      const input = vcon();
      const out = withPartUrls(input, (name) => `https://api.test/p/${name}`);
      expect(out.dialog.map((d) => d.url)).to.deep.equal([
        "https://api.test/p/recording.wav",
        undefined,
        "parts/../escape.wav",
        "https://elsewhere.test/parts/a.wav"
      ]);
      expect(out.attachments[0].url).to.equal(
        "https://api.test/p/messages%20ndjson%26x%3D1"
      );
    });

    it("leaves its input untouched", function () {
      const input = vcon();
      const before = JSON.stringify(input);
      withPartUrls(input, (name) => `https://api.test/p/${name}`);
      expect(JSON.stringify(input)).to.equal(before);
    });
  });

  it("referencedParts lists a copy's files by role and by name", function () {
    const { byRole, names } = referencedParts({
      vcon: "0.4.0",
      uuid: "u",
      created_at: "2026-10-30T00:00:00.000Z",
      parties: [],
      dialog: [{ type: "recording", url: "parts/recording.redacted.wav" }],
      analysis: [],
      attachments: [
        { purpose: "session_messages", url: "parts/messages.ndjson" }
      ]
    });
    expect(byRole.get("recording")).to.equal("recording.redacted.wav");
    expect(byRole.get("messages")).to.equal("messages.ndjson");
    expect([...names]).to.deep.equal([
      "recording.redacted.wav",
      "messages.ndjson"
    ]);
  });
});

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
  RecordIndexEntry,
  RecordStore,
  decodeVcon,
  fsStores,
  verifyRecord,
  wavChannels
} from "../src";
import { FIXTURE_CALLS, loadFixtureCall, playFixtureCall } from "./fixtures";

// The fixture calls (task 1.2) sealed end to end, and redaction beeps in the recording (1.6, 4.1,
// LO-B9).

const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "P-256"
});
const KEY = {
  kid: "k1",
  privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString()
};
const KEYS = {
  k1: publicKey.export({ type: "spki", format: "pem" }).toString()
};

describe("@callrecord fixture calls", function () {
  let dir: string;
  let store: RecordStore;
  let writer: CallRecordWriter;
  let index: RecordIndexEntry[];

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "callrecord-fixtures-"));
    const stores = fsStores(dir);
    store = stores.store;
    index = [];
    writer = new CallRecordWriter({
      ...stores,
      key: KEY,
      region: "us-east",
      onSealed: (e) => index.push(e)
    });
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("ships the fixtures the task names", function () {
    expect(FIXTURE_CALLS).to.include.members([
      "card-number",
      "handoff",
      "failed-busy",
      "recorded-call",
      "appbridge-crash"
    ]);
  });

  FIXTURE_CALLS.forEach((name) => {
    it(`${name}: seals a verifiable record that matches the fixture`, async function () {
      const fixture = loadFixtureCall(name);
      await playFixtureCall(writer, fixture);
      const sealed = (await store.getSealed(fixture.callRef))!;
      expect(verifyRecord(sealed, KEYS)).to.deep.include({ ok: true });
      const vcon = decodeVcon(sealed.signed);
      const redacted = decodeVcon(sealed.redacted);
      const f = vcon.fonoster as Record<string, unknown>;
      expect(f.status).to.equal(fixture.expect.status);
      expect(f.missing).to.deep.equal(fixture.expect.missing);
      expect((redacted.fonoster as { redactions: number }).redactions).to.equal(
        fixture.expect.redactions
      );
      expect(
        vcon.parties.filter((p) => p.role === "agent").map((p) => p.name)
      ).to.deep.equal(fixture.expect.agents);
      const rec = (v: typeof vcon) =>
        v.dialog.find((d) => d.type === "recording")?.url;
      const expected = {
        none: [undefined, undefined],
        same: ["parts/recording.wav", "parts/recording.wav"],
        beeped: ["parts/recording.wav", "parts/recording.redacted.wav"]
      }[fixture.expect.recording];
      expect([rec(vcon), rec(redacted)]).to.deep.equal(expected);
      expect(index.at(-1)).to.deep.include({
        callRef: fixture.callRef,
        workspaceRef: "ws-fixtures"
      });
    });
  });

  it("card-number: masks the words and beeps exactly those turns in the redacted recording", async function () {
    const fixture = loadFixtureCall("card-number");
    await playFixtureCall(writer, fixture);
    const sealed = (await store.getSealed(fixture.callRef))!;
    const redacted = decodeVcon(sealed.redacted);
    const texts = redacted.dialog
      .filter((d) => d.type === "text")
      .map((d) => d.body);
    expect(texts).to.deep.equal([
      "What is your card number?",
      `It is ${CARD_MASK}`,
      `I have ${CARD_MASK}, thank you.`
    ]);
    expect(JSON.stringify(redacted)).to.not.match(/4111|one one one/);

    const part = (n: string) => sealed.parts.find((p) => p.name === n)!.data;
    const [callerOrig, agentOrig] = wavChannels(part("recording.wav"));
    const [caller, agent] = wavChannels(part("recording.redacted.wav"));
    const at = (ms: number) => Math.round(((ms - 300) * 16000) / 1000);
    const isTone = (x: Int16Array, from: number, to: number) => {
      const s = x.slice(at(from), at(to));
      // a sine: crosses zero and uses both signs, unlike the constant fixture level
      return s.some((v) => v > 1000) && s.some((v) => v < -1000);
    };
    // The caller's card turn (turn.user_started 2500 → turn.ended 6900) is beeped...
    expect(isTone(caller, 2600, 5900)).to.equal(true);
    expect(isTone(callerOrig, 2600, 5900)).to.equal(false);
    // ...and so is the agent repeating it (output 7300 → 9800), but not its first question.
    expect(isTone(agent, 7400, 9400)).to.equal(true);
    expect(agent.slice(at(700), at(1700)).every((v) => v === -3000)).to.equal(
      true
    );
    expect(Array.from(agent.slice(at(700), at(1700)))).to.deep.equal(
      Array.from(agentOrig.slice(at(700), at(1700)))
    );
    const ref = redacted.dialog.find((d) => d.type === "recording")!;
    expect(ref.meta).to.deep.include({
      redacted: { method: "beep", spans: 2 }
    });
    expect(redacted.fonoster).to.not.have.property("recordingWithheld");

    // A later addition is masked in the redacted copy too.
    await writer.addVersion(fixture.callRef, {
      analysis: [
        {
          type: "summary",
          vendor: "fonoster",
          body: "Paid with 4111111111111111."
        }
      ]
    });
    const v2 = (await store.getVersion(fixture.callRef))!;
    expect(JSON.stringify(decodeVcon(v2.redacted!).analysis)).to.not.contain(
      "4111"
    );
    expect(JSON.stringify(decodeVcon(v2.signed!).analysis)).to.contain("4111");
  });

  it("withholds the recording from the redacted copy when the redacted speech is not in it", async function () {
    const fixture = loadFixtureCall("card-number");
    // The recording only started after the caller read the number.
    fixture.audio = {
      startMs: 7000,
      caller: [],
      agent: [{ fromMs: 7300, toMs: 7400 }]
    };
    fixture.entries = fixture.entries.filter(
      (e) => !(e.message.type === "speak" && e.message.id === "s2")
    );
    await playFixtureCall(writer, fixture);
    const redacted = decodeVcon(
      (await store.getSealed(fixture.callRef))!.redacted
    );
    expect(redacted.dialog.some((d) => d.type === "recording")).to.equal(false);
    expect(redacted.fonoster).to.deep.include({
      recordingWithheld: "redaction"
    });
  });

  it("deleting the recording deletes the beeped copy too", async function () {
    const fixture = loadFixtureCall("card-number");
    await playFixtureCall(writer, fixture);
    await writer.deleteParts(fixture.callRef, ["recording"], {
      reason: "retention",
      actor: "system:retention"
    });
    expect(await store.getPart(fixture.callRef, "recording.wav")).to.equal(
      undefined
    );
    expect(
      await store.getPart(fixture.callRef, "recording.redacted.wav")
    ).to.equal(undefined);
    const v2 = decodeVcon((await store.getVersion(fixture.callRef))!.redacted!);
    const rec = v2.dialog.find((d) => d.type === "recording")!;
    expect(rec).to.not.have.property("url");
  });
});

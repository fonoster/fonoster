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
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import {
  CallRecordWriter,
  FileKeyCustody,
  RecordEntry,
  decodeVcon,
  fsStores,
  keyHistoryFromSet,
  keySet,
  verifyRecord
} from "../src";
import { run } from "../src/cli";

// Region signing-key custody and rotation (task 2.6, LO-B5).

function call(callRef: string): RecordEntry[] {
  let t = 1_700_000_000_000;
  return [
    {
      at: (t += 100),
      source: "gateway",
      message: { type: "session.start", callRef, appRef: "ivr" }
    },
    {
      at: (t += 100),
      source: "event",
      message: { type: "call.ended", reason: "caller_hangup" }
    }
  ];
}

describe("@callrecord key custody", function () {
  let dir: string;
  let keys: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "callrecord-keys-"));
    keys = path.join(dir, "keys");
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  async function seal(writer: CallRecordWriter, callRef: string) {
    for (const e of call(callRef)) writer.append(callRef, e);
    writer.close(callRef);
    await writer.flush();
  }

  it("rotates without a restart; old records keep verifying with the published set", async function () {
    const first = FileKeyCustody.rotate(keys, { kid: "us-east-2026a" });
    const custody = new FileKeyCustody(keys, {
      jku: "https://us-east.example.com/.well-known/call-record-keys.json"
    });
    const { working, store } = fsStores(dir);
    const writer = new CallRecordWriter({
      working,
      store,
      key: custody,
      region: "us-east"
    });
    await seal(writer, "before");

    const second = FileKeyCustody.rotate(keys, { kid: "us-east-2026b" });
    await seal(writer, "after");

    const kidOf = async (c: string) =>
      (await store.getSealed(c))!.signed.signatures[0].header.kid;
    expect(await kidOf("before")).to.equal(first);
    expect(await kidOf("after")).to.equal(second);
    const header = JSON.parse(
      Buffer.from(
        (await store.getSealed("after"))!.signed.signatures[0].protected,
        "base64url"
      ).toString()
    );
    expect(header).to.deep.include({ kid: second, jku: custody.current().jku });

    // A verifier only has the published key set (no private key anywhere in it).
    const published = keySet(custody.publicKeys());
    expect(JSON.stringify(published)).to.not.contain('"d"');
    const history = keyHistoryFromSet(published);
    for (const c of ["before", "after"])
      expect(
        verifyRecord((await store.getSealed(c))!, history)
      ).to.deep.include({ ok: true });
    // Without the old key in the set, the old record does not verify.
    expect(
      verifyRecord((await store.getSealed("before"))!, {
        [second]: history[second]
      })
    ).to.deep.equal({ ok: false, failure: "signature" });

    // Retiring the old private key keeps its public half published.
    FileKeyCustody.retire(keys, first);
    expect(fs.existsSync(path.join(keys, `${first}.key.pem`))).to.equal(false);
    expect(Object.keys(custody.publicKeys())).to.include(first);
    expect(() => FileKeyCustody.retire(keys, second)).to.throw(/current key/);
    expect(decodeVcon((await store.getSealed("after"))!.signed).vcon).to.equal(
      "0.4.0"
    );
  });

  it("keeps private keys private and never overwrites a key", function () {
    const kid = FileKeyCustody.rotate(keys, { kid: "k1" });
    if (process.platform !== "win32")
      expect(
        fs.statSync(path.join(keys, `${kid}.key.pem`)).mode & 0o077
      ).to.equal(0);
    expect(() => FileKeyCustody.rotate(keys, { kid: "k1" })).to.throw();
    expect(() => FileKeyCustody.rotate(keys, { kid: "../evil" })).to.throw(
      /bad key id/
    );
    expect(() =>
      new FileKeyCustody(path.join(dir, "empty")).current()
    ).to.throw(/no signing key/);
  });

  it("fonoster-callrecord keys rotate, list, retire and publish", async function () {
    const out: string[] = [];
    const say = (s: string) => out.push(s);
    expect(
      await run(["keys", "rotate", "--dir", keys, "--kid", "r-1"], say)
    ).to.equal(0);
    expect(
      await run(["keys", "rotate", "--dir", keys, "--prefix", "us-east"], say)
    ).to.equal(0);
    const second = /new signing key (\S+) is current/.exec(out[1])![1];
    expect(second).to.match(/^us-east-\d{8}T\d{6}$/);
    out.length = 0;
    expect(await run(["keys", "list", "--dir", keys], say)).to.equal(0);
    expect(out).to.have.members(["  r-1", `* ${second}`]);
    expect(await run(["keys", "retire", "r-1", "--dir", keys], say)).to.equal(
      0
    );
    out.length = 0;
    await run(["keys", "list", "--dir", keys], say);
    expect(out).to.include("  r-1 (retired: verify only)");
    out.length = 0;
    expect(await run(["keys", "publish", "--dir", keys], say)).to.equal(0);
    const set = JSON.parse(out.join("\n"));
    expect(set.keys.map((k: { kid: string }) => k.kid).sort()).to.deep.equal(
      ["r-1", second].sort()
    );
    out.length = 0;
    expect(await run(["keys", "rotate"], say)).to.equal(1);
    expect(out[0]).to.equal("error: --dir is required");
  });
});

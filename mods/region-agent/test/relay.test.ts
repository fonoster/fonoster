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
import { expect } from "chai";
import { randomBytes } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fsStores, RecordStore } from "@fonoster/callrecord";
import { CHUNK_BYTES, parseRange, RelayResponder } from "../src/relay";
import { sealRecord } from "./fixtures";

// add-private-regions task 3.3: the relay responder (contract 3 `region.R.relay`, PR-5).

describe("@region-agent relay responder", function () {
  let dir: string;
  let store: RecordStore;
  let relay: RelayResponder;
  const audio = randomBytes(CHUNK_BYTES * 2 + 1000);
  beforeEach(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "region-relay-"));
    store = fsStores(dir).store;
    relay = new RelayResponder(() => store, path.join(dir, "audit.jsonl"));
    await sealRecord(store, "call-1", audio);
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const req = (extra: Record<string, unknown>) =>
    ({
      type: "region.relay",
      id: "r1",
      userRef: "user-1",
      callRef: "call-1",
      op: "record.get",
      ...extra
    }) as never;

  it("returns the redacted record by default", async function () {
    const chunks = await relay.respond(req({}));
    expect(chunks).to.have.length(1);
    expect(chunks[0]).to.include({ seq: 0, last: true, id: "r1" });
    const body = JSON.parse(Buffer.from(chunks[0].data, "base64").toString());
    expect(body.redacted).to.equal(true);
    expect(body.vcon.dialog[0].body).to.equal("[redacted]");
    expect(body.parts[0].name).to.equal("recording.wav");
  });

  it("streams a recording in ≤ 512 KB chunks with seq and last", async function () {
    const chunks = await relay.respond(
      req({ op: "record.part", part: "recording", original: true })
    );
    expect(chunks.map((c) => c.seq)).to.deep.equal([0, 1, 2]);
    expect(chunks.map((c) => c.last)).to.deep.equal([false, false, true]);
    for (const c of chunks)
      expect(Buffer.byteLength(JSON.stringify(c))).to.be.at.most(512 * 1024);
    const joined = Buffer.concat(
      chunks.map((c) => Buffer.from(c.data, "base64"))
    );
    expect(joined.equals(audio)).to.equal(true);
    expect(chunks[0].contentType).to.equal("audio/wav");
  });

  it("withholds parts the redacted copy does not reference, and audits every read", async function () {
    const [denied] = await relay.respond(
      req({ op: "record.part", part: "recording" })
    );
    expect(denied.error).to.equal("not_found");
    const [missing] = await relay.respond(req({ callRef: "nope" }));
    expect(missing.error).to.equal("not_found");
    await relay.respond(
      req({
        op: "record.part",
        part: "recording",
        original: true,
        range: "bytes=0-99"
      })
    );
    const audit = fs
      .readFileSync(path.join(dir, "audit.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));
    expect(audit.map((a) => a.result)).to.deep.equal([
      "not_found",
      "not_found",
      "ok"
    ]);
    expect(audit[2]).to.include({
      userRef: "user-1",
      bytes: 100,
      result: "ok"
    });
  });

  it("parses byte ranges", function () {
    expect(parseRange("bytes=10-19", 100)).to.deep.equal({
      start: 10,
      end: 19
    });
    expect(parseRange("bytes=-10", 100)).to.deep.equal({ start: 90, end: 99 });
    expect(parseRange({ start: 50 }, 100)).to.deep.equal({
      start: 50,
      end: 99
    });
    expect(() => parseRange("bytes=9-1", 100)).to.throw(/bad_range/);
  });
});

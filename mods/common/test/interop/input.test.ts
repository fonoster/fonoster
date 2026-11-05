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
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { run } from "../../src/interop/cli";
import {
  classifyCall,
  FarEnd,
  parseCall,
  parseFarEnds,
  readCall
} from "../../src/interop";

const FIXTURES = path.join(__dirname, "fixtures");
const ANSWERED = path.join(
  FIXTURES,
  "sipjs_wa-dod-invite_whatsapp_20261025.jsonl"
);
const DID = path.join(
  FIXTURES,
  "seet-provider_sc-1.3.2-did-invite_agent-1001_20261023.jsonl"
);
const FAR_ENDS: FarEnd[] = [
  { name: "whatsapp", hosts: ["wa.meta.vc", "wa-*"] }
];

function cli(args: string[]) {
  const out: string[] = [];
  const err: string[] = [];
  const code = run(args, { out: (l) => out.push(l), err: (l) => err.push(l) });
  return { code, out, err };
}

describe("@common/interop input", function () {
  let dir: string;
  let farEndsFile: string;

  before(function () {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "interop-"));
    farEndsFile = path.join(dir, "far-ends.json");
    fs.writeFileSync(farEndsFile, JSON.stringify(FAR_ENDS));
  });

  after(function () {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("finds no call in a REGISTER-only recording", function () {
    const file = path.join(
      FIXTURES,
      "seet-agent-1001_register-before-sc-12.2.1-dod-reinvite_routr_20261023.jsonl"
    );
    expect(classifyCall(readCall(file), FAR_ENDS)).to.equal(null);
  });

  it("finds nothing for a far end that isn't listed", function () {
    expect(
      classifyCall(readCall(ANSWERED), [
        { name: "twilio", hosts: ["*.pstn.twilio.com"] }
      ])
    ).to.equal(null);
  });

  it("skips a truncated last line and a non-JSON line", function () {
    const text = fs.readFileSync(ANSWERED, "utf8");
    const lines = text.trim().split("\n");
    const broken = ["not json", ...lines, lines[0].slice(0, 40)].join("\n");
    expect(parseCall(broken)).to.have.length(lines.length);
    expect(classifyCall(parseCall(broken), FAR_ENDS)?.case).to.equal("IOP-004");
  });

  it("never takes the far end from forgeable headers", function () {
    const records = readCall(DID);
    records.forEach((r) => {
      const m = r.request.message as any;
      if (m.from?.address?.uri) m.from.address.uri.host = "wa.meta.vc";
    });
    expect(classifyCall(records, FAR_ENDS)).to.equal(null);
  });

  it("matches an inbound call on the Trunk's Request-URI host", function () {
    const records = readCall(DID);
    records.forEach((r) => {
      const m = r.request.message as any;
      if (m.requestUri)
        m.requestUri.host = "wa-k1-15555550100.pstn.example.com";
    });
    expect(classifyCall(records, FAR_ENDS)).to.deep.equal({
      farEnd: "whatsapp",
      case: "IOP-001",
      direction: "inbound"
    });
  });

  it("matches an inbound call on the sender address", function () {
    const farEnds: FarEnd[] = [
      { name: "provider", addresses: ["10.111.221.0/24"] }
    ];
    expect(classifyCall(readCall(DID), farEnds)?.farEnd).to.equal("provider");
  });

  it("names the bad far-ends entry", function () {
    expect(() =>
      parseFarEnds([{ name: "ok", hosts: ["a"] }, { name: "Bad!" }])
    ).to.throw("far end 1: name");
    expect(() => parseFarEnds([{ name: "x" }])).to.throw(
      "far end 0: hosts or addresses"
    );
    expect(() =>
      parseFarEnds([{ name: "x", addresses: ["57.144.0.0/99"] }])
    ).to.throw("bad prefix");
    expect(() =>
      parseFarEnds([
        { name: "x", hosts: ["a"] },
        { name: "x", hosts: ["b"] }
      ])
    ).to.throw("used twice");
  });

  it("prints the far end and case, or - -, and exits 0", function () {
    expect(
      cli(["classify", ANSWERED, "--far-ends", farEndsFile])
    ).to.deep.include({ code: 0, out: ["whatsapp IOP-004"] });
    expect(cli(["classify", DID, "--far-ends", farEndsFile]).out).to.deep.equal(
      ["- -"]
    );
  });

  it("exits 1 on an unreadable file or bad far ends, 2 on usage", function () {
    expect(
      cli([
        "classify",
        path.join(dir, "missing.jsonl"),
        "--far-ends",
        farEndsFile
      ]).code
    ).to.equal(1);
    const bad = path.join(dir, "bad.json");
    fs.writeFileSync(bad, JSON.stringify([{ name: "Bad!" }]));
    expect(cli(["classify", ANSWERED, "--far-ends", bad]).code).to.equal(1);
    expect(cli(["classify", ANSWERED]).code).to.equal(2);
    expect(cli([]).code).to.equal(2);
  });
});

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

const FIXTURES = path.join(__dirname, "fixtures");
const ANSWERED = "sipjs_wa-dod-invite_whatsapp_20261025.jsonl";
const CANCELLED = "sipjs_wa-dod-invite-cancel_whatsapp_20261025.jsonl";
const DECLINED =
  "seet-agent-1001_rr-1.2.1-dod-declined_provider_20261023.jsonl";
const REGISTER =
  "seet-agent-1001_register-before-sc-12.2.1-dod-reinvite_routr_20261023.jsonl";
const FAR_ENDS = [
  { name: "whatsapp", hosts: ["wa.meta.vc", "wa-*"] },
  { name: "provider", hosts: ["sip.provider.net"] }
];

const lines = (file: string) =>
  fs.readFileSync(path.join(FIXTURES, file), "utf8").trim().split("\n");

describe("@common/interop scan", function () {
  let root: string;
  let traces: string;
  let state: string;
  let farEnds: string;
  let n = 0;

  const put = (
    text: string,
    name = `20261105T1200${String(n++).padStart(2, "0")}Z-c${n}.jsonl`
  ) => {
    fs.writeFileSync(
      path.join(traces, name),
      text.endsWith("\n") ? text : `${text}\n`
    );
    return name;
  };
  const copy = (fixture: string, name?: string) =>
    put(lines(fixture).join("\n"), name);
  // The declined call, answered with another status.
  const withStatus = (status: number) =>
    put(
      lines(DECLINED)
        .map((l) => {
          const r = JSON.parse(l);
          if (r.status === 603) r.status = status;
          return JSON.stringify(r);
        })
        .join("\n")
    );
  const scan = () => {
    const out: string[] = [];
    const err: string[] = [];
    const code = run(
      [
        "scan",
        "--traces",
        traces,
        "--far-ends",
        farEnds,
        "--state",
        state,
        "--since",
        "60m"
      ],
      { out: (l) => out.push(l), err: (l) => err.push(l) }
    );
    return { code, out, err };
  };
  const alerts = () =>
    fs.existsSync(path.join(state, "alerts.jsonl"))
      ? fs
          .readFileSync(path.join(state, "alerts.jsonl"), "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((l) => JSON.parse(l))
      : [];

  beforeEach(function () {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "interop-scan-"));
    traces = path.join(root, "traces");
    state = path.join(root, "state");
    fs.mkdirSync(traces);
    fs.mkdirSync(state);
    farEnds = path.join(root, "far-ends.json");
    fs.writeFileSync(farEnds, JSON.stringify(FAR_ENDS));
  });

  afterEach(function () {
    fs.chmodSync(state, 0o755);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("reports each new far end x case once, with the report and state", function () {
    copy(ANSWERED);
    copy(CANCELLED);
    copy(REGISTER);
    const first = scan();
    expect(first.code).to.equal(0);
    expect(first.out.filter((l) => l.startsWith("new "))).to.have.length(2);
    expect(first.out.at(-1)).to.equal(
      "scanned 3 files: 1 REGISTER, 2 calls classified, 2 new, 0 failing"
    );
    expect(alerts().map((a) => Object.keys(a).sort())).to.deep.equal([
      ["case", "far_end", "file", "findings", "kind", "time"],
      ["case", "far_end", "file", "findings", "kind", "time"]
    ]);
    const saved = JSON.parse(
      fs.readFileSync(path.join(state, "state.json"), "utf8")
    );
    expect(Object.keys(saved.found.whatsapp).sort()).to.deep.equal([
      "IOP-004",
      "IOP-005"
    ]);

    const again = scan();
    expect(again.out.filter((l) => l.startsWith("new "))).to.have.length(0);
    expect(alerts()).to.have.length(2);

    copy(ANSWERED);
    expect(scan().out.filter((l) => l.startsWith("new "))).to.have.length(0);
    expect(alerts()).to.have.length(2);
  });

  it("reads only files modified within --since", function () {
    const old = copy(ANSWERED);
    const past = new Date(Date.now() - 2 * 3_600_000);
    fs.utimesSync(path.join(traces, old), past, past);
    const out = scan().out;
    expect(out).to.deep.equal([
      "scanned 0 files: 0 REGISTER, 0 calls classified, 0 new, 0 failing"
    ]);
  });

  it("waits for a call to end, then reports it", function () {
    const all = lines(ANSWERED);
    const name = put(all.slice(0, -2).join("\n"));
    expect(scan().out.filter((l) => l.startsWith("new "))).to.have.length(0);
    fs.appendFileSync(path.join(traces, name), `${all.slice(-2).join("\n")}\n`);
    expect(scan().out.filter((l) => l.startsWith("new "))).to.deep.equal([
      `new whatsapp IOP-004 ${name} findings=sip-connect/request-uri-e164`
    ]);
  });

  it("hashes a recording name that isn't safe to show", function () {
    copy(ANSWERED, "20261105T120000Z-a|b<$(x)>.jsonl");
    scan();
    const [alert] = alerts();
    expect(alert.file).to.match(
      /^2026-10-25T18:59:49[0-9.:]*Z-[0-9a-f]{12}\.jsonl$/
    );
    expect(alert.findings).to.deep.equal(["sip-connect/request-uri-e164"]);
  });

  it("repeats an alert whose state didn't commit, and loses none", function () {
    copy(ANSWERED);
    fs.writeFileSync(path.join(state, "alerts.jsonl"), "");
    fs.chmodSync(state, 0o555);
    const failed = scan();
    expect(failed.code).to.equal(1);
    expect(failed.err.join("\n")).to.include("state.json");
    expect(alerts()).to.have.length(1);
    fs.chmodSync(state, 0o755);
    expect(scan().code).to.equal(0);
    expect(alerts()).to.have.length(2);
    const saved = JSON.parse(
      fs.readFileSync(path.join(state, "state.json"), "utf8")
    );
    expect(saved.found.whatsapp["IOP-004"]).to.exist;
  });

  it("alerts a failing far end once a day and counts each run", function () {
    const example = withStatus(488);
    expect(scan().out).to.include(
      `failure provider 488 to INVITE count=1 ${example}`
    );
    const [failure] = alerts().filter((a) => a.kind === "failure");
    expect(failure).to.include({
      far_end: "provider",
      signature: "488 to INVITE",
      count: 1,
      file: example
    });
    withStatus(488);
    const second = scan().out.find((l) => l.startsWith("failure "));
    expect(second).to.match(/^failure provider 488 to INVITE count=2 /);
    expect(alerts().filter((a) => a.kind === "failure")).to.have.length(1);
  });

  it("doesn't count ordinary unanswered calls as failures", function () {
    [404, 486, 603].forEach((s) => withStatus(s));
    expect(scan().out.filter((l) => l.startsWith("failure "))).to.deep.equal(
      []
    );
  });

  it("names a 2xx with no ACK and a BYE answered 481", function () {
    const all = lines(ANSWERED).map((l) => JSON.parse(l));
    put(
      all
        .filter((r) => r.method !== "ACK")
        .map((r) => JSON.stringify(r))
        .join("\n")
    );
    put(
      all
        .map((r) =>
          r.kind === "response" && r.method === "BYE"
            ? { ...r, status: 481 }
            : r
        )
        .map((r) => JSON.stringify(r))
        .join("\n")
    );
    const failures = scan().out.filter((l) => l.startsWith("failure "));
    expect(failures.map((l) => l.split(" count=")[0]).sort()).to.deep.equal([
      "failure whatsapp 481 to BYE",
      "failure whatsapp no ACK for 2xx"
    ]);
  });

  it("exits 1 on unreadable inputs and 2 on usage", function () {
    const out = { out: () => undefined, err: () => undefined };
    expect(
      run(
        [
          "scan",
          "--traces",
          path.join(root, "none"),
          "--far-ends",
          farEnds,
          "--state",
          state
        ],
        out
      )
    ).to.equal(1);
    expect(
      run(
        [
          "scan",
          "--traces",
          traces,
          "--far-ends",
          path.join(root, "none.json"),
          "--state",
          state
        ],
        out
      )
    ).to.equal(1);
    expect(run(["scan", "--traces", traces], out)).to.equal(2);
    expect(run(["scan", "--state", state], out)).to.equal(2);
    expect(
      run(
        [
          "scan",
          "--traces",
          traces,
          "--far-ends",
          farEnds,
          "--state",
          state,
          "--since",
          "soon"
        ],
        out
      )
    ).to.equal(2);
  });
});

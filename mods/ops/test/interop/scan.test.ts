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
import { getLogger } from "@fonoster/logger";
import { expect } from "chai";
import * as sinon from "sinon";
import { scan } from "../../src/interop/scan";

const FIXTURES = path.join(
  __dirname,
  "../../../common/test/interop/fixtures"
);
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
const DAY = 86_400_000;

describe("@ops/interop scan", function () {
  let root: string;
  let traces: string;
  let state: string;
  let n = 0;

  const put = (
    text: string,
    name = `20261105T1200${String(n).padStart(2, "0")}Z-c${n++}.jsonl`
  ) => {
    fs.writeFileSync(path.join(traces, name), `${text}\n`);
    return name;
  };
  const copy = (fixture: string, name?: string) =>
    put(lines(fixture).join("\n"), name);
  // The declined call, answered with another status.
  const failing = (status = 488, name?: string) =>
    put(
      lines(DECLINED)
        .map((l) => {
          const r = JSON.parse(l);
          if (r.status === 603) r.status = status;
          return JSON.stringify(r);
        })
        .join("\n"),
      name
    );
  const age = (name: string, ms: number) => {
    const at = new Date(Date.now() - ms);
    fs.utimesSync(path.join(traces, name), at, at);
    return at;
  };
  const run = (farEnds = FAR_ENDS) => scan({ traces, state, farEnds });
  const saved = () =>
    JSON.parse(fs.readFileSync(path.join(state, "state.json"), "utf8"));
  const seconds = (at: Date) => at.toISOString().replace(/\.\d{3}Z$/, "Z");

  beforeEach(function () {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "ops-scan-"));
    traces = path.join(root, "traces");
    state = path.join(root, "state");
    fs.mkdirSync(traces);
    fs.mkdirSync(state);
  });

  afterEach(function () {
    sinon.restore();
    fs.chmodSync(state, 0o755);
    fs.chmodSync(traces, 0o755);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("counts three failing calls over two passes", async function () {
    failing();
    failing();
    await run();
    expect(saved().failures.provider["488 to INVITE"].files).to.have.length(2);
    failing();
    await run();
    expect(saved().failures.provider["488 to INVITE"].files).to.have.length(3);
  });

  it("writes the contract's shape: the recording's time and day, the latest file", async function () {
    const first = failing();
    const last = failing();
    age(first, 60_000);
    const at = age(last, 1_000);
    const before = Date.now();
    await run();
    const s = saved();
    expect(Object.keys(s)).to.deep.equal(["lastRun", "found", "failures"]);
    expect(s.lastRun).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(Date.parse(s.lastRun)).to.be.at.most(before + 1000);
    expect(s.failures.provider["488 to INVITE"]).to.deep.equal({
      day: seconds(at).slice(0, 10),
      files: [first, last],
      file: last,
      time: seconds(at)
    });
    expect(fs.existsSync(path.join(state, "alerts.jsonl"))).to.equal(false);
  });

  it("counts a failing file read by two passes once", async function () {
    const name = failing();
    // Modified during the pass: its time is at or after that pass's start.
    const later = new Date(Date.now() + 10_000);
    fs.utimesSync(path.join(traces, name), later, later);
    await run();
    await run();
    expect(saved().failures.provider["488 to INVITE"].files).to.deep.equal([
      name
    ]);
  });

  it("resets a failure's entry when a later day arrives", async function () {
    const old = failing();
    age(old, DAY);
    await run();
    const today = failing();
    await run();
    const entry = saved().failures.provider["488 to INVITE"];
    expect(entry.files).to.deep.equal([today]);
    expect(entry.day).to.equal(new Date().toISOString().slice(0, 10));
  });

  it("sets evidence once and never changes it", async function () {
    const name = copy(ANSWERED);
    await run();
    const first = saved().found.whatsapp["IOP-004"];
    expect(first.file).to.equal(name);
    copy(ANSWERED);
    await run();
    expect(saved().found.whatsapp["IOP-004"]).to.deep.equal(first);
  });

  it("reads every file with no state, and doesn't open one older than lastRun", async function () {
    const old = copy(ANSWERED);
    age(old, 7 * DAY);
    await run();
    expect(saved().found.whatsapp["IOP-004"].file).to.equal(old);

    const read = sinon.spy(fs.promises, "readFile");
    await run();
    const opened = read
      .getCalls()
      .map((c) => String(c.args[0]))
      .filter((p) => p.startsWith(traces));
    expect(opened).to.deep.equal([]);
  });

  it("skips REGISTER-only files, and waits for a call to end", async function () {
    copy(REGISTER);
    const all = lines(ANSWERED);
    const name = put(all.slice(0, -2).join("\n"));
    await run();
    expect(saved().found).to.deep.equal({});
    fs.appendFileSync(path.join(traces, name), `${all.slice(-2).join("\n")}\n`);
    await run();
    expect(saved().found.whatsapp["IOP-004"].file).to.equal(name);
  });

  it("doesn't count ordinary unanswered calls as failures", async function () {
    [404, 486, 603].forEach((s) => failing(s));
    await run();
    expect(saved().failures).to.deep.equal({});
  });

  it("logs a file that throws by name, without its content, and goes on", async function () {
    const secret = "sip:+15551234567@carrier.example";
    const warn = sinon.stub(
      getLogger({ service: "ops", filePath: __filename }),
      "warn"
    );
    const bad = copy(ANSWERED);
    const good = copy(CANCELLED);
    age(bad, 60_000);
    // The classifier throws on the first (oldest) file only.
    let reads = 0;
    const farEnds = [
      {
        name: "whatsapp",
        get hosts() {
          if (reads++ === 0) throw new Error(`cannot classify ${secret}`);
          return ["wa.meta.vc", "wa-*"];
        }
      }
    ];
    await run(farEnds as typeof FAR_ENDS);
    const s = saved();
    expect(s.found.whatsapp["IOP-005"].file).to.equal(good);
    expect(s.found.whatsapp["IOP-004"]).to.equal(undefined);
    expect(s.lastRun).to.be.a("string");
    const logged = warn
      .getCalls()
      .map((c) => JSON.stringify(c.args))
      .join("\n");
    expect(logged).to.include(bad);
    expect(logged).to.not.include(secret);
  });

  describe("files it doesn't report", function () {
    it("a file deleted between listing and reading", async function () {
      const gone = copy(ANSWERED);
      const stay = failing();
      const readFile = fs.promises.readFile;
      sinon.stub(fs.promises, "readFile").callsFake(((
        p: string,
        ...rest: unknown[]
      ) => {
        if (String(p).endsWith(gone)) fs.rmSync(p);
        return (readFile as (...a: unknown[]) => unknown)(p, ...rest);
      }) as never);
      await run();
      expect(saved().found).to.deep.equal({});
      expect(saved().failures.provider["488 to INVITE"].file).to.equal(stay);
    });

    it("a symlink", async function () {
      const outside = path.join(root, "outside.jsonl");
      fs.writeFileSync(outside, `${lines(ANSWERED).join("\n")}\n`);
      fs.symlinkSync(outside, path.join(traces, "20261105T120000Z-link.jsonl"));
      await run();
      expect(saved().found).to.deep.equal({});
    });

    it("a name that fails SAFE_NAME", async function () {
      copy(ANSWERED, "20261105T120000Z-a|b<$(x)>.jsonl");
      await run();
      expect(saved().found).to.deep.equal({});
    });

    it("a file over 5 MiB", async function () {
      const name = copy(ANSWERED);
      fs.appendFileSync(path.join(traces, name), " ".repeat(5 * 1024 * 1024));
      await run();
      expect(saved().found).to.deep.equal({});
    });
  });

  it("rejects on traces it can't list and leaves state.json as it was", async function () {
    copy(ANSWERED);
    await run();
    const before = fs.readFileSync(path.join(state, "state.json"), "utf8");
    const missing = path.join(root, "none");
    let error: Error | undefined;
    await scan({ traces: missing, state, farEnds: FAR_ENDS }).catch((e) => {
      error = e;
    });
    expect(error).to.be.instanceOf(Error);
    expect(fs.readFileSync(path.join(state, "state.json"), "utf8")).to.equal(
      before
    );
  });

  it("rejects on a state folder it can't write and leaves state.json as it was", async function () {
    copy(ANSWERED);
    await run();
    const before = fs.readFileSync(path.join(state, "state.json"), "utf8");
    copy(CANCELLED);
    fs.chmodSync(state, 0o555);
    let error: Error | undefined;
    await run().catch((e) => {
      error = e;
    });
    expect(error).to.be.instanceOf(Error);
    expect(fs.readFileSync(path.join(state, "state.json"), "utf8")).to.equal(
      before
    );
  });

  it("rejects on a state.json it can't read", async function () {
    fs.writeFileSync(path.join(state, "state.json"), "not json");
    let error: Error | undefined;
    await run().catch((e) => {
      error = e;
    });
    expect(error).to.be.instanceOf(Error);
  });

  it("yields to the event loop after each file", async function () {
    const files = 5;
    for (let i = 0; i < files; i++) copy(ANSWERED);
    let ran = 0;
    const real = global.setImmediate;
    sinon.stub(global, "setImmediate").callsFake(((
      fn: (...a: unknown[]) => void,
      ...args: unknown[]
    ) =>
      real(() => {
        ran++;
        fn(...args);
      })) as never);
    await run();
    expect(ran).to.be.at.least(files);
  });
});

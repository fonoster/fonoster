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
  CallRecordWriter,
  ClickHouseAnalyticsSink,
  ClickHouseError,
  MemoryAnalyticsSink,
  RecordEntry,
  fsStores,
  loadRecord,
  rebuildAnalytics
} from "../src";
import { run } from "../src/cli";

// The ClickHouse analytics sink and the rebuild command (tasks 6.1, 6.2, LO-B6). Needs a
// throwaway ClickHouse: CLICKHOUSE_TEST_URL (HTTP interface), CLICKHOUSE_USER, CLICKHOUSE_PASSWORD.

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const KEY = {
  kid: "k1",
  privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString()
};

function call(callRef: string, turns: number): RecordEntry[] {
  let t = Date.parse("2026-10-15T10:00:00Z");
  const at = (ms = 1000) => (t += ms);
  const out: RecordEntry[] = [
    {
      at: at(),
      source: "event",
      message: {
        type: "call.started",
        direction: "inbound",
        appRef: "ivr",
        workspaceRef: "ws-1",
        from: "+15550001111",
        to: "+15550002222"
      }
    },
    {
      at: at(),
      source: "appbridge",
      message: { type: "session.start", callRef, appRef: "ivr" }
    }
  ];
  for (let i = 0; i < turns; i++)
    out.push({
      at: at(),
      source: "appbridge",
      message: { type: "turn.ended", text: `question ${i}` }
    });
  out.push({
    at: at(30_000),
    source: "event",
    message: { type: "call.ended", reason: "caller_hangup" }
  });
  return out;
}

describe("@callrecord ClickHouse analytics", function () {
  this.timeout(30000);
  const url = process.env.CLICKHOUSE_TEST_URL;
  let dir: string;
  let sink: ClickHouseAnalyticsSink;
  const database = `fonoster_test_${Date.now()}`;

  before(function () {
    if (!url) this.skip();
  });

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "callrecord-ch-"));
    sink = new ClickHouseAnalyticsSink({
      url: url!,
      database,
      user: process.env.CLICKHOUSE_USER,
      password: process.env.CLICKHOUSE_PASSWORD
    });
  });

  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  after(async function () {
    if (url) await sink.query(`DROP DATABASE IF EXISTS ${database}`);
  });

  async function sealed(calls: [string, number][]) {
    const { working, store } = fsStores(dir);
    const writer = new CallRecordWriter({
      working,
      store,
      key: KEY,
      region: "us-east"
    });
    for (const [ref, turns] of calls) {
      for (const e of call(ref, turns)) writer.append(ref, e);
      writer.close(ref);
    }
    await writer.flush();
    return { store, writer };
  }

  it("loads a sealed record's metrics, and loading again replaces the row", async function () {
    const { store } = await sealed([["c1", 2]]);
    expect(await loadRecord(store, sink, "c1")).to.equal(true);
    expect(await loadRecord(store, sink, "c1")).to.equal(true);
    const rows = await sink.rows();
    expect(rows).to.have.length(1);
    expect(rows[0]).to.deep.include({
      callRef: "c1",
      workspaceRef: "ws-1",
      appRef: "ivr",
      status: "completed",
      callerTurns: 2,
      durationSeconds: 32,
      hasRecording: false
    });
  });

  it("rebuilds from records with the same rows as the in-memory sink, and drops erased calls", async function () {
    const { store, writer } = await sealed([
      ["a", 1],
      ["b", 3],
      ["gone", 1]
    ]);
    await loadRecord(store, sink, "gone");
    await writer.erase("gone", { reason: "erasure request", actor: "u1" });
    // Loading the erased record removes its row.
    expect(await loadRecord(store, sink, "gone")).to.equal(false);
    expect((await sink.rows()).map((r) => r.callRef)).to.not.include("gone");

    const memory = new MemoryAnalyticsSink();
    await rebuildAnalytics(store, memory);
    const out: string[] = [];
    const code = await run(
      [
        "analytics",
        "rebuild",
        "--store-dir",
        path.join(dir, "sealed"),
        "--clickhouse-url",
        url!,
        "--clickhouse-database",
        database
      ],
      (s) => out.push(s),
      {
        CLICKHOUSE_USER: process.env.CLICKHOUSE_USER,
        CLICKHOUSE_PASSWORD: process.env.CLICKHOUSE_PASSWORD
      }
    );
    expect(out).to.deep.equal([
      `rebuilt ${database}.call_metrics from 2 records`
    ]);
    expect(code).to.equal(0);
    expect(await sink.rows()).to.deep.equal(
      [...memory.rows.values()].sort((x, y) =>
        x.callRef.localeCompare(y.callRef)
      )
    );
  });

  it("reports ClickHouse errors and refuses unsafe names", async function () {
    expect(
      () => new ClickHouseAnalyticsSink({ url: url!, table: "x; DROP" })
    ).to.throw(ClickHouseError);
    const bad = new ClickHouseAnalyticsSink({
      url: url!,
      database,
      user: "nobody",
      password: "wrong"
    });
    const err = await bad.ensureSchema().catch((e) => e);
    expect(err).to.be.instanceOf(ClickHouseError);
    expect(err.message).to.not.contain("wrong");
  });
});

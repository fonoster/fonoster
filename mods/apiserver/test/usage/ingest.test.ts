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
import { Usage } from "@fonoster/common";
import { expect } from "chai";
import { createIndexRecord } from "../../src/records/createIndexRecord";
import { RecordIndexEntry, RecordsDb } from "../../src/records/types";
import { ingestUsageIn } from "../../src/usage/ingestUsage";
import { rebuildUsageDaily } from "../../src/usage/rebuildUsage";
import { snapshotStorage } from "../../src/usage/snapshotStorage";
import { UsageDirectory } from "../../src/usage/types";
import { createTestDb, TestDb } from "../../../common/test/persistence/testDb";

// The usage ledger on a real Postgres (PERSISTENCE_TEST_DATABASE_URL); skipped without one.

const WS = "WOusage0000000000000000000000000";
const WS2 = "WOusage2000000000000000000000000";
const OWNER = "user-owner";
const directory: UsageDirectory = {
  workspace: async (accessKeyId) =>
    accessKeyId === WS || accessKeyId === WS2 ? { ownerRef: OWNER } : undefined
};

const event = (
  line: Usage.UsageLine,
  overrides: Record<string, unknown> = {}
) => ({
  ...line,
  id: Usage.usageId("call-1", line),
  workspaceRef: WS,
  callRef: "call-1",
  region: "default",
  regionKind: "public",
  origin: "call",
  occurredAt: "2026-10-20T12:00:00.000Z",
  ...overrides
});

const entry = (
  overrides: Partial<RecordIndexEntry> = {}
): RecordIndexEntry => ({
  callRef: "call-9",
  workspaceRef: WS,
  appRef: "app-1",
  from: "+15550001",
  to: "+15550002",
  direction: "inbound",
  status: "completed",
  endReason: "hangup",
  failureReason: null,
  sipStatus: 200,
  startedAt: "2026-10-20T11:58:00.000Z",
  endedAt: "2026-10-20T12:00:05.000Z",
  durationSeconds: 125,
  region: "default",
  location: "file:///tmp/records",
  version: 1,
  size: 2048,
  parts: [],
  usage: [
    { meter: "call.seconds", quantity: 65 },
    {
      meter: "stt.seconds",
      quantity: 60,
      provider: "deepgram",
      keySource: "workspace"
    },
    {
      meter: "tts.characters",
      quantity: 420,
      provider: "elevenlabs",
      keySource: "platform"
    }
  ],
  ...overrides
});

describe("@apiserver/usage ledger", function () {
  this.timeout(120_000);
  let db: TestDb | undefined;

  before(async function () {
    db = await createTestDb();
    if (!db) return this.skip();
  });

  after(async () => db?.drop());

  beforeEach(async () => {
    await db?.prisma.$executeRawUnsafe(
      "TRUNCATE usage_events, usage_daily, call_records"
    );
  });

  const daily = async () =>
    (
      await db!.prisma.usageDaily.findMany({
        orderBy: [{ meter: "asc" }, { keySource: "asc" }]
      })
    ).map((r: Record<string, unknown>) => ({
      meter: r.meter,
      keySource: r.keySource,
      origin: r.origin,
      regionKind: r.regionKind,
      ownerRef: r.ownerRef,
      quantity: Number(r.quantity)
    }));

  it("stores each event once and counts it once in the day's total", async () => {
    const events = [
      event({ meter: "call.seconds", quantity: 65 }),
      event({
        meter: "stt.seconds",
        quantity: 60,
        provider: "deepgram",
        keySource: "workspace"
      })
    ];
    const first = await db!.prisma.$transaction((tx: never) =>
      ingestUsageIn(tx, directory, events)
    );
    const again = await db!.prisma.$transaction((tx: never) =>
      ingestUsageIn(tx, directory, events)
    );
    expect([first, again]).to.deep.equal([2, 0]);
    expect(await db!.prisma.usageEvent.count()).to.equal(2);
    expect(await daily()).to.deep.equal([
      {
        meter: "call.seconds",
        keySource: "",
        origin: "call",
        regionKind: "public",
        ownerRef: OWNER,
        quantity: 65
      },
      {
        meter: "stt.seconds",
        keySource: "workspace",
        origin: "call",
        regionKind: "public",
        ownerRef: OWNER,
        quantity: 60
      }
    ]);
  });

  it("adds different calls of the same day and keeps key sources apart", async () => {
    const line = {
      meter: "tts.characters" as const,
      provider: "elevenlabs",
      keySource: "platform" as const
    };
    await db!.prisma.$transaction((tx: never) =>
      ingestUsageIn(tx, directory, [
        event({ ...line, quantity: 100 }),
        event(
          { ...line, quantity: 50 },
          { id: Usage.usageId("call-2", line), callRef: "call-2" }
        ),
        event(
          { ...line, keySource: "workspace", quantity: 7 },
          {
            id: Usage.usageId("call-2", { ...line, keySource: "workspace" }),
            callRef: "call-2"
          }
        )
      ])
    );
    expect((await daily()).map((r) => [r.keySource, r.quantity])).to.deep.equal(
      [
        ["platform", 150],
        ["workspace", 7]
      ]
    );
  });

  it("rejects an undeclared meter and keeps the rest", async () => {
    const stored = await db!.prisma.$transaction((tx: never) =>
      ingestUsageIn(tx, directory, [
        {
          ...event({ meter: "call.seconds", quantity: 1 }),
          meter: "video.seconds"
        },
        event({ meter: "call.seconds", quantity: 3 })
      ])
    );
    expect(stored).to.equal(1);
    expect((await daily()).map((r) => r.meter)).to.deep.equal(["call.seconds"]);
  });

  it("keeps the latest reading of a snapshot meter", async () => {
    const line = { meter: "storage.bytes" as const };
    await db!.prisma.$transaction((tx: never) =>
      ingestUsageIn(tx, directory, [
        event(
          { ...line, quantity: 1000 },
          { id: Usage.usageId(`${WS}|2026-10-20|a`, line), callRef: undefined }
        ),
        event(
          { ...line, quantity: 1500 },
          { id: Usage.usageId(`${WS}|2026-10-20|b`, line), callRef: undefined }
        )
      ])
    );
    expect((await daily()).map((r) => r.quantity)).to.deep.equal([1500]);
  });

  it("stores a sealed call's usage with its index row, once per replay", async () => {
    const index = createIndexRecord(db!.prisma as RecordsDb, {
      directory: () => directory
    });
    await index(entry());
    await index(entry());
    expect(await db!.prisma.callRecord.count()).to.equal(1);
    const events = await db!.prisma.usageEvent.findMany({
      orderBy: { meter: "asc" }
    });
    expect(
      events.map((e: Record<string, unknown>) => [
        e.meter,
        Number(e.quantity),
        e.callRef,
        e.appRef,
        e.origin
      ])
    ).to.deep.equal([
      ["call.seconds", 65, "call-9", "app-1", "call"],
      ["stt.seconds", 60, "call-9", "app-1", "call"],
      ["tts.characters", 420, "call-9", "app-1", "call"]
    ]);
    expect((await daily()).map((r) => r.quantity)).to.deep.equal([65, 60, 420]);
  });

  it("indexes entries without usage as before", async () => {
    const index = createIndexRecord(db!.prisma as RecordsDb, {
      directory: () => directory
    });
    await index(entry({ usage: undefined }));
    expect(await db!.prisma.callRecord.count()).to.equal(1);
    expect(await db!.prisma.usageEvent.count()).to.equal(0);
  });

  it("marks a private region's usage and a browser test's origin", async () => {
    const index = createIndexRecord(db!.prisma as RecordsDb, {
      directory: () => directory
    });
    await index(
      entry({
        workspaceRef: WS2,
        region: "rg_abcdefghijklmnop",
        origin: "browser_test",
        usage: [{ meter: "call.seconds", quantity: 30 }]
      })
    );
    expect(await daily()).to.deep.equal([
      {
        meter: "call.seconds",
        keySource: "",
        origin: "browser_test",
        regionKind: "private",
        ownerRef: OWNER,
        quantity: 30
      }
    ]);
  });

  it("rebuilds daily totals that equal the ones built while ingesting", async () => {
    const stt = {
      meter: "stt.seconds" as const,
      provider: "deepgram",
      keySource: "platform" as const
    };
    const storage = { meter: "storage.bytes" as const };
    const at = (call: string, day: string, line: Usage.UsageLine) =>
      event(line, {
        id: Usage.usageId(`${call}|${day}`, line),
        callRef: call,
        occurredAt: `${day}T10:00:00.000Z`
      });
    await db!.prisma.$transaction((tx: never) =>
      ingestUsageIn(tx, directory, [
        at("c1", "2026-10-18", { ...stt, quantity: 30 }),
        at("c2", "2026-10-18", { ...stt, quantity: 12 }),
        at("c3", "2026-10-19", { ...stt, quantity: 7 }),
        at("s1", "2026-10-19", { ...storage, quantity: 500 }),
        {
          ...at("s2", "2026-10-19", { ...storage, quantity: 800 }),
          occurredAt: "2026-10-19T23:00:00.000Z"
        }
      ])
    );
    const before = await daily();
    await db!.prisma.$executeRawUnsafe(
      "UPDATE usage_daily SET quantity = 999999"
    );
    await db!.prisma.$executeRawUnsafe(
      "INSERT INTO usage_daily (owner_ref, workspace_ref, day, meter, origin, region_kind, quantity) VALUES ('x', 'y', '2026-10-19', 'call.seconds', 'call', 'public', 5)"
    );
    expect(
      await rebuildUsageDaily(db!.prisma, "2026-10-18", "2026-10-19")
    ).to.equal(3);
    expect(await daily()).to.deep.equal(before);
    expect(before.map((r) => [r.meter, r.quantity])).to.deep.equal(
      [
        ["stt.seconds", 42],
        ["stt.seconds", 7],
        ["storage.bytes", 800]
      ].sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    );
  });

  it("records storage per workspace for a completed day, once", async () => {
    const index = createIndexRecord(db!.prisma as RecordsDb, {
      directory: () => directory
    });
    await index(
      entry({
        callRef: "s-1",
        size: 1000,
        usage: undefined,
        startedAt: "2026-10-19T10:00:00.000Z"
      })
    );
    await index(
      entry({
        callRef: "s-2",
        size: 500,
        usage: undefined,
        startedAt: "2026-10-19T11:00:00.000Z"
      })
    );
    await index(
      entry({
        callRef: "s-3",
        workspaceRef: WS2,
        size: 300,
        usage: undefined,
        startedAt: "2026-10-19T12:00:00.000Z"
      })
    );
    await index(
      entry({
        callRef: "s-4",
        size: 9999,
        usage: undefined,
        startedAt: "2026-10-20T01:00:00.000Z"
      })
    );
    expect(await snapshotStorage(db!.prisma, directory, "2026-10-19")).to.equal(
      2
    );
    expect(await snapshotStorage(db!.prisma, directory, "2026-10-19")).to.equal(
      0
    );
    const rows = await db!.prisma.usageDaily.findMany({
      orderBy: { quantity: "desc" }
    });
    expect(
      rows.map((r: Record<string, unknown>) => [
        r.workspaceRef,
        r.meter,
        Number(r.quantity),
        r.origin
      ])
    ).to.deep.equal([
      [WS, "storage.bytes", 1500, "api"],
      [WS2, "storage.bytes", 300, "api"]
    ]);
  });
});

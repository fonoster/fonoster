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
import {
  CallRecordWriter,
  RecordEntry,
  RecordIndexEntry,
  fsStores
} from "@fonoster/callrecord";
import { expect } from "chai";
import {
  MaintenanceClient,
  WORKSPACE_ERASURE_GRACE_DAYS,
  createIndexRecord,
  runWorkspaceErasure
} from "../../src/records";
import { WorkspaceDirectory, WorkspaceInfo } from "../../src/regions/types";
import { memoryRecordsDb } from "./memoryRecordsDb";

// A deleted workspace's call records are erased 30 days after the delete (#1318), only when
// Identity has a deletion record for it and no workspace with its key exists again. Real
// CallRecordWriters on fsStores, so the files are checked on disk.

const ec = generateKeyPairSync("ec", { namedCurve: "P-256" });
const DAY = 24 * 3600 * 1000;
const NOW = new Date("2026-12-01T00:00:00Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY);
const PRIVATE = "rg_abcdefgh";

let t = Date.parse("2026-10-01T10:00:00Z");
const at = () => (t += 1000);

function call(callRef: string, workspaceRef: string): RecordEntry[] {
  const parties = { from: "+15550001111", to: "+15550002222" };
  return [
    {
      at: at(),
      source: "event",
      message: {
        type: "call.started",
        direction: "inbound",
        appRef: "ivr",
        workspaceRef,
        ...parties
      }
    },
    {
      at: at(),
      source: "appbridge",
      message: { type: "session.start", callRef, appRef: "ivr", ...parties }
    },
    {
      at: at(),
      source: "event",
      message: { type: "recording.started", policy: "on" }
    },
    {
      at: at(),
      source: "appbridge",
      message: { type: "turn.ended", text: "Hello" }
    },
    {
      at: at(),
      source: "event",
      message: { type: "call.ended", reason: "caller_hangup" }
    }
  ];
}

/** Every file a call has in a store directory, relative to it. */
function files(dir: string, callRef: string): string[] {
  const root = path.join(dir, "sealed", callRef);
  if (!fs.existsSync(root)) return [];
  return (fs.readdirSync(root, { recursive: true }) as string[]).filter((f) =>
    fs.statSync(path.join(root, f)).isFile()
  );
}

/** Two regions (one public, one private) writing records into one index. */
async function fixture() {
  const mem = memoryRecordsDb();
  const index = createIndexRecord(mem.db);
  const pending: Promise<unknown>[] = [];
  const dirs: Record<string, string> = {};
  const writers: Record<string, CallRecordWriter> = {};
  for (const region of ["us-east", PRIVATE]) {
    dirs[region] = fs.mkdtempSync(path.join(os.tmpdir(), "ws-erasure-"));
    writers[region] = new CallRecordWriter({
      ...fsStores(dirs[region]),
      key: {
        kid: "k1",
        privateKeyPem: ec.privateKey
          .export({ type: "pkcs8", format: "pem" })
          .toString()
      },
      region,
      onSealed: (e: RecordIndexEntry) => pending.push(index(e))
    });
  }
  const requests: { region: string; callRef: string; actor: string }[] = [];
  let failNext: string | undefined;
  // What the region's AppBridge replicas do for maintenance requests (appbridge record/maintenance.ts).
  const maintenance: MaintenanceClient = async (region, req) => {
    requests.push({ region, callRef: req.callRef, actor: req.actor });
    if (failNext === req.callRef) {
      failNext = undefined;
      return { type: "error", code: "timeout", message: "no answer" };
    }
    const r = await writers[region].erase(req.callRef, req);
    return { type: "ack", version: r.version, audit: r.audit };
  };
  const seal = async (
    callRef: string,
    workspaceRef: string,
    region = "us-east"
  ) => {
    const writer = writers[region];
    const recDir = writer.recordingDir(callRef);
    fs.mkdirSync(recDir, { recursive: true });
    fs.writeFileSync(
      path.join(recDir, "meta.json"),
      JSON.stringify({ startedAt: t, rate: 16000, sides: ["caller", "agent"] })
    );
    fs.writeFileSync(path.join(recDir, "caller.pcm"), Buffer.alloc(3200, 1));
    fs.writeFileSync(path.join(recDir, "agent.pcm"), Buffer.alloc(3200, 2));
    for (const e of call(callRef, workspaceRef)) writer.append(callRef, e);
    writer.close(callRef);
    await writer.flush();
    await Promise.all(pending);
  };
  const filesOf = (callRef: string) =>
    files(dirs[mem.records.get(callRef)!.region], callRef);
  return {
    mem,
    maintenance,
    requests,
    seal,
    filesOf,
    failOnce: (callRef: string) => (failNext = callRef),
    cleanup: () =>
      Object.values(dirs).forEach((d) =>
        fs.rmSync(d, { recursive: true, force: true })
      )
  };
}

const info = (accessKeyId: string): WorkspaceInfo => ({
  ref: `ref-${accessKeyId}`,
  accessKeyId,
  name: accessKeyId,
  ownerRef: "owner",
  region: "default"
});

/** Identity's directory: deletion records and the workspaces that exist. */
function directory(
  deletions: Record<string, Date>,
  existing: string[] = [],
  fail: { deleted?: boolean; workspace?: boolean } = {}
): WorkspaceDirectory {
  return {
    workspace: async (key) => {
      if (fail.workspace) throw new Error("identity db down");
      return existing.includes(key) ? info(key) : undefined;
    },
    inRegion: async () => [],
    deleted: async () => {
      if (fail.deleted) throw new Error("identity db down");
      return Object.entries(deletions).map(([accessKeyId, deletedAt]) => ({
        accessKeyId,
        deletedAt
      }));
    },
    isDeleted: async (key) => key in deletions
  };
}

describe("@apiserver[records] erasing a deleted workspace's records (#1318)", function () {
  this.timeout(20000);
  let f: Awaited<ReturnType<typeof fixture>>;

  beforeEach(async () => {
    f = await fixture();
  });
  afterEach(() => f.cleanup());

  it("has a 30-day grace", function () {
    expect(WORKSPACE_ERASURE_GRACE_DAYS).to.equal(30);
  });

  it("erases every public-region record of a workspace deleted 31 days ago: files, numbers and an audit entry", async function () {
    await f.seal("old-1", "WOold");
    await f.seal("old-2", "WOold");
    await f.seal("other", "WOlive");
    expect(f.filesOf("old-1")).to.include.members([
      "parts/recording.wav",
      "parts/messages.ndjson"
    ]);
    const done = await runWorkspaceErasure(
      f.mem.db,
      f.maintenance,
      directory({ WOold: daysAgo(31) }, ["WOlive"]),
      NOW
    );
    expect(done.sort()).to.deep.equal(["old-1", "old-2"]);
    for (const callRef of ["old-1", "old-2"]) {
      const row = f.mem.records.get(callRef)!;
      expect(row).to.deep.include({
        status: "erased",
        fromNumber: null,
        toNumber: null,
        parts: []
      });
      expect(row.erasedAt).to.be.instanceOf(Date);
      // Only the signed tombstone is left: no recording, transcript or earlier version.
      const left = f.filesOf(callRef);
      expect(left.some((p) => /^parts\//.test(p))).to.equal(false);
      expect(
        left.every((p) => p === "current" || p.startsWith(`v${row.version}`))
      ).to.equal(true);
      expect(f.mem.audits.find((a) => a.callRef === callRef)).to.deep.include({
        action: "erase",
        part: "all",
        reason: "workspace deleted",
        actor: "system:workspace-deleted",
        accessKeyId: "WOold"
      });
    }
    expect(f.mem.records.get("other")!.erasedAt).to.equal(null);
  });

  it("leaves a workspace deleted 29 days ago, and a live one, untouched", async function () {
    await f.seal("recent", "WOrecent");
    await f.seal("live", "WOlive");
    const before = f.filesOf("recent");
    const done = await runWorkspaceErasure(
      f.mem.db,
      f.maintenance,
      directory({ WOrecent: daysAgo(29) }, ["WOlive"]),
      NOW
    );
    expect(done).to.deep.equal([]);
    expect(f.requests).to.deep.equal([]);
    expect(f.mem.records.get("recent")!.erasedAt).to.equal(null);
    expect(f.mem.records.get("live")!.erasedAt).to.equal(null);
    expect(f.filesOf("recent")).to.deep.equal(before);
  });

  it("never erases a workspace that is only missing from the directory", async function () {
    await f.seal("unknown", "WOunknown");
    await runWorkspaceErasure(f.mem.db, f.maintenance, directory({}), NOW);
    expect(f.requests).to.deep.equal([]);
    expect(f.mem.records.get("unknown")!.erasedAt).to.equal(null);
  });

  it("keeps the records when a workspace with the key exists again (an operator restore)", async function () {
    await f.seal("restored", "WOrestored");
    await runWorkspaceErasure(
      f.mem.db,
      f.maintenance,
      directory({ WOrestored: daysAgo(40) }, ["WOrestored"]),
      NOW
    );
    expect(f.requests).to.deep.equal([]);
    expect(f.mem.records.get("restored")!.erasedAt).to.equal(null);
  });

  it("requests nothing and doesn't throw when the directory is unattached or fails", async function () {
    await f.seal("old-1", "WOold");
    const deletions = { WOold: daysAgo(31) };
    for (const d of [
      undefined,
      directory(deletions, [], { deleted: true }),
      directory(deletions, [], { workspace: true })
    ])
      expect(
        await runWorkspaceErasure(f.mem.db, f.maintenance, d, NOW)
      ).to.deep.equal([]);
    expect(f.requests).to.deep.equal([]);
    expect(f.mem.records.get("old-1")!.erasedAt).to.equal(null);
  });

  it("leaves records in a private region", async function () {
    await f.seal("private", "WOold", PRIVATE);
    await f.seal("public", "WOold");
    const done = await runWorkspaceErasure(
      f.mem.db,
      f.maintenance,
      directory({ WOold: daysAgo(31) }),
      NOW
    );
    expect(done).to.deep.equal(["public"]);
    expect(f.requests.map((r) => r.region)).to.deep.equal(["us-east"]);
    expect(f.mem.records.get("private")!.erasedAt).to.equal(null);
  });

  it("goes on past a failed record and erases it on the next run", async function () {
    await f.seal("old-1", "WOold");
    await f.seal("old-2", "WOold");
    f.failOnce("old-1");
    const d = directory({ WOold: daysAgo(31) });
    expect(
      await runWorkspaceErasure(f.mem.db, f.maintenance, d, NOW)
    ).to.deep.equal(["old-2"]);
    expect(f.mem.records.get("old-1")!.erasedAt).to.equal(null);
    expect(
      await runWorkspaceErasure(f.mem.db, f.maintenance, d, NOW)
    ).to.deep.equal(["old-1"]);
    expect(f.mem.records.get("old-1")!.status).to.equal("erased");
  });

  it("erases a record sealed after the grace ended on a later run", async function () {
    await f.seal("old-1", "WOold");
    const d = directory({ WOold: daysAgo(31) });
    await runWorkspaceErasure(f.mem.db, f.maintenance, d, NOW);
    // A refused call's minimal record, sealed after the sweep had erased the rest.
    await f.seal("late", "WOold");
    expect(f.mem.records.get("late")!.erasedAt).to.equal(null);
    expect(
      await runWorkspaceErasure(f.mem.db, f.maintenance, d, NOW)
    ).to.deep.equal(["late"]);
    expect(f.mem.records.get("late")!.status).to.equal("erased");
    expect(f.filesOf("late").some((p) => /^parts\//.test(p))).to.equal(false);
  });
});

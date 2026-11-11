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
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import {
  MaintenanceClient,
  WORKSPACE_ERASURE_GRACE_DAYS,
  WorkspaceSipResources,
  createIndexRecord,
  createWorkspaceSipResources,
  runWorkspaceErasure
} from "../../src/records";
import { WorkspaceDirectory, WorkspaceInfo } from "../../src/regions/types";
import { memoryRecordsDb } from "./memoryRecordsDb";

// A deleted workspace's call records are erased 30 days after the delete (#1318), only when
// Identity has a deletion record for it and no workspace with its key exists again. Real
// CallRecordWriters on fsStores, so the files are checked on disk. Its applications, secrets,
// webhooks, numbers and trunks don't wait: they are deleted on the first run after the delete (#1321).

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

/** Routr's numbers and trunks by workspace. Every delete lands in `log`, in order. */
function memorySip(log: string[]) {
  const numbers: Record<string, string[]> = {};
  const trunks: Record<string, string[]> = {};
  let failNext: string | undefined;
  const remove =
    (kind: string, byWorkspace: Record<string, string[]>) =>
    async (ref: string) => {
      if (failNext === ref) {
        failNext = undefined;
        throw new Error("routr unavailable");
      }
      for (const key of Object.keys(byWorkspace))
        byWorkspace[key] = byWorkspace[key].filter((r) => r !== ref);
      log.push(`${kind}:${ref}`);
    };
  const sip: WorkspaceSipResources = {
    numbers: async (key) => [...(numbers[key] ?? [])],
    trunks: async (key) => [...(trunks[key] ?? [])],
    deleteNumber: remove("deleteNumber", numbers),
    deleteTrunk: remove("deleteTrunk", trunks)
  };
  return { sip, numbers, trunks, failOnce: (ref: string) => (failNext = ref) };
}

/** Two regions (one public, one private) writing records into one index, and Routr's resources. */
async function fixture() {
  const mem = memoryRecordsDb();
  const routr = memorySip(mem.deletes);
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
    routr,
    sip: routr.sip,
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
      NOW,
      f.sip
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
      NOW,
      f.sip
    );
    expect(done).to.deep.equal([]);
    expect(f.requests).to.deep.equal([]);
    expect(f.mem.records.get("recent")!.erasedAt).to.equal(null);
    expect(f.mem.records.get("live")!.erasedAt).to.equal(null);
    expect(f.filesOf("recent")).to.deep.equal(before);
  });

  it("never erases a workspace that is only missing from the directory", async function () {
    await f.seal("unknown", "WOunknown");
    await runWorkspaceErasure(
      f.mem.db,
      f.maintenance,
      directory({}),
      NOW,
      f.sip
    );
    expect(f.requests).to.deep.equal([]);
    expect(f.mem.records.get("unknown")!.erasedAt).to.equal(null);
  });

  it("keeps the records when a workspace with the key exists again (an operator restore)", async function () {
    await f.seal("restored", "WOrestored");
    await runWorkspaceErasure(
      f.mem.db,
      f.maintenance,
      directory({ WOrestored: daysAgo(40) }, ["WOrestored"]),
      NOW,
      f.sip
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
        await runWorkspaceErasure(f.mem.db, f.maintenance, d, NOW, f.sip)
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
      NOW,
      f.sip
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
      await runWorkspaceErasure(f.mem.db, f.maintenance, d, NOW, f.sip)
    ).to.deep.equal(["old-2"]);
    expect(f.mem.records.get("old-1")!.erasedAt).to.equal(null);
    expect(
      await runWorkspaceErasure(f.mem.db, f.maintenance, d, NOW, f.sip)
    ).to.deep.equal(["old-1"]);
    expect(f.mem.records.get("old-1")!.status).to.equal("erased");
  });

  it("erases a record sealed after the grace ended on a later run", async function () {
    await f.seal("old-1", "WOold");
    const d = directory({ WOold: daysAgo(31) });
    await runWorkspaceErasure(f.mem.db, f.maintenance, d, NOW, f.sip);
    // A refused call's minimal record, sealed after the sweep had erased the rest.
    await f.seal("late", "WOold");
    expect(f.mem.records.get("late")!.erasedAt).to.equal(null);
    expect(
      await runWorkspaceErasure(f.mem.db, f.maintenance, d, NOW, f.sip)
    ).to.deep.equal(["late"]);
    expect(f.mem.records.get("late")!.status).to.equal("erased");
    expect(f.filesOf("late").some((p) => /^parts\//.test(p))).to.equal(false);
  });
});

type Fixture = Awaited<ReturnType<typeof fixture>>;

const SERVICES = ["tts_services", "stt_services", "intelligence_services"];

/**
 * What a workspace keeps outside its call records: an application with its vendor services, a
 * secret bound as its OpenAI key, a webhook with a delivery (and a delivery of an endpoint the
 * owner deleted earlier), two numbers and a trunk.
 */
function seed(f: Fixture, key: string) {
  const { mem, routr } = f;
  mem.applications.push({ ref: `app-${key}`, accessKeyId: key });
  for (const table of SERVICES)
    mem.appServices.push({ table, applicationRef: `app-${key}` });
  mem.secrets.push({ ref: `sec-${key}`, accessKeyId: key });
  mem.providerKeys.push({
    accessKeyId: key,
    providerId: "openai",
    secretRef: `sec-${key}`
  });
  mem.endpoints.push({ ref: `we-${key}`, accessKeyId: key });
  mem.deliveries.push(
    { ref: `wd-${key}-1`, accessKeyId: key, endpointRef: `we-${key}` },
    { ref: `wd-${key}-2`, accessKeyId: key, endpointRef: "we-deleted-earlier" }
  );
  routr.numbers[key] = [`nb-${key}-1`, `nb-${key}-2`];
  routr.trunks[key] = [`tk-${key}`];
}

/** How much of a workspace's data is left, by kind. */
function left(f: Fixture, key: string) {
  const { mem, routr } = f;
  const own = (rows: { accessKeyId: string }[]) =>
    rows.filter((r) => r.accessKeyId === key).length;
  return {
    applications: own(mem.applications),
    services: mem.appServices.filter((s) => s.applicationRef === `app-${key}`)
      .length,
    secrets: own(mem.secrets),
    providerKeys: own(mem.providerKeys),
    endpoints: own(mem.endpoints),
    deliveries: own(mem.deliveries),
    numbers: routr.numbers[key].length,
    trunks: routr.trunks[key].length
  };
}

const ALL = {
  applications: 1,
  services: 3,
  secrets: 1,
  providerKeys: 1,
  endpoints: 1,
  deliveries: 2,
  numbers: 2,
  trunks: 1
};
const NONE = {
  applications: 0,
  services: 0,
  secrets: 0,
  providerKeys: 0,
  endpoints: 0,
  deliveries: 0,
  numbers: 0,
  trunks: 0
};
const minutesAgo = (minutes: number) =>
  new Date(NOW.getTime() - minutes * 60_000);

describe("@apiserver[records] deleting a deleted workspace's apps, secrets, webhooks, numbers and trunks (#1321)", function () {
  this.timeout(20000);
  let f: Fixture;
  const sweep = (
    d: WorkspaceDirectory | undefined,
    maintenance = f.maintenance
  ) => runWorkspaceErasure(f.mem.db, maintenance, d, NOW, f.sip);

  beforeEach(async () => {
    f = await fixture();
    // WOa is the deleted workspace; WOlive has the same provider id, its own endpoint, numbers and trunk.
    seed(f, "WOa");
    seed(f, "WOlive");
  });
  afterEach(() => f.cleanup());

  it("deletes them on the first run after the delete, numbers before trunks, and leaves a live workspace's", async function () {
    const done = await sweep(directory({ WOa: minutesAgo(1) }, ["WOlive"]));
    expect(left(f, "WOa")).to.deep.equal(NONE);
    expect(f.mem.deletes).to.deep.equal([
      "application:WOa",
      "webhookEndpoint:WOa",
      "webhookDelivery:WOa",
      "secret:WOa",
      "deleteNumber:nb-WOa-1",
      "deleteNumber:nb-WOa-2",
      "deleteTrunk:tk-WOa"
    ]);
    expect(left(f, "WOlive")).to.deep.equal(ALL);
    // It has no call records, and nothing was asked of a region.
    expect(done).to.deep.equal([]);
    expect(f.requests).to.deep.equal([]);
  });

  it("doesn't wait for the 30-day grace its call records get", async function () {
    await f.seal("recent", "WOa");
    await sweep(directory({ WOa: minutesAgo(1) }, ["WOlive"]));
    expect(left(f, "WOa")).to.deep.equal(NONE);
    expect(f.requests).to.deep.equal([]);
    expect(f.mem.records.get("recent")!.erasedAt).to.equal(null);
  });

  it("leaves a workspace that is only missing from the directory", async function () {
    await sweep(directory({}, ["WOlive"]));
    expect(left(f, "WOa")).to.deep.equal(ALL);
    expect(f.mem.deletes).to.deep.equal([]);
  });

  it("leaves a workspace whose key exists again", async function () {
    await sweep(directory({ WOa: minutesAgo(1) }, ["WOa", "WOlive"]));
    expect(left(f, "WOa")).to.deep.equal(ALL);
    expect(f.mem.deletes).to.deep.equal([]);
  });

  it("deletes nothing and doesn't throw when the directory is unattached or can't list the deleted workspaces", async function () {
    const deletions = { WOa: minutesAgo(1) };
    for (const d of [
      undefined,
      directory(deletions, ["WOlive"], { deleted: true }),
      directory(deletions, ["WOlive"], { workspace: true })
    ])
      expect(await sweep(d)).to.deep.equal([]);
    expect(left(f, "WOa")).to.deep.equal(ALL);
    expect(f.mem.deletes).to.deep.equal([]);
  });

  it("deletes nothing further once the directory fails partway through", async function () {
    seed(f, "WOc");
    await f.seal("old-a", "WOa");
    const d = directory({ WOa: daysAgo(31), WOc: daysAgo(31) }, ["WOlive"]);
    let asked = 0;
    const done = await sweep({
      ...d,
      workspace: async (key) => {
        if (++asked > 1) throw new Error("identity db down");
        return d.workspace(key);
      }
    });
    expect(left(f, "WOa")).to.deep.equal(NONE);
    expect(left(f, "WOc")).to.deep.equal(ALL);
    // The run ended there: WOa's records, past their grace, wait for the next one.
    expect(done).to.deep.equal([]);
    expect(f.requests).to.deep.equal([]);
  });

  it("still deletes them when the workspace's records can't be erased, or are all in a private region", async function () {
    seed(f, "WOp");
    await f.seal("stuck", "WOa");
    await f.seal("private", "WOp", PRIVATE);
    const done = await sweep(
      directory({ WOa: daysAgo(31), WOp: daysAgo(31) }, ["WOlive"]),
      async () => ({ type: "error", code: "timeout", message: "no answer" })
    );
    expect(done).to.deep.equal([]);
    expect(f.mem.records.get("stuck")!.erasedAt).to.equal(null);
    expect(f.mem.records.get("private")!.erasedAt).to.equal(null);
    expect(left(f, "WOa")).to.deep.equal(NONE);
    expect(left(f, "WOp")).to.deep.equal(NONE);
  });

  it("skips the rest of a workspace when its applications can't be deleted, and finishes it on the next run", async function () {
    seed(f, "WOc");
    await f.seal("old-a", "WOa");
    const d = directory({ WOa: daysAgo(31), WOc: daysAgo(31) }, ["WOlive"]);
    const deleteApplications = f.mem.db.application.deleteMany;
    let fail = true;
    f.mem.db.application.deleteMany = async (args) => {
      if (fail && args.where.accessKeyId === "WOa") {
        fail = false;
        throw new Error("apiserver db down");
      }
      return deleteApplications(args);
    };
    // Its secrets, numbers and trunks stay while its applications do; the other deleted
    // workspace is finished, and its own records, past their grace, are erased.
    expect(await sweep(d)).to.deep.equal(["old-a"]);
    expect(left(f, "WOa")).to.deep.equal(ALL);
    expect(left(f, "WOc")).to.deep.equal(NONE);
    await sweep(d);
    expect(left(f, "WOa")).to.deep.equal(NONE);
    expect(left(f, "WOlive")).to.deep.equal(ALL);
  });

  it("leaves a workspace's trunks when one of its numbers can't be deleted, and finishes it on the next run", async function () {
    seed(f, "WOc");
    const d = directory({ WOa: minutesAgo(1), WOc: minutesAgo(1) }, ["WOlive"]);
    f.routr.failOnce("nb-WOa-1");
    await sweep(d);
    expect(left(f, "WOa")).to.deep.equal({ ...NONE, numbers: 2, trunks: 1 });
    expect(left(f, "WOc")).to.deep.equal(NONE);
    await sweep(d);
    expect(left(f, "WOa")).to.deep.equal(NONE);
    expect(left(f, "WOlive")).to.deep.equal(ALL);
  });

  it("removes a delivery written after a run on a later run", async function () {
    const d = directory({ WOa: minutesAgo(1) }, ["WOlive"]);
    await sweep(d);
    // A retry that was pending when the endpoint went writes its delivery again.
    f.mem.deliveries.push({
      ref: "wd-WOa-1",
      accessKeyId: "WOa",
      endpointRef: "we-WOa"
    });
    await sweep(d);
    expect(left(f, "WOa")).to.deep.equal(NONE);
  });

  describe("on Routr, through the sipnet list handlers and the Routr SDK", function () {
    type Call = {
      metadata: { get(key: string): unknown[] };
      request: { pageSize: number; pageToken?: string };
    };
    /** A sipnet list handler: only the items of the workspace named in the call's metadata. */
    const list =
      (byWorkspace: () => Record<string, string[]>) =>
      (call: unknown, callback: (err: unknown, res?: unknown) => void) => {
        const key = String((call as Call).metadata.get("accessKeyId")[0]);
        callback(null, {
          items: (byWorkspace()[key] ?? []).map((ref) => ({ ref }))
        });
      };
    const routrError = (code: number) =>
      Object.assign(new Error("routr said no"), { code });
    /** The production resources over the fixture's Routr; `refuse` is what Routr answers a delete with. */
    const production = (refuse: Record<string, number> = {}) => {
      const remove =
        (deleteOne: (ref: string) => Promise<void>) => async (ref: string) => {
          if (ref in refuse) throw routrError(refuse[ref]);
          await deleteOne(ref);
        };
      return createWorkspaceSipResources({
        handlers: {
          listNumbers: list(() => f.routr.numbers),
          listTrunks: list(() => f.routr.trunks)
        },
        numbers: { deleteNumber: remove(f.sip.deleteNumber) },
        trunks: { deleteTrunk: remove(f.sip.deleteTrunk) }
      });
    };

    it("deletes only the deleted workspace's numbers and trunks", async function () {
      await runWorkspaceErasure(
        f.mem.db,
        f.maintenance,
        directory({ WOa: minutesAgo(1) }, ["WOlive"]),
        NOW,
        production()
      );
      expect(left(f, "WOa")).to.deep.equal(NONE);
      expect(left(f, "WOlive")).to.deep.equal(ALL);
    });

    it("counts a number Routr no longer has as deleted, and finishes the workspace on that run", async function () {
      await runWorkspaceErasure(
        f.mem.db,
        f.maintenance,
        directory({ WOa: minutesAgo(1) }, ["WOlive"]),
        NOW,
        // Listed, then gone before its delete arrived.
        production({ "nb-WOa-1": status.NOT_FOUND })
      );
      expect(f.mem.deletes.slice(-2)).to.deep.equal([
        "deleteNumber:nb-WOa-2",
        "deleteTrunk:tk-WOa"
      ]);
      expect(f.routr.trunks.WOa).to.deep.equal([]);
      expect(left(f, "WOlive")).to.deep.equal(ALL);
    });

    it("stops at any other answer from Routr", async function () {
      await runWorkspaceErasure(
        f.mem.db,
        f.maintenance,
        directory({ WOa: minutesAgo(1) }, ["WOlive"]),
        NOW,
        production({ "nb-WOa-1": status.UNAVAILABLE })
      );
      expect(left(f, "WOa")).to.deep.equal({ ...NONE, numbers: 2, trunks: 1 });
    });
  });
});

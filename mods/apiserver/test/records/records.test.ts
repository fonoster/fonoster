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
import { AddressInfo } from "net";
import * as os from "os";
import * as path from "path";
import {
  CallRecordWriter,
  RecordEntry,
  RecordIndexEntry,
  fsStores
} from "@fonoster/callrecord";
import { CallStatus } from "@fonoster/types";
import { expect } from "chai";
import express from "express";
import jwt from "jsonwebtoken";
import {
  MaintenanceClient,
  createFetchCallsFromIndex,
  createIndexRecord,
  createRecordsRouter,
  runRetention
} from "../../src/records";
import { memoryRecordsDb } from "./memoryRecordsDb";

const ec = generateKeyPairSync("ec", { namedCurve: "P-256" });
const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
const IDENTITY_PUBLIC = rsa.publicKey
  .export({ type: "spki", format: "pem" })
  .toString();

function token(role: string, accessKeyId = "ws-1") {
  return jwt.sign(
    {
      sub: `user-${role}`,
      accessKeyId: "user-key",
      tokenUse: "access",
      access: [{ accessKeyId, role }]
    },
    rsa.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    { algorithm: "RS256", expiresIn: 300 }
  );
}

let t = Date.parse("2026-10-01T10:00:00Z");
const at = () => (t += 1000);

function call(
  callRef: string,
  o: {
    workspaceRef?: string;
    from?: string;
    to?: string;
    text?: string;
    failed?: string;
    recording?: boolean;
  } = {}
): RecordEntry[] {
  const parties = {
    from: o.from ?? "+15550001111",
    to: o.to ?? "+15550002222"
  };
  return [
    {
      at: at(),
      source: "event",
      message: {
        type: "call.started",
        direction: "inbound",
        appRef: "ivr",
        workspaceRef: o.workspaceRef ?? "ws-1",
        ...parties
      }
    },
    ...(o.failed
      ? [
          {
            at: at(),
            source: "event" as const,
            message: { type: "call.failed", reason: o.failed }
          }
        ]
      : [
          {
            at: at(),
            source: "gateway" as const,
            message: {
              type: "session.start",
              callRef,
              appRef: "ivr",
              ...parties
            }
          },
          ...(o.recording
            ? [
                {
                  at: at(),
                  source: "event" as const,
                  message: { type: "recording.started", policy: "on" }
                }
              ]
            : []),
          {
            at: at(),
            source: "gateway" as const,
            message: { type: "turn.ended", text: o.text ?? "Hello" }
          }
        ]),
    {
      at: at(),
      source: "event",
      message: { type: "call.ended", reason: "caller_hangup" }
    }
  ];
}

describe("@apiserver call records", function () {
  this.timeout(10000);
  let dir: string;
  let writer: CallRecordWriter;
  let mem: ReturnType<typeof memoryRecordsDb>;
  let server: ReturnType<ReturnType<typeof express>["listen"]>;
  let base: string;
  let maintenance: MaintenanceClient;
  const pending: Promise<unknown>[] = [];

  before(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "apiserver-records-"));
    const stores = fsStores(dir);
    mem = memoryRecordsDb();
    const index = createIndexRecord(mem.db);
    writer = new CallRecordWriter({
      ...stores,
      key: {
        kid: "k1",
        privateKeyPem: ec.privateKey
          .export({ type: "pkcs8", format: "pem" })
          .toString()
      },
      region: "us-east",
      onSealed: (e: RecordIndexEntry) => pending.push(index(e))
    });
    // What the region's gateways do for maintenance requests (gateway record/maintenance.ts).
    maintenance = async (_region, req) => {
      try {
        if (req.op === "erase") {
          const r = await writer.erase(req.callRef, req);
          return { type: "ack", version: r.version, audit: r.audit };
        }
        const r = await writer.deleteParts(
          req.callRef,
          req.parts as never,
          req
        );
        return { type: "ack", version: r.sealed.version, audit: r.audit };
      } catch (e) {
        return { type: "error", code: "error", message: (e as Error).message };
      }
    };

    const seal = async (
      callRef: string,
      entries: RecordEntry[],
      rec = false
    ) => {
      if (rec) {
        const recDir = writer.recordingDir(callRef);
        fs.mkdirSync(recDir, { recursive: true });
        fs.writeFileSync(
          path.join(recDir, "meta.json"),
          JSON.stringify({
            startedAt: t,
            rate: 16000,
            sides: ["caller", "agent"]
          })
        );
        fs.writeFileSync(
          path.join(recDir, "caller.pcm"),
          Buffer.alloc(3200, 1)
        );
        fs.writeFileSync(path.join(recDir, "agent.pcm"), Buffer.alloc(3200, 2));
      }
      for (const e of entries) writer.append(callRef, e);
      writer.close(callRef);
      await writer.flush();
      await Promise.all(pending);
    };
    await seal(
      "call-card",
      call("call-card", { text: "It is 4111 1111 1111 1111", recording: true }),
      true
    );
    await seal("call-busy", call("call-busy", { failed: "busy", to: "+1999" }));
    await seal("call-other", call("call-other", { workspaceRef: "ws-2" }));
    await seal("call-rec", call("call-rec", { recording: true }), true);

    const app = express();
    app.use(
      "/api/records",
      createRecordsRouter({
        db: mem.db,
        identityPublicKey: IDENTITY_PUBLIC,
        stores: (location) =>
          location === stores.store.location ? stores.store : undefined,
        maintenance
      })
    );
    server = app.listen(0);
    await new Promise((r) => server.once("listening", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/records`;
  });

  after(() => {
    server?.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const get = (url: string, role = "WORKSPACE_MEMBER", workspace = "ws-1") =>
    fetch(`${base}${url}`, {
      headers: {
        authorization: `Bearer ${token(role, workspace)}`,
        "x-accesskey-id": workspace
      }
    });
  const send = (
    method: string,
    url: string,
    body: unknown,
    role = "WORKSPACE_ADMIN"
  ) =>
    fetch(`${base}${url}`, {
      method,
      headers: {
        authorization: `Bearer ${token(role)}`,
        "x-accesskey-id": "ws-1",
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

  it("indexes sealed records and keeps the highest version", async function () {
    const row = mem.records.get("call-card")!;
    expect(row).to.deep.include({
      accessKeyId: "ws-1",
      appRef: "ivr",
      fromNumber: "+15550001111",
      status: "completed",
      region: "us-east",
      version: 1
    });
    expect(row.parts).to.deep.equal(["recording", "transcript", "messages"]);
    const index = createIndexRecord(mem.db);
    expect(
      await index({
        ...(row as never),
        callRef: "call-card",
        version: 0,
        status: "completed"
      } as RecordIndexEntry)
    ).to.equal(false);
  });

  it("never moves an indexed record to another workspace (RV-B6)", async function () {
    const row = mem.records.get("call-card")!;
    const index = createIndexRecord(mem.db);
    expect(
      await index({
        ...(row as never),
        callRef: "call-card",
        workspaceRef: "ws-attacker",
        version: row.version + 1,
        status: "completed"
      } as RecordIndexEntry)
    ).to.equal(false);
    expect(mem.records.get("call-card")).to.deep.include({
      accessKeyId: "ws-1",
      version: row.version
    });
  });

  it("refuses requests without a valid token or for another workspace", async function () {
    expect((await fetch(base)).status).to.equal(401);
    const res = await fetch(base, {
      headers: {
        authorization: `Bearer ${token("WORKSPACE_ADMIN", "ws-2")}`,
        "x-accesskey-id": "ws-1"
      }
    });
    expect(res.status).to.equal(403);
  });

  it("searches by number and time range within the caller's workspace only", async function () {
    const all = await (await get("/")).json();
    expect(
      all.items.map((i: { callRef: string }) => i.callRef).sort()
    ).to.deep.equal(["call-busy", "call-card", "call-rec"]);
    const byNumber = await (await get("/?number=%2B1999")).json();
    expect(
      byNumber.items.map((i: { callRef: string }) => i.callRef)
    ).to.deep.equal(["call-busy"]);
    const failed = await (await get("/?status=failed")).json();
    expect(failed.items).to.have.length(1);
    const none = await (await get("/?after=2030-01-01T00:00:00Z")).json();
    expect(none.items).to.have.length(0);
    expect((await get("/call-other")).status).to.equal(404);
  });

  it("returns the redacted copy by default; the original needs owner or admin", async function () {
    const redacted = await (await get("/call-card")).json();
    expect(redacted.redacted).to.equal(true);
    expect(JSON.stringify(redacted.vcon)).to.contain("[card number]");
    expect(JSON.stringify(redacted.vcon)).to.not.contain("4111 1111");
    expect((await get("/call-card?original=true")).status).to.equal(403);
    const original = await (
      await get("/call-card?original=true", "WORKSPACE_ADMIN")
    ).json();
    expect(JSON.stringify(original.vcon)).to.contain("4111 1111 1111 1111");
    expect(original.jws.signatures[0].header.kid).to.equal("k1");
  });

  it("downloads recordings; a recording withheld from the redacted copy needs unredacted access", async function () {
    const rec = await get("/call-rec/recording");
    expect(rec.status).to.equal(200);
    expect(rec.headers.get("content-type")).to.equal("audio/x-wav");
    expect(rec.headers.get("x-content-hash")).to.match(/^sha512-/);
    const wav = Buffer.from(await rec.arrayBuffer());
    expect(wav.toString("ascii", 0, 4)).to.equal("RIFF");
    expect((await get("/call-card/recording")).status).to.equal(403);
    expect(
      (await get("/call-card/recording?original=true", "WORKSPACE_ADMIN"))
        .status
    ).to.equal(200);
    expect((await get("/call-busy/recording")).status).to.equal(404);
  });

  it("serves ListCalls from the index", async function () {
    const list = await createFetchCallsFromIndex(mem.db)("ws-1", {});
    const busy = list.items.find((c) => c.ref === "call-busy")!;
    expect(busy).to.deep.include({
      status: CallStatus.USER_BUSY,
      to: "+1999",
      accessKeyId: "ws-1"
    });
    const filtered = await createFetchCallsFromIndex(mem.db)("ws-1", {
      status: CallStatus.USER_BUSY
    });
    expect(filtered.items.map((c) => c.ref)).to.deep.equal(["call-busy"]);
  });

  it("applies retention policies with audit entries naming the policy", async function () {
    expect(
      (
        await send(
          "PUT",
          "/retention",
          { part: "recording", days: 90 },
          "WORKSPACE_MEMBER"
        )
      ).status
    ).to.equal(403);
    const set = await send("PUT", "/retention", {
      part: "recording",
      days: 90
    });
    expect(await set.json()).to.deep.equal({ part: "recording", days: 90 });
    // Nothing is old enough yet.
    expect(await runRetention(mem.db, maintenance)).to.deep.equal([]);
    const done = await runRetention(
      mem.db,
      maintenance,
      Date.now() + 100 * 24 * 3600 * 1000
    );
    expect(done.map((d) => d.callRef).sort()).to.deep.equal([
      "call-card",
      "call-rec"
    ]);
    await Promise.all(pending);
    expect(mem.records.get("call-rec")!.parts).to.deep.equal([
      "transcript",
      "messages"
    ]);
    expect((await get("/call-rec/recording")).status).to.equal(404);
    const transcript = await (await get("/call-rec")).json();
    expect(
      transcript.vcon.dialog.some((d: { type: string }) => d.type === "text")
    ).to.equal(true);
    const audit = await (
      await get("/call-rec/audit", "WORKSPACE_ADMIN")
    ).json();
    expect(audit.items[0]).to.deep.include({
      action: "delete_part",
      part: "recording",
      reason: "retention policy: recording after 90 days",
      actor: "system:retention"
    });
    await send("PUT", "/retention", { part: "recording", days: null });
    expect(mem.retention).to.have.length(0);
  });

  it("erases one call on request, audited, and the index forgets its numbers", async function () {
    expect(
      (await send("DELETE", "/call-busy", { reason: "x" }, "WORKSPACE_MEMBER"))
        .status
    ).to.equal(403);
    const res = await send("DELETE", "/call-busy", { reason: "GDPR request" });
    expect(res.status).to.equal(200);
    await Promise.all(pending);
    expect((await get("/call-busy")).status).to.equal(410);
    const row = mem.records.get("call-busy")!;
    expect(row).to.deep.include({
      status: "erased",
      fromNumber: null,
      toNumber: null
    });
    expect(mem.audits.find((a) => a.callRef === "call-busy")).to.deep.include({
      action: "erase",
      actor: "user-WORKSPACE_ADMIN",
      reason: "GDPR request"
    });
    const all = await (await get("/")).json();
    expect(all.items.map((i: { callRef: string }) => i.callRef)).to.not.include(
      "call-busy"
    );
    expect((await send("DELETE", "/call-busy", {})).status).to.equal(410);
  });
});

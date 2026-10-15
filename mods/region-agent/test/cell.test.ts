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
import { fsStores } from "@fonoster/callrecord";
import { CellSecrets } from "@fonoster/common";
import { connect, NatsConnection, StringCodec } from "nats";
import { createTestDb, TestDb } from "../../common/test/persistence/testDb";
import { PrismaAppStore } from "../../gateway/src/apps/AppStore";
import {
  DatabaseApplier,
  DirIdentityStore,
  enroll,
  RegionAgent,
  RelayResponder
} from "../src";
import { FakeControlPlane } from "./fakeControlPlane";
import { FakeRoutr } from "./fakeRoutr";
import { sealRecord, snapshot, WS } from "./fixtures";

// The cell side end to end against a fake control plane (add-private-regions task 3): enroll with
// a test-key JWT, heartbeats with component counts and secret names (never values), a config
// snapshot landing in the cell's database and Routr, a relayed recording, index and usage
// forwarding, and revocation. Needs NATS (CONFORMANCE_NATS_URL); the database part also needs
// PERSISTENCE_TEST_DATABASE_URL.

const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const sc = StringCodec();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | undefined | false, ms = 5000) {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() > deadline) throw new Error("timed out");
    await sleep(25);
  }
}

describe("@region-agent private cell against a fake control plane", function () {
  this.timeout(120_000);
  let cp: FakeControlPlane;
  let nc: NatsConnection;
  let cellNc: NatsConnection | undefined;
  let dir: string;
  let db: TestDb | undefined;
  let agent: RegionAgent | undefined;
  const routr = new FakeRoutr();
  const got: Record<string, unknown[]> = {};

  before(async function () {
    if (!NATS_URL) this.skip();
    db = await createTestDb();
    cp = await new FakeControlPlane(
      `rg_${randomBytes(4).toString("hex")}`,
      WS
    ).start();
    nc = await connect({ servers: NATS_URL });
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "region-cell-"));
  });
  after(async () => {
    await agent?.stop();
    await cellNc?.drain();
    await nc?.drain();
    await cp?.stop();
    await db?.drop();
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  it("enrolls, reports, syncs, relays, forwards and stops on revocation", async function () {
    // 1. enroll with a one-time token
    const { token } = cp.issue();
    const identity = await enroll({
      token,
      store: new DirIdentityStore(dir),
      version: "0.28.1"
    });
    const R = identity.regionRef;
    // The cell's link client: replies to requests that cross the leaf stay in region.R.> (RG-B4).
    cellNc = await connect({
      servers: NATS_URL,
      inboxPrefix: `region.${R}._INBOX`
    });

    // 2. the control plane's side of the link: config replies, and every message from the cell
    let configRequests = 0;
    nc.subscribe(`region.${R}.config.request`, {
      callback: (_e, m) => {
        configRequests++;
        expect(m.reply).to.match(new RegExp(`^region\\.${R}\\._INBOX\\.`));
        m.respond(sc.encode(JSON.stringify(snapshot(1))));
      }
    });
    for (const s of ["heartbeat", "index", "usage", "endpoints"])
      nc.subscribe(`region.${R}.${s}`, {
        callback: (_e, m) => (got[s] ??= []).push(JSON.parse(sc.decode(m.data)))
      });

    // 3. the cell: secrets, records, media nodes and gateways
    const secrets = new CellSecrets.EncryptedFileSecretStore(
      path.join(dir, "secrets.enc"),
      "cell-pass"
    );
    secrets.set("deepgram", "dg-SECRET-VALUE");
    const records = fsStores(path.join(dir, "records")).store;
    const audio = randomBytes(900 * 1024);
    await sealRecord(records, "call-1", audio);
    const applied: number[] = [];
    let endpoints = {
      sip: [
        { host: "sip.acme.example", port: 5061, transport: "tls" as const }
      ],
      signalingAddresses: ["203.0.113.10"],
      mediaAddresses: ["203.0.113.11"],
      rtpPorts: { min: 10000, max: 20000 }
    };
    agent = new RegionAgent({
      identity,
      nc: cellNc,
      version: "0.28.1",
      stateDir: dir,
      heartbeatMs: 300,
      firstHeartbeatMs: 400,
      db: db
        ? new DatabaseApplier(db.prisma, {
            workspaceRef: identity.workspaceRef,
            autopilot: { url: "ws://autopilot:3000" }
          })
        : undefined,
      routr,
      relay: new RelayResponder(
        () => records,
        path.join(dir, "relay-audit.jsonl")
      ),
      secrets,
      autopilotProbe: async () => true,
      endpoints: () => endpoints
    });
    agent.onApplied = (v) => applied.push(v);
    await agent.start();
    const beatNode = () =>
      nc.publish(
        "media.node-a.heartbeat",
        sc.encode(
          JSON.stringify({ type: "node.heartbeat", nodeId: "node-a", rooms: 2 })
        )
      );
    const beatGateway = () =>
      nc.publish(
        "gateway.heartbeat",
        sc.encode(
          JSON.stringify({
            type: "gateway.heartbeat",
            gatewayRef: "gw-1",
            calls: 3
          })
        )
      );
    beatNode();
    beatGateway();

    // config: requested on start, applied to Routr and the database
    await waitFor(() => applied.includes(1));
    expect(configRequests).to.be.greaterThan(0);
    expect(routr.of("agents")[0].username).to.equal("jane");
    if (db) {
      const apps = await PrismaAppStore.open(db.prisma, { cacheMs: 0 });
      expect(apps.find("app-support")?.url).to.equal(
        "wss://example.com/session"
      );
      expect(apps.find("app-bot")?.url).to.equal("ws://autopilot:3000");
      apps.stop?.();
    }

    // heartbeat: components, calls, secret names, config version; no secret values anywhere
    const beat = (await waitFor(() =>
      (got.heartbeat as Record<string, unknown>[] | undefined)?.find(
        (h) => h.configVersion === 1
      )
    )) as Record<string, unknown>;
    expect(beat).to.deep.include({
      type: "region.heartbeat",
      regionRef: R,
      version: "0.28.1",
      components: { mediaNodes: 1, gateways: 1, autopilot: true },
      activeCalls: 3,
      secretsSet: ["deepgram"]
    });

    // endpoints (task 3.6): sent on connect, hashed in heartbeats, resent when they change
    const first = (await waitFor(() => got.endpoints?.[0])) as Record<
      string,
      unknown
    >;
    expect(first).to.deep.include({
      type: "region.endpoints",
      sip: [{ host: "sip.acme.example", port: 5061, transport: "tls" }],
      signalingAddresses: ["203.0.113.10"]
    });
    expect(beat.endpointsHash).to.match(/^[0-9a-f]{16}$/);
    endpoints = { ...endpoints, signalingAddresses: ["203.0.113.99"] };
    const changed = (await waitFor(() =>
      (got.endpoints as Record<string, unknown>[]).find(
        (e) => (e.signalingAddresses as string[])[0] === "203.0.113.99"
      )
    )) as Record<string, unknown>;
    expect(changed.updatedAt).to.be.a("string");
    const newer = (await waitFor(() =>
      (got.heartbeat as Record<string, unknown>[]).find(
        (h) => h.endpointsHash && h.endpointsHash !== beat.endpointsHash
      )
    )) as Record<string, unknown>;
    expect(newer.endpointsHash).to.be.a("string");

    // a pushed snapshot (newer) applies; an older one is ignored
    const s2 = snapshot(2);
    s2.kinds.routr!.agents = [];
    nc.publish(`region.${R}.config`, sc.encode(JSON.stringify(s2)));
    nc.publish(`region.${R}.config`, sc.encode(JSON.stringify(snapshot(1))));
    await waitFor(() => applied.includes(2));
    await sleep(100);
    expect(applied).to.deep.equal([1, 2]);
    expect(routr.of("agents")).to.have.length(0);

    // relay: a recording in chunks on the reply inbox
    const inbox = nc.subscribe(`region.${R}._INBOX.relay-test`);
    const chunks: Record<string, unknown>[] = [];
    nc.publish(
      `region.${R}.relay`,
      sc.encode(
        JSON.stringify({
          type: "region.relay",
          id: "rl-1",
          userRef: "user-9",
          op: "record.part",
          callRef: "call-1",
          part: "recording",
          original: true
        })
      ),
      { reply: `region.${R}._INBOX.relay-test` }
    );
    for await (const m of inbox) {
      const c = JSON.parse(sc.decode(m.data));
      chunks.push(c);
      if (c.last) break;
    }
    expect(chunks.map((c) => c.seq)).to.deep.equal([0, 1, 2]);
    const bytes = Buffer.concat(
      chunks.map((c) => Buffer.from(String(c.data), "base64"))
    );
    expect(bytes.equals(audio)).to.equal(true);
    const audit = fs.readFileSync(path.join(dir, "relay-audit.jsonl"), "utf8");
    expect(audit).to.include('"userRef":"user-9"');

    // index entries and usage
    nc.publish(
      "callrecord.sealed",
      sc.encode(
        JSON.stringify({
          callRef: "call-1",
          workspaceRef: "WOspoofed",
          status: "completed",
          startedAt: "2026-10-15T10:00:00.000Z",
          endedAt: "2026-10-15T10:01:30.000Z",
          durationSeconds: 90
        })
      )
    );
    const entry = (await waitFor(() => got.index?.[0])) as Record<
      string,
      unknown
    >;
    expect(entry).to.include({ callRef: "call-1", workspaceRef: WS });
    const usage = (await waitFor(() =>
      (got.usage as Record<string, unknown>[]).find((u) => u.minutes === 2)
    )) as Record<string, unknown>;
    expect(usage).to.deep.equal({
      type: "region.usage",
      minutes: 2,
      period: "2026-10"
    });

    // the secret value never crossed the link
    const everything = JSON.stringify(got);
    expect(everything).to.not.include("dg-SECRET-VALUE");

    // revocation: heartbeats stop
    nc.publish(
      `region.${R}.revoked`,
      sc.encode(
        JSON.stringify({ type: "region.revoked", reason: "disconnected" })
      )
    );
    await waitFor(() => agent!.state.revoked);
    await sleep(100);
    const before = got.heartbeat.length;
    await sleep(800);
    expect(got.heartbeat.length).to.equal(before);
    expect(
      JSON.parse(fs.readFileSync(path.join(dir, "state.json"), "utf8")).revoked
        .reason
    ).to.equal("disconnected");
  });

  it("pauses on region.config.paused and keeps the last config", async function () {
    const other = await new FakeControlPlane(
      `rg_${randomBytes(4).toString("hex")}`,
      WS
    ).start();
    const odir = fs.mkdtempSync(path.join(os.tmpdir(), "region-paused-"));
    const identity = await enroll({
      token: other.issue().token,
      store: new DirIdentityStore(odir),
      version: "0.1.0"
    });
    const R = identity.regionRef;
    const sub = nc.subscribe(`region.${R}.config.request`, {
      callback: (_e, m) =>
        m.respond(
          sc.encode(
            JSON.stringify({
              type: "region.config.paused",
              reason: "version 0.1.0 is not supported",
              requiredVersion: "0.27.0"
            })
          )
        )
    });
    const link = await connect({
      servers: NATS_URL,
      inboxPrefix: `region.${R}._INBOX`
    });
    const paused = new RegionAgent({
      identity,
      nc: link,
      version: "0.1.0",
      stateDir: odir,
      firstHeartbeatMs: 60_000
    });
    await paused.start();
    await waitFor(() => paused.paused);
    expect(paused.paused).to.deep.equal({
      reason: "version 0.1.0 is not supported",
      requiredVersion: "0.27.0"
    });
    expect(paused.state.configVersion).to.equal(-1);
    await paused.stop();
    sub.unsubscribe();
    await link.drain();
    await other.stop();
    fs.rmSync(odir, { recursive: true, force: true });
  });
});

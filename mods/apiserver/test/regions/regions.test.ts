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
import { execFileSync } from "child_process";
import { generateKeyPairSync } from "crypto";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import * as http from "http";
import { AddressInfo } from "net";
import { tmpdir } from "os";
import { join } from "path";
import { expect } from "chai";
import express from "express";
import jwt from "jsonwebtoken";
import {
  connect,
  credsAuthenticator,
  Msg,
  NatsConnection,
  StringCodec
} from "nats";
import { createTestDb, TestDb } from "../../../common/test/persistence/testDb";
import { createRecordsRouter } from "../../src/records";
import {
  ConfigKinds,
  createRegionSigner,
  endpointsHash,
  generateRegionHub,
  RegionNatsAuth,
  RegionsConfig,
  RegionsRuntime,
  runRegions,
  SnapshotSources
} from "../../src/regions";
import {
  endpointsHash as agentEndpointsHash,
  RegionAgent
} from "../../../region-agent/src";

// The control plane's side of private regions end to end, with a fake cell: enrollment, config
// sync, heartbeats and status, index and usage ingestion, the content relay, re-issue, disconnect
// and workspace deletion. Needs PERSISTENCE_TEST_DATABASE_URL and CONFORMANCE_NATS_URL; with
// REGION_HUB_TEST=1 it also starts a real region hub (rb-regcp-hub, NATS in operator mode) and
// checks credential scoping and revocation on it.

const sc = StringCodec();
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const HUB = process.env.REGION_HUB_TEST === "1";
const HUB_PORT = Number(process.env.REGION_HUB_PORT ?? 21422);
const WS = "WOacme00000000000000000000000000";
const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
const IDENTITY_PUBLIC = rsa.publicKey
  .export({ type: "spki", format: "pem" })
  .toString();
const ecPem = () =>
  generateKeyPairSync("ec", { namedCurve: "P-256" })
    .privateKey.export({ type: "pkcs8", format: "pem" })
    .toString();

function accessToken(role: string, accessKeyId = WS) {
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

const PUBLIC_ENDPOINTS = {
  sip: [
    {
      host: "sip.us-east-1.fonoster.com",
      port: 5060,
      transport: "udp" as const
    }
  ],
  signalingAddresses: ["198.51.100.1"],
  mediaAddresses: ["198.51.100.2"],
  rtpPorts: { min: 10000, max: 20000 }
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until<T>(
  fn: () => T | undefined | Promise<T | undefined>,
  ms = 5000
) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error("timed out");
    await wait(50);
  }
}

/** The fake cell: what the cell stream builds, reduced to the contract. */
class FakeCell {
  configs: Record<string, unknown>[] = [];
  needed: string[][] = [];
  revoked: unknown[] = [];
  errors: string[] = [];
  relayed: Record<string, unknown>[] = [];
  endpointRequests = 0;
  constructor(
    readonly nc: NatsConnection,
    readonly ref: string
  ) {}

  static async connect(ref: string, creds?: string, url?: string) {
    const nc = await connect({
      servers: url ?? NATS_URL!,
      inboxPrefix: `region.${ref}._INBOX`,
      ...(creds
        ? { authenticator: credsAuthenticator(new TextEncoder().encode(creds)) }
        : {}),
      maxReconnectAttempts: 0
    });
    const cell = new FakeCell(nc, ref);
    void (async () => {
      for await (const s of nc.status())
        cell.errors.push(`${s.type}:${s.data}`);
    })();
    const on = (subject: string, fn: (m: Msg) => void) =>
      nc.subscribe(`region.${ref}.${subject}`, { callback: (_e, m) => fn(m) });
    on("config", (m) => cell.configs.push(JSON.parse(sc.decode(m.data))));
    on("secrets.needed", (m) =>
      cell.needed.push(JSON.parse(sc.decode(m.data)).names)
    );
    on("revoked", (m) => cell.revoked.push(JSON.parse(sc.decode(m.data))));
    on("endpoints.request", () => cell.endpointRequests++);
    on("relay", (m) => {
      const req = JSON.parse(sc.decode(m.data));
      cell.relayed.push(req);
      if (req.callRef === "call-missing") {
        m.respond(
          sc.encode(
            JSON.stringify({
              type: "region.relay.error",
              id: req.id,
              code: "not_found"
            })
          )
        );
        return;
      }
      // Three chunks, sent out of order: the control plane must reorder them.
      const parts = ["RIFF", "-audio-", "bytes"];
      for (const seq of [1, 0, 2])
        m.respond(
          sc.encode(
            JSON.stringify({
              type: "region.relay.chunk",
              id: req.id,
              seq,
              last: seq === 2,
              contentType:
                req.op === "record.part" ? "audio/x-wav" : "application/json",
              data: Buffer.from(parts[seq]).toString("base64")
            })
          )
        );
    });
    await nc.flush();
    return cell;
  }

  heartbeat(o: Record<string, unknown> = {}) {
    this.nc.publish(
      `region.${this.ref}.heartbeat`,
      sc.encode(
        JSON.stringify({
          type: "region.heartbeat",
          regionRef: this.ref,
          version: "0.27.0",
          components: { mediaNodes: 1, gateways: 1, autopilot: true },
          activeCalls: 2,
          secretsSet: ["deepgram"],
          configVersion: 0,
          at: new Date().toISOString(),
          ...o
        })
      )
    );
  }

  endpoints(e: Record<string, unknown>) {
    this.nc.publish(
      `region.${this.ref}.endpoints`,
      sc.encode(JSON.stringify({ type: "region.endpoints", ...e }))
    );
  }

  async requestConfig(haveVersion: number) {
    const r = await this.nc.request(
      `region.${this.ref}.config.request`,
      sc.encode(JSON.stringify({ type: "region.config.request", haveVersion })),
      { timeout: 3000 }
    );
    return JSON.parse(sc.decode(r.data));
  }

  close() {
    return this.nc.close();
  }
}

describe("@apiserver[regions/e2e] private region round trip", function () {
  this.timeout(60000);
  let db: TestDb | undefined;
  let runtime: RegionsRuntime;
  let server: http.Server;
  let base: string;
  let cp: NatsConnection;
  let system: NatsConnection | undefined;
  let hubDir: string | undefined;
  let hubUrl: string = NATS_URL ?? "";
  const pushed: Record<string, number>[] = [];
  const cells: FakeCell[] = [];
  const kinds: ConfigKinds = {
    numbers: [{ ref: "n1", telUrl: "tel:+15551230000", appRef: "app-1" }],
    apps: [
      {
        ref: "app-1",
        name: "Reception",
        speechVoice: "elevenlabs/rachel",
        signingSecret: "s3cr3t"
      }
    ],
    assistants: [],
    routr: { domains: [{ ref: "d1" }], agents: [], trunks: [], acls: [] },
    catalog: [],
    webhooks: [],
    recordingPolicy: { recordings: { store: true } }
  };

  before(async function () {
    if (!NATS_URL) return this.skip();
    db = await createTestDb();
    if (!db) return this.skip();

    const signer = createRegionSigner({ privateKeyPem: ecPem() });
    let natsAuth: RegionNatsAuth | undefined;
    let natsSeeds: { operatorSeed: string; accountSeed: string } | undefined;
    if (HUB) {
      const hub = generateRegionHub({ resolverDir: "/data/jwt" });
      hubDir = mkdtempSync(join(tmpdir(), "rb-regcp-hub-"));
      writeFileSync(join(hubDir, "nats.conf"), hub.conf);
      execFileSync("docker", ["rm", "-f", "rb-regcp-hub"], { stdio: "ignore" });
      execFileSync("docker", [
        "run",
        "-d",
        "--name",
        "rb-regcp-hub",
        "-p",
        `${HUB_PORT}:4222`,
        "-v",
        `${hubDir}/nats.conf:/etc/nats/nats.conf:ro`,
        "nats:2.11.8",
        "-c",
        "/etc/nats/nats.conf"
      ]);
      hubUrl = `nats://127.0.0.1:${HUB_PORT}`;
      const auth = (c: string) =>
        credsAuthenticator(new TextEncoder().encode(c));
      cp = await until(
        () =>
          connect({
            servers: hubUrl,
            authenticator: auth(hub.controlPlaneCreds)
          }).catch(() => undefined),
        10000
      );
      system = await connect({
        servers: hubUrl,
        authenticator: auth(hub.systemCreds)
      });
      natsSeeds = {
        operatorSeed: hub.operatorSeed,
        accountSeed: hub.accountSeed
      };
    } else {
      cp = await connect({ servers: NATS_URL });
      // Plain NATS: credentials are issued but revocation is only recorded.
      const { createRegionNatsAuth } = await import("../../src/regions");
      const real = createRegionNatsAuth(generateRegionHub({}));
      natsAuth = {
        ...real,
        async pushRevocations(r) {
          pushed.push(r);
        }
      };
    }

    const sources: SnapshotSources = {
      apps: async () => ({ apps: kinds.apps, assistants: kinds.assistants }),
      numbers: async () => kinds.numbers,
      routr: async () => kinds.routr,
      catalog: async (ids, providers) =>
        providers.map((id) => ({ kind: "provider", id, ids })),
      webhooks: async () => kinds.webhooks,
      recordingPolicy: async () => kinds.recordingPolicy
    };
    const config: RegionsConfig = {
      public: [
        {
          id: "us-east-1",
          name: "US East (N. Virginia)",
          default: true,
          endpoints: PUBLIC_ENDPOINTS
        }
      ],
      allowInsecureLeaf: true,
      relay: {
        firstChunkTimeoutMs: 800,
        idleTimeoutMs: 2000,
        maxBytes: 1024 * 1024
      },
      configDebounceMs: 50
    };
    runtime = await runRegions(config, {
      db: db.prisma,
      identityPublicKey: IDENTITY_PUBLIC,
      issuer: "https://api.example.com",
      defaultControlPlaneUrl: "https://api.example.com",
      defaultLeafUrl: "nats://leaf.example.com:7422",
      currentVersion: "0.27.0",
      sources,
      signer,
      natsAuth,
      natsSeeds,
      hubConnections: { nc: cp, system }
    });
    const app = express();
    for (const r of runtime.routers) app.use(r.path, r.router);
    app.use(
      "/api/records",
      createRecordsRouter({
        db: db.prisma,
        identityPublicKey: IDENTITY_PUBLIC,
        stores: () => undefined,
        maintenance: async () => ({ ok: true }) as never,
        relay: { regionOf: runtime.regionOf, client: runtime.relay }
      })
    );
    server = app.listen(0);
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(async function () {
    for (const c of cells) await c.close().catch(() => undefined);
    await runtime?.close();
    server?.close();
    await cp?.close();
    await system?.close();
    await db?.drop();
    if (HUB)
      execFileSync("docker", ["rm", "-f", "rb-regcp-hub"], { stdio: "ignore" });
    if (hubDir) rmSync(hubDir, { recursive: true, force: true });
  });

  const api = async (
    path: string,
    init: { method?: string; body?: unknown; role?: string } = {}
  ) => {
    const res = await fetch(`${base}${path}`, {
      method: init.method ?? "GET",
      headers: {
        "content-type": "application/json",
        ...(init.role
          ? {
              authorization: `Bearer ${accessToken(init.role)}`,
              "x-accesskey-id": WS
            }
          : {})
      },
      body: init.body ? JSON.stringify(init.body) : undefined
    });
    const text = await res.text();
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(text);
    } catch {
      body = { text };
    }
    return { status: res.status, body, headers: res.headers };
  };
  const enroll = (
    token: string,
    publicKey = Buffer.alloc(32, 7).toString("base64url")
  ) =>
    api("/api/regions/enroll", {
      method: "POST",
      body: {
        token,
        publicKey,
        version: "0.27.0",
        components: { mediaNodes: 1, gateways: 1, autopilot: true }
      }
    });

  let ref: string;
  let firstToken: string;
  let creds: string;

  it("creates a private region in waiting with a one-time token", async function () {
    const created = await runtime.service.createPrivateRegion(WS);
    ref = created.regionRef;
    firstToken = created.enrollmentToken;
    expect(ref).to.match(/^rg_/);
    expect(Date.parse(created.expiresAt) - Date.now()).to.be.closeTo(
      24 * 3600e3,
      5000
    );
    const keys = await api("/.well-known/region-keys.json");
    expect((keys.body.keys as unknown[]).length).to.equal(1);
    const region = await api("/api/regions/current", {
      role: "WORKSPACE_MEMBER"
    });
    expect(region.body).to.include({ ref, kind: "private", status: "waiting" });
    const list = await api("/api/regions");
    expect(list.body.items).to.deep.equal([
      { id: "us-east-1", name: "US East (N. Virginia)", default: true }
    ]);
  });

  it("refuses bad, expired and foreign tokens with the contract codes", async function () {
    expect((await enroll("not-a-jwt")).body.error).to.equal("token_invalid");
    expect((await enroll("not-a-jwt")).status).to.equal(400);
    const claims = {
      iss: "x",
      sub: ref,
      wsp: WS,
      cp: "x",
      leaf: "x",
      jti: "j"
    };
    const foreign = createRegionSigner({ privateKeyPem: ecPem() });
    expect((await enroll(foreign.sign(claims))).body.error).to.equal(
      "token_invalid"
    );
    const expired = await enroll(runtime.signer!.sign(claims, -5));
    expect(expired.status).to.equal(410);
    expect(expired.body.error).to.equal("token_expired");
    const unknown = await enroll(runtime.signer!.sign(claims));
    expect(unknown.body.error).to.equal("token_invalid");
    expect((await enroll(firstToken, "short")).status).to.equal(400);
  });

  it("enrolls once and returns region-scoped credentials", async function () {
    const r = await enroll(firstToken);
    expect(r.status).to.equal(200);
    expect(r.body).to.include({
      regionRef: ref,
      workspaceRef: WS,
      leafUrl: "nats://leaf.example.com:7422",
      subjects: `region.${ref}.>`
    });
    creds = String(r.body.credentials);
    expect(creds).to.contain("BEGIN NATS USER JWT");
    const replay = await enroll(firstToken);
    expect(replay.status).to.equal(409);
    expect(replay.body.error).to.equal("token_used");
  });

  let cell: FakeCell;

  it("serves the config snapshot on request and a heartbeat makes the region connected", async function () {
    cell = await FakeCell.connect(ref, HUB ? creds : undefined, hubUrl);
    cells.push(cell);
    const config = await cell.requestConfig(0);
    expect(config).to.include({
      type: "region.config",
      configVersion: 1,
      full: true
    });
    expect(config.kinds.apps[0]).to.include({ ref: "app-1" });
    expect(config.kinds.routr.domains).to.have.length(1);
    expect(await cell.requestConfig(1)).to.deep.equal({
      type: "region.config.current",
      configVersion: 1
    });
    await until(() => cell.needed.length > 0);
    expect(cell.needed[0]).to.deep.equal(["deepgram", "elevenlabs"]);

    cell.heartbeat({ configVersion: 1 });
    const region = await until(async () => {
      const r = await api("/api/regions/current", { role: "WORKSPACE_MEMBER" });
      return r.body.status === "connected" ? r.body : undefined;
    });
    expect(region).to.include({
      version: "0.27.0",
      activeCalls: 2,
      mediaNodes: 1,
      gateways: 1
    });
    expect(region.secrets).to.deep.equal([
      { name: "deepgram", usedBy: ["Reception"], set: true },
      { name: "elevenlabs", usedBy: ["Reception"], set: false }
    ]);
  });

  it("asks for endpoints, stores what the cell reports and re-asks when the hash changes", async function () {
    // The heartbeat above carried no endpointsHash and none are stored yet: the cp asks.
    await until(() => cell.endpointRequests > 0);
    const first = {
      sip: [
        { host: "sip.acme.example", port: 5061, transport: "tls" },
        { host: "sip.acme.example", port: 99999, transport: "udp" },
        { host: "bad host!", port: 5060, transport: "udp" }
      ],
      signalingAddresses: ["203.0.113.10"],
      mediaAddresses: ["203.0.113.11"],
      rtpPorts: { min: 20000, max: 20999 },
      updatedAt: new Date().toISOString()
    };
    cell.endpoints(first);
    const region = await until(async () => {
      const r = await api("/api/regions/current", { role: "WORKSPACE_MEMBER" });
      return r.body.endpoints ? r.body : undefined;
    });
    expect(region.endpoints.sip).to.deep.equal([
      { host: "sip.acme.example", port: 5061, transport: "tls" }
    ]);
    expect(region.endpoints).to.deep.include({
      signalingAddresses: ["203.0.113.10"],
      mediaAddresses: ["203.0.113.11"],
      rtpPorts: { min: 20000, max: 20999 }
    });
    const hash = endpointsHash(first);

    // Same hash in the heartbeat: no request.
    const asked = cell.endpointRequests;
    cell.heartbeat({ configVersion: 1, endpointsHash: hash });
    await wait(300);
    expect(cell.endpointRequests).to.equal(asked);

    // The address changed: the heartbeat's hash differs, the cp asks, the cell answers.
    cell.heartbeat({ configVersion: 1, endpointsHash: "changed" });
    await until(() => cell.endpointRequests > asked);
    cell.endpoints({ ...first, signalingAddresses: ["203.0.113.20"] });
    await until(
      async () =>
        (await api("/api/regions/current", { role: "WORKSPACE_MEMBER" })).body
          .endpoints?.signalingAddresses?.[0] === "203.0.113.20"
    );

    // Nothing usable is ignored (the stored details stay).
    cell.endpoints({ sip: [{ host: "", port: 0 }] });
    await wait(300);
    const kept = await api("/api/regions/current", {
      role: "WORKSPACE_MEMBER"
    });
    expect(kept.body.endpoints.signalingAddresses).to.deep.equal([
      "203.0.113.20"
    ]);
  });

  it("stores the real region agent's endpoints and its hash matches (RE-B2)", async function () {
    // The agent also listens on media.*/gateway.* subjects, outside the hub credentials.
    if (HUB) return this.skip();
    const stateDir = mkdtempSync(join(tmpdir(), "rb-regep-agent-"));
    const nc = await connect({
      servers: NATS_URL!,
      inboxPrefix: `region.${ref}._INBOX`
    });
    const reported = {
      sip: [
        { host: "sip.cell.example", port: 5061, transport: "tls" as const }
      ],
      signalingAddresses: ["203.0.113.30"],
      mediaAddresses: ["203.0.113.31"],
      rtpPorts: { min: 30000, max: 30999 }
    };
    const agent = new RegionAgent({
      identity: {
        regionRef: ref,
        workspaceRef: WS,
        controlPlane: base,
        leafUrl: NATS_URL!,
        subjects: `region.${ref}.>`,
        configVersion: 1,
        enrolledAt: new Date().toISOString(),
        tokenId: "agent-test",
        publicKey: "x"
      },
      nc,
      version: "0.27.0",
      stateDir,
      heartbeatMs: 200,
      firstHeartbeatMs: 100,
      endpoints: () => reported
    });
    try {
      await agent.start();
      const r = await until(async () => {
        const b = (
          await api("/api/regions/current", { role: "WORKSPACE_MEMBER" })
        ).body;
        return b.endpoints?.sip?.[0]?.host === "sip.cell.example"
          ? b
          : undefined;
      });
      expect(r.endpoints).to.deep.include({
        signalingAddresses: ["203.0.113.30"],
        mediaAddresses: ["203.0.113.31"],
        rtpPorts: { min: 30000, max: 30999 }
      });
      const row = await runtime.service.byRef(ref);
      expect(row!.endpointsHash).to.equal(agentEndpointsHash(reported));

      // The agent's heartbeats now match: no requests. A foreign hash makes the cp ask, and
      // the agent answers with a fresh report.
      const asked = cell.endpointRequests;
      await wait(500);
      expect(cell.endpointRequests).to.equal(asked);
      const before = row!.endpointsAt!.getTime();
      cell.heartbeat({ configVersion: 1, endpointsHash: "stale" });
      await until(async () => {
        const again = await runtime.service.byRef(ref);
        return again!.endpointsAt!.getTime() > before;
      });
    } finally {
      await agent.stop();
      await nc.close();
      rmSync(stateDir, { recursive: true, force: true });
    }
  });

  it("publishes a new version when the workspace's config changes", async function () {
    const before = cell.configs.length;
    kinds.apps = [...kinds.apps, { ref: "app-2", name: "After hours" }];
    runtime.onConfigChange(WS);
    runtime.onConfigChange(WS); // debounced into one version
    const msg = await until(() => cell.configs[before]);
    expect(msg).to.include({ configVersion: 2 });
    await wait(200);
    expect(cell.configs.length).to.equal(before + 1);
  });

  it("degraded with a component down; unsupported pauses config sync", async function () {
    cell.heartbeat({
      configVersion: 2,
      components: { mediaNodes: 0, gateways: 1, autopilot: true }
    });
    await until(
      async () =>
        (await api("/api/regions/current", { role: "WORKSPACE_MEMBER" })).body
          .status === "degraded"
    );
    cell.heartbeat({ configVersion: 2, version: "0.25.1" });
    const r = await until(async () => {
      const b = (
        await api("/api/regions/current", { role: "WORKSPACE_MEMBER" })
      ).body;
      return b.status === "unsupported" ? b : undefined;
    });
    expect(r.requiredVersion).to.equal("0.26.0");
    expect(await cell.requestConfig(0)).to.include({
      type: "region.config.paused",
      requiredVersion: "0.26.0"
    });
    const n = cell.configs.length;
    runtime.onConfigChange(WS);
    await wait(300);
    expect(cell.configs.length).to.equal(n);
    cell.heartbeat({ configVersion: 2 });
    await until(
      async () =>
        (await api("/api/regions/current", { role: "WORKSPACE_MEMBER" })).body
          .status === "connected"
    );
  });

  it("ingests index entries for the region's workspace only, and usage", async function () {
    const entry = {
      callRef: "call-1",
      workspaceRef: "WOsomeoneelse",
      appRef: "app-1",
      from: "+1555",
      to: "+1666",
      direction: "inbound",
      status: "completed",
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: 61,
      region: "spoofed",
      location: "cell://local",
      version: 1,
      size: 100,
      parts: ["recording"]
    };
    cell.nc.publish(`region.${ref}.index`, sc.encode(JSON.stringify(entry)));
    cell.nc.publish(
      `region.${ref}.usage`,
      sc.encode(
        JSON.stringify({
          type: "region.usage",
          minutes: 12.5,
          period: "2026-10"
        })
      )
    );
    const row = await until(() =>
      db!.prisma.callRecord.findUnique({ where: { callRef: "call-1" } })
    );
    expect(row).to.include({ accessKeyId: WS, region: ref });
    const usage = await until(() =>
      db!.prisma.regionUsage.findUnique({
        where: { regionRef_period: { regionRef: ref, period: "2026-10" } }
      })
    );
    expect(usage.minutes).to.equal(12.5);
  });

  it("relays a private recording through the control plane in order, without storing it", async function () {
    const r = await api("/api/records/call-1/recording", {
      role: "WORKSPACE_ADMIN"
    });
    expect(r.status).to.equal(200);
    expect(r.body.text).to.equal("RIFF-audio-bytes");
    expect(r.headers.get("content-type")).to.equal("audio/x-wav");
    expect(cell.relayed.at(-1)).to.include({
      op: "record.part",
      callRef: "call-1",
      part: "recording",
      userRef: "user-WORKSPACE_ADMIN"
    });
    const rec = await api("/api/records/call-1", { role: "WORKSPACE_MEMBER" });
    expect(rec.status).to.equal(200);
    expect(cell.relayed.at(-1)).to.include({ op: "record.get" });
    const denied = await api("/api/records/call-1?original=true", {
      role: "WORKSPACE_MEMBER"
    });
    expect(denied.status).to.equal(403);
    await db!.prisma.callRecord.create({
      data: {
        callRef: "call-missing",
        accessKeyId: WS,
        status: "completed",
        startedAt: new Date(),
        region: ref,
        location: "cell://local",
        version: 1
      }
    });
    const missing = await api("/api/records/call-missing/recording", {
      role: "WORKSPACE_ADMIN"
    });
    expect(missing.status).to.equal(404);
    expect(missing.body.error).to.equal("not_found");
  });

  it("answers 503 region_offline when the cell does not answer", async function () {
    await db!.prisma.callRecord.create({
      data: {
        callRef: "call-2",
        accessKeyId: WS,
        status: "completed",
        startedAt: new Date(),
        region: ref,
        location: "cell://local",
        version: 1
      }
    });
    // The cell goes away (offline): nobody answers the relay.
    await cell.close();
    const r = await api("/api/records/call-2/recording", {
      role: "WORKSPACE_ADMIN"
    });
    expect(r.status).to.equal(503);
    expect(r.body.error).to.equal("region_offline");
  });

  it("re-issuing (owner/admin) and enrolling again revokes the previous credentials", async function () {
    expect(
      (
        await api("/api/regions/current/token", {
          method: "POST",
          role: "WORKSPACE_MEMBER"
        })
      ).status
    ).to.equal(403);
    const reissued = await api("/api/regions/current/token", {
      method: "POST",
      role: "WORKSPACE_OWNER"
    });
    expect(reissued.status).to.equal(200);
    const old = await FakeCell.connect(ref, HUB ? creds : undefined, hubUrl);
    cells.push(old);
    const r = await enroll(String(reissued.body.enrollmentToken));
    expect(r.status).to.equal(200);
    const fresh = String(r.body.credentials);
    expect(fresh).not.to.equal(creds);
    await until(
      () => old.revoked.length > 0 || old.nc.isClosed() || old.errors.length > 0
    );
    const rows = await db!.prisma.regionCredential.findMany({
      where: { regionRef: ref }
    });
    expect(
      rows.filter((x: { revokedAt: Date | null }) => !x.revokedAt)
    ).to.have.length(1);
    if (HUB) {
      // The old user is disconnected and refused; the new one works and is scoped.
      await until(
        () =>
          old.errors.some((e) => e.startsWith("disconnect")) ||
          old.nc.isClosed()
      );
      const refused = await FakeCell.connect(ref, creds, hubUrl)
        .then(() => false)
        .catch(() => true);
      expect(refused).to.equal(true);
      const next = await FakeCell.connect(ref, fresh, hubUrl);
      cells.push(next);
      next.nc.publish("region.rg_someoneelse.heartbeat", sc.encode("{}"));
      await until(() =>
        next.errors.find((e) => e.includes("PERMISSIONS_VIOLATION"))
      );
      cell = next;
    } else {
      expect(Object.keys(pushed.at(-1)!)).to.have.length(1);
      cell = await FakeCell.connect(ref, undefined, hubUrl);
      cells.push(cell);
    }
  });

  it("disconnect revokes now and puts the region in waiting", async function () {
    const r = await api("/api/regions/current/disconnect", {
      method: "POST",
      role: "WORKSPACE_ADMIN"
    });
    expect(r.status).to.equal(200);
    const region = await api("/api/regions/current", {
      role: "WORKSPACE_MEMBER"
    });
    expect(region.body.status).to.equal("waiting");
    if (HUB)
      await until(
        () =>
          cell.errors.some((e) => e.startsWith("disconnect")) ||
          cell.nc.isClosed()
      );
    else expect(Object.keys(pushed.at(-1)!)).to.have.length(2);
  });

  it("deleting the workspace retires the region: enrollment answers workspace_deleted", async function () {
    const t = await runtime.service.reissueToken(WS);
    await runtime.service.deleteForWorkspace(WS);
    const r = await enroll(t.enrollmentToken);
    expect(r.status).to.equal(409);
    expect(r.body.error).to.equal("workspace_deleted");
    const region = await api("/api/regions/current", {
      role: "WORKSPACE_MEMBER"
    });
    expect(region.body.kind).to.equal("public");
    expect(region.body.endpoints).to.deep.equal(PUBLIC_ENDPOINTS);
  });
});

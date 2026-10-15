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
  createWorkspaceRegionHooks,
  RegionsRuntime,
  runRegions,
  SnapshotSources,
  WorkspaceInfo
} from "../../src/regions";
import {
  endpointsHash as agentEndpointsHash,
  RegionAgent
} from "../../../region-agent/src";

// The control plane's side of regions end to end (PR-12..PR-21), with a fake cell: enrollment, config
// sync, heartbeats and status, index and usage ingestion, the content relay, re-issue, disconnect
// and workspace deletion. Needs PERSISTENCE_TEST_DATABASE_URL and CONFORMANCE_NATS_URL; with
// REGION_HUB_TEST=1 it also starts a real region hub (rb-regcp-hub, NATS in operator mode) and
// checks credential scoping and revocation on it.

const sc = StringCodec();
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const HUB = process.env.REGION_HUB_TEST === "1";
const HUB_PORT = Number(process.env.REGION_HUB_PORT ?? 21422);
const HUB_NAME = process.env.REGION_HUB_NAME ?? "rb-regcp-hub";
const WS = "WOacme00000000000000000000000000";
const WS2 = "WOacme20000000000000000000000000";
const WS_PUBLIC = "WOpublic000000000000000000000000";
const OWNER = "user-WORKSPACE_OWNER";
const OPERATOR_KEY = "operator-key-for-tests-0123456789";
const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
const IDENTITY_PUBLIC = rsa.publicKey
  .export({ type: "spki", format: "pem" })
  .toString();
const ecPem = () =>
  generateKeyPairSync("ec", { namedCurve: "P-256" })
    .privateKey.export({ type: "pkcs8", format: "pem" })
    .toString();

function accessToken(role: string, accessKeyId = WS, sub = `user-${role}`) {
  return jwt.sign(
    {
      sub,
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
  neededMessages: Record<string, unknown>[] = [];
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
    on("secrets.needed", (m) => {
      const body = JSON.parse(sc.decode(m.data));
      cell.needed.push(body.names);
      cell.neededMessages.push(body);
    });
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

  async secret(workspaceRef: string, provider: string) {
    const r = await this.nc.request(
      `region.${this.ref}.secrets.get`,
      sc.encode(
        JSON.stringify({ type: "region.secrets.get", workspaceRef, provider })
      ),
      { timeout: 3000 }
    );
    return JSON.parse(sc.decode(r.data));
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

describe("@apiserver[regions/e2e] regions round trip (PR-12..PR-21)", function () {
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
  const hooks = createWorkspaceRegionHooks([
    {
      id: "default",
      name: "US East (N. Virginia)",
      default: true,
      endpoints: PUBLIC_ENDPOINTS
    }
  ]);
  // Identity's workspaces (the directory Identity attaches in production).
  const workspaces = new Map<string, WorkspaceInfo>();
  const bind = (accessKeyId: string, region: string, name = accessKeyId) =>
    workspaces.set(accessKeyId, {
      ref: `ref-${accessKeyId}`,
      accessKeyId,
      name,
      ownerRef: OWNER,
      region
    });
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
    routr: {
      domains: [{ ref: "d1", domainUri: "acme.fonoster.example" }],
      agents: [],
      trunks: [],
      acls: []
    },
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
      execFileSync("docker", ["rm", "-f", HUB_NAME], { stdio: "ignore" });
      execFileSync("docker", [
        "run",
        "-d",
        "--name",
        HUB_NAME,
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
          id: "default",
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
      configDebounceMs: 50,
      operatorKey: OPERATOR_KEY,
      privateRegionMonthlyFeeCents: 49900
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
      hubConnections: { nc: cp, system },
      rootDomain: () => "fonoster.example"
    });
    hooks.attach(runtime);
    hooks.attachDirectory({
      workspace: async (id) => workspaces.get(id),
      inRegion: async (key) =>
        [...workspaces.values()].filter((w) => w.region === key)
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
      execFileSync("docker", ["rm", "-f", HUB_NAME], { stdio: "ignore" });
    if (hubDir) rmSync(hubDir, { recursive: true, force: true });
  });

  const api = async (
    path: string,
    init: {
      method?: string;
      body?: unknown;
      role?: string;
      user?: string;
      workspace?: string;
      operator?: string;
    } = {}
  ) => {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    if (init.role) {
      headers.authorization = `Bearer ${accessToken(init.role, init.workspace ?? WS)}`;
      headers["x-accesskey-id"] = init.workspace ?? WS;
    }
    if (init.user)
      headers.authorization = `Bearer ${accessToken("WORKSPACE_OWNER", WS, init.user)}`;
    if (init.operator) headers["x-operator-key"] = init.operator;
    const res = await fetch(`${base}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body ? JSON.stringify(init.body) : undefined
    });
    const text = await res.text();
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(text);
    } catch {
      body = { text };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { status: res.status, body: body as any, headers: res.headers };
  };
  const current = async (workspace = WS) =>
    (await api("/api/regions/current", { role: "WORKSPACE_MEMBER", workspace }))
      .body;
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

  it("a user creates a private region (id, display name, SIP domain) and gets a one-time token", async function () {
    const created = await api("/api/regions", {
      method: "POST",
      user: OWNER,
      body: {
        id: "acme-hq",
        displayName: "Acme HQ",
        sipDomain: "SIP.acme.com"
      }
    });
    expect(created.status).to.equal(201);
    expect(created.body).to.include({ id: "acme-hq" });
    expect(created.body.token).to.equal(created.body.enrollmentToken);
    ref = created.body.ref;
    firstToken = created.body.token;
    expect(ref).to.match(/^rg_/);
    expect(Date.parse(created.body.expiresAt) - Date.now()).to.be.closeTo(
      24 * 3600e3,
      5000
    );
    const claims = runtime.signer!.verify(firstToken);
    expect(claims).to.include({ sub: ref, rid: "acme-hq", knd: "private" });
    const keys = await api("/.well-known/region-keys.json");
    expect((keys.body.keys as unknown[]).length).to.equal(1);
  });

  it("validates ids and SIP domains; ids are unique per owner", async function () {
    const post = (body: unknown, user = OWNER) =>
      api("/api/regions", { method: "POST", user, body });
    const bad = await post({ id: "1x", displayName: "x", sipDomain: "a.com" });
    expect(bad.body.error).to.equal("region_id_invalid");
    expect(
      (await post({ id: "us-hq", displayName: "x", sipDomain: "a.com" })).body
        .error
    ).to.equal("region_id_reserved");
    expect(
      (await post({ id: "default", displayName: "x", sipDomain: "a.com" })).body
        .error
    ).to.equal("region_id_reserved");
    expect(
      (await post({ id: "acme-lab", displayName: "x" })).body.error
    ).to.equal("sip_domain_invalid");
    const dup = await post({
      id: "acme-hq",
      displayName: "Again",
      sipDomain: "sip.acme.com"
    });
    expect(dup.status).to.equal(409);
    expect(dup.body.error).to.equal("region_id_taken");
    // Another user may use the same id.
    const other = await post(
      { id: "acme-hq", displayName: "Theirs", sipDomain: "sip.other.com" },
      "user-other"
    );
    expect(other.status).to.equal(201);
    const anon = await api("/api/regions", {
      method: "POST",
      body: { id: "anon-hq", displayName: "x", sipDomain: "a.com" }
    });
    expect(anon.status).to.equal(401);
  });

  it("lists public regions for everyone and the caller's own private regions with status", async function () {
    const anon = await api("/api/regions");
    expect(anon.body.items).to.deep.equal([
      {
        id: "default",
        name: "US East (N. Virginia)",
        displayName: "US East (N. Virginia)",
        kind: "public",
        default: true,
        status: "connected",
        state: "connected"
      }
    ]);
    const mine = await api("/api/regions", { user: OWNER });
    expect(mine.body.items).to.have.length(2);
    expect(mine.body.items[1]).to.include({
      ref,
      id: "acme-hq",
      displayName: "Acme HQ",
      kind: "private",
      status: "waiting",
      state: "waiting",
      sipDomain: "sip.acme.com",
      workspaces: 0
    });
    const theirs = await api("/api/regions", { user: "user-other" });
    expect(
      theirs.body.items.filter((i: { ref?: string }) => i.ref === ref)
    ).to.have.length(0);
  });

  it("new workspaces pick a public region or one of the owner's private regions (by id or ref)", async function () {
    expect(await hooks.resolveRegion(OWNER, undefined)).to.deep.equal({
      region: "default"
    });
    expect(await hooks.resolveRegion(OWNER, "acme-hq")).to.deep.equal({
      region: ref
    });
    expect(await hooks.resolveRegion(OWNER, ref)).to.deep.equal({
      region: ref
    });
    const refused = async (owner: string, r: string) =>
      hooks
        .resolveRegion(owner, r)
        .then(() => "ok")
        .catch((e) => e.code);
    expect(await refused("user-other", ref)).to.equal("region_invalid");
    expect(await refused(OWNER, "private")).to.equal("region_invalid");
    expect(await refused(OWNER, "us-east-1")).to.equal("region_invalid");
    bind(WS, ref, "Acme");
    bind(WS2, ref, "Acme Labs");
    bind(WS_PUBLIC, "default", "Public one");
  });

  it("refuses bad, expired and foreign tokens with the contract codes", async function () {
    expect((await enroll("not-a-jwt")).body.error).to.equal("token_invalid");
    expect((await enroll("not-a-jwt")).status).to.equal(400);
    const claims = {
      iss: "x",
      sub: ref,
      rid: "acme-hq",
      knd: "private",
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

  it("enrolls once and returns region-scoped credentials and the region's workspaces", async function () {
    const r = await enroll(firstToken);
    expect(r.status).to.equal(200);
    expect(r.body).to.include({
      regionRef: ref,
      regionId: "acme-hq",
      kind: "private",
      sipDomain: "sip.acme.com",
      leafUrl: "nats://leaf.example.com:7422",
      subjects: `region.${ref}.>`
    });
    expect(r.body.workspaceRefs).to.deep.equal([WS, WS2]);
    creds = String(r.body.credentials);
    expect(creds).to.contain("BEGIN NATS USER JWT");
    const replay = await enroll(firstToken);
    expect(replay.status).to.equal(409);
    expect(replay.body.error).to.equal("token_used");
  });

  let cell: FakeCell;

  it("serves one snapshot keyed by workspace, with domains under the region's SIP domain", async function () {
    cell = await FakeCell.connect(ref, HUB ? creds : undefined, hubUrl);
    cells.push(cell);
    const config = await cell.requestConfig(0);
    expect(config).to.include({
      type: "region.config",
      configVersion: 1,
      full: true
    });
    expect(config.region).to.deep.equal({
      ref,
      id: "acme-hq",
      kind: "private",
      sipDomain: "sip.acme.com",
      rootDomain: "fonoster.example"
    });
    expect(Object.keys(config.workspaces)).to.deep.equal([WS, WS2]);
    expect(config.workspaces[WS]).to.include({
      ref: `ref-${WS}`,
      name: "Acme",
      domain: "acme.sip.acme.com"
    });
    expect(config.workspaces[WS].kinds.apps[0]).to.include({ ref: "app-1" });
    expect(config.workspaces[WS].kinds.routr.domains).to.have.length(1);
    expect(config.workspaces[WS].kinds.catalog).to.equal(undefined);
    expect(config.catalog.map((c: { id: string }) => c.id)).to.deep.equal([
      "deepgram",
      "elevenlabs"
    ]);
    expect(await cell.requestConfig(1)).to.deep.equal({
      type: "region.config.current",
      configVersion: 1
    });
    await until(() => cell.needed.length > 0);
    expect(cell.neededMessages[0]).to.deep.equal({
      type: "region.secrets.needed",
      names: ["deepgram", "elevenlabs"],
      workspaces: {
        [WS]: ["deepgram", "elevenlabs"],
        [WS2]: ["deepgram", "elevenlabs"]
      }
    });

    cell.heartbeat({ configVersion: 1 });
    const region = await until(async () => {
      const r = await current();
      return r.status === "connected" ? r : undefined;
    });
    expect(region).to.include({
      ref,
      id: "acme-hq",
      kind: "private",
      displayName: "Acme HQ",
      sipDomain: "sip.acme.com",
      version: "0.27.0",
      activeCalls: 2,
      mediaNodes: 1,
      gateways: 1,
      workspaceDomain: "acme.sip.acme.com",
      monthlyFeeCents: 49900
    });
    expect(region.lastSeenAt).to.equal(region.lastHeartbeatAt);
    expect(region.components).to.deep.equal({
      mediaNodes: 1,
      gateways: 1,
      autopilot: true
    });
    expect(region.secrets).to.deep.equal([
      { name: "deepgram", usedBy: ["Reception"], set: true },
      { name: "elevenlabs", usedBy: ["Reception"], set: false }
    ]);
  });

  it("the owner's region view lists its workspaces and merges their secrets", async function () {
    const r = await api("/api/regions/acme-hq", { user: OWNER });
    expect(r.status).to.equal(200);
    expect(r.body.workspaces).to.deep.equal([
      {
        ref: `ref-${WS}`,
        accessKeyId: WS,
        name: "Acme",
        domain: "acme.sip.acme.com"
      },
      {
        ref: `ref-${WS2}`,
        accessKeyId: WS2,
        name: "Acme Labs",
        domain: "acme.sip.acme.com"
      }
    ]);
    expect(r.body.secrets[0]).to.deep.equal({
      name: "deepgram",
      usedBy: ["Acme Labs: Reception", "Acme: Reception"],
      set: true
    });
    expect((await api(`/api/regions/${ref}`, { user: OWNER })).status).to.equal(
      200
    );
    expect(
      (await api("/api/regions/acme-hq", { user: "user-other" })).body.ref
    ).not.to.equal(ref);
    expect(
      (await api(`/api/regions/${ref}`, { user: "user-other" })).status
    ).to.equal(404);
    const renamed = await api("/api/regions/acme-hq", {
      method: "PATCH",
      user: OWNER,
      body: { displayName: "Acme Headquarters", id: "nope" }
    });
    expect(renamed.body).to.include({
      id: "acme-hq",
      displayName: "Acme Headquarters"
    });
  });

  it("asks for endpoints, stores what the cell reports and re-asks when the hash changes", async function () {
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
      const r = await current();
      return r.endpoints?.sip?.length ? r : undefined;
    });
    expect(region.endpoints.sip).to.deep.equal([
      { host: "sip.acme.example", port: 5061, transport: "tls" }
    ]);
    expect(region.endpoints).to.deep.include({
      signalingAddresses: ["203.0.113.10"],
      mediaAddresses: ["203.0.113.11"],
      rtpPorts: { min: 20000, max: 20999 },
      sipDomain: "sip.acme.com"
    });
    const hash = endpointsHash(first);

    const asked = cell.endpointRequests;
    cell.heartbeat({ configVersion: 1, endpointsHash: hash });
    await wait(300);
    expect(cell.endpointRequests).to.equal(asked);

    cell.heartbeat({ configVersion: 1, endpointsHash: "changed" });
    await until(() => cell.endpointRequests > asked);
    cell.endpoints({ ...first, signalingAddresses: ["203.0.113.20"] });
    await until(
      async () =>
        (await current()).endpoints?.signalingAddresses?.[0] === "203.0.113.20"
    );

    cell.endpoints({ sip: [{ host: "", port: 0 }] });
    await wait(300);
    expect((await current()).endpoints.signalingAddresses).to.deep.equal([
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
        regionId: "acme-hq",
        kind: "private",
        sipDomain: "sip.acme.com",
        controlPlane: base,
        leafUrl: NATS_URL!,
        subjects: `region.${ref}.>`,
        configVersion: 1,
        enrolledAt: new Date().toISOString(),
        tokenId: "agent-test",
        publicKey: "x"
      } as never,
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
        const b = await current();
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

  it("publishes a new version when a workspace's config changes or a workspace joins", async function () {
    const before = cell.configs.length;
    kinds.apps = [...kinds.apps, { ref: "app-2", name: "After hours" }];
    runtime.onConfigChange(WS);
    runtime.onConfigChange(WS); // debounced into one version
    const msg = await until(() => cell.configs[before]);
    expect(msg).to.include({ configVersion: 2 });
    await wait(200);
    expect(cell.configs.length).to.equal(before + 1);
    // A workspace of a public region does not touch this region.
    runtime.onConfigChange(WS_PUBLIC);
    await wait(200);
    expect(cell.configs.length).to.equal(before + 1);
    // A new workspace joins: the region gets a snapshot with it.
    bind("WOacme3", ref, "Acme Three");
    hooks.workspaceChanged({ accessKeyId: "WOacme3", region: ref });
    const joined = await until(() => cell.configs[before + 1]);
    expect(Object.keys(joined.workspaces as object)).to.include("WOacme3");
    workspaces.delete("WOacme3");
    hooks.workspaceChanged({ accessKeyId: "WOacme3", region: ref });
    const left = await until(() => cell.configs[before + 2]);
    expect(Object.keys(left.workspaces as object)).not.to.include("WOacme3");
    expect(left.configVersion).to.equal(4);
  });

  it("degraded with a component down; unsupported pauses config sync", async function () {
    cell.heartbeat({
      configVersion: 4,
      components: { mediaNodes: 0, gateways: 1, autopilot: true }
    });
    await until(async () => (await current()).status === "degraded");
    cell.heartbeat({ configVersion: 4, version: "0.25.1" });
    const r = await until(async () => {
      const b = await current();
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
    cell.heartbeat({ configVersion: 4 });
    await until(async () => (await current()).status === "connected");
  });

  it("ingests index entries and usage only for workspaces the region serves", async function () {
    const entry = {
      callRef: "call-1",
      workspaceRef: WS2,
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
    const send = (subject: string, body: unknown) =>
      cell.nc.publish(
        `region.${ref}.${subject}`,
        sc.encode(JSON.stringify(body))
      );
    send("index", {
      ...entry,
      callRef: "call-foreign",
      workspaceRef: WS_PUBLIC
    });
    send("index", { ...entry, callRef: "call-1", workspaceRef: WS });
    send("index", { ...entry, callRef: "call-ws2" });
    send("usage", {
      type: "region.usage",
      workspaceRef: WS,
      minutes: 12.5,
      period: "2026-10"
    });
    send("usage", {
      type: "region.usage",
      workspaceRef: WS_PUBLIC,
      minutes: 99,
      period: "2026-10"
    });
    const row = await until(() =>
      db!.prisma.callRecord.findUnique({ where: { callRef: "call-1" } })
    );
    expect(row).to.include({ accessKeyId: WS, region: ref });
    const ws2 = await until(() =>
      db!.prisma.callRecord.findUnique({ where: { callRef: "call-ws2" } })
    );
    expect(ws2).to.include({ accessKeyId: WS2, region: ref });
    const usage = await until(() =>
      db!.prisma.regionUsage.findUnique({
        where: {
          regionRef_accessKeyId_period: {
            regionRef: ref,
            accessKeyId: WS,
            period: "2026-10"
          }
        }
      })
    );
    expect(usage.minutes).to.equal(12.5);
    await wait(200);
    expect(
      await db!.prisma.callRecord.findUnique({
        where: { callRef: "call-foreign" }
      })
    ).to.equal(null);
    expect(
      await db!.prisma.regionUsage.count({
        where: { regionRef: ref, accessKeyId: WS_PUBLIC }
      })
    ).to.equal(0);
  });

  it("relays a private recording through the control plane in order, naming the workspace", async function () {
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
      userRef: "user-WORKSPACE_ADMIN",
      workspaceRef: WS
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

  it("never hands a private region a workspace key (PR-20 is for public regions)", async function () {
    expect(await cell.secret(WS, "deepgram")).to.deep.equal({
      type: "region.secrets.error",
      code: "not_public"
    });
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
    await cell.close();
    const r = await api("/api/records/call-2/recording", {
      role: "WORKSPACE_ADMIN"
    });
    expect(r.status).to.equal(503);
    expect(r.body.error).to.equal("region_offline");
  });

  it("the owner re-issues a token; enrolling again revokes the previous credentials", async function () {
    expect(
      (
        await api(`/api/regions/${ref}/token`, {
          method: "POST",
          user: "user-other"
        })
      ).status
    ).to.equal(404);
    const reissued = await api("/api/regions/acme-hq/token", {
      method: "POST",
      user: OWNER
    });
    expect(reissued.status).to.equal(200);
    expect(reissued.body.token).to.be.a("string");
    const old = await FakeCell.connect(ref, HUB ? creds : undefined, hubUrl);
    cells.push(old);
    const r = await enroll(String(reissued.body.token));
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

  it("the owner disconnects: revoked now and back to waiting", async function () {
    const r = await api("/api/regions/acme-hq/disconnect", {
      method: "POST",
      user: OWNER
    });
    expect(r.status).to.equal(200);
    expect((await current()).status).to.equal("waiting");
    if (HUB)
      await until(
        () =>
          cell.errors.some((e) => e.startsWith("disconnect")) ||
          cell.nc.isClosed()
      );
    else expect(Object.keys(pushed.at(-1)!)).to.have.length(2);
  });

  it("delete is refused while workspaces use the region, then retires it", async function () {
    const inUse = await api("/api/regions/acme-hq", {
      method: "DELETE",
      user: OWNER
    });
    expect(inUse.status).to.equal(409);
    expect(inUse.body.error).to.equal("region_in_use");
    expect(inUse.body.message).to.contain("Acme").and.contain("Acme Labs");
    const t = await api("/api/regions/acme-hq/token", {
      method: "POST",
      user: OWNER
    });
    workspaces.delete(WS);
    workspaces.delete(WS2);
    const gone = await api("/api/regions/acme-hq", {
      method: "DELETE",
      user: OWNER
    });
    expect(gone.status).to.equal(200);
    const r = await enroll(String(t.body.token));
    expect(r.status).to.equal(409);
    expect(r.body.error).to.equal("region_deleted");
    const mine = await api("/api/regions", { user: OWNER });
    expect(mine.body.items.map((i: { id: string }) => i.id)).to.deep.equal([
      "default"
    ]);
    // The id is free again for this owner.
    const again = await api("/api/regions", {
      method: "POST",
      user: OWNER,
      body: {
        id: "acme-hq",
        displayName: "Acme HQ 2",
        sipDomain: "sip.acme.com"
      }
    });
    expect(again.status).to.equal(201);
  });

  it("a workspace on a configured public region sees it (with its endpoints)", async function () {
    const region = await current(WS_PUBLIC);
    expect(region).to.include({
      id: "default",
      kind: "public",
      status: "connected"
    });
    expect(region.endpoints).to.deep.equal(PUBLIC_ENDPOINTS);
  });

  describe("public regions through the operator key (PR-19, PR-20)", function () {
    let pubRef: string;
    let pubToken: string;
    let pubCell: FakeCell;
    const WS_EAST = "WOeast00000000000000000000000000";

    it("the admin API answers only to the operator key", async function () {
      expect((await api("/api/admin/regions")).status).to.equal(401);
      expect(
        (await api("/api/admin/regions", { operator: "wrong" })).status
      ).to.equal(401);
      expect(
        (
          await api("/api/admin/regions", {
            method: "POST",
            user: OWNER,
            body: { id: "us-east-2", displayName: "US East 2" }
          })
        ).status
      ).to.equal(401);
      const list = await api("/api/admin/regions", { operator: OPERATOR_KEY });
      expect(list.status).to.equal(200);
      expect(
        list.body.items.find((i: { id: string }) => i.id === "default")
      ).to.include({ configured: true });
    });

    it("creates an unpublished public region; it is not offered until published and connected", async function () {
      expect(
        (
          await api("/api/admin/regions", {
            method: "POST",
            operator: OPERATOR_KEY,
            body: { id: "acme-hq", displayName: "Nope" }
          })
        ).body.error
      ).to.equal("region_id_invalid");
      const created = await api("/api/admin/regions", {
        method: "POST",
        operator: OPERATOR_KEY,
        body: { id: "us-east-2", displayName: "US East (Ohio)" }
      });
      expect(created.status).to.equal(201);
      pubRef = created.body.ref;
      pubToken = created.body.token;
      expect(runtime.signer!.verify(pubToken)).to.include({
        rid: "us-east-2",
        knd: "public"
      });
      const offered = async () =>
        (await api("/api/regions")).body.items.map((i: { id: string }) => i.id);
      expect(await offered()).to.deep.equal(["default"]);
      const pub = await api("/api/admin/regions/us-east-2/publish", {
        method: "POST",
        operator: OPERATOR_KEY
      });
      expect(pub.body).to.include({ published: true, status: "waiting" });
      expect(await offered()).to.deep.equal(["default"]);

      const enrolled = await enroll(pubToken);
      expect(enrolled.body).to.include({
        kind: "public",
        regionId: "us-east-2"
      });
      pubCell = await FakeCell.connect(
        pubRef,
        HUB ? String(enrolled.body.credentials) : undefined,
        hubUrl
      );
      cells.push(pubCell);
      pubCell.heartbeat({ configVersion: 0 });
      await until(async () => (await offered()).includes("us-east-2"));
      expect(
        await hooks.resolveRegion("user-anyone", "us-east-2")
      ).to.deep.equal({ region: "us-east-2" });
    });

    it("serves every workspace that picked it and hands out their own keys per call", async function () {
      if (HUB) return this.skip();
      bind(WS_EAST, "us-east-2", "East");
      hooks.workspaceChanged({ accessKeyId: WS_EAST, region: "us-east-2" });
      const snap = await until(() =>
        pubCell.configs.find((c) =>
          Object.keys((c.workspaces ?? {}) as object).includes(WS_EAST)
        )
      );
      expect((snap.region as { kind: string }).kind).to.equal("public");
      const secret = await db!.prisma.secret.create({
        data: { accessKeyId: WS_EAST, name: "deepgram", secret: "dg-byo-key" }
      });
      await db!.prisma.workspaceProviderKey.create({
        data: {
          accessKeyId: WS_EAST,
          providerId: "deepgram",
          secretRef: secret.ref
        }
      });
      expect(await pubCell.secret(WS_EAST, "deepgram")).to.deep.equal({
        type: "region.secrets.value",
        workspaceRef: WS_EAST,
        provider: "deepgram",
        value: "dg-byo-key"
      });
      expect(await pubCell.secret(WS_EAST, "groq")).to.deep.equal({
        type: "region.secrets.none",
        workspaceRef: WS_EAST,
        provider: "groq"
      });
      expect(await pubCell.secret(WS_PUBLIC, "deepgram")).to.deep.equal({
        type: "region.secrets.error",
        code: "workspace_not_in_region"
      });
      expect((await current(WS_EAST)).id).to.equal("us-east-2");
    });

    it("revoke withdraws it from pickers and revokes its cell", async function () {
      const r = await api("/api/admin/regions/us-east-2/revoke", {
        method: "POST",
        operator: OPERATOR_KEY
      });
      expect(r.body).to.include({ published: false, status: "waiting" });
      const offered = (await api("/api/regions")).body.items.map(
        (i: { id: string }) => i.id
      );
      expect(offered).to.deep.equal(["default"]);
      expect(
        await db!.prisma.regionCredential.count({
          where: { regionRef: pubRef, revokedAt: null }
        })
      ).to.equal(0);
      const t = await api("/api/admin/regions/us-east-2/token", {
        method: "POST",
        operator: OPERATOR_KEY
      });
      expect(t.body.token).to.be.a("string");
    });
  });

  it("gives legacy private regions (old model) their workspace's owner", async function () {
    await db!.prisma.region.create({
      data: {
        ref: "rg_legacylegacyleg",
        id: "private-legacylegacyleg",
        kind: "private",
        displayName: "Private region",
        accessKeyId: "WOlegacy"
      }
    });
    workspaces.set("WOlegacy", {
      ref: "ref-legacy",
      accessKeyId: "WOlegacy",
      name: "Legacy",
      ownerRef: "user-legacy",
      region: "rg_legacylegacyleg"
    });
    expect(await runtime.service.migrateLegacyOwners()).to.equal(1);
    const mine = await api("/api/regions", { user: "user-legacy" });
    expect(mine.body.items[1]).to.include({
      ref: "rg_legacylegacyleg",
      workspaces: 1
    });
  });
});

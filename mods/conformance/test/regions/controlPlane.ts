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
import * as http from "http";
import { AddressInfo } from "net";
import express from "express";
import jwt from "jsonwebtoken";
import { NatsConnection } from "nats";
import { createRecordsRouter } from "../../../apiserver/src/records";
import {
  ConfigKinds,
  createRegionNatsAuth,
  createRegionSigner,
  createWorkspaceRegionHooks,
  generateRegionHub,
  RegionNatsAuth,
  RegionsRuntime,
  runRegions,
  SnapshotSources,
  WorkspaceInfo
} from "../../../apiserver/src/regions";
import { createTestDb, TestDb } from "../../../common/test/persistence/testDb";

// The real control plane's regions side (apiserver runRegions, its HTTP routers and the records
// relay) on a throwaway database, for the regions suite and the regions scenarios. With `hub` the
// credentials it issues are real NATS user JWTs of the hub's REGIONS account and revocations are
// pushed to that hub; without, it links over a plain NATS server and only records revocations.

export const OWNER = "user-WORKSPACE_OWNER";
export const WS = "WOacme00000000000000000000000000";

const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
const IDENTITY_PUBLIC = rsa.publicKey
  .export({ type: "spki", format: "pem" })
  .toString();
const ecPem = () =>
  generateKeyPairSync("ec", { namedCurve: "P-256" })
    .privateKey.export({ type: "pkcs8", format: "pem" })
    .toString();

/** An Identity access token for the test's own Identity key. */
export function accessToken(
  role: string,
  accessKeyId = WS,
  sub = `user-${role}`
) {
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

export type HubLink = {
  /** The control plane's REGIONS user on the hub. */
  nc: NatsConnection;
  /** The hub's system-account user (account updates). */
  system: NatsConnection;
  operatorSeed: string;
  accountSeed: string;
};

export type ControlPlaneOptions = {
  /** The control plane's link: a hub (real credentials) or a plain NATS connection. */
  hub?: HubLink;
  nc?: NatsConnection;
  /** The leaf-node URL put in enrollment tokens. */
  leafUrl: string;
  /** The version the control plane supports (cells within one minor release are supported). */
  currentVersion?: string;
};

export type ApiResult = {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  headers: { get(name: string): string | null };
};

export type ControlPlane = {
  base: string;
  db: TestDb;
  runtime: RegionsRuntime;
  /** What the snapshot sources serve; tests may change it, then call runtime.onConfigChange. */
  kinds: ConfigKinds;
  /** Revocation maps the plain-NATS control plane would have pushed to a hub. */
  pushed: Record<string, number>[];
  api(
    path: string,
    init?: {
      method?: string;
      body?: unknown;
      role?: string;
      user?: string;
      workspace?: string;
    }
  ): Promise<ApiResult>;
  /** Creates a private region owned by OWNER, binds WS to it and returns its ref and token. */
  createRegion(id: string): Promise<{ ref: string; token: string }>;
  /** POST /api/regions/enroll as a cell would (any 32-byte Ed25519 key). */
  enroll(token: string, publicKey?: string): Promise<ApiResult>;
  reissue(id: string): Promise<string>;
  disconnect(id: string): Promise<ApiResult>;
  /** The region's status as its owner sees it. */
  status(ref: string): Promise<string | undefined>;
  /** Signs an expired token for the region (a cell presenting a stale token). */
  expiredToken(ref: string, id: string): string;
  close(): Promise<void>;
};

export async function startControlPlane(
  options: ControlPlaneOptions
): Promise<ControlPlane | undefined> {
  const db = await createTestDb();
  if (!db) return undefined;

  const workspaces = new Map<string, WorkspaceInfo>();
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
    agents: [],
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
  const sources: SnapshotSources = {
    apps: async () => ({ apps: kinds.apps, agents: kinds.agents }),
    numbers: async () => kinds.numbers,
    routr: async () => kinds.routr,
    catalog: async (ids, providers) =>
      providers.map((id) => ({ kind: "provider", id, ids })),
    webhooks: async () => kinds.webhooks,
    recordingPolicy: async () => kinds.recordingPolicy
  };

  const pushed: Record<string, number>[] = [];
  let natsAuth: RegionNatsAuth | undefined;
  if (!options.hub) {
    const real = createRegionNatsAuth(generateRegionHub({}));
    natsAuth = {
      ...real,
      async pushRevocations(r) {
        pushed.push(r);
      }
    };
  }

  // The HTTP server listens first: enrollment tokens name the control plane's own URL.
  let app: express.Express | undefined;
  const server = http.createServer((req, res) => {
    if (app) app(req, res);
    else res.writeHead(503).end();
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const hooks = createWorkspaceRegionHooks([]);
  const signer = createRegionSigner({ privateKeyPem: ecPem() });
  const runtime = await runRegions(
    {
      public: [],
      allowInsecureLeaf: true,
      relay: {
        firstChunkTimeoutMs: 1500,
        idleTimeoutMs: 3000,
        maxBytes: 4 * 1024 * 1024
      },
      configDebounceMs: 50,
      privateRegionMonthlyFeeCents: 0
    },
    {
      db: db.prisma,
      identityPublicKey: IDENTITY_PUBLIC,
      issuer: base,
      defaultControlPlaneUrl: base,
      defaultLeafUrl: options.leafUrl,
      currentVersion: options.currentVersion ?? "0.27.0",
      sources,
      signer,
      natsAuth,
      natsSeeds: options.hub
        ? {
            operatorSeed: options.hub.operatorSeed,
            accountSeed: options.hub.accountSeed
          }
        : undefined,
      hubConnections: {
        nc: (options.hub?.nc ?? options.nc)!,
        system: options.hub?.system
      },
      rootDomain: () => "fonoster.example"
    }
  );
  hooks.attach(runtime);
  hooks.attachDirectory({
    workspace: async (id) => workspaces.get(id),
    inRegion: async (key) =>
      [...workspaces.values()].filter((w) => w.region === key)
  });
  app = express();
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

  const api: ControlPlane["api"] = async (path, init = {}) => {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    if (init.role) {
      headers.authorization = `Bearer ${accessToken(init.role, init.workspace ?? WS)}`;
      headers["x-accesskey-id"] = init.workspace ?? WS;
    }
    if (init.user)
      headers.authorization = `Bearer ${accessToken("WORKSPACE_OWNER", WS, init.user)}`;
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
    return { status: res.status, body, headers: res.headers };
  };

  return {
    base,
    db,
    runtime,
    kinds,
    pushed,
    api,
    async createRegion(id) {
      const created = await api("/api/regions", {
        method: "POST",
        user: OWNER,
        body: { id, displayName: id, sipDomain: `sip.${id}.example` }
      });
      if (created.status !== 201)
        throw new Error(`create region: ${JSON.stringify(created.body)}`);
      const ref = String(created.body.ref);
      workspaces.set(WS, {
        ref: `ref-${WS}`,
        accessKeyId: WS,
        name: "Acme",
        ownerRef: OWNER,
        region: ref
      });
      return { ref, token: String(created.body.token) };
    },
    enroll(token, publicKey = Buffer.alloc(32, 7).toString("base64url")) {
      return api("/api/regions/enroll", {
        method: "POST",
        body: {
          token,
          publicKey,
          version: options.currentVersion ?? "0.27.0",
          components: { roomrNodes: 1, appbridges: 1, autopilot: true }
        }
      });
    },
    async reissue(id) {
      const r = await api(`/api/regions/${id}/token`, {
        method: "POST",
        user: OWNER
      });
      if (r.status !== 200)
        throw new Error(`re-issue: ${JSON.stringify(r.body)}`);
      return String(r.body.token);
    },
    disconnect(id) {
      return api(`/api/regions/${id}/disconnect`, {
        method: "POST",
        user: OWNER
      });
    },
    async status(ref) {
      const mine = await api("/api/regions", { user: OWNER });
      const item = (mine.body.items as { ref?: string; status?: string }[])
        .filter(Boolean)
        .find((i) => i.ref === ref);
      return item?.status;
    },
    expiredToken(ref, id) {
      return runtime.signer!.sign(
        {
          iss: base,
          sub: ref,
          rid: id,
          knd: "private",
          cp: base,
          leaf: options.leafUrl,
          jti: `expired-${Date.now()}`
        },
        -5
      );
    },
    async close() {
      await runtime.close();
      await new Promise<void>((r) => server.close(() => r()));
      await db.drop();
    }
  };
}

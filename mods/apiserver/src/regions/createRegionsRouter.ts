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
import { createHash, timingSafeEqual } from "crypto";
import { getLogger } from "@fonoster/logger";
import express, { Request, Response, Router } from "express";
import { ConfigSync } from "./configSync";
import { RegionEndpoints } from "./endpoints";
import { RegionSigner } from "./enrollmentToken";
import {
  Caller,
  createHttpAuth,
  createUserAuth,
  optionalUser,
  UserCaller
} from "./httpAuth";
import { RegionService } from "./service";
import {
  Components,
  PublicRegion,
  RegionError,
  RegionRow,
  RegionStatus,
  WorkspaceInfo
} from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/** A region in a list (contract §0 RegionSummary). */
export type RegionSummary = {
  ref?: string;
  id: string;
  name: string;
  displayName: string;
  kind: "public" | "private";
  default: boolean;
  status: RegionStatus;
  state: RegionStatus;
  sipDomain?: string;
  /** Owner and admin views: how many workspaces use it. */
  workspaces?: number;
  published?: boolean;
};

export type RegionViewOptions = {
  configSync?: ConfigSync;
  /** Owner views list the workspaces the region serves. */
  showWorkspaces?: boolean;
  /** `/current`: secrets and the domain of this workspace only. */
  workspace?: WorkspaceInfo;
  monthlyFeeCents?: number | null;
  isDefault?: boolean;
};

async function workspaceDomains(
  row: RegionRow,
  bound: WorkspaceInfo[],
  configSync: ConfigSync
) {
  const out = new Map<string, string | null>();
  if (!bound.length) return out;
  const snap = await configSync.snapshot(row).catch(() => undefined);
  for (const w of bound)
    out.set(w.accessKeyId, snap?.workspaces[w.accessKeyId]?.domain ?? null);
  return out;
}

/** The region view (contract §0 `Region`; the dashboard's shape). */
export async function regionView(
  row: RegionRow,
  service: RegionService,
  options: RegionViewOptions = {}
) {
  const s = service.statusOf(row);
  const c = (row.components ?? {}) as Partial<Components>;
  const { configSync } = options;
  const needed = configSync
    ? (await configSync.secretsNeeded(row, options.workspace?.accessKeyId))
        .secrets
    : [];
  const set = new Set(row.secretsSet ?? []);
  const bound = options.showWorkspaces ? await service.workspaces(row) : [];
  const forDomains = options.workspace ? [options.workspace] : bound;
  const domains = configSync
    ? await workspaceDomains(row, forDomains, configSync)
    : new Map<string, string | null>();
  const endpoints = row.endpoints
    ? {
        ...(row.endpoints as RegionEndpoints),
        sipDomain: row.sipDomain ?? undefined
      }
    : row.sipDomain
      ? {
          sip: [],
          signalingAddresses: [],
          mediaAddresses: [],
          sipDomain: row.sipDomain
        }
      : undefined;
  const lastSeenAt = row.lastHeartbeatAt?.toISOString();
  const minutesThisMonth =
    row.kind === "private"
      ? await service
          .minutesThisMonth(row, options.workspace?.accessKeyId)
          .catch(() => undefined)
      : undefined;
  return {
    ref: row.ref,
    id: row.id,
    kind: row.kind as "public" | "private",
    name: row.displayName || row.id,
    displayName: row.displayName || row.id,
    default: !!options.isDefault,
    sipDomain: row.sipDomain ?? undefined,
    ownerRef: row.ownerRef ?? undefined,
    published: row.kind === "public" ? row.published : undefined,
    status: s.status,
    state: s.status,
    reason: s.reason,
    unsupportedReason: s.status === "unsupported" ? s.reason : undefined,
    requiredVersion: s.requiredVersion,
    version: row.version ?? undefined,
    lastHeartbeatAt: lastSeenAt,
    lastSeenAt,
    enrolledAt: row.enrolledAt?.toISOString(),
    components: {
      mediaNodes: c.mediaNodes ?? 0,
      gateways: c.gateways ?? 0,
      autopilot: c.autopilot ?? false
    },
    mediaNodes: c.mediaNodes ?? 0,
    gateways: c.gateways ?? 0,
    activeCalls: row.activeCalls,
    configVersion: row.configVersion,
    reportedConfigVersion: row.reportedConfig,
    workspaces: options.showWorkspaces
      ? bound.map((w) => ({
          ref: w.ref,
          accessKeyId: w.accessKeyId,
          name: w.name,
          domain: domains.get(w.accessKeyId) ?? undefined
        }))
      : undefined,
    workspaceDomain: options.workspace
      ? (domains.get(options.workspace.accessKeyId) ?? undefined)
      : undefined,
    secretsNeeded: needed.map((n) => n.name),
    secretsSet: [...set].sort(),
    secrets: needed.map((n) => ({
      name: n.name,
      usedBy: n.usedBy,
      set: set.has(n.name)
    })),
    endpoints,
    monthlyFeeCents:
      row.kind === "private" ? (options.monthlyFeeCents ?? null) : null,
    /** Usage shown with the fee, not billed (PR-11). */
    minutesThisMonth
  };
}

/** A configured public region's view (always connected; contract §0, §4). */
export function configuredView(r: PublicRegion) {
  return {
    ref: r.id,
    id: r.id,
    kind: "public" as const,
    name: r.name,
    displayName: r.name,
    default: !!r.default,
    status: "connected" as const,
    state: "connected" as const,
    components: { mediaNodes: 0, gateways: 0, autopilot: false },
    secretsNeeded: [] as string[],
    secretsSet: [] as string[],
    secrets: [] as unknown[],
    endpoints: r.endpoints,
    monthlyFeeCents: null
  };
}

const OFFERED: RegionStatus[] = ["connected", "degraded"];

export function summary(
  row: RegionRow,
  service: RegionService,
  isDefault = false,
  workspaces?: number
): RegionSummary {
  const status = service.statusOf(row).status;
  return {
    ref: row.ref,
    id: row.id,
    name: row.displayName || row.id,
    displayName: row.displayName || row.id,
    kind: row.kind as "public" | "private",
    default: isDefault,
    status,
    state: status,
    sipDomain: row.sipDomain ?? undefined,
    ...(workspaces !== undefined ? { workspaces } : {}),
    ...(row.kind === "public" ? { published: row.published } : {})
  };
}

/**
 * The public regions a new workspace can pick (PR-19, contract §0): configured ones (the fallback;
 * always offered) and enrolled rows that are published and connected. A row with a configured id
 * replaces the configured entry while it is offered.
 */
export async function offeredPublicRegions(
  service: RegionService,
  configured: PublicRegion[]
): Promise<RegionSummary[]> {
  const rows = await service.listPublicRows();
  const offered = rows.filter(
    (r) => r.published && OFFERED.includes(service.statusOf(r).status)
  );
  const out: RegionSummary[] = [];
  for (const c of configured) {
    const row = offered.find((r) => r.id === c.id);
    out.push(
      row
        ? summary(row, service, !!c.default)
        : {
            id: c.id,
            name: c.name,
            displayName: c.name,
            kind: "public",
            default: !!c.default,
            status: "connected",
            state: "connected"
          }
    );
  }
  for (const row of offered)
    if (!configured.some((c) => c.id === row.id))
      out.push(summary(row, service, false));
  return out;
}

const sha = (v: string) => createHash("sha256").update(v).digest();

/**
 * Regions over HTTP (on the HTTP bridge; contract §0):
 *
 *   GET    /.well-known/region-keys.json       region-signing public keys (JWK Set)
 *   POST   /api/regions/enroll                 a region's enrollment (§2; the token is the auth)
 *   GET    /api/regions                        offered public regions + the caller's private ones
 *   POST   /api/regions                        create a private region (user)
 *   GET    /api/regions/current                the workspace's region (any member)
 *   GET    /api/regions/:region                one region (owner, or a public one)
 *   PATCH  /api/regions/:region                display name (owner)
 *   POST   /api/regions/:region/token          re-issue an enrollment token (owner)
 *   POST   /api/regions/:region/disconnect     revoke the cell (owner)
 *   DELETE /api/regions/:region                delete (owner; refused while in use)
 *   /api/admin/regions…                        public regions (operator key only, PR-19)
 */
export function createRegionsRouter(deps: {
  service: RegionService;
  configSync?: ConfigSync;
  signer?: RegionSigner;
  publicRegions: PublicRegion[];
  identityPublicKey: string;
  /** PR-19: the only credential of the admin API; absent turns it off. */
  operatorKey?: string;
  monthlyFeeCents?: number;
}): Router {
  const { service } = deps;
  const router = express.Router();
  const workspaceAuth = createHttpAuth(deps.identityPublicKey);
  const userAuth = createUserAuth(deps.identityPublicKey);
  const maybeUser = optionalUser(deps.identityPublicKey);
  const caller = (res: Response) => res.locals.caller as Caller;
  const user = (res: Response) => res.locals.user as UserCaller;
  const json = express.json({ limit: "64kb" });
  const handle =
    (fn: (req: Request, res: Response) => Promise<unknown>) =>
    (req: Request, res: Response) =>
      fn(req, res).catch((e) => {
        if (e instanceof RegionError)
          return res
            .status(e.status)
            .json({ error: e.code, message: e.message });
        logger.error(`regions API: ${(e as Error).message}`);
        res.status(500).json({ error: "internal" });
      });
  const defaultId = () =>
    (deps.publicRegions.find((p) => p.default) ?? deps.publicRegions[0])?.id;
  const view = (row: RegionRow, extra: RegionViewOptions = {}) =>
    regionView(row, service, {
      configSync: deps.configSync,
      monthlyFeeCents: deps.monthlyFeeCents ?? null,
      isDefault: row.kind === "public" && row.id === defaultId(),
      ...extra
    });

  router.get("/.well-known/region-keys.json", (_req, res) => {
    res.setHeader("cache-control", "public, max-age=300");
    res.json(deps.signer ? deps.signer.jwks() : { keys: [] });
  });

  router.post(
    "/api/regions/enroll",
    json,
    handle(async (req, res) => {
      res.json(await service.enroll(req.body ?? {}));
    })
  );

  // ---- Admin API: the operator key only (PR-19) ------------------------------------------
  const operator = (req: Request, res: Response) => {
    if (!deps.operatorKey) {
      res.status(404).json({ error: "not_found" });
      return false;
    }
    const given = String(req.headers["x-operator-key"] ?? "");
    if (!given || !timingSafeEqual(sha(given), sha(deps.operatorKey))) {
      res.status(401).json({
        error: "operator_key_invalid",
        message: "the region admin API needs the operator key (x-operator-key)"
      });
      return false;
    }
    return true;
  };
  const adminRow = async (req: Request) => {
    const row = await service.anyRow(String(req.params.region));
    if (!row) throw new RegionError(404, "region_not_found", "no such region");
    return row;
  };

  router.get(
    "/api/admin/regions",
    handle(async (req, res) => {
      if (!operator(req, res)) return;
      const rows = await service.listAll();
      const items: unknown[] = [];
      for (const row of rows)
        items.push({
          ...(await view(row)),
          workspaceCount: (await service.workspaces(row)).length
        });
      for (const c of deps.publicRegions)
        if (!rows.some((r) => r.kind === "public" && r.id === c.id))
          items.push({ ...configuredView(c), configured: true });
      res.json({ items });
    })
  );

  router.post(
    "/api/admin/regions",
    json,
    handle(async (req, res) => {
      if (!operator(req, res)) return;
      const b = req.body ?? {};
      res.status(201).json(
        await service.createPublicRegion({
          id: b.id,
          displayName: b.displayName ?? b.name,
          sipDomain: b.sipDomain,
          endpoints: b.endpoints
        })
      );
    })
  );

  router.post(
    "/api/admin/regions/:region/token",
    handle(async (req, res) => {
      if (!operator(req, res)) return;
      res.json(await service.reissueToken(await adminRow(req)));
    })
  );

  router.post(
    "/api/admin/regions/:region/publish",
    handle(async (req, res) => {
      if (!operator(req, res)) return;
      const row = await service.publish(await adminRow(req));
      logger.info(`public region ${row.id} published`);
      res.json(await view(row));
    })
  );

  router.post(
    "/api/admin/regions/:region/revoke",
    handle(async (req, res) => {
      if (!operator(req, res)) return;
      const row = await service.revoke(await adminRow(req));
      logger.info(`public region ${row.id} revoked`);
      res.json(await view(row));
    })
  );

  // ---- User API -----------------------------------------------------------------------------
  router.get(
    "/api/regions",
    maybeUser,
    handle(async (_req, res) => {
      const items: RegionSummary[] = await offeredPublicRegions(
        service,
        deps.publicRegions
      );
      const u = res.locals.user as UserCaller | undefined;
      if (u)
        for (const row of await service.listOwned(u.userRef))
          items.push(
            summary(row, service, false, (await service.workspaces(row)).length)
          );
      res.json({ items });
    })
  );

  router.post(
    "/api/regions",
    userAuth,
    json,
    handle(async (req, res) => {
      const b = req.body ?? {};
      res.status(201).json(
        await service.createRegion(user(res).userRef, {
          id: b.id,
          displayName: b.displayName ?? b.name,
          sipDomain: b.sipDomain
        })
      );
    })
  );

  router.get(
    "/api/regions/current",
    workspaceAuth,
    handle(async (_req, res) => {
      const accessKeyId = caller(res).accessKeyId;
      const ws = await service.directory.workspace(accessKeyId);
      const key = ws?.region ?? defaultId() ?? "default";
      const row = await service.regionByKey(key);
      if (row && ws) return res.json(await view(row, { workspace: ws }));
      const configured =
        deps.publicRegions.find((p) => p.id === key) ??
        deps.publicRegions.find((p) => p.default) ??
        deps.publicRegions[0];
      res.json(configuredView(configured));
    })
  );

  /** The caller's private region; for reads, also a public region. */
  const regionFor = async (req: Request, res: Response, write: boolean) => {
    const idOrRef = String(req.params.region);
    try {
      return await service.owned(user(res).userRef, idOrRef);
    } catch (e) {
      if (write) throw e;
      const row = await service.publicRow(idOrRef);
      if (row) return row;
      throw e;
    }
  };

  router.get(
    "/api/regions/:region",
    userAuth,
    handle(async (req, res) => {
      const idOrRef = String(req.params.region);
      let row: RegionRow;
      try {
        row = await regionFor(req, res, false);
      } catch (e) {
        const c = deps.publicRegions.find((p) => p.id === idOrRef);
        if (c) return res.json(configuredView(c));
        throw e;
      }
      res.json(await view(row, { showWorkspaces: row.kind === "private" }));
    })
  );

  router.patch(
    "/api/regions/:region",
    userAuth,
    json,
    handle(async (req, res) => {
      const row = await regionFor(req, res, true);
      const updated = await service.updateDisplayName(
        row,
        req.body?.displayName ?? req.body?.name
      );
      res.json(await view(updated, { showWorkspaces: true }));
    })
  );

  router.post(
    "/api/regions/:region/token",
    userAuth,
    handle(async (req, res) => {
      res.json(await service.reissueToken(await regionFor(req, res, true)));
    })
  );

  router.post(
    "/api/regions/:region/disconnect",
    userAuth,
    handle(async (req, res) => {
      await service.disconnect(await regionFor(req, res, true));
      res.json({ status: "waiting" });
    })
  );

  router.delete(
    "/api/regions/:region",
    userAuth,
    handle(async (req, res) => {
      const row = await regionFor(req, res, true);
      await service.deleteRegion(row);
      res.json({ ref: row.ref });
    })
  );

  return router;
}

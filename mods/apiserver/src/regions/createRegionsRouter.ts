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
import { getLogger } from "@fonoster/logger";
import express, { Request, Response, Router } from "express";
import { ConfigSync } from "./configSync";
import { RegionSigner } from "./enrollmentToken";
import { ADMIN_ROLES, Caller, createHttpAuth } from "./httpAuth";
import { RegionService } from "./service";
import { Components, PublicRegion, RegionError, RegionRow } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/** The region view the dashboard shows (RU-B1 shape plus the contract's raw fields). */
export async function regionView(
  row: RegionRow,
  service: RegionService,
  configSync?: ConfigSync
) {
  const s = service.statusOf(row);
  const c = (row.components ?? {}) as Partial<Components>;
  const needed = configSync
    ? await configSync.secretsNeeded(row.accessKeyId)
    : [];
  const set = new Set(row.secretsSet ?? []);
  return {
    ref: row.ref,
    kind: "private" as const,
    name: "Private region",
    status: s.status,
    state: s.status,
    reason: s.reason,
    unsupportedReason: s.status === "unsupported" ? s.reason : undefined,
    requiredVersion: s.requiredVersion,
    version: row.version ?? undefined,
    lastHeartbeatAt: row.lastHeartbeatAt?.toISOString(),
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
    secretsNeeded: needed.map((n) => n.name),
    secretsSet: [...set].sort(),
    secrets: needed.map((n) => ({
      name: n.name,
      usedBy: n.usedBy,
      set: set.has(n.name)
    }))
  };
}

/**
 * Regions over HTTP (on the HTTP bridge):
 *
 *   GET  /.well-known/region-keys.json     the region-signing public keys (JWK Set)
 *   POST /api/regions/enroll               a cell's enrollment (contract §2; the token is the auth)
 *   GET  /api/regions                      public regions {items:[{id,name,default}]}
 *   GET  /api/regions/current              the workspace's region and status
 *   POST /api/regions/current/token        re-issue an enrollment token (owner, admin)
 *   POST /api/regions/current/disconnect   revoke the cell; back to waiting (owner, admin)
 */
export function createRegionsRouter(deps: {
  service: RegionService;
  configSync?: ConfigSync;
  signer?: RegionSigner;
  publicRegions: PublicRegion[];
  identityPublicKey: string;
}): Router {
  const { service } = deps;
  const router = express.Router();
  const auth = createHttpAuth(deps.identityPublicKey);
  const caller = (res: Response) => res.locals.caller as Caller;
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
  const admin = (res: Response) => {
    if (ADMIN_ROLES.includes(caller(res).role)) return true;
    res.status(403).json({
      error: "permission_denied",
      message: "only the workspace owner or an admin can do this"
    });
    return false;
  };

  router.get("/.well-known/region-keys.json", (_req, res) => {
    res.setHeader("cache-control", "public, max-age=300");
    res.json(deps.signer ? deps.signer.jwks() : { keys: [] });
  });

  router.post(
    "/api/regions/enroll",
    express.json({ limit: "64kb" }),
    handle(async (req, res) => {
      res.json(await service.enroll(req.body ?? {}));
    })
  );

  router.get("/api/regions", (_req, res) => {
    res.json({
      items: deps.publicRegions.map((r) => ({
        id: r.id,
        name: r.name,
        default: !!r.default
      }))
    });
  });

  router.get(
    "/api/regions/current",
    auth,
    handle(async (_req, res) => {
      const row = await service.byWorkspace(caller(res).accessKeyId);
      if (!row) {
        // A public workspace (one public region at launch, PR-10).
        const r =
          deps.publicRegions.find((p) => p.default) ?? deps.publicRegions[0];
        return res.json({
          ref: r?.id,
          kind: "public",
          name: r?.name,
          status: "connected",
          state: "connected",
          secrets: []
        });
      }
      res.json(await regionView(row, service, deps.configSync));
    })
  );

  router.post(
    "/api/regions/current/token",
    auth,
    handle(async (_req, res) => {
      if (!admin(res)) return;
      res.json(await service.reissueToken(caller(res).accessKeyId));
    })
  );

  router.post(
    "/api/regions/current/disconnect",
    auth,
    handle(async (_req, res) => {
      if (!admin(res)) return;
      await service.disconnect(caller(res).accessKeyId);
      res.json({ status: "waiting" });
    })
  );

  return router;
}

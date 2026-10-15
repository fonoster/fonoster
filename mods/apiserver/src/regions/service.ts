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
import { randomBytes, randomUUID } from "crypto";
import { getLogger } from "@fonoster/logger";
import { endpointsHash, normalizeEndpoints } from "./endpoints";
import { EnrollmentTokenError, RegionSigner } from "./enrollmentToken";
import { RegionNatsAuth } from "./natsAuth";
import { regionStatus } from "./status";
import {
  Components,
  Heartbeat,
  RegionError,
  RegionRow,
  RegionsDb,
  subjects
} from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const B32 = "abcdefghijklmnopqrstuvwxyz234567";

/** `rg_` + 16 lowercase base32 characters (80 random bits). */
export function newRegionRef() {
  const bytes = randomBytes(10);
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return `rg_${out}`;
}

export type EnrollRequest = {
  token?: string;
  publicKey?: string;
  version?: string;
  components?: Partial<Components>;
};

export type RegionServiceConfig = {
  /** `iss`: the control plane URL. */
  issuer: string;
  /** `cp`: the HTTPS base URL cells enroll at. */
  controlPlaneUrl: string;
  /** `leaf`: the hub's leaf-node URL. */
  leafUrl: string;
  /** This control plane's release; cells older than its previous minor are unsupported. */
  currentVersion: string;
  offlineAfterMs?: number;
};

/** Publishes on the region hub (the link); a no-op without one. */
export type LinkPublisher = (subject: string, payload: unknown) => void;

/**
 * Private regions on the control plane (tasks 2.1, 2.2, 2.3, 2.6): region rows, enrollment tokens,
 * enrollment, revocation, heartbeats and the status the dashboard shows.
 */
export function createRegionService(deps: {
  db: RegionsDb;
  signer?: RegionSigner;
  natsAuth?: RegionNatsAuth;
  publish?: LinkPublisher;
  config: RegionServiceConfig;
  now?: () => Date;
}) {
  const { db, config } = deps;
  const now = deps.now ?? (() => new Date());
  const publish: LinkPublisher = deps.publish ?? (() => undefined);

  const signer = () => {
    if (!deps.signer)
      throw new RegionError(
        503,
        "regions_unavailable",
        "private regions are not configured on this control plane (regions.signingKey)"
      );
    return deps.signer;
  };
  const natsAuth = () => {
    if (!deps.natsAuth)
      throw new RegionError(
        503,
        "regions_unavailable",
        "the region hub is not configured on this control plane (regions.hub)"
      );
    return deps.natsAuth;
  };

  const live = async (accessKeyId: string): Promise<RegionRow> => {
    const row = await db.region.findUnique({ where: { accessKeyId } });
    if (!row || row.deletedAt)
      throw new RegionError(
        404,
        "region_not_found",
        "the workspace has no private region"
      );
    return row;
  };

  const issueToken = async (row: RegionRow) => {
    const jti = randomUUID();
    const token = signer().sign({
      iss: config.issuer,
      sub: row.ref,
      wsp: row.accessKeyId,
      cp: config.controlPlaneUrl,
      leaf: config.leafUrl,
      jti
    });
    const claims = signer().verify(token);
    const expiresAt = new Date(claims.exp * 1000);
    await db.regionToken.create({
      data: {
        jti,
        regionRef: row.ref,
        issuedAt: new Date(claims.iat * 1000),
        expiresAt
      }
    });
    return { enrollmentToken: token, expiresAt: expiresAt.toISOString() };
  };

  /** Revokes every live credential of a region and pushes the revocations to the hub. */
  const revokeAll = async (regionRef: string, reason: string) => {
    const live = await db.regionCredential.findMany({
      where: { regionRef, revokedAt: null }
    });
    if (!live.length) return 0;
    publish(subjects(regionRef).revoked, { type: "region.revoked", reason });
    await db.regionCredential.updateMany({
      where: { regionRef, revokedAt: null },
      data: { revokedAt: now() }
    });
    await pushRevocations();
    return live.length;
  };

  const pushRevocations = async () => {
    const revoked: { userPublicKey: string; revokedAt: Date }[] =
      await db.regionCredential.findMany({
        where: { revokedAt: { not: null } },
        select: { userPublicKey: true, revokedAt: true }
      });
    const map: Record<string, number> = {};
    for (const r of revoked)
      map[r.userPublicKey] = Math.ceil(r.revokedAt.getTime() / 1000);
    await natsAuth().pushRevocations(map);
  };

  return {
    /** Creates the private region of a new workspace and its first token (PR-2). */
    async createPrivateRegion(accessKeyId: string) {
      signer();
      const row: RegionRow = await db.region.create({
        data: { ref: newRegionRef(), accessKeyId, state: "waiting" }
      });
      const token = await issueToken(row);
      logger.info(`private region ${row.ref} created for ${accessKeyId}`);
      return { regionRef: row.ref, ...token };
    },

    /** A new enrollment token; the current cell keeps working until a cell enrolls with it. */
    async reissueToken(accessKeyId: string) {
      return issueToken(await live(accessKeyId));
    },

    /** Exchanges a one-time token for cell credentials (contract §2). */
    async enroll(body: EnrollRequest) {
      if (!body?.token || typeof body.token !== "string")
        throw new RegionError(400, "token_invalid", "token is required");
      let claims;
      try {
        claims = signer().verify(body.token);
      } catch (e) {
        if (e instanceof EnrollmentTokenError)
          throw new RegionError(e.code === "token_expired" ? 410 : 400, e.code);
        throw e;
      }
      const publicKey = String(body.publicKey ?? "");
      if (Buffer.from(publicKey, "base64url").length !== 32)
        throw new RegionError(
          400,
          "bad_request",
          "publicKey must be the cell's Ed25519 public key (32 bytes, base64url)"
        );
      const tokenRow = await db.regionToken.findUnique({
        where: { jti: claims.jti }
      });
      if (!tokenRow || tokenRow.regionRef !== claims.sub)
        throw new RegionError(400, "token_invalid", "unknown token");
      if (tokenRow.usedAt) throw new RegionError(409, "token_used");
      const row: RegionRow | null = await db.region.findUnique({
        where: { ref: claims.sub }
      });
      if (!row) throw new RegionError(404, "region_not_found");
      if (row.deletedAt) throw new RegionError(409, "workspace_deleted");
      if (row.accessKeyId !== claims.wsp)
        throw new RegionError(
          400,
          "token_invalid",
          "token names another workspace"
        );
      natsAuth();
      // Spend the token first: of two concurrent enrollments only one gets here.
      const spent = await db.regionToken.updateMany({
        where: { jti: claims.jti, usedAt: null },
        data: { usedAt: now() }
      });
      if (spent.count !== 1) throw new RegionError(409, "token_used");

      await revokeAll(row.ref, "re-enrolled");
      const user = natsAuth().issue(row.ref);
      await db.regionCredential.create({
        data: {
          userPublicKey: user.publicKey,
          regionRef: row.ref,
          issuedAt: now()
        }
      });
      const components = {
        mediaNodes: Number(body.components?.mediaNodes ?? 0),
        gateways: Number(body.components?.gateways ?? 0),
        autopilot: Boolean(body.components?.autopilot)
      };
      const updated: RegionRow = await db.region.update({
        where: { ref: row.ref },
        data: {
          state: "enrolled",
          cellPublicKey: publicKey,
          version: body.version ? String(body.version) : null,
          components,
          enrolledAt: now(),
          lastHeartbeatAt: null,
          reportedConfig: 0,
          endpointsHash: null
        }
      });
      logger.info(`region ${row.ref} enrolled (cell ${body.version ?? "?"})`);
      return {
        regionRef: row.ref,
        workspaceRef: row.accessKeyId,
        leafUrl: claims.leaf,
        credentials: user.creds,
        subjects: subjects(row.ref).all,
        configVersion: updated.configVersion
      };
    },

    /** Revokes the cell now and puts the region back in `waiting`. */
    async disconnect(accessKeyId: string) {
      const row = await live(accessKeyId);
      await revokeAll(row.ref, "disconnected");
      await db.region.update({
        where: { ref: row.ref },
        data: {
          state: "waiting",
          cellPublicKey: null,
          lastHeartbeatAt: null,
          enrolledAt: null,
          // The next cell's heartbeat then always asks for fresh endpoints.
          endpointsHash: null
        }
      });
      logger.info(`region ${row.ref} disconnected`);
    },

    /** The workspace was deleted: revoke the cell and refuse further enrollments. */
    async deleteForWorkspace(accessKeyId: string) {
      const row: RegionRow | null = await db.region.findUnique({
        where: { accessKeyId }
      });
      if (!row || row.deletedAt) return;
      await db.region.update({
        where: { ref: row.ref },
        data: { deletedAt: now(), state: "waiting" }
      });
      await revokeAll(row.ref, "workspace deleted").catch((e) =>
        logger.error(`could not revoke region ${row.ref}: ${e.message}`)
      );
    },

    /** Records a heartbeat; returns the row, or undefined when the region is not enrolled. */
    async heartbeat(regionRef: string, hb: Partial<Heartbeat>) {
      const row: RegionRow | null = await db.region.findUnique({
        where: { ref: regionRef }
      });
      if (!row || row.deletedAt || row.state !== "enrolled") return undefined;
      const c = hb.components ?? ({} as Partial<Components>);
      return (await db.region.update({
        where: { ref: regionRef },
        data: {
          version: hb.version ? String(hb.version) : row.version,
          components: {
            mediaNodes: Number(c.mediaNodes ?? 0),
            gateways: Number(c.gateways ?? 0),
            autopilot: Boolean(c.autopilot)
          },
          activeCalls: Number(hb.activeCalls ?? 0),
          secretsSet: Array.isArray(hb.secretsSet)
            ? hb.secretsSet.map(String)
            : [],
          reportedConfig: Number(hb.configVersion ?? 0),
          lastHeartbeatAt: now()
        }
      })) as RegionRow;
    },

    /** Stores the connection details a cell reported (contract §3); undefined when ignored. */
    async reportEndpoints(regionRef: string, body: unknown) {
      const row: RegionRow | null = await db.region.findUnique({
        where: { ref: regionRef }
      });
      if (!row || row.deletedAt || row.state !== "enrolled") return undefined;
      const endpoints = normalizeEndpoints(body);
      if (!endpoints) return undefined;
      return (await db.region.update({
        where: { ref: regionRef },
        data: {
          endpoints: { ...endpoints, updatedAt: now().toISOString() },
          endpointsHash: endpointsHash(endpoints),
          endpointsAt: now()
        }
      })) as RegionRow;
    },

    /** Whether to ask the cell for its endpoints after this heartbeat (RE-B2). */
    needsEndpoints(row: RegionRow, hb: Partial<Heartbeat>) {
      if (typeof hb.endpointsHash === "string" && hb.endpointsHash)
        return hb.endpointsHash !== row.endpointsHash;
      return !row.endpoints;
    },

    statusOf(row: RegionRow) {
      return regionStatus(row, {
        now: now(),
        currentVersion: config.currentVersion,
        offlineAfterMs: config.offlineAfterMs
      });
    },

    async byRef(regionRef: string): Promise<RegionRow | undefined> {
      const row = await db.region.findUnique({ where: { ref: regionRef } });
      return row && !row.deletedAt ? row : undefined;
    },

    async byWorkspace(accessKeyId: string): Promise<RegionRow | undefined> {
      const row = await db.region.findUnique({ where: { accessKeyId } });
      return row && !row.deletedAt ? row : undefined;
    },

    /** Re-pushes every revocation (on startup, so a restarted hub converges). */
    pushRevocations
  };
}

export type RegionService = ReturnType<typeof createRegionService>;

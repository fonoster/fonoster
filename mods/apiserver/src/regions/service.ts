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
import {
  checkDisplayName,
  checkPrivateRegionId,
  checkPublicRegionId,
  checkSipDomain
} from "./ids";
import { RegionNatsAuth } from "./natsAuth";
import { regionStatus } from "./status";
import {
  Components,
  Heartbeat,
  REGION_REF,
  RegionError,
  regionKey,
  RegionRow,
  RegionsDb,
  subjects,
  WorkspaceDirectory,
  WorkspaceInfo
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

export type CreateRegionInput = {
  id?: unknown;
  displayName?: unknown;
  sipDomain?: unknown;
};

export type IssuedToken = {
  token: string;
  enrollmentToken: string;
  expiresAt: string;
};

/** Directory used until Identity attaches the real one (no workspaces). */
const EMPTY_DIRECTORY: WorkspaceDirectory = {
  workspace: async () => undefined,
  inRegion: async () => []
};

const isUniqueViolation = (e: unknown) =>
  (e as { code?: string })?.code === "P2002" ||
  /unique constraint/i.test(String((e as Error)?.message));

/**
 * Regions on the control plane (PR-12..PR-21): user-owned private regions and operator-created
 * public regions, one enrollment and credential mechanism for both, heartbeats and status, and
 * which workspaces a region serves.
 */
export function createRegionService(deps: {
  db: RegionsDb;
  signer?: RegionSigner;
  natsAuth?: RegionNatsAuth;
  publish?: LinkPublisher;
  config: RegionServiceConfig;
  /** Identity's workspaces; may be attached later (setDirectory). */
  directory?: WorkspaceDirectory;
  now?: () => Date;
}) {
  const { db, config } = deps;
  const now = deps.now ?? (() => new Date());
  const publish: LinkPublisher = deps.publish ?? (() => undefined);
  let directory = deps.directory ?? EMPTY_DIRECTORY;

  const signer = () => {
    if (!deps.signer)
      throw new RegionError(
        503,
        "regions_unavailable",
        "regions are not configured on this control plane (regions.signingKey)"
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

  const notFound = () =>
    new RegionError(404, "region_not_found", "no such region");

  const issueToken = async (row: RegionRow): Promise<IssuedToken> => {
    const jti = randomUUID();
    const token = signer().sign({
      iss: config.issuer,
      sub: row.ref,
      rid: row.id,
      knd: row.kind,
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
    return {
      token,
      enrollmentToken: token,
      expiresAt: expiresAt.toISOString()
    };
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

  const insert = async (data: Record<string, unknown>) => {
    try {
      return (await db.region.create({
        data: { ref: newRegionRef(), state: "waiting", ...data }
      })) as RegionRow;
    } catch (e) {
      if (isUniqueViolation(e))
        throw new RegionError(
          409,
          "region_id_taken",
          `a region with id "${data.id}" already exists`
        );
      throw e;
    }
  };

  const byRef = async (ref: string): Promise<RegionRow | undefined> => {
    const row = await db.region.findUnique({ where: { ref } });
    return row && !row.deletedAt ? row : undefined;
  };

  /** The live public region row with this id (or ref). */
  const publicRow = async (idOrRef: string): Promise<RegionRow | undefined> => {
    if (REGION_REF.test(idOrRef)) {
      const row = await byRef(idOrRef);
      return row?.kind === "public" ? row : undefined;
    }
    return (
      (await db.region.findFirst({
        where: { kind: "public", id: idOrRef, deletedAt: null }
      })) ?? undefined
    );
  };

  /** A live region by id or ref, for the admin API (ids name public regions). */
  const anyRow = async (idOrRef: string): Promise<RegionRow | undefined> =>
    REGION_REF.test(idOrRef) ? byRef(idOrRef) : publicRow(idOrRef);

  const workspaces = (row: RegionRow): Promise<WorkspaceInfo[]> =>
    directory.inRegion(regionKey(row));

  const service = {
    setDirectory(d: WorkspaceDirectory) {
      directory = d;
    },
    get directory() {
      return directory;
    },

    /** A user creates a private region (PR-15, PR-16, PR-18); the first token is returned once. */
    async createRegion(ownerRef: string, input: CreateRegionInput) {
      if (!ownerRef)
        throw new RegionError(401, "unauthenticated", "a user is required");
      const id = checkPrivateRegionId(input.id);
      const displayName = checkDisplayName(input.displayName ?? id);
      const sipDomain = checkSipDomain(input.sipDomain);
      signer();
      const exists = await db.region.findFirst({
        where: { kind: "private", ownerRef, id, deletedAt: null }
      });
      if (exists)
        throw new RegionError(
          409,
          "region_id_taken",
          `you already have a region with id "${id}"`
        );
      const row = await insert({
        id,
        kind: "private",
        ownerRef,
        displayName,
        sipDomain
      });
      const token = await issueToken(row);
      logger.info(`private region ${row.ref} (${id}) created for ${ownerRef}`);
      return { ref: row.ref, id: row.id, ...token };
    },

    /** The operator creates a public region (PR-19); unpublished until `publish`. */
    async createPublicRegion(
      input: CreateRegionInput & { endpoints?: unknown }
    ) {
      const id = checkPublicRegionId(input.id);
      const displayName = checkDisplayName(input.displayName ?? id);
      const sipDomain = checkSipDomain(input.sipDomain, true);
      signer();
      if (await publicRow(id))
        throw new RegionError(
          409,
          "region_id_taken",
          `public region "${id}" already exists`
        );
      const endpoints = input.endpoints
        ? normalizeEndpoints(input.endpoints)
        : undefined;
      const row = await insert({
        id,
        kind: "public",
        displayName,
        sipDomain: sipDomain ?? null,
        ...(endpoints
          ? {
              endpoints: { ...endpoints, updatedAt: now().toISOString() },
              endpointsAt: now()
            }
          : {})
      });
      const token = await issueToken(row);
      logger.info(`public region ${row.ref} (${id}) created by the operator`);
      return { ref: row.ref, id: row.id, ...token };
    },

    /** The caller's private region by id or ref; 404 for anything else. */
    async owned(ownerRef: string, idOrRef: string): Promise<RegionRow> {
      const row = REGION_REF.test(idOrRef)
        ? await byRef(idOrRef)
        : await db.region.findFirst({
            where: { kind: "private", ownerRef, id: idOrRef, deletedAt: null }
          });
      if (!row || row.kind !== "private" || row.ownerRef !== ownerRef)
        throw notFound();
      return row;
    },

    async listOwned(ownerRef: string): Promise<RegionRow[]> {
      return db.region.findMany({
        where: { kind: "private", ownerRef, deletedAt: null },
        orderBy: { createdAt: "asc" }
      });
    },

    async listPublicRows(): Promise<RegionRow[]> {
      return db.region.findMany({
        where: { kind: "public", deletedAt: null },
        orderBy: { createdAt: "asc" }
      });
    },

    async listAll(): Promise<RegionRow[]> {
      return db.region.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" }
      });
    },

    publicRow,
    anyRow,
    byRef,
    workspaces,

    async updateDisplayName(row: RegionRow, displayName: unknown) {
      return (await db.region.update({
        where: { ref: row.ref },
        data: { displayName: checkDisplayName(displayName) }
      })) as RegionRow;
    },

    /** A new enrollment token; the current cell keeps working until a cell enrolls with it. */
    async reissueToken(row: RegionRow) {
      return issueToken(row);
    },

    /** Revokes the cell now and puts the region back in `waiting`. */
    async disconnect(row: RegionRow, reason = "disconnected") {
      await revokeAll(row.ref, reason);
      const updated = (await db.region.update({
        where: { ref: row.ref },
        data: {
          state: "waiting",
          cellPublicKey: null,
          lastHeartbeatAt: null,
          enrolledAt: null,
          // The next cell's heartbeat then always asks for fresh endpoints.
          endpointsHash: null
        }
      })) as RegionRow;
      logger.info(`region ${row.ref} disconnected (${reason})`);
      return updated;
    },

    /** Deletes a region no workspace uses and revokes its cell (refused while in use). */
    async deleteRegion(row: RegionRow) {
      const using = await workspaces(row);
      if (using.length)
        throw new RegionError(
          409,
          "region_in_use",
          `the region is used by ${using.length} workspace(s): ${using
            .map((w) => w.name)
            .join(", ")}`
        );
      await db.region.update({
        where: { ref: row.ref },
        data: { deletedAt: now(), state: "waiting", published: false }
      });
      await revokeAll(row.ref, "region deleted").catch((e) =>
        logger.error(`could not revoke region ${row.ref}: ${e.message}`)
      );
      logger.info(`region ${row.ref} (${row.id}) deleted`);
    },

    /** Public regions: offered in pickers while connected (PR-19). */
    async publish(row: RegionRow) {
      if (row.kind !== "public")
        throw new RegionError(400, "not_public", "only public regions publish");
      return (await db.region.update({
        where: { ref: row.ref },
        data: { published: true }
      })) as RegionRow;
    },

    /** Public regions: withdrawn from pickers and the cell's credentials revoked. */
    async revoke(row: RegionRow) {
      if (row.kind !== "public")
        throw new RegionError(400, "not_public", "only public regions revoke");
      await db.region.update({
        where: { ref: row.ref },
        data: { published: false }
      });
      return service.disconnect(row, "revoked by the operator");
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
          "publicKey must be the region's Ed25519 public key (32 bytes, base64url)"
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
      if (row.deletedAt) throw new RegionError(409, "region_deleted");
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
        roomrNodes: Number(body.components?.roomrNodes ?? 0),
        appbridges: Number(body.components?.appbridges ?? 0),
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
      const bound = await workspaces(row).catch(() => []);
      logger.info(
        `region ${row.ref} (${row.id}) enrolled (version ${body.version ?? "?"}, ${bound.length} workspace(s))`
      );
      return {
        regionRef: row.ref,
        regionId: row.id,
        kind: row.kind,
        sipDomain: row.sipDomain ?? null,
        workspaceRefs: bound.map((w) => w.accessKeyId),
        leafUrl: claims.leaf,
        credentials: user.creds,
        subjects: subjects(row.ref).all,
        configVersion: updated.configVersion
      };
    },

    /** Records a heartbeat; returns the row, or undefined when the region is not enrolled. */
    async heartbeat(regionRef: string, hb: Partial<Heartbeat>) {
      const row = await byRef(regionRef);
      if (!row || row.state !== "enrolled") return undefined;
      const c = hb.components ?? ({} as Partial<Components>);
      return (await db.region.update({
        where: { ref: regionRef },
        data: {
          version: hb.version ? String(hb.version) : row.version,
          components: {
            roomrNodes: Number(c.roomrNodes ?? 0),
            appbridges: Number(c.appbridges ?? 0),
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
      const row = await byRef(regionRef);
      if (!row || row.state !== "enrolled") return undefined;
      const endpoints = normalizeEndpoints(body);
      if (!endpoints) return undefined;
      return (await db.region.update({
        where: { ref: regionRef },
        data: {
          endpoints: { ...endpoints, updatedAt: now().toISOString() },
          // Hash what the cell sent (as its heartbeats do), not the cleaned copy.
          endpointsHash: endpointsHash(
            body as Parameters<typeof endpointsHash>[0]
          ),
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

    /** The region row a workspace is bound to; undefined for a configured public region. */
    async regionOfWorkspace(
      accessKeyId: string
    ): Promise<RegionRow | undefined> {
      const ws = await directory.workspace(accessKeyId);
      if (!ws) return undefined;
      return service.regionByKey(ws.region);
    },

    /** The row for a `Workspace.region` value (a private ref or a public id). */
    async regionByKey(key: string): Promise<RegionRow | undefined> {
      if (!key) return undefined;
      return REGION_REF.test(key) ? byRef(key) : publicRow(key);
    },

    /**
     * Minutes reported by a region this calendar month (UTC), for one workspace or all of them.
     * Shown next to the flat fee, never billed (PR-11, AO-B5).
     */
    async minutesThisMonth(row: RegionRow, accessKeyId?: string) {
      const period = now().toISOString().slice(0, 7);
      const rows: { minutes: number }[] = await db.regionUsage.findMany({
        where: {
          regionRef: row.ref,
          period,
          ...(accessKeyId ? { accessKeyId } : {})
        },
        select: { minutes: true }
      });
      return rows.reduce((sum, r) => sum + r.minutes, 0);
    },

    /** Whether a workspace is bound to this region (PR-14: the cloud checks every record). */
    async serves(row: RegionRow, accessKeyId: unknown) {
      if (typeof accessKeyId !== "string" || !accessKeyId) return false;
      const ws = await directory.workspace(accessKeyId);
      return !!ws && ws.region === regionKey(row);
    },

    /**
     * Migration from the old model (one workspace per private region): a private region without
     * an owner gets its workspace's owner (RW-B3). Identity has its own database, so this runs at
     * start instead of in SQL.
     */
    async migrateLegacyOwners() {
      const rows: RegionRow[] = await db.region.findMany({
        where: { kind: "private", ownerRef: null, deletedAt: null }
      });
      let n = 0;
      for (const row of rows) {
        if (!row.accessKeyId) continue;
        const ws = await directory.workspace(row.accessKeyId);
        if (!ws) continue;
        try {
          await db.region.update({
            where: { ref: row.ref },
            data: { ownerRef: ws.ownerRef }
          });
          n++;
        } catch (e) {
          logger.warn(
            `could not set the owner of region ${row.ref}: ${(e as Error).message}`
          );
        }
      }
      if (n)
        logger.info(`regions: ${n} legacy private region(s) got their owner`);
      return n;
    },

    /** Re-pushes every revocation (on startup, so a restarted hub converges). */
    pushRevocations
  };
  return service;
}

export type RegionService = ReturnType<typeof createRegionService>;

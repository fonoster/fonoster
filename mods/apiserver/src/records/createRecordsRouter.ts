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
import {
  decodeVcon,
  RECORD_PARTS,
  RecordStore,
  SignedVcon
} from "@fonoster/callrecord";
import { TokenVerifyOptions } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import express, { Request, Response, Router } from "express";
import { Caller, createHttpAuth } from "../regions/httpAuth";
import { RelayClient } from "../regions/relay";
import { relayToResponse } from "../regions/relayHttp";
import { createSearchRecords } from "./createSearchRecords";
import { createRecordMaintenance, RecordMaintenanceError } from "./maintenance";
import { CallRecordRow, MaintenanceClient, RecordsDb } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/** Roles that may read unredacted originals and delete or erase records (V5, V3). */
export const UNREDACTED_ROLES = ["WORKSPACE_OWNER", "WORKSPACE_ADMIN"];

export type RecordsRouterDeps = {
  db: RecordsDb;
  /** Verifies access tokens (the same key the gRPC interceptor uses). */
  identityPublicKey: string;
  /** The token's issuer and audience must match these too (M5, like /api/regions). */
  identityTokenOptions?: TokenVerifyOptions;
  stores: (location: string) => RecordStore | undefined;
  maintenance: MaintenanceClient;
  /**
   * Private regions (add-private-regions 2.5): content of a private workspace's calls is fetched
   * from its cell and streamed, never read from (or written to) central storage.
   */
  relay?: {
    regionOf(accessKeyId: string): Promise<string | undefined>;
    client?: RelayClient;
  };
  /** Retention is part of the recording policy a private cell syncs. */
  onConfigChange?: (accessKeyId: string) => void;
};

/**
 * The records API (call-record "Records are available through the API and the dashboard",
 * tasks 5.1 and 4.2), on the apiserver's HTTP port so recordings download as files:
 *
 *   GET    /api/records                        search: after, before, number, appRef, status
 *   GET    /api/records/:callRef               the record (redacted; ?original=true, ?version=n)
 *   GET    /api/records/:callRef/recording     the recording (WAV)
 *   GET    /api/records/:callRef/audit         deletions of this record (owner, admin)
 *   DELETE /api/records/:callRef               erase the call (owner, admin)
 *   DELETE /api/records/:callRef/parts/:part   delete one part (owner, admin)
 *   GET    /api/records/retention              the workspace's retention policies
 *   PUT    /api/records/retention              {part, days} sets one; days null removes it
 *
 * Every request carries `Authorization: Bearer <access token>` and the workspace in
 * `x-accesskey-id`; only that workspace's records are visible.
 */
export function createRecordsRouter(deps: RecordsRouterDeps): Router {
  const router = express.Router();
  const search = createSearchRecords(deps.db);
  const maintain = createRecordMaintenance(deps.db, deps.maintenance);

  // Access tokens only (id, refresh and invite tokens are refused), from the configured issuer
  // and for the configured audience; the same middleware guards /api/regions.
  const auth = createHttpAuth(
    deps.identityPublicKey,
    deps.identityTokenOptions ?? {}
  );
  const caller = (res: Response) => res.locals.caller as Caller;
  const privileged = (res: Response) =>
    UNREDACTED_ROLES.includes(caller(res).role);
  const handle =
    (fn: (req: Request, res: Response) => Promise<unknown>) =>
    (req: Request, res: Response) =>
      fn(req, res).catch((e) => {
        if (e instanceof RecordMaintenanceError) {
          const status =
            e.code === "not_found"
              ? 404
              : e.code === "gone"
                ? 410
                : e.code === "bad_request"
                  ? 400
                  : 502;
          return res.status(status).json({ error: e.code, message: e.message });
        }
        logger.error(`records API: ${(e as Error).message}`);
        res.status(500).json({ error: "internal" });
      });

  router.use(express.json());
  router.use(auth);

  const view = (row: CallRecordRow) => ({
    callRef: row.callRef,
    appRef: row.appRef,
    from: row.fromNumber,
    to: row.toNumber,
    direction: row.direction,
    status: row.status,
    endReason: row.endReason,
    failureReason: row.failureReason,
    sipStatus: row.sipStatus,
    amdStatus: row.amdStatus ?? null,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    durationSeconds: row.durationSeconds,
    region: row.region,
    version: row.version,
    size: Number(row.size),
    parts: row.parts
  });

  router.get(
    "/",
    handle(async (req, res) => {
      const q = req.query as Record<string, string | undefined>;
      const result = await search(caller(res).accessKeyId, {
        after: q.after,
        before: q.before,
        number: q.number,
        appRef: q.appRef,
        direction: q.direction,
        status: q.status,
        pageSize: q.pageSize ? Number(q.pageSize) : undefined,
        pageToken: q.pageToken
      });
      res.json({
        items: result.items.map(view),
        nextPageToken: result.nextPageToken
      });
    })
  );

  router.get(
    "/retention",
    handle(async (_req, res) => {
      const policies = await deps.db.callRecordRetention.findMany({
        where: { accessKeyId: caller(res).accessKeyId }
      });
      res.json({
        items: policies.map((p) => ({ part: p.part, days: p.days }))
      });
    })
  );

  router.put(
    "/retention",
    handle(async (req, res) => {
      if (!privileged(res))
        return res.status(403).json({ error: "permission_denied" });
      const { part, days } = req.body ?? {};
      if (!(RECORD_PARTS as readonly string[]).includes(part))
        return res.status(400).json({
          error: "bad_request",
          message: `part must be one of ${RECORD_PARTS.join(", ")}`
        });
      const accessKeyId = caller(res).accessKeyId;
      if (days === null || days === undefined) {
        await deps.db.callRecordRetention.deleteMany({
          where: { accessKeyId, part }
        });
        deps.onConfigChange?.(accessKeyId);
        return res.json({ part, days: null });
      }
      if (!Number.isInteger(days) || days < 1)
        return res
          .status(400)
          .json({ error: "bad_request", message: "days must be ≥ 1" });
      await deps.db.callRecordRetention.upsert({
        where: { accessKeyId_part: { accessKeyId, part } },
        create: { accessKeyId, part, days },
        update: { days }
      });
      deps.onConfigChange?.(accessKeyId);
      res.json({ part, days });
    })
  );

  /** The row of a record in the caller's workspace, or a 404 / 410 already sent. */
  const rowOf = async (req: Request, res: Response) => {
    const row = await deps.db.callRecord.findUnique({
      where: { callRef: String(req.params.callRef) }
    });
    if (!row || row.accessKeyId !== caller(res).accessKeyId) {
      res.status(404).json({ error: "not_found" });
      return undefined;
    }
    if (row.erasedAt) {
      res.status(410).json({ error: "erased" });
      return undefined;
    }
    return row;
  };

  /**
   * For a private workspace: relays the content from its cell and returns true (the response is
   * sent). Offline regions answer 503 `region_offline`.
   */
  const relayed = async (
    req: Request,
    res: Response,
    row: CallRecordRow,
    op: "record.get" | "record.part",
    part?: string
  ) => {
    const regionRef = await deps.relay?.regionOf(caller(res).accessKeyId);
    // Only records indexed from that region live there (PR-14: same mechanism for public ones).
    if (!regionRef || (row.region && row.region !== regionRef)) return false;
    const original = req.query.original === "true";
    if (original && !privileged(res)) {
      res.status(403).json({
        error: "permission_denied",
        message: "the unredacted original needs the owner or admin role"
      });
      return true;
    }
    if (!deps.relay?.client) {
      res.status(503).json({
        error: "region_offline",
        message: "the region link is not configured on this control plane"
      });
      return true;
    }
    await relayToResponse(
      deps.relay.client,
      regionRef,
      {
        userRef: caller(res).actor,
        workspaceRef: caller(res).accessKeyId,
        op,
        callRef: row.callRef,
        part,
        original,
        version: req.query.version ? Number(req.query.version) : undefined,
        range:
          typeof req.headers.range === "string" ? req.headers.range : undefined
      },
      res,
      op === "record.part"
        ? { "content-disposition": `attachment; filename="${row.callRef}.wav"` }
        : {}
    );
    return true;
  };

  /** The requested copy of a version: redacted by default, the original only when allowed. */
  const copyOf = async (req: Request, res: Response, row: CallRecordRow) => {
    const original = req.query.original === "true";
    if (original && !privileged(res)) {
      res.status(403).json({
        error: "permission_denied",
        message: "the unredacted original needs the owner or admin role"
      });
      return undefined;
    }
    const store = deps.stores(row.location);
    if (!store) {
      res.status(503).json({ error: "store_unavailable" });
      return undefined;
    }
    const version = req.query.version ? Number(req.query.version) : undefined;
    const stored = await store.getVersion(row.callRef, version);
    if (!stored) {
      res.status(404).json({ error: "not_found" });
      return undefined;
    }
    const signed: SignedVcon | undefined = original
      ? stored.signed
      : stored.redacted;
    if (!signed) {
      res.status(410).json({ error: "contents_deleted" });
      return undefined;
    }
    return { store, stored, signed, original };
  };

  router.get(
    "/:callRef",
    handle(async (req, res) => {
      const row = await rowOf(req, res);
      if (!row) return;
      if (await relayed(req, res, row, "record.get")) return;
      const copy = await copyOf(req, res, row);
      if (!copy) return;
      res.json({
        ...view(row),
        version: copy.stored.version,
        currentVersion: row.version,
        redacted: !copy.original,
        vcon: decodeVcon(copy.signed),
        jws: copy.signed,
        parts: copy.stored.manifest.parts
      });
    })
  );

  router.get(
    "/:callRef/recording",
    handle(async (req, res) => {
      const row = await rowOf(req, res);
      if (!row) return;
      if (await relayed(req, res, row, "record.part", "recording")) return;
      const copy = await copyOf(req, res, row);
      if (!copy) return;
      const ref = decodeVcon(copy.signed).dialog.find(
        (d) => d.type === "recording" && d.url
      );
      if (!ref) {
        const inOriginal =
          !copy.original &&
          copy.stored.signed &&
          decodeVcon(copy.stored.signed).dialog.some(
            (d) => d.type === "recording" && d.url
          );
        return inOriginal
          ? res.status(403).json({
              error: "permission_denied",
              message:
                "the recording is withheld from the redacted copy; it needs unredacted access"
            })
          : res.status(404).json({ error: "no_recording" });
      }
      const name = String(ref.url).replace(/^parts\//, "");
      const data = await copy.store.getPart(row.callRef, name);
      if (!data) return res.status(410).json({ error: "contents_deleted" });
      res.setHeader("content-type", String(ref.mimetype ?? "audio/x-wav"));
      res.setHeader(
        "content-disposition",
        `attachment; filename="${row.callRef}.wav"`
      );
      res.setHeader("x-content-hash", String(ref.content_hash ?? ""));
      res.send(data);
    })
  );

  router.get(
    "/:callRef/audit",
    handle(async (req, res) => {
      if (!privileged(res))
        return res.status(403).json({ error: "permission_denied" });
      const items = await deps.db.callRecordAudit.findMany({
        where: {
          callRef: String(req.params.callRef),
          accessKeyId: caller(res).accessKeyId
        },
        orderBy: { at: "asc" }
      });
      res.json({ items });
    })
  );

  router.delete(
    "/:callRef",
    handle(async (req, res) => {
      if (!privileged(res))
        return res.status(403).json({ error: "permission_denied" });
      const result = await maintain({
        op: "erase",
        callRef: String(req.params.callRef),
        accessKeyId: caller(res).accessKeyId,
        reason: String(req.body?.reason ?? "erasure request"),
        actor: caller(res).actor
      });
      res.json(result);
    })
  );

  router.delete(
    "/:callRef/parts/:part",
    handle(async (req, res) => {
      if (!privileged(res))
        return res.status(403).json({ error: "permission_denied" });
      const result = await maintain({
        op: "delete_parts",
        callRef: String(req.params.callRef),
        accessKeyId: caller(res).accessKeyId,
        parts: [String(req.params.part)],
        reason: String(req.body?.reason ?? "deletion request"),
        actor: caller(res).actor
      });
      res.json(result);
    })
  );

  return router;
}

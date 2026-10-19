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
import * as grpc from "@grpc/grpc-js";
import { ConfigKinds, SnapshotSources } from "./configSync";
import { RegionsDb } from "./types";

type Handler = (
  call: unknown,
  callback: (
    err: unknown,
    res?: { items?: unknown[]; nextPageToken?: string }
  ) => void
) => unknown;

/** Every item of a workspace from a gRPC list handler (the sipnet services filter by workspace). */
export async function listAll(
  handler: Handler | undefined,
  accessKeyId: string
): Promise<unknown[]> {
  if (!handler) return [];
  const items: unknown[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 100; page++) {
    const metadata = new grpc.Metadata();
    metadata.set("accessKeyId", accessKeyId);
    const res = await new Promise<{
      items?: unknown[];
      nextPageToken?: string;
    }>(
      (resolve, reject) =>
        void handler(
          { metadata, request: { pageSize: 100, pageToken } },
          (err, r) => (err ? reject(err) : resolve(r ?? {}))
        )
    );
    items.push(...(res.items ?? []));
    if (!res.nextPageToken || res.nextPageToken === pageToken) break;
    pageToken = res.nextPageToken;
  }
  return items;
}

const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : d);

/** An application row as the cell's AppBridge reads it (AppBridge's `appFromRow` columns). */
function appRow(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === "intelligence" || k === "textToSpeech" || k === "speechToText")
      continue;
    out[k] = iso(v);
  }
  return out;
}

/**
 * The production snapshot sources: Prisma for apps, agents, webhooks, the catalog and the
 * recording policy; the Routr-backed gRPC handlers for numbers and Routr resources.
 */
export function createSnapshotSources(deps: {
  db: RegionsDb;
  /** The loaded services' handlers, by method name (listNumbers, listDomains, …). */
  handlers: Record<string, Handler | undefined>;
  /** Workspace-wide defaults (features.calls). */
  callFeatures?: Record<string, unknown>;
}): SnapshotSources {
  const { db, handlers } = deps;
  return {
    async apps(accessKeyId) {
      const rows: Record<string, unknown>[] = await db.application.findMany({
        where: { accessKeyId },
        include: { intelligence: true },
        orderBy: { createdAt: "asc" }
      });
      const agents: ConfigKinds["agents"] = rows
        .filter((r) => r.intelligence)
        .map((r) => {
          const i = r.intelligence as { productRef: string; config: unknown };
          return {
            appRef: String(r.ref),
            productRef: i.productRef,
            config: i.config
          };
        });
      return { apps: rows.map(appRow), agents };
    },
    numbers: (accessKeyId) => listAll(handlers.listNumbers, accessKeyId),
    async routr(accessKeyId) {
      const [domains, agents, trunks, acls] = await Promise.all([
        listAll(handlers.listDomains, accessKeyId),
        listAll(handlers.listAgents, accessKeyId),
        listAll(handlers.listTrunks, accessKeyId),
        listAll(handlers.listAcls, accessKeyId)
      ]);
      return { domains, agents, trunks, acls };
    },
    async catalog(ids, providers) {
      const [p, m, v] = await Promise.all([
        db.registryProvider.findMany({ where: { id: { in: providers } } }),
        db.registryModel.findMany({ where: { id: { in: ids } } }),
        db.registryVoice.findMany({
          where: { id: { in: ids } },
          include: { models: true }
        })
      ]);
      const plain = (kind: string) => (r: Record<string, unknown>) => {
        const out: Record<string, unknown> = { kind };
        for (const [k, val] of Object.entries(r))
          if (k !== "createdAt" && k !== "updatedAt")
            out[k] =
              k === "models"
                ? (val as { modelId: string }[]).map((x) => x.modelId)
                : val;
        return out;
      };
      return [
        ...p.map(plain("provider")),
        ...m.map(plain("model")),
        ...v.map(plain("voice"))
      ];
    },
    async webhooks(accessKeyId) {
      // Webhooks are delivered from the cell (PR-7), so it gets the endpoints' signing secrets
      // (Fonoster-generated, not provider keys; RG-B6).
      const rows: Record<string, unknown>[] = await db.webhookEndpoint.findMany(
        {
          where: { accessKeyId }
        }
      );
      return rows.map((r) => ({
        ref: r.ref,
        url: r.url,
        events: r.events,
        secret: r.secret,
        previousSecret: r.previousSecret ?? null,
        previousUntil: iso(r.previousUntil ?? null)
      }));
    },
    async recordingPolicy(accessKeyId) {
      const retention: { part: string; days: number }[] =
        await db.callRecordRetention.findMany({ where: { accessKeyId } });
      return {
        ...(deps.callFeatures ?? {}),
        retention: retention.map((r) => ({ part: r.part, days: r.days }))
      };
    }
  };
}

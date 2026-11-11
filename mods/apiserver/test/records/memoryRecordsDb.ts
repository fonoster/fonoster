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
  AuditRow,
  CallRecordRow,
  RetentionRow,
  WorkspaceErasureDb
} from "../../src/records";

type Where = Record<string, unknown>;

function matches(row: Record<string, unknown>, where: Where): boolean {
  return Object.entries(where).every(([key, cond]) => {
    if (key === "OR") return (cond as Where[]).some((w) => matches(row, w));
    if (key === "AND") return (cond as Where[]).every((w) => matches(row, w));
    if (key === "NOT") return !matches(row, cond as Where);
    const value = row[key];
    if (cond === null) return value === null || value === undefined;
    if (cond instanceof Date)
      return value instanceof Date && value.getTime() === cond.getTime();
    if (typeof cond !== "object") return value === cond;
    const c = cond as Record<string, unknown>;
    if ("has" in c) return (value as string[]).includes(c.has as string);
    if ("startsWith" in c)
      return (
        typeof value === "string" && value.startsWith(c.startsWith as string)
      );
    if ("lt" in c && !((value as Date) < (c.lt as Date))) return false;
    if ("gte" in c && !((value as Date) >= (c.gte as Date))) return false;
    return true;
  });
}

type Owned = { ref: string; accessKeyId: string };

/**
 * Just enough of Prisma for the records code: equality, null, lt/gte, has, startsWith, OR/AND/NOT,
 * order, take, count. And for the erasure of deleted workspaces (#1321): `deleteMany` by workspace
 * on applications, secrets, webhook endpoints and deliveries, with the database's cascades
 * (an application's vendor services, a secret's provider keys) and the order of the deletes.
 */
export function memoryRecordsDb() {
  const records = new Map<string, CallRecordRow>();
  const audits: AuditRow[] = [];
  const retention: (RetentionRow & { ref: string })[] = [];
  const applications: Owned[] = [];
  /** tts_services, stt_services and intelligence_services rows: they go with their application. */
  const appServices: { table: string; applicationRef: string }[] = [];
  const secrets: Owned[] = [];
  /** workspace_provider_keys rows: they go with their secret. Not part of WorkspaceErasureDb. */
  const providerKeys: {
    accessKeyId: string;
    providerId: string;
    secretRef: string;
  }[] = [];
  const endpoints: Owned[] = [];
  const deliveries: (Owned & { endpointRef: string })[] = [];
  /** Every `deleteMany` by workspace, in order: `<model>:<accessKeyId>`. */
  const deletes: string[] = [];
  const keep = <T>(rows: T[], test: (row: T) => boolean) =>
    rows.splice(0, rows.length, ...rows.filter(test));
  const deleteOwned =
    (model: string, rows: Owned[], cascade?: (gone: string[]) => void) =>
    async ({ where }: { where: { accessKeyId: string } }) => {
      deletes.push(`${model}:${where.accessKeyId}`);
      const gone = rows
        .filter((r) => r.accessKeyId === where.accessKeyId)
        .map((r) => r.ref);
      keep(rows, (r) => r.accessKeyId !== where.accessKeyId);
      cascade?.(gone);
      return { count: gone.length };
    };
  const db: WorkspaceErasureDb = {
    application: {
      deleteMany: deleteOwned("application", applications, (gone) =>
        keep(appServices, (s) => !gone.includes(s.applicationRef))
      )
    },
    secret: {
      deleteMany: deleteOwned("secret", secrets, (gone) =>
        keep(providerKeys, (k) => !gone.includes(k.secretRef))
      )
    },
    webhookEndpoint: {
      deleteMany: deleteOwned("webhookEndpoint", endpoints)
    },
    webhookDelivery: {
      deleteMany: deleteOwned("webhookDelivery", deliveries)
    },
    callRecord: {
      findUnique: async ({ where }) => records.get(where.callRef) ?? null,
      findMany: async (args) => {
        const where = (args.where ?? {}) as Where;
        let rows = [...records.values()].filter((r) =>
          matches(r as unknown as Record<string, unknown>, where)
        );
        // Newest first, then by callRef descending (the search's order).
        if (args.orderBy)
          rows = rows.sort(
            (a, b) =>
              b.startedAt.getTime() - a.startedAt.getTime() ||
              (a.callRef < b.callRef ? 1 : a.callRef > b.callRef ? -1 : 0)
          );
        return rows.slice(0, (args.take as number) ?? rows.length);
      },
      count: async (args) =>
        [...records.values()].filter((r) =>
          matches(
            r as unknown as Record<string, unknown>,
            (args.where ?? {}) as Where
          )
        ).length,
      upsert: async (args) => {
        const where = args.where as { callRef: string };
        const existing = records.get(where.callRef);
        records.set(
          where.callRef,
          (existing
            ? { ...existing, ...(args.update as object) }
            : args.create) as CallRecordRow
        );
      },
      update: async (args) => {
        const where = args.where as { callRef: string };
        const existing = records.get(where.callRef)!;
        records.set(where.callRef, { ...existing, ...(args.data as object) });
      }
    },
    callRecordAudit: {
      createMany: async ({ data }) => {
        audits.push(...data);
      },
      findMany: async (args) =>
        audits.filter((a) =>
          matches(a as unknown as Record<string, unknown>, args.where as Where)
        )
    },
    callRecordRetention: {
      findMany: async (args) =>
        retention.filter((r) =>
          matches(
            r as unknown as Record<string, unknown>,
            (args?.where ?? {}) as Where
          )
        ),
      upsert: async (args) => {
        const key = (
          args.where as {
            accessKeyId_part: { accessKeyId: string; part: string };
          }
        ).accessKeyId_part;
        const i = retention.findIndex(
          (r) => r.accessKeyId === key.accessKeyId && r.part === key.part
        );
        if (i >= 0)
          retention[i] = { ...retention[i], ...(args.update as object) };
        else
          retention.push({
            ref: String(retention.length),
            ...(args.create as RetentionRow)
          });
      },
      deleteMany: async (args) => {
        const where = args.where as Where;
        for (let i = retention.length - 1; i >= 0; i--)
          if (
            matches(retention[i] as unknown as Record<string, unknown>, where)
          )
            retention.splice(i, 1);
      }
    }
  };
  return {
    db,
    records,
    audits,
    retention,
    applications,
    appServices,
    secrets,
    providerKeys,
    endpoints,
    deliveries,
    deletes
  };
}

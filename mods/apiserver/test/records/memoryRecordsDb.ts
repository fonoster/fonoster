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
  RecordsDb,
  RetentionRow
} from "../../src/records";

type Where = Record<string, unknown>;

function matches(row: Record<string, unknown>, where: Where): boolean {
  return Object.entries(where).every(([key, cond]) => {
    if (key === "OR") return (cond as Where[]).some((w) => matches(row, w));
    const value = row[key];
    if (cond === null) return value === null || value === undefined;
    if (cond instanceof Date || typeof cond !== "object") return value === cond;
    const c = cond as Record<string, unknown>;
    if ("has" in c) return (value as string[]).includes(c.has as string);
    if ("lt" in c && !((value as Date) < (c.lt as Date))) return false;
    if ("gte" in c && !((value as Date) >= (c.gte as Date))) return false;
    return true;
  });
}

/** Just enough of Prisma for the records code: equality, null, lt/gte, has, OR, order, take. */
export function memoryRecordsDb() {
  const records = new Map<string, CallRecordRow>();
  const audits: AuditRow[] = [];
  const retention: (RetentionRow & { ref: string })[] = [];
  const db: RecordsDb = {
    callRecord: {
      findUnique: async ({ where }) => records.get(where.callRef) ?? null,
      findMany: async (args) => {
        const where = (args.where ?? {}) as Where;
        let rows = [...records.values()].filter((r) =>
          matches(r as unknown as Record<string, unknown>, where)
        );
        if (args.orderBy)
          rows = rows.sort(
            (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
          );
        return rows.slice(0, (args.take as number) ?? rows.length);
      },
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
  return { db, records, audits, retention };
}

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
  decodeToken,
  getAccessKeyIdFromCall,
  getTokenFromCall,
  GrpcError,
  GrpcErrorMessage,
  TokenUseEnum,
  Usage,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import {
  GetUsageRequest,
  GetUsageResponse,
  Role,
  UsageRow
} from "@fonoster/types";
import { ServerInterceptingCall, status } from "@grpc/grpc-js";
import { z } from "zod";
import { UsageSql } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 400;

/** Dimension → its usage_daily column. Totals are always split by meter. */
const COLUMNS = {
  day: "day",
  workspace: "workspace_ref",
  meter: "meter",
  provider: "provider",
  model: "model",
  key_source: "key_source",
  origin: "origin"
} as const;
type Dimension = keyof typeof COLUMNS;

const schema = z
  .object({
    fromDay: z.string().regex(DAY, "fromDay must be YYYY-MM-DD"),
    toDay: z.string().regex(DAY, "toDay must be YYYY-MM-DD"),
    groupBy: z
      .array(z.enum(Object.keys(COLUMNS) as [Dimension, ...Dimension[]]))
      .optional(),
    allOwned: z.boolean().optional()
  })
  .refine((r) => r.fromDay <= r.toDay, "fromDay must not be after toDay")
  .refine(
    (r) =>
      (Date.parse(r.toDay) - Date.parse(r.fromDay)) / 86_400_000 < MAX_DAYS,
    `the range must be shorter than ${MAX_DAYS} days`
  );

const SNAPSHOT_METERS = Usage.METER_NAMES.filter(
  (m) => Usage.METERS[m].aggregation === "snapshot"
);

/** The workspaces the caller may read: theirs, or (all_owned) every one their token says they own. */
function workspacesOf(call: unknown, allOwned: boolean): string[] {
  const grpcCall = call as ServerInterceptingCall;
  if (!allOwned) return [getAccessKeyIdFromCall(grpcCall)];
  const token = decodeToken<TokenUseEnum.ACCESS>(getTokenFromCall(grpcCall));
  const owned = (token.access ?? [])
    .filter((a) => a.role === Role.WORKSPACE_OWNER)
    .map((a) => a.accessKeyId);
  if (!owned.length)
    throw new GrpcError(
      status.PERMISSION_DENIED,
      "all_owned needs a workspace owner"
    );
  return owned;
}

/**
 * Usage totals (usage-metering "Usage API"): quantities from usage_daily, never money. Each day is
 * totalled first; across days counted meters add up and snapshot meters (storage) take the peak.
 */
export function createGetUsage(db: UsageSql) {
  const fn = async (
    call: { request: GetUsageRequest },
    callback: (error: GrpcErrorMessage, response?: GetUsageResponse) => void
  ) => {
    const { fromDay, toDay, groupBy = [], allOwned = false } = call.request;
    const workspaces = workspacesOf(call, allOwned);
    const dims = Array.from(new Set<Dimension>([...groupBy, "meter"]));
    const others = dims.filter((d) => d !== "day").map((d) => COLUMNS[d]);
    const perDay = ["day", ...others].join(", ");
    const outer = dims.map((d) => COLUMNS[d]).join(", ");
    logger.verbose("call to getUsage", { workspaces, fromDay, toDay, dims });
    const rows = await db.$queryRawUnsafe<Record<string, unknown>[]>(
      `WITH per_day AS (
         SELECT ${perDay}, SUM(quantity) AS q FROM usage_daily
         WHERE workspace_ref = ANY($1::text[]) AND day BETWEEN $2::date AND $3::date
         GROUP BY ${perDay}
       )
       SELECT ${outer},
         CASE WHEN meter = ANY($4::text[]) THEN MAX(q) ELSE SUM(q) END AS quantity
       FROM per_day GROUP BY ${outer} ORDER BY ${outer}`,
      workspaces,
      fromDay,
      toDay,
      SNAPSHOT_METERS
    );
    const text = (v: unknown) =>
      v instanceof Date
        ? v.toISOString().slice(0, 10)
        : v === undefined || v === null
          ? ""
          : String(v);
    callback(null, {
      rows: rows.map((r): UsageRow => ({
        day: text(r.day),
        workspaceRef: text(r.workspace_ref),
        meter: String(r.meter),
        unit: Usage.isMeter(String(r.meter))
          ? Usage.METERS[r.meter as Usage.MeterName].unit
          : "",
        provider: text(r.provider),
        model: text(r.model),
        keySource: text(r.key_source),
        origin: text(r.origin),
        quantity: Number(r.quantity)
      }))
    });
  };
  return withErrorHandlingAndValidation(fn, schema);
}

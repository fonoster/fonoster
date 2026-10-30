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
import { z } from "zod";
import { isMeter, MeterName, METERS } from "./meters";

export const KEY_SOURCES = ["platform", "workspace"] as const;
export type KeySource = (typeof KEY_SOURCES)[number];

export const ORIGINS = ["call", "browser_test", "eval", "api"] as const;
export type UsageOrigin = (typeof ORIGINS)[number];

export const REGION_KINDS = ["public", "private"] as const;
export type RegionKind = (typeof REGION_KINDS)[number];

const lineFields = {
  meter: z.string().refine(isMeter, {
    error: (issue) => `undeclared meter "${issue.input}"`
  }),
  quantity: z.number().finite().nonnegative(),
  provider: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  keySource: z.enum(KEY_SOURCES).optional()
};

function checkKeySource(
  line: { meter?: string; keySource?: KeySource },
  ctx: z.RefinementCtx
) {
  if (!line.meter || !isMeter(line.meter)) return;
  const vendor = METERS[line.meter].vendor;
  if (vendor && !line.keySource)
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["keySource"],
      message: `${line.meter} needs a keySource`
    });
  if (!vendor && line.keySource)
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["keySource"],
      message: `${line.meter} is not a vendor meter and takes no keySource`
    });
}

/** One quantity of one meter. Facts only: strict, so no price or billable flag can ride along. */
export const usageLineSchema = z
  .object(lineFields)
  .strict()
  .superRefine(checkKeySource);

/** A usage line with its attribution, as stored and as published on `usage.>`. */
export const usageEventSchema = z
  .object({
    ...lineFields,
    id: z.string().regex(/^usg_[a-z2-7]{26}$/),
    /** Resolved from the workspace at ingest when the reporter does not know it. */
    ownerRef: z.string().min(1).optional(),
    workspaceRef: z.string().min(1),
    appRef: z.string().min(1).optional(),
    callRef: z.string().min(1).optional(),
    region: z.string().min(1),
    regionKind: z.enum(REGION_KINDS),
    origin: z.enum(ORIGINS),
    occurredAt: z.string().datetime()
  })
  .strict()
  .superRefine(checkKeySource);

export type UsageLine = {
  meter: MeterName;
  quantity: number;
  provider?: string;
  model?: string;
  keySource?: KeySource;
};

export type UsageEvent = UsageLine & {
  id: string;
  ownerRef?: string;
  workspaceRef: string;
  appRef?: string;
  callRef?: string;
  region: string;
  regionKind: RegionKind;
  origin: UsageOrigin;
  occurredAt: string;
};

/** A usage line or event that failed validation; the message names every problem. */
export class InvalidUsageError extends Error {}

function parseWith<T>(schema: z.ZodTypeAny, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data as T;
  throw new InvalidUsageError(
    result.error.issues
      .map((i) =>
        i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message
      )
      .join("; ")
  );
}

export function parseUsageLine(input: unknown): UsageLine {
  return parseWith<UsageLine>(usageLineSchema, input);
}

export function parseUsageEvent(input: unknown): UsageEvent {
  return parseWith<UsageEvent>(usageEventSchema, input);
}

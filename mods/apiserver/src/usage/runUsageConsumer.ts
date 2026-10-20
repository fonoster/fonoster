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
import { NatsConnection, StringCodec } from "nats";
import { consumeDurable } from "../core/durableConsumer";
import { ingestUsageIn } from "./ingestUsage";
import { UsageDb, UsageDirectory } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();

/** Usage outside a call (evals, storage snapshots) arrives on `usage.<workspace>.<meter>` (D5). */
export const USAGE_SUBJECT = "usage.>";
export const USAGE_STREAM = "FONOSTER_USAGE";
export const USAGE_DURABLE = "apiserver-usage";
/** Kept this long while nobody can store it (the usage store or the apiserver is down). */
export const USAGE_MAX_AGE_MS = 7 * 24 * 3600_000;

/**
 * Stores usage events published outside a call. A message is acknowledged once stored; while the
 * database or Identity's directory is unavailable it is retried, never dropped, until it ages out
 * of the stream after seven days. A message that is not usage is logged and acknowledged.
 */
export async function runUsageConsumer(deps: {
  nc: NatsConnection;
  db: UsageDb;
  directory: () => UsageDirectory | undefined;
  retryDelayMs?: number;
  ackWaitMs?: number;
}): Promise<() => Promise<void>> {
  return consumeDurable(
    deps.nc,
    {
      stream: USAGE_STREAM,
      subject: USAGE_SUBJECT,
      durable: USAGE_DURABLE,
      maxAgeMs: USAGE_MAX_AGE_MS,
      maxDeliver: -1,
      retryDelayMs: deps.retryDelayMs ?? 10_000,
      ackWaitMs: deps.ackWaitMs
    },
    async (data) => {
      let event: unknown;
      try {
        event = JSON.parse(sc.decode(data));
      } catch {
        logger.warn("usage message is not JSON; dropped");
        return;
      }
      const directory = deps.directory();
      if (!directory) throw new Error("workspace directory not attached yet");
      await deps.db.$transaction((tx) => ingestUsageIn(tx, directory, [event]));
    },
    (e) => logger.warn(`usage not stored yet, will retry: ${e.message}`)
  );
}

/** The subject a usage event is published on. */
export const usageSubject = (workspaceRef: string, meter: string) =>
  `usage.${workspaceRef}.${meter}`;

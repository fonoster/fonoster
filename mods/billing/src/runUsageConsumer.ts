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
import {
  AckPolicy,
  nanos,
  NatsConnection,
  RetentionPolicy,
  StorageType,
  StringCodec
} from "nats";
import { applyUsage } from "./applyUsage";
import { Clock } from "./clock";
import { PrismaClient } from "./db";
import { RateCard } from "./rateCards";
import {
  RECORDED_USAGE_STREAM,
  RECORDED_USAGE_SUBJECTS,
  RecordedUsage
} from "./usage";

const logger = getLogger({ service: "billing", filePath: __filename });
const sc = StringCodec();

export const USAGE_DURABLE = "billing-usage";
const MAX_AGE_MS = 7 * 24 * 3600_000;

const inUse = (e: unknown) =>
  /already in use|already exists/i.test((e as Error).message ?? "");

/**
 * Consumes stored usage (add-billing-service D2) with one durable consumer shared by every billing
 * replica. A message is acknowledged once rated; a failure is retried. Rating is idempotent by
 * usage id, so a redelivery changes nothing.
 */
export async function runUsageConsumer(deps: {
  nc: NatsConnection;
  prisma: PrismaClient;
  cards: RateCard[];
  clock: Clock;
  retryDelayMs?: number;
  ackWaitMs?: number;
}): Promise<() => Promise<void>> {
  const jsm = await deps.nc.jetstreamManager();
  try {
    await jsm.streams.info(RECORDED_USAGE_STREAM);
  } catch {
    await jsm.streams
      .add({
        name: RECORDED_USAGE_STREAM,
        subjects: [RECORDED_USAGE_SUBJECTS],
        retention: RetentionPolicy.Workqueue,
        storage: StorageType.File,
        max_age: nanos(MAX_AGE_MS)
      })
      .catch((e) => {
        if (!inUse(e)) throw e;
      });
  }
  await jsm.consumers.add(RECORDED_USAGE_STREAM, {
    durable_name: USAGE_DURABLE,
    ack_policy: AckPolicy.Explicit,
    ack_wait: nanos(deps.ackWaitMs ?? 30_000),
    max_deliver: -1,
    filter_subject: RECORDED_USAGE_SUBJECTS
  });
  const consumer = await deps.nc
    .jetstream()
    .consumers.get(RECORDED_USAGE_STREAM, USAGE_DURABLE);
  const messages = await consumer.consume({ max_messages: 64 });
  const loop = (async () => {
    for await (const m of messages) {
      let usage: RecordedUsage;
      try {
        usage = JSON.parse(sc.decode(m.data));
      } catch {
        logger.warn("stored usage message is not JSON; dropped");
        m.ack();
        continue;
      }
      applyUsage(deps.prisma, deps.cards, usage, deps.clock.now()).then(
        () => m.ack(),
        (e: Error) => {
          logger.warn(
            `usage ${usage.id} not rated yet, will retry: ${e.message}`
          );
          m.nak(deps.retryDelayMs ?? 5_000);
        }
      );
    }
  })();
  return async () => {
    await messages.close();
    await loop.catch(() => undefined);
  };
}

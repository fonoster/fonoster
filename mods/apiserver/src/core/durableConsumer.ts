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
  AckPolicy,
  JsMsg,
  MsgHdrs,
  nanos,
  NatsConnection,
  RetentionPolicy,
  StorageType
} from "nats";

/**
 * A JetStream work queue with one durable consumer shared by every apiserver replica (control
 * plane "events on JetStream with queue groups … webhook dispatch as a JetStream consumer", ST-2).
 * Producers keep publishing on the plain subject; the stream captures it. Each message goes to
 * one replica and is acknowledged only after the handler resolved (its result is persisted), so a
 * message taken by a replica that dies is redelivered to another after `ackWaitMs`. Handlers must
 * be idempotent: a message can arrive more than once.
 */
export type DurableConsumerOptions = {
  stream: string;
  subject: string;
  durable: string;
  /** How long a taken message may stay unacknowledged before another replica gets it. */
  ackWaitMs?: number;
  /** How long a message the handler failed on waits before it is tried again. */
  retryDelayMs?: number;
  /** Messages nobody consumed are dropped after this long. */
  maxAgeMs?: number;
  /** A message the handler keeps failing on is dropped after this many deliveries. */
  maxDeliver?: number;
};

const notFound = (e: unknown) => /not found/i.test((e as Error).message ?? "");
const inUse = (e: unknown) =>
  /already in use|already exists/i.test((e as Error).message ?? "");

export async function consumeDurable(
  nc: NatsConnection,
  options: DurableConsumerOptions,
  handle: (data: Uint8Array, headers?: MsgHdrs) => Promise<void>,
  onError: (e: Error, m: JsMsg) => void = () => undefined
): Promise<() => Promise<void>> {
  const jsm = await nc.jetstreamManager();
  try {
    await jsm.streams.info(options.stream);
  } catch (e) {
    if (!notFound(e)) throw e;
    try {
      await jsm.streams.add({
        name: options.stream,
        subjects: [options.subject],
        retention: RetentionPolicy.Workqueue,
        storage: StorageType.File,
        max_age: nanos(options.maxAgeMs ?? 24 * 3600_000)
      });
    } catch (e2) {
      // Another replica created it at the same moment.
      if (!inUse(e2)) throw e2;
    }
  }
  await jsm.consumers.add(options.stream, {
    durable_name: options.durable,
    ack_policy: AckPolicy.Explicit,
    ack_wait: nanos(options.ackWaitMs ?? 30_000),
    max_deliver: options.maxDeliver ?? 100,
    filter_subject: options.subject
  });
  const consumer = await nc
    .jetstream()
    .consumers.get(options.stream, options.durable);
  const messages = await consumer.consume({ max_messages: 64 });
  const loop = (async () => {
    for await (const m of messages) {
      handle(m.data, m.headers).then(
        () => m.ack(),
        (e: Error) => {
          onError(e, m);
          m.nak(options.retryDelayMs ?? 5_000);
        }
      );
    }
  })();
  return async () => {
    await messages.close();
    await loop.catch(() => undefined);
  };
}

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
import { Usage } from "@fonoster/common";
import { expect } from "chai";
import { connect, JetStreamManager, NatsConnection, StringCodec } from "nats";
import {
  runUsageConsumer,
  USAGE_STREAM,
  usageSubject
} from "../../src/usage/runUsageConsumer";
import { UsageDb } from "../../src/usage/types";
import { createTestDb, TestDb } from "../../../common/test/persistence/testDb";

// The USAGE stream consumer on a throwaway Postgres and the conformance NATS server
// (PERSISTENCE_TEST_DATABASE_URL, CONFORMANCE_NATS_URL); skipped without them.

const WS = "WOusage0000000000000000000000000";
const sc = StringCodec();

const until = async (check: () => Promise<boolean>, ms = 20_000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("timed out");
};

describe("@apiserver/usage consumer", function () {
  this.timeout(120_000);
  let db: TestDb | undefined;
  let nc: NatsConnection | undefined;
  let jsm: JetStreamManager | undefined;

  before(async function () {
    const natsUrl = process.env.CONFORMANCE_NATS_URL;
    if (!natsUrl) return this.skip();
    db = await createTestDb();
    if (!db) return this.skip();
    nc = await connect({ servers: natsUrl });
    jsm = await nc.jetstreamManager();
    await jsm.streams.delete(USAGE_STREAM).catch(() => undefined);
  });

  beforeEach(async () => {
    await jsm?.streams.delete(USAGE_STREAM).catch(() => undefined);
  });

  after(async () => {
    await jsm?.streams.delete(USAGE_STREAM).catch(() => undefined);
    await nc?.close();
    await db?.drop();
  });

  it("keeps usage published while the store is down and stores it once it is back", async () => {
    let down = true;
    const store = db!.prisma as UsageDb;
    const flaky: UsageDb = {
      $queryRawUnsafe: (q, ...v) => store.$queryRawUnsafe(q, ...v),
      $executeRawUnsafe: (q, ...v) => store.$executeRawUnsafe(q, ...v),
      $transaction: (fn) =>
        down
          ? Promise.reject(new Error("database unavailable"))
          : store.$transaction(fn)
    };
    const stop = await runUsageConsumer({
      nc: nc!,
      db: flaky,
      directory: () => ({
        workspace: async () => ({ ownerRef: "user-owner" })
      }),
      retryDelayMs: 200,
      ackWaitMs: 2_000
    });
    try {
      const line = {
        meter: "llm.tokens.in" as const,
        provider: "openai",
        keySource: "platform" as const
      };
      for (let step = 0; step < 10; step++)
        nc!.publish(
          usageSubject(WS, line.meter),
          sc.encode(
            JSON.stringify({
              ...line,
              quantity: 100,
              id: Usage.usageId(`eval-1|${step}`, line),
              workspaceRef: WS,
              region: "default",
              regionKind: "public",
              origin: "eval",
              occurredAt: "2026-10-20T12:00:00.000Z"
            })
          )
        );
      await nc!.flush();
      await new Promise((r) => setTimeout(r, 1_000));
      expect(await db!.prisma.usageEvent.count()).to.equal(0);
      down = false;
      await until(async () => (await db!.prisma.usageEvent.count()) === 10);
      const [total] = await db!.prisma.usageDaily.findMany();
      expect(Number(total.quantity)).to.equal(1000);
      expect(total.origin).to.equal("eval");
    } finally {
      await stop();
    }
  });

  it("acknowledges a message that is not usage instead of retrying it", async () => {
    const stop = await runUsageConsumer({
      nc: nc!,
      db: db!.prisma as UsageDb,
      directory: () => ({
        workspace: async () => ({ ownerRef: "user-owner" })
      }),
      retryDelayMs: 200
    });
    try {
      nc!.publish(usageSubject(WS, "call.seconds"), sc.encode("not json"));
      nc!.publish(
        usageSubject(WS, "video.seconds"),
        sc.encode(JSON.stringify({ meter: "video.seconds" }))
      );
      await nc!.flush();
      await until(
        async () => (await jsm!.streams.info(USAGE_STREAM)).state.messages === 0
      );
    } finally {
      await stop();
    }
  });
});

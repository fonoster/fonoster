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
import { ingestUsageIn } from "../../src/usage/ingestUsage";
import {
  ensureRecordedUsageStream,
  publishRecordedUsageOnce,
  RECORDED_USAGE_STREAM,
  RecordedUsage
} from "../../src/usage/publishRecordedUsage";
import { UsageDb } from "../../src/usage/types";
import { createTestDb, TestDb } from "../../../common/test/persistence/testDb";

// The billing outbox (add-billing-service D2) on a throwaway Postgres and the conformance NATS
// server (PERSISTENCE_TEST_DATABASE_URL, CONFORMANCE_NATS_URL); skipped without them.

const WS = "WOrecorded00000000000000000000000";
const sc = StringCodec();

const line = (n: number): Usage.UsageLine => ({
  meter: "tts.characters",
  quantity: 100 + n,
  provider: "elevenlabs",
  keySource: "platform"
});
const idOf = (n: number) => Usage.usageId(`call-${n}`, line(n));
const event = (n: number) => ({
  ...line(n),
  id: idOf(n),
  workspaceRef: WS,
  callRef: `call-${n}`,
  region: "default",
  regionKind: "public",
  origin: "call",
  occurredAt: new Date(Date.UTC(2026, 9, 21, 12, n)).toISOString()
});

describe("@apiserver/usage billing outbox", function () {
  this.timeout(60_000);
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
    await jsm.streams.delete(RECORDED_USAGE_STREAM).catch(() => undefined);
    await ensureRecordedUsageStream(nc);
    const store = db.prisma as UsageDb;
    // One transaction each, so they are stored in order.
    for (const n of [1, 2, 3])
      await store.$transaction((tx) =>
        ingestUsageIn(
          tx,
          { workspace: async () => ({ ownerRef: "user-owner" }) },
          [event(n)]
        )
      );
  });

  after(async () => {
    await jsm?.streams.delete(RECORDED_USAGE_STREAM).catch(() => undefined);
    await nc?.close();
    await db?.drop();
  });

  const streamed = async (): Promise<RecordedUsage[]> => {
    const info = await jsm!.streams.info(RECORDED_USAGE_STREAM);
    const out: RecordedUsage[] = [];
    for (let seq = info.state.first_seq; seq <= info.state.last_seq; seq++) {
      const m = await jsm!.streams.getMessage(RECORDED_USAGE_STREAM, { seq });
      out.push(JSON.parse(sc.decode(m.data)));
    }
    return out;
  };

  it("[BIL-015] publishes stored usage once, oldest first, with its owner", async () => {
    const store = db!.prisma as UsageDb;
    expect(await publishRecordedUsageOnce(nc!, store, 2)).to.equal(2);
    expect(await publishRecordedUsageOnce(nc!, store, 2)).to.equal(1);
    expect(await publishRecordedUsageOnce(nc!, store, 2)).to.equal(0);
    const events = await streamed();
    expect(events.map((e) => e.id)).to.deep.equal([idOf(1), idOf(2), idOf(3)]);
    expect(events[0]).to.include({
      ownerRef: "user-owner",
      meter: "tts.characters",
      quantity: 101,
      keySource: "platform"
    });
  });

  it("[BIL-015] keeps one copy when a batch is published again after a crash", async () => {
    const store = db!.prisma as UsageDb;
    // The crash: published, but never marked.
    await store.$executeRawUnsafe(
      "UPDATE usage_events SET published_at = NULL"
    );
    expect(await publishRecordedUsageOnce(nc!, store)).to.equal(3);
    expect((await streamed()).map((e) => e.id)).to.deep.equal([
      idOf(1),
      idOf(2),
      idOf(3)
    ]);
  });
});

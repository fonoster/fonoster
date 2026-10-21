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
import { expect } from "chai";
import { connect, NatsConnection, StringCodec } from "nats";
import { applyUsage } from "../src/applyUsage";
import { ManualClock } from "../src/clock";
import { grant } from "../src/ledger";
import { credits } from "../src/money";
import { RateCard } from "../src/rateCards";
import { runUsageConsumer } from "../src/runUsageConsumer";
import { RECORDED_USAGE_STREAM, RecordedUsage } from "../src/usage";
import { BillingTestDb, createBillingTestDb } from "./testDb";

// Rating stored usage (add-billing-service 3.5, billing "The same usage twice") on a real Postgres,
// and the consumer on the conformance NATS server; skipped without them.

const card: RateCard = {
  version: 1,
  startsAt: new Date("2026-11-01T00:00:00Z"),
  source: "test",
  prices: { "call.seconds": 0.08, "tts.characters": { "*": 0.018 } }
};
const NOW = new Date("2026-11-15T12:00:00Z");
let n = 0;

const usage = (
  owner: string,
  o: Partial<RecordedUsage> = {}
): RecordedUsage => ({
  id: `usg_test${String(++n).padStart(22, "a")}`,
  ownerRef: owner,
  workspaceRef: "WO-A",
  callRef: "call-1",
  region: "default",
  regionKind: "public",
  origin: "call",
  meter: "call.seconds",
  quantity: 160,
  occurredAt: "2026-11-15T11:00:00Z",
  ...o
});

describe("@billing usage", function () {
  this.timeout(60_000);
  let db: BillingTestDb | undefined;

  before(async function () {
    db = await createBillingTestDb();
    if (!db) return this.skip();
  });
  after(async () => db?.drop());

  async function account(owner: string, credit = 2500) {
    const a = await db!.prisma.billingAccount.create({
      data: {
        ownerRef: owner,
        plan: "payg",
        billingStartedAt: new Date("2026-11-01T00:00:00Z")
      }
    });
    await db!.prisma.$transaction((tx) =>
      grant(tx, a.id, {
        kind: "topup_grant",
        amount: credits(credit),
        source: `seed-${owner}`
      })
    );
    return a;
  }

  it("[BIL-031] rates and debits a usage event once, however often it arrives", async () => {
    await account("owner-once");
    const u = usage("owner-once");
    const first = await applyUsage(db!.prisma, [card], u, NOW);
    expect(first).to.include({
      status: "rated",
      billable: true,
      amount: credits(12.8)
    });
    expect(await applyUsage(db!.prisma, [card], u, NOW)).to.deep.equal({
      status: "duplicate"
    });
    const lines = await db!.prisma.ratedLine.findMany({
      where: { usageId: u.id }
    });
    expect(lines).to.have.length(1);
  });

  it("[BIL-028] keeps free lines with their reason and does not debit them", async () => {
    const a = await account("owner-free");
    const r = await applyUsage(
      db!.prisma,
      [card],
      usage("owner-free", {
        meter: "stt.seconds",
        provider: "deepgram",
        keySource: "workspace"
      }),
      NOW
    );
    expect(r).to.include({ status: "rated", billable: false, reason: "byok" });
    const snap = await db!.prisma.balanceSnapshot.findUnique({
      where: { accountId: a.id }
    });
    expect(snap?.balance).to.equal(credits(2500));
  });

  it("[BIL-028] does not bill owners without a billing account", async () => {
    expect(
      await applyUsage(db!.prisma, [card], usage("owner-nobody"), NOW)
    ).to.deep.equal({
      status: "no_account"
    });
  });

  describe("consumer", function () {
    let nc: NatsConnection | undefined;

    before(async function () {
      if (!process.env.CONFORMANCE_NATS_URL) return this.skip();
      nc = await connect({ servers: process.env.CONFORMANCE_NATS_URL });
      const jsm = await nc.jetstreamManager();
      await jsm.streams.delete(RECORDED_USAGE_STREAM).catch(() => undefined);
    });
    after(async () => {
      const jsm = await nc?.jetstreamManager();
      await jsm?.streams.delete(RECORDED_USAGE_STREAM).catch(() => undefined);
      await nc?.close();
    });

    it("[BIL-031] rates usage published on the stream, once even when published twice", async () => {
      const a = await account("owner-stream");
      const stop = await runUsageConsumer({
        nc: nc!,
        prisma: db!.prisma,
        cards: [card],
        clock: new ManualClock(NOW),
        retryDelayMs: 100
      });
      const u = usage("owner-stream", {
        meter: "tts.characters",
        provider: "elevenlabs",
        keySource: "platform",
        quantity: 1000
      });
      const sc = StringCodec();
      const js = nc!.jetstream();
      await js.publish(
        `billing.usage.owner-stream`,
        sc.encode(JSON.stringify(u))
      );
      await js.publish(
        `billing.usage.owner-stream`,
        sc.encode(JSON.stringify(u))
      );
      const end = Date.now() + 10_000;
      let balance: bigint | undefined;
      while (Date.now() < end) {
        balance = (
          await db!.prisma.balanceSnapshot.findUnique({
            where: { accountId: a.id }
          })
        )?.balance;
        if (balance === credits(2500 - 18)) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      await new Promise((r) => setTimeout(r, 300));
      await stop();
      expect(
        (
          await db!.prisma.balanceSnapshot.findUnique({
            where: { accountId: a.id }
          })
        )?.balance
      ).to.equal(credits(2482));
    });
  });
});

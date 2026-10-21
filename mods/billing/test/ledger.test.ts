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
import { DEFAULT_PLANS } from "../src/config";
import {
  balanceOf,
  carryOver,
  debit,
  expireDue,
  expireGrants,
  grant,
  grantsOf,
  lockAccount,
  overdraftLimit
} from "../src/ledger";
import { credits } from "../src/money";
import { createBillingTestDb, BillingTestDb } from "./testDb";

// The balance ledger (add-billing-service D6, billing "The balance is a ledger" and "Plans") on a
// real Postgres (PERSISTENCE_TEST_DATABASE_URL); skipped without one.

const PERIOD_START = new Date("2026-11-01T00:00:00Z");
const PERIOD_END = new Date("2026-12-01T00:00:00Z");
const GRACE_END = new Date("2026-12-04T00:00:00Z");
const MID = new Date("2026-11-15T00:00:00Z");

describe("@billing ledger", function () {
  this.timeout(60_000);
  let db: BillingTestDb | undefined;
  let n = 0;

  before(async function () {
    db = await createBillingTestDb();
    if (!db) return this.skip();
  });
  after(async () => db?.drop());

  const account = (plan = "payg") =>
    db!.prisma.billingAccount.create({
      data: { ownerRef: `owner-${++n}`, plan }
    });

  const planGrant = (accountId: string) =>
    db!.prisma.$transaction((tx) =>
      grant(tx, accountId, {
        kind: "plan_grant",
        amount: credits(2500),
        source: "period-1",
        effectiveAt: PERIOD_START,
        coversUntil: PERIOD_END,
        expiresAt: GRACE_END
      })
    );
  const topup = (accountId: string, amount: number) =>
    db!.prisma.$transaction((tx) =>
      grant(tx, accountId, {
        kind: "topup_grant",
        amount: credits(amount),
        source: `topup-${amount}`,
        expiresAt: new Date("2027-11-01T00:00:00Z")
      })
    );
  const spend = (accountId: string, amount: number, at = MID, now = MID) =>
    db!.prisma.$transaction(async (tx) => {
      await lockAccount(tx, accountId);
      return debit(tx, accountId, credits(amount), `usage-${amount}`, at, now);
    });
  const left = async (accountId: string) =>
    Object.fromEntries(
      (await grantsOf(db!.prisma, accountId)).map((g) => [
        g.bucket,
        Number(g.remaining) / 1000
      ])
    );

  it("[BIL-032] spends plan credits before top-ups", async () => {
    const a = await account();
    await planGrant(a.id);
    await topup(a.id, 1000);
    expect(await spend(a.id, 3000)).to.equal(credits(500));
    expect(await left(a.id)).to.deep.equal({ plan: 0, topup: 500 });
  });

  it("[BIL-032] expires unused plan credits after the grace period and leaves top-ups", async () => {
    const a = await account();
    await planGrant(a.id);
    await topup(a.id, 1000);
    await spend(a.id, 2200);
    expect(await expireGrants(db!.prisma, a.id, PERIOD_END)).to.equal(0);
    expect(await expireGrants(db!.prisma, a.id, GRACE_END)).to.equal(1);
    expect(await left(a.id)).to.deep.equal({ plan: 0, topup: 1000 });
    expect(await balanceOf(db!.prisma, a.id)).to.equal(credits(1000));
  });

  it("[BIL-033] pays usage of the period's last hour from that period's plan credits during the grace", async () => {
    const a = await account();
    await planGrant(a.id);
    await topup(a.id, 1000);
    const lastHour = new Date("2026-11-30T23:30:00Z");
    const graceNow = new Date("2026-12-02T00:00:00Z");
    await spend(a.id, 100, lastHour, graceNow);
    expect(await left(a.id)).to.deep.equal({ plan: 2400, topup: 1000 });
    // Usage of the next period during the grace does not touch it.
    await spend(a.id, 100, new Date("2026-12-01T10:00:00Z"), graceNow);
    expect(await left(a.id)).to.deep.equal({ plan: 2400, topup: 900 });
  });

  it("[BIL-033] carries what is left of the Trial to the first period's end and grace, balance unchanged", async () => {
    const a = await account("trial");
    await db!.prisma.$transaction((tx) =>
      grant(tx, a.id, {
        kind: "trial_grant",
        amount: credits(1000),
        source: "trial",
        expiresAt: PERIOD_END
      })
    );
    await spend(a.id, 100);
    const [trial] = await grantsOf(db!.prisma, a.id);
    const carried = await db!.prisma.$transaction((tx) =>
      carryOver(tx, a.id, trial, {
        coversUntil: PERIOD_END,
        expiresAt: GRACE_END,
        source: "trial:in_1"
      })
    );
    expect(carried!.expiresAt).to.deep.equal(GRACE_END);
    expect(await balanceOf(db!.prisma, a.id)).to.equal(credits(900));
    // The old grant is empty; the carried one outlives the Trial's 30 days, through the grace.
    expect(await expireGrants(db!.prisma, a.id, PERIOD_END)).to.equal(0);
    const trials = (await grantsOf(db!.prisma, a.id))
      .filter((g) => g.bucket === "trial")
      .map((g) => Number(g.remaining) / 1000)
      .sort((x, y) => x - y);
    expect(trials).to.deep.equal([0, 900]);
    expect(await expireGrants(db!.prisma, a.id, GRACE_END)).to.equal(1);
    expect(await balanceOf(db!.prisma, a.id)).to.equal(0n);
  });

  it("[BIL-034] goes into the overdraft, and the next grant pays it back first", async () => {
    const a = await account();
    await topup(a.id, 100);
    expect(await spend(a.id, 150)).to.equal(-credits(50));
    await topup(a.id, 1000);
    expect(await balanceOf(db!.prisma, a.id)).to.equal(credits(950));
    const remaining = (await grantsOf(db!.prisma, a.id)).reduce(
      (s, g) => s + g.remaining,
      0n
    );
    expect(remaining).to.equal(credits(950));
    expect(
      await db!.prisma.balanceSnapshot.findUnique({
        where: { accountId: a.id }
      })
    ).to.include({ balance: credits(950) });
  });

  it("[BIL-034] sizes the overdraft from the last top-up, and gives a trial none", async () => {
    const a = await account();
    expect(await overdraftLimit(db!.prisma, a, DEFAULT_PLANS)).to.equal(
      credits(200)
    );
    await topup(a.id, 5000);
    expect(await overdraftLimit(db!.prisma, a, DEFAULT_PLANS)).to.equal(
      credits(500)
    );
    const trial = await account("trial");
    expect(await overdraftLimit(db!.prisma, trial, DEFAULT_PLANS)).to.equal(0n);
  });

  it("[BIL-032] sweeps expired grants of every account once", async () => {
    const a = await account();
    const b = await account();
    await planGrant(a.id);
    await planGrant(b.id);
    expect(await expireDue(db!.prisma, GRACE_END)).to.be.at.least(2);
    expect(await expireDue(db!.prisma, GRACE_END)).to.equal(0);
    expect(await balanceOf(db!.prisma, a.id)).to.equal(0n);
  });
});

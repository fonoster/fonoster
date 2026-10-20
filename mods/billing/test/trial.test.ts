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
import { ensureAccount } from "../src/admission";
import { DEFAULT_PLANS } from "../src/config";
import { balanceOf, debit, expireDue, lockAccount } from "../src/ledger";
import { credits } from "../src/money";
import { setTrialDays, TrialError } from "../src/trial";
import { BillingTestDb, createBillingTestDb } from "./testDb";

// The Trial's length (billing "The Trial ends"): a default from the configuration, changed per
// owner by an operator. On a real Postgres (PERSISTENCE_TEST_DATABASE_URL); skipped without one.

const DAY = 86_400_000;
const START = new Date("2026-11-01T00:00:00Z");
const at = (days: number) => new Date(START.getTime() + days * DAY);

describe("@billing trial length", function () {
  this.timeout(60_000);
  let db: BillingTestDb | undefined;
  let n = 0;

  before(async function () {
    db = await createBillingTestDb();
    if (!db) return this.skip();
  });
  after(async () => db?.drop());

  const trialOwner = async () => {
    const owner = `owner-trial-${++n}`;
    const a = await ensureAccount(db!.prisma, owner, DEFAULT_PLANS, START);
    return { owner, a };
  };
  const account = (id: string) =>
    db!.prisma.billingAccount.findUniqueOrThrow({ where: { id } });
  const spend = (id: string, amount: number, when: Date) =>
    db!.prisma.$transaction(async (tx) => {
      await lockAccount(tx, id);
      return debit(tx, id, credits(amount), `use-${amount}`, when, when);
    });

  it("lasts the configured default from its start", async () => {
    const { a } = await trialOwner();
    expect((await account(a.id)).trialEndsAt).to.deep.equal(at(30));
  });

  it("extends a Trial before it ends, keeping its credits", async () => {
    const { owner, a } = await trialOwner();
    await spend(a.id, 140, at(5));
    const change = await setTrialDays(
      db!.prisma,
      owner,
      45,
      DEFAULT_PLANS,
      at(10)
    );
    expect(change).to.include({ reopened: false });
    expect(change.endsAt).to.deep.equal(at(45));
    expect(change.remaining).to.equal(credits(860));
    await expireDue(db!.prisma, at(31));
    expect((await account(a.id)).status).to.equal("active");
    expect(await balanceOf(db!.prisma, a.id)).to.equal(credits(860));
    await expireDue(db!.prisma, at(46));
    expect((await account(a.id)).status).to.equal("ended");
    expect(await balanceOf(db!.prisma, a.id)).to.equal(0n);
  });

  it("reopens an ended Trial with the credits it had left, once", async () => {
    const { owner, a } = await trialOwner();
    await spend(a.id, 300, at(3));
    await expireDue(db!.prisma, at(31));
    expect((await account(a.id)).status).to.equal("ended");
    const change = await setTrialDays(
      db!.prisma,
      owner,
      60,
      DEFAULT_PLANS,
      at(32)
    );
    expect(change).to.include({ reopened: true });
    expect(change.remaining).to.equal(credits(700));
    expect((await account(a.id)).status).to.equal("active");
    // Changing it again does not give the credits back twice.
    await setTrialDays(db!.prisma, owner, 70, DEFAULT_PLANS, at(33));
    expect(await balanceOf(db!.prisma, a.id)).to.equal(credits(700));
  });

  it("ends a Trial cut short at once", async () => {
    const { owner, a } = await trialOwner();
    const change = await setTrialDays(
      db!.prisma,
      owner,
      3,
      DEFAULT_PLANS,
      at(5)
    );
    expect(change.endsAt).to.deep.equal(at(3));
    expect((await account(a.id)).status).to.equal("ended");
    expect(await balanceOf(db!.prisma, a.id)).to.equal(0n);
  });

  it("refuses to change the Trial of an owner on Pay-as-you-go", async () => {
    const { owner, a } = await trialOwner();
    await db!.prisma.billingAccount.update({
      where: { id: a.id },
      data: { plan: "payg" }
    });
    const error = await setTrialDays(
      db!.prisma,
      owner,
      45,
      DEFAULT_PLANS,
      at(1)
    ).catch((e) => e);
    expect(error).to.be.instanceOf(TrialError);
  });
});

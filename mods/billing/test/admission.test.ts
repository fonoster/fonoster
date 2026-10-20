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
import { VoiceRequest } from "@fonoster/authz";
import { RegistryActiveCalls } from "../src/activeCalls";
import { BillingAuthzHandler, ensureAccount } from "../src/admission";
import { ManualClock } from "../src/clock";
import { DEFAULT_PLANS } from "../src/config";
import { debit, grant, lockAccount } from "../src/ledger";
import { credits } from "../src/money";
import { BillingTestDb, createBillingTestDb } from "./testDb";

// Admission from the ledger (add-billing-service D7, billing "Admission from the ledger") on a real
// Postgres (PERSISTENCE_TEST_DATABASE_URL); skipped without one.

const NOW = new Date("2026-11-15T12:00:00Z");

describe("@billing admission", function () {
  this.timeout(60_000);
  let db: BillingTestDb | undefined;
  const owners = new Map<string, string>();
  const active = new Map<string, number>();
  let handler: BillingAuthzHandler;

  before(async function () {
    db = await createBillingTestDb();
    if (!db) return this.skip();
    handler = new BillingAuthzHandler({
      prisma: db.prisma,
      directory: { ownerOf: async (ws) => owners.get(ws) },
      activeCalls: { count: (owner) => active.get(owner) ?? 0 },
      plans: DEFAULT_PLANS,
      clock: new ManualClock(NOW)
    });
  });
  after(async () => db?.drop());

  const check = (accessKeyId: string) =>
    handler.checkSessionAuthorized({
      accessKeyId,
      appRef: "app",
      callRef: "c"
    } as VoiceRequest);

  async function payg(owner: string, workspace: string, credit: number) {
    owners.set(workspace, owner);
    const a = await db!.prisma.billingAccount.create({
      data: { ownerRef: owner, plan: "payg" }
    });
    if (credit)
      await db!.prisma.$transaction((tx) =>
        grant(tx, a.id, {
          kind: "topup_grant",
          amount: credits(credit),
          source: `seed-${owner}`
        })
      );
    return a;
  }

  it("starts a new owner on the Trial with 1,000 credits", async () => {
    owners.set("WO-new", "owner-new");
    expect(await check("WO-new")).to.deep.equal({ authorized: true });
    const account = await db!.prisma.billingAccount.findUnique({
      where: { ownerRef: "owner-new" }
    });
    expect(account?.plan).to.equal("trial");
    const snap = await db!.prisma.balanceSnapshot.findUnique({
      where: { accountId: account!.id }
    });
    expect(snap?.balance).to.equal(credits(1000));
    // Asking again does not grant again.
    await ensureAccount(db!.prisma, "owner-new", DEFAULT_PLANS, NOW);
    expect(
      await db!.prisma.ledgerEntry.count({ where: { accountId: account!.id } })
    ).to.equal(1);
  });

  it("refuses with insufficient_balance once balance and overdraft are gone", async () => {
    const a = await payg("owner-broke", "WO-broke", 100);
    const spend = (n: number) =>
      db!.prisma.$transaction(async (tx) => {
        await lockAccount(tx, a.id);
        await debit(tx, a.id, credits(n), `use-${n}`, NOW, NOW);
      });
    await spend(150);
    // 50 into the 200-credit overdraft: still admitted.
    expect(await check("WO-broke")).to.deep.equal({ authorized: true });
    await spend(150);
    expect(await check("WO-broke")).to.deep.equal({
      authorized: false,
      reason: "insufficient_balance"
    });
  });

  it("refuses a trial at zero, which has no overdraft", async () => {
    owners.set("WO-trial0", "owner-trial0");
    const a = await ensureAccount(
      db!.prisma,
      "owner-trial0",
      DEFAULT_PLANS,
      NOW
    );
    await db!.prisma.$transaction(async (tx) => {
      await lockAccount(tx, a.id);
      await debit(tx, a.id, credits(1000), "use-all", NOW, NOW);
    });
    expect((await check("WO-trial0")).reason).to.equal("insufficient_balance");
  });

  it("refuses with concurrency_limit at the plan's limit", async () => {
    await payg("owner-busy", "WO-busy", 1000);
    active.set("owner-busy", DEFAULT_PLANS.concurrency.payg);
    expect(await check("WO-busy")).to.deep.equal({
      authorized: false,
      reason: "concurrency_limit"
    });
    active.set("owner-busy", DEFAULT_PLANS.concurrency.payg - 1);
    expect(await check("WO-busy")).to.deep.equal({ authorized: true });
  });

  it("admits apps without an owner", async () => {
    expect(await check("WO-unknown")).to.deep.equal({ authorized: true });
  });

  it("answers in under 5 ms at p99", async () => {
    await payg("owner-fast", "WO-fast", 1000);
    // Warm up first: the first checks pay for connections and query plans, not admission.
    for (let i = 0; i < 50; i++) await check("WO-fast");
    const times: number[] = [];
    for (let i = 0; i < 300; i++) {
      const t = process.hrtime.bigint();
      await check("WO-fast");
      times.push(Number(process.hrtime.bigint() - t) / 1e6);
    }
    times.sort((a, b) => a - b);
    expect(times[Math.floor(times.length * 0.99)]).to.be.below(5);
  });
});

describe("@billing active calls", function () {
  it("counts an owner's answered calls until they end or their lease lapses", async () => {
    let now = 0;
    const calls = new RegistryActiveCalls(
      { ownerOf: async (ws) => (ws === "WO-A" ? "owner-a" : undefined) },
      () => now,
      15_000
    );
    const entry = (id: string, workspaceRef?: string, writtenAt = now) => ({
      kind: "calls" as const,
      id,
      value: workspaceRef ? { workspaceRef } : { callRef: id },
      writtenAt: new Date(writtenAt)
    });
    await calls.apply(entry("c1")); // not answered yet
    await calls.apply(entry("c1", "WO-A"));
    await calls.apply(entry("c2", "WO-A"));
    await calls.apply(entry("c3", "WO-other"));
    expect(calls.count("owner-a")).to.equal(2);
    await calls.apply({ kind: "calls", id: "c2", writtenAt: new Date(now) });
    expect(calls.count("owner-a")).to.equal(1);
    now = 20_000;
    expect(calls.count("owner-a")).to.equal(0);
  });
});

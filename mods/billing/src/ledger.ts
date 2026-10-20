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
import { PlanSettings } from "./config";
import { Db, Prisma, PrismaClient } from "./db";
import { credits } from "./money";

/**
 * The balance ledger (add-billing-service D6): append-only entries in milli-credits. Grants add;
 * debits, expiries and refunds take from one grant, or from the overdraft. The balance is the sum
 * of every entry. Callers run these inside a transaction that holds the account's lock
 * (`lockAccount`), so two debits of one account never interleave.
 */

export type GrantKind = "trial_grant" | "plan_grant" | "topup_grant";
export type Bucket = "trial" | "plan" | "topup" | "overdraft";

const BUCKET_OF: Record<GrantKind, Bucket> = {
  trial_grant: "trial",
  plan_grant: "plan",
  topup_grant: "topup"
};

/** Plan and trial credits are spent before top-ups (billing "The balance is a ledger"). */
const PRIORITY: Record<string, number> = { plan: 0, trial: 0, topup: 1 };

export type GrantRemaining = {
  id: string;
  bucket: Bucket;
  remaining: bigint;
  expiresAt: Date | null;
  effectiveAt: Date | null;
  coversUntil: Date | null;
  createdAt: Date;
};

/** Holds the account's row lock until the transaction ends. */
export async function lockAccount(tx: Db, accountId: string) {
  await tx.$queryRaw`SELECT id FROM billing_accounts WHERE id = ${accountId} FOR UPDATE`;
}

/** Every grant of the account with what is left of it. */
export async function grantsOf(
  tx: Db,
  accountId: string
): Promise<GrantRemaining[]> {
  const rows = await tx.$queryRaw<
    {
      id: string;
      bucket: Bucket;
      remaining: bigint;
      expires_at: Date | null;
      effective_at: Date | null;
      covers_until: Date | null;
      created_at: Date;
    }[]
  >`
    SELECT g.id, g.bucket, g.expires_at, g.effective_at, g.covers_until, g.created_at,
           g.amount_milli + COALESCE(SUM(e.amount_milli), 0) AS remaining
      FROM balance_ledger g
      LEFT JOIN balance_ledger e ON e.grant_id = g.id
     WHERE g.account_id = ${accountId} AND g.kind IN ('trial_grant', 'plan_grant', 'topup_grant')
     GROUP BY g.id`;
  return rows.map((r) => ({
    id: r.id,
    bucket: r.bucket,
    remaining: BigInt(r.remaining),
    expiresAt: r.expires_at,
    effectiveAt: r.effective_at,
    coversUntil: r.covers_until,
    createdAt: r.created_at
  }));
}

/** The balance: the sum of every entry. */
export async function balanceOf(tx: Db, accountId: string): Promise<bigint> {
  const [row] = await tx.$queryRaw<{ balance: bigint | null }[]>`
    SELECT SUM(amount_milli) AS balance FROM balance_ledger WHERE account_id = ${accountId}`;
  return BigInt(row?.balance ?? 0);
}

/** What the overdraft owes now (zero or positive). */
async function overdraftOwed(tx: Db, accountId: string): Promise<bigint> {
  const [row] = await tx.$queryRaw<{ owed: bigint | null }[]>`
    SELECT -SUM(amount_milli) AS owed FROM balance_ledger
     WHERE account_id = ${accountId} AND bucket = 'overdraft'`;
  const owed = BigInt(row?.owed ?? 0);
  return owed > 0n ? owed : 0n;
}

/** Keeps the admission snapshot equal to the ledger's sum. */
async function snapshot(tx: Db, accountId: string) {
  const balance = await balanceOf(tx, accountId);
  await tx.balanceSnapshot.upsert({
    where: { accountId },
    create: { accountId, balance },
    update: { balance }
  });
  return balance;
}

/**
 * Adds credits. A grant first pays back what the overdraft owes, so what is left of each grant
 * always adds up to the balance.
 */
export async function grant(
  tx: Db,
  accountId: string,
  g: {
    kind: GrantKind;
    amount: bigint;
    source: string;
    expiresAt?: Date;
    effectiveAt?: Date;
    coversUntil?: Date;
  }
) {
  const entry = await tx.ledgerEntry.create({
    data: {
      accountId,
      kind: g.kind,
      bucket: BUCKET_OF[g.kind],
      amount: g.amount,
      source: g.source,
      expiresAt: g.expiresAt,
      effectiveAt: g.effectiveAt,
      coversUntil: g.coversUntil
    }
  });
  const repay = [await overdraftOwed(tx, accountId), g.amount].reduce((a, b) =>
    a < b ? a : b
  );
  if (repay > 0n)
    await tx.ledgerEntry.createMany({
      data: [
        {
          accountId,
          kind: "debit",
          bucket: BUCKET_OF[g.kind],
          amount: -repay,
          grantId: entry.id,
          source: `overdraft_repay:${entry.id}`
        },
        {
          accountId,
          kind: "adjustment",
          bucket: "overdraft",
          amount: repay,
          source: `overdraft_repay:${entry.id}`
        }
      ]
    });
  await snapshot(tx, accountId);
  return entry;
}

/** Whether a grant can pay for usage that happened at `occurredAt`, at `now`. */
export const canPay = (g: GrantRemaining, occurredAt: Date, now: Date) =>
  g.remaining > 0n &&
  (!g.expiresAt || now < g.expiresAt) &&
  (!g.effectiveAt || occurredAt >= g.effectiveAt) &&
  (!g.coversUntil || occurredAt < g.coversUntil);

/** Spending order: plan and trial first, then top-ups by earliest expiry (D6). */
const order = (a: GrantRemaining, b: GrantRemaining) =>
  PRIORITY[a.bucket] - PRIORITY[b.bucket] ||
  (a.expiresAt?.getTime() ?? Infinity) - (b.expiresAt?.getTime() ?? Infinity) ||
  a.createdAt.getTime() - b.createdAt.getTime();

/**
 * Takes an amount for usage that happened at `occurredAt`: from the grants that can pay for it, in
 * spending order, and what is left from the overdraft. Returns the balance after.
 */
export async function debit(
  tx: Db,
  accountId: string,
  amount: bigint,
  source: string,
  occurredAt: Date,
  now: Date
): Promise<bigint> {
  let left = amount;
  const grants = (await grantsOf(tx, accountId))
    .filter((g) => canPay(g, occurredAt, now))
    .sort(order);
  const entries: Prisma.LedgerEntryCreateManyInput[] = [];
  for (const g of grants) {
    if (left === 0n) break;
    const take = g.remaining < left ? g.remaining : left;
    entries.push({
      accountId,
      kind: "debit",
      bucket: g.bucket,
      amount: -take,
      grantId: g.id,
      source
    });
    left -= take;
  }
  if (left > 0n)
    entries.push({
      accountId,
      kind: "debit",
      bucket: "overdraft",
      amount: -left,
      source
    });
  if (entries.length) await tx.ledgerEntry.createMany({ data: entries });
  return snapshot(tx, accountId);
}

/** Removes what is left of every grant that expired by `now`. Returns how many expired. */
export async function expireGrants(
  tx: Db,
  accountId: string,
  now: Date
): Promise<number> {
  const expired = (await grantsOf(tx, accountId)).filter(
    (g) => g.expiresAt && g.expiresAt <= now && g.remaining > 0n
  );
  if (!expired.length) return 0;
  await tx.ledgerEntry.createMany({
    data: expired.map((g) => ({
      accountId,
      kind: "expiry",
      bucket: g.bucket,
      amount: -g.remaining,
      grantId: g.id,
      source: `expiry:${g.id}`
    }))
  });
  await snapshot(tx, accountId);
  return expired.length;
}

/** Expires what is left of every grant that expired by `now`, account by account. */
export async function expireDue(
  prisma: PrismaClient,
  now: Date
): Promise<number> {
  const due = await prisma.$queryRaw<{ account_id: string }[]>`
    SELECT DISTINCT g.account_id FROM balance_ledger g
     WHERE g.kind IN ('trial_grant', 'plan_grant', 'topup_grant') AND g.expires_at <= ${now}
       AND NOT EXISTS (SELECT 1 FROM balance_ledger x WHERE x.grant_id = g.id AND x.kind = 'expiry')`;
  let expired = 0;
  for (const { account_id } of due)
    expired += await prisma.$transaction(async (tx) => {
      await lockAccount(tx, account_id);
      return expireGrants(tx, account_id, now);
    });
  return expired;
}

/** The overdraft an account may use: the larger of a floor and a share of the last top-up. */
export async function overdraftLimit(
  tx: Db,
  account: { id: string; plan: string },
  plans: PlanSettings
): Promise<bigint> {
  if (account.plan === "trial") return 0n;
  const last = await tx.ledgerEntry.findFirst({
    where: { accountId: account.id, kind: "topup_grant" },
    orderBy: { createdAt: "desc" }
  });
  const floor = credits(plans.overdraftMinCredits);
  const share = last
    ? (last.amount * BigInt(Math.round(plans.overdraftPercent * 100))) / 10_000n
    : 0n;
  return share > floor ? share : floor;
}

/** Rebuilds the admission snapshot of every account from the ledger. */
export async function rebuildSnapshots(tx: Db) {
  const accounts = await tx.billingAccount.findMany({ select: { id: true } });
  for (const a of accounts) await snapshot(tx, a.id);
  return accounts.length;
}

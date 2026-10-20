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
import { ensureAccount } from "./admission";
import { PlanSettings } from "./config";
import { PrismaClient } from "./db";
import {
  carryOver,
  endTrials,
  expireGrants,
  grant,
  grantsOf,
  lockAccount
} from "./ledger";

const DAY_MS = 24 * 3600_000;

export class TrialError extends Error {}

export type TrialChange = {
  accountId: string;
  /** The Trial's new end. */
  endsAt: Date;
  /** Credits left on the Trial, in milli-credits. */
  remaining: bigint;
  /** Whether a Trial that had ended opened again. */
  reopened: boolean;
};

/**
 * Sets how many days an owner's Trial lasts, counted from its start (billing "The Trial ends"): the
 * default comes from the configuration, and an operator changes it per account. What is left of
 * the Trial's credits moves to the new end. A Trial that had ended and now ends later opens again
 * with the credits it had left when it ended. An owner on Pay-as-you-go has no Trial to change.
 */
export async function setTrialDays(
  prisma: PrismaClient,
  ownerRef: string,
  days: number,
  plans: PlanSettings,
  now: Date
): Promise<TrialChange> {
  if (!Number.isInteger(days) || days < 0)
    throw new TrialError("days must be a whole number, 0 or more");
  const created = await ensureAccount(prisma, ownerRef, plans, now);
  const change = await prisma.$transaction(async (tx) => {
    await lockAccount(tx, created.id);
    const account = await tx.billingAccount.findUniqueOrThrow({
      where: { id: created.id }
    });
    if (account.plan !== "trial")
      throw new TrialError(
        "the owner is on Pay-as-you-go: there is no Trial to change"
      );
    const endsAt = new Date(account.billingStartedAt.getTime() + days * DAY_MS);
    const source = `trial-days:${days}:${now.toISOString()}`;
    const trials = (await grantsOf(tx, account.id)).filter(
      (g) => g.bucket === "trial"
    );
    let remaining = 0n;
    for (const g of trials.filter(
      (g) => g.remaining > 0n && (!g.expiresAt || g.expiresAt > now)
    )) {
      await carryOver(tx, account.id, g, { expiresAt: endsAt, source });
      remaining += g.remaining;
    }
    // Reopening: give back what expired with the Trial's time, once.
    let reopened = false;
    if (account.status === "ended" && endsAt > now) {
      const [row] = await tx.$queryRaw<
        { expired: bigint | null; restored: bigint | null }[]
      >`
        SELECT
          (SELECT -SUM(amount_milli) FROM balance_ledger
            WHERE account_id = ${account.id} AND kind = 'expiry' AND bucket = 'trial'
              AND source LIKE 'expiry:%') AS expired,
          (SELECT SUM(amount_milli) FROM balance_ledger
            WHERE account_id = ${account.id} AND kind = 'trial_grant'
              AND source LIKE 'trial-reopen:%') AS restored`;
      const restore = BigInt(row?.expired ?? 0) - BigInt(row?.restored ?? 0);
      if (restore > 0n) {
        await grant(tx, account.id, {
          kind: "trial_grant",
          amount: restore,
          source: `trial-reopen:${now.toISOString()}`,
          expiresAt: endsAt
        });
        remaining += restore;
      }
      reopened = true;
    }
    await tx.billingAccount.update({
      where: { id: account.id },
      data: {
        trialEndsAt: endsAt,
        ...(reopened ? { status: "active" } : {})
      }
    });
    // A Trial cut short ends now, not at the next sweep.
    if (endsAt <= now) await expireGrants(tx, account.id, now);
    return { accountId: account.id, endsAt, remaining, reopened };
  });
  if (change.endsAt <= now) await endTrials(prisma, now);
  return change;
}

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
import { addMonths } from "./clock";
import { PlanSettings } from "./config";
import { PrismaClient } from "./db";
import { grant, lockAccount } from "./ledger";
import { credits as toMilli } from "./money";
import { enqueue } from "./stripe/outbox";
import { OperatorError } from "./trial";

export type CreditsAdded = {
  accountId: string;
  /** trial or payg: which rules the credits follow. */
  plan: string;
  expiresAt: Date;
};

/**
 * Adds credits to an owner by hand (billing "An operator adds credits"), under the rules the
 * owner's plan already has. On the Trial they are Trial credits: they last until the Trial ends. On
 * Pay-as-you-go they are a top-up the owner did not pay for: 12 months, spent like top-ups, and
 * mirrored to Stripe so both balances agree.
 */
export async function addCredits(
  prisma: PrismaClient,
  ownerRef: string,
  amount: number,
  plans: PlanSettings,
  now: Date,
  note = "operator"
): Promise<CreditsAdded> {
  if (!Number.isInteger(amount) || amount <= 0)
    throw new OperatorError("credits must be a whole number above 0");
  const created = await ensureAccount(prisma, ownerRef, plans, now);
  return prisma.$transaction(async (tx) => {
    await lockAccount(tx, created.id);
    const account = await tx.billingAccount.findUniqueOrThrow({
      where: { id: created.id }
    });
    const source = `operator:${note}:${now.toISOString()}`;
    if (account.plan === "trial") {
      if (
        account.status === "ended" ||
        !account.trialEndsAt ||
        account.trialEndsAt <= now
      )
        throw new OperatorError(
          "the Trial has ended: extend it first (fonoster-billing-admin trial)"
        );
      await grant(tx, account.id, {
        kind: "trial_grant",
        amount: toMilli(amount),
        source,
        expiresAt: account.trialEndsAt
      });
      return {
        accountId: account.id,
        plan: "trial",
        expiresAt: account.trialEndsAt
      };
    }
    const expiresAt = addMonths(now, plans.topupMonths);
    const entry = await grant(tx, account.id, {
      kind: "topup_grant",
      amount: toMilli(amount),
      source,
      expiresAt
    });
    await enqueue(tx, account.id, {
      kind: "credit_grant",
      payload: {
        ledgerEntryId: entry.id,
        cents: amount,
        category: "paid",
        expiresAt: Math.floor(expiresAt.getTime() / 1000),
        name: `Credits from Fonoster: ${note}`
      }
    });
    return { accountId: account.id, plan: account.plan, expiresAt };
  });
}

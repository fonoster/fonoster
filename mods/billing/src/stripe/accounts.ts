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
import { PlanSettings } from "../config";
import { BillingAccount, Db } from "../db";
import { lockAccount } from "../ledger";
import { centsOf, credits } from "../money";
import { enqueue } from "./outbox";

export class BillingError extends Error {}

/** Moves an account to Pay-as-you-go: the Stripe customer (if new) and the subscription. */
export async function subscribe(tx: Db, accountId: string) {
  await lockAccount(tx, accountId);
  const account = await tx.billingAccount.findUniqueOrThrow({
    where: { id: accountId }
  });
  if (account.stripeSubscriptionId) return;
  if (!account.stripeCustomerId)
    await enqueue(tx, accountId, { kind: "customer", payload: {} });
  await enqueue(tx, accountId, { kind: "subscription", payload: {} });
}

/** Creates the Stripe customer (for the Customer Portal), once. */
export async function ensureCustomer(tx: Db, accountId: string) {
  const account = await tx.billingAccount.findUniqueOrThrow({
    where: { id: accountId }
  });
  if (account.stripeCustomerId) return;
  const pending = await tx.stripeOutbox.findFirst({
    where: { accountId, kind: "customer", sentAt: null }
  });
  if (!pending) await enqueue(tx, accountId, { kind: "customer", payload: {} });
}

/** Buys top-up credits; they reach the ledger when Stripe confirms the payment. */
export async function topUp(
  tx: Db,
  accountId: string,
  amountCredits: number,
  plans: PlanSettings,
  purpose: "topup" | "recharge" = "topup"
) {
  if (!Number.isInteger(amountCredits) || amountCredits < plans.topupMinCredits)
    throw new BillingError(
      `a top-up is at least ${plans.topupMinCredits} credits`
    );
  await enqueue(tx, accountId, {
    kind: "payment_intent",
    payload: {
      cents: Number(centsOf(credits(amountCredits))),
      credits: amountCredits,
      purpose
    }
  });
}

/**
 * Starts one auto-recharge when the balance has crossed the owner's threshold and none is in
 * flight (billing "Auto-recharge"). Runs in the debit's transaction, under the account's lock.
 */
export async function maybeRecharge(
  tx: Db,
  account: BillingAccount,
  balance: bigint,
  plans: PlanSettings,
  now: Date
) {
  if (
    !account.autoRecharge ||
    account.rechargeThreshold === null ||
    account.rechargeAmount === null ||
    account.rechargePendingAt ||
    balance >= account.rechargeThreshold
  )
    return false;
  await tx.billingAccount.update({
    where: { id: account.id },
    data: { rechargePendingAt: now }
  });
  await topUp(
    tx,
    account.id,
    Math.max(plans.topupMinCredits, Number(centsOf(account.rechargeAmount))),
    plans,
    "recharge"
  );
  return true;
}

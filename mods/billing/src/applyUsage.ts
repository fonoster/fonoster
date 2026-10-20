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
import { getLogger } from "@fonoster/logger";
import { Db, PrismaClient } from "./db";
import { debit, lockAccount } from "./ledger";
import { cardAt, RateCard } from "./rateCards";
import { rate, Rated } from "./rater";
import { RecordedUsage } from "./usage";

const logger = getLogger({ service: "billing", filePath: __filename });

export type Applied =
  | { status: "no_account" }
  | { status: "duplicate" }
  | ({ status: "rated"; balance?: bigint } & Rated);

/**
 * Rates one stored usage event and debits it, once per usage id, in one transaction that holds
 * the account's lock (billing "Rated lines follow fixed rules", "The same usage twice"). Usage of
 * an owner without a billing account is not billed.
 */
export async function applyUsage(
  prisma: PrismaClient,
  cards: RateCard[],
  usage: RecordedUsage,
  now: Date
): Promise<Applied> {
  return prisma.$transaction(async (tx: Db) => {
    const account = await tx.billingAccount.findUnique({
      where: { ownerRef: usage.ownerRef }
    });
    if (!account) return { status: "no_account" } as const;
    await lockAccount(tx, account.id);
    const occurredAt = new Date(usage.occurredAt);
    const rated = rate(
      usage,
      account.billingStartedAt,
      cardAt(cards, occurredAt)
    );
    const { count } = await tx.ratedLine.createMany({
      data: [
        {
          usageId: usage.id,
          accountId: account.id,
          workspaceRef: usage.workspaceRef,
          callRef: usage.callRef,
          meter: usage.meter,
          quantity: BigInt(usage.quantity),
          provider: usage.provider,
          model: usage.model,
          keySource: usage.keySource,
          origin: usage.origin,
          billable: rated.billable,
          reason: rated.reason,
          amount: rated.amount,
          rateCardVersion: rated.rateCardVersion,
          category: rated.category,
          occurredAt
        }
      ],
      skipDuplicates: true
    });
    if (!count) return { status: "duplicate" } as const;
    if (rated.reason === "unpriced")
      // An alert: the rate card lacks a price, so this usage is given away until it has one.
      logger.error("usage has no price on the rate card; not billed", {
        usageId: usage.id,
        meter: usage.meter,
        provider: usage.provider,
        model: usage.model
      });
    if (!rated.billable || rated.amount === 0n)
      return { status: "rated", ...rated } as const;
    const balance = await debit(
      tx,
      account.id,
      rated.amount,
      usage.id,
      occurredAt,
      now
    );
    return { status: "rated", ...rated, balance } as const;
  });
}

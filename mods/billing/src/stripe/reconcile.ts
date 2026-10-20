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
import Stripe from "stripe";
import { PrismaClient } from "../db";
import { StripeCatalog } from "./catalog";

const logger = getLogger({ service: "billing", filePath: __filename });

/** An invoice whose usage line differs from what the ledger rated for its period. */
export type Drift = {
  accountId: string;
  ownerRef: string;
  invoice: string;
  /** The invoice's usage line, in cents. */
  stripeCents: number;
  /** The ledger's billable lines of the period, in cents as Stripe rounds them. */
  ledgerCents: number;
};

/**
 * Compares every subscribed account's paid invoices since `since` with the ledger (billing
 * "Ledger and Stripe reconcile"). Reports each difference and changes nothing.
 */
export async function reconcile(
  deps: { prisma: PrismaClient; stripe: Stripe; catalog: StripeCatalog },
  since: Date
): Promise<Drift[]> {
  const accounts = await deps.prisma.billingAccount.findMany({
    where: { stripeCustomerId: { not: null } }
  });
  const drifts: Drift[] = [];
  const from = Math.floor(since.getTime() / 1000);
  for (const account of accounts) {
    const invoices = await deps.stripe.invoices.list({
      customer: account.stripeCustomerId!,
      status: "paid",
      limit: 100
    });
    for (const invoice of invoices.data) {
      if ((invoice.status_transitions?.paid_at ?? invoice.created) < from)
        continue;
      const line = invoice.lines.data.find(
        (l) => l.pricing?.price_details?.price === deps.catalog.usagePrice
      );
      if (!line) continue;
      const [row] = await deps.prisma.$queryRaw<{ total: bigint | null }[]>`
        SELECT SUM(amount_milli) AS total FROM rated_lines
         WHERE account_id = ${account.id} AND billable
           AND occurred_at >= ${new Date(line.period.start * 1000)}
           AND occurred_at < ${new Date(line.period.end * 1000)}`;
      // A milli-credit is $0.00001; Stripe rounds the line once, half up.
      const ledgerCents = Math.round(Number(row?.total ?? 0) / 1000);
      if (ledgerCents !== line.amount) {
        const drift = {
          accountId: account.id,
          ownerRef: account.ownerRef,
          invoice: invoice.id!,
          stripeCents: line.amount,
          ledgerCents
        };
        logger.error("ledger and Stripe disagree", drift);
        drifts.push(drift);
      }
    }
  }
  return drifts;
}

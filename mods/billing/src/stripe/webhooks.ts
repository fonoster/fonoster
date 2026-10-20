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
import { IncomingMessage, ServerResponse } from "http";
import { getLogger } from "@fonoster/logger";
import Stripe from "stripe";
import { Clock } from "../clock";
import { PlanSettings } from "../config";
import { Db, Prisma, PrismaClient } from "../db";
import { grant, grantsOf, lockAccount } from "../ledger";
import { credits } from "../money";
import { Notifier } from "../notices";
import { StripeCatalog } from "./catalog";
import { enqueue } from "./outbox";

const logger = getLogger({ service: "billing", filePath: __filename });

const HOUR_MS = 3600_000;

/** Recharges in a row that may fail before auto-recharge turns off. */
export const MAX_RECHARGE_FAILURES = 3;

const addMonths = (d: Date, months: number) => {
  const out = new Date(d);
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
};

/**
 * The webhook inbox (D8): verifies Stripe's signature and stores each event once by id. Applying
 * happens later (`applyEventsOnce`), so a slow apply never makes Stripe retry.
 */
export function webhookReceiver(deps: {
  prisma: PrismaClient;
  stripe: Stripe;
  secret: string;
}) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = Buffer.concat(chunks);
    let event: Stripe.Event;
    try {
      event = deps.stripe.webhooks.constructEvent(
        body,
        String(req.headers["stripe-signature"] ?? ""),
        deps.secret
      );
    } catch (e) {
      res.writeHead(400).end(`invalid signature: ${(e as Error).message}`);
      return;
    }
    try {
      await deps.prisma.stripeEvent.createMany({
        data: [
          {
            id: event.id,
            type: event.type,
            payload: event as unknown as Prisma.InputJsonValue
          }
        ],
        skipDuplicates: true
      });
      res.writeHead(200).end();
    } catch (e) {
      logger.warn(
        `stripe event ${event.id} not stored: ${(e as Error).message}`
      );
      res.writeHead(500).end();
    }
  };
}

type Deps = {
  prisma: PrismaClient;
  catalog: StripeCatalog;
  plans: PlanSettings;
  clock: Clock;
  notifier: Notifier;
};

async function accountOfCustomer(tx: Db, customer: unknown) {
  const id =
    typeof customer === "string" ? customer : (customer as { id?: string })?.id;
  if (!id) return undefined;
  const account = await tx.billingAccount.findUnique({
    where: { stripeCustomerId: id }
  });
  if (account) await lockAccount(tx, account.id);
  return account ?? undefined;
}

/** A paid subscription invoice starts a period: its plan credits, here and in Stripe (D9). */
async function invoicePaid(tx: Db, deps: Deps, invoice: Stripe.Invoice) {
  const account = await accountOfCustomer(tx, invoice.customer);
  if (!account) return;
  const planLine = invoice.lines.data.find(
    (l) => l.pricing?.price_details?.price === deps.catalog.planPrice
  );
  if (!planLine) return;
  const start = new Date(planLine.period.start * 1000);
  const end = new Date(planLine.period.end * 1000);
  const expiresAt = new Date(end.getTime() + deps.plans.graceHours * HOUR_MS);
  // Leaving the Trial: what is left of it is mirrored too, so Stripe never charges for usage the
  // trial paid.
  if (account.plan === "trial")
    for (const g of await grantsOf(tx, account.id))
      if (g.bucket === "trial" && g.remaining > 0n)
        await enqueue(tx, account.id, {
          kind: "credit_grant",
          payload: {
            ledgerEntryId: g.id,
            cents: Number(g.remaining / 1000n),
            category: "promotional",
            ...(g.expiresAt
              ? { expiresAt: Math.floor(g.expiresAt.getTime() / 1000) }
              : {}),
            name: "Trial credits"
          }
        });
  await tx.billingAccount.update({
    where: { id: account.id },
    data: { plan: "payg", status: "active", periodStart: start, periodEnd: end }
  });
  const entry = await grant(tx, account.id, {
    kind: "plan_grant",
    amount: credits(deps.plans.planCredits),
    source: `invoice:${invoice.id}`,
    effectiveAt: start,
    coversUntil: end,
    expiresAt
  });
  await enqueue(tx, account.id, {
    kind: "credit_grant",
    payload: {
      ledgerEntryId: entry.id,
      cents: deps.plans.planCredits,
      category: "promotional",
      expiresAt: Math.floor(expiresAt.getTime() / 1000),
      name: `Plan credits ${start.toISOString().slice(0, 10)}`
    }
  });
}

/** A paid top-up or recharge adds credits that last 12 months, here and in Stripe. */
async function paymentSucceeded(tx: Db, deps: Deps, pi: Stripe.PaymentIntent) {
  const purpose = pi.metadata?.purpose;
  if (purpose !== "topup" && purpose !== "recharge") return;
  const account = await accountOfCustomer(tx, pi.customer);
  if (!account) return;
  const amount = Number(pi.metadata.credits);
  const expiresAt = addMonths(deps.clock.now(), deps.plans.topupMonths);
  const entry = await grant(tx, account.id, {
    kind: "topup_grant",
    amount: credits(amount),
    source: `payment_intent:${pi.id}`,
    expiresAt
  });
  await tx.billingAccount.update({
    where: { id: account.id },
    data: {
      rechargePendingAt: null,
      ...(purpose === "recharge" ? { rechargeFailures: 0 } : {})
    }
  });
  await enqueue(tx, account.id, {
    kind: "credit_grant",
    payload: {
      ledgerEntryId: entry.id,
      cents: amount,
      category: "paid",
      expiresAt: Math.floor(expiresAt.getTime() / 1000),
      name: `Top-up ${amount} credits`
    }
  });
}

/** A failed recharge counts; the third in a row turns auto-recharge off and tells the owner. */
async function paymentFailed(
  tx: Db,
  deps: Deps,
  pi: Stripe.PaymentIntent,
  auth: boolean
) {
  const purpose = pi.metadata?.purpose;
  if (purpose !== "topup" && purpose !== "recharge") return;
  const account = await accountOfCustomer(tx, pi.customer);
  if (!account) return;
  if (auth) {
    await tx.billingAccount.update({
      where: { id: account.id },
      data: { rechargePendingAt: null }
    });
    deps.notifier.notify(account.ownerRef, "authentication_required", {
      paymentIntent: pi.id
    });
    return;
  }
  if (purpose === "topup") {
    deps.notifier.notify(account.ownerRef, "topup_failed", {
      paymentIntent: pi.id
    });
    return;
  }
  const failures = account.rechargeFailures + 1;
  const off = failures >= MAX_RECHARGE_FAILURES;
  await tx.billingAccount.update({
    where: { id: account.id },
    data: {
      rechargeFailures: failures,
      rechargePendingAt: null,
      ...(off ? { autoRecharge: false } : {})
    }
  });
  if (off)
    deps.notifier.notify(account.ownerRef, "auto_recharge_disabled", {
      failures
    });
}

/** Applies one stored Stripe event. */
export async function applyEvent(tx: Db, deps: Deps, event: Stripe.Event) {
  switch (event.type) {
    case "invoice.paid":
      return invoicePaid(tx, deps, event.data.object as Stripe.Invoice);
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const account = await accountOfCustomer(tx, invoice.customer);
      if (!account) return;
      await tx.billingAccount.update({
        where: { id: account.id },
        data: { status: "past_due" }
      });
      deps.notifier.notify(account.ownerRef, "payment_failed", {
        invoice: invoice.id
      });
      return;
    }
    case "payment_intent.succeeded":
      return paymentSucceeded(
        tx,
        deps,
        event.data.object as Stripe.PaymentIntent
      );
    case "payment_intent.payment_failed":
      return paymentFailed(
        tx,
        deps,
        event.data.object as Stripe.PaymentIntent,
        false
      );
    case "payment_intent.requires_action":
      return paymentFailed(
        tx,
        deps,
        event.data.object as Stripe.PaymentIntent,
        true
      );
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const account = await accountOfCustomer(tx, sub.customer);
      if (account)
        await tx.billingAccount.update({
          where: { id: account.id },
          data: { status: "closed", stripeSubscriptionId: null }
        });
      return;
    }
    default:
      return;
  }
}

/** Applies stored events in the order they arrived, each once. Returns how many. */
export async function applyEventsOnce(deps: Deps): Promise<number> {
  const events = await deps.prisma.stripeEvent.findMany({
    where: { appliedAt: null },
    orderBy: { receivedAt: "asc" },
    take: 100
  });
  for (const e of events)
    await deps.prisma.$transaction(async (tx) => {
      await applyEvent(tx, deps, e.payload as unknown as Stripe.Event);
      await tx.stripeEvent.update({
        where: { id: e.id },
        data: { appliedAt: deps.clock.now() }
      });
    });
  return events.length;
}

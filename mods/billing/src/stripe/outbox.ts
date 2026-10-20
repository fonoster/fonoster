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
import { Clock } from "../clock";
import { Db, Prisma, PrismaClient } from "../db";
import { StripeCatalog, USAGE_METER_EVENT } from "./catalog";

const logger = getLogger({ service: "billing", filePath: __filename });

/** What Stripe must be told (D8). Written with the ledger change it follows from. */
export type OutboxIntent =
  | { kind: "customer"; payload: Record<string, never> }
  | { kind: "subscription"; payload: Record<string, never> }
  | {
      kind: "meter_event";
      payload: { usageId: string; value: string; timestamp: number };
    }
  | {
      kind: "credit_grant";
      payload: {
        ledgerEntryId: string;
        cents: number;
        category: "promotional" | "paid";
        expiresAt?: number;
        name: string;
      };
    }
  | {
      kind: "topup_invoice";
      payload: {
        cents: number;
        credits: number;
        purpose: "topup" | "recharge";
      };
    }
  | { kind: "refund"; payload: { paymentIntent: string; cents: number } };

export async function enqueue(tx: Db, accountId: string, intent: OutboxIntent) {
  return tx.stripeOutbox.create({
    data: {
      accountId,
      kind: intent.kind,
      payload: intent.payload as Prisma.InputJsonValue
    }
  });
}

/** Backoff after a failed send: 5 s, doubling, at most an hour. */
const backoffMs = (attempts: number) =>
  Math.min(3600_000, 5000 * 2 ** Math.max(0, attempts - 1));

class NotReady extends Error {}

type Deps = {
  prisma: PrismaClient;
  stripe: Stripe;
  catalog: StripeCatalog;
  clock: Clock;
  /** New customers join this Stripe test clock (tests, D10). */
  testClock?: string;
  /** Stripe Tax on the subscription and top-ups (Q6); on unless turned off. */
  automaticTax?: boolean;
};

type Row = {
  id: string;
  accountId: string | null;
  kind: string;
  payload: Prisma.JsonValue;
};

async function customerOf(deps: Deps, accountId: string) {
  const account = await deps.prisma.billingAccount.findUniqueOrThrow({
    where: { id: accountId }
  });
  if (!account.stripeCustomerId)
    throw new NotReady("the Stripe customer is not created yet");
  return { account, customer: account.stripeCustomerId };
}

/** Sends one intent with its row id as the idempotency key. Returns what Stripe answered. */
async function send(deps: Deps, row: Row): Promise<Prisma.InputJsonValue> {
  const { prisma, stripe, catalog } = deps;
  const idempotencyKey = row.id;
  const automaticTax = { enabled: deps.automaticTax ?? true };
  const accountId = row.accountId!;
  const p = row.payload as Record<string, unknown>;
  switch (row.kind) {
    case "customer": {
      const account = await prisma.billingAccount.findUniqueOrThrow({
        where: { id: accountId }
      });
      if (account.stripeCustomerId)
        return { customer: account.stripeCustomerId };
      const c = await stripe.customers.create(
        {
          metadata: { owner_ref: account.ownerRef, account_id: account.id },
          ...(deps.testClock ? { test_clock: deps.testClock } : {})
        },
        { idempotencyKey }
      );
      await prisma.billingAccount.update({
        where: { id: accountId },
        data: { stripeCustomerId: c.id }
      });
      return { customer: c.id };
    }
    case "subscription": {
      const { account, customer } = await customerOf(deps, accountId);
      if (account.stripeSubscriptionId)
        return { subscription: account.stripeSubscriptionId };
      const s = await stripe.subscriptions.create(
        {
          customer,
          items: [{ price: catalog.planPrice }, { price: catalog.usagePrice }],
          automatic_tax: automaticTax,
          metadata: { account_id: accountId }
        },
        { idempotencyKey }
      );
      await prisma.billingAccount.update({
        where: { id: accountId },
        data: { stripeSubscriptionId: s.id }
      });
      return { subscription: s.id, status: s.status };
    }
    case "meter_event": {
      const { customer } = await customerOf(deps, accountId);
      await stripe.billing.meterEvents.create(
        {
          event_name: USAGE_METER_EVENT,
          identifier: p.usageId as string,
          timestamp: p.timestamp as number,
          payload: { stripe_customer_id: customer, value: p.value as string }
        },
        { idempotencyKey }
      );
      return {};
    }
    case "credit_grant": {
      const { customer } = await customerOf(deps, accountId);
      const g = await stripe.billing.creditGrants.create(
        {
          customer,
          name: p.name as string,
          category: p.category as "promotional" | "paid",
          amount: {
            type: "monetary",
            monetary: { currency: "usd", value: p.cents as number }
          },
          applicability_config: { scope: { price_type: "metered" } },
          ...(p.expiresAt ? { expires_at: p.expiresAt as number } : {}),
          metadata: { ledger_entry: p.ledgerEntryId as string }
        },
        { idempotencyKey }
      );
      return { creditGrant: g.id };
    }
    case "topup_invoice": {
      // A one-off invoice, not a bare payment, so Stripe Tax can add tax on top (Q6). Each call has
      // its own key under the row's, so a retry finds what an earlier attempt made.
      const { account, customer } = await customerOf(deps, accountId);
      const c = (await stripe.customers.retrieve(customer)) as Stripe.Customer;
      if (!c.invoice_settings?.default_payment_method)
        throw new NotReady("the customer has no default payment method");
      const description = `${p.credits} credits`;
      const created = await stripe.invoices.create(
        {
          customer,
          automatic_tax: automaticTax,
          pending_invoice_items_behavior: "exclude",
          auto_advance: false,
          description,
          metadata: {
            account_id: account.id,
            purpose: p.purpose as string,
            credits: String(p.credits)
          }
        },
        { idempotencyKey: `${idempotencyKey}:invoice` }
      );
      await stripe.invoiceItems.create(
        {
          customer,
          invoice: created.id,
          amount: p.cents as number,
          currency: "usd",
          tax_behavior: "exclusive",
          description
        },
        { idempotencyKey: `${idempotencyKey}:item` }
      );
      const invoice = await stripe.invoices.retrieve(created.id!);
      if (invoice.status === "paid")
        return { invoice: invoice.id!, status: invoice.status };
      try {
        const paid = await stripe.invoices.pay(
          invoice.id!,
          {},
          { idempotencyKey: `${idempotencyKey}:pay` }
        );
        return { invoice: paid.id!, status: paid.status };
      } catch (e) {
        // A decline is an answer, not a failure to send: the webhooks handle it. A declined invoice
        // is voided so nobody pays it later by mistake; one that needs the owner to authenticate
        // stays open for them to finish.
        if (e instanceof Stripe.errors.StripeCardError) {
          if (e.code !== "invoice_payment_intent_requires_action")
            await stripe.invoices.voidInvoice(
              invoice.id!,
              {},
              { idempotencyKey: `${idempotencyKey}:void` }
            );
          return {
            invoice: invoice.id!,
            declined: e.decline_code ?? e.code ?? "card_error"
          };
        }
        throw e;
      }
    }
    case "refund": {
      const r = await stripe.refunds.create(
        {
          payment_intent: p.paymentIntent as string,
          amount: p.cents as number
        },
        { idempotencyKey }
      );
      return { refund: r.id };
    }
    default:
      throw new Error(`unknown outbox kind ${row.kind}`);
  }
}

/**
 * Sends what is due, oldest first. An account's intents go in order: when one fails, the account's
 * later ones wait for the next run. Returns how many were sent.
 */
export async function runOutboxOnce(deps: Deps): Promise<number> {
  const now = deps.clock.now();
  const rows = await deps.prisma.stripeOutbox.findMany({
    where: { sentAt: null },
    orderBy: { createdAt: "asc" },
    take: 200
  });
  const blocked = new Set<string>();
  let sent = 0;
  for (const row of rows) {
    const key = row.accountId ?? "";
    if (blocked.has(key)) continue;
    if (row.nextAttemptAt > now) {
      blocked.add(key);
      continue;
    }
    try {
      const result = await send(deps, row);
      await deps.prisma.stripeOutbox.update({
        where: { id: row.id },
        data: { sentAt: deps.clock.now(), result, attempts: { increment: 1 } }
      });
      sent++;
    } catch (e) {
      blocked.add(key);
      const attempts = row.attempts + 1;
      const message = (e as Error).message;
      if (!(e instanceof NotReady))
        logger.warn(
          `stripe ${row.kind} ${row.id} failed (attempt ${attempts}): ${message}`
        );
      await deps.prisma.stripeOutbox.update({
        where: { id: row.id },
        data: {
          attempts,
          lastError: message,
          nextAttemptAt: new Date(now.getTime() + backoffMs(attempts))
        }
      });
    }
  }
  return sent;
}

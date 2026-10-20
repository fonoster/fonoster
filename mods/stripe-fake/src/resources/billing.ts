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
import { missing, StripeError } from "../errors";
import { Json, StripeFake } from "../fake";
import { int, list, metadataOf, Route } from "../router";
import { applyCredits, expireGrants } from "./credits";
import { meterTotal } from "./meters";
import { charge } from "./payments";

const DAY = 86_400;
/** Payment retries after a failed invoice payment, in days after the failure (D4). */
const RETRY_DAYS = [3, 5, 7];

/** The end of a period that starts at `start`, one interval later (calendar months, as Stripe). */
export function addInterval(
  start: number,
  interval: string,
  count: number
): number {
  const d = new Date(start * 1000);
  if (interval === "day") return start + count * DAY;
  if (interval === "week") return start + count * 7 * DAY;
  if (interval === "year") d.setUTCFullYear(d.getUTCFullYear() + count);
  else d.setUTCMonth(d.getUTCMonth() + count);
  return Math.floor(d.getTime() / 1000);
}

function lineFor(
  fake: StripeFake,
  args: {
    invoice: string;
    price: Json;
    quantity: number;
    start: number;
    end: number;
    subscription?: string;
    item?: string;
    metered: boolean;
  }
): Json {
  const transform = args.price.transform_quantity as {
    divide_by: number;
    round: string;
  } | null;
  const billed = transform
    ? (transform.round === "down" ? Math.floor : Math.ceil)(
        args.quantity / transform.divide_by
      )
    : args.quantity;
  const unit = Number(
    args.price.unit_amount_decimal ?? args.price.unit_amount ?? 0
  );
  const amount = Math.round(billed * unit);
  const product = fake.objects.get(args.price.product as string);
  return {
    id: fake.id("il"),
    object: "line_item",
    amount,
    subtotal: amount,
    currency: args.price.currency,
    description: `${billed} × ${product?.name ?? "item"}`,
    invoice: args.invoice,
    period: { start: args.start, end: args.end },
    quantity: billed,
    quantity_decimal: String(billed),
    pricing: {
      price_details: { price: args.price.id, product: args.price.product },
      type: "price_details",
      unit_amount_decimal: String(unit)
    },
    parent: args.subscription
      ? {
          type: "subscription_item_details",
          invoice_item_details: null,
          subscription_item_details: {
            invoice_item: null,
            proration: false,
            proration_details: { credited_items: null },
            subscription: args.subscription,
            subscription_item: args.item
          }
        }
      : null,
    subscription: args.subscription ?? null,
    pretax_credit_amounts: [],
    discount_amounts: [],
    discountable: true,
    discounts: [],
    metadata: {},
    taxes: [],
    livemode: false,
    fake_metered: args.metered
  };
}

/**
 * Stripe computes tax only when it knows whether a price includes it: with no tax behavior and no
 * default in the Tax settings (the fake has none), automatic tax is refused.
 */
function requireTaxBehavior(prices: Json[], param: string) {
  if (prices.some((p) => (p.tax_behavior ?? "unspecified") === "unspecified"))
    throw new StripeError(
      400,
      "invalid_request_error",
      "Automatic tax needs a tax behavior on every price, or a default in the Tax settings.",
      { param }
    );
}

function totals(invoice: Json) {
  const lines = (invoice.lines as Json).data as Json[];
  const subtotal = lines.reduce((n, l) => n + (l.amount as number), 0);
  const credits = (
    (invoice.total_pretax_credit_amounts as Json[]) ?? []
  ).reduce((n, c) => n + (c.amount as number), 0);
  const tax = (invoice.fake_tax as number) ?? 0;
  const total = subtotal - credits + tax;
  return {
    subtotal,
    subtotal_excluding_tax: subtotal,
    total,
    total_excluding_tax: subtotal - credits,
    amount_due: total,
    amount_remaining: total - ((invoice.amount_paid as number) ?? 0)
  };
}

/** The invoice line for an invoice item. */
function itemLine(fake: StripeFake, ii: Json, invoice: string): Json {
  ii.invoice = invoice;
  return {
    id: fake.id("il"),
    object: "line_item",
    amount: ii.amount,
    subtotal: ii.amount,
    currency: ii.currency,
    description: ii.description,
    invoice,
    period: ii.period,
    quantity: 1,
    quantity_decimal: "1",
    pricing: null,
    parent: {
      type: "invoice_item_details",
      invoice_item_details: {
        invoice_item: ii.id,
        proration: false,
        proration_details: { credited_items: null },
        subscription: null
      },
      subscription_item_details: null
    },
    subscription: null,
    pretax_credit_amounts: [],
    discount_amounts: [],
    discountable: true,
    discounts: [],
    metadata: {},
    taxes: [],
    livemode: false,
    fake_metered: false
  };
}

/**
 * A draft invoice with the given lines. Subscription invoices take the customer's pending invoice
 * items; a one-off invoice takes them only when asked (`pending_invoice_items_behavior=include`).
 */
export function createInvoice(
  fake: StripeFake,
  args: {
    customer: string;
    subscription?: string;
    reason: string;
    start: number;
    end: number;
    collection?: string;
    lines: (invoice: string) => Json[];
    finalizeAt?: number | null;
    automaticTax?: boolean;
    includePending?: boolean;
  }
): Json {
  const clock = fake.clockOf(args.customer);
  const id = fake.id("in");
  const pending =
    (args.includePending ?? true)
      ? fake.all(
          "invoiceitem",
          (ii) => ii.customer === args.customer && ii.invoice === null
        )
      : [];
  const pendingLines = pending.map((ii) => itemLine(fake, ii, id));
  const lines = [...args.lines(id), ...pendingLines];
  const invoice = fake.create(
    "invoice",
    "in",
    {
      id,
      object: "invoice",
      customer: args.customer,
      status: "draft",
      billing_reason: args.reason,
      collection_method: args.collection ?? "charge_automatically",
      currency: (lines[0]?.currency as string) ?? "usd",
      automatic_tax: {
        enabled: args.automaticTax ?? false,
        disabled_reason: null,
        liability: null,
        provider: null,
        status: null
      },
      lines: {
        object: "list",
        data: lines,
        has_more: false,
        url: `/v1/invoices/${id}/lines`
      },
      period_start: args.start,
      period_end: args.end,
      auto_advance: true,
      automatically_finalizes_at: args.finalizeAt ?? null,
      attempt_count: 0,
      attempted: false,
      amount_paid: 0,
      amount_overpaid: 0,
      amount_shipping: 0,
      total_pretax_credit_amounts: [],
      total_discount_amounts: [],
      total_taxes: [],
      number: null,
      next_payment_attempt: null,
      parent: args.subscription
        ? {
            type: "subscription_details",
            quote_details: null,
            subscription_details: {
              metadata: {},
              subscription: args.subscription
            }
          }
        : null,
      status_transitions: {
        finalized_at: null,
        marked_uncollectible_at: null,
        paid_at: null,
        voided_at: null
      },
      metadata: {},
      test_clock: clock,
      webhooks_delivered_at: null,
      default_payment_method: null,
      due_date: null
    },
    clock
  );
  Object.assign(invoice, totals(invoice));
  fake.emit("invoice.created", invoice, undefined, clock);
  return invoice;
}

let invoiceNumber = 0;

/** Finalizes a draft: credits on metered lines, the tax stub, a number; then pays it (D4). */
export function finalize(fake: StripeFake, invoice: Json): Json {
  if (invoice.status !== "draft")
    throw new StripeError(
      400,
      "invalid_request_error",
      "This invoice is already finalized.",
      { code: "invoice_not_editable" }
    );
  const clock = fake.clockOf(invoice.customer as string);
  const now = fake.now(clock);
  const lines = (invoice.lines as Json).data as Json[];
  const metered = lines.filter((l) => l.fake_metered);
  const meteredAmount = metered.reduce((n, l) => n + (l.amount as number), 0);
  const debits =
    meteredAmount > 0
      ? applyCredits(
          fake,
          invoice.customer as string,
          meteredAmount,
          now,
          invoice.id as string,
          clock
        )
      : [];
  invoice.total_pretax_credit_amounts = debits.map((tx) => ({
    amount: (((tx.debit as Json).amount as Json).monetary as Json).value,
    credit_balance_transaction: tx.id,
    type: "credit_balance_transaction"
  }));
  // Spread the credits over the metered lines in order, for the line view.
  let credit = debits.reduce(
    (n, tx) =>
      n +
      ((((tx.debit as Json).amount as Json).monetary as Json).value as number),
    0
  );
  metered.forEach((l) => {
    const take = Math.min(credit, l.amount as number);
    credit -= take;
    if (take)
      l.pretax_credit_amounts = [
        {
          amount: take,
          credit_balance_transaction: null,
          type: "credit_balance_transaction"
        }
      ];
  });
  // Tax only when the invoice asks Stripe to compute it; without the customer's country it can't.
  const customer = fake.objects.get(invoice.customer as string);
  const country = (customer?.address as Json | null)?.country as
    string | undefined;
  const automaticTax = invoice.automatic_tax as Json;
  if (automaticTax.enabled)
    automaticTax.status = country ? "complete" : "requires_location_inputs";
  const rate =
    automaticTax.enabled && country ? (fake.taxRates[country] ?? 0) : 0;
  const taxable =
    lines.reduce((n, l) => n + (l.amount as number), 0) -
    (invoice.total_pretax_credit_amounts as Json[]).reduce(
      (n, c) => n + (c.amount as number),
      0
    );
  invoice.fake_tax = Math.round((taxable * rate) / 100);
  const previous = fake.update(invoice, {
    ...totals(invoice),
    status: "open",
    number: `FAKE-${String(++invoiceNumber).padStart(4, "0")}`,
    automatically_finalizes_at: null,
    status_transitions: {
      ...(invoice.status_transitions as Json),
      finalized_at: now
    }
  });
  fake.emit("invoice.finalized", invoice, previous, clock);
  if (invoice.collection_method === "charge_automatically") pay(fake, invoice);
  return invoice;
}

/** Attempts payment; on failure schedules the next retry and marks the subscription past due. */
export function pay(fake: StripeFake, invoice: Json): Json {
  const clock = fake.clockOf(invoice.customer as string);
  const now = fake.now(clock);
  const sub = invoice.parent
    ? fake.objects.get(
        ((invoice.parent as Json).subscription_details as Json)
          ?.subscription as string
      )
    : undefined;
  if ((invoice.amount_due as number) <= 0)
    return markPaid(fake, invoice, sub, now, clock);
  const customer = fake.objects.get(invoice.customer as string)!;
  const pm =
    (invoice.default_payment_method as string) ??
    (sub?.default_payment_method as string) ??
    ((customer.invoice_settings as Json)?.default_payment_method as string) ??
    null;
  const attempts = (invoice.attempt_count as number) + 1;
  const { intent, error } = charge(fake, {
    customer: invoice.customer as string,
    amount: invoice.amount_due as number,
    currency: invoice.currency as string,
    paymentMethod: pm,
    offSession: true,
    invoice: invoice.id as string,
    description: `Invoice ${invoice.number}`
  });
  if (!error && intent.status === "succeeded") {
    fake.update(invoice, { attempt_count: attempts, attempted: true });
    return markPaid(fake, invoice, sub, now, clock);
  }
  const retry = RETRY_DAYS[attempts - 1];
  const previous = fake.update(invoice, {
    attempt_count: attempts,
    attempted: true,
    next_payment_attempt: retry === undefined ? null : now + retry * DAY
  });
  fake.emit(
    intent.status === "requires_action"
      ? "invoice.payment_action_required"
      : "invoice.payment_failed",
    invoice,
    previous,
    clock
  );
  if (sub) {
    const status =
      retry === undefined
        ? "unpaid"
        : sub.status === "incomplete"
          ? "incomplete"
          : "past_due";
    if (sub.status !== status) {
      const prev = fake.update(sub, { status });
      fake.emit("customer.subscription.updated", sub, prev, clock);
    }
  }
  return invoice;
}

function markPaid(
  fake: StripeFake,
  invoice: Json,
  sub: Json | undefined,
  now: number,
  clock: string | null
): Json {
  const previous = fake.update(invoice, {
    status: "paid",
    amount_paid: invoice.amount_due,
    amount_remaining: 0,
    next_payment_attempt: null,
    status_transitions: {
      ...(invoice.status_transitions as Json),
      paid_at: now
    }
  });
  fake.emit("invoice.paid", invoice, previous, clock);
  fake.emit("invoice.payment_succeeded", invoice, undefined, clock);
  if (sub && sub.status !== "active" && sub.status !== "canceled") {
    const prev = fake.update(sub, { status: "active" });
    fake.emit("customer.subscription.updated", sub, prev, clock);
  }
  return invoice;
}

/** Renews a subscription at the end of its period: licensed in advance, metered in arrears. */
function renew(fake: StripeFake, sub: Json, clock: string | null) {
  const items = (sub.items as Json).data as Json[];
  const start = items[0].current_period_start as number;
  const end = items[0].current_period_end as number;
  if (sub.cancel_at_period_end) {
    const previous = fake.update(sub, {
      status: "canceled",
      canceled_at: end,
      ended_at: end
    });
    fake.emit("customer.subscription.deleted", sub, previous, clock);
    return;
  }
  const price0 = fake.objects.get((items[0].price as Json).id as string)!;
  const recurring = price0.recurring as Json;
  const nextEnd = addInterval(
    end,
    recurring.interval as string,
    recurring.interval_count as number
  );
  createInvoice(fake, {
    customer: sub.customer as string,
    subscription: sub.id as string,
    reason: "subscription_cycle",
    start,
    end,
    automaticTax: (sub.automatic_tax as Json).enabled as boolean,
    finalizeAt: end + fake.graceSeconds,
    lines: (invoice) =>
      items.map((item) => {
        const price = fake.objects.get((item.price as Json).id as string)!;
        const metered = (price.recurring as Json).usage_type === "metered";
        return lineFor(fake, {
          invoice,
          price,
          quantity: metered
            ? meterTotal(
                fake,
                (price.recurring as Json).meter as string,
                sub.customer as string,
                start,
                end
              )
            : (item.quantity as number),
          start: metered ? start : end,
          end: metered ? end : nextEnd,
          subscription: sub.id as string,
          item: item.id as string,
          metered
        });
      })
  });
  items.forEach((item) => {
    item.current_period_start = end;
    item.current_period_end = nextEnd;
  });
  fake.emit("customer.subscription.updated", sub, { items: undefined }, clock);
}

type Due = { at: number; run: () => void };

/** Everything due on a clock (or on no clock) at or before `until`, earliest first. */
function dueWork(fake: StripeFake, clock: string | null, until: number): Due[] {
  const onClock = (customer: unknown) =>
    fake.clockOf(customer as string) === clock;
  const due: Due[] = [];
  fake
    .all(
      "subscription",
      (s) =>
        onClock(s.customer) &&
        s.status !== "canceled" &&
        s.status !== "incomplete_expired"
    )
    .forEach((s) => {
      const end =
        (((s.items as Json).data as Json[])[0]?.current_period_end as number) ??
        Infinity;
      if (end <= until) due.push({ at: end, run: () => renew(fake, s, clock) });
    });
  fake
    .all(
      "invoice",
      (i) =>
        onClock(i.customer) &&
        i.status === "draft" &&
        i.automatically_finalizes_at !== null
    )
    .forEach((i) => {
      if ((i.automatically_finalizes_at as number) <= until)
        due.push({
          at: i.automatically_finalizes_at as number,
          run: () => finalize(fake, i)
        });
    });
  fake
    .all(
      "invoice",
      (i) =>
        onClock(i.customer) &&
        i.status === "open" &&
        i.next_payment_attempt !== null
    )
    .forEach((i) => {
      if ((i.next_payment_attempt as number) <= until)
        due.push({
          at: i.next_payment_attempt as number,
          run: () => pay(fake, i)
        });
    });
  fake
    .all(
      "billing.credit_grant",
      (g) => onClock(g.customer) && g.expires_at !== null && !g.fake_expired
    )
    .forEach((g) => {
      if ((g.expires_at as number) <= until)
        due.push({
          at: g.expires_at as number,
          run: () => expireGrants(fake, g.expires_at as number, clock)
        });
    });
  return due.sort((a, b) => a.at - b.at);
}

/**
 * Moves a clock (a test clock, or the account's own time) to `target`, running everything that
 * comes due on the way in time order (D4).
 */
export function advance(
  fake: StripeFake,
  clock: string | null,
  target: number
) {
  const set = (t: number) => {
    if (clock)
      fake.objects.get(clock)!.frozen_time = Math.max(fake.now(clock), t);
    else fake.offset += Math.max(0, t - fake.now());
  };
  for (let guard = 0; guard < 10_000; guard++) {
    const [next] = dueWork(fake, clock, target);
    if (!next) break;
    set(next.at);
    next.run();
  }
  set(target);
  fake.notify({ kind: "clock", id: clock ?? undefined });
}

export const billingRoutes: Route[] = [
  // ---- subscriptions ----
  {
    method: "post",
    path: "/v1/subscriptions",
    handler: ({ fake, body }) => {
      if (!body.customer) throw missing("customer");
      const customer = fake.get(
        body.customer as string,
        "customer",
        "customer"
      );
      const items = (body.items as Json[] | undefined) ?? [];
      if (!items.length) throw missing("items");
      const clock = fake.clockOf(customer.id as string);
      const now = fake.now(clock);
      const prices = items.map((it, i) =>
        fake.get(it.price as string, "price", `items[${i}][price]`)
      );
      const automaticTax =
        (body.automatic_tax as Json | undefined)?.enabled === "true";
      if (automaticTax) requireTaxBehavior(prices, "items");
      const recurring = prices[0].recurring as Json | null;
      if (!recurring)
        throw new StripeError(
          400,
          "invalid_request_error",
          "Subscription items need recurring prices.",
          { param: "items[0][price]" }
        );
      const end = addInterval(
        now,
        recurring.interval as string,
        recurring.interval_count as number
      );
      const id = fake.id("sub");
      const subItems = prices.map((price, i) => ({
        id: fake.id("si"),
        object: "subscription_item",
        created: now,
        current_period_start: now,
        current_period_end: end,
        metadata: {},
        price,
        quantity:
          (price.recurring as Json).usage_type === "metered"
            ? undefined
            : Number(items[i].quantity ?? 1),
        subscription: id,
        discounts: [],
        tax_rates: [],
        billing_thresholds: null,
        plan: null,
        livemode: false
      }));
      const sub = fake.create(
        "subscription",
        "sub",
        {
          id,
          object: "subscription",
          customer: customer.id,
          status: "incomplete",
          items: {
            object: "list",
            data: subItems,
            has_more: false,
            url: `/v1/subscription_items?subscription=${id}`
          },
          collection_method:
            (body.collection_method as string) ?? "charge_automatically",
          default_payment_method:
            (body.default_payment_method as string) ?? null,
          automatic_tax: {
            enabled: automaticTax,
            disabled_reason: null,
            liability: null
          },
          cancel_at_period_end: body.cancel_at_period_end === "true",
          billing_cycle_anchor: now,
          billing_mode: {
            type: "flexible",
            flexible: { proration_discounts: "included" },
            updated_at: now
          },
          start_date: now,
          metadata: metadataOf(body),
          latest_invoice: null,
          test_clock: clock,
          currency: prices[0].currency,
          canceled_at: null,
          ended_at: null
        },
        clock
      );
      fake.emit("customer.subscription.created", sub, undefined, clock);
      // The first invoice bills licensed items in advance and is finalized at once, as on Stripe.
      const licensed = subItems.filter(
        (it) => (it.price.recurring as Json).usage_type !== "metered"
      );
      const invoice = createInvoice(fake, {
        customer: customer.id as string,
        subscription: id,
        reason: "subscription_create",
        start: now,
        end: now,
        automaticTax,
        collection: sub.collection_method as string,
        lines: (inv) =>
          licensed.map((it) =>
            lineFor(fake, {
              invoice: inv,
              price: it.price,
              quantity: it.quantity as number,
              start: now,
              end,
              subscription: id,
              item: it.id,
              metered: false
            })
          )
      });
      sub.latest_invoice = invoice.id;
      finalize(fake, invoice);
      if (invoice.status === "paid" || licensed.length === 0) {
        const prev = fake.update(sub, { status: "active" });
        fake.emit("customer.subscription.updated", sub, prev, clock);
      }
      return sub;
    }
  },
  {
    method: "get",
    path: "/v1/subscriptions/{subscription_exposed_id}",
    handler: ({ fake, params }) =>
      fake.get(
        params.subscription_exposed_id,
        "subscription",
        "subscription_exposed_id"
      )
  },
  {
    method: "post",
    path: "/v1/subscriptions/{subscription_exposed_id}",
    handler: ({ fake, params, body }) => {
      const sub = fake.get(
        params.subscription_exposed_id,
        "subscription",
        "subscription_exposed_id"
      );
      const fields: Json = {};
      if (body.cancel_at_period_end !== undefined)
        fields.cancel_at_period_end = body.cancel_at_period_end === "true";
      if (body.default_payment_method !== undefined)
        fields.default_payment_method = body.default_payment_method || null;
      if (body.metadata !== undefined)
        fields.metadata = metadataOf(body, sub.metadata as Json);
      const previous = fake.update(sub, fields);
      fake.emit(
        "customer.subscription.updated",
        sub,
        previous,
        fake.clockOf(sub.customer as string)
      );
      return sub;
    }
  },
  {
    method: "delete",
    path: "/v1/subscriptions/{subscription_exposed_id}",
    handler: ({ fake, params }) => {
      const sub = fake.get(
        params.subscription_exposed_id,
        "subscription",
        "subscription_exposed_id"
      );
      const clock = fake.clockOf(sub.customer as string);
      const now = fake.now(clock);
      const previous = fake.update(sub, {
        status: "canceled",
        canceled_at: now,
        ended_at: now
      });
      fake.emit("customer.subscription.deleted", sub, previous, clock);
      return sub;
    }
  },
  {
    method: "get",
    path: "/v1/subscriptions",
    handler: ({ fake, body }) =>
      list(
        "/v1/subscriptions",
        fake.all(
          "subscription",
          (s) =>
            (!body.customer || s.customer === body.customer) &&
            (!body.status || body.status === "all" || s.status === body.status)
        ),
        body
      )
  },
  // ---- invoice items and invoices ----
  {
    method: "post",
    path: "/v1/invoiceitems",
    handler: ({ fake, body }) => {
      if (!body.customer) throw missing("customer");
      fake.get(body.customer as string, "customer", "customer");
      const amount = int(body.amount);
      if (amount === undefined) throw missing("amount");
      const clock = fake.clockOf(body.customer as string);
      const now = fake.now(clock);
      const invoice = body.invoice
        ? fake.get(body.invoice as string, "invoice", "invoice")
        : undefined;
      if (invoice && invoice.status !== "draft")
        throw new StripeError(
          400,
          "invalid_request_error",
          "Invoice items can only be added to draft invoices.",
          { param: "invoice", code: "invoice_not_editable" }
        );
      const taxBehavior = (body.tax_behavior as string) ?? "unspecified";
      if (invoice && (invoice.automatic_tax as Json).enabled)
        requireTaxBehavior([{ tax_behavior: taxBehavior }], "tax_behavior");
      const item = fake.create(
        "invoiceitem",
        "ii",
        {
          object: "invoiceitem",
          customer: body.customer,
          amount,
          currency: (body.currency as string) ?? "usd",
          description: body.description ?? null,
          invoice: null,
          period: { start: now, end: now },
          metadata: metadataOf(body),
          date: now,
          quantity: 1,
          quantity_decimal: "1",
          pricing: null,
          fake_tax_behavior: taxBehavior
        },
        clock
      );
      fake.emit("invoiceitem.created", item, undefined, clock);
      if (invoice) {
        ((invoice.lines as Json).data as Json[]).push(
          itemLine(fake, item, invoice.id as string)
        );
        Object.assign(invoice, totals(invoice));
      }
      return item;
    }
  },
  {
    method: "post",
    path: "/v1/invoices",
    handler: ({ fake, body }) => {
      if (!body.customer) throw missing("customer");
      fake.get(body.customer as string, "customer", "customer");
      const now = fake.now(fake.clockOf(body.customer as string));
      const invoice = createInvoice(fake, {
        customer: body.customer as string,
        reason: "manual",
        start: now,
        end: now,
        collection:
          (body.collection_method as string) ?? "charge_automatically",
        automaticTax:
          (body.automatic_tax as Json | undefined)?.enabled === "true",
        includePending: body.pending_invoice_items_behavior === "include",
        lines: () => []
      });
      fake.update(invoice, {
        auto_advance: body.auto_advance === "true",
        metadata: metadataOf(body),
        default_payment_method: (body.default_payment_method as string) ?? null
      });
      return invoice;
    }
  },
  {
    method: "get",
    path: "/v1/invoices/{invoice}",
    handler: ({ fake, params }) =>
      fake.get(params.invoice, "invoice", "invoice")
  },
  {
    method: "post",
    path: "/v1/invoices/{invoice}",
    handler: ({ fake, params, body }) => {
      const invoice = fake.get(params.invoice, "invoice", "invoice");
      const fields: Json = {};
      if (body.metadata !== undefined)
        fields.metadata = metadataOf(body, invoice.metadata as Json);
      if (body.auto_advance !== undefined)
        fields.auto_advance = body.auto_advance === "true";
      const previous = fake.update(invoice, fields);
      fake.emit(
        "invoice.updated",
        invoice,
        previous,
        fake.clockOf(invoice.customer as string)
      );
      return invoice;
    }
  },
  {
    method: "post",
    path: "/v1/invoices/{invoice}/finalize",
    handler: ({ fake, params }) => {
      const invoice = fake.get(params.invoice, "invoice", "invoice");
      const auto = invoice.collection_method;
      // Finalizing by hand does not pay; /pay does.
      invoice.collection_method = "send_invoice";
      finalize(fake, invoice);
      invoice.collection_method = auto;
      return invoice;
    }
  },
  {
    method: "post",
    path: "/v1/invoices/{invoice}/pay",
    handler: ({ fake, params, body }) => {
      const invoice = fake.get(params.invoice, "invoice", "invoice");
      if (invoice.status === "draft") {
        invoice.collection_method = "send_invoice";
        finalize(fake, invoice);
        invoice.collection_method = "charge_automatically";
      }
      if (invoice.status !== "open")
        throw new StripeError(
          400,
          "invalid_request_error",
          "Invoice is already paid.",
          { code: "invoice_payment_intent_requires_action" }
        );
      if (body.payment_method)
        invoice.default_payment_method = body.payment_method;
      pay(fake, invoice);
      if ((invoice.status as string) !== "paid") {
        const intent = fake
          .all("payment_intent", (pi) => pi.fake_invoice === invoice.id)
          .pop();
        if (intent?.status === "requires_action")
          throw new StripeError(
            402,
            "card_error",
            "This payment requires additional user action before it can be completed.",
            { code: "invoice_payment_intent_requires_action" }
          );
        throw new StripeError(402, "card_error", "Your card was declined.", {
          code: "card_declined"
        });
      }
      return invoice;
    }
  },
  {
    method: "post",
    path: "/v1/invoices/{invoice}/void",
    handler: ({ fake, params }) => {
      const invoice = fake.get(params.invoice, "invoice", "invoice");
      if (invoice.status !== "open")
        throw new StripeError(
          400,
          "invalid_request_error",
          "Only open invoices can be voided."
        );
      const clock = fake.clockOf(invoice.customer as string);
      const previous = fake.update(invoice, {
        status: "void",
        next_payment_attempt: null,
        status_transitions: {
          ...(invoice.status_transitions as Json),
          voided_at: fake.now(clock)
        }
      });
      fake.emit("invoice.voided", invoice, previous, clock);
      return invoice;
    }
  },
  {
    method: "get",
    path: "/v1/invoices",
    handler: ({ fake, body }) =>
      list(
        "/v1/invoices",
        fake.all(
          "invoice",
          (i) =>
            (!body.customer || i.customer === body.customer) &&
            (!body.status || i.status === body.status) &&
            (!body.subscription ||
              ((i.parent as Json)?.subscription_details as Json)
                ?.subscription === body.subscription)
        ),
        body
      )
  },
  // ---- test clocks ----
  {
    method: "post",
    path: "/v1/test_helpers/test_clocks",
    handler: ({ fake, body }) => {
      const frozen = int(body.frozen_time);
      if (frozen === undefined) throw missing("frozen_time");
      return fake.create("test_helpers.test_clock", "clock", {
        object: "test_helpers.test_clock",
        frozen_time: frozen,
        name: body.name ?? null,
        status: "ready",
        status_details: {},
        deletes_after: frozen + 30 * DAY
      });
    }
  },
  {
    method: "get",
    path: "/v1/test_helpers/test_clocks/{test_clock}",
    handler: ({ fake, params }) =>
      fake.get(params.test_clock, "test clock", "test_clock")
  },
  {
    method: "delete",
    path: "/v1/test_helpers/test_clocks/{test_clock}",
    handler: ({ fake, params }) => {
      const clock = fake.get(params.test_clock, "test clock", "test_clock");
      clock.deleted = true;
      return { id: clock.id, object: "test_helpers.test_clock", deleted: true };
    }
  },
  {
    method: "get",
    path: "/v1/test_helpers/test_clocks",
    handler: ({ fake, body }) =>
      list(
        "/v1/test_helpers/test_clocks",
        fake.all("test_helpers.test_clock"),
        body
      )
  },
  {
    method: "post",
    path: "/v1/test_helpers/test_clocks/{test_clock}/advance",
    handler: ({ fake, params, body }) => {
      const clock = fake.get(params.test_clock, "test clock", "test_clock");
      const target = int(body.frozen_time);
      if (target === undefined) throw missing("frozen_time");
      if (target < (clock.frozen_time as number))
        throw new StripeError(
          400,
          "invalid_request_error",
          "The test clock cannot go back in time.",
          { param: "frozen_time" }
        );
      fake.update(clock, { status: "advancing" });
      fake.emit(
        "test_helpers.test_clock.advancing",
        clock,
        undefined,
        clock.id as string
      );
      advance(fake, clock.id as string, target);
      const previous = fake.update(clock, { status: "ready" });
      fake.emit(
        "test_helpers.test_clock.ready",
        clock,
        previous,
        clock.id as string
      );
      return clock;
    }
  }
];

/** Resets per-process counters (the fake's reset). */
export function resetBilling() {
  invoiceNumber = 0;
}

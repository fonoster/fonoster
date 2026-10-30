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
import { createServer, Server } from "http";
import { AddressInfo } from "net";
import { expect } from "chai";
import Stripe from "stripe";
import { StripeFakeServer } from "../src";

// The Stripe fake through the official Stripe SDK (add-stripe-fake spec scenarios). Every response is
// validated against Stripe's own schema at the pinned version.

const DAY = 86_400;

describe("@stripe-fake", function () {
  this.timeout(30_000);
  let server: StripeFakeServer;
  let stripe: Stripe;
  let hooks: Server;
  let hooksUrl: string;
  let received: { body: string; signature: string }[] = [];
  let failHooks = 0;

  const fake = (path: string, body: object = {}) =>
    fetch(`${server.url}/_fake/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    }).then((r) => r.json());
  const raw = (method: string, path: string, body?: string) =>
    fetch(`${server.url}${path}`, {
      method,
      headers: {
        authorization: "Bearer sk_test_fake",
        "content-type": "application/x-www-form-urlencoded"
      },
      body
    });

  before(async () => {
    hooks = createServer((req, res) => {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        received.push({
          body,
          signature: String(req.headers["stripe-signature"])
        });
        res.writeHead(failHooks-- > 0 ? 500 : 200);
        res.end();
      });
    });
    await new Promise<void>((r) => hooks.listen(0, "127.0.0.1", r));
    hooksUrl = `http://127.0.0.1:${(hooks.address() as AddressInfo).port}/hooks`;
    server = await new StripeFakeServer({
      port: 0,
      host: "127.0.0.1",
      validateResponses: true
    }).start();
    const port = Number(new URL(server.url).port);
    stripe = new Stripe("sk_test_fake", {
      host: "127.0.0.1",
      port,
      protocol: "http",
      maxNetworkRetries: 0
    });
  });

  after(async () => {
    await server?.stop();
    hooks?.close();
  });

  beforeEach(async () => {
    await fake("reset");
    received = [];
    failHooks = 0;
  });

  it("[BIL-016] is a drop-in Stripe endpoint for the SDK", async () => {
    const created = await stripe.customers.create({ email: "ada@acme.com" });
    expect(created.id).to.match(/^cus_/);
    expect(created.livemode).to.equal(false);
    const again = await stripe.customers.retrieve(created.id);
    expect(again).to.deep.include({ id: created.id, email: "ada@acme.com" });
  });

  it("[BIL-017] refuses an unknown parameter and an unknown path in Stripe's error shape", async () => {
    const res = await raw("POST", "/v1/customers", "colour=red");
    expect(res.status).to.equal(400);
    expect((await res.json()).error).to.include({
      type: "invalid_request_error",
      param: "colour"
    });
    const missing = await raw("GET", "/v1/not_a_resource");
    expect(missing.status).to.equal(404);
    expect((await missing.json()).error.type).to.equal("invalid_request_error");
  });

  it("[BIL-018] replays an idempotent request instead of granting twice", async () => {
    const customer = await stripe.customers.create();
    const params = {
      customer: customer.id,
      amount: {
        type: "monetary" as const,
        monetary: { currency: "usd", value: 1000 }
      },
      applicability_config: { scope: { price_type: "metered" as const } },
      category: "paid" as const
    };
    const a = await stripe.billing.creditGrants.create(params, {
      idempotencyKey: "grant-1"
    });
    const b = await stripe.billing.creditGrants.create(params, {
      idempotencyKey: "grant-1"
    });
    expect(b.id).to.equal(a.id);
    expect(
      (await stripe.billing.creditGrants.list({ customer: customer.id })).data
    ).to.have.length(1);
    let error: Stripe.errors.StripeError | undefined;
    await stripe.billing.creditGrants
      .create(
        { ...params, category: "promotional" },
        { idempotencyKey: "grant-1" }
      )
      .catch((e) => (error = e));
    expect(error?.type).to.equal("StripeIdempotencyError");
  });

  it("[BIL-019] counts a repeated meter event identifier once, in minute-aligned summaries", async () => {
    const customer = await stripe.customers.create();
    const meter = await stripe.billing.meters.create({
      display_name: "Call seconds",
      event_name: "call_seconds",
      default_aggregation: { formula: "sum" }
    });
    const now = Math.floor(Date.now() / 1000);
    for (let i = 0; i < 2; i++)
      await stripe.billing.meterEvents.create({
        event_name: "call_seconds",
        identifier: "usg_abc",
        payload: { stripe_customer_id: customer.id, value: "60" },
        timestamp: now
      });
    await new Promise((r) => setTimeout(r, 50));
    const start = Math.floor(now / 60) * 60;
    const summaries = await stripe.billing.meters.listEventSummaries(meter.id, {
      customer: customer.id,
      start_time: start,
      end_time: start + 60
    });
    expect(summaries.data.map((s) => s.aggregated_value)).to.deep.equal([60]);
  });

  it("[BIL-019] times a test-clock customer's meter events by its clock", async () => {
    const frozen = Math.floor(Date.now() / 1000) + 40 * DAY;
    const clock = await stripe.testHelpers.testClocks.create({
      frozen_time: frozen
    });
    const customer = await stripe.customers.create({ test_clock: clock.id });
    await stripe.billing.meters.create({
      display_name: "Call seconds",
      event_name: "call_seconds",
      default_aggregation: { formula: "sum" }
    });
    await stripe.billing.meterEvents.create({
      event_name: "call_seconds",
      payload: { stripe_customer_id: customer.id, value: "60" },
      timestamp: frozen - 60
    });
    let error: Stripe.errors.StripeError | undefined;
    await stripe.billing.meterEvents
      .create({
        event_name: "call_seconds",
        payload: { stripe_customer_id: customer.id, value: "60" },
        timestamp: frozen + 3600
      })
      .catch((e) => (error = e));
    expect(error?.message).to.match(/5 minutes in the future/);
  });

  it("[BIL-020] accepts an event for an unknown customer, then reports it in a thin event", async () => {
    await stripe.webhookEndpoints.create({
      url: hooksUrl,
      enabled_events: ["*"]
    });
    await stripe.billing.meters.create({
      display_name: "Call seconds",
      event_name: "call_seconds",
      default_aggregation: { formula: "sum" }
    });
    await stripe.billing.meterEvents.create({
      event_name: "call_seconds",
      payload: { stripe_customer_id: "cus_nobody", value: "5" }
    });
    for (
      let i = 0;
      i < 50 &&
      !received.some((r) => r.body.includes("error_report_triggered"));
      i++
    )
      await new Promise((r) => setTimeout(r, 20));
    const thin = JSON.parse(
      received.find((r) => r.body.includes("error_report_triggered"))!.body
    );
    expect(thin).to.include({
      object: "v2.core.event",
      type: "v1.billing.meter.error_report_triggered"
    });
    expect(thin).to.not.have.property("data");
    const full = await (await raw("GET", `/v2/core/events/${thin.id}`)).json();
    expect(full.data.reason.error_types[0].code).to.equal(
      "meter_event_customer_not_found"
    );
  });

  /** A customer on a test clock with a card, a $25 plan and a metered price on a monetary meter. */
  async function cloudCustomer(card = "pm_card_visa") {
    const start = Date.UTC(2026, 9, 1) / 1000;
    const clock = await stripe.testHelpers.testClocks.create({
      frozen_time: start
    });
    const customer = await stripe.customers.create({ test_clock: clock.id });
    const pm = await stripe.paymentMethods.attach(card, {
      customer: customer.id
    });
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: pm.id }
    });
    const product = await stripe.products.create({ name: "Fonoster Cloud" });
    const plan = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: 2500,
      recurring: { interval: "month" }
    });
    const meter = await stripe.billing.meters.create({
      display_name: "AI usage",
      event_name: "ai_cents",
      default_aggregation: { formula: "sum" }
    });
    const usage = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: 1,
      recurring: { interval: "month", usage_type: "metered", meter: meter.id }
    });
    return { clock, customer, plan, usage, start };
  }

  it("[BIL-021] applies credit grants to metered usage only, promotional first, at finalization", async () => {
    const { clock, customer, plan, usage, start } = await cloudCustomer();
    await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.id }, { price: usage.id }]
    });
    const periodEnd = Date.UTC(2026, 10, 1) / 1000;
    const grant = (
      value: number,
      category: "paid" | "promotional",
      expires?: number
    ) =>
      stripe.billing.creditGrants.create({
        customer: customer.id,
        amount: { type: "monetary", monetary: { currency: "usd", value } },
        applicability_config: { scope: { price_type: "metered" } },
        category,
        ...(expires ? { expires_at: expires } : {})
      });
    // The plan's credits outlive the period by the grace period, so its usage invoice can use them.
    const promo = await grant(2500, "promotional", periodEnd + 2 * DAY);
    const paid = await grant(1000, "paid");
    await stripe.billing.meterEvents.create({
      event_name: "ai_cents",
      payload: { stripe_customer_id: customer.id, value: "3000" },
      timestamp: start + 60
    });
    await new Promise((r) => setTimeout(r, 20));
    await stripe.testHelpers.testClocks.advance(clock.id, {
      frozen_time: periodEnd + 2 * 3600
    });
    const [invoice] = (
      await stripe.invoices.list({
        customer: customer.id,
        status: "paid",
        limit: 1
      })
    ).data;
    expect(invoice.billing_reason).to.equal("subscription_cycle");
    expect(invoice.subtotal).to.equal(5500);
    expect(
      invoice.total_pretax_credit_amounts!.map((c) => c.amount)
    ).to.deep.equal([2500, 500]);
    expect(invoice.amount_due).to.equal(2500);
    const balance = await stripe.billing.creditBalanceSummaries.retrieve({
      customer: customer.id,
      filter: { type: "credit_grant", credit_grant: paid.id }
    });
    expect(balance.balances[0].available_balance.monetary!.value).to.equal(500);
    void promo;
  });

  it("[BIL-022] runs a month under a test clock: renew, finalize after grace, charge, paid, in order", async () => {
    await stripe.webhookEndpoints.create({
      url: hooksUrl,
      enabled_events: ["*"]
    });
    const { clock, customer, plan, usage, start } = await cloudCustomer();
    await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.id }, { price: usage.id }]
    });
    await stripe.billing.meterEvents.create({
      event_name: "ai_cents",
      payload: { stripe_customer_id: customer.id, value: "9480" },
      timestamp: start + 60
    });
    await new Promise((r) => setTimeout(r, 20));
    const before = (await stripe.events.list({ limit: 100 })).data.length;
    await stripe.testHelpers.testClocks.advance(clock.id, {
      frozen_time: start + 31 * DAY + 2 * 3600
    });
    const types = (await stripe.events.list({ limit: 100 })).data
      .slice(0, -before || undefined)
      .reverse()
      .map((e) => e.type)
      .filter((t) =>
        [
          "invoice.created",
          "invoice.finalized",
          "payment_intent.succeeded",
          "invoice.paid"
        ].includes(t)
      );
    expect(types).to.deep.equal([
      "invoice.created",
      "invoice.finalized",
      "payment_intent.succeeded",
      "invoice.paid"
    ]);
    const [invoice] = (
      await stripe.invoices.list({ customer: customer.id, limit: 1 })
    ).data;
    expect(
      invoice.lines.data.map((l) => l.amount).sort((a, b) => a - b)
    ).to.deep.equal([2500, 9480]);
  });

  it("[BIL-023] declines insufficient funds with Stripe's decline code and event", async () => {
    const customer = await stripe.customers.create();
    let error: Stripe.errors.StripeCardError | undefined;
    await stripe.paymentIntents
      .create({
        amount: 1000,
        currency: "usd",
        customer: customer.id,
        payment_method: "pm_card_chargeDeclinedInsufficientFunds",
        confirm: true,
        off_session: true
      })
      .catch((e) => (error = e));
    expect(error?.statusCode).to.equal(402);
    expect(error?.decline_code).to.equal("insufficient_funds");
    expect(
      (await stripe.events.list({ type: "payment_intent.payment_failed" })).data
    ).to.have.length(1);
  });

  it("[BIL-024] signs webhooks so Stripe's library verifies them, and retries a failed delivery", async () => {
    const endpoint = await stripe.webhookEndpoints.create({
      url: hooksUrl,
      enabled_events: ["*"]
    });
    failHooks = 1;
    const customer = await stripe.customers.create({ email: "ada@acme.com" });
    for (let i = 0; i < 50 && received.length < 1; i++)
      await new Promise((r) => setTimeout(r, 20));
    const first = received[0];
    const event = stripe.webhooks.constructEvent(
      first.body,
      first.signature,
      endpoint.secret!
    );
    expect(event.type).to.equal("customer.created");
    expect((event.data.object as Stripe.Customer).id).to.equal(customer.id);
    // The first delivery got 500: a retry follows once its delay has passed.
    await fake("clock/advance", { seconds: 120 });
    for (let i = 0; i < 50 && received.length < 2; i++)
      await new Promise((r) => setTimeout(r, 20));
    expect(received.map((r) => JSON.parse(r.body).id)).to.deep.equal([
      event.id,
      event.id
    ]);
  });

  it("[BIL-024] delivers events of a test-clock customer as they happen", async () => {
    await stripe.webhookEndpoints.create({
      url: hooksUrl,
      enabled_events: ["*"]
    });
    // A clock frozen in the future: its events still go out now.
    const clock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(Date.now() / 1000) + 30 * DAY
    });
    await stripe.customers.create({ test_clock: clock.id });
    for (
      let i = 0;
      i < 50 && !received.some((r) => r.body.includes("customer.created"));
      i++
    )
      await new Promise((r) => setTimeout(r, 20));
    expect(received.map((r) => JSON.parse(r.body).type)).to.include(
      "customer.created"
    );
  });

  it("[BIL-025] fails the next payment on request, then follows the card again", async () => {
    const { clock, customer, plan } = await cloudCustomer();
    await fake(`customers/${customer.id}/next_payment`, { outcome: "decline" });
    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.id }]
    });
    expect(sub.status).to.equal("incomplete");
    expect(
      (await stripe.events.list({ type: "invoice.payment_failed" })).data
    ).to.have.length(1);
    await stripe.testHelpers.testClocks.advance(clock.id, {
      frozen_time: clock.frozen_time + 4 * DAY
    });
    const invoice = await stripe.invoices.retrieve(
      sub.latest_invoice as string
    );
    expect(invoice.status).to.equal("paid");
    expect((await stripe.subscriptions.retrieve(sub.id)).status).to.equal(
      "active"
    );
  });

  it("[BIL-016] refuses to change a price's amount, which Stripe keeps immutable", async () => {
    const product = await stripe.products.create({ name: "Plan" });
    const price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: 2500
    });
    const res = await raw("POST", `/v1/prices/${price.id}`, "unit_amount=100");
    expect(res.status).to.equal(400);
    expect((await res.json()).error.type).to.equal("invalid_request_error");
    const ok = await stripe.prices.update(price.id, { nickname: "Cloud" });
    expect(ok.unit_amount).to.equal(2500);
  });

  it("[BIL-016] finds prices by lookup key", async () => {
    const product = await stripe.products.create({ name: "Plan" });
    await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: 2500,
      lookup_key: "plan_payg"
    });
    await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: 100
    });
    const found = await stripe.prices.list({ lookup_keys: ["plan_payg"] });
    expect(found.data.map((p) => p.unit_amount)).to.deep.equal([2500]);
  });

  it("[BIL-016] opens a Customer Portal session for a customer", async () => {
    const customer = await stripe.customers.create();
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: "https://app.fonoster.com/settings/billing"
    });
    expect(session.url).to.match(/^https:\/\//);
    expect(session.customer).to.equal(customer.id);
  });

  it("[BIL-051] serves the Customer Portal at portalUrl: change the card, cancel and renew the plan", async () => {
    // Without portalUrl, links stay on Stripe's host.
    const plain = await stripe.billingPortal.sessions.create({
      customer: (await stripe.customers.create()).id
    });
    expect(plain.url).to.match(
      /^https:\/\/billing\.stripe\.com\/p\/session\/test_/
    );
    const portalServer = await new StripeFakeServer({
      port: 0,
      host: "127.0.0.1",
      portalUrl: "http://localhost:12111"
    }).start();
    try {
      const port = Number(new URL(portalServer.url).port);
      const sdk = new Stripe("sk_test_fake", {
        host: "127.0.0.1",
        port,
        protocol: "http",
        maxNetworkRetries: 0
      });
      const endpoint = await sdk.webhookEndpoints.create({
        url: hooksUrl,
        enabled_events: ["customer.subscription.updated"]
      });
      const customer = await sdk.customers.create({
        payment_method: "pm_card_visa",
        invoice_settings: { default_payment_method: "pm_card_visa" }
      });
      const product = await sdk.products.create({ name: "Pay-as-you-go" });
      const price = await sdk.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: 2500,
        recurring: { interval: "month" }
      });
      const sub = await sdk.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }]
      });
      const session = await sdk.billingPortal.sessions.create({
        customer: customer.id,
        return_url: "https://app.fonoster.ai/billing"
      });
      expect(session.url).to.match(
        /^http:\/\/localhost:12111\/p\/session\/test_bps_/
      );
      // The page is served by the fake, whatever host the link names.
      const path = new URL(session.url).pathname;
      const at = (p: string, init?: RequestInit) =>
        fetch(`${portalServer.url}${p}`, { redirect: "manual", ...init });
      const post = (form: Record<string, string>) =>
        at(path, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(form).toString()
        });
      const shown = await at(path);
      expect(shown.status).to.equal(200);
      expect(shown.headers.get("content-type")).to.match(/text\/html/);
      const html = await shown.text();
      expect(html).to.contain("Cancel plan");
      expect(html).to.contain('href="https://app.fonoster.ai/billing"');

      const cancel = await post({ action: "cancel" });
      expect(cancel.status).to.equal(303);
      expect(cancel.headers.get("location")).to.equal(path);
      expect(
        (await sdk.subscriptions.retrieve(sub.id)).cancel_at_period_end
      ).to.equal(true);
      expect(await (await at(path)).text()).to.contain("Renew plan");
      // The cancel reaches the webhook like Stripe's own: a signed customer.subscription.updated.
      const canceled = async () => {
        for (const r of received) {
          const e = sdk.webhooks.constructEvent(
            r.body,
            r.signature,
            endpoint.secret!
          );
          if ((e.data.object as Stripe.Subscription).cancel_at_period_end)
            return e;
        }
      };
      let event: Stripe.Event | undefined;
      for (let i = 0; i < 50 && !(event = await canceled()); i++)
        await new Promise((r) => setTimeout(r, 20));
      expect(event?.type).to.equal("customer.subscription.updated");

      expect((await post({ action: "renew" })).status).to.equal(303);
      expect(
        (await sdk.subscriptions.retrieve(sub.id)).cancel_at_period_end
      ).to.equal(false);

      expect(
        (await post({ action: "card", card: "pm_card_mastercard" })).status
      ).to.equal(303);
      const updated = (await sdk.customers.retrieve(
        customer.id
      )) as Stripe.Customer;
      const method = await sdk.paymentMethods.retrieve(
        updated.invoice_settings.default_payment_method as string
      );
      expect(method.card?.last4).to.equal("4444");

      expect((await at("/p/session/test_bps_unknown")).status).to.equal(404);
    } finally {
      await portalServer.stop();
    }
  });

  it("[BIL-042] computes tax on a one-off invoice that asks for it, on top of its own items only", async () => {
    await fake("config", { tax_rates: { US: 10 } });
    const customer = await stripe.customers.create({
      address: { country: "US", postal_code: "10001" }
    });
    const pm = await stripe.paymentMethods.attach("pm_card_visa", {
      customer: customer.id
    });
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: pm.id }
    });
    // A pending item the one-off invoice must leave for the next subscription invoice.
    await stripe.invoiceItems.create({ customer: customer.id, amount: 500 });
    const draft = await stripe.invoices.create({
      customer: customer.id,
      automatic_tax: { enabled: true },
      pending_invoice_items_behavior: "exclude",
      auto_advance: false
    });
    const refused = await stripe.invoiceItems
      .create({ customer: customer.id, invoice: draft.id, amount: 1000 })
      .catch((e: Stripe.errors.StripeError) => e);
    expect(refused).to.be.instanceOf(Stripe.errors.StripeInvalidRequestError);
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: draft.id,
      amount: 1000,
      tax_behavior: "exclusive"
    });
    const paid = await stripe.invoices.pay(draft.id!);
    expect(paid).to.include({ status: "paid", subtotal: 1000, total: 1100 });
    expect(paid.automatic_tax).to.include({
      enabled: true,
      status: "complete"
    });
    const untaxed = await stripe.invoices.create({ customer: customer.id });
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: untaxed.id,
      amount: 1000
    });
    expect(await stripe.invoices.pay(untaxed.id!)).to.include({ total: 1000 });
  });

  it("[BIL-042] refuses automatic tax on a subscription whose prices have no tax behavior", async () => {
    const { customer, plan } = await cloudCustomer();
    const refused = await stripe.subscriptions
      .create({
        customer: customer.id,
        items: [{ price: plan.id }],
        automatic_tax: { enabled: true }
      })
      .catch((e: Stripe.errors.StripeError) => e);
    expect(refused).to.be.instanceOf(Stripe.errors.StripeInvalidRequestError);
    await stripe.prices.update(plan.id, { tax_behavior: "exclusive" });
    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.id }],
      automatic_tax: { enabled: true }
    });
    expect(sub.automatic_tax.enabled).to.equal(true);
    const first = await stripe.invoices.retrieve(sub.latest_invoice as string);
    // The customer has no address: Stripe can't place them, so no tax.
    expect(first.automatic_tax).to.include({
      enabled: true,
      status: "requires_location_inputs"
    });
  });

  it("[BIL-016] refunds part of a payment", async () => {
    const customer = await stripe.customers.create();
    const intent = await stripe.paymentIntents.create({
      amount: 1000,
      currency: "usd",
      customer: customer.id,
      payment_method: "pm_card_visa",
      confirm: true,
      off_session: true
    });
    expect(intent.status).to.equal("succeeded");
    const refund = await stripe.refunds.create({
      payment_intent: intent.id,
      amount: 400
    });
    expect(refund).to.include({ amount: 400, status: "succeeded" });
    expect(
      (await stripe.events.list({ type: "charge.refunded" })).data
    ).to.have.length(1);
  });

  it("[BIL-025] keeps the control API out of the Stripe API", async () => {
    const res = await raw("GET", "/v1/_fake/state");
    expect(res.status).to.equal(404);
  });

  it("[BIL-025] resets everything and starts ids over", async () => {
    const a = await stripe.customers.create();
    await fake("reset");
    expect((await stripe.customers.list()).data).to.have.length(0);
    const b = await stripe.customers.create();
    expect(b.id).to.equal(a.id);
  });
});

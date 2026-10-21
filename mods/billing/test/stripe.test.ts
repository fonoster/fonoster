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
import { StripeFakeServer } from "@fonoster/stripe-fake";
import { applyUsage } from "../src/applyUsage";
import { ensureAccount } from "../src/admission";
import { ManualClock } from "../src/clock";
import { DEFAULT_PLANS } from "../src/config";
import { balanceOf, grantsOf } from "../src/ledger";
import { credits } from "../src/money";
import { NoticeKind } from "../src/notices";
import { RateCard } from "../src/rateCards";
import { ensureCustomer, subscribe, topUp } from "../src/stripe/accounts";
import { ensureCatalog, StripeCatalog } from "../src/stripe/catalog";
import { createStripe } from "../src/stripe/client";
import { runOutboxOnce } from "../src/stripe/outbox";
import { reconcile } from "../src/stripe/reconcile";
import { applyEventsOnce, webhookReceiver } from "../src/stripe/webhooks";
import { RecordedUsage } from "../src/usage";
import { BillingTestDb, createBillingTestDb } from "./testDb";

// Billing kept in step with Stripe (add-billing-service group 5) against the Stripe fake, through
// the official SDK, on a real Postgres (PERSISTENCE_TEST_DATABASE_URL); skipped without one.

const DAY = 86_400;
const START = Date.UTC(2026, 10, 1) / 1000;
const card: RateCard = {
  version: 1,
  startsAt: new Date("2026-01-01T00:00:00Z"),
  source: "test",
  prices: { "call.seconds": 0.08, "tts.characters": { "*": 0.018 } }
};

describe("@billing stripe", function () {
  this.timeout(60_000);
  let db: BillingTestDb | undefined;
  let fake: StripeFakeServer;
  let stripe: Stripe;
  let receiver: Server;
  let catalog: StripeCatalog;
  let clockId: string;
  const clock = new ManualClock(new Date(START * 1000));
  const notices: { owner: string; kind: NoticeKind }[] = [];
  let n = 0;

  const control = (path: string, body: object = {}) =>
    fetch(`${fake.url}/_fake/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    }).then((r) => r.json());

  const deps = () => ({
    prisma: db!.prisma,
    stripe,
    catalog,
    clock,
    testClock: clockId,
    plans: DEFAULT_PLANS,
    notifier: {
      notify: (owner: string, kind: NoticeKind) => notices.push({ owner, kind })
    }
  });

  /** Sends what is due and applies what Stripe reported, until both are quiet. */
  async function pump() {
    for (let i = 0; i < 20; i++) {
      const sent = await runOutboxOnce(deps());
      await new Promise((r) => setTimeout(r, 30));
      const applied = await applyEventsOnce(deps());
      if (!sent && !applied) return;
    }
  }

  before(async function () {
    db = await createBillingTestDb();
    if (!db) return this.skip();
    fake = await new StripeFakeServer({ port: 0, host: "127.0.0.1" }).start();
    stripe = createStripe({ secretKey: "sk_test_billing", apiBase: fake.url });
    let handle: ((req: never, res: never) => Promise<void>) | undefined;
    receiver = createServer(
      (req, res) => void handle?.(req as never, res as never)
    );
    await new Promise<void>((r) => receiver.listen(0, "127.0.0.1", r));
    const endpoint = await stripe.webhookEndpoints.create({
      url: `http://127.0.0.1:${(receiver.address() as AddressInfo).port}/stripe`,
      enabled_events: ["*"]
    });
    handle = webhookReceiver({
      prisma: db.prisma,
      stripe,
      secret: endpoint.secret!
    }) as never;
    catalog = await ensureCatalog(stripe, DEFAULT_PLANS);
    clockId = (
      await stripe.testHelpers.testClocks.create({ frozen_time: START })
    ).id;
  });

  after(async () => {
    await fake?.stop();
    receiver?.close();
    await db?.drop();
  });

  /** A trial owner who added a card and an address (as the Customer Portal would) and subscribed. */
  async function subscribed(cardMethod = "pm_card_visa", country = "US") {
    const owner = `owner-${++n}`;
    const account = await ensureAccount(
      db!.prisma,
      owner,
      DEFAULT_PLANS,
      clock.now()
    );
    await db!.prisma.$transaction((tx) => ensureCustomer(tx, account.id));
    await pump();
    const { stripeCustomerId } =
      await db!.prisma.billingAccount.findUniqueOrThrow({
        where: { id: account.id }
      });
    const pm = await stripe.paymentMethods.attach(cardMethod, {
      customer: stripeCustomerId!
    });
    await stripe.customers.update(stripeCustomerId!, {
      invoice_settings: { default_payment_method: pm.id },
      address: { country }
    });
    await db!.prisma.$transaction((tx) => subscribe(tx, account.id));
    await pump();
    return { owner, account, customer: stripeCustomerId! };
  }

  const usage = (
    owner: string,
    o: Partial<RecordedUsage> = {}
  ): RecordedUsage => ({
    id: `usg_stripe${String(++n).padStart(20, "a")}`,
    ownerRef: owner,
    workspaceRef: "WO-A",
    callRef: `call-${n}`,
    region: "default",
    regionKind: "public",
    origin: "call",
    meter: "call.seconds",
    quantity: 160,
    occurredAt: clock.now().toISOString(),
    ...o
  });

  it("[BIL-040] starts Pay-as-you-go on the first paid invoice, with the plan credits here and in Stripe", async () => {
    const { account, customer } = await subscribed();
    const after = await db!.prisma.billingAccount.findUniqueOrThrow({
      where: { id: account.id }
    });
    expect(after.plan).to.equal("payg");
    expect(await balanceOf(db!.prisma, account.id)).to.equal(
      credits(1000 + 2500)
    );
    const grants = (await stripe.billing.creditGrants.list({ customer })).data;
    expect(
      grants.map((g) => [g.category, g.amount.monetary!.value]).sort()
    ).to.deep.equal([
      ["promotional", 1000],
      ["promotional", 2500]
    ]);
  });

  it("[BIL-040] invoices a month of usage less the credits, and renews the plan credits", async () => {
    const { owner, account, customer } = await subscribed();
    await applyUsage(db!.prisma, [card], usage(owner), clock.now());
    await pump();
    await stripe.testHelpers.testClocks.advance(clockId, {
      frozen_time: START + 31 * DAY
    });
    clock.set(new Date((START + 31 * DAY) * 1000));
    await pump();
    const invoices = (await stripe.invoices.list({ customer, limit: 10 })).data;
    const cycle = invoices.find(
      (i) => i.billing_reason === "subscription_cycle"
    )!;
    expect(cycle.status).to.equal("paid");
    // 160 s at 0.08 credits = 12.8 credits = 12.8 cents, paid by credits.
    const metered = cycle.lines.data.find(
      (l) => l.pricing?.price_details?.price === catalog.usagePrice
    )!;
    expect(metered.amount).to.equal(13);
    expect(cycle.amount_due).to.equal(2500);
    const plans = (await grantsOf(db!.prisma, account.id)).filter(
      (g) => g.bucket === "plan"
    );
    expect(plans).to.have.length(2);
  });

  it("[BIL-041] finds where the ledger and Stripe's invoices disagree, and changes nothing", async () => {
    const since = new Date((START - DAY) * 1000);
    expect(await reconcile(deps(), since)).to.deep.equal([]);
    // The ledger rated something Stripe never heard of.
    const { id } = (await db!.prisma.billingAccount.findFirst({
      where: { stripeSubscriptionId: { not: null } },
      orderBy: { createdAt: "asc" },
      skip: 1
    }))!;
    await db!.prisma.ratedLine.create({
      data: {
        usageId: "usg_driftaaaaaaaaaaaaaaaaaaaaaa",
        accountId: id,
        workspaceRef: "WO-A",
        meter: "call.seconds",
        quantity: 600n,
        origin: "call",
        billable: true,
        reason: "platform_minutes",
        amount: credits(48),
        occurredAt: new Date((START + 10 * DAY) * 1000)
      }
    });
    const drifts = await reconcile(deps(), since);
    expect(drifts).to.have.length(1);
    expect(drifts[0]).to.include({
      accountId: id,
      stripeCents: 13,
      ledgerCents: 61
    });
  });

  it("[BIL-042] adds top-up credits once Stripe confirms the payment", async () => {
    const { account, customer } = await subscribed();
    const before = await balanceOf(db!.prisma, account.id);
    await db!.prisma.$transaction((tx) =>
      topUp(tx, account.id, 1000, DEFAULT_PLANS)
    );
    await pump();
    expect(await balanceOf(db!.prisma, account.id)).to.equal(
      before + credits(1000)
    );
    const paid = (
      await stripe.billing.creditGrants.list({ customer })
    ).data.filter((g) => g.category === "paid");
    expect(paid.map((g) => g.amount.monetary!.value)).to.deep.equal([1000]);
  });

  it("[BIL-042] asks Stripe for tax on the subscription and top-ups, and credits only what was bought", async () => {
    await control("config", { tax_rates: { US: 10 } });
    try {
      const { account, customer } = await subscribed();
      const [sub] = (await stripe.subscriptions.list({ customer })).data;
      expect(sub.automatic_tax.enabled).to.equal(true);
      const before = await balanceOf(db!.prisma, account.id);
      await db!.prisma.$transaction((tx) =>
        topUp(tx, account.id, 1000, DEFAULT_PLANS)
      );
      await pump();
      const topup = (await stripe.invoices.list({ customer })).data.find(
        (i) => i.metadata?.purpose === "topup"
      )!;
      expect(topup).to.include({ status: "paid", subtotal: 1000, total: 1100 });
      expect(topup.automatic_tax.enabled).to.equal(true);
      expect(await balanceOf(db!.prisma, account.id)).to.equal(
        before + credits(1000)
      );
    } finally {
      await control("config", { tax_rates: {} });
    }
  });

  it("[BIL-043] turns auto-recharge off after three declined recharges and tells the owner", async () => {
    const { owner, account } = await subscribed();
    await db!.prisma.billingAccount.update({
      where: { id: account.id },
      data: {
        autoRecharge: true,
        rechargeThreshold: credits(4000),
        rechargeAmount: credits(2500)
      }
    });
    for (let i = 0; i < 3; i++) {
      await control(
        `customers/${(await db!.prisma.billingAccount.findUniqueOrThrow({ where: { id: account.id } })).stripeCustomerId}/next_payment`,
        {
          outcome: "decline"
        }
      );
      await applyUsage(db!.prisma, [card], usage(owner), clock.now());
      await pump();
    }
    const after = await db!.prisma.billingAccount.findUniqueOrThrow({
      where: { id: account.id }
    });
    expect(after).to.include({
      autoRecharge: false,
      rechargeFailures: 3,
      rechargePendingAt: null
    });
    expect(notices).to.deep.include({ owner, kind: "auto_recharge_disabled" });
  });

  it("[BIL-043] recharges once per crossing of the threshold, and adds the credits once Stripe is paid", async () => {
    const { owner, account, customer } = await subscribed();
    await db!.prisma.billingAccount.update({
      where: { id: account.id },
      data: {
        autoRecharge: true,
        rechargeThreshold: credits(4000),
        rechargeAmount: credits(2500)
      }
    });
    const before = await balanceOf(db!.prisma, account.id);
    // Two calls below the threshold before Stripe answers: one recharge.
    await applyUsage(db!.prisma, [card], usage(owner), clock.now());
    await applyUsage(db!.prisma, [card], usage(owner), clock.now());
    await pump();
    const paid = (
      await stripe.billing.creditGrants.list({ customer })
    ).data.filter((g) => g.category === "paid");
    expect(paid.map((g) => g.amount.monetary!.value)).to.deep.equal([2500]);
    expect(await balanceOf(db!.prisma, account.id)).to.equal(
      before - credits(25.6) + credits(2500)
    );
  });

  it("[BIL-044] applies a webhook Stripe delivers twice once", async () => {
    const { account } = await subscribed();
    const before = await balanceOf(db!.prisma, account.id);
    await db!.prisma.$transaction((tx) =>
      topUp(tx, account.id, 1000, DEFAULT_PLANS)
    );
    await pump();
    const succeeded = await db!.prisma.stripeEvent.findFirst({
      where: { type: "invoice.paid" },
      orderBy: { receivedAt: "desc" }
    });
    await control(`webhooks/replay/${succeeded!.id}`);
    await pump();
    expect(await balanceOf(db!.prisma, account.id)).to.equal(
      before + credits(1000)
    );
  });

  it("[BIL-045] keeps rating while Stripe is down, then sends everything once", async () => {
    const { owner, customer } = await subscribed();
    await control("rate_limit", { on: true });
    await applyUsage(db!.prisma, [card], usage(owner), clock.now());
    await runOutboxOnce(deps());
    const pending = await db!.prisma.stripeOutbox.count({
      where: { sentAt: null, kind: "meter_event" }
    });
    expect(pending).to.be.at.least(1);
    await control("rate_limit", { on: false });
    clock.set(new Date(clock.now().getTime() + 3600_000));
    await pump();
    expect(
      await db!.prisma.stripeOutbox.count({ where: { sentAt: null } })
    ).to.equal(0);
    const summary = await stripe.billing.meters.listEventSummaries(
      catalog.meter,
      {
        customer,
        start_time: START,
        end_time: START + 60 * DAY
      }
    );
    expect(summary.data.reduce((s, x) => s + x.aggregated_value, 0)).to.equal(
      12_800
    );
  });
});

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
import {
  applyEventsOnce,
  applyUsage,
  balanceOf,
  createStripe,
  DEFAULT_PLANS,
  ensureAccount,
  ensureCatalog,
  ensureCustomer,
  expireDue,
  grantsOf,
  ManualClock,
  NoticeKind,
  RateCard,
  runOutboxOnce,
  StripeCatalog,
  subscribe,
  topUp,
  webhookReceiver
} from "../../billing/src";
import { BillingTestDb, createBillingTestDb } from "../../billing/test/testDb";
import { StripeFakeServer } from "../../stripe-fake/src/server";
import {
  ControlAction,
  DetachedPeer,
  Harness,
  loadScenarios,
  runScenario,
  StripeAction
} from "../src";

// The billing scenarios (add-billing-service 7.2, scenarios/billing): the runner plays the
// platform (it subscribes owners, buys top-ups and reports usage) against the billing service, with
// the Stripe fake as Stripe, on a real Postgres (PERSISTENCE_TEST_DATABASE_URL; skipped without
// one). No network: Stripe is the fake. The same files run nightly against a Stripe sandbox.

const DAY = 86_400;
const START = Date.UTC(2026, 10, 1) / 1000;
const CARD: RateCard = {
  version: 1,
  startsAt: new Date("2026-01-01T00:00:00Z"),
  source: "conformance",
  prices: { "call.seconds": 0.08 }
};

/** What billing and Stripe share for one run: the database, the fake and its webhooks. */
type World = {
  db: BillingTestDb;
  fake: StripeFakeServer;
  stripe: Stripe;
  catalog: StripeCatalog;
  receiver: Server;
};

class BillingHarness implements Harness {
  readonly peer = new DetachedPeer();
  private readonly clock = new ManualClock(new Date(START * 1000));
  private readonly notices: NoticeKind[] = [];
  private clockId?: string;
  private accountId?: string;
  private seq = 0;

  constructor(
    private readonly world: World,
    private readonly owner: string
  ) {}

  private deps() {
    return {
      prisma: this.world.db.prisma,
      stripe: this.world.stripe,
      catalog: this.world.catalog,
      clock: this.clock,
      testClock: this.clockId,
      plans: DEFAULT_PLANS,
      notifier: {
        notify: (_owner: string, kind: NoticeKind) => this.notices.push(kind)
      }
    };
  }

  /** Sends what is due and applies what Stripe reported, until both are quiet. */
  private async pump() {
    for (let i = 0; i < 30; i++) {
      const sent = await runOutboxOnce(this.deps());
      await new Promise((r) => setTimeout(r, 30));
      const applied = await applyEventsOnce(this.deps());
      if (!sent && !applied) return;
    }
  }

  private async customer() {
    const a = await this.world.db.prisma.billingAccount.findUniqueOrThrow({
      where: { id: this.accountId! }
    });
    return a.stripeCustomerId!;
  }

  private control_(path: string, body: object) {
    return fetch(`${this.world.fake.url}/_fake/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
  }

  async control(action: ControlAction) {
    const prisma = this.world.db.prisma;
    switch (action.op) {
      // The owner's Trial, a card and an address in the Customer Portal, then Pay-as-you-go.
      case "subscribe": {
        this.clockId = (
          await this.world.stripe.testHelpers.testClocks.create({
            frozen_time: START
          })
        ).id;
        const account = await ensureAccount(
          prisma,
          this.owner,
          DEFAULT_PLANS,
          this.clock.now()
        );
        this.accountId = account.id;
        await prisma.$transaction((tx) => ensureCustomer(tx, account.id));
        await this.pump();
        const customer = await this.customer();
        const pm = await this.world.stripe.paymentMethods.attach(
          "pm_card_visa",
          { customer }
        );
        await this.world.stripe.customers.update(customer, {
          invoice_settings: { default_payment_method: pm.id },
          address: { country: "US" }
        });
        await prisma.$transaction((tx) => subscribe(tx, account.id));
        return this.pump();
      }
      case "top-up":
        await prisma.$transaction((tx) =>
          topUp(tx, this.accountId!, Number(action.credits), DEFAULT_PLANS)
        );
        return this.pump();
      // Usage the apiserver stored and published: on Fonoster's keys, from a call.
      case "usage":
        await applyUsage(
          prisma,
          [CARD],
          {
            id: `usg_conformance${String(++this.seq).padStart(15, "a")}`,
            ownerRef: this.owner,
            workspaceRef: "WO-conformance",
            callRef: `call-${this.seq}`,
            region: "default",
            regionKind: "public",
            origin: "call",
            meter: String(action.meter),
            quantity: Number(action.quantity),
            occurredAt: this.clock.now().toISOString()
          },
          this.clock.now()
        );
        return this.pump();
      default:
        throw new Error(`unknown billing control op "${action.op}"`);
    }
  }

  async stripe(action: StripeAction) {
    if (action.next_payment)
      await this.control_(`customers/${await this.customer()}/next_payment`, {
        outcome: action.next_payment
      });
    if (action.fail_webhooks)
      await this.control_("webhooks/fail_next", { n: action.fail_webhooks });
    if (action.meter_error_report)
      await this.control_("meters/inject_error_report", {});
    if (action.advance_days) {
      const to = this.clock.now().getTime() / 1000 + action.advance_days * DAY;
      await this.world.stripe.testHelpers.testClocks.advance(this.clockId!, {
        frozen_time: to
      });
      this.clock.set(new Date(to * 1000));
      // As billing's expiry sweep would, once time has passed.
      await expireDue(this.world.db.prisma, this.clock.now());
    }
    await this.pump();
  }

  async measure(name: string) {
    const prisma = this.world.db.prisma;
    const credits = (milli: bigint) => Number(milli) / 1000;
    switch (name) {
      case "balance":
        return credits(await balanceOf(prisma, this.accountId!));
      case "topupCredits":
        return credits(
          (await grantsOf(prisma, this.accountId!))
            .filter((g) => g.bucket === "topup")
            .reduce((n, g) => n + g.remaining, 0n)
        );
      case "notices":
        return this.notices;
      case "stripeEvents": {
        const customer = await this.customer();
        const events = await prisma.stripeEvent.findMany({
          orderBy: { receivedAt: "asc" }
        });
        return events
          .map((e) => e.payload as unknown as Stripe.Event)
          .filter(
            (e) =>
              (e.data.object as { customer?: string }).customer === customer
          )
          .map((e) => e.type);
      }
      // The invoice that closed the first period, in cents.
      case "cycleInvoice": {
        const invoices = (
          await this.world.stripe.invoices.list({
            customer: await this.customer(),
            limit: 20
          })
        ).data;
        const cycle = invoices.find(
          (i) => i.billing_reason === "subscription_cycle"
        );
        if (!cycle) return { status: "none" };
        const line = (price: string) =>
          cycle.lines.data
            .filter((l) => l.pricing?.price_details?.price === price)
            .reduce((n, l) => n + l.amount, 0);
        return {
          status: cycle.status,
          plan: line(this.world.catalog.planPrice),
          usage: line(this.world.catalog.usagePrice),
          credits: (cycle.total_pretax_credit_amounts ?? []).reduce(
            (n, c) => n + c.amount,
            0
          ),
          total: cycle.total
        };
      }
      // The ledger's balance less Stripe's (1 credit = 1 cent), once both have applied the period.
      case "ledgerMinusStripe": {
        const summary =
          await this.world.stripe.billing.creditBalanceSummaries.retrieve({
            customer: await this.customer(),
            filter: {
              type: "applicability_scope",
              applicability_scope: { price_type: "metered" }
            }
          });
        const stripeCents =
          summary.balances[0]?.available_balance.monetary?.value ?? 0;
        return credits(await balanceOf(prisma, this.accountId!)) - stripeCents;
      }
      default:
        return undefined;
    }
  }
}

describe("@conformance billing scenarios (runner plays the platform)", function () {
  this.timeout(60_000);
  let world: World | undefined;

  before(async function () {
    const db = await createBillingTestDb();
    if (!db) return this.skip();
    const fake = await new StripeFakeServer({
      port: 0,
      host: "127.0.0.1"
    }).start();
    const stripe = createStripe({
      secretKey: "sk_test_conformance",
      apiBase: fake.url
    });
    let handle: ((req: never, res: never) => Promise<void>) | undefined;
    const receiver = createServer(
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
    const catalog = await ensureCatalog(stripe, DEFAULT_PLANS);
    world = { db, fake, stripe, catalog, receiver };
  });

  after(async () => {
    await world?.fake.stop();
    world?.receiver.close();
    await world?.db.drop();
  });

  for (const scenario of loadScenarios("billing")) {
    it(scenario.name, async function () {
      if (!world) return this.skip();
      const harness = new BillingHarness(world, `owner-${scenario.name}`);
      const result = await runScenario(scenario, {
        connect: () => harness.peer,
        harness
      });
      // A scenario's `skip` is reported, never dropped: mocha shows it pending with the reason.
      if (result.status === "skipped") {
        this.test!.title += ` (skipped: ${result.reason})`;
        return this.skip();
      }
      expect(result.status, result.reason).to.equal("passed");
    });
  }
});

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
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import Stripe from "stripe";
import { StripeFakeServer } from "@fonoster/stripe-fake";
import { ensureAccount } from "../src/admission";
import {
  billingApi,
  billingServiceDefinition,
  serveBillingApi
} from "../src/api";
import { ManualClock } from "../src/clock";
import { DEFAULT_PLANS } from "../src/config";
import { credits } from "../src/money";
import { ensureCustomer, subscribe } from "../src/stripe/accounts";
import { ensureCatalog, StripeCatalog } from "../src/stripe/catalog";
import { createStripe } from "../src/stripe/client";
import { enqueue, runOutboxOnce } from "../src/stripe/outbox";
import { applyEventsOnce, webhookReceiver } from "../src/stripe/webhooks";
import { createServer, Server } from "http";
import { AddressInfo } from "net";
import { BillingTestDb, createBillingTestDb } from "./testDb";

// Closing an owner's billing account before the owner is deleted (#1376): CloseAccount over gRPC,
// against the Stripe fake through the official SDK, on a real Postgres
// (PERSISTENCE_TEST_DATABASE_URL); skipped without one.

type Client = grpc.Client &
  Record<
    string,
    (r: object, cb: (e: grpc.ServiceError | null, res: object) => void) => void
  >;

const now = new Date();
const START = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) / 1000;

describe("@billing closeAccount", function () {
  this.timeout(60_000);
  let db: BillingTestDb | undefined;
  let fake: StripeFakeServer;
  let stripe: Stripe;
  let catalog: StripeCatalog;
  let receiver: Server;
  let clockId: string;
  const servers: grpc.Server[] = [];
  const clients: Client[] = [];
  const clock = new ManualClock(new Date(START * 1000));
  let n = 0;

  const deps = () => ({
    prisma: db!.prisma,
    stripe,
    catalog,
    clock,
    testClock: clockId,
    plans: DEFAULT_PLANS,
    notifier: { notify: () => undefined }
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

  async function serve(withStripe: Stripe): Promise<Client> {
    const api = billingApi({
      prisma: db!.prisma,
      plans: DEFAULT_PLANS,
      clock,
      stripe: withStripe
    });
    const served = await serveBillingApi(api, "127.0.0.1", 0);
    servers.push(served.server);
    const Ctor = grpc.makeGenericClientConstructor(
      billingServiceDefinition(),
      "Billing",
      {}
    );
    const client = new Ctor(
      `127.0.0.1:${served.port}`,
      grpc.credentials.createInsecure()
    ) as unknown as Client;
    clients.push(client);
    return client;
  }

  let client: Client;
  const closeAccount = (ownerRef: string, c = client) =>
    new Promise<object>((resolve, reject) =>
      c.closeAccount({ ownerRef }, (e, res) => (e ? reject(e) : resolve(res)))
    );
  const refusal = (ownerRef: string, c = client) =>
    closeAccount(ownerRef, c).then(
      () => expect.fail("CloseAccount succeeded"),
      (e: grpc.ServiceError) => e
    );

  before(async function () {
    db = await createBillingTestDb();
    if (!db) return this.skip();
    fake = await new StripeFakeServer({ port: 0, host: "127.0.0.1" }).start();
    stripe = createStripe({ secretKey: "sk_test_close", apiBase: fake.url });
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
    client = await serve(stripe);
  });

  after(async () => {
    clients.forEach((c) => c.close());
    servers.forEach((s) => s.forceShutdown());
    receiver?.close();
    await fake?.stop();
    await db?.drop();
  });

  /** A Pay-as-you-go owner with a card, auto-recharge on, nothing owed. */
  async function subscribed() {
    const owner = `owner-close-${++n}`;
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
    const pm = await stripe.paymentMethods.attach("pm_card_visa", {
      customer: stripeCustomerId!
    });
    await stripe.customers.update(stripeCustomerId!, {
      invoice_settings: { default_payment_method: pm.id },
      address: { country: "US" }
    });
    await db!.prisma.$transaction((tx) => subscribe(tx, account.id));
    await pump();
    const subscribedAccount = await db!.prisma.billingAccount.update({
      where: { id: account.id },
      data: {
        autoRecharge: true,
        rechargeThreshold: credits(500),
        rechargeAmount: credits(2500)
      }
    });
    expect(subscribedAccount.plan).to.equal("payg");
    expect(subscribedAccount.stripeSubscriptionId).to.match(/^sub_/);
    return {
      owner,
      account: subscribedAccount,
      customer: stripeCustomerId!,
      subscription: subscribedAccount.stripeSubscriptionId!
    };
  }

  /** The account, its ledger, its outbox and its Stripe subscription, to compare before and after. */
  async function state(accountId: string, subscription?: string) {
    const prisma = db!.prisma;
    return {
      account: await prisma.billingAccount.findUnique({
        where: { id: accountId }
      }),
      ledger: await prisma.ledgerEntry.findMany({
        where: { accountId },
        orderBy: { id: "asc" }
      }),
      outbox: await prisma.stripeOutbox.findMany({
        where: { accountId },
        orderBy: { id: "asc" }
      }),
      subscription: subscription
        ? (await stripe.subscriptions.retrieve(subscription)).status
        : undefined
    };
  }

  it("[BIL-057] cancels a settled owner's plan and turns auto-recharge off, keeping the ledger", async () => {
    const { owner, account, subscription } = await subscribed();
    const ledger = (await state(account.id)).ledger;

    await closeAccount(owner);
    await pump();

    expect((await stripe.subscriptions.retrieve(subscription)).status).to.equal(
      "canceled"
    );
    const after = await state(account.id);
    expect(after.account).to.include({
      plan: "none",
      status: "canceled",
      stripeSubscriptionId: null,
      autoRecharge: false,
      rechargeThreshold: null,
      rechargeAmount: null
    });
    expect(after.ledger).to.deep.equal(ledger);
  });

  it("[BIL-057] refuses an owner whose balance is below zero, and changes nothing", async () => {
    const { owner, account, subscription } = await subscribed();
    await db!.prisma.ledgerEntry.create({
      data: {
        accountId: account.id,
        kind: "debit",
        bucket: "overdraft",
        amount: -credits(100_000),
        source: "test:overdraft"
      }
    });
    const before = await state(account.id, subscription);

    const e = await refusal(owner);

    expect(e.code).to.equal(grpc.status.FAILED_PRECONDITION);
    expect(e.details).to.equal(
      "the user has a balance due: pay it under Billing, then delete the user"
    );
    expect(await state(account.id, subscription)).to.deep.equal(before);
  });

  it("[BIL-057] refuses an owner whose plan is past due, and changes nothing", async () => {
    const { owner, account, subscription } = await subscribed();
    await db!.prisma.billingAccount.update({
      where: { id: account.id },
      data: { status: "past_due" }
    });
    const before = await state(account.id, subscription);

    const e = await refusal(owner);

    expect(e.code).to.equal(grpc.status.FAILED_PRECONDITION);
    expect(await state(account.id, subscription)).to.deep.equal(before);
  });

  it("[BIL-057] refuses an owner with an open invoice at Stripe, and changes nothing", async () => {
    const { owner, account, customer, subscription } = await subscribed();
    const invoice = await stripe.invoices.create({
      customer,
      auto_advance: false
    });
    await stripe.invoiceItems.create({
      customer,
      invoice: invoice.id,
      amount: 1000,
      currency: "usd"
    });
    await stripe.invoices.finalizeInvoice(invoice.id!);
    const before = await state(account.id, subscription);

    const e = await refusal(owner);

    expect(e.code).to.equal(grpc.status.FAILED_PRECONDITION);
    expect(await state(account.id, subscription)).to.deep.equal(before);
  });

  it("[BIL-057] refuses an owner with usage Stripe hasn't been told of, and changes nothing", async () => {
    const { owner, account, subscription } = await subscribed();
    await enqueue(db!.prisma, account.id, {
      kind: "meter_event",
      payload: {
        usageId: `usg_close${String(++n).padStart(23, "a")}`,
        value: "1000",
        timestamp: START
      }
    });
    const before = await state(account.id, subscription);

    const e = await refusal(owner);

    expect(e.code).to.equal(grpc.status.FAILED_PRECONDITION);
    expect(await state(account.id, subscription)).to.deep.equal(before);
  });

  it("[BIL-057] succeeds for an owner with no billing account, and creates none", async () => {
    await closeAccount("owner-close-none");

    expect(
      await db!.prisma.billingAccount.count({
        where: { ownerRef: "owner-close-none" }
      })
    ).to.equal(0);
  });

  it("[BIL-057] turns a settled Trial's auto-recharge off and tells Stripe nothing", async () => {
    const owner = `owner-close-${++n}`;
    const account = await ensureAccount(
      db!.prisma,
      owner,
      DEFAULT_PLANS,
      clock.now()
    );
    await db!.prisma.billingAccount.update({
      where: { id: account.id },
      data: {
        autoRecharge: true,
        rechargeThreshold: credits(500),
        rechargeAmount: credits(2500)
      }
    });

    await closeAccount(owner);

    const after = await state(account.id);
    expect(after.account).to.include({
      plan: "trial",
      autoRecharge: false,
      rechargeThreshold: null,
      rechargeAmount: null
    });
    expect(after.outbox).to.deep.equal([]);
  });

  it("[BIL-057] enqueues one cancel when called twice", async () => {
    const { owner, account } = await subscribed();

    await closeAccount(owner);
    await closeAccount(owner);

    expect(
      await db!.prisma.stripeOutbox.count({
        where: { accountId: account.id, kind: "cancel_subscription" }
      })
    ).to.equal(1);
    await pump();
  });

  it("[BIL-057] fails with UNAVAILABLE when Stripe can't be asked, and changes nothing", async () => {
    const { owner, account, subscription } = await subscribed();
    const before = await state(account.id, subscription);
    const down = await serve(
      createStripe({
        secretKey: "sk_test_close",
        apiBase: "http://127.0.0.1:1"
      })
    );

    const e = await refusal(owner, down);

    expect(e.code).to.equal(grpc.status.UNAVAILABLE);
    expect(await state(account.id, subscription)).to.deep.equal(before);
  });

  it("[BIL-057] refuses an empty owner_ref", async () => {
    const e = await refusal("");

    expect(e.code).to.equal(grpc.status.INVALID_ARGUMENT);
  });
});

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
import { StripeFakeServer } from "@fonoster/stripe-fake";
import {
  billingApi,
  billingServiceDefinition,
  serveBillingApi
} from "../src/api";
import { ManualClock } from "../src/clock";
import { DEFAULT_PLANS } from "../src/config";
import { createStripe } from "../src/stripe/client";
import { BillingTestDb, createBillingTestDb } from "./testDb";

// The Billing API (billing.proto, add-billing-service 6.1) over gRPC, with the Stripe fake, on a
// real Postgres (PERSISTENCE_TEST_DATABASE_URL); skipped without one.

type Client = grpc.Client &
  Record<
    string,
    (
      r: object,
      cb: (e: grpc.ServiceError | null, res: Record<string, unknown>) => void
    ) => void
  >;

describe("@billing API", function () {
  this.timeout(60_000);
  let db: BillingTestDb | undefined;
  let fake: StripeFakeServer;
  let server: grpc.Server;
  let client: Client;

  const call = (method: string, request: object) =>
    new Promise<Record<string, unknown>>((resolve, reject) =>
      client[method](request, (e, res) => (e ? reject(e) : resolve(res)))
    );

  before(async function () {
    db = await createBillingTestDb();
    if (!db) return this.skip();
    fake = await new StripeFakeServer({ port: 0, host: "127.0.0.1" }).start();
    const api = billingApi({
      prisma: db.prisma,
      plans: DEFAULT_PLANS,
      clock: new ManualClock(new Date("2026-11-01T00:00:00Z")),
      stripe: createStripe({ secretKey: "sk_test_api", apiBase: fake.url })
    });
    const served = await serveBillingApi(api, "127.0.0.1", 0);
    server = served.server;
    const Ctor = grpc.makeGenericClientConstructor(
      billingServiceDefinition(),
      "Billing",
      {}
    );
    client = new Ctor(
      `127.0.0.1:${served.port}`,
      grpc.credentials.createInsecure()
    ) as unknown as Client;
  });

  after(async () => {
    client?.close();
    server?.forceShutdown();
    await fake?.stop();
    await db?.drop();
  });

  it("[BIL-046] shows a new owner's trial credits", async () => {
    const summary = await call("getBilling", { ownerRef: "owner-api" });
    expect(summary).to.include({
      plan: "trial",
      status: "active",
      balance: 1000,
      overdraft: 0
    });
    expect(summary.sources).to.deep.equal([
      { kind: "trial", credits: 1000, expiresAt: "2026-12-01T00:00:00.000Z" }
    ]);
  });

  it("[BIL-046] sets auto-recharge, and refuses an amount below the smallest top-up", async () => {
    const summary = await call("updateAutoRecharge", {
      ownerRef: "owner-api",
      enabled: true,
      threshold: 500,
      amount: 2500
    });
    expect(summary).to.include({
      autoRecharge: true,
      rechargeThreshold: 500,
      rechargeAmount: 2500
    });
    const refused = await call("updateAutoRecharge", {
      ownerRef: "owner-api",
      enabled: true,
      threshold: 500,
      amount: 10
    }).catch((e: grpc.ServiceError) => e);
    expect((refused as grpc.ServiceError).code).to.equal(
      grpc.status.FAILED_PRECONDITION
    );
  });

  it("[BIL-046] refuses a top-up before a payment method, and opens the portal to add one", async () => {
    const refused = (await call("createTopUp", {
      ownerRef: "owner-api",
      credits: 1000
    }).catch((e) => e)) as grpc.ServiceError;
    expect(refused.details).to.match(/payment method/);
    const { url } = await call("createPortalSession", {
      ownerRef: "owner-api",
      returnUrl: "https://app.fonoster.com/settings/billing"
    });
    expect(url).to.match(/^https:\/\//);
    const account = await db!.prisma.billingAccount.findUnique({
      where: { ownerRef: "owner-api" }
    });
    expect(account?.stripeCustomerId).to.match(/^cus_/);
    // A customer is not enough: upgrading and buying need a card.
    const noCard = (await call("subscribe", { ownerRef: "owner-api" }).catch(
      (e) => e
    )) as grpc.ServiceError;
    expect(noCard.details).to.match(/payment method/);
    // The owner adds one in the portal.
    const stripe = createStripe({
      secretKey: "sk_test_api",
      apiBase: fake.url
    });
    const pm = await stripe.paymentMethods.attach("pm_card_visa", {
      customer: account!.stripeCustomerId!
    });
    await stripe.customers.update(account!.stripeCustomerId!, {
      invoice_settings: { default_payment_method: pm.id }
    });
    // Now a top-up is accepted (it is added once the payment succeeds).
    await call("createTopUp", { ownerRef: "owner-api", credits: 1000 });
    expect(
      await db!.prisma.stripeOutbox.count({ where: { kind: "topup_invoice" } })
    ).to.equal(1);
  });
});

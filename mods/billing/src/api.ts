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
import { createServiceDefinition } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import Stripe from "stripe";
import { ensureAccount } from "./admission";
import { Clock } from "./clock";
import { PlanSettings } from "./config";
import { PrismaClient } from "./db";
import { balanceOf, canPay, grantsOf, overdraftLimit } from "./ledger";
import { credits, toCredits } from "./money";
import { BillingError, subscribe, topUp } from "./stripe/accounts";

const logger = getLogger({ service: "billing", filePath: __filename });

export type BillingSummary = {
  plan: string;
  status: string;
  balance: number;
  overdraft: number;
  sources: { kind: string; credits: number; expiresAt: string }[];
  periodEnd: string;
  autoRecharge: boolean;
  rechargeThreshold: number;
  rechargeAmount: number;
};

type ApiDeps = {
  prisma: PrismaClient;
  plans: PlanSettings;
  clock: Clock;
  /** Without Stripe, top-ups, subscribing and the portal are refused. */
  stripe?: Stripe;
};

/** The Billing API (billing.proto) over the ledger; every call names its owner. */
export function billingApi(deps: ApiDeps) {
  const { prisma, plans, clock } = deps;
  const account = (ownerRef: string) => {
    if (!ownerRef) throw new BillingError("owner_ref is required");
    return ensureAccount(prisma, ownerRef, plans, clock.now());
  };

  async function summary(ownerRef: string): Promise<BillingSummary> {
    const a = await account(ownerRef);
    const now = clock.now();
    const sources = (await grantsOf(prisma, a.id))
      .filter((g) => canPay(g, g.effectiveAt ?? now, now))
      .map((g) => ({
        kind: g.bucket,
        credits: toCredits(g.remaining),
        expiresAt: g.expiresAt?.toISOString() ?? ""
      }));
    return {
      plan: a.plan,
      status: a.status,
      balance: toCredits(await balanceOf(prisma, a.id)),
      overdraft: toCredits(await overdraftLimit(prisma, a, plans)),
      sources,
      periodEnd: a.periodEnd?.toISOString() ?? "",
      autoRecharge: a.autoRecharge,
      rechargeThreshold: a.rechargeThreshold
        ? toCredits(a.rechargeThreshold)
        : 0,
      rechargeAmount: a.rechargeAmount ? toCredits(a.rechargeAmount) : 0
    };
  }

  const needsStripe = () => {
    if (!deps.stripe)
      throw new BillingError("billing has no Stripe connection");
    return deps.stripe;
  };

  /** Paying needs a card in the Customer Portal; without one the owner is sent there first. */
  const NO_PAYMENT_METHOD = "add a payment method in the Customer Portal first";
  async function needsPaymentMethod(customerId: string | null) {
    if (!customerId) throw new BillingError(NO_PAYMENT_METHOD);
    const c = await needsStripe().customers.retrieve(customerId);
    const method =
      !c.deleted &&
      (c as Stripe.Customer).invoice_settings?.default_payment_method;
    if (!method) throw new BillingError(NO_PAYMENT_METHOD);
  }

  return {
    getBilling: (r: { ownerRef: string }) => summary(r.ownerRef),

    async updateAutoRecharge(r: {
      ownerRef: string;
      enabled: boolean;
      threshold: number;
      amount: number;
    }) {
      const a = await account(r.ownerRef);
      if (r.enabled && (r.threshold <= 0 || r.amount < plans.topupMinCredits))
        throw new BillingError(
          `auto-recharge needs a threshold above 0 and an amount of at least ${plans.topupMinCredits} credits`
        );
      await prisma.billingAccount.update({
        where: { id: a.id },
        data: {
          autoRecharge: r.enabled,
          rechargeThreshold: r.enabled ? credits(r.threshold) : null,
          rechargeAmount: r.enabled ? credits(r.amount) : null,
          rechargeFailures: 0
        }
      });
      return summary(r.ownerRef);
    },

    async createTopUp(r: { ownerRef: string; credits: number }) {
      needsStripe();
      const a = await account(r.ownerRef);
      await needsPaymentMethod(a.stripeCustomerId);
      await prisma.$transaction((tx) => topUp(tx, a.id, r.credits, plans));
      return summary(r.ownerRef);
    },

    async subscribe(r: { ownerRef: string }) {
      needsStripe();
      const a = await account(r.ownerRef);
      await needsPaymentMethod(a.stripeCustomerId);
      await prisma.$transaction((tx) => subscribe(tx, a.id));
      return summary(r.ownerRef);
    },

    async createPortalSession(r: { ownerRef: string; returnUrl: string }) {
      const stripe = needsStripe();
      let a = await account(r.ownerRef);
      // The portal is interactive: the customer is created now, not through the outbox.
      if (!a.stripeCustomerId) {
        const c = await stripe.customers.create(
          { metadata: { owner_ref: a.ownerRef, account_id: a.id } },
          { idempotencyKey: `customer:${a.id}` }
        );
        a = await prisma.billingAccount.update({
          where: { id: a.id },
          data: { stripeCustomerId: c.id }
        });
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: a.stripeCustomerId!,
        ...(r.returnUrl ? { return_url: r.returnUrl } : {})
      });
      return { url: session.url };
    }
  };
}

export type BillingApi = ReturnType<typeof billingApi>;

export const billingServiceDefinition = () =>
  createServiceDefinition({
    serviceName: "Billing",
    pckg: "billing",
    proto: "billing.proto",
    version: "v1beta2"
  });

/** Serves the Billing API on `bind:port`; resolves with the bound port. */
export async function serveBillingApi(
  api: BillingApi,
  bind: string,
  port: number
): Promise<{ port: number; server: grpc.Server }> {
  const server = new grpc.Server();
  const unary =
    <Req, Res>(fn: (r: Req) => Promise<Res>) =>
    async (
      call: grpc.ServerUnaryCall<Req, Res>,
      cb: grpc.sendUnaryData<Res>
    ) => {
      try {
        cb(null, await fn(call.request));
      } catch (e) {
        const invalid = e instanceof BillingError;
        if (!invalid)
          logger.error("billing API call failed", {
            error: (e as Error).message
          });
        cb({
          code: invalid
            ? grpc.status.FAILED_PRECONDITION
            : grpc.status.INTERNAL,
          message: invalid ? (e as Error).message : "Internal server error."
        });
      }
    };
  server.addService(billingServiceDefinition(), {
    getBilling: unary(api.getBilling),
    updateAutoRecharge: unary(api.updateAutoRecharge),
    createTopUp: unary(api.createTopUp),
    subscribe: unary(api.subscribe),
    createPortalSession: unary(api.createPortalSession)
  });
  const bound = await new Promise<number>((resolve, reject) =>
    server.bindAsync(
      `${bind}:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (e, p) => (e ? reject(e) : resolve(p))
    )
  );
  return { port: bound, server };
}

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
import {
  BALANCE_DUE,
  BillingError,
  closeAccount,
  subscribe,
  topUp
} from "./stripe/accounts";

const logger = getLogger({ service: "billing", filePath: __filename });

/** A request the API can't act on (INVALID_ARGUMENT). */
export class InvalidRequest extends Error {}
/** A dependency (Stripe) couldn't be asked (UNAVAILABLE). */
export class Unavailable extends Error {}

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
  /** After a plan ends, top-ups and auto-recharge wait for a new one. */
  function needsPlan(a: { plan: string }) {
    if (a.plan === "none")
      throw new BillingError(
        "top-ups and auto-recharge need a plan: upgrade first"
      );
  }
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
      if (r.enabled) needsPlan(a);
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
      needsPlan(a);
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
    },

    /**
     * Before the owner is deleted (#1376): refuses while anything is owed, else turns auto-recharge
     * off and cancels the plan. An owner with no account has nothing to close.
     */
    async closeAccount(r: { ownerRef: string }) {
      if (!r.ownerRef) throw new InvalidRequest("owner_ref is required");
      const a = await prisma.billingAccount.findUnique({
        where: { ownerRef: r.ownerRef }
      });
      if (!a) return {};
      // The one Stripe read: an open invoice must be current, so it isn't taken from the outbox.
      if (deps.stripe && a.stripeCustomerId) {
        const open = await deps.stripe.invoices
          .list({ customer: a.stripeCustomerId, status: "open", limit: 1 })
          .catch((e: Error) => {
            logger.warn("could not list the owner's open invoices", {
              accountId: a.id,
              error: e.message
            });
            throw new Unavailable("couldn't check the user's billing");
          });
        if (open.data.length) throw new BillingError(BALANCE_DUE);
      }
      await prisma.$transaction((tx) => closeAccount(tx, a.id));
      logger.verbose("billing account closed", { accountId: a.id });
      return {};
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
        const code =
          e instanceof BillingError
            ? grpc.status.FAILED_PRECONDITION
            : e instanceof InvalidRequest
              ? grpc.status.INVALID_ARGUMENT
              : e instanceof Unavailable
                ? grpc.status.UNAVAILABLE
                : grpc.status.INTERNAL;
        if (code === grpc.status.INTERNAL)
          logger.error("billing API call failed", {
            error: (e as Error).message
          });
        cb({
          code,
          message:
            code === grpc.status.INTERNAL
              ? "Internal server error."
              : (e as Error).message
        });
      }
    };
  server.addService(billingServiceDefinition(), {
    getBilling: unary(api.getBilling),
    updateAutoRecharge: unary(api.updateAutoRecharge),
    createTopUp: unary(api.createTopUp),
    subscribe: unary(api.subscribe),
    createPortalSession: unary(api.createPortalSession),
    closeAccount: unary(api.closeAccount)
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

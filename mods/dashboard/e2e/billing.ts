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
/*
 * An owner's billing account behind GrpcWebMock, behaving like the billing service in
 * front of Stripe: an upgrade needs a payment method, and paid credits (the plan's first
 * invoice, a top-up) arrive a moment after the request, when "Stripe confirms" them.
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { GrpcWebMock } from "./grpc-web";

const require = createRequire(import.meta.url);
const sdkDir = dirname(require.resolve("@fonoster/sdk/package.json"));
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const billingPb: any = require(
  join(sdkDir, "src/generated/web", "billing_pb.js")
);

export type Source = {
  kind: "plan" | "topup" | "trial";
  credits: number;
  expiresAt?: string;
};

export class FakeBilling {
  plan: "trial" | "payg" = "trial";
  status: "active" | "past_due" | "ended" = "active";
  sources: Source[] = [
    { kind: "trial", credits: 1000, expiresAt: "2026-11-20T00:00:00.000Z" }
  ];
  overdraft = 0;
  hasPaymentMethod = false;
  autoRecharge = false;
  threshold = 0;
  amount = 0;
  /** Credits paid for and not yet confirmed: Stripe confirms them two reads later. */
  private pending: { source: Source; reads: number }[] = [];

  get balance() {
    return this.sources.reduce((sum, s) => sum + s.credits, 0);
  }

  private summary() {
    // Stripe confirms a payment a couple of reads (seconds, with the page's polling) later.
    for (const p of this.pending) p.reads += 1;
    this.sources.push(
      ...this.pending.filter((p) => p.reads > 2).map((p) => p.source)
    );
    this.pending = this.pending.filter((p) => p.reads <= 2);
    const s = new billingPb.BillingSummary();
    s.setPlan(this.plan);
    s.setStatus(this.status);
    s.setBalance(this.balance);
    s.setOverdraft(this.overdraft);
    s.setSourcesList(
      this.sources.map((x) => {
        const c = new billingPb.CreditSource();
        c.setKind(x.kind);
        c.setCredits(x.credits);
        if (x.expiresAt) c.setExpiresAt(x.expiresAt);
        return c;
      })
    );
    if (this.plan === "payg") s.setPeriodEnd("2026-12-01T00:00:00.000Z");
    s.setAutoRecharge(this.autoRecharge);
    s.setRechargeThreshold(this.threshold);
    s.setRechargeAmount(this.amount);
    return s;
  }

  install(api: GrpcWebMock) {
    api
      .on("Billing/GetBilling", () => this.summary())
      .on("Billing/Subscribe", () => {
        if (!this.hasPaymentMethod)
          return {
            error: {
              code: 9,
              message: "add a payment method in the Customer Portal first"
            }
          };
        this.plan = "payg";
        this.status = "active";
        this.overdraft = 200;
        this.pending.push({
          source: {
            kind: "plan",
            credits: 2500,
            expiresAt: "2026-12-04T00:00:00.000Z"
          },
          reads: 0
        });
        return this.summary();
      })
      .on("Billing/CreateTopUp", (bytes) => {
        const { credits } =
          billingPb.CreateTopUpRequest.deserializeBinary(bytes).toObject();
        this.pending.push({
          source: {
            kind: "topup",
            credits,
            expiresAt: "2027-10-21T00:00:00.000Z"
          },
          reads: 0
        });
        const s = new billingPb.BillingSummary();
        s.setPlan(this.plan);
        s.setStatus(this.status);
        s.setBalance(this.balance);
        return s;
      })
      .on("Billing/UpdateAutoRecharge", (bytes) => {
        const r =
          billingPb.UpdateAutoRechargeRequest.deserializeBinary(
            bytes
          ).toObject();
        this.autoRecharge = r.enabled;
        this.threshold = r.threshold;
        this.amount = r.amount;
        return this.summary();
      })
      .on("Billing/CreatePortalSession", (bytes) => {
        const { returnUrl } =
          billingPb.CreatePortalSessionRequest.deserializeBinary(
            bytes
          ).toObject();
        const response = new billingPb.CreatePortalSessionResponse();
        response.setUrl(
          `https://billing.stripe.com/p/session/e2e?return=${encodeURIComponent(returnUrl ?? "")}`
        );
        return response;
      });
    return this;
  }
}

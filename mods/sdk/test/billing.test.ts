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
import { expect } from "chai";
import { Billing } from "../src/Billing";
import { FonosterClient } from "../src/client/types";
import {
  BillingSummary,
  CreatePortalSessionResponse,
  CreditSource
} from "../src/generated/node/billing_pb";

/** A summary as the server would send it: on the wire and back. */
function summary(): BillingSummary {
  const source = new CreditSource();
  source.setKind("plan");
  source.setCredits(1240);
  source.setExpiresAt("2026-11-04T00:00:00.000Z");
  const s = new BillingSummary();
  s.setPlan("payg");
  s.setStatus("active");
  s.setBalance(1840);
  s.setOverdraft(200);
  s.setSourcesList([source]);
  s.setPeriodEnd("2026-11-01T00:00:00.000Z");
  return BillingSummary.deserializeBinary(s.serializeBinary());
}

/** A client whose Billing methods record the request and answer `answer()`. */
function fakeClient(sent: Record<string, unknown>) {
  const method =
    (name: string, answer: () => unknown) =>
    (
      req: unknown,
      _metadata: unknown,
      callback: (e: Error | null, r: unknown) => void
    ) => {
      sent[name] = req;
      callback(null, answer());
    };
  return {
    getMetadata: () => ({}),
    getBillingClient: () => ({
      getBilling: method("getBilling", summary),
      updateAutoRecharge: method("updateAutoRecharge", summary),
      createTopUp: method("createTopUp", summary),
      subscribe: method("subscribe", summary),
      createPortalSession: method("createPortalSession", () => {
        const r = new CreatePortalSessionResponse();
        r.setUrl("https://billing.stripe.com/p/session/test");
        return r;
      })
    })
  } as unknown as FonosterClient;
}

describe("@sdk[billing]", function () {
  it("returns the balance by source, the plan and the period", async function () {
    const sent: Record<string, unknown> = {};
    const s = await new Billing(fakeClient(sent)).getBilling();
    expect(s).to.deep.include({
      plan: "payg",
      status: "active",
      balance: 1840,
      overdraft: 200,
      periodEnd: "2026-11-01T00:00:00.000Z"
    });
    expect(s.sources).to.deep.equal([
      { kind: "plan", credits: 1240, expiresAt: "2026-11-04T00:00:00.000Z" }
    ]);
  });

  it("sends auto-recharge, top-ups and the portal's return URL", async function () {
    const sent: Record<string, any> = {};
    const billing = new Billing(fakeClient(sent));
    await billing.updateAutoRecharge({
      enabled: true,
      threshold: 500,
      amount: 2500
    });
    expect(sent.updateAutoRecharge.getEnabled()).to.equal(true);
    expect(sent.updateAutoRecharge.getThreshold()).to.equal(500);
    expect(sent.updateAutoRecharge.getAmount()).to.equal(2500);

    await billing.createTopUp({ credits: 1000 });
    expect(sent.createTopUp.getCredits()).to.equal(1000);

    const { url } = await billing.createPortalSession({
      returnUrl: "https://app.fonoster.com/settings/billing"
    });
    expect(sent.createPortalSession.getReturnUrl()).to.equal(
      "https://app.fonoster.com/settings/billing"
    );
    expect(url).to.equal("https://billing.stripe.com/p/session/test");
  });

  it("never names an owner: the server bills the caller", async function () {
    const sent: Record<string, any> = {};
    const billing = new Billing(fakeClient(sent));
    await billing.getBilling();
    await billing.subscribe();
    expect(sent.getBilling.getOwnerRef()).to.equal("");
    expect(sent.subscribe.getOwnerRef()).to.equal("");
  });
});

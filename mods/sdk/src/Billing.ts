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
import {
  BillingSummary,
  CreatePortalSessionRequest,
  CreatePortalSessionResponse,
  CreateTopUpRequest,
  CreditSource,
  UpdateAutoRechargeRequest
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  BillingSummary as BillingSummaryPB,
  CreatePortalSessionRequest as CreatePortalSessionRequestPB,
  CreatePortalSessionResponse as CreatePortalSessionResponsePB,
  CreateTopUpRequest as CreateTopUpRequestPB,
  CreditSource as CreditSourcePB,
  GetBillingRequest as GetBillingRequestPB,
  SubscribeRequest as SubscribeRequestPB,
  UpdateAutoRechargeRequest as UpdateAutoRechargeRequestPB
} from "./generated/node/billing_pb";

/**
 * @classdesc Fonoster Cloud's billing for the owner signed in: the balance in credits
 * (1 credit = $0.01) by source, the plan, top-ups, auto-recharge and the Stripe Customer Portal.
 * Only workspace owners may call it, and only on Fonoster Cloud (the capabilities say
 * `billing.enabled`). The account is always the caller's: it covers every workspace they own.
 *
 * @example
 * const billing = new SDK.Billing(client);
 * const { balance, sources } = await billing.getBilling();
 * await billing.createTopUp({ credits: 1000 });
 */
class Billing {
  private readonly client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  /** The balance by source, the plan and auto-recharge. */
  async getBilling(): Promise<BillingSummary> {
    const client = this.client.getBillingClient();
    return this.summary(
      makeRpcRequest<
        GetBillingRequestPB,
        BillingSummaryPB,
        Record<string, unknown>,
        RawSummary
      >({
        method: client.getBilling.bind(client),
        requestPBObjectConstructor: GetBillingRequestPB,
        metadata: this.client.getMetadata(),
        request: {},
        repeatableObjectMapping: [["sourcesList", CreditSourcePB]]
      })
    );
  }

  /** Turns auto-recharge on or off, with its threshold and amount in credits. */
  async updateAutoRecharge(
    request: UpdateAutoRechargeRequest
  ): Promise<BillingSummary> {
    const client = this.client.getBillingClient();
    return this.summary(
      makeRpcRequest<
        UpdateAutoRechargeRequestPB,
        BillingSummaryPB,
        UpdateAutoRechargeRequest,
        RawSummary
      >({
        method: client.updateAutoRecharge.bind(client),
        requestPBObjectConstructor: UpdateAutoRechargeRequestPB,
        metadata: this.client.getMetadata(),
        request,
        repeatableObjectMapping: [["sourcesList", CreditSourcePB]]
      })
    );
  }

  /**
   * Buys top-up credits, charged to the payment method added in the Customer Portal, with tax on
   * top. The credits appear once the payment succeeds.
   */
  async createTopUp(request: CreateTopUpRequest): Promise<BillingSummary> {
    const client = this.client.getBillingClient();
    return this.summary(
      makeRpcRequest<
        CreateTopUpRequestPB,
        BillingSummaryPB,
        CreateTopUpRequest,
        RawSummary
      >({
        method: client.createTopUp.bind(client),
        requestPBObjectConstructor: CreateTopUpRequestPB,
        metadata: this.client.getMetadata(),
        request,
        repeatableObjectMapping: [["sourcesList", CreditSourcePB]]
      })
    );
  }

  /** Moves the owner from the Trial to Pay-as-you-go. Needs a payment method first. */
  async subscribe(): Promise<BillingSummary> {
    const client = this.client.getBillingClient();
    return this.summary(
      makeRpcRequest<
        SubscribeRequestPB,
        BillingSummaryPB,
        Record<string, unknown>,
        RawSummary
      >({
        method: client.subscribe.bind(client),
        requestPBObjectConstructor: SubscribeRequestPB,
        metadata: this.client.getMetadata(),
        request: {},
        repeatableObjectMapping: [["sourcesList", CreditSourcePB]]
      })
    );
  }

  /** A Stripe Customer Portal link for payment methods and invoices. */
  async createPortalSession(
    request: CreatePortalSessionRequest
  ): Promise<CreatePortalSessionResponse> {
    const client = this.client.getBillingClient();
    return makeRpcRequest<
      CreatePortalSessionRequestPB,
      CreatePortalSessionResponsePB,
      CreatePortalSessionRequest,
      CreatePortalSessionResponse
    >({
      method: client.createPortalSession.bind(client),
      requestPBObjectConstructor: CreatePortalSessionRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  private async summary(raw: Promise<RawSummary>): Promise<BillingSummary> {
    const { sources, ...rest } = await raw;
    return { ...rest, sources: sources ?? [] };
  }
}

type RawSummary = Omit<BillingSummary, "sources"> & {
  sources?: CreditSource[];
};

export { Billing };

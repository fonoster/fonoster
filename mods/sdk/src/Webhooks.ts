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
  BaseApiObject,
  CreateWebhookRequest,
  CreateWebhookResponse,
  ListWebhookDeliveriesRequest,
  ListWebhookDeliveriesResponse,
  ListWebhooksRequest,
  ListWebhooksResponse,
  RotateWebhookSecretResponse,
  UpdateWebhookRequest,
  Webhook,
  WebhookDelivery
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  CreateWebhookRequest as CreateWebhookRequestPB,
  CreateWebhookResponse as CreateWebhookResponsePB,
  DeleteWebhookRequest as DeleteWebhookRequestPB,
  DeleteWebhookResponse as DeleteWebhookResponsePB,
  GetWebhookRequest as GetWebhookRequestPB,
  ListWebhookDeliveriesRequest as ListWebhookDeliveriesRequestPB,
  ListWebhookDeliveriesResponse as ListWebhookDeliveriesResponsePB,
  ListWebhooksRequest as ListWebhooksRequestPB,
  ListWebhooksResponse as ListWebhooksResponsePB,
  ResendWebhookDeliveryRequest as ResendWebhookDeliveryRequestPB,
  RotateWebhookSecretRequest as RotateWebhookSecretRequestPB,
  RotateWebhookSecretResponse as RotateWebhookSecretResponsePB,
  UpdateWebhookRequest as UpdateWebhookRequestPB,
  UpdateWebhookResponse as UpdateWebhookResponsePB,
  WebhookDelivery as WebhookDeliveryPB,
  Webhook as WebhookPB
} from "./generated/node/webhooks_pb";

type Raw = Record<string, unknown>;
const date = (seconds: unknown) =>
  typeof seconds === "number" && seconds > 0
    ? new Date(seconds * 1000)
    : undefined;

function toWebhook(raw: Raw): Webhook {
  const { eventsList, previousSecretUntil, ...rest } = raw;
  return {
    ...(rest as unknown as Webhook),
    events: (raw.events ?? eventsList ?? []) as string[],
    previousSecretUntil: date(previousSecretUntil)
  };
}

function toDelivery(raw: Raw): WebhookDelivery {
  return {
    ...(raw as unknown as WebhookDelivery),
    lastAttemptAt: date(raw.lastAttemptAt),
    nextAttemptAt: date(raw.nextAttemptAt)
  };
}

/**
 * @classdesc Fonoster Webhooks, a capability of Fonoster's Workspaces. Webhooks receive call
 * events (call.started, call.ended, call.failed, call_record.sealed, provider.deprecated),
 * signed with the endpoint's secret.
 *
 * @example
 * const SDK = require("@fonoster/sdk");
 *
 * async function main() {
 *   const client = new SDK.Client({ accessKeyId: "WO00000000000000000000000000000000" });
 *   await client.loginWithApiKey("APXXXXXXXXXXXXXXXX", "YYYYYYYYYYYYYYYYY");
 *   const webhooks = new SDK.Webhooks(client);
 *   const { ref, secret } = await webhooks.createWebhook({
 *     url: "https://example.com/fonoster",
 *     events: ["call.ended"]
 *   });
 * }
 */
class Webhooks {
  private readonly client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  /** Creates an endpoint. The secret is returned only here and on rotation. */
  async createWebhook(
    request: CreateWebhookRequest
  ): Promise<CreateWebhookResponse> {
    const client = this.client.getWebhooksClient();
    return await makeRpcRequest<
      CreateWebhookRequestPB,
      CreateWebhookResponsePB,
      CreateWebhookRequest,
      CreateWebhookResponse
    >({
      method: client.createWebhook.bind(client),
      requestPBObjectConstructor: CreateWebhookRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  async getWebhook(ref: string): Promise<Webhook> {
    const client = this.client.getWebhooksClient();
    const raw = await makeRpcRequest<
      GetWebhookRequestPB,
      WebhookPB,
      BaseApiObject,
      Raw
    >({
      method: client.getWebhook.bind(client),
      requestPBObjectConstructor: GetWebhookRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
    return toWebhook(raw);
  }

  async listWebhooks(
    request: ListWebhooksRequest = {}
  ): Promise<ListWebhooksResponse> {
    const client = this.client.getWebhooksClient();
    const raw = await makeRpcRequest<
      ListWebhooksRequestPB,
      ListWebhooksResponsePB,
      ListWebhooksRequest,
      { items?: Raw[]; nextPageToken?: string }
    >({
      method: client.listWebhooks.bind(client),
      requestPBObjectConstructor: ListWebhooksRequestPB,
      metadata: this.client.getMetadata(),
      request,
      repeatableObjectMapping: [["itemsList", WebhookPB]]
    });
    return {
      items: (raw.items ?? []).map(toWebhook),
      nextPageToken: raw.nextPageToken
    };
  }

  /** Changes the URL and/or events; fields left out are kept. */
  async updateWebhook(request: UpdateWebhookRequest): Promise<BaseApiObject> {
    const client = this.client.getWebhooksClient();
    return await makeRpcRequest<
      UpdateWebhookRequestPB,
      UpdateWebhookResponsePB,
      UpdateWebhookRequest,
      BaseApiObject
    >({
      method: client.updateWebhook.bind(client),
      requestPBObjectConstructor: UpdateWebhookRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  async deleteWebhook(ref: string): Promise<BaseApiObject> {
    const client = this.client.getWebhooksClient();
    return await makeRpcRequest<
      DeleteWebhookRequestPB,
      DeleteWebhookResponsePB,
      BaseApiObject,
      BaseApiObject
    >({
      method: client.deleteWebhook.bind(client),
      requestPBObjectConstructor: DeleteWebhookRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }

  /** A new secret; the previous one keeps verifying for 24 hours. */
  async rotateWebhookSecret(ref: string): Promise<RotateWebhookSecretResponse> {
    const client = this.client.getWebhooksClient();
    const raw = await makeRpcRequest<
      RotateWebhookSecretRequestPB,
      RotateWebhookSecretResponsePB,
      BaseApiObject,
      Raw
    >({
      method: client.rotateWebhookSecret.bind(client),
      requestPBObjectConstructor: RotateWebhookSecretRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
    return {
      ref: raw.ref as string,
      secret: raw.secret as string,
      previousSecretUntil: date(raw.previousSecretUntil)!
    };
  }

  /** The delivery log, newest first (optionally one endpoint's). */
  async listWebhookDeliveries(
    request: ListWebhookDeliveriesRequest = {}
  ): Promise<ListWebhookDeliveriesResponse> {
    const client = this.client.getWebhooksClient();
    const raw = await makeRpcRequest<
      ListWebhookDeliveriesRequestPB,
      ListWebhookDeliveriesResponsePB,
      ListWebhookDeliveriesRequest,
      { items?: Raw[] }
    >({
      method: client.listWebhookDeliveries.bind(client),
      requestPBObjectConstructor: ListWebhookDeliveriesRequestPB,
      metadata: this.client.getMetadata(),
      request,
      repeatableObjectMapping: [["itemsList", WebhookDeliveryPB]]
    });
    return { items: (raw.items ?? []).map(toDelivery) };
  }

  /** Sends a delivery again now, with the same event id and a fresh signature. */
  async resendWebhookDelivery(ref: string): Promise<WebhookDelivery> {
    const client = this.client.getWebhooksClient();
    const raw = await makeRpcRequest<
      ResendWebhookDeliveryRequestPB,
      WebhookDeliveryPB,
      BaseApiObject,
      Raw
    >({
      method: client.resendWebhookDelivery.bind(client),
      requestPBObjectConstructor: ResendWebhookDeliveryRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
    return toDelivery(raw);
  }
}

export { Webhooks };

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
  CreateWebhookRequest,
  CreateWebhookResponse,
  DeleteWebhookRequest,
  DeleteWebhookResponse,
  GetWebhookRequest,
  ListWebhookDeliveriesRequest,
  ListWebhookDeliveriesResponse,
  ListWebhooksRequest,
  ListWebhooksResponse,
  ResendWebhookDeliveryRequest,
  RotateWebhookSecretRequest,
  RotateWebhookSecretResponse,
  UpdateWebhookRequest,
  UpdateWebhookResponse,
  Webhook,
  WebhookDelivery
} from "../../generated/web/webhooks_pb";
import { ClientFunction } from "./common";

type WebhooksClient = {
  createWebhook: ClientFunction<CreateWebhookRequest, CreateWebhookResponse>;
  listWebhooks: ClientFunction<ListWebhooksRequest, ListWebhooksResponse>;
  getWebhook: ClientFunction<GetWebhookRequest, Webhook>;
  updateWebhook: ClientFunction<UpdateWebhookRequest, UpdateWebhookResponse>;
  deleteWebhook: ClientFunction<DeleteWebhookRequest, DeleteWebhookResponse>;
  rotateWebhookSecret: ClientFunction<
    RotateWebhookSecretRequest,
    RotateWebhookSecretResponse
  >;
  listWebhookDeliveries: ClientFunction<
    ListWebhookDeliveriesRequest,
    ListWebhookDeliveriesResponse
  >;
  resendWebhookDelivery: ClientFunction<
    ResendWebhookDeliveryRequest,
    WebhookDelivery
  >;
};

export { WebhooksClient };

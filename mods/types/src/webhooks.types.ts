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
import { ListRequest, ListResponse } from "./common";

/** A workspace webhook endpoint (add-workspace-webhooks). */
type Webhook = {
  ref: string;
  url: string;
  events: string[];
  /** The last characters of the current secret. */
  secretHint: string;
  /** Until when the previous secret still verifies (after a rotation). */
  previousSecretUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type CreateWebhookRequest = { url: string; events: string[] };

type CreateWebhookResponse = {
  ref: string;
  /** Shown only here and on rotation. */
  secret: string;
};

type UpdateWebhookRequest = { ref: string; url?: string; events?: string[] };

type ListWebhooksRequest = ListRequest;

type ListWebhooksResponse = ListResponse<Webhook>;

type RotateWebhookSecretResponse = {
  ref: string;
  secret: string;
  previousSecretUntil: Date;
};

/** The event envelope a webhook delivery sends as its request body. */
type WebhookEvent = {
  id: string;
  /** call.started | call.ended | call.failed | call_record.sealed | provider.deprecated */
  type: string;
  /** ISO 8601 */
  createdAt: string;
  workspaceRef: string;
  data: Record<string, unknown>;
};

type WebhookDelivery = {
  ref: string;
  webhookRef: string;
  eventId: string;
  eventType: string;
  status: "pending" | "succeeded" | "failed";
  attempts: number;
  /** HTTP status of the last attempt (0: no response). */
  lastStatus?: number;
  lastAttemptAt?: Date;
  nextAttemptAt?: Date;
  createdAt: Date;
  /**
   * The event Fonoster sent, as stored. Key order can differ from the bytes the receiver got, so
   * don't use it to check a signature.
   */
  event: WebhookEvent;
};

type ListWebhookDeliveriesRequest = { webhookRef?: string; pageSize?: number };

type ListWebhookDeliveriesResponse = { items: WebhookDelivery[] };

export {
  CreateWebhookRequest,
  CreateWebhookResponse,
  ListWebhookDeliveriesRequest,
  ListWebhookDeliveriesResponse,
  ListWebhooksRequest,
  ListWebhooksResponse,
  RotateWebhookSecretResponse,
  UpdateWebhookRequest,
  Webhook,
  WebhookDelivery,
  WebhookEvent
};

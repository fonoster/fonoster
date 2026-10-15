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
import { randomBytes } from "crypto";
import {
  getAccessKeyIdFromCall,
  GrpcErrorMessage,
  Webhooks,
  withErrorHandling
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";

// Workspace webhook management (add-workspace-webhooks 2.1, 2.5; build log CP-B5). Endpoints and
// the delivery log live in webhook_endpoints / webhook_deliveries; the gateways' dispatchers read
// them (PrismaWebhookStore). Every query is scoped to the caller's workspace (its access key id).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WebhooksDb = any;

export type WebhooksConfig = {
  /** Plain http:// endpoints (local testing only). */
  allowInsecureUrls?: boolean;
  /** How long the previous secret keeps verifying after a rotation (W4: 24 h). */
  rotationWindowMs?: number;
  now?: () => number;
};

const ROTATION_WINDOW_MS = 24 * 3600 * 1000;
const INVALID_ARGUMENT = 3;
const NOT_FOUND = 5;

const invalid = (message: string) => ({ code: INVALID_ARGUMENT, message });
const notFound = (message: string) => ({ code: NOT_FOUND, message });
const seconds = (d?: Date | null) => (d ? Math.floor(d.getTime() / 1000) : 0);
const hint = (secret: string) => `…${secret.slice(-4)}`;

type Row = Record<string, unknown>;
type Callback<T> = (error: GrpcErrorMessage | null, response?: T) => void;
type Call<T> = { request: T };

function toWebhook(row: Row) {
  return {
    ref: row.ref as string,
    url: row.url as string,
    events: row.events as string[],
    secretHint: hint(row.secret as string),
    previousSecretUntil: seconds(row.previousUntil as Date | null),
    createdAt: seconds(row.createdAt as Date),
    updatedAt: seconds(row.updatedAt as Date)
  };
}

function toDelivery(row: Row) {
  return {
    ref: row.ref as string,
    webhookRef: row.endpointRef as string,
    eventId: row.eventId as string,
    eventType: row.eventType as string,
    status: row.status as string,
    attempts: row.attempts as number,
    lastStatus: (row.lastStatus as number | null) ?? 0,
    lastAttemptAt: seconds(row.lastAttemptAt as Date | null),
    nextAttemptAt:
      row.status === "pending" ? seconds(row.nextAttemptAt as Date) : 0,
    createdAt: seconds(row.createdAt as Date)
  };
}

/** Checks the URL (HTTPS) and event types the same way the dispatcher does. */
function validated(
  input: { url: string; events: string[] },
  config: WebhooksConfig
) {
  if (!input.url) throw invalid("url is required");
  if (!input.events?.length) throw invalid("events: choose at least one");
  try {
    const dispatcher = new Webhooks.WebhookDispatcher({
      store: new Webhooks.MemoryWebhookStore(),
      allowInsecureUrls: config.allowInsecureUrls
    });
    return dispatcher.createEndpoint({
      workspaceRef: "check",
      url: input.url,
      events: [...new Set(input.events)] as Webhooks.WebhookEventType[]
    });
  } catch (e) {
    throw invalid((e as Error).message);
  }
}

export function createWebhooksHandlers(
  db: WebhooksDb,
  config: WebhooksConfig = {}
) {
  const logger = getLogger({ service: "apiserver", filePath: __filename });
  const now = () => config.now?.() ?? Date.now();
  const workspace = (call: unknown) =>
    getAccessKeyIdFromCall(call as ServerInterceptingCall);

  const find = async (ref: string, accessKeyId: string) => {
    if (!ref) throw invalid("ref is required");
    const row = await db.webhookEndpoint.findFirst({
      where: { ref, accessKeyId }
    });
    if (!row) throw notFound(`webhook not found: ${ref}`);
    return row as Row;
  };

  const createWebhook = async (
    call: Call<{ url: string; events: string[] }>,
    callback: Callback<{ ref: string; secret: string }>
  ) => {
    const accessKeyId = workspace(call);
    const endpoint = validated(call.request, config);
    await db.webhookEndpoint.create({
      data: {
        ref: endpoint.id,
        accessKeyId,
        url: endpoint.url,
        events: endpoint.events,
        secret: endpoint.secret
      }
    });
    logger.verbose("webhook created", { accessKeyId, ref: endpoint.id });
    callback(null, { ref: endpoint.id, secret: endpoint.secret });
  };

  const listWebhooks = async (
    call: Call<{ pageSize?: number; pageToken?: string }>,
    callback: Callback<{ items: unknown[]; nextPageToken: string }>
  ) => {
    const accessKeyId = workspace(call);
    const pageSize = Math.min(call.request.pageSize || 50, 200);
    const pageToken = call.request.pageToken;
    const rows: Row[] = await db.webhookEndpoint.findMany({
      where: { accessKeyId },
      orderBy: [{ createdAt: "desc" }, { ref: "asc" }],
      take: pageSize,
      skip: pageToken ? 1 : 0,
      cursor: pageToken ? { ref: pageToken } : undefined
    });
    callback(null, {
      items: rows.map(toWebhook),
      nextPageToken:
        rows.length < pageSize ? "" : (rows[rows.length - 1].ref as string)
    });
  };

  const getWebhook = async (
    call: Call<{ ref: string }>,
    callback: Callback<unknown>
  ) => {
    callback(null, toWebhook(await find(call.request.ref, workspace(call))));
  };

  const updateWebhook = async (
    call: Call<{ ref: string; url?: string; events?: string[] }>,
    callback: Callback<{ ref: string }>
  ) => {
    const accessKeyId = workspace(call);
    const row = await find(call.request.ref, accessKeyId);
    const url = call.request.url || (row.url as string);
    const events = call.request.events?.length
      ? call.request.events
      : (row.events as string[]);
    const checked = validated({ url, events }, config);
    await db.webhookEndpoint.update({
      where: { ref: row.ref },
      data: { url: checked.url, events: checked.events }
    });
    callback(null, { ref: row.ref as string });
  };

  const deleteWebhook = async (
    call: Call<{ ref: string }>,
    callback: Callback<{ ref: string }>
  ) => {
    const row = await find(call.request.ref, workspace(call));
    // Deliveries stay in the log; pending ones fail when attempted (no endpoint).
    await db.webhookEndpoint.delete({ where: { ref: row.ref } });
    callback(null, { ref: row.ref as string });
  };

  const rotateWebhookSecret = async (
    call: Call<{ ref: string }>,
    callback: Callback<{
      ref: string;
      secret: string;
      previousSecretUntil: number;
    }>
  ) => {
    const row = await find(call.request.ref, workspace(call));
    const secret = `whsec_${randomBytes(24).toString("base64url")}`;
    const until = new Date(
      now() + (config.rotationWindowMs ?? ROTATION_WINDOW_MS)
    );
    await db.webhookEndpoint.update({
      where: { ref: row.ref },
      data: { secret, previousSecret: row.secret, previousUntil: until }
    });
    callback(null, {
      ref: row.ref as string,
      secret,
      previousSecretUntil: seconds(until)
    });
  };

  const listWebhookDeliveries = async (
    call: Call<{ webhookRef?: string; pageSize?: number }>,
    callback: Callback<{ items: unknown[] }>
  ) => {
    const accessKeyId = workspace(call);
    const rows: Row[] = await db.webhookDelivery.findMany({
      where: {
        accessKeyId,
        ...(call.request.webhookRef
          ? { endpointRef: call.request.webhookRef }
          : {})
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(call.request.pageSize || 50, 200)
    });
    callback(null, { items: rows.map(toDelivery) });
  };

  /** Sends again now with the original event id and a fresh signature (W6). */
  const resendWebhookDelivery = async (
    call: Call<{ ref: string }>,
    callback: Callback<unknown>
  ) => {
    const accessKeyId = workspace(call);
    const { ref } = call.request;
    const row = await db.webhookDelivery.findFirst({
      where: { ref, accessKeyId }
    });
    if (!row) throw notFound(`delivery not found: ${ref}`);
    const store = await Webhooks.PrismaWebhookStore.open(db);
    await store.loadDeliveries({ id: ref, workspaceRef: accessKeyId }, 1);
    const dispatcher = new Webhooks.WebhookDispatcher({
      store,
      allowInsecureUrls: config.allowInsecureUrls,
      now
    });
    await dispatcher.resend(ref);
    await store.flush();
    const updated = await db.webhookDelivery.findUnique({ where: { ref } });
    callback(null, toDelivery(updated));
  };

  return {
    createWebhook: withErrorHandling(createWebhook),
    listWebhooks: withErrorHandling(listWebhooks),
    getWebhook: withErrorHandling(getWebhook),
    updateWebhook: withErrorHandling(updateWebhook),
    deleteWebhook: withErrorHandling(deleteWebhook),
    rotateWebhookSecret: withErrorHandling(rotateWebhookSecret),
    listWebhookDeliveries: withErrorHandling(listWebhookDeliveries),
    resendWebhookDelivery: withErrorHandling(resendWebhookDelivery)
  };
}

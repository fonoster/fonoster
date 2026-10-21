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
import { createHash } from "crypto";
import { TextDecoder, TextEncoder } from "util";
import { Delivery } from "./Dispatcher";
import { callFailed, WEBHOOK_EVENT_TYPES, WebhookEvent } from "./events";

// Event fan-out from the event bus (add-workspace-webhooks task 2.2, build log LO-B1). Producers
// that have no database (Roomr nodes, appbridges in bus mode, other regions) publish events on
// `webhooks.events`; one control-plane replica per event (queue group) fans each event out to the
// workspace's subscribed endpoints. A producer that does not know the workspace leaves
// `workspaceRef` empty and the fan-out resolves it from `data.appRef`.
//
// Roomr nodes may not publish `webhooks.events` (M6: a node could otherwise forge any event for
// any workspace). An outbound call that is never answered reaches no AppBridge; the control plane
// builds its call.failed from the node's own `call.ended` on `roomr.events.<call_ref>`
// (unansweredOutboundCall), with the workspace taken from the app and nothing else trusted.

export const WEBHOOK_EVENTS_SUBJECT = "webhooks.events";

/** The slice of a NATS connection the bus uses (so `@fonoster/common` needs no NATS client). */
export type BusConnection = {
  publish(subject: string, data: Uint8Array): void;
  subscribe(
    subject: string,
    opts: {
      queue?: string;
      callback: (err: Error | null, msg: { data: Uint8Array }) => void;
    }
  ): { unsubscribe(): void };
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** A producer that publishes events on the bus instead of delivering them itself. */
export function busWebhookPublisher(nc: Pick<BusConnection, "publish">) {
  return (event: WebhookEvent) =>
    nc.publish(WEBHOOK_EVENTS_SUBJECT, encoder.encode(JSON.stringify(event)));
}

/** Parses a bus message; undefined for anything that is not a v1 webhook event. */
export function parseBusEvent(data: Uint8Array): WebhookEvent | undefined {
  let e: WebhookEvent;
  try {
    e = JSON.parse(decoder.decode(data));
  } catch {
    return undefined;
  }
  if (
    !e ||
    typeof e.id !== "string" ||
    !/^evt_[\w-]+$/.test(e.id) ||
    !(WEBHOOK_EVENT_TYPES as readonly string[]).includes(e.type) ||
    typeof e.data !== "object" ||
    e.data === null
  )
    return undefined;
  return e;
}

/** Where Roomr nodes publish a call's events (`roomr.events.<call_ref>`; room events have one more token). */
export const ROOMR_CALL_EVENTS_SUBJECT = "roomr.events.*";

/**
 * The `call.failed` reasons an unanswered outbound call can end with (the node's `cause`); any
 * other cause is reported as `node_error`.
 */
export const UNANSWERED_CALL_REASONS = [
  "busy",
  "no_answer",
  "rejected",
  "removed",
  "node_error"
] as const;

const MAX_FIELD = 256;
const field = (v: unknown, required = false) =>
  typeof v === "string" && v.length <= MAX_FIELD && (!required || v.length > 0)
    ? v
    : undefined;

/** An outbound call the callee never answered, as its node's `call.ended` tells it. */
export type UnansweredCall = {
  callRef: string;
  appRef: string;
  from: string;
  to: string;
  reason: (typeof UNANSWERED_CALL_REASONS)[number];
  sipStatus?: number;
  nodeRef: string;
};

/**
 * The unanswered outbound call a Roomr node's event on `subject` (`roomr.events.<call_ref>`)
 * reports, or undefined: only a `call.ended` with `answered: false` of a call the control plane
 * placed (its `metadata.app_ref`, passed through by the node) for the subject's own call. The
 * parties come from the metadata the control plane set; the node never chooses the workspace
 * (left for the fan-out to resolve from the app), the event type or extra data (M6).
 */
export function unansweredOutboundCall(
  subject: string,
  event: Record<string, unknown> | undefined
): UnansweredCall | undefined {
  const tokens = subject.split(".");
  if (tokens.length !== 3 || tokens[0] !== "roomr" || tokens[1] !== "events")
    return undefined;
  if (!event || typeof event !== "object" || event.type !== "call.ended")
    return undefined;
  if (event.answered !== false) return undefined;
  const callRef = field(event.call_ref, true);
  if (!callRef || callRef !== tokens[2]) return undefined;
  const metadata = (
    event.metadata && typeof event.metadata === "object" ? event.metadata : {}
  ) as Record<string, unknown>;
  const appRef = field(metadata.app_ref, true);
  if (!appRef) return undefined;
  const cause = String(event.cause ?? "");
  const reason = (UNANSWERED_CALL_REASONS as readonly string[]).includes(cause)
    ? (cause as UnansweredCall["reason"])
    : "node_error";
  const sipStatus = Number(event.sip_status);
  return {
    callRef,
    appRef,
    from: field(metadata.from) ?? "",
    to: field(metadata.to) ?? "",
    reason,
    ...(Number.isInteger(sipStatus) && sipStatus > 0 ? { sipStatus } : {}),
    nodeRef: field(event.node_ref) ?? ""
  };
}

/**
 * The `call.failed` event for an unanswered outbound call. Its id depends on the call only, so
 * every replica that sees the node's `call.ended` builds the same event and each endpoint gets one
 * delivery.
 */
export function unansweredCallFailed(
  call: UnansweredCall,
  now = new Date()
): WebhookEvent {
  const event = callFailed("", {
    callRef: call.callRef,
    appRef: call.appRef,
    from: call.from,
    to: call.to,
    direction: "outbound",
    reason: call.reason
  });
  const digest = createHash("sha256")
    .update(`call.failed\n${call.callRef}`)
    .digest("hex")
    .slice(0, 32);
  return {
    ...event,
    id: `evt_node_${digest}`,
    createdAt: now.toISOString()
  } as WebhookEvent;
}

export type FanoutOptions = {
  /** Usually `WebhookDispatcher.publish`: stores one pending delivery per subscribed endpoint. */
  publish(event: WebhookEvent): Delivery[];
  /**
   * The workspace of an app, for events whose producer did not know it (empty or `default`
   * workspaceRef with a `data.appRef`).
   */
  workspaceOfApp?(appRef: string): Promise<string | undefined>;
  /** Called after an event was fanned out (e.g. to attempt the new deliveries at once). */
  onPublished?(event: WebhookEvent, deliveries: Delivery[]): void;
  onError?(e: Error): void;
  /** Queue group: one replica handles each event. */
  queue?: string;
};

/** Fills in a missing workspace from the app; undefined when it cannot be known. */
export async function resolveWorkspace(
  event: WebhookEvent,
  workspaceOfApp?: FanoutOptions["workspaceOfApp"]
): Promise<WebhookEvent | undefined> {
  if (event.workspaceRef && event.workspaceRef !== "default") return event;
  const appRef = (event.data as { appRef?: unknown }).appRef;
  if (typeof appRef !== "string" || !appRef || !workspaceOfApp)
    return undefined;
  const workspaceRef = await workspaceOfApp(appRef);
  return workspaceRef ? { ...event, workspaceRef } : undefined;
}

/** Subscribes to the bus and fans every event out; returns the unsubscribe function. */
export function subscribeWebhookFanout(
  nc: Pick<BusConnection, "subscribe">,
  options: FanoutOptions
): () => void {
  const sub = nc.subscribe(WEBHOOK_EVENTS_SUBJECT, {
    queue: options.queue ?? "webhooks-fanout",
    callback: (err, msg) => {
      if (err) return;
      const event = parseBusEvent(msg.data);
      if (!event) return;
      resolveWorkspace(event, options.workspaceOfApp)
        .then((resolved) => {
          if (!resolved) return;
          const deliveries = options.publish(resolved);
          options.onPublished?.(resolved, deliveries);
        })
        .catch((e) => options.onError?.(e as Error));
    }
  });
  return () => sub.unsubscribe();
}

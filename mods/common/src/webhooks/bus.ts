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
// that have no database (Roomr nodes, gateways in bus mode, other regions) publish events on
// `webhooks.events`; one control-plane replica per event (queue group) fans each event out to the
// workspace's subscribed endpoints. A producer that does not know the workspace leaves
// `workspaceRef` empty and the fan-out resolves it from `data.appRef`.
//
// Roomr nodes may not publish `webhooks.events` (M6: a node could otherwise forge any event for
// any workspace). A node reports a call no gateway claimed on its own subject,
// `media.<nodeId>.events.call-failed`; the control plane builds the call.failed event from it
// (nodeCallFailedEvent), with the workspace taken from the app and nothing else trusted.

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

/** Where Roomr nodes report calls no gateway claimed (the last token is never a room ref). */
export const NODE_CALL_FAILED_SUBJECT = "media.*.events.call-failed";

/** The reasons a node may give: it only ever fails a call nobody claimed. */
export const NODE_CALL_FAILED_REASONS = ["node_error"] as const;

const MAX_FIELD = 256;
const field = (v: unknown, required = false) =>
  typeof v === "string" && v.length <= MAX_FIELD && (!required || v.length > 0)
    ? v
    : undefined;

/**
 * The call.failed event for a Roomr node's report on `subject`
 * (`media.<nodeId>.events.call-failed`); undefined for anything else. Only `call.failed` with a
 * node reason is accepted, the report must name the node of its subject, and the workspace is left
 * empty for the fan-out to resolve from the app: a node never chooses the workspace, the event type
 * or extra data. The id depends on the node and the call, so a repeated report is delivered once.
 */
export function nodeCallFailedEvent(
  subject: string,
  data: Uint8Array,
  now = new Date()
): WebhookEvent | undefined {
  const tokens = subject.split(".");
  if (
    tokens.length !== 4 ||
    tokens[0] !== "media" ||
    tokens[2] !== "events" ||
    tokens[3] !== "call-failed"
  )
    return undefined;
  let r: Record<string, unknown>;
  try {
    r = JSON.parse(decoder.decode(data));
  } catch {
    return undefined;
  }
  if (!r || typeof r !== "object" || r.type !== "call.failed") return undefined;
  const nodeId = tokens[1];
  const callRef = field(r.callRef, true);
  const appRef = field(r.appRef, true);
  const from = field(r.from);
  const to = field(r.to);
  const reason = field(r.reason);
  const direction = r.direction ?? "inbound";
  if (
    r.nodeId !== nodeId ||
    !callRef ||
    !appRef ||
    from === undefined ||
    to === undefined ||
    !(NODE_CALL_FAILED_REASONS as readonly string[]).includes(reason ?? "") ||
    (direction !== "inbound" && direction !== "outbound")
  )
    return undefined;
  const event = callFailed("", {
    callRef,
    appRef,
    from,
    to,
    direction,
    reason: reason!
  });
  const digest = createHash("sha256")
    .update(`${nodeId}\n${callRef}`)
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

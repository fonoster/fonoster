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
import { TextDecoder, TextEncoder } from "util";
import { Delivery } from "./Dispatcher";
import { WEBHOOK_EVENT_TYPES, WebhookEvent } from "./events";

// Event fan-out from the event bus (add-workspace-webhooks task 2.2, build log LO-B1). Producers
// that have no database (media nodes, gateways in bus mode, other regions) publish events on
// `webhooks.events`; one control-plane replica per event (queue group) fans each event out to the
// workspace's subscribed endpoints. A producer that does not know the workspace (a media node only
// knows the app) leaves `workspaceRef` empty and the fan-out resolves it from `data.appRef`.

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

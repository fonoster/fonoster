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
import { randomBytes, randomUUID } from "crypto";
import { URL } from "url";
import { assertPublicUrlShape, safeFetch } from "../net";
import {
  RETIRED_EVENT_TYPES,
  WEBHOOK_EVENT_TYPES,
  WebhookEvent,
  WebhookEventType
} from "./events";
import { webhookHeaders } from "./signing";

// add-workspace-webhooks: subscriptions (W1), at-least-once delivery with retries (W5) and the
// delivery log with resend (W6). Storage sits behind WebhookStore; the apiserver will provide a
// database-backed one.

export type WebhookEndpoint = {
  id: string;
  workspaceRef: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  /** The previous secret stays valid until `previousUntil` (rotation window). */
  previousSecret?: string;
  previousUntil?: number;
};

export type Delivery = {
  id: string;
  endpointId: string;
  event: WebhookEvent;
  status: "pending" | "succeeded" | "failed";
  attempts: number;
  firstAttemptAt?: number;
  lastAttemptAt?: number;
  lastStatus?: number;
  nextAttemptAt: number;
};

export interface WebhookStore {
  endpoints(workspaceRef?: string): WebhookEndpoint[];
  putEndpoint(e: WebhookEndpoint): void;
  deleteEndpoint(id: string): void;
  deliveries(endpointId?: string): Delivery[];
  putDelivery(d: Delivery): void;
}

export class MemoryWebhookStore implements WebhookStore {
  private e = new Map<string, WebhookEndpoint>();
  private d = new Map<string, Delivery>();
  endpoints(workspaceRef?: string) {
    return [...this.e.values()].filter(
      (x) => !workspaceRef || x.workspaceRef === workspaceRef
    );
  }
  putEndpoint(x: WebhookEndpoint) {
    this.e.set(x.id, x);
  }
  deleteEndpoint(id: string) {
    this.e.delete(id);
  }
  deliveries(endpointId?: string) {
    return [...this.d.values()].filter(
      (x) => !endpointId || x.endpointId === endpointId
    );
  }
  putDelivery(x: Delivery) {
    this.d.set(x.id, x);
  }
}

export class WebhookError extends Error {}

export type DispatcherOptions = {
  store: WebhookStore;
  /** Per-attempt timeout (design OQ3 proposal: 10 s). */
  attemptTimeoutMs?: number;
  /** First retry delay; each next one doubles, capped at maxDelayMs (OQ2: from 10 s). */
  firstDelayMs?: number;
  maxDelayMs?: number;
  /** Retries stop this long after the first attempt (OQ2: 24 h). */
  retryPeriodMs?: number;
  /** Lets tests use plain http:// receivers. Never in production. */
  allowInsecureUrls?: boolean;
  /**
   * Private destinations (host names, IPs, CIDRs) endpoints may use; defaults to
   * FONOSTER_ALLOWED_DESTINATIONS. Everything else must be public (RV-B2).
   */
  allowedDestinations?: string[];
  now?: () => number;
};

export class WebhookDispatcher {
  constructor(private readonly options: DispatcherOptions) {}

  private policy() {
    return this.options.allowedDestinations
      ? { allow: this.options.allowedDestinations }
      : undefined;
  }

  private now() {
    return this.options.now?.() ?? Date.now();
  }

  /** Registers an endpoint; the returned secret is the only time it is shown. */
  createEndpoint(input: {
    workspaceRef: string;
    url: string;
    events: WebhookEventType[];
  }): WebhookEndpoint {
    let url: URL;
    try {
      url = new URL(input.url);
    } catch {
      throw new WebhookError("invalid webhook URL");
    }
    if (
      url.protocol !== "https:" &&
      !(this.options.allowInsecureUrls && url.protocol === "http:")
    ) {
      throw new WebhookError("webhook URLs must use HTTPS");
    }
    try {
      assertPublicUrlShape(url, this.policy());
    } catch (e) {
      throw new WebhookError(
        `webhook URL not allowed: ${(e as Error).message}`
      );
    }
    const unknown = input.events.filter(
      (e) => !(WEBHOOK_EVENT_TYPES as readonly string[]).includes(e)
    );
    const retired = unknown.filter((e) => RETIRED_EVENT_TYPES[e]);
    if (retired.length)
      throw new WebhookError(
        `retired event types: ${retired
          .map((e) => `${e} (use ${RETIRED_EVENT_TYPES[e].join(" or ")})`)
          .join(
            ", "
          )}; the conversation's transcript and recording are in the call record`
      );
    if (unknown.length)
      throw new WebhookError(`unknown event types: ${unknown.join(", ")}`);
    const endpoint: WebhookEndpoint = {
      id: `whe_${randomUUID()}`,
      workspaceRef: input.workspaceRef,
      url: input.url,
      events: input.events,
      secret: `whsec_${randomBytes(24).toString("base64url")}`
    };
    this.options.store.putEndpoint(endpoint);
    return endpoint;
  }

  /** New secret; the old one keeps verifying for `windowMs`. Returns the new secret. */
  rotateSecret(endpointId: string, windowMs = 24 * 3600 * 1000): string {
    const e = this.options.store.endpoints().find((x) => x.id === endpointId);
    if (!e) throw new WebhookError(`no endpoint ${endpointId}`);
    const secret = `whsec_${randomBytes(24).toString("base64url")}`;
    this.options.store.putEndpoint({
      ...e,
      secret,
      previousSecret: e.secret,
      previousUntil: this.now() + windowMs
    });
    return secret;
  }

  /** Fans an event out to every endpoint of its workspace subscribed to its type. */
  publish(event: WebhookEvent): Delivery[] {
    return this.options.store
      .endpoints(event.workspaceRef)
      .filter((e) => e.events.includes(event.type))
      .map((e) => {
        const d: Delivery = {
          id: `whd_${randomUUID()}`,
          endpointId: e.id,
          event,
          status: "pending",
          attempts: 0,
          nextAttemptAt: this.now()
        };
        this.options.store.putDelivery(d);
        return d;
      });
  }

  /** Attempts every pending delivery that is due; returns how many were attempted. */
  async runDue(): Promise<number> {
    const due = this.options.store
      .deliveries()
      .filter((d) => d.status === "pending" && d.nextAttemptAt <= this.now());
    await Promise.all(due.map((d) => this.attempt(d)));
    return due.length;
  }

  /** Sends a delivery again now, with the original event id and a fresh signature. */
  async resend(deliveryId: string): Promise<Delivery> {
    const d = this.options.store.deliveries().find((x) => x.id === deliveryId);
    if (!d) throw new WebhookError(`no delivery ${deliveryId}`);
    const again: Delivery = {
      ...d,
      status: "pending",
      nextAttemptAt: this.now(),
      firstAttemptAt: this.now()
    };
    this.options.store.putDelivery(again);
    return this.attempt(again);
  }

  private async attempt(d: Delivery): Promise<Delivery> {
    const endpoint = this.options.store
      .endpoints()
      .find((e) => e.id === d.endpointId);
    if (!endpoint) {
      const failed: Delivery = { ...d, status: "failed" };
      this.options.store.putDelivery(failed);
      return failed;
    }
    const now = this.now();
    const secrets = [endpoint.secret];
    if (endpoint.previousSecret && (endpoint.previousUntil ?? 0) > now)
      secrets.push(endpoint.previousSecret);
    const body = JSON.stringify(d.event);
    let status = 0;
    try {
      // Checked again at delivery: DNS may have changed since the endpoint was created.
      const res = await safeFetch(endpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...webhookHeaders(body, secrets, Math.floor(now / 1000))
        },
        body,
        timeoutMs: this.options.attemptTimeoutMs ?? 10_000,
        maxRedirects: 0,
        policy: this.policy()
      });
      status = res.status;
      await res.arrayBuffer().catch(() => undefined);
    } catch {
      status = 0;
    }
    const attempts = d.attempts + 1;
    const firstAttemptAt = d.firstAttemptAt ?? now;
    let next: Delivery;
    if (status >= 200 && status < 300) {
      next = {
        ...d,
        status: "succeeded",
        attempts,
        firstAttemptAt,
        lastAttemptAt: now,
        lastStatus: status
      };
    } else {
      const delay = Math.min(
        (this.options.firstDelayMs ?? 10_000) * 2 ** (attempts - 1),
        this.options.maxDelayMs ?? 3600_000
      );
      const giveUp =
        now + delay - firstAttemptAt >
        (this.options.retryPeriodMs ?? 24 * 3600_000);
      next = {
        ...d,
        status: giveUp ? "failed" : "pending",
        attempts,
        firstAttemptAt,
        lastAttemptAt: now,
        lastStatus: status,
        nextAttemptAt: now + delay
      };
    }
    this.options.store.putDelivery(next);
    return next;
  }
}

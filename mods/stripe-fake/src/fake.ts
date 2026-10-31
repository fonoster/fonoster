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
import { createHmac, randomBytes } from "crypto";
import { notFound } from "./errors";
import { API_VERSION, stripeObject } from "./schema";

export type Json = Record<string, unknown>;

/** A next-payment outcome forced through the control API (D6). */
export type PaymentOutcome =
  "succeed" | "decline" | "requires_action" | "timeout";

export type Delivery = {
  id: string;
  event: string;
  endpoint: string;
  url: string;
  attempts: { at: number; status: number; error?: string }[];
  nextAt?: number;
  done: boolean;
};

export type MeterEvent = {
  identifier: string;
  eventName: string;
  meter?: string;
  customer?: string;
  value: number;
  timestamp: number;
  received: number;
  status: "accepted" | "rejected" | "canceled";
  error?: string;
};

/** A change the viewer hears about (D7). */
export type Change = {
  kind: "object" | "event" | "delivery" | "clock" | "reset";
  id?: string;
};

/** Webhook retry delays after each failed attempt, in seconds of fake time (up to ~3 days). */
const RETRY_DELAYS = [
  60,
  300,
  1800,
  3600,
  3 * 3600,
  6 * 3600,
  12 * 3600,
  24 * 3600,
  24 * 3600
];

/**
 * The fake's whole state (add-stripe-fake): objects by id, events, webhook deliveries, idempotency
 * replays, the clock and the forced outcomes. In memory; snapshot and restore copy it as JSON.
 */
export class StripeFake {
  objects = new Map<string, Json>();
  counters = new Map<string, number>();
  events: Json[] = [];
  deliveries: Delivery[] = [];
  /** Accepted meter events (Stripe gives them no id; `identifier` is the key). */
  meterEvents: MeterEvent[] = [];
  /** Grace period between a period's end and its invoice's finalization, in seconds (D4). */
  graceSeconds = 3600;
  /** Flat tax rates by customer country, in percent (D4, a stub). */
  taxRates: Record<string, number> = {};
  idempotency = new Map<
    string,
    { params: string; status: number; body: unknown; at: number }
  >();
  /** Seconds added to real time for objects on no test clock. */
  offset = 0;
  nextPayment = new Map<string, PaymentOutcome>();
  failWebhooks = 0;
  latencyMs = 0;
  rateLimit = false;
  /** Webhook endpoints from config (compose), besides those created through the API. */
  readonly configEndpoints: { url: string; secret: string }[];
  private readonly listeners = new Set<(change: Change) => void>();
  private requestCounter = 0;

  /** Where Customer Portal links point: Stripe's host, or the fake's own `/p` pages (portal.ts). */
  readonly portalUrl: string;

  constructor(
    options: {
      webhooks?: { url: string; secret: string }[];
      portalUrl?: string;
    } = {}
  ) {
    this.configEndpoints = options.webhooks ?? [];
    this.portalUrl = options.portalUrl ?? "https://billing.stripe.com";
  }

  // ---- ids and time --------------------------------------------------------------------

  /** Ids restart after a reset: prefix + "fake" + a counter, as long as Stripe's. */
  id(prefix: string): string {
    const n = (this.counters.get(prefix) ?? 0) + 1;
    this.counters.set(prefix, n);
    return `${prefix}_fake${n.toString().padStart(12, "0")}`;
  }

  secret(prefix: string): string {
    return `${prefix}_${randomBytes(16).toString("hex")}`;
  }

  requestId(): string {
    return `req_fake${(++this.requestCounter).toString().padStart(12, "0")}`;
  }

  /** Now, in unix seconds, for a test clock or for objects on none. */
  now(testClock?: string | null): number {
    if (testClock) {
      const clock = this.objects.get(testClock);
      if (clock) return clock.frozen_time as number;
    }
    return Math.floor(Date.now() / 1000) + this.offset;
  }

  /** The test clock an object lives on, through its customer. */
  clockOf(customer?: string | null): string | null {
    if (!customer) return null;
    return (this.objects.get(customer)?.test_clock as string | null) ?? null;
  }

  // ---- objects ---------------------------------------------------------------------------

  create(
    schema: string,
    prefix: string,
    fields: Json,
    clock: string | null = null
  ): Json {
    const obj = stripeObject(schema, {
      id: this.id(prefix),
      created: this.now(clock),
      ...fields
    });
    this.objects.set(obj.id as string, obj);
    this.notify({ kind: "object", id: obj.id as string });
    return obj;
  }

  get(id: string, kind: string, param = "id"): Json {
    const obj = this.objects.get(id);
    if (!obj || (obj.deleted && kind !== "deleted"))
      throw notFound(kind, id, param);
    return obj;
  }

  /** Changes fields in place; returns the previous values of the changed ones. */
  update(obj: Json, fields: Json): Json {
    const previous: Json = {};
    Object.entries(fields).forEach(([k, v]) => {
      if (JSON.stringify(obj[k]) !== JSON.stringify(v)) previous[k] = obj[k];
      obj[k] = v;
    });
    this.notify({ kind: "object", id: obj.id as string });
    return previous;
  }

  all(object: string, keep: (o: Json) => boolean = () => true): Json[] {
    return [...this.objects.values()].filter(
      (o) => o.object === object && !o.deleted && keep(o)
    );
  }

  // ---- events and webhooks ---------------------------------------------------------------

  /** Records an event in Stripe's envelope and queues it for every enabled endpoint (D3, D5). */
  emit(
    type: string,
    object: Json,
    previous?: Json,
    clock: string | null = null
  ): Json {
    const event = stripeObject("event", {
      id: this.id("evt"),
      object: "event",
      api_version: API_VERSION,
      created: this.now(clock),
      type,
      data: {
        object: JSON.parse(JSON.stringify(object)),
        ...(previous && Object.keys(previous).length
          ? { previous_attributes: previous }
          : {})
      },
      pending_webhooks: 0,
      request: { id: null, idempotency_key: null }
    });
    this.events.push(event);
    this.queue(event);
    this.notify({ kind: "event", id: event.id as string });
    return event;
  }

  /** A thin v2 event (meter error reports), delivered as Stripe does, read back at /v2/core/events. */
  emitThin(
    type: string,
    relatedObject: Json,
    data: Json,
    clock: string | null = null
  ): Json {
    const event = {
      id: this.id("evt"),
      object: "v2.core.event",
      type,
      created: new Date(this.now(clock) * 1000).toISOString(),
      livemode: false,
      context: null,
      related_object: relatedObject,
      data
    };
    this.events.push(event);
    this.queue(thinOf(event));
    this.notify({ kind: "event", id: event.id });
    return event;
  }

  endpoints(): { id: string; url: string; secret: string }[] {
    const api = this.all("webhook_endpoint", (e) => e.status === "enabled").map(
      (e) => ({
        id: e.id as string,
        url: e.url as string,
        secret: e.secret as string
      })
    );
    const config = this.configEndpoints.map((e, i) => ({
      id: `we_config${i}`,
      ...e
    }));
    return [...config, ...api];
  }

  /**
   * Queues an event's deliveries. They are due now in real (fake global) time, also for events of
   * test-clock objects: Stripe sends those as they happen, whatever the clock's frozen time.
   */
  private queue(event: Json) {
    const now = this.now();
    const targets = this.endpoints().filter((endpoint) => {
      const api = this.objects.get(endpoint.id);
      const enabled = (api?.enabled_events as string[] | undefined) ?? ["*"];
      return enabled.includes("*") || enabled.includes(event.type as string);
    });
    targets.forEach((endpoint) => {
      this.deliveries.push({
        id: this.id("whdl"),
        event: event.id as string,
        endpoint: endpoint.id,
        url: endpoint.url,
        attempts: [],
        nextAt: now,
        done: false
      });
    });
    (event as Json).pending_webhooks = targets.length;
    void this.deliverDue();
  }

  /** The signature header Stripe sends: t=<unix>,v1=<hex HMAC-SHA256(secret, "<t>.<body>")>. */
  static sign(secret: string, body: string, t: number): string {
    return `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
  }

  private delivering = false;
  private deliverAgain = false;

  /**
   * Attempts every delivery that is due by fake time; failures are retried later (D5). Events
   * queued while a round runs are delivered by another round right after, in order.
   */
  async deliverDue(): Promise<void> {
    if (this.delivering) {
      this.deliverAgain = true;
      return;
    }
    this.delivering = true;
    try {
      do {
        this.deliverAgain = false;
        for (const d of this.deliveries) {
          if (d.done || d.nextAt === undefined || d.nextAt > this.now())
            continue;
          await this.attempt(d);
        }
      } while (this.deliverAgain);
    } finally {
      this.delivering = false;
    }
  }

  async attempt(d: Delivery): Promise<void> {
    const event = this.events.find((e) => e.id === d.event);
    const endpoint = this.endpoints().find((e) => e.id === d.endpoint);
    if (!event || !endpoint) {
      d.done = true;
      return;
    }
    const at = this.now();
    let status = 0;
    let error: string | undefined;
    if (this.failWebhooks > 0) {
      this.failWebhooks--;
      status = 500;
      error = "failed by /_fake/webhooks/fail_next";
    } else {
      const body = JSON.stringify(
        event.object === "v2.core.event" ? thinOf(event) : event
      );
      try {
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "stripe-signature": StripeFake.sign(endpoint.secret, body, at),
            "user-agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)"
          },
          body,
          signal: AbortSignal.timeout(10_000)
        });
        status = res.status;
      } catch (e) {
        error = (e as Error).message;
      }
    }
    d.attempts.push({ at, status, ...(error ? { error } : {}) });
    if (status >= 200 && status < 300) {
      d.done = true;
      d.nextAt = undefined;
      event.pending_webhooks = Math.max(
        0,
        (event.pending_webhooks as number) - 1
      );
    } else {
      const delay = RETRY_DELAYS[d.attempts.length - 1];
      if (delay === undefined) {
        d.done = true;
        d.nextAt = undefined;
      } else d.nextAt = at + delay;
    }
    this.notify({ kind: "delivery", id: d.id });
  }

  /** Delivers an event again, now, to every endpoint (D6 replay). */
  async replay(eventId: string): Promise<void> {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) throw notFound("event", eventId);
    this.queue(event);
    await this.deliverDue();
  }

  // ---- viewer ----------------------------------------------------------------------------

  subscribe(listener: (change: Change) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(change: Change) {
    this.listeners.forEach((l) => l(change));
  }

  // ---- reset, snapshot, restore ----------------------------------------------------------

  reset() {
    this.objects.clear();
    this.counters.clear();
    this.events = [];
    this.deliveries = [];
    this.meterEvents = [];
    this.idempotency.clear();
    this.offset = 0;
    this.nextPayment.clear();
    this.failWebhooks = 0;
    this.latencyMs = 0;
    this.rateLimit = false;
    this.notify({ kind: "reset" });
  }

  snapshot(): Json {
    return JSON.parse(
      JSON.stringify({
        objects: [...this.objects.values()],
        counters: [...this.counters.entries()],
        events: this.events,
        deliveries: this.deliveries,
        meterEvents: this.meterEvents,
        offset: this.offset
      })
    );
  }

  restore(snapshot: Json) {
    this.reset();
    (snapshot.objects as Json[]).forEach((o) =>
      this.objects.set(o.id as string, o)
    );
    (snapshot.counters as [string, number][]).forEach(([k, v]) =>
      this.counters.set(k, v)
    );
    this.events = snapshot.events as Json[];
    this.deliveries = snapshot.deliveries as Delivery[];
    this.meterEvents = (snapshot.meterEvents as MeterEvent[]) ?? [];
    this.offset = snapshot.offset as number;
    this.notify({ kind: "reset" });
  }
}

/** The thin envelope Stripe delivers for a v2 event: no data, read it back by id. */
export function thinOf(event: Json): Json {
  return without(event, "data");
}

/** A copy of an object without one field. */
export function without(object: Json, field: string): Json {
  const copy = { ...object };
  delete copy[field];
  return copy;
}

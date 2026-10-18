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
import { WriteBehind } from "../utils/WriteBehind";
import { Delivery, WebhookEndpoint, WebhookStore } from "./Dispatcher";
import { WebhookEvent, WebhookEventType } from "./events";

// Database-backed webhook storage (add-workspace-webhooks 2.1, 2.5) over the apiserver's Prisma
// schema (webhook_endpoints, webhook_deliveries). WebhookStore is synchronous, so endpoints are a
// snapshot refreshed by `refresh()` and writes go behind, in order (build log P-B5). Secrets are
// `/// @encrypted` columns: pass a client with the field-encryption extension to encrypt them.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type PrismaWebhookStoreOptions = {
  /**
   * Take over pending deliveries this long overdue (their owner died or stalled). Off by default;
   * turn it on in processes that run `runDue()` on a timer. Default 60 s when set to true.
   */
  adoptOverdue?: boolean | number;
  now?: () => number;
};

type Row = Record<string, unknown>;
const ms = (d: unknown) => (d ? (d as Date).getTime() : undefined);
const date = (n?: number) => (n === undefined ? null : new Date(n));

function toEndpoint(r: Row): WebhookEndpoint {
  const e: WebhookEndpoint = {
    id: r.ref as string,
    workspaceRef: r.accessKeyId as string,
    url: r.url as string,
    events: r.events as WebhookEventType[],
    secret: r.secret as string
  };
  if (r.previousSecret) {
    e.previousSecret = r.previousSecret as string;
    e.previousUntil = ms(r.previousUntil);
  }
  return e;
}

function toDelivery(r: Row): Delivery {
  const d: Delivery = {
    id: r.ref as string,
    endpointId: r.endpointRef as string,
    event: r.event as WebhookEvent,
    status: r.status as Delivery["status"],
    attempts: r.attempts as number,
    nextAttemptAt: ms(r.nextAttemptAt)!
  };
  if (r.firstAttemptAt) d.firstAttemptAt = ms(r.firstAttemptAt);
  if (r.lastAttemptAt) d.lastAttemptAt = ms(r.lastAttemptAt);
  if (r.lastStatus !== null && r.lastStatus !== undefined)
    d.lastStatus = r.lastStatus as number;
  return d;
}

/** A delivery's columns (without its ref). */
function deliveryData(x: Delivery) {
  return {
    endpointRef: x.endpointId,
    accessKeyId: x.event.workspaceRef,
    eventId: x.event.id,
    eventType: x.event.type,
    event: x.event,
    status: x.status,
    attempts: x.attempts,
    firstAttemptAt: date(x.firstAttemptAt),
    lastAttemptAt: date(x.lastAttemptAt),
    lastStatus: x.lastStatus ?? null,
    nextAttemptAt: new Date(x.nextAttemptAt)
  };
}

export class PrismaWebhookStore implements WebhookStore {
  private e = new Map<string, WebhookEndpoint>();
  private d = new Map<string, Delivery>();
  private readonly writes = new WriteBehind();

  private constructor(
    private readonly prisma: PrismaLike,
    private readonly options: PrismaWebhookStoreOptions
  ) {}

  static async open(
    prisma: PrismaLike,
    options: PrismaWebhookStoreOptions = {}
  ): Promise<PrismaWebhookStore> {
    const store = new PrismaWebhookStore(prisma, options);
    await store.refresh();
    return store;
  }

  private now() {
    return this.options.now?.() ?? Date.now();
  }

  /**
   * Reloads endpoints, forgets settled deliveries (they stay in the log) and, with
   * `adoptOverdue`, claims pending deliveries whose owner stopped retrying them.
   */
  async refresh() {
    await this.writes.flush();
    const rows: Row[] = await this.prisma.webhookEndpoint.findMany();
    this.e = new Map(rows.map((r) => [r.ref as string, toEndpoint(r)]));
    for (const [id, d] of this.d) if (d.status !== "pending") this.d.delete(id);
    const adopt = this.options.adoptOverdue;
    if (!adopt) return;
    const after = adopt === true ? 60_000 : adopt;
    const overdue: Row[] = await this.prisma.webhookDelivery.findMany({
      where: {
        status: "pending",
        nextAttemptAt: { lt: new Date(this.now() - after) }
      },
      take: 500
    });
    for (const r of overdue) {
      if (this.d.has(r.ref as string)) continue;
      // Claim it: only one process moves nextAttemptAt from the value it read.
      const { count } = await this.prisma.webhookDelivery.updateMany({
        where: { ref: r.ref, nextAttemptAt: r.nextAttemptAt },
        data: { nextAttemptAt: new Date(this.now()) }
      });
      if (count === 1)
        this.d.set(r.ref as string, {
          ...toDelivery(r),
          nextAttemptAt: this.now()
        });
    }
  }

  /**
   * Reloads one workspace's endpoints now. The fan-out calls it for each event, so an endpoint
   * created, changed or deleted a moment ago through another replica counts at once instead of
   * after the next `refresh()` (ST-2).
   */
  async refreshEndpoints(workspaceRef: string) {
    await this.writes.flush();
    const rows: Row[] = await this.prisma.webhookEndpoint.findMany({
      where: { accessKeyId: workspaceRef }
    });
    for (const [id, e] of this.e)
      if (e.workspaceRef === workspaceRef) this.e.delete(id);
    for (const r of rows) this.e.set(r.ref as string, toEndpoint(r));
  }

  endpoints(workspaceRef?: string) {
    return [...this.e.values()].filter(
      (x) => !workspaceRef || x.workspaceRef === workspaceRef
    );
  }

  putEndpoint(x: WebhookEndpoint) {
    this.e.set(x.id, x);
    const data = {
      accessKeyId: x.workspaceRef,
      url: x.url,
      events: x.events,
      secret: x.secret,
      previousSecret: x.previousSecret ?? null,
      previousUntil: date(x.previousUntil)
    };
    this.writes.push(() =>
      this.prisma.webhookEndpoint.upsert({
        where: { ref: x.id },
        create: { ref: x.id, ...data },
        update: data
      })
    );
  }

  deleteEndpoint(id: string) {
    this.e.delete(id);
    this.writes.push(() =>
      this.prisma.webhookEndpoint.deleteMany({ where: { ref: id } })
    );
  }

  /** Deliveries this process knows: the ones it created, adopted or loaded. */
  deliveries(endpointId?: string) {
    return [...this.d.values()].filter(
      (x) => !endpointId || x.endpointId === endpointId
    );
  }

  /**
   * Stores new deliveries before returning (the fan-out acknowledges the bus message only then).
   * Returns the ones it stored; a delivery that already exists (the same event fanned out again)
   * is left as it is, and whoever owns it keeps it (ST-2).
   */
  async insertDeliveries(xs: Delivery[]): Promise<Delivery[]> {
    await this.writes.flush();
    const created: Delivery[] = [];
    for (const x of xs) {
      try {
        await this.prisma.webhookDelivery.create({
          data: { ref: x.id, ...deliveryData(x) }
        });
      } catch (e) {
        if ((e as { code?: string }).code === "P2002") continue;
        throw e;
      }
      this.d.set(x.id, x);
      created.push(x);
    }
    return created;
  }

  putDelivery(x: Delivery) {
    this.d.set(x.id, x);
    const data = deliveryData(x);
    this.writes.push(() =>
      this.prisma.webhookDelivery.upsert({
        where: { ref: x.id },
        create: { ref: x.id, ...data },
        update: data
      })
    );
  }

  /**
   * The delivery log, newest first (W6). Loaded deliveries become known to this store, so
   * `WebhookDispatcher.resend` can find them.
   */
  async loadDeliveries(
    filter: { endpointId?: string; workspaceRef?: string; id?: string } = {},
    limit = 100
  ): Promise<Delivery[]> {
    await this.writes.flush();
    const rows: Row[] = await this.prisma.webhookDelivery.findMany({
      where: {
        ...(filter.id ? { ref: filter.id } : {}),
        ...(filter.endpointId ? { endpointRef: filter.endpointId } : {}),
        ...(filter.workspaceRef ? { accessKeyId: filter.workspaceRef } : {})
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });
    const out = rows.map(toDelivery);
    for (const d of out) if (!this.d.has(d.id)) this.d.set(d.id, d);
    return out;
  }

  /** Waits for every queued write; throws the first failure. */
  flush() {
    return this.writes.flush();
  }
}

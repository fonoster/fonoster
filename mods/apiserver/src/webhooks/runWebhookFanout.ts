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
import { Webhooks } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { consumeDurable } from "../core/durableConsumer";
import type { NatsConnection } from "nats";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/** The work queue that captures `webhooks.events` and its one durable consumer (ST-2). */
export const WEBHOOK_EVENTS_STREAM = "FONOSTER_WEBHOOKS";
export const WEBHOOK_EVENTS_DURABLE = "apiserver-webhooks";

export type WebhookFanoutConfig = {
  enabled: boolean;
  /** How often due deliveries (retries, adopted ones) are attempted. */
  intervalMs: number;
  /** How often the endpoint snapshot is reloaded (new or changed endpoints). */
  refreshMs: number;
  allowInsecureUrls?: boolean;
  allowedDestinations?: string[];
  /** How long a replica may hold an event before another one gets it (default 30 s). */
  ackWaitMs?: number;
};

/** The slice of the apiserver's Prisma client the fan-out uses (with field encryption). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WebhookFanoutDb = any;

/**
 * Event fan-out from the bus (add-workspace-webhooks 2.2, build log LO-B1, ST-2): consumes
 * `webhooks.events` through a JetStream durable consumer (one replica per event), fills in the
 * workspace from the app when a producer did not know it, reloads that workspace's endpoints,
 * stores one delivery per subscribed endpoint and only then acknowledges the event, attempts the
 * new deliveries at once, and keeps retrying due deliveries (including ones adopted from replicas
 * that died). An event redelivered after a replica died finds the deliveries it already made
 * (their ids depend on the event and the endpoint), so it is delivered once.
 */
export async function runWebhookFanout(
  config: WebhookFanoutConfig,
  deps: { nc: NatsConnection; db: WebhookFanoutDb }
): Promise<{ stop(): Promise<void>; runDue(): Promise<void> }> {
  const store = await Webhooks.PrismaWebhookStore.open(deps.db, {
    adoptOverdue: true
  });
  const dispatcher = new Webhooks.WebhookDispatcher({
    store,
    allowInsecureUrls: config.allowInsecureUrls,
    allowedDestinations: config.allowedDestinations
  });
  let running: Promise<void> | undefined;
  const runDue = () => {
    running ??= (async () => {
      try {
        await dispatcher.runDue();
        await store.flush();
      } catch (e) {
        logger.warn(`webhook delivery failed: ${(e as Error).message}`);
      } finally {
        running = undefined;
      }
    })();
    return running;
  };
  const apps = new Map<string, { at: number; workspace?: string }>();
  const workspaceOfApp = async (appRef: string) => {
    const hit = apps.get(appRef);
    if (hit && Date.now() - hit.at < 60_000) return hit.workspace;
    const app = await deps.db.application.findUnique({
      where: { ref: appRef },
      select: { accessKeyId: true }
    });
    apps.set(appRef, { at: Date.now(), workspace: app?.accessKeyId });
    return app?.accessKeyId ?? undefined;
  };
  /** One bus event: resolves when its deliveries are stored (then the event is acknowledged). */
  const intake = async (data: Uint8Array) => {
    const event = Webhooks.parseBusEvent(data);
    if (!event) return;
    const resolved = await Webhooks.resolveWorkspace(event, workspaceOfApp);
    if (!resolved) return;
    await store.refreshEndpoints(resolved.workspaceRef);
    const created = await store.insertDeliveries(dispatcher.plan(resolved));
    if (created.length) void runDue();
  };
  let unsubscribe: () => Promise<void> | void;
  try {
    unsubscribe = await consumeDurable(
      deps.nc,
      {
        stream: WEBHOOK_EVENTS_STREAM,
        subject: Webhooks.WEBHOOK_EVENTS_SUBJECT,
        durable: WEBHOOK_EVENTS_DURABLE,
        ackWaitMs: config.ackWaitMs
      },
      intake,
      (e) => logger.warn(`webhook fan-out failed: ${e.message}`)
    );
    logger.info("webhooks: fan-out from webhooks.events (JetStream) is on");
  } catch (e) {
    // No JetStream, or the NATS user may not use the stream: one replica per event still, but an
    // event in flight when a replica dies is lost.
    logger.warn(
      `webhooks: JetStream consumer unavailable (${(e as Error).message}); falling back to a core NATS queue group`
    );
    const sub = deps.nc.subscribe(Webhooks.WEBHOOK_EVENTS_SUBJECT, {
      queue: "apiserver-webhooks",
      callback: (err, msg) => {
        if (err) return;
        intake(msg.data).catch((e2) =>
          logger.warn(`webhook fan-out failed: ${(e2 as Error).message}`)
        );
      }
    });
    unsubscribe = () => sub.unsubscribe();
  }
  const timers = [
    setInterval(() => void runDue(), config.intervalMs),
    setInterval(
      () =>
        store
          .refresh()
          .catch((e) => logger.warn(`webhook refresh failed: ${e.message}`)),
      config.refreshMs
    )
  ];
  timers.forEach((t) => t.unref());
  return {
    runDue,
    async stop() {
      await unsubscribe();
      timers.forEach(clearInterval);
      await running;
      await store.flush().catch(() => undefined);
    }
  };
}

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
import { Sessions, Webhooks } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { consumeDurable } from "../core/durableConsumer";
import { createLostCallSweep } from "./lostCalls";
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
  /** How often calls of lost appbridges are looked for (default 5 s; 0 turns it off). */
  lostCallSweepMs?: number;
  /** The session registry's bucket (default Sessions.SESSIONS_BUCKET; tests). */
  sessionsBucket?: string;
};

/** The slice of the apiserver's Prisma client the fan-out uses (with field encryption). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WebhookFanoutDb = any;

/**
 * Event fan-out from the bus (add-workspace-webhooks 2.2, build log LO-B1, ST-2): consumes
 * `webhooks.events` through a JetStream durable consumer (one replica per event), fills in the
 * workspace from the app when a producer did not know it (and takes media nodes' call.failed
 * reports from their own subject), reloads that workspace's endpoints,
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
  /** One event: resolves when its deliveries are stored. */
  const intakeEvent = async (event: Webhooks.WebhookEvent) => {
    const resolved = await Webhooks.resolveWorkspace(event, workspaceOfApp);
    if (!resolved) return;
    await store.refreshEndpoints(resolved.workspaceRef);
    const created = await store.insertDeliveries(dispatcher.plan(resolved));
    if (created.length) void runDue();
  };
  /** One bus event: resolves when its deliveries are stored (then the event is acknowledged). */
  const intake = async (data: Uint8Array) => {
    const event = Webhooks.parseBusEvent(data);
    if (event) await intakeEvent(event);
  };
  // Media nodes report calls no gateway claimed on their own subject (they may not publish
  // webhooks.events, M6); only a well-formed call.failed is accepted, its workspace from the app.
  // One replica per report (queue group); a repeated report has the same event id.
  const nodeReports = deps.nc.subscribe(Webhooks.NODE_CALL_FAILED_SUBJECT, {
    queue: "apiserver-node-call-failed",
    callback: (err, msg) => {
      if (err) return;
      const event = Webhooks.nodeCallFailedEvent(msg.subject, msg.data);
      if (!event) return;
      intakeEvent(event).catch((e) =>
        logger.warn(`node call.failed fan-out failed: ${(e as Error).message}`)
      );
    }
  });
  // Calls whose appbridge died mid-call get their call.ended (reason appbridge-lost) here: every
  // replica sweeps, and the event id depends on the call, so each endpoint gets one delivery.
  const stopLost = await watchLostCalls(config, deps.nc, (event) =>
    intakeEvent(event).catch((e) =>
      logger.warn(`lost call fan-out failed: ${(e as Error).message}`)
    )
  );
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
      nodeReports.unsubscribe();
      stopLost();
      await unsubscribe();
      timers.forEach(clearInterval);
      await running;
      await store.flush().catch(() => undefined);
    }
  };
}

/** Follows the session registry's calls and appbridges and sweeps for lost calls. */
async function watchLostCalls(
  config: WebhookFanoutConfig,
  nc: NatsConnection,
  emit: (event: Webhooks.WebhookEvent) => unknown
): Promise<() => void> {
  const sweepMs = config.lostCallSweepMs ?? 5_000;
  if (sweepMs === 0) return () => undefined;
  const lost = createLostCallSweep({ emit });
  const stops: (() => void)[] = [];
  try {
    const kv = await Promise.race([
      Sessions.openSessions(nc, { bucket: config.sessionsBucket }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timed out")), 5000).unref()
      )
    ]);
    stops.push(await Sessions.watchSessions(kv, "gateways", lost.onEntry));
    stops.push(await Sessions.watchSessions(kv, "calls", lost.onEntry));
  } catch (e) {
    stops.forEach((s) => s());
    logger.warn(
      `session registry unavailable; calls of lost appbridges get no call.ended: ${(e as Error).message}`
    );
    return () => undefined;
  }
  const timer = setInterval(() => {
    for (const event of lost.sweep())
      logger.warn(
        `call ${(event.data as { callRef: string }).callRef}: its appbridge is gone; call.ended (appbridge-lost)`
      );
  }, sweepMs);
  timer.unref();
  return () => {
    clearInterval(timer);
    stops.forEach((s) => s());
  };
}

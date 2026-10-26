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
import { createLostCalls, LostCalls } from "./lostCalls";
import {
  natsFailedCallRecords,
  subscribeNodeCallEvents
} from "./nodeCallEvents";
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
  /**
   * How long after a node's `app_gone` an AppBridge's own end of the call may still arrive before
   * the control plane sends `call.ended` (appbridge-lost) (default 2 s; tests).
   */
  appGoneGraceMs?: number;
  /** Whether minimal records of unanswered outbound calls are written (default true). */
  failedCallRecords?: boolean;
  /** The session registry's bucket (default Sessions.SESSIONS_BUCKET; tests). */
  sessionsBucket?: string;
};

/** The slice of the apiserver's Prisma client the fan-out uses (with field encryption). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WebhookFanoutDb = any;

/**
 * Event fan-out from the bus (add-workspace-webhooks 2.2, build log LO-B1, ST-2): consumes
 * `webhooks.events` through a JetStream durable consumer (one replica per event), fills in the
 * workspace from the app when a producer did not know it (and builds the events no AppBridge can
 * send from the Roomr nodes' call events: call.failed of unanswered outbound calls and call.ended
 * of calls whose AppBridge was lost), reloads that workspace's endpoints,
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
    const created = await dispatcher.publishOnce(resolved);
    if (created.length) void runDue();
  };
  /** One bus event: resolves when its deliveries are stored (then the event is acknowledged). */
  const intake = async (data: Uint8Array) => {
    const event = Webhooks.parseBusEvent(data);
    if (event) await intakeEvent(event);
  };
  // What no AppBridge can report, from the nodes' call events (one replica per event; the
  // events' ids depend on the call, so each endpoint gets one delivery): call.failed (and the
  // minimal record) of unanswered outbound calls, call.ended (appbridge-lost) of calls whose
  // AppBridge died.
  const lost = await watchLostCalls(config, deps.nc, (event) =>
    intakeEvent(event).catch((e) =>
      logger.warn(`lost call fan-out failed: ${(e as Error).message}`)
    )
  );
  const stopNodeEvents = subscribeNodeCallEvents(deps.nc, {
    lost: lost?.calls,
    intake: (event) =>
      intakeEvent(event).catch((e) =>
        logger.warn(`node call event fan-out failed: ${(e as Error).message}`)
      ),
    records:
      config.failedCallRecords === false
        ? undefined
        : natsFailedCallRecords(deps.nc),
    workspaceOfApp
  });
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
      stopNodeEvents();
      lost?.stop();
      await unsubscribe();
      timers.forEach(clearInterval);
      await running;
      await store.flush().catch(() => undefined);
    }
  };
}

/**
 * Follows the session registry's `calls.*` entries (AppBridge's) for the calls whose AppBridge
 * dies: the node's `app_gone` then sends their call.ended. Undefined without the registry.
 */
async function watchLostCalls(
  config: WebhookFanoutConfig,
  nc: NatsConnection,
  emit: (event: Webhooks.WebhookEvent) => unknown
): Promise<{ calls: LostCalls; stop(): void } | undefined> {
  const calls = createLostCalls({
    emit: (event) => {
      logger.warn(
        `call ${(event.data as { callRef: string }).callRef}: its AppBridge is gone; call.ended (appbridge-lost)`
      );
      return emit(event);
    },
    graceMs: config.appGoneGraceMs
  });
  let stopWatch: () => void;
  try {
    const kv = await Promise.race([
      Sessions.openSessions(nc, { bucket: config.sessionsBucket }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timed out")), 5000).unref()
      )
    ]);
    stopWatch = await Sessions.watchSessions(kv, "calls", calls.onEntry);
  } catch (e) {
    logger.warn(
      `session registry unavailable; calls of lost AppBridge replicas get no call.ended: ${(e as Error).message}`
    );
    return undefined;
  }
  const timer = setInterval(() => calls.forget(), 60_000);
  timer.unref();
  return {
    calls,
    stop() {
      clearInterval(timer);
      stopWatch();
      calls.stop();
    }
  };
}

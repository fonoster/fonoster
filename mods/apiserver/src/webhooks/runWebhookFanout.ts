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

const logger = getLogger({ service: "apiserver", filePath: __filename });

export type WebhookFanoutConfig = {
  enabled: boolean;
  /** How often due deliveries (retries, adopted ones) are attempted. */
  intervalMs: number;
  /** How often the endpoint snapshot is reloaded (new or changed endpoints). */
  refreshMs: number;
  allowInsecureUrls?: boolean;
  allowedDestinations?: string[];
};

/** The slice of the apiserver's Prisma client the fan-out uses (with field encryption). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WebhookFanoutDb = any;

/**
 * Event fan-out from the bus (add-workspace-webhooks 2.2, build log LO-B1): consumes
 * `webhooks.events` (one replica per event), fills in the workspace from the app when a producer
 * did not know it, stores one delivery per subscribed endpoint, attempts it at once, and keeps
 * retrying due deliveries (including ones adopted from replicas that died).
 */
export async function runWebhookFanout(
  config: WebhookFanoutConfig,
  deps: { nc: Webhooks.BusConnection; db: WebhookFanoutDb }
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
  const unsubscribe = Webhooks.subscribeWebhookFanout(deps.nc, {
    queue: "apiserver-webhooks",
    publish: (e) => dispatcher.publish(e),
    async workspaceOfApp(appRef) {
      const hit = apps.get(appRef);
      if (hit && Date.now() - hit.at < 60_000) return hit.workspace;
      const app = await deps.db.application.findUnique({
        where: { ref: appRef },
        select: { accessKeyId: true }
      });
      apps.set(appRef, { at: Date.now(), workspace: app?.accessKeyId });
      return app?.accessKeyId ?? undefined;
    },
    onPublished: (_e, deliveries) => {
      if (deliveries.length) void runDue();
    },
    onError: (e) => logger.warn(`webhook fan-out failed: ${e.message}`)
  });
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
  logger.info("webhooks: fan-out from webhooks.events is on");
  return {
    runDue,
    async stop() {
      unsubscribe();
      timers.forEach(clearInterval);
      await running;
      await store.flush().catch(() => undefined);
    }
  };
}

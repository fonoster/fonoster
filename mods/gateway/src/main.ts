#!/usr/bin/env node
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
import { CallRecordWriter } from "@fonoster/callrecord";
import {
  logUnhandledRejections,
  Registry as RegistryNs,
  Webhooks
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { AppStore, PrismaAppStore } from "./apps/AppStore";
import { databaseUrl, GatewayConfig, loadConfig } from "./config";
import { Gateway } from "./Gateway";
import { CallRecordSink, JsonlCallRecordSink } from "./record/CallRecordSink";
import { createRecordWriter } from "./record/createRecordWriter";
import { telemetry } from "./telemetry";

const logger = getLogger({ service: "gateway", filePath: __filename });
logUnhandledRejections(logger);

async function main() {
  const file =
    process.env.GATEWAY_CONFIG ??
    process.argv[2] ??
    "/etc/fonoster/gateway.yaml";
  const config = loadConfig(file);
  let record: CallRecordSink | undefined;
  let writer: CallRecordWriter | undefined;
  let sweeper: ReturnType<typeof setInterval> | undefined;
  // eslint-disable-next-line prefer-const
  let gateway: Gateway | undefined;
  if (config.callRecord) {
    writer = createRecordWriter(config.callRecord, (entry) =>
      gateway?.onRecordSealed(entry)
    );
    record = writer;
  } else if (process.env.GATEWAY_RECORD_DIR) {
    record = new JsonlCallRecordSink(process.env.GATEWAY_RECORD_DIR);
  }
  const db = await openDatabase(config);
  gateway = await new Gateway({
    config,
    record,
    apps: db.apps,
    registryStore: db.registryStore,
    workspaceKeys: db.workspaceKeys,
    webhooks: db.webhooks
  }).start();
  const running = gateway;
  telemetry.gauge("fonoster.gateway.calls.active", () => running.calls.size);
  if (writer) {
    const w = writer;
    // Records of calls whose gateway died are sealed by whichever replica sweeps first.
    void w.sweep();
    sweeper = setInterval(
      () => void w.sweep(),
      config.callRecord?.sweepIntervalMs ?? 10_000
    );
  }

  const shutdown = async () => {
    logger.info("shutting down");
    if (sweeper) clearInterval(sweeper);
    await gateway?.stop();
    await writer?.flush();
    await db.close();
    await telemetry.shutdown();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

/**
 * The control-plane database pieces the config asks for (build log P-B7, P-B8): apps from
 * `applications`, the registry tables, and a webhook dispatcher whose deliveries are stored, retried
 * here, and adopted from replicas that died.
 */
async function openDatabase(config: GatewayConfig): Promise<{
  apps?: AppStore;
  registryStore?: RegistryNs.RegistryStore;
  webhooks?: (event: Webhooks.WebhookEvent) => void;
  workspaceKeys?: RegistryNs.PrismaWorkspaceKeys;
  close(): Promise<void>;
}> {
  const url = databaseUrl(config);
  const timers: ReturnType<typeof setInterval>[] = [];
  if (!url) return { close: async () => undefined };
  const d = config.database!;
  const encryptionKey = d.encryptionKeyEnv
    ? process.env[d.encryptionKeyEnv]
    : undefined;
  const prisma = RegistryNs.openPrismaClient({
    url,
    encryptionKey,
    clientModule: d.clientModule
  });
  let hooks: Webhooks.PrismaWebhookStore | undefined;
  const out: Awaited<ReturnType<typeof openDatabase>> = {
    async close() {
      timers.forEach(clearInterval);
      await hooks?.flush().catch(() => undefined);
      await prisma.$disconnect();
    }
  };
  if (config.appStore?.source === "database") {
    out.apps = await PrismaAppStore.open(prisma, {
      cacheMs: config.appStore.cacheMs
    });
  }
  if (config.workspaceKeys?.enabled) {
    out.workspaceKeys = new RegistryNs.PrismaWorkspaceKeys(prisma, {
      cacheMs: config.workspaceKeys.cacheMs
    });
  }
  if (config.registry?.source === "database") {
    const store = await RegistryNs.PrismaRegistryStore.open(prisma);
    timers.push(
      setInterval(
        () =>
          store
            .refresh()
            .catch((e) => logger.warn(`registry refresh failed: ${e.message}`)),
        config.registry.refreshMs ?? 30_000
      )
    );
    out.registryStore = store;
  }
  if (config.webhooks?.enabled) {
    const w = config.webhooks;
    const store = await Webhooks.PrismaWebhookStore.open(prisma, {
      adoptOverdue: true
    });
    hooks = store;
    const dispatcher = new Webhooks.WebhookDispatcher({
      store,
      allowInsecureUrls: w.allowInsecureUrls,
      allowedDestinations: w.allowedDestinations
    });
    let running = false;
    timers.push(
      setInterval(async () => {
        if (running) return;
        running = true;
        try {
          await dispatcher.runDue();
          await store.flush();
        } catch (e) {
          logger.warn(`webhook delivery failed: ${(e as Error).message}`);
        } finally {
          running = false;
        }
      }, w.intervalMs ?? 1000),
      setInterval(
        () =>
          store
            .refresh()
            .catch((e) => logger.warn(`webhook refresh failed: ${e.message}`)),
        w.refreshMs ?? 30_000
      )
    );
    out.webhooks = (event) => dispatcher.publish(event);
  }
  return out;
}

main().catch((e) => {
  logger.error(e.message);
  process.exit(1);
});

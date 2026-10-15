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
import { convertLegacyAssistant } from "@fonoster/autopilot/dist/session/convertLegacyAssistant";
import { sessionAssistantSchema, Webhooks } from "@fonoster/common";
import { bindWorkspaceKey } from "./providerKeys";
import {
  LegacyNotice,
  MigrationDb,
  newStepReport,
  StepOptions,
  StepReport
} from "./types";

// rework-autopilot 5.3: every stored assistant (an Intelligence row's config) becomes a session
// assistant with convertLegacyAssistant. Around each conversion the job does what the converter
// asks: an inline key becomes the workspace's vendor key, the retired eventsHook becomes a
// workspace webhook, assistant audio filters move to the app. Rows that already parse as session
// assistants are left alone, which makes re-runs no-ops.

/** What the retired assistant webhook's receivers now get from workspace webhooks. */
export const ASSISTANT_WEBHOOK_EVENTS = [
  "call.started",
  "call.ended",
  "call_record.sealed"
] as const;

export type AssistantMigrationOptions = StepOptions & {
  /** Accept http:// eventsHook URLs as workspace webhooks (local testing only). */
  allowInsecureWebhooks?: boolean;
};

type IntelligenceRow = {
  ref: string;
  productRef: string;
  config: unknown;
  application: {
    ref: string;
    accessKeyId: string;
    name: string;
    filters: unknown;
  };
};

export async function migrateAssistants(
  db: MigrationDb,
  options: AssistantMigrationOptions = {}
): Promise<StepReport> {
  const report = newStepReport("assistants");
  const rows: IntelligenceRow[] = await db.intelligence.findMany({
    include: {
      application: {
        select: { ref: true, accessKeyId: true, name: true, filters: true }
      }
    },
    orderBy: { applicationRef: "asc" }
  });

  for (const row of rows) {
    const app = row.application;
    const notices: LegacyNotice[] = [];
    const note = (level: LegacyNotice["level"], message: string) =>
      notices.push({
        ref: app.ref,
        workspaceRef: app.accessKeyId,
        level,
        message
      });

    if (sessionAssistantSchema.safeParse(row.config).success) {
      report.unchanged.push(app.ref);
      continue;
    }

    let conversion: ReturnType<typeof convertLegacyAssistant>;
    try {
      conversion = convertLegacyAssistant(
        (row.config ?? {}) as Parameters<typeof convertLegacyAssistant>[0],
        { assistantRef: app.ref }
      );
    } catch (e) {
      report.skipped.push(app.ref);
      report.notices.push({
        ref: app.ref,
        workspaceRef: app.accessKeyId,
        level: "action",
        message: `assistant of "${app.name}" was not converted: ${(e as Error).message}; fix it in the dashboard (the hosted Autopilot hangs up on it until then)`
      });
      continue;
    }
    conversion.notices.forEach((m) => note("info", m));

    if (conversion.secret) {
      const result = await bindWorkspaceKey(
        db,
        {
          accessKeyId: app.accessKeyId,
          providerId: conversion.secret.providerId,
          key: conversion.secret.value
        },
        options.dryRun
      );
      if (result === "kept-existing")
        note(
          "action",
          `the workspace already has a different ${conversion.secret.providerId} key; it is kept and the assistant's inline key was dropped`
        );
    }

    if (conversion.webhook) {
      await ensureWebhook(db, app, conversion.webhook.url, options, note);
    }

    const model = conversion.assistant.languageModel.model;
    const productRef = `llm.${model.split("/")[0]}`;
    const product = await db.product.findUnique({ where: { ref: productRef } });

    if (!options.dryRun) {
      if (conversion.appFilters !== undefined && app.filters == null) {
        await db.application.update({
          where: { ref: app.ref },
          data: { filters: conversion.appFilters as object }
        });
      }
      await db.intelligence.update({
        where: { ref: row.ref },
        data: {
          config: conversion.assistant,
          ...(product ? { productRef } : {})
        }
      });
      for (const n of notices) {
        await db.registryNotice.create({
          data: {
            accessKeyId: app.accessKeyId,
            type: "legacy.migrated",
            data: {
              kind: "assistant",
              ref: n.ref,
              level: n.level,
              message: n.message
            }
          }
        });
      }
    }
    report.changed.push(app.ref);
    report.notices.push(...notices);
  }
  return report;
}

async function ensureWebhook(
  db: MigrationDb,
  app: IntelligenceRow["application"],
  url: string,
  options: AssistantMigrationOptions,
  note: (level: LegacyNotice["level"], message: string) => void
) {
  const existing = await db.webhookEndpoint.findFirst({
    where: { accessKeyId: app.accessKeyId, url }
  });
  if (existing) return;
  let endpoint: Webhooks.WebhookEndpoint;
  try {
    endpoint = new Webhooks.WebhookDispatcher({
      store: new Webhooks.MemoryWebhookStore(),
      allowInsecureUrls: options.allowInsecureWebhooks
    }).createEndpoint({
      workspaceRef: app.accessKeyId,
      url,
      events: [...ASSISTANT_WEBHOOK_EVENTS]
    });
  } catch (e) {
    note(
      "action",
      `the assistant webhook ${url} could not become a workspace webhook (${(e as Error).message}); create one by hand`
    );
    return;
  }
  if (!options.dryRun) {
    await db.webhookEndpoint.create({
      data: {
        ref: endpoint.id,
        accessKeyId: app.accessKeyId,
        url: endpoint.url,
        events: endpoint.events,
        secret: endpoint.secret
      }
    });
  }
  note(
    "action",
    `created the workspace webhook ${endpoint.id} for ${url} (${ASSISTANT_WEBHOOK_EVENTS.join(", ")}); deliveries are signed: rotate its secret in the dashboard to read it and update the receiver`
  );
}

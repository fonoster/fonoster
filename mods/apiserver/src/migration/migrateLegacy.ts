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
import {
  migrateApplications,
  MigratedApplication,
  MigrationOptions,
  PrismaApplicationStore
} from "../applications/migration";
import {
  AssistantMigrationOptions,
  migrateAssistants
} from "./migrateAssistants";
import { MigrationDb, newStepReport, StepReport } from "./types";

// The steps of `fonoster-migrate-legacy`, in order. Each is idempotent on its own.

export type LegacyMigrationOptions = AssistantMigrationOptions & {
  /** App routing (rework-autopilot 8.3): see the applications migration. */
  apps?: Omit<MigrationOptions, "defaults"> & {
    defaults?: MigrationOptions["defaults"];
    refs?: string[];
  };
};

export type LegacyMigrationReport = {
  steps: StepReport[];
  /** The migrated apps (with signing secrets; never printed). */
  apps: MigratedApplication[];
};

export const DEFAULT_APP_SPEECH = {
  voice: "deepgram/aura-2-thalia-en",
  language: "en-US"
};

export async function migrateLegacy(
  db: MigrationDb,
  options: LegacyMigrationOptions = {}
): Promise<LegacyMigrationReport> {
  const steps: StepReport[] = [];

  // Assistants first: an Autopilot app is only re-pointed once its assistant runs on the hosted
  // engine.
  steps.push(await migrateAssistants(db, options));

  const apps = await migrateApplications(new PrismaApplicationStore(db), {
    ...options.apps,
    defaults: options.apps?.defaults ?? DEFAULT_APP_SPEECH,
    dryRun: options.dryRun
  });
  const appStep = newStepReport("apps");
  appStep.changed.push(...apps.migrated.map((a) => a.ref));
  appStep.skipped.push(...apps.skipped);
  appStep.notices.push(...apps.notices);
  steps.push(appStep);

  return { steps, apps: apps.migrated };
}

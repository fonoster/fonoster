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
import { convertLegacyApplication } from "./convertLegacyApplication";
import {
  ApplicationMigrationStore,
  LegacyApplication,
  MigratedApplication,
  MigrationNotice,
  MigrationOptions
} from "./types";

export type MigrationReport = {
  migrated: MigratedApplication[];
  skipped: string[];
  notices: MigrationNotice[];
};

/**
 * Converts every legacy Application and saves the result (unless `dryRun`). Safe to re-run: an
 * app that was migrated keeps its signing secret and fallback; URL and speech are recomputed.
 */
export async function migrateApplications(
  store: ApplicationMigrationStore,
  options: MigrationOptions & { dryRun?: boolean; refs?: string[] }
): Promise<MigrationReport> {
  const report: MigrationReport = { migrated: [], skipped: [], notices: [] };
  const legacy = (await store.listLegacy()).filter(
    (a) => !options.refs || options.refs.includes(a.ref)
  );
  for (const app of legacy) {
    const existing = await store.getMigrated(app.ref);
    const { app: migrated, notices } = convertLegacyApplication(
      app,
      options,
      existing
    );
    report.notices.push(...notices);
    if (!migrated) {
      report.skipped.push(app.ref);
      continue;
    }
    if (!options.dryRun) await store.saveMigrated(migrated);
    report.migrated.push(migrated);
  }
  return report;
}

/** Keeps apps in memory (tests, and dry runs fed from a JSON export). */
export class InMemoryApplicationStore implements ApplicationMigrationStore {
  readonly migrated = new Map<string, MigratedApplication>();

  constructor(private readonly legacy: LegacyApplication[]) {}

  async listLegacy() {
    return this.legacy;
  }

  async getMigrated(ref: string) {
    return this.migrated.get(ref);
  }

  async saveMigrated(app: MigratedApplication) {
    this.migrated.set(app.ref, app);
  }
}

/**
 * The gateway's `apps:` YAML for migrated apps (the gateway reads apps from YAML until the
 * Application model is synced to cells, B5). Contains signing secrets: write it to a protected
 * file, never to logs.
 */
export function toGatewayApps(apps: MigratedApplication[]) {
  return apps.map((a) => ({
    ref: a.ref,
    url: a.url,
    protocol: a.protocol,
    signingSecret: a.signingSecret,
    workspaceRef: a.workspaceRef,
    speech: a.speech,
    ...(a.fallback ? { fallback: a.fallback } : {})
  }));
}

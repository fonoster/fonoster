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
import { providerOfProductRef } from "./catalogMapping";
import { bindWorkspaceKey } from "./providerKeys";
import { MigrationDb, newStepReport, StepOptions, StepReport } from "./types";

// add-provider-registry 5.2: the per-application `credentials` columns of TextToSpeech,
// SpeechToText and Intelligence rows become the workspace's vendor keys (one per provider, as the
// dashboard's Vendor keys page stores them). A moved column is cleared, so the key lives only in
// the Secret and a re-run finds nothing to move.

const TABLES = [
  ["textToSpeech", "TTS"],
  ["speechToText", "STT"],
  ["intelligence", "LLM"]
] as const;

/** A stored credentials value as the key a provider adapter takes. */
export function keyFromCredentials(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const keys = Object.keys(parsed);
      if (typeof parsed.apiKey === "string" && keys.length === 1)
        return parsed.apiKey;
      // Several fields (a Google service account, Azure key + region): the adapter takes the JSON.
      return JSON.stringify(parsed);
    }
    if (typeof parsed === "string") return parsed;
  } catch {
    // A bare key.
  }
  return raw;
}

export async function migrateCredentials(
  db: MigrationDb,
  options: StepOptions = {}
): Promise<StepReport> {
  const report = newStepReport("credentials");
  for (const [table, kind] of TABLES) {
    const rows: {
      ref: string;
      productRef: string;
      credentials: string | null;
      application: { ref: string; accessKeyId: string };
    }[] = await db[table].findMany({
      // Filtered here, not in SQL: the column is encrypted.
      include: { application: { select: { ref: true, accessKeyId: true } } },
      orderBy: { applicationRef: "asc" }
    });
    for (const row of rows) {
      const id = `${kind}:${row.application.ref}`;
      if (!row.credentials) continue;
      const providerId = providerOfProductRef(row.productRef);
      const note = (level: "info" | "action", message: string) =>
        report.notices.push({
          ref: row.application.ref,
          workspaceRef: row.application.accessKeyId,
          level,
          message
        });
      if (!providerId) {
        report.skipped.push(id);
        note(
          "action",
          `${kind} credentials for ${row.productRef} were not moved: the provider has no adapter in this release`
        );
        continue;
      }
      const result = await bindWorkspaceKey(
        db,
        {
          accessKeyId: row.application.accessKeyId,
          providerId,
          key: keyFromCredentials(row.credentials)
        },
        options.dryRun
      );
      if (result === "kept-existing")
        note(
          "action",
          `the workspace already has a different ${providerId} key; it is kept and this app's ${kind} credentials were dropped`
        );
      else if (result === "created")
        note(
          "info",
          `${kind} credentials moved to the workspace's ${providerId} vendor key`
        );
      if (!options.dryRun)
        await db[table].update({
          where: { ref: row.ref },
          data: { credentials: null }
        });
      report.changed.push(id);
    }
  }
  return report;
}

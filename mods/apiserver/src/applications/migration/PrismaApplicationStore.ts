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
  ApplicationMigrationStore,
  LegacyApplication,
  MigratedApplication
} from "./types";

/**
 * The slice of the Prisma client the adapter uses. Structural on purpose: the new Application
 * columns (url, protocol, signingSecret, speech, fallback) come from another change, so this file
 * compiles before and after they exist.
 */
export type PrismaApplicationClient = {
  application: {
    findMany(args: {
      include: {
        textToSpeech: true;
        speechToText: true;
        intelligence: true;
      };
    }): Promise<unknown[]>;
    findUnique(args: {
      where: { ref: string };
    }): Promise<Record<string, unknown> | null>;
    update(args: {
      where: { ref: string };
      data: Record<string, unknown>;
    }): Promise<unknown>;
  };
};

export const NEW_COLUMNS = [
  "url",
  "protocol",
  "signingSecret",
  "speechVoice",
  "speechLanguage",
  "fallbackAppRef",
  "fallbackMessage"
] as const;

/** Reads legacy Application rows and writes the new app columns on the same rows. */
export class PrismaApplicationStore implements ApplicationMigrationStore {
  constructor(private readonly prisma: PrismaApplicationClient) {}

  async listLegacy(): Promise<LegacyApplication[]> {
    const rows = (await this.prisma.application.findMany({
      include: { textToSpeech: true, speechToText: true, intelligence: true }
    })) as LegacyApplication[];
    return rows.map((r) => ({
      ref: r.ref,
      accessKeyId: r.accessKeyId,
      name: r.name,
      type: r.type,
      endpoint: r.endpoint,
      textToSpeech: r.textToSpeech ?? null,
      speechToText: r.speechToText ?? null,
      intelligence: r.intelligence ?? null
    }));
  }

  async getMigrated(ref: string): Promise<MigratedApplication | undefined> {
    const row = await this.prisma.application.findUnique({ where: { ref } });
    if (!row || typeof row.url !== "string" || !row.url) return undefined;
    const fallback: MigratedApplication["fallback"] = {};
    if (row.fallbackAppRef) fallback.app = String(row.fallbackAppRef);
    if (row.fallbackMessage) fallback.message = String(row.fallbackMessage);
    return {
      ref,
      name: String(row.name),
      workspaceRef: String(row.accessKeyId),
      url: row.url,
      protocol: (row.protocol as MigratedApplication["protocol"]) ?? "fonoster",
      signingSecret: String(row.signingSecret ?? ""),
      speech: {
        voice: String(row.speechVoice ?? ""),
        language: String(row.speechLanguage ?? "en-US")
      },
      ...(fallback.app || fallback.message ? { fallback } : {})
    };
  }

  async saveMigrated(app: MigratedApplication): Promise<void> {
    try {
      await this.prisma.application.update({
        where: { ref: app.ref },
        // The columns of the rebuild_persistence migration (speech_voice, fallback_app_ref, ...).
        data: {
          url: app.url,
          protocol: app.protocol,
          signingSecret: app.signingSecret,
          speechVoice: app.speech.voice,
          speechLanguage: app.speech.language,
          fallbackAppRef: app.fallback?.app ?? null,
          fallbackMessage: app.fallback?.message ?? null
        }
      });
    } catch (e) {
      const message = (e as Error).message ?? "";
      if (/Unknown arg|Unknown argument|does not exist/i.test(message)) {
        throw new Error(
          `the Application table has no ${NEW_COLUMNS.join(", ")} columns yet; run the app-model migration first, or use --dry-run / --gateway-apps`
        );
      }
      throw e;
    }
  }
}

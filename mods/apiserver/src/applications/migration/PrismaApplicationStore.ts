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
 * columns (url, flavor, signingSecret, speech, fallback) come from another change, so this file
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
  "flavor",
  "signingSecret",
  "speech",
  "fallback"
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
    return {
      ref,
      name: String(row.name),
      workspaceRef: String(row.accessKeyId),
      url: row.url,
      flavor: (row.flavor as MigratedApplication["flavor"]) ?? "native",
      signingSecret: String(row.signingSecret ?? ""),
      speech: row.speech as MigratedApplication["speech"],
      fallback: (row.fallback as MigratedApplication["fallback"]) ?? undefined
    };
  }

  async saveMigrated(app: MigratedApplication): Promise<void> {
    try {
      await this.prisma.application.update({
        where: { ref: app.ref },
        data: {
          url: app.url,
          flavor: app.flavor,
          signingSecret: app.signingSecret,
          speech: app.speech,
          fallback: app.fallback ?? null
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

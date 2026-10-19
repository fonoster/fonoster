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
import { getLogger } from "@fonoster/logger";
import { z } from "zod";
import {
  AI_COUSTICS_NAME,
  AI_COUSTICS_PROVIDER,
  aiCousticsOptionsSchema,
  aiCousticsPublicOptionsSchema,
  createAiCousticsFilter
} from "./aiCoustics/createAiCousticsFilter";
import { createAudioFilterChain } from "./createAudioFilterChain";
import { AudioFilter, AudioFilterChain, AudioFilterConfig } from "./types";

const logger = getLogger({ service: "appbridge", filePath: __filename });

const audioFiltersConfigSchema = z.array(
  z.object({
    name: z.string().min(1),
    options: z.record(z.unknown()).optional()
  })
);

type FilterDefinition = {
  description: string;
  // Everything the filter accepts, for callers inside the media server
  optionsSchema: z.ZodObject<z.ZodRawShape>;
  // What a voice application may set. Anything touching the filesystem or the
  // environment stays out of it, because applications are not trusted input.
  publicOptionsSchema: z.ZodObject<z.ZodRawShape>;
  // The catalog provider whose credential the filter needs (an `nc` provider), if any. The
  // session resolves it and hands it over through the trusted overlay.
  provider?: string;
  create: (options: Record<string, unknown>) => AudioFilter;
};

type CreateOptions = {
  // True only for callers inside the media server (config, dev tools)
  trusted?: boolean;
  // Server-side options merged over an application's, by filter name: the resolved credential,
  // model paths. Parsed with the full schema, so they never come from the application.
  trustedOverlay?: Record<string, Record<string, unknown>>;
};

type ChainOptions = CreateOptions & {
  // Called when a filter is disabled, at start or mid-stream, with the reason
  onDisabled?: (name: string, reason: string) => void;
};

function issuesOf(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}

class AudioFilterFactory {
  private static filters: Map<string, FilterDefinition> = new Map();

  static registerFilter(name: string, definition: FilterDefinition) {
    logger.verbose("registering audio filter", { name });
    this.filters.set(name, definition);
  }

  /** The provider whose credential a filter needs, or undefined for a filter without one. */
  static providerOf(name: string): string | undefined {
    return this.filters.get(name)?.provider;
  }

  static createFilter(
    config: AudioFilterConfig,
    { trusted = false, trustedOverlay }: CreateOptions = {}
  ): AudioFilter {
    const definition = this.filters.get(config.name);

    if (!definition) {
      throw new Error(
        `Unknown audio filter "${config.name}". Available filters: ${[
          ...this.filters.keys()
        ].join(", ")}`
      );
    }

    const schema = trusted
      ? definition.optionsSchema
      : definition.publicOptionsSchema;
    const parsed = schema.safeParse(config.options ?? {});

    if (!parsed.success) {
      throw new Error(
        `Invalid options for audio filter "${config.name}": ${issuesOf(parsed.error)}`
      );
    }

    const overlay = trustedOverlay?.[config.name];
    if (!overlay) return definition.create(parsed.data);

    const merged = definition.optionsSchema.safeParse({
      ...parsed.data,
      ...overlay
    });
    if (!merged.success) {
      throw new Error(
        `Invalid server options for audio filter "${config.name}": ${issuesOf(merged.error)}`
      );
    }
    return definition.create(merged.data);
  }

  static createChainFromConfig(
    configs: unknown,
    { onDisabled, ...options }: ChainOptions = {}
  ): AudioFilterChain {
    const parsed = audioFiltersConfigSchema.parse(configs);
    const filters: AudioFilter[] = [];

    try {
      parsed.forEach((c) =>
        filters.push(this.createFilter(c as AudioFilterConfig, options))
      );
    } catch (err) {
      // A filter may already hold a model or a native handle, so nothing
      // built here is left behind when a later one is rejected
      filters.forEach((filter) => {
        try {
          filter.close?.();
        } catch {
          // Best effort
        }
      });
      throw err;
    }

    return createAudioFilterChain(filters, { onDisabled });
  }

  static listFilters() {
    return [...this.filters.entries()].map(([name, definition]) => ({
      name,
      description: definition.description,
      defaults: definition.publicOptionsSchema.parse({})
    }));
  }
}

// Offered only where the vendor SDK is installed (it is not in the published image yet,
// docs/operators/audio-filters.md); elsewhere an app naming it fails open as an unknown filter.
const hasAiCousticsSdk = (() => {
  try {
    require.resolve("@ai-coustics/aic-sdk");
    return true;
  } catch {
    return false;
  }
})();

if (hasAiCousticsSdk) {
  AudioFilterFactory.registerFilter(AI_COUSTICS_NAME, {
    description:
      "ai-coustics speech enhancement: keeps the primary speaker, suppressing noise and competing voices",
    optionsSchema: aiCousticsOptionsSchema,
    publicOptionsSchema: aiCousticsPublicOptionsSchema,
    provider: AI_COUSTICS_PROVIDER,
    create: (options) => createAiCousticsFilter(options)
  });
}

export { AudioFilterFactory, audioFiltersConfigSchema };

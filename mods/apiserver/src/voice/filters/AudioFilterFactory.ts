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
  aiCousticsOptionsSchema,
  aiCousticsPublicOptionsSchema,
  createAiCousticsFilter
} from "./aiCoustics/createAiCousticsFilter";
import { createAudioFilterChain } from "./createAudioFilterChain";
import { AudioFilter, AudioFilterChain, AudioFilterConfig } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

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
  create: (options: Record<string, unknown>) => AudioFilter;
};

type CreateOptions = {
  // True only for callers inside the media server (config, dev tools)
  trusted?: boolean;
};

class AudioFilterFactory {
  private static filters: Map<string, FilterDefinition> = new Map();

  static registerFilter(name: string, definition: FilterDefinition) {
    logger.verbose("registering audio filter", { name });
    this.filters.set(name, definition);
  }

  static createFilter(
    config: AudioFilterConfig,
    { trusted = false }: CreateOptions = {}
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
      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new Error(
        `Invalid options for audio filter "${config.name}": ${issues}`
      );
    }

    return definition.create(parsed.data);
  }

  static createChainFromConfig(
    configs: unknown,
    options: CreateOptions = {}
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

    return createAudioFilterChain(filters);
  }

  static listFilters() {
    return [...this.filters.entries()].map(([name, definition]) => ({
      name,
      description: definition.description,
      defaults: definition.publicOptionsSchema.parse({})
    }));
  }
}

AudioFilterFactory.registerFilter(AI_COUSTICS_NAME, {
  description:
    "ai-coustics speech enhancement: keeps the primary speaker, suppressing noise and competing voices",
  optionsSchema: aiCousticsOptionsSchema,
  publicOptionsSchema: aiCousticsPublicOptionsSchema,
  create: (options) => createAiCousticsFilter(options)
});

export { AudioFilterFactory, audioFiltersConfigSchema };

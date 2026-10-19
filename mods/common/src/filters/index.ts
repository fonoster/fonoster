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
import { z } from "zod";

/**
 * The audio filters an app may configure (voice-session, "An app's audio filters are set through
 * the Applications API"). Apps are untrusted input, so each filter exposes a public option schema
 * here, shared by the apiserver (validation on write) and the appbridge (the filter factory).
 * Anything that touches the media server's filesystem, environment or credentials stays out.
 */

export const AI_COUSTICS_FILTER = "aiCoustics";

/** The ai-coustics filter's public options. */
export const aiCousticsPublicOptionsSchema = z
  .object({
    // The vendor's model id; restricted to its shape so it cannot name a path
    model: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9.]+)*$/, { message: "Invalid model name" })
      .default("quail-vf-2.2-s-16khz"),
    // Higher values suppress more, competing speech included
    enhancementLevel: z.number().min(0).max(1).default(1),
    // Keeps the delay but stops enhancing (for A/B tests)
    bypass: z.boolean().default(false)
  })
  // Reject anything else outright, so a server-only option (or a key) is refused, not ignored
  .strict();

/** Public option schemas by filter name. */
export const FILTER_SCHEMAS: Record<string, z.ZodObject<z.ZodRawShape>> = {
  [AI_COUSTICS_FILTER]: aiCousticsPublicOptionsSchema
};

/** The filter a noise-cancelling (`nc`) provider runs, by provider id. */
export const FILTER_BY_PROVIDER: Record<string, string> = {
  aicoustics: AI_COUSTICS_FILTER
};

export const FILTER_NAMES = Object.keys(FILTER_SCHEMAS);

/** The `nc` provider whose credential a filter runs with, or undefined for a filter without one. */
export function providerOfFilter(name: string): string | undefined {
  return Object.entries(FILTER_BY_PROVIDER).find(([, f]) => f === name)?.[0];
}

export type AudioFilterConfig = {
  name: string;
  options?: Record<string, unknown>;
};

export const audioFilterConfigSchema = z
  .object({
    name: z.string().min(1),
    options: z.record(z.unknown()).optional()
  })
  .strict();

export class AudioFilterConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioFilterConfigError";
  }
}

/**
 * Validates an app's `filters` list: known names and public options only. Returns the list with
 * each filter's options as given (defaults are applied by the filter itself). Throws
 * AudioFilterConfigError naming the first offending filter or option.
 */
export function parseFilters(input: unknown): AudioFilterConfig[] {
  const list = z.array(audioFilterConfigSchema).safeParse(input);
  if (!list.success) {
    throw new AudioFilterConfigError(
      `filters must be a list of { name, options? }: ${issues(list.error)}`
    );
  }
  return list.data.map((f) => {
    const schema = FILTER_SCHEMAS[f.name];
    if (!schema) {
      throw new AudioFilterConfigError(
        `unknown audio filter "${f.name}" (known: ${FILTER_NAMES.join(", ")})`
      );
    }
    const parsed = schema.safeParse(f.options ?? {});
    if (!parsed.success) {
      throw new AudioFilterConfigError(
        `invalid options for audio filter "${f.name}": ${issues(parsed.error)}`
      );
    }
    return f.options ? { name: f.name, options: f.options } : { name: f.name };
  });
}

function issues(error: z.ZodError): string {
  return error.issues
    .map((i) =>
      i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message
    )
    .join("; ");
}

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
import { existsSync, readFileSync } from "fs";
import { getLogger } from "@fonoster/logger";
import { z, ZodError, ZodTypeAny } from "zod";
import { findLegacyEnv, findMovedKeys, MovedKeys } from "./configHints";
import { interpolateEnv } from "./interpolateEnv";
import { parseConfigFile } from "./parseConfigFile";
import { resolveConfigFile } from "./resolveConfigFile";
import { strictDeep } from "./strictDeep";

const logger = getLogger({ service: "common", filePath: __filename });

type Env = Record<string, string | undefined>;

type LoadServiceConfigOptions<S extends ZodTypeAny> = {
  /** Service name, used in messages. */
  service: string;
  /** File name without extension. Defaults to `service`. */
  fileBase?: string;
  /** Zod schema that validates (and applies defaults to) the config. */
  schema: S;
  /** Defaults to `process.argv`; `--config <path>` picks the file. */
  argv?: string[];
  /** Only used to resolve `${VAR}` at `interpolatePaths`. Defaults to `process.env`. */
  env?: Env;
  /** Directories searched when `--config` is absent. */
  searchDirs?: string[];
  /**
   * Key paths that may reference `${VAR}` (values shared with containers
   * configured through `.env`). `${...}` anywhere else is an error.
   */
  interpolatePaths?: string[];
  /** Old key path → new key path, reported as hints. */
  movedKeys?: MovedKeys;
  /** Env var prefixes of the old env-based config, reported as a warning. */
  legacyEnvPrefixes?: string[];
  /**
   * Translates an older file layout into the current one before validation
   * (e.g. standalone Identity's original identity.json). Runs on the parsed
   * file; return it unchanged when it is already current.
   */
  migrate?: (raw: unknown) => unknown;
};

/**
 * One line per problem, each led by the key path:
 * `smtp: unknown key "hsot"`, `features.auth.methods[1]: Invalid enum value ...`.
 */
function formatIssues(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path
        .map((segment, index) =>
          typeof segment === "number"
            ? `[${segment}]`
            : index === 0
              ? segment
              : `.${segment}`
        )
        .join("");
      const where = path || "(root)";

      if (issue.code === "unrecognized_keys") {
        const keys = issue.keys.map((key) => `"${key}"`).join(", ");
        return `${where}: unknown key${issue.keys.length > 1 ? "s" : ""} ${keys}`;
      }

      return `${where}: ${issue.message}`;
    })
    .join("; ");
}

/**
 * Loads, interpolates and strictly validates a service's config file.
 * Throws with the file path and the offending key path on any problem.
 */
function loadServiceConfig<S extends ZodTypeAny>(
  options: LoadServiceConfigOptions<S>
): z.output<S> {
  const { service, schema } = options;
  const fileBase = options.fileBase ?? service;
  const argv = options.argv ?? process.argv;
  const env = options.env ?? process.env;

  const legacy = findLegacyEnv(options.legacyEnvPrefixes ?? [], env);
  if (legacy.length > 0) {
    logger.warn(
      `ignoring ${legacy.length} legacy environment variable(s); ${service} now reads its config file only: ${legacy.join(", ")}`
    );
  }

  const resolved = resolveConfigFile(fileBase, argv, options.searchDirs);
  const where = resolved.path ?? "(built-in defaults)";

  let raw: unknown = {};

  if ("searched" in resolved) {
    logger.warn(
      `no ${service} config file found (looked for ${resolved.searched.join(", ")}); using built-in defaults`
    );
  } else if (!existsSync(resolved.path)) {
    throw new Error(
      `unable to read ${service} config at ${resolved.path}: file not found`
    );
  } else {
    try {
      raw = parseConfigFile(resolved.path, readFileSync(resolved.path, "utf8"));
    } catch (e) {
      throw new Error(
        `unable to read ${service} config at ${resolved.path}: ${(e as Error).message}`
      );
    }
  }

  if (options.migrate) {
    raw = options.migrate(raw);
  }

  const moved = findMovedKeys(raw, options.movedKeys ?? {});
  if (moved.length > 0) {
    throw new Error(
      `invalid ${service} config at ${where}: ${moved.join("; ")}`
    );
  }

  let interpolated: unknown;
  try {
    interpolated = interpolateEnv(raw, env, {
      allowedPaths: options.interpolatePaths ?? []
    });
  } catch (e) {
    throw new Error(
      `invalid ${service} config at ${where}: ${(e as Error).message}`
    );
  }

  const strictSchema = strictDeep(schema);
  const result = strictSchema.safeParse(interpolated);
  if (!result.success) {
    throw new Error(
      `invalid ${service} config at ${where}: ${formatIssues(result.error)}`
    );
  }

  if (resolved.path) {
    logger.verbose(`loaded ${service} config`, { path: resolved.path });
  }

  return result.data as z.output<S>;
}

export { loadServiceConfig, LoadServiceConfigOptions };

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
import { resolve } from "path";
import { getLogger } from "@fonoster/logger";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { interpolateEnv } from "./interpolateEnv";

const logger = getLogger({ service: "common", filePath: __filename });

type Env = Record<string, string | undefined>;

type LoadServiceConfigOptions<T> = {
  /** Service name, used for the default file name and in error messages. */
  service: string;
  /** Zod schema that validates (and applies defaults to) the service's config. */
  schema: z.ZodType<T>;
  /** Defaults to `process.argv`. */
  argv?: string[];
  /** Defaults to `process.env`. */
  env?: Env;
};

/**
 * Resolves the config file path: `--config <path>` flag wins, then the
 * `FONOSTER_CONFIG` env var, then `./config/<service>.yaml` relative to the
 * working directory.
 */
function resolveConfigPath(
  service: string,
  argv: string[],
  env: Env
): { path: string; explicit: boolean } {
  const flagIndex = argv.indexOf("--config");
  const fromFlag = flagIndex >= 0 ? argv[flagIndex + 1] : undefined;
  const explicit = fromFlag ?? env.FONOSTER_CONFIG;

  return {
    path: resolve(process.cwd(), explicit ?? `./config/${service}.yaml`),
    explicit: explicit !== undefined
  };
}

/**
 * Loads and validates a single service's YAML config file, failing fast with a
 * readable message. Each service owns its own schema and only ever sees its own
 * file — a later move to Kubernetes just means mounting a smaller file.
 *
 * `${VAR}` references in the file are interpolated from the environment before
 * validation (see `interpolateEnv`); this is opt-in and meant only for secrets.
 *
 * If no `--config`/`FONOSTER_CONFIG` was given and the default file is absent,
 * the schema is parsed against an empty object so its defaults apply — this
 * keeps local dev and tests runnable with no file. Deployments set
 * `FONOSTER_CONFIG`, which makes a missing file a hard error.
 */
function loadServiceConfig<T>(options: LoadServiceConfigOptions<T>): T {
  const { service, schema } = options;
  const argv = options.argv ?? process.argv;
  const env = options.env ?? process.env;
  const { path, explicit } = resolveConfigPath(service, argv, env);

  let raw: unknown = {};

  if (existsSync(path)) {
    try {
      raw = parseYaml(readFileSync(path, "utf8")) ?? {};
    } catch (e) {
      throw new Error(
        `unable to read ${service} config at ${path}: ${(e as Error).message}`
      );
    }
  } else if (explicit) {
    throw new Error(
      `unable to read ${service} config at ${path}: file not found`
    );
  } else {
    logger.warn(
      `no ${service} config file at ${path}; using built-in defaults`,
      { service }
    );
  }

  let interpolated: unknown;
  try {
    interpolated = interpolateEnv(raw, env);
  } catch (e) {
    throw new Error(
      `invalid ${service} config at ${path}: ${(e as Error).message}`
    );
  }

  const result = schema.safeParse(interpolated);
  if (!result.success) {
    throw new Error(
      `invalid ${service} config at ${path}: ${fromError(result.error).toString()}`
    );
  }

  return result.data;
}

export { loadServiceConfig, resolveConfigPath, LoadServiceConfigOptions };

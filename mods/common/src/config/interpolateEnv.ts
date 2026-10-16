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
type Env = Record<string, string | undefined>;

/**
 * Shell / docker-compose style variable interpolation for config files.
 *
 * Supported forms inside any string value:
 *   - `${VAR}`          -> value of VAR; throws if VAR is unset or empty
 *   - `${VAR:-default}` -> value of VAR, or `default` when VAR is unset or empty
 *
 * Anything that is not a `${...}` reference is left untouched, so plain literals
 * (`http://asterisk:8088`, `$5.00`, ...) pass through unchanged. Services limit
 * it to values shared with other containers (see `allowedPaths`), so each value
 * is written once.
 */
const VAR_PATTERN = /\$\{([A-Za-z_][A-Za-z0-9_]*)(:-([^}]*))?\}/g;

function interpolateString(value: string, env: Env): string {
  return value.replace(
    VAR_PATTERN,
    (
      _match,
      name: string,
      hasDefault: string | undefined,
      fallback: string
    ) => {
      const current = env[name];

      if (current !== undefined && current !== "") {
        return current;
      }

      if (hasDefault !== undefined) {
        return fallback;
      }

      throw new Error(
        `references undefined environment variable \${${name}} and no default was given`
      );
    }
  );
}

type InterpolateOptions = {
  /**
   * Key paths where `${VAR}` may appear, e.g. `database.url` or `influxdb.*`
   * (`*` matches the key and everything below it; `*` alone matches every key). When given,
   * `${...}` at any other path is an error. When omitted, every string is interpolated.
   */
  allowedPaths?: string[];
};

const HAS_REFERENCE = /\$\{[^}]*\}/;

function isAllowed(path: string, allowedPaths: string[]): boolean {
  return allowedPaths.some((pattern) =>
    pattern === "*"
      ? true
      : pattern.endsWith(".*")
        ? path === pattern.slice(0, -2) ||
          path.startsWith(`${pattern.slice(0, -2)}.`)
        : path === pattern
  );
}

function walk<T>(
  input: T,
  env: Env,
  options: InterpolateOptions,
  path: string
): T {
  if (typeof input === "string") {
    if (!HAS_REFERENCE.test(input)) {
      return input;
    }

    const where = path || "(root)";

    if (options.allowedPaths && !isAllowed(path, options.allowedPaths)) {
      throw new Error(
        `${where}: \${...} is only allowed for values shared with other containers (${options.allowedPaths.join(", ") || "none here"})`
      );
    }

    try {
      return interpolateString(input, env) as unknown as T;
    } catch (e) {
      throw new Error(`${where}: ${(e as Error).message}`);
    }
  }

  if (Array.isArray(input)) {
    return input.map((item, index) =>
      walk(item, env, options, `${path}[${index}]`)
    ) as unknown as T;
  }

  if (input !== null && typeof input === "object") {
    const entries = Object.entries(input).map(
      ([key, value]) =>
        [key, walk(value, env, options, path ? `${path}.${key}` : key)] as const
    );
    return Object.fromEntries(entries) as T;
  }

  return input;
}

/**
 * Recursively walks an already-parsed config value and interpolates `${VAR}`
 * references in its strings. Returns a new value; the input is not mutated.
 * Errors name the key path where they happened.
 */
function interpolateEnv<T>(
  input: T,
  env: Env = process.env,
  options: InterpolateOptions = {}
): T {
  return walk(input, env, options, "");
}

export { interpolateEnv, InterpolateOptions };

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
 * (`http://asterisk:8088`, `$5.00`, ...) pass through unchanged. Interpolation is
 * never required — it exists so secrets can stay out of the committed file.
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

/**
 * Recursively walks an already-parsed config value and interpolates `${VAR}`
 * references in every string it contains. Returns a new value; the input is not
 * mutated.
 */
function interpolateEnv<T>(input: T, env: Env = process.env): T {
  if (typeof input === "string") {
    return interpolateString(input, env) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => interpolateEnv(item, env)) as unknown as T;
  }

  if (input !== null && typeof input === "object") {
    const entries = Object.entries(input).map(
      ([key, value]) => [key, interpolateEnv(value, env)] as const
    );
    return Object.fromEntries(entries) as T;
  }

  return input;
}

export { interpolateEnv };

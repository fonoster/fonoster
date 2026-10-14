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

/** Old key path → new key path, e.g. `{ encryptionKey: "encryption.key" }`. */
type MovedKeys = Record<string, string>;

function hasPath(input: unknown, path: string): boolean {
  let current: unknown = input;

  for (const segment of path.split(".")) {
    if (
      current === null ||
      typeof current !== "object" ||
      !(segment in (current as Record<string, unknown>))
    ) {
      return false;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return true;
}

/**
 * Lists the moved keys present in a raw config, as readable hints. The new
 * location may itself be valid, so this only reports what was found.
 */
function findMovedKeys(raw: unknown, movedKeys: MovedKeys): string[] {
  return Object.entries(movedKeys)
    .filter(([from]) => hasPath(raw, from))
    .map(([from, to]) => `"${from}" moved to "${to}"`);
}

/**
 * Names of environment variables that look like the old env-based config for
 * this service. Values are never returned, so they can be logged safely.
 */
function findLegacyEnv(prefixes: string[], env: Env = process.env): string[] {
  return Object.keys(env)
    .filter((name) => prefixes.some((prefix) => name.startsWith(prefix)))
    .sort();
}

export { findMovedKeys, findLegacyEnv, MovedKeys };

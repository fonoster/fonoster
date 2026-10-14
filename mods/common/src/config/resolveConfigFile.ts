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
import { existsSync } from "fs";
import { join, resolve } from "path";
import { CONFIG_EXTENSIONS } from "./parseConfigFile";

const DEFAULT_SEARCH_DIRS = ["/opt/fonoster", "./config"];

type ResolvedConfigFile =
  | { path: string; explicit: boolean }
  | { path: undefined; explicit: false; searched: string[] };

/**
 * Finds a service's config file. `--config <path>` wins; otherwise each search
 * directory is tried in order for `<fileBase>` with a supported extension.
 * Two candidates in the same directory is an error: the operator would not
 * know which one is in effect.
 */
function resolveConfigFile(
  fileBase: string,
  argv: string[],
  searchDirs: string[] = DEFAULT_SEARCH_DIRS
): ResolvedConfigFile {
  const flagIndex = argv.indexOf("--config");
  const fromFlag = flagIndex >= 0 ? argv[flagIndex + 1] : undefined;

  if (fromFlag) {
    return { path: resolve(process.cwd(), fromFlag), explicit: true };
  }

  const searched: string[] = [];

  for (const dir of searchDirs) {
    const candidates = CONFIG_EXTENSIONS.map((extension) =>
      resolve(process.cwd(), join(dir, `${fileBase}${extension}`))
    );
    searched.push(...candidates);

    const found = candidates.filter((candidate) => existsSync(candidate));

    if (found.length > 1) {
      throw new Error(
        `found more than one ${fileBase} config file (${found.join(", ")}); keep only one`
      );
    }

    if (found.length === 1) {
      return { path: found[0], explicit: false };
    }
  }

  return { path: undefined, explicit: false, searched };
}

export { resolveConfigFile, DEFAULT_SEARCH_DIRS, ResolvedConfigFile };

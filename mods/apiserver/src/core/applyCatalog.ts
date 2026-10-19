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
import * as fs from "fs";
import { Registry as RegistryNs } from "@fonoster/common";

/**
 * Applies the provider catalog file (`catalog.file` in fonoster.yaml) to the registry tables:
 * the same diff `fonoster-registry apply --store database` runs. Listed entries are added or
 * updated; entries not in the file are kept. Equal entries write nothing, so a restart with the
 * same file changes no rows. Returns the change lines (["no changes"] when there are none).
 */
async function applyCatalog(
  file: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any,
  /** The config key that names the file, for errors and the audit log. */
  key = "catalog.file"
): Promise<string[]> {
  let content: string;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch (e) {
    throw new Error(
      `${key} ${file} could not be read: ${(e as Error).message}`
    );
  }
  const store = await RegistryNs.PrismaRegistryStore.open(prisma);
  const registry = new RegistryNs.Registry({
    store,
    actor: "apiserver",
    commandLine: `apiserver ${key} ${file}`
  });
  const lines = registry.apply(content);
  await store.flush();
  return lines;
}

export { applyCatalog };

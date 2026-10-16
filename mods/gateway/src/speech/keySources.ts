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
import { WorkspaceKeySource } from "./Catalog";

/**
 * Credential resolution order (add-provider-registry "Each layer resolves the credentials of the
 * providers it calls"): the first source with a key for the workspace and provider wins (a
 * private cell's secrets, then the workspace's stored key); with none, the Catalog uses the
 * platform key named by credentialRef. Undefined when there is no source at all.
 */
export function chainKeySources(
  ...sources: (WorkspaceKeySource | undefined)[]
): WorkspaceKeySource | undefined {
  const present = sources.filter((s): s is WorkspaceKeySource => Boolean(s));
  if (!present.length) return undefined;
  if (present.length === 1) return present[0];
  return {
    async get(workspaceRef, providerId) {
      for (const s of present) {
        const key = await s.get(workspaceRef, providerId);
        if (key) return key;
      }
      return undefined;
    }
  };
}

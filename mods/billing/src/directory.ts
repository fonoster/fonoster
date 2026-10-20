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

/** Who owns a workspace (Identity has its own database). Accounts are per owner (D11). */
export type OwnerDirectory = {
  ownerOf(workspaceRef: string): Promise<string | undefined>;
};

/** Remembers answers for `ttlMs`, so admission does not ask Identity on every call. */
export function cachedDirectory(
  lookup: OwnerDirectory,
  ttlMs = 60_000,
  now = () => Date.now()
): OwnerDirectory {
  const cache = new Map<string, { owner?: string; at: number }>();
  return {
    async ownerOf(workspaceRef) {
      const hit = cache.get(workspaceRef);
      if (hit && now() - hit.at < ttlMs) return hit.owner;
      const owner = await lookup.ownerOf(workspaceRef);
      cache.set(workspaceRef, { owner, at: now() });
      return owner;
    }
  };
}

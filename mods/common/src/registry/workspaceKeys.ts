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
import { PrismaLike } from "./prisma";

// Workspace vendor keys (bring your own key, P1; registry 3.2): workspace_provider_keys binds a
// catalog provider to an encrypted Secret. Readers (AppBridge, the hosted Autopilot) need a
// client with the apiserver's encryption key so the Secret decrypts. Keys are held in memory for
// `cacheMs` only and never logged.

export type WorkspaceKeysOptions = {
  /** How long a looked-up key (or its absence) is reused (default 30 s). */
  cacheMs?: number;
  now?: () => number;
};

export class PrismaWorkspaceKeys {
  private cache = new Map<string, { at: number; key?: string }>();

  constructor(
    private readonly prisma: PrismaLike,
    private readonly options: WorkspaceKeysOptions = {}
  ) {}

  private now() {
    return this.options.now?.() ?? Date.now();
  }

  /** The workspace's key for a provider, or undefined (then the platform key applies). */
  async get(
    workspaceRef: string,
    providerId: string
  ): Promise<string | undefined> {
    if (!workspaceRef || !providerId) return undefined;
    const id = `${workspaceRef}\u0000${providerId}`;
    const hit = this.cache.get(id);
    if (hit && this.now() - hit.at < (this.options.cacheMs ?? 30_000))
      return hit.key;
    const binding = await this.prisma.workspaceProviderKey.findUnique({
      where: {
        accessKeyId_providerId: { accessKeyId: workspaceRef, providerId }
      }
    });
    let key: string | undefined;
    if (binding) {
      const secret = await this.prisma.secret.findUnique({
        where: { ref: binding.secretRef }
      });
      key = secret?.secret || undefined;
    }
    this.cache.set(id, { at: this.now(), key });
    return key;
  }

  /**
   * The workspace's key for a credentialRef: the providers that use that ref (from the catalog)
   * are tried in order.
   */
  async forCredentialRef(
    workspaceRef: string,
    credentialRef: string,
    providers: { id: string; credentialRef: string }[]
  ): Promise<string | undefined> {
    for (const p of providers.filter(
      (x) => x.credentialRef === credentialRef
    )) {
      const key = await this.get(workspaceRef, p.id);
      if (key) return key;
    }
    return undefined;
  }
}

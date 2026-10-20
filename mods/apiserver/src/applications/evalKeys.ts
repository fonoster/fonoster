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
import { Registry } from "@fonoster/common";

// Keys for agent evaluations (rework-autopilot 8.2): the workspace's own vendor key first, then
// the platform key named by the provider's credentialRef in the catalog. Same order as the hosted
// Autopilot (AP-B4); the retired integrations.json is not read.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EvalDb = any;

export function createEvalKeys(db: EvalDb, platform: Record<string, string>) {
  const workspaceKeys = new Registry.PrismaWorkspaceKeys(db);
  return async (providerId: string, workspaceRef: string) => {
    const own = await workspaceKeys.get(workspaceRef, providerId);
    if (own) return { key: own, source: "workspace" as const };
    const provider = await db.registryProvider.findUnique({
      where: { id: providerId }
    });
    const ref = provider?.credentialRef ?? `${providerId}-default`;
    const key = platform[ref];
    return key ? { key, source: "platform" as const } : undefined;
  };
}

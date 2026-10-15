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
import { providerKeySecretName } from "../providers/createProvidersHandlers";
import { MigrationDb } from "./types";

// Workspace vendor keys, bound the way the dashboard's Vendor keys page binds them (CP-B6): a
// Secret named `provider-key/<provider>` plus a workspace_provider_keys row. That binding is what
// the gateway and the hosted Autopilot read when they look up a workspace key by credentialRef
// (PrismaWorkspaceKeys.forCredentialRef), so migrated keys work without renaming (LG-B1).

export type BindResult =
  /** A new binding (and Secret) was written. */
  | "created"
  /** The workspace already has this exact key. */
  | "same"
  /** The workspace already has a different key for the provider; it is kept. */
  | "kept-existing";

/** Binds `key` as the workspace's key for `providerId` unless one is bound already. */
export async function bindWorkspaceKey(
  db: MigrationDb,
  input: { accessKeyId: string; providerId: string; key: string },
  dryRun = false
): Promise<BindResult> {
  const { accessKeyId, providerId, key } = input;
  const existing = await db.workspaceProviderKey.findUnique({
    where: { accessKeyId_providerId: { accessKeyId, providerId } }
  });
  if (existing) {
    const secret = await db.secret.findUnique({
      where: { ref: existing.secretRef }
    });
    return secret?.secret === key ? "same" : "kept-existing";
  }
  if (dryRun) return "created";
  const secret = await db.secret.create({
    data: { accessKeyId, name: providerKeySecretName(providerId), secret: key }
  });
  try {
    await db.workspaceProviderKey.create({
      data: { accessKeyId, providerId, secretRef: secret.ref }
    });
  } catch (e) {
    await db.secret.delete({ where: { ref: secret.ref } }).catch(() => {});
    throw e;
  }
  return "created";
}

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
import {
  getAccessKeyIdFromCall,
  GrpcErrorMessage,
  Registry as RegistryNs,
  withErrorHandling
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { listWarnings } from "./registryUsage";

// The read-only provider catalog and the workspace's own vendor keys (add-provider-registry 4.3;
// build log CP-B6). A key lives only in an encrypted, write-only Secret; workspace_provider_keys
// binds a catalog provider to it (P1). Nothing here returns a key.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProvidersDb = any;

const INVALID_ARGUMENT = 3;
const NOT_FOUND = 5;
const invalid = (message: string) => ({ code: INVALID_ARGUMENT, message });
const notFound = (message: string) => ({ code: NOT_FOUND, message });
const seconds = (d?: Date | null) => (d ? Math.floor(d.getTime() / 1000) : 0);

type Row = Record<string, unknown>;
type Callback<T> = (error: GrpcErrorMessage | null, response?: T) => void;
type Call<T> = { request: T };

/** The Secret name a provider key is stored under. */
export const providerKeySecretName = (providerId: string) =>
  `provider-key/${providerId}`;

const lifecycle = (state: string) => state.toLowerCase();
const visible = { state: { not: "RETIRED" } };

export type ProvidersOptions = {
  /**
   * The platform credentials (credentialRef names) the gateways are configured with. When set,
   * the catalog lists a provider (and its models and voices) only if its credential is here or
   * the workspace stored its own key for it (add-provider-registry 4.1, LO-B12). Unset: no
   * credential filtering (development).
   */
  platformCredentials?: string[];
};

export function createProvidersHandlers(
  db: ProvidersDb,
  options: ProvidersOptions = {}
) {
  const logger = getLogger({ service: "apiserver", filePath: __filename });
  const workspace = (call: unknown) =>
    getAccessKeyIdFromCall(call as ServerInterceptingCall);

  /** Providers, models and voices that are not retired; other workspaces' voices are hidden. */
  const listCatalog = async (
    call: Call<{ kind?: string; type?: string }>,
    callback: Callback<{ items: unknown[] }>
  ) => {
    const accessKeyId = workspace(call);
    const { kind, type } = call.request;
    const want = (k: string) => !kind || kind === k;
    const [allProviders, models, voices, keys]: Row[][] = await Promise.all([
      db.registryProvider.findMany({
        where: visible,
        orderBy: { id: "asc" }
      }),
      want("model")
        ? db.registryModel.findMany({
            where: { ...visible, ...(type ? { type } : {}) },
            orderBy: { id: "asc" }
          })
        : [],
      want("voice") && (!type || type === "tts")
        ? db.registryVoice.findMany({
            where: {
              ...visible,
              OR: [{ ownerWorkspace: null }, { ownerWorkspace: accessKeyId }]
            },
            include: { models: { orderBy: { position: "asc" } } },
            orderBy: { id: "asc" }
          })
        : [],
      options.platformCredentials
        ? db.workspaceProviderKey.findMany({
            where: { accessKeyId },
            select: { providerId: true }
          })
        : []
    ]);
    // Only usable providers (4.1): an adapter in this version and, when the platform's
    // credentials are configured, one of them, the workspace's own key, or no key needed.
    const own = new Set(keys.map((k) => k.providerId as string));
    const keyless = (p: Row) => !p.credentialRef;
    const usable = new Set(
      allProviders
        .filter(
          (p) =>
            RegistryNs.BUILT_IN_ADAPTERS.includes(p.adapter as string) &&
            (!options.platformCredentials ||
              keyless(p) ||
              options.platformCredentials.includes(p.credentialRef as string) ||
              own.has(p.id as string))
        )
        .map((p) => p.id as string)
    );
    const providers = want("provider")
      ? allProviders.filter((p) => usable.has(p.id as string))
      : [];
    const items = [
      ...providers
        .filter(
          (p) => !type || (p.capabilities as string[]).includes(type as string)
        )
        .map((p) => ({
          id: p.id,
          kind: "provider",
          label: p.label ?? "",
          state: lifecycle(p.state as string),
          providerId: p.id,
          capabilities: p.capabilities,
          keyless: keyless(p),
          replacement: p.replacement ?? "",
          retireOn: p.retireOn ?? ""
        })),
      ...models
        .filter((m) => usable.has(m.providerId as string))
        .map((m) => ({
          id: m.id,
          kind: "model",
          label: m.label ?? "",
          state: lifecycle(m.state as string),
          providerId: m.providerId,
          type: m.type,
          languages: m.languages,
          features: m.features,
          replacement: m.replacement ?? "",
          retireOn: m.retireOn ?? ""
        })),
      ...voices
        .filter((v) => usable.has(v.providerId as string))
        .map((v) => ({
          id: v.id,
          kind: "voice",
          label: v.label ?? "",
          state: lifecycle(v.state as string),
          providerId: v.providerId,
          type: "tts",
          languages: v.language ? [v.language] : [],
          models: (v.models as { modelId: string }[]).map((r) => r.modelId),
          gender: v.gender ?? "",
          replacement: v.replacement ?? "",
          retireOn: v.retireOn ?? ""
        }))
    ];
    callback(null, { items });
  };

  /** Stores or replaces the key; the old Secret's value is overwritten in place. */
  const setProviderKey = async (
    call: Call<{ providerId: string; key: string }>,
    callback: Callback<unknown>
  ) => {
    const accessKeyId = workspace(call);
    const { providerId, key } = call.request;
    if (!providerId) throw invalid("providerId is required");
    if (!key) throw invalid("key is required");
    if (key.length > 8192) throw invalid("key is too long");
    const provider = await db.registryProvider.findUnique({
      where: { id: providerId }
    });
    if (!provider)
      throw invalid(`provider ${providerId} is not in the catalog`);
    if (provider.state === "RETIRED")
      throw invalid(`provider ${providerId} is retired`);

    const existing = await db.workspaceProviderKey.findUnique({
      where: { accessKeyId_providerId: { accessKeyId, providerId } }
    });
    let row: Row;
    if (existing) {
      await db.secret.update({
        where: { ref: existing.secretRef },
        data: { secret: key, updatedAt: new Date() }
      });
      row = await db.workspaceProviderKey.update({
        where: { ref: existing.ref },
        data: { updatedAt: new Date() }
      });
    } else {
      // Not an interactive transaction: the field-encryption extension wraps the client, so the
      // Secret is written through it and removed again if the binding fails.
      const secret = await db.secret.create({
        data: {
          accessKeyId,
          name: providerKeySecretName(providerId),
          secret: key
        }
      });
      try {
        row = await db.workspaceProviderKey.create({
          data: { accessKeyId, providerId, secretRef: secret.ref }
        });
      } catch (e) {
        await db.secret.delete({ where: { ref: secret.ref } }).catch(() => {});
        throw e;
      }
    }
    logger.verbose("provider key set", { accessKeyId, providerId });
    callback(null, toKey(row));
  };

  const listProviderKeys = async (
    call: Call<unknown>,
    callback: Callback<{ items: unknown[] }>
  ) => {
    const rows: Row[] = await db.workspaceProviderKey.findMany({
      where: { accessKeyId: workspace(call) },
      orderBy: { providerId: "asc" }
    });
    callback(null, { items: rows.map(toKey) });
  };

  /** Removes the binding and its Secret (the Secret cascades the binding). */
  const deleteProviderKey = async (
    call: Call<{ providerId: string }>,
    callback: Callback<{ providerId: string }>
  ) => {
    const accessKeyId = workspace(call);
    const { providerId } = call.request;
    const existing = await db.workspaceProviderKey.findUnique({
      where: { accessKeyId_providerId: { accessKeyId, providerId } }
    });
    if (!existing) throw notFound(`no key for provider ${providerId}`);
    await db.secret.delete({ where: { ref: existing.secretRef } });
    callback(null, { providerId });
  };

  /** Deprecated or retired items the workspace uses (dashboard warnings, LO-B11). */
  const listWarningsHandler = async (
    call: Call<unknown>,
    callback: Callback<{ items: unknown[] }>
  ) => {
    callback(null, { items: await listWarnings(db, workspace(call)) });
  };

  return {
    listCatalog: withErrorHandling(listCatalog),
    listWarnings: withErrorHandling(listWarningsHandler),
    setProviderKey: withErrorHandling(setProviderKey),
    listProviderKeys: withErrorHandling(listProviderKeys),
    deleteProviderKey: withErrorHandling(deleteProviderKey)
  };
}

function toKey(row: Row) {
  return {
    ref: row.ref,
    providerId: row.providerId,
    secretRef: row.secretRef,
    createdAt: seconds(row.createdAt as Date),
    updatedAt: seconds(row.updatedAt as Date)
  };
}

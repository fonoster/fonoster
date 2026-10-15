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
import { readFileSync } from "fs";
import { getLogger } from "@fonoster/logger";
import { Router } from "express";
import { connect, credsAuthenticator, NatsConnection, StringCodec } from "nats";
import { ConfigSync, createConfigSync, SnapshotSources } from "./configSync";
import { createRegionsRouter } from "./createRegionsRouter";
import { createRegionSigner, RegionSigner } from "./enrollmentToken";
import { startRegionLink } from "./link";
import { createRegionNatsAuth, RegionNatsAuth } from "./natsAuth";
import { createRelayClient, RelayClient } from "./relay";
import { createRegionService, RegionService } from "./service";
import { PublicRegion, RegionError, RegionsDb } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();

export type RegionsConfig = {
  public: PublicRegion[];
  controlPlaneUrl?: string;
  leafUrl?: string;
  allowInsecureLeaf: boolean;
  signingKey?: { file: string; kid?: string };
  hub?: {
    url: string;
    credentialsFile: string;
    systemCredentialsFile: string;
    operatorSeedFile: string;
    accountSeedFile: string;
  };
  relay: {
    firstChunkTimeoutMs: number;
    idleTimeoutMs: number;
    maxBytes: number;
    maxConcurrent?: number;
  };
  currentVersion?: string;
  configDebounceMs: number;
};

export type RegionsRuntime = {
  service: RegionService;
  configSync?: ConfigSync;
  relay?: RelayClient;
  signer?: RegionSigner;
  publicRegions: PublicRegion[];
  routers: { path: string; router: Router }[];
  /** A workspace's synced config changed (numbers, apps, Routr resources, webhooks, policy). */
  onConfigChange(accessKeyId: string): void;
  /** The private region ref of a workspace, if it has one. */
  regionOf(accessKeyId: string): Promise<string | undefined>;
  close(): Promise<void>;
};

const read = (file: string) => readFileSync(file, "utf8");

/** Starts private regions on the control plane: service, hub link, config sync, relay, routes. */
export async function runRegions(
  config: RegionsConfig,
  deps: {
    db: RegionsDb;
    identityPublicKey: string;
    issuer: string;
    defaultControlPlaneUrl: string;
    defaultLeafUrl: string;
    currentVersion: string;
    sources: SnapshotSources;
    /** Tests pass connections instead of hub files. */
    hubConnections?: { nc: NatsConnection; system?: NatsConnection };
    natsSeeds?: { operatorSeed: string; accountSeed: string };
    signer?: RegionSigner;
    /** Tests on a plain NATS server (no hub) pass their own issuer/revoker. */
    natsAuth?: RegionNatsAuth;
  }
): Promise<RegionsRuntime> {
  const signer =
    deps.signer ??
    (config.signingKey
      ? createRegionSigner({
          privateKeyPem: read(config.signingKey.file),
          kid: config.signingKey.kid
        })
      : undefined);

  let nc = deps.hubConnections?.nc;
  let system = deps.hubConnections?.system;
  let seeds = deps.natsSeeds;
  if (!nc && config.hub) {
    const auth = (file: string) => credsAuthenticator(Buffer.from(read(file)));
    nc = await connect({
      servers: config.hub.url,
      authenticator: auth(config.hub.credentialsFile),
      maxReconnectAttempts: -1,
      name: "apiserver-regions"
    });
    system = await connect({
      servers: config.hub.url,
      authenticator: auth(config.hub.systemCredentialsFile),
      maxReconnectAttempts: -1,
      name: "apiserver-regions-sys"
    });
    seeds = {
      operatorSeed: read(config.hub.operatorSeedFile),
      accountSeed: read(config.hub.accountSeedFile)
    };
  }
  const natsAuth =
    deps.natsAuth ??
    (seeds ? createRegionNatsAuth({ ...seeds, system }) : undefined);
  const publish = (subject: string, payload: unknown) => {
    if (nc && !nc.isClosed())
      nc.publish(subject, sc.encode(JSON.stringify(payload)));
  };

  const service = createRegionService({
    db: deps.db,
    signer,
    natsAuth,
    publish,
    config: {
      issuer: deps.issuer,
      controlPlaneUrl: config.controlPlaneUrl ?? deps.defaultControlPlaneUrl,
      leafUrl: config.leafUrl ?? deps.defaultLeafUrl,
      currentVersion: config.currentVersion ?? deps.currentVersion
    }
  });

  let configSync: ConfigSync | undefined;
  let relay: RelayClient | undefined;
  let stopLink = () => {};
  if (nc) {
    configSync = createConfigSync({
      db: deps.db,
      service,
      sources: deps.sources,
      publish,
      debounceMs: config.configDebounceMs
    });
    relay = createRelayClient(nc, config.relay);
    stopLink = startRegionLink({ nc, db: deps.db, service, configSync });
    if (natsAuth && system)
      await service
        .pushRevocations()
        .catch((e) =>
          logger.warn(`could not push region revocations: ${e.message}`)
        );
  }

  const publicRegions = config.public;
  const router = createRegionsRouter({
    service,
    configSync,
    signer,
    publicRegions,
    identityPublicKey: deps.identityPublicKey
  });
  logger.info(
    `regions: ${publicRegions.map((r) => r.id).join(", ")} public; private ${
      signer && nc ? "on" : "off (needs regions.signingKey and regions.hub)"
    }`
  );

  return {
    service,
    configSync,
    relay,
    signer,
    publicRegions,
    routers: [{ path: "/", router }],
    onConfigChange: (accessKeyId) => configSync?.onChange(accessKeyId),
    async regionOf(accessKeyId) {
      return (await service.byWorkspace(accessKeyId))?.ref;
    },
    async close() {
      stopLink();
      configSync?.stop();
      if (!deps.hubConnections) {
        await nc?.drain().catch(() => undefined);
        await system?.drain().catch(() => undefined);
      }
    }
  };
}

/**
 * The hooks Identity calls when a workspace is created or deleted (PR-1, PR-2). Identity is built
 * before the regions runtime starts, so the hooks delegate to it once attached.
 */
export function createWorkspaceRegionHooks(publicRegions: PublicRegion[]) {
  let runtime: RegionsRuntime | undefined;
  const defaultRegion =
    (publicRegions.find((r) => r.default) ?? publicRegions[0])?.id ??
    "us-east-1";
  return {
    publicRegions: publicRegions.map((r) => r.id),
    defaultRegion,
    attach(r: RegionsRuntime) {
      runtime = r;
    },
    async createPrivateRegion(workspace: { accessKeyId: string }) {
      if (!runtime)
        throw new RegionError(
          503,
          "regions_unavailable",
          "private regions are not running"
        );
      return runtime.service.createPrivateRegion(workspace.accessKeyId);
    },
    async deleteRegion(workspace: { accessKeyId: string }) {
      await runtime?.service.deleteForWorkspace(workspace.accessKeyId);
    }
  };
}

export type WorkspaceRegionHooks = ReturnType<
  typeof createWorkspaceRegionHooks
>;

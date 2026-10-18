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
import { offeredPublicRegions } from "./createRegionsRouter";
import { createRegionSigner, RegionSigner } from "./enrollmentToken";
import { DEFAULT_REGION_ID } from "./ids";
import { startRegionLink } from "./link";
import { createRegionNatsAuth, RegionNatsAuth } from "./natsAuth";
import { createRelayClient, RelayClient } from "./relay";
import { prismaRelaySlots } from "./relaySlots";
import { createRegionService, RegionService } from "./service";
import {
  PublicRegion,
  RegionError,
  RegionsDb,
  WorkspaceDirectory
} from "./types";

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
  /** PR-19: the admin API's only credential (resolved from secret:// by the config loader). */
  operatorKey?: string;
  privateRegionMonthlyFeeCents?: number;
};

export type RegionsRuntime = {
  service: RegionService;
  configSync?: ConfigSync;
  relay?: RelayClient;
  signer?: RegionSigner;
  publicRegions: PublicRegion[];
  /** Private regions are on (signing key + hub); otherwise `routers` is empty. */
  privateRegions: boolean;
  routers: { path: string; router: Router }[];
  /** A workspace's synced config changed (numbers, apps, Routr resources, webhooks, policy). */
  onConfigChange(accessKeyId: string): void;
  /** The ref of the enrolled-region row a workspace is bound to (content is relayed from it). */
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
    /** Identity's issuer and audience, checked on user tokens. */
    identityTokenOptions?: { issuer?: string; audience?: string };
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
    /** Identity's workspaces (tests); production attaches it through the workspace hooks. */
    directory?: WorkspaceDirectory;
    /** The cloud's SIP root domain (workspace domains end with it). */
    rootDomain?: () => string;
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
    directory: deps.directory,
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
      debounceMs: config.configDebounceMs,
      rootDomain: deps.rootDomain
    });
    relay = createRelayClient(nc, {
      ...config.relay,
      slots: prismaRelaySlots(deps.db)
    });
    stopLink = startRegionLink({ nc, db: deps.db, service, configSync });
    if (natsAuth && system)
      await service
        .pushRevocations()
        .catch((e) =>
          logger.warn(`could not push region revocations: ${e.message}`)
        );
  }

  const publicRegions = config.public;
  // Private regions are an optional integration (the same condition as the
  // regions.private capability): without the signing key and the hub, the
  // regions HTTP API is not mounted at all, so its paths 404 like any unknown
  // path. Workspace placement on the configured public regions (the hooks)
  // does not use these routes and keeps working.
  const privateRegions = Boolean(signer && nc);
  const router = createRegionsRouter({
    service,
    configSync,
    signer,
    publicRegions,
    identityPublicKey: deps.identityPublicKey,
    identityTokenOptions: deps.identityTokenOptions,
    operatorKey: config.operatorKey,
    monthlyFeeCents: config.privateRegionMonthlyFeeCents
  });
  logger.info(
    `regions: configured public ${publicRegions
      .map((r) => r.id)
      .join(
        ", "
      )} (always offered; an enrolled public region with the same id replaces it once published and connected); enrolled regions ${
      privateRegions
        ? "on"
        : "off, regions HTTP API not mounted (needs regions.signingKey and regions.hub)"
    }; admin API ${
      !privateRegions
        ? "off (no region hub)"
        : config.operatorKey
          ? "on"
          : "off (no regions.operatorKey)"
    }`
  );

  return {
    service,
    configSync,
    relay,
    signer,
    publicRegions,
    privateRegions,
    routers: privateRegions ? [{ path: "/", router }] : [],
    onConfigChange: (accessKeyId) => configSync?.onChange(accessKeyId),
    async regionOf(accessKeyId) {
      return (await service.regionOfWorkspace(accessKeyId))?.ref;
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
 * The hooks Identity calls (PR-1, PR-14, PR-15): which region a new workspace may pick, and that a
 * workspace joined or left a region. Identity is built before the regions runtime starts, so the
 * hooks delegate to it once attached; Identity attaches its workspace directory the same way.
 */
export function createWorkspaceRegionHooks(publicRegions: PublicRegion[]) {
  let runtime: RegionsRuntime | undefined;
  let directory: WorkspaceDirectory | undefined;
  const defaultRegion =
    (publicRegions.find((r) => r.default) ?? publicRegions[0])?.id ??
    DEFAULT_REGION_ID;
  const connect = () => {
    if (!runtime || !directory) return;
    runtime.service.setDirectory(directory);
    void runtime.service
      .migrateLegacyOwners()
      .catch((e) =>
        logger.warn(`regions: owner backfill failed: ${(e as Error).message}`)
      );
  };
  return {
    publicRegions: publicRegions.map((r) => r.id),
    defaultRegion,
    attach(r: RegionsRuntime) {
      runtime = r;
      connect();
    },
    attachDirectory(d: WorkspaceDirectory) {
      directory = d;
      connect();
    },
    /**
     * The `Workspace.region` value for what the caller picked: an offered public region id, or
     * one of the caller's private regions (id or ref). Throws RegionError 400 otherwise.
     */
    async resolveRegion(ownerRef: string, requested?: string) {
      const wanted = requested || defaultRegion;
      const offered = runtime
        ? await offeredPublicRegions(runtime.service, publicRegions)
        : publicRegions.map((r) => ({ id: r.id }));
      if (offered.some((r) => r.id === wanted)) return { region: wanted };
      if (runtime) {
        const row = await runtime.service
          .owned(ownerRef, wanted)
          .catch(() => undefined);
        if (row) return { region: row.ref };
      }
      throw new RegionError(
        400,
        "region_invalid",
        `region must be one of ${offered.map((r) => r.id).join(", ")} or one of your private regions${
          wanted === "private"
            ? ' (create a private region first; "private" is not a region)'
            : ""
        }`
      );
    },
    /** A workspace joined (created) or left (deleted) a region: resync that region. */
    workspaceChanged(workspace: { accessKeyId: string; region: string }) {
      runtime?.configSync?.onRegionChange(workspace.region);
    }
  };
}

export type WorkspaceRegionHooks = ReturnType<
  typeof createWorkspaceRegionHooks
>;

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
import * as net from "net";
import * as path from "path";
import { URL } from "url";
import {
  openObjectStore,
  RecordStore,
  S3StoreConfig
} from "@fonoster/callrecord";
import { CellSecrets, Registry } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { connect } from "nats";
import { RegionAgent } from "./agent";
import { DatabaseApplier } from "./apply/DatabaseApplier";
import { ensureMediaNodePeer, sdkRoutrPort } from "./apply/RoutrApplier";
import { AgentConfig, packageVersion } from "./config";
import { DirIdentityStore, loadIdentity } from "./enroll";
import { RelayResponder } from "./relay";

const logger = getLogger({ service: "region-agent", filePath: __filename });

/** Whether something listens at a ws:// or http:// URL's host and port. */
export function tcpProbe(
  url: string,
  timeoutMs = 1500
): () => Promise<boolean> {
  const u = new URL(url);
  const port = Number(u.port || (/s:$/.test(u.protocol) ? 443 : 80));
  return () =>
    new Promise((resolve) => {
      const socket = net.connect({ host: u.hostname, port });
      const done = (ok: boolean) => {
        socket.destroy();
        resolve(ok);
      };
      socket.setTimeout(timeoutMs, () => done(false));
      socket.once("connect", () => done(true));
      socket.once("error", () => done(false));
    });
}

/** Starts the agent service from its config (`fonoster-region run`). */
export async function runAgent(
  config: AgentConfig,
  env: Record<string, string | undefined> = process.env
) {
  const identity = await loadIdentity(new DirIdentityStore(config.dataDir));
  const stateDir = config.stateDir ?? config.dataDir;
  const nc = await connect({
    servers: config.nats.url,
    name: `region-agent-${identity.regionRef}`,
    maxReconnectAttempts: -1
  });

  let db: DatabaseApplier | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  if (config.database) {
    const d = config.database;
    const url = d.url ?? env[d.urlEnv];
    if (!url) throw new Error(`database: ${d.urlEnv} is not set`);
    prisma = Registry.openPrismaClient({
      url,
      encryptionKey: env[d.encryptionKeyEnv],
      clientModule: d.clientModule
    });
    db = new DatabaseApplier(prisma, {
      workspaceRef: identity.workspaceRef,
      autopilot: config.autopilot && {
        url: config.autopilot.url,
        signingSecret: env[config.autopilot.signingSecretEnv]
      }
    });
  }

  const routr = config.routr
    ? sdkRoutrPort({ endpoint: config.routr.endpoint })
    : undefined;
  if (routr && config.routr?.mediaNodePeer) {
    const p = config.routr.mediaNodePeer as {
      name: string;
      username: string;
      aor: string;
      passwordEnv: string;
    };
    const password = env[p.passwordEnv];
    if (password)
      void ensureMediaNodePeer(routr, {
        name: p.name,
        username: p.username,
        aor: p.aor,
        password
      })
        .then((r) => logger.info(`media-node peer ${r}`))
        .catch((e) => logger.warn(`media-node peer: ${e.message}`));
  }

  let relay: RelayResponder | undefined;
  if (config.records) {
    const st = config.records.store as
      | { dir: string }
      | {
          s3: S3StoreConfig & {
            accessKeyIdEnv?: string;
            secretAccessKeyEnv?: string;
          };
        };
    const store = new RecordStore(
      openObjectStore(
        "dir" in st
          ? st
          : {
              s3: {
                ...st.s3,
                credentials:
                  st.s3.accessKeyIdEnv && st.s3.secretAccessKeyEnv
                    ? {
                        accessKeyId: env[st.s3.accessKeyIdEnv] ?? "",
                        secretAccessKey: env[st.s3.secretAccessKeyEnv] ?? ""
                      }
                    : undefined
              }
            }
      )
    );
    relay = new RelayResponder(
      () => store,
      path.join(stateDir, "relay-audit.jsonl")
    );
  }

  const secrets = config.cellSecrets
    ? CellSecrets.openCellSecrets(config.cellSecrets, env)
    : undefined;

  const agent = await new RegionAgent({
    identity,
    nc,
    version: config.version ?? packageVersion(),
    stateDir,
    heartbeatMs: config.heartbeatMs,
    db,
    routr,
    relay,
    secrets,
    autopilotProbe: config.autopilot
      ? tcpProbe(config.autopilot.url)
      : undefined
  }).start();

  (async () => {
    for await (const s of nc.status()) {
      if (s.type === "reconnect") void agent.requestConfig();
    }
  })().catch(() => undefined);

  return {
    agent,
    async stop() {
      await agent.stop();
      await nc.drain();
      await prisma?.$disconnect();
    }
  };
}

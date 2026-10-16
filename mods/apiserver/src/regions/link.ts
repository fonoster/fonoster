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
import { getLogger } from "@fonoster/logger";
import { Msg, NatsConnection, StringCodec } from "nats";
import { createIndexRecord } from "../records/createIndexRecord";
import { RecordIndexEntry } from "../records/types";
import { ConfigSync } from "./configSync";
import { RegionService } from "./service";
import { REGION_REF, RegionRow, RegionsDb, subjects } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();
const QUEUE = "apiserver-regions";

/** A workspace's key for a provider (workspace_provider_keys → encrypted Secret), uncached. */
export async function workspaceKey(
  db: RegionsDb,
  accessKeyId: string,
  providerId: string
): Promise<string | undefined> {
  const binding = await db.workspaceProviderKey.findUnique({
    where: { accessKeyId_providerId: { accessKeyId, providerId } }
  });
  if (!binding) return undefined;
  const secret = await db.secret.findUnique({
    where: { ref: binding.secretRef }
  });
  return secret?.secret || undefined;
}

/**
 * The control plane's side of the link (contract §3), subscribed on the region hub: heartbeats,
 * config requests, index entries and usage. The hub only lets a cell publish under its own
 * `region.<ref>.>`, so the subject's ref is the sender's identity.
 */
export function startRegionLink(deps: {
  nc: NatsConnection;
  db: RegionsDb;
  service: RegionService;
  configSync: ConfigSync;
}) {
  const { nc, db, service, configSync } = deps;
  const index = createIndexRecord(db);

  const enrolled = async (msg: Msg): Promise<RegionRow | undefined> => {
    const ref = msg.subject.split(".")[1];
    if (!REGION_REF.test(ref)) return undefined;
    const row = await service.byRef(ref);
    return row?.state === "enrolled" ? row : undefined;
  };
  const parse = (msg: Msg) => {
    try {
      return JSON.parse(sc.decode(msg.data)) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  };
  const on = (
    subject: string,
    fn: (
      msg: Msg,
      row: RegionRow,
      body: Record<string, unknown>
    ) => Promise<void>
  ) =>
    nc.subscribe(subject, {
      queue: QUEUE,
      callback: (err, msg) => {
        if (err) return;
        const body = parse(msg);
        if (!body) return;
        void enrolled(msg)
          .then((row) => (row ? fn(msg, row, body) : undefined))
          .catch((e) => logger.error(`${msg.subject}: ${e.message}`));
      }
    });

  const subs = [
    on("region.*.heartbeat", async (_msg, row, body) => {
      const updated = await service.heartbeat(row.ref, body);
      if (!updated) return;
      if (service.needsEndpoints(updated, body))
        nc.publish(
          subjects(row.ref).endpointsRequest,
          sc.encode(JSON.stringify({ type: "region.endpoints.request" }))
        );
      await configSync.afterHeartbeat(updated);
    }),
    on("region.*.endpoints", async (_msg, row, body) => {
      if (body.type !== undefined && body.type !== "region.endpoints") return;
      await service.reportEndpoints(row.ref, body);
    }),
    on("region.*.config.request", async (msg, row, body) => {
      const answer = await configSync.answer(
        row,
        Number(body.haveVersion ?? 0)
      );
      if (msg.reply) msg.respond(sc.encode(JSON.stringify(answer)));
    }),
    on("region.*.index", async (_msg, row, body) => {
      // The entry must name a workspace bound to this region (contract §5, PR-14).
      const ws = body.workspaceRef ?? body.accessKeyId;
      if (!body.callRef) return;
      if (!(await service.serves(row, ws))) {
        logger.warn(
          `region ${row.ref}: index entry ${String(body.callRef)} names a workspace the region does not serve; dropped`
        );
        return;
      }
      const entry = {
        ...(body as unknown as RecordIndexEntry),
        workspaceRef: String(ws),
        region: row.ref
      };
      await index(entry);
    }),
    on("region.*.usage", async (_msg, row, body) => {
      const minutes = Number(body.minutes);
      const period = String(body.period ?? "").slice(0, 16);
      if (!period || !Number.isFinite(minutes)) return;
      const accessKeyId = body.workspaceRef;
      if (!(await service.serves(row, accessKeyId))) return;
      await db.regionUsage.upsert({
        where: {
          regionRef_accessKeyId_period: {
            regionRef: row.ref,
            accessKeyId,
            period
          }
        },
        create: { regionRef: row.ref, accessKeyId, period, minutes },
        update: { minutes }
      });
    }),
    on("region.*.secrets.get", async (msg, row, body) => {
      // PR-20: a public region asks for a workspace's bring-your-own key, per call. The value is
      // only ever in this reply: never cached, stored or logged.
      if (!msg.reply) return;
      const reply = (m: unknown) => {
        msg.respond(sc.encode(JSON.stringify(m)));
      };
      const workspaceRef = body.workspaceRef;
      const provider = body.provider;
      if (typeof provider !== "string" || !provider)
        return reply({ type: "region.secrets.error", code: "bad_request" });
      if (row.kind !== "public")
        return reply({ type: "region.secrets.error", code: "not_public" });
      if (!(await service.serves(row, workspaceRef)))
        return reply({
          type: "region.secrets.error",
          code: "workspace_not_in_region"
        });
      const value = await workspaceKey(db, String(workspaceRef), provider);
      reply(
        value
          ? { type: "region.secrets.value", workspaceRef, provider, value }
          : { type: "region.secrets.none", workspaceRef, provider }
      );
    })
  ];
  logger.info(
    "region link: heartbeat, endpoints, config, index, usage and secrets consumers on"
  );
  return () => subs.forEach((s) => s.unsubscribe());
}

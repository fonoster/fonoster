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
import { REGION_REF, RegionRow, RegionsDb } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();
const QUEUE = "apiserver-regions";

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
      if (updated) await configSync.afterHeartbeat(updated);
    }),
    on("region.*.config.request", async (msg, row, body) => {
      const answer = await configSync.answer(
        row,
        Number(body.haveVersion ?? 0)
      );
      if (msg.reply) msg.respond(sc.encode(JSON.stringify(answer)));
    }),
    on("region.*.index", async (_msg, row, body) => {
      // Always the region's workspace, whatever the entry says (contract §5).
      const entry = {
        ...(body as unknown as RecordIndexEntry),
        workspaceRef: row.accessKeyId,
        region: row.ref
      };
      if (!entry.callRef) return;
      await index(entry);
    }),
    on("region.*.usage", async (_msg, row, body) => {
      const minutes = Number(body.minutes);
      const period = String(body.period ?? "").slice(0, 16);
      if (!period || !Number.isFinite(minutes)) return;
      await db.regionUsage.upsert({
        where: { regionRef_period: { regionRef: row.ref, period } },
        create: { regionRef: row.ref, period, minutes },
        update: { minutes }
      });
    })
  ];
  logger.info("region link: heartbeat, config, index and usage consumers on");
  return () => subs.forEach((s) => s.unsubscribe());
}

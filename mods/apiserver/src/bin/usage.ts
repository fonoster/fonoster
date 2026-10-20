#!/usr/bin/env node
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
/**
 * fonoster-usage: maintenance for the usage ledger (add-usage-metering D7).
 *
 *   fonoster-usage rebuild --from <YYYY-MM-DD> --to <YYYY-MM-DD> [--from-records]
 *
 * rebuild recomputes usage_daily for the days from usage_events. With --from-records it first
 * re-reads the sealed call records of those days and stores usage that never reached the ledger.
 */
import {
  createPrismaClient,
  createWorkspaceDirectory
} from "@fonoster/identity";
import { identityConfig } from "../core/identityConfig";
import { CALL_RECORDS } from "../envs";
import { CallRecordsConfig } from "../records/runCallRecords";
import { createStoreResolver } from "../records/stores";
import {
  rebuildUsageDaily,
  recoverUsageFromRecords
} from "../usage/rebuildUsage";
import { UsageDb } from "../usage/types";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const USAGE =
  "usage: fonoster-usage rebuild --from <YYYY-MM-DD> --to <YYYY-MM-DD> [--from-records]";

function option(args: string[], name: string) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main(args: string[]) {
  const from = option(args, "--from");
  const to = option(args, "--to");
  if (
    args[0] !== "rebuild" ||
    !from ||
    !to ||
    !DAY.test(from) ||
    !DAY.test(to) ||
    from > to
  ) {
    console.error(USAGE);
    return 2;
  }
  const { prisma } = await import("../core/db");
  const db = prisma as unknown as Parameters<
    typeof recoverUsageFromRecords
  >[0]["db"];
  if (args.includes("--from-records")) {
    const identity = createPrismaClient(
      identityConfig.dbUrl,
      identityConfig.encryptionKey
    );
    const recovered = await recoverUsageFromRecords({
      db,
      directory: createWorkspaceDirectory(identity),
      storeFor: createStoreResolver((CALL_RECORDS as CallRecordsConfig).stores),
      fromDay: from,
      toDay: to
    });
    console.log(`recovered ${recovered} usage lines from records`);
    await identity.$disconnect();
  }
  const totals = await rebuildUsageDaily(db as UsageDb, from, to);
  console.log(`rebuilt ${totals} daily totals for ${from}..${to}`);
  await prisma.$disconnect();
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e) => {
    console.error(e.message);
    process.exit(1);
  }
);

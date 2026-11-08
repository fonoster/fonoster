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
import { Client } from "pg";
import { BILLING, FONOSTER, IDENTITY, NEW_WORKSPACES, ROUTR } from "./queries";

const logger = getLogger({ service: "ops", filePath: __filename });

export type OpsDatabases = {
  fonoster: string;
  identity: string;
  routr: string;
  billing: string;
};

/**
 * A connection that can't write and can't hang: Envoy's /api route has no timeout, so these turn a
 * hung database into the 503.
 */
export async function connectReadOnly(url: string): Promise<Client> {
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 10000,
    options:
      "-c default_transaction_read_only=on -c statement_timeout=30000 -c lock_timeout=5000 -c TimeZone=UTC"
  });
  // A connection lost between queries emits this; with no listener it would stop the API server.
  client.on("error", () => undefined);
  await client.connect();
  return client;
}

async function query<T>(
  key: keyof OpsDatabases,
  url: string,
  statements: { text: string; values?: unknown[] }[]
): Promise<T[]> {
  let client: Client | undefined;
  try {
    client = await connectReadOnly(url);
    const rows: T[] = [];
    for (const { text, values } of statements) {
      rows.push((await client.query(text, values)).rows[0].o);
    }
    return rows;
  } catch (e) {
    // Never the error: its message and fields hold the host, the user or the SQL.
    logger.error(`ops: metrics query failed: features.ops.databases.${key}`);
    throw new Error("query_failed");
  } finally {
    await client?.end().catch(() => undefined);
  }
}

/** One snapshot of schema 1, without `schema` and `ts`. */
export async function readSnapshot(databases: OpsDatabases) {
  const [idn, ids] = await query<any>("identity", databases.identity, [
    { text: IDENTITY },
    { text: NEW_WORKSPACES }
  ]);
  const [fon] = await query<any>("fonoster", databases.fonoster, [
    { text: FONOSTER, values: [ids] }
  ]);
  const [routr] = await query<any>("routr", databases.routr, [{ text: ROUTR }]);
  const [bil] = await query<any>("billing", databases.billing, [
    { text: BILLING }
  ]);
  const { daily: billingDaily, ...billing } = bil;
  return {
    users: idn.users,
    workspaces: {
      ...idn.workspaces,
      active_7d: fon.active_7d,
      activated_7d: fon.activated_7d,
      activated_loose_7d: fon.activated_loose_7d,
      activated_total: fon.activated_total
    },
    apps: fon.apps,
    routr,
    calls: fon.calls,
    billing,
    daily: {
      calls: fon.daily.calls,
      minutes: fon.daily.minutes,
      signups: idn.daily.signups,
      verified: idn.daily.verified,
      converted: billingDaily.converted
    }
  };
}

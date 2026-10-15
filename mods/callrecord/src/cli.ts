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
import * as fs from "fs";
import { rebuildAnalytics } from "./analytics";
import { ClickHouseAnalyticsSink } from "./clickhouse";
import { FileKeyCustody } from "./keys";
import { ObjectStoreConfig, openObjectStore } from "./objectStore";
import { keySet } from "./sign";
import { RecordStore } from "./storage";

// fonoster-callrecord: region maintenance for call records (build log LO-B5, LO-B6).
//   keys rotate|list|retire|publish  the region's signing keys in a key directory (task 2.6)
//   analytics rebuild                drop the analytics store and refill it from records (6.2)

const HELP = `fonoster-callrecord <command>

  keys rotate --dir <dir> [--kid <kid>] [--prefix <region>]   new signing key, made current
  keys list --dir <dir>                                       keys, current one marked
  keys retire <kid> --dir <dir>                               delete an old private key (public kept)
  keys publish --dir <dir>                                    print the published key set (JWK Set)
  analytics rebuild (--store-dir <dir> | --store-config <file.json>)
                    --clickhouse-url <url> [--clickhouse-database fonoster]
                    [--clickhouse-table call_metrics] [--keep]
      --keep adds this store's records without dropping first (run once per workspace bucket)
      ClickHouse credentials: CLICKHOUSE_USER, CLICKHOUSE_PASSWORD (never on the command line)`;

type Flags = Record<string, string | true>;

function parse(argv: string[]) {
  const positional: string[] = [];
  const flags: Flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      positional.push(a);
      continue;
    }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) flags[a.slice(2)] = true;
    else {
      flags[a.slice(2)] = next;
      i++;
    }
  }
  return { positional, flags };
}

class UsageError extends Error {}

const need = (flags: Flags, name: string) => {
  const v = flags[name];
  if (typeof v !== "string") throw new UsageError(`--${name} is required`);
  return v;
};

/** The record store a rebuild reads: a directory (development) or an object store config. */
function storeFrom(flags: Flags): RecordStore {
  if (typeof flags["store-dir"] === "string")
    return new RecordStore(openObjectStore({ dir: flags["store-dir"] }));
  if (typeof flags["store-config"] === "string")
    return new RecordStore(
      openObjectStore(
        JSON.parse(
          fs.readFileSync(flags["store-config"], "utf8")
        ) as ObjectStoreConfig
      )
    );
  throw new UsageError("--store-dir or --store-config is required");
}

export async function run(
  argv: string[],
  out: (s: string) => void = console.log,
  env: Record<string, string | undefined> = process.env
): Promise<number> {
  const { positional, flags } = parse(argv);
  const [group, command, arg] = positional;
  try {
    if (group === "keys") {
      const dir = need(flags, "dir");
      switch (command) {
        case "rotate": {
          const kid = FileKeyCustody.rotate(dir, {
            kid: typeof flags.kid === "string" ? flags.kid : undefined,
            prefix: typeof flags.prefix === "string" ? flags.prefix : undefined
          });
          out(`new signing key ${kid} is current`);
          return 0;
        }
        case "list":
          for (const k of new FileKeyCustody(dir).list())
            out(
              `${k.current ? "*" : " "} ${k.kid}${k.canSign ? "" : " (retired: verify only)"}`
            );
          return 0;
        case "retire":
          if (!arg) throw new UsageError("keys retire <kid>");
          FileKeyCustody.retire(dir, arg);
          out(`${arg}: private key deleted; its public key stays published`);
          return 0;
        case "publish":
          out(
            JSON.stringify(
              keySet(new FileKeyCustody(dir).publicKeys()),
              null,
              2
            )
          );
          return 0;
      }
    }
    if (group === "analytics" && command === "rebuild") {
      const store = storeFrom(flags);
      const sink = new ClickHouseAnalyticsSink({
        url: need(flags, "clickhouse-url"),
        database:
          typeof flags["clickhouse-database"] === "string"
            ? flags["clickhouse-database"]
            : undefined,
        table:
          typeof flags["clickhouse-table"] === "string"
            ? flags["clickhouse-table"]
            : undefined,
        user: env.CLICKHOUSE_USER,
        password: env.CLICKHOUSE_PASSWORD
      });
      const keep = flags.keep === true;
      const n = await rebuildAnalytics(store, sink, { drop: !keep });
      out(
        `${keep ? "added to" : "rebuilt"} ${sink.qualified} from ${n} records`
      );
      return 0;
    }
    out(HELP);
    return group === "help" || flags.help ? 0 : 1;
  } catch (e) {
    out(`error: ${(e as Error).message}`);
    return 1;
  }
}

// eslint-disable-next-line no-undef
if (require.main === module) {
  run(process.argv.slice(2)).then((code) => process.exit(code));
}

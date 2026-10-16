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
import { normalizeSnapshot, regionDomainUri } from "../snapshot";
import { ConfigSnapshot, Row, SnapshotRegion } from "../types";

const logger = getLogger({ service: "region-agent", filePath: __filename });

// Applies the snapshot's Routr resources (domains, agents, trunks, ACLs, numbers) to the cell's
// Routr (RC-B8). Routr makes its own refs on create, so the cell keeps a map from control-plane
// refs to cell refs and rewrites references (an agent's domainRef, a number's trunkRef, …).
// The rows of every workspace in the snapshot are applied together (control-plane refs are
// unique across workspaces), and domains move under the region's SIP domain (PR-16).

export const ROUTR_KINDS = [
  "acls",
  "credentials",
  "trunks",
  "numbers",
  "domains",
  "agents",
  "peers"
] as const;
export type RoutrKind = (typeof ROUTR_KINDS)[number];

/** The few Routr calls the applier needs (the SDK in production, a fake in tests). */
export interface RoutrPort {
  create(kind: RoutrKind, data: Row): Promise<{ ref: string }>;
  update(kind: RoutrKind, data: Row & { ref: string }): Promise<void>;
  delete(kind: RoutrKind, ref: string): Promise<void>;
}

/** Order of creation: a resource comes after the ones it references. */
const ORDER: RoutrKind[] = [
  "acls",
  "credentials",
  "trunks",
  "numbers",
  "domains",
  "agents"
];

/** Reference fields per kind and the kind they point to. */
const REFS: Partial<Record<RoutrKind, Record<string, RoutrKind>>> = {
  trunks: {
    accessControlListRef: "acls",
    inboundCredentialsRef: "credentials",
    outboundCredentialsRef: "credentials"
  },
  numbers: { trunkRef: "trunks" },
  domains: { accessControlListRef: "acls" },
  agents: { domainRef: "domains", credentialsRef: "credentials" }
};

/** Read-only or expanded fields a create or update does not take. */
const DROP = [
  "ref",
  "apiVersion",
  "createdAt",
  "updatedAt",
  "extended",
  "domain",
  "trunk",
  "credentials",
  "accessControlList",
  "inboundCredentials",
  "outboundCredentials",
  "accessKeyId"
];

export type RefMap = Partial<Record<RoutrKind, Record<string, string>>>;

export type RoutrResult = {
  created: number;
  updated: number;
  deleted: number;
  failed: number;
};

const notFound = (e: unknown) =>
  /not.?found|does not exist|NOT_FOUND/i.test(String((e as Error)?.message));

export class RoutrApplier {
  constructor(
    private readonly routr: RoutrPort,
    /** The cp → cell ref map, persisted by the caller after each apply. */
    readonly refs: RefMap = {}
  ) {}

  /** The kind's rows across workspaces; undefined when no workspace carries the kind. */
  private rows(snapshot: ConfigSnapshot, kind: RoutrKind): Row[] | undefined {
    if (kind === "peers") return undefined;
    const n = normalizeSnapshot(snapshot);
    let out: Row[] | undefined;
    for (const w of Object.values(n.workspaces)) {
      const rows =
        kind === "numbers"
          ? w.kinds.numbers
          : (w.kinds.routr as Record<string, Row[] | undefined>)?.[kind];
      if (rows) out = [...(out ?? []), ...rows];
    }
    // A full multi-workspace snapshot with no workspace left: nothing of this kind remains.
    if (!out && snapshot.workspaces && snapshot.full !== false) return [];
    return out;
  }

  private translate(kind: RoutrKind, row: Row, region: SnapshotRegion): Row {
    const data: Row = {};
    for (const [k, v] of Object.entries(row))
      if (!DROP.includes(k) && v !== undefined) data[k] = v;
    for (const [field, target] of Object.entries(REFS[kind] ?? {})) {
      const ref = row[field] as string | undefined;
      if (!ref) continue;
      const mapped = this.refs[target]?.[ref];
      if (mapped) data[field] = mapped;
      else delete data[field];
    }
    if (kind === "domains" && Array.isArray(row.egressPolicies))
      data.egressPolicies = (row.egressPolicies as Row[])
        .map((p) => ({
          ...p,
          numberRef: this.refs.numbers?.[String(p.numberRef)]
        }))
        .filter((p) => p.numberRef);
    if (kind === "domains" && typeof row.domainUri === "string")
      data.domainUri = regionDomainUri(row.domainUri, region);
    return data;
  }

  async apply(snapshot: ConfigSnapshot): Promise<RoutrResult> {
    const result: RoutrResult = {
      created: 0,
      updated: 0,
      deleted: 0,
      failed: 0
    };
    const present: Partial<Record<RoutrKind, Set<string>>> = {};
    for (const kind of ORDER) {
      const rows = this.rows(snapshot, kind);
      if (!rows) continue; // kind absent from the snapshot: left as it is
      present[kind] = new Set();
      const map = (this.refs[kind] ??= {});
      for (const row of rows) {
        const cpRef = String(row.ref ?? "");
        if (!cpRef) continue;
        present[kind]!.add(cpRef);
        const data = this.translate(kind, row, snapshot.region ?? {});
        try {
          const cellRef = map[cpRef];
          if (cellRef) {
            try {
              await this.routr.update(kind, { ...data, ref: cellRef });
              result.updated++;
              continue;
            } catch (e) {
              if (!notFound(e)) throw e;
            }
          }
          map[cpRef] = (await this.routr.create(kind, data)).ref;
          result.created++;
        } catch (e) {
          result.failed++;
          logger.warn(`routr ${kind} ${cpRef}: ${(e as Error).message}`);
        }
      }
    }
    // Deletes in reverse order: agents before their domain, numbers before their trunk.
    for (const kind of [...ORDER].reverse()) {
      const keep = present[kind];
      if (!keep) continue;
      const map = this.refs[kind] ?? {};
      for (const [cpRef, cellRef] of Object.entries(map)) {
        if (keep.has(cpRef)) continue;
        try {
          await this.routr.delete(kind, cellRef);
          result.deleted++;
        } catch (e) {
          if (!notFound(e)) {
            result.failed++;
            logger.warn(
              `routr delete ${kind} ${cellRef}: ${(e as Error).message}`
            );
            continue;
          }
        }
        delete map[cpRef];
      }
    }
    return result;
  }
}

/** The Routr port over @routr/sdk (the cell's Routr API, e.g. routr:51908). */
export function sdkRoutrPort(options: {
  endpoint: string;
  insecure?: boolean;
  username?: string;
  password?: string;
}): RoutrPort {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const SDK = require("@routr/sdk").default ?? require("@routr/sdk");
  const opts = { insecure: true, ...options };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clients: Record<RoutrKind, any> = {
    acls: new SDK.Acls(opts),
    credentials: new SDK.Credentials(opts),
    trunks: new SDK.Trunks(opts),
    numbers: new SDK.Numbers(opts),
    domains: new SDK.Domains(opts),
    agents: new SDK.Agents(opts),
    peers: new SDK.Peers(opts)
  };
  const names: Record<RoutrKind, string> = {
    acls: "Acl",
    credentials: "Credentials",
    trunks: "Trunk",
    numbers: "Number",
    domains: "Domain",
    agents: "Agent",
    peers: "Peer"
  };
  return {
    create: (kind, data) => clients[kind][`create${names[kind]}`](data),
    update: async (kind, data) => {
      await clients[kind][`update${names[kind]}`](data);
    },
    delete: (kind, ref) => clients[kind][`delete${names[kind]}`](ref)
  };
}

/**
 * The media-node peer in the cell's Routr (what the apiserver does in a public region): media
 * nodes register under it and Routr balances calls by least sessions.
 */
export async function ensureMediaNodePeer(
  routr: RoutrPort,
  peer: { name: string; username: string; aor: string; password: string }
) {
  try {
    const created = await routr.create("peers", {
      name: peer.name,
      username: peer.username,
      aor: peer.aor,
      balancingAlgorithm: "LEAST_SESSIONS",
      withSessionAffinity: false,
      maxContacts: -1,
      enabled: true
    });
    const creds = await routr.create("credentials", {
      name: `${peer.name} credentials`,
      username: peer.username,
      password: peer.password
    });
    await routr.update("peers", { ...created, credentialsRef: creds.ref });
    return "created";
  } catch (e) {
    if (/already exist/i.test(String((e as Error).message))) return "exists";
    throw e;
  }
}

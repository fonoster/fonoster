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
import { generateKeyPairSync } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { CellSecrets } from "@fonoster/common";
import { KubeSecrets } from "./kube";
import {
  checkUrls,
  decodeToken,
  EnrollError,
  EnrollErrorCode,
  JwkSet,
  verifyToken
} from "./token";
import { Components, EnrollResponse, RegionIdentity } from "./types";

// `fonoster-region enroll <token>` (contract 2, task 3.1): verify the token, make the cell's key
// pair, exchange the token for leaf credentials, and keep what came back on the cell only.

/** Files of an enrolled cell (also the keys of the Kubernetes Secret). */
export const FILES = {
  identity: "region.json",
  creds: "leaf.creds",
  key: "cell.key",
  leafConf: "leaf.conf"
} as const;

export interface IdentityStore {
  readonly where: string;
  save(files: Record<string, string>): Promise<void>;
  load(): Promise<Record<string, string> | undefined>;
}

/** A data directory; every file 0600. */
export class DirIdentityStore implements IdentityStore {
  constructor(readonly dir: string) {}

  get where() {
    return this.dir;
  }

  async save(files: Record<string, string>) {
    fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
    for (const [name, data] of Object.entries(files))
      CellSecrets.writePrivateFile(path.join(this.dir, name), data);
  }

  async load() {
    const file = path.join(this.dir, FILES.identity);
    if (!fs.existsSync(file)) return undefined;
    return Object.fromEntries(
      Object.values(FILES)
        .filter((n) => fs.existsSync(path.join(this.dir, n)))
        .map((n) => [n, fs.readFileSync(path.join(this.dir, n), "utf8")])
    );
  }
}

/** A Kubernetes Secret (mount it as the agent's and NATS's data directory). */
export class KubeIdentityStore implements IdentityStore {
  constructor(
    private readonly kube: KubeSecrets,
    private readonly name: string
  ) {}

  get where() {
    return `secret/${this.name} (namespace ${this.kube.namespace})`;
  }

  save(files: Record<string, string>) {
    return this.kube.merge(this.name, files);
  }

  load() {
    return this.kube.get(this.name);
  }
}

/** The NATS include for the cell's server: one leaf remote to the control plane. */
export function leafConf(leafUrl: string, credsPath: string) {
  return [
    "# Written by `fonoster-region enroll`: the cell's link to the control plane (outbound only).",
    "leafnodes {",
    "  remotes = [",
    "    {",
    `      url: ${JSON.stringify(leafUrl)}`,
    `      credentials: ${JSON.stringify(credsPath)}`,
    "    }",
    "  ]",
    "}",
    ""
  ].join("\n");
}

export type EnrollOptions = {
  token: string;
  store: IdentityStore;
  version: string;
  components?: Components;
  /** Pins the control plane the token must name. */
  controlPlane?: string;
  allowInsecure?: boolean;
  /** Where the cell's NATS server reads the creds (written into leaf.conf). */
  natsCredsPath?: string;
  fetch?: typeof fetch;
  now?: () => number;
};

const ENROLL_CODES: EnrollErrorCode[] = [
  "token_invalid",
  "token_expired",
  "token_used",
  "region_not_found",
  "workspace_deleted"
];

/** Contract 2 status codes when the body carries no code. */
const BY_STATUS: Record<number, EnrollErrorCode> = {
  400: "token_invalid",
  410: "token_expired",
  404: "region_not_found"
};

export async function enroll(options: EnrollOptions): Promise<RegionIdentity> {
  const http = options.fetch ?? fetch;
  const { claims: unverified } = decodeToken(options.token);
  checkUrls(unverified, options);
  const base = unverified.cp.replace(/\/$/, "");
  const get = async (url: string, init?: Parameters<typeof fetch>[1]) => {
    try {
      return await http(url, init);
    } catch (e) {
      throw new EnrollError("unreachable", `${url}: ${(e as Error).message}`);
    }
  };
  const keysRes = await get(`${base}/.well-known/region-keys.json`);
  if (!keysRes.ok)
    throw new EnrollError(
      "unreachable",
      `region-keys.json answered ${keysRes.status}`
    );
  const claims = verifyToken(
    options.token,
    (await keysRes.json()) as JwkSet,
    options.now?.()
  );

  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const jwk = publicKey.export({ format: "jwk" }) as { x: string };
  const res = await get(`${base}/api/regions/enroll`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      token: options.token.trim(),
      publicKey: jwk.x,
      version: options.version,
      components: options.components ?? {
        mediaNodes: 1,
        gateways: 1,
        autopilot: true
      }
    })
  });
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { error: text.trim() };
  }
  if (!res.ok) {
    const said = String(body.error ?? body.code ?? body.reason ?? "");
    const code =
      ENROLL_CODES.find((c) => said.includes(c)) ??
      BY_STATUS[res.status] ??
      "enroll_failed";
    throw new EnrollError(code, `HTTP ${res.status}${said ? ` ${said}` : ""}`);
  }
  const r = body as unknown as EnrollResponse;
  if (!r.regionRef || !r.credentials)
    throw new EnrollError("enroll_failed", "no regionRef or credentials");

  const identity: RegionIdentity = {
    regionRef: r.regionRef,
    workspaceRef: r.workspaceRef ?? claims.wsp,
    controlPlane: base,
    leafUrl: r.leafUrl ?? claims.leaf,
    subjects: r.subjects ?? `region.${r.regionRef}.>`,
    configVersion: r.configVersion ?? 0,
    enrolledAt: new Date(options.now?.() ?? Date.now()).toISOString(),
    tokenId: claims.jti,
    publicKey: jwk.x
  };
  await options.store.save({
    [FILES.identity]: JSON.stringify(identity, null, 2) + "\n",
    [FILES.creds]: r.credentials,
    [FILES.key]: privateKey.export({ format: "pem", type: "pkcs8" }) as string,
    [FILES.leafConf]: leafConf(
      identity.leafUrl,
      options.natsCredsPath ?? "/etc/nats/region/leaf.creds"
    )
  });
  return identity;
}

/** The enrolled identity, or a clear error when the cell has not enrolled. */
export async function loadIdentity(
  store: IdentityStore
): Promise<RegionIdentity> {
  const files = await store.load();
  if (!files?.[FILES.identity])
    throw new Error(
      `this cell is not enrolled (nothing in ${store.where}); run \`fonoster-region enroll <token>\` first`
    );
  return JSON.parse(files[FILES.identity]) as RegionIdentity;
}

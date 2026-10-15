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
import { createHash } from "crypto";
import {
  createAccount,
  createOperator,
  createUser,
  fromSeed,
  KeyPair
} from "nkeys.js";

/**
 * Minimal NATS decentralized-auth JWTs (v2), enough for the region hub (RG-B2): an operator, the
 * system account, the REGIONS account (with its user revocations) and per-region users whose
 * permissions are `region.<ref>.>` only. Same encoding as nats-io/jwt: header
 * `{"typ":"JWT","alg":"ed25519-nkey"}`, base64url parts, `jti` = base32(sha512/256(claims)).
 */

const HEADER = { typ: "JWT", alg: "ed25519-nkey" };
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const b64url = (buf: Buffer | Uint8Array) =>
  Buffer.from(buf).toString("base64url");

function base32(buf: Buffer) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export type NatsClaims = {
  jti?: string;
  iat: number;
  iss: string;
  name?: string;
  sub: string;
  exp?: number;
  nats: Record<string, unknown>;
};

/** Signs claims with an nkey pair (operator signs accounts, accounts sign users). */
export function encodeNatsJwt(claims: NatsClaims, signer: KeyPair): string {
  const body = { ...claims, jti: "" };
  body.jti = base32(
    createHash("sha512-256").update(JSON.stringify(body)).digest()
  );
  const head = b64url(Buffer.from(JSON.stringify(HEADER)));
  const payload = b64url(Buffer.from(JSON.stringify(body)));
  const sig = signer.sign(Buffer.from(`${head}.${payload}`));
  return `${head}.${payload}.${b64url(sig)}`;
}

/** The claims of a NATS JWT (no verification; for tests and diagnostics). */
export function decodeNatsJwt(jwt: string): NatsClaims {
  return JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());
}

const now = () => Math.floor(Date.now() / 1000);
const pub = (kp: KeyPair) => kp.getPublicKey();

const NO_LIMITS = { subs: -1, data: -1, payload: -1 };

export function operatorJwt(operator: KeyPair, systemAccount: string) {
  return encodeNatsJwt(
    {
      iat: now(),
      iss: pub(operator),
      sub: pub(operator),
      name: "fonoster-regions",
      nats: { system_account: systemAccount, type: "operator", version: 2 }
    },
    operator
  );
}

/**
 * An account JWT. `revocations` maps user public keys to the unix time before which their JWTs
 * are revoked; re-publishing the account with a new entry disconnects that user.
 */
export function accountJwt(
  operator: KeyPair,
  account: string,
  name: string,
  revocations: Record<string, number> = {},
  extra: Record<string, unknown> = {}
) {
  return encodeNatsJwt(
    {
      iat: now(),
      iss: pub(operator),
      sub: account,
      name,
      nats: {
        limits: {
          ...NO_LIMITS,
          imports: -1,
          exports: -1,
          wildcards: true,
          conn: -1,
          leaf: -1
        },
        default_permissions: { pub: {}, sub: {} },
        ...(Object.keys(revocations).length ? { revocations } : {}),
        ...extra,
        type: "account",
        version: 2
      }
    },
    operator
  );
}

export type UserPermissions = { pub: string[]; sub: string[] };

export function userJwt(
  account: KeyPair,
  user: string,
  name: string,
  permissions?: UserPermissions
) {
  return encodeNatsJwt(
    {
      iat: now(),
      iss: pub(account),
      sub: user,
      name,
      nats: {
        ...(permissions
          ? {
              pub: { allow: permissions.pub },
              sub: { allow: permissions.sub }
            }
          : { pub: {}, sub: {} }),
        ...NO_LIMITS,
        type: "user",
        version: 2
      }
    },
    account
  );
}

/** A NATS credentials file (the user JWT and its seed), as `nsc` writes it. */
export function formatCreds(jwt: string, seed: string) {
  return `-----BEGIN NATS USER JWT-----
${jwt}
------END NATS USER JWT------

************************* IMPORTANT *************************
NKEY Seed printed below can be used to sign and prove identity.
NKEYs are sensitive and should be treated as secrets.

-----BEGIN USER NKEY SEED-----
${seed}
------END USER NKEY SEED------

*************************************************************
`;
}

/** Issues a fresh user (new nkey) under an account and returns its credentials file. */
export function issueUserCreds(
  account: KeyPair,
  name: string,
  permissions?: UserPermissions
) {
  const user = createUser();
  const jwt = userJwt(account, pub(user), name, permissions);
  return {
    publicKey: pub(user),
    jwt,
    creds: formatCreds(jwt, Buffer.from(user.getSeed()).toString())
  };
}

export const seedOf = (kp: KeyPair) => Buffer.from(kp.getSeed()).toString();
export const keyPairFromSeed = (seed: string) =>
  fromSeed(Buffer.from(seed.trim()));

export const REGIONS_ACCOUNT_NAME = "REGIONS";

/** Claims of the REGIONS account; the hub preloads it and the control plane re-signs it. */
export function regionsAccountJwt(
  operator: KeyPair,
  account: string,
  revocations: Record<string, number> = {}
) {
  return accountJwt(operator, account, REGIONS_ACCOUNT_NAME, revocations);
}

/**
 * Everything a region hub needs, generated once by `fonoster-region-hub-setup`:
 * the hub's nats.conf, the control plane's seeds and two credentials files (the control plane's
 * REGIONS user, unrestricted, and a system-account user to push account updates).
 */
export function generateRegionHub(options: {
  clientPort?: number;
  leafPort?: number;
  httpPort?: number;
  /** TLS for the leaf listener (production); omitted only for local stacks. */
  leafTls?: { certFile: string; keyFile: string };
  resolverDir?: string;
}) {
  const operator = createOperator();
  const sys = createAccount();
  const regions = createAccount();
  const opJwt = operatorJwt(operator, pub(sys));
  const sysJwt = accountJwt(operator, pub(sys), "SYS");
  const regJwt = regionsAccountJwt(operator, pub(regions));
  const cpUser = issueUserCreds(regions, "control-plane");
  const sysUser = issueUserCreds(sys, "control-plane-sys");
  const leafTls = options.leafTls
    ? `\n  tls { cert_file: "${options.leafTls.certFile}", key_file: "${options.leafTls.keyFile}" }`
    : "";
  const conf = `# Region hub (add-private-regions, RG-B2): cells link here over an outbound leaf node.
# Generated by fonoster-region-hub-setup; operator mode, accounts pushed by the control plane.
port: ${options.clientPort ?? 4222}
http_port: ${options.httpPort ?? 8222}
operator: ${opJwt}
system_account: ${pub(sys)}
resolver: {
  type: full
  dir: "${options.resolverDir ?? "/data/jwt"}"
  allow_delete: false
}
resolver_preload: {
  ${pub(sys)}: ${sysJwt}
  ${pub(regions)}: ${regJwt}
}
leafnodes {
  port: ${options.leafPort ?? 7422}${leafTls}
}
`;
  return {
    conf,
    operatorSeed: seedOf(operator),
    accountSeed: seedOf(regions),
    accountPublicKey: pub(regions),
    systemAccountPublicKey: pub(sys),
    controlPlaneCreds: cpUser.creds,
    systemCreds: sysUser.creds
  };
}

export { createAccount, createOperator, createUser, KeyPair };

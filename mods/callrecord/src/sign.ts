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
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  verify as cryptoVerify
} from "crypto";
import { SignedVcon, Vcon } from "./types";

// Records are signed with the region's key as JWS (ES256), general JSON serialization, so the
// signature travels with the record (call-record "Records are hashed and signed"). Keys are PEM
// files; the key history maps every kid ever used to its public key (open question O2).

export type SigningKey = {
  kid: string;
  privateKeyPem: string;
  /** HTTPS URL of the region's published key set (JWK Set); goes in the JWS header as jku. */
  jku?: string;
};
export type KeyHistory = Record<string, string>;

const b64url = (data: Buffer | string) =>
  Buffer.from(data).toString("base64url");

export function contentHash(data: Buffer): string {
  return `sha512-${createHash("sha512").update(data).digest("base64url")}`;
}

/** The protected JWS header of a record signed with `kid` (and `jku`, when published). */
function protectedHeader(kid: string, jku?: string) {
  return b64url(
    JSON.stringify({
      alg: "ES256",
      typ: "vcon+jws",
      kid,
      ...(jku ? { jku } : {})
    })
  );
}

function assemble(
  vcon: Vcon,
  header: string,
  payload: string,
  kid: string,
  signature: Buffer
): SignedVcon {
  return {
    payload,
    signatures: [
      {
        protected: header,
        signature: b64url(signature),
        // draft-04 5.2.2 also asks for x5c or x5u (a certificate chain); see build-log.md.
        header: { kid, uuid: vcon.uuid }
      }
    ]
  };
}

/** ES256 over `input` with a PEM private key (raw r||s, as JWS wants it). */
export function es256(privateKeyPem: string, input: Buffer): Buffer {
  return cryptoSign("sha256", input, {
    key: createPrivateKey(privateKeyPem),
    dsaEncoding: "ieee-p1363"
  });
}

export function signVcon(vcon: Vcon, key: SigningKey): SignedVcon {
  const header = protectedHeader(key.kid, key.jku);
  const payload = b64url(JSON.stringify(vcon));
  const signature = es256(
    key.privateKeyPem,
    Buffer.from(`${header}.${payload}`)
  );
  return assemble(vcon, header, payload, key.kid, signature);
}

/**
 * Signs through a key custody (task 2.6): the custody names the current key and signs, so the
 * private key may live in a file, a KMS or Vault and never reach this process.
 */
export async function signVconWith(
  vcon: Vcon,
  custody: KeyCustodyLike
): Promise<SignedVcon> {
  const { kid, jku } = custody.current();
  const header = protectedHeader(kid, jku);
  const payload = b64url(JSON.stringify(vcon));
  const signature = await custody.sign(
    kid,
    Buffer.from(`${header}.${payload}`)
  );
  return assemble(vcon, header, payload, kid, signature);
}

/** See `KeyCustody` in keys.ts (declared here to keep sign.ts free of file access). */
export type KeyCustodyLike = {
  current(): { kid: string; jku?: string };
  sign(kid: string, input: Buffer): Promise<Buffer>;
};

export function decodeVcon(signed: SignedVcon): Vcon {
  return JSON.parse(Buffer.from(signed.payload, "base64url").toString());
}

/** Returns the kid that verified the signature, or undefined. */
export function verifySignature(
  signed: SignedVcon,
  keys: KeyHistory
): string | undefined {
  for (const s of signed.signatures) {
    const kid = s.header?.kid;
    const pem = kid ? keys[kid] : undefined;
    if (!pem) continue;
    const ok = cryptoVerify(
      "sha256",
      Buffer.from(`${s.protected}.${signed.payload}`),
      { key: createPublicKey(pem), dsaEncoding: "ieee-p1363" },
      Buffer.from(s.signature, "base64url")
    );
    if (ok) return kid;
  }
  return undefined;
}

export type Jwk = {
  kty: string;
  crv?: string;
  x?: string;
  y?: string;
  kid: string;
  use: "sig";
  alg: "ES256";
};
export type JwkSet = { keys: Jwk[] };

/**
 * The region's published key set (owner decision: bare region keys plus a published key list,
 * pointed to by jku). Includes every key ever used, so old records keep verifying after rotation.
 */
export function keySet(history: KeyHistory): JwkSet {
  return {
    keys: Object.entries(history).map(([kid, pem]) => ({
      ...(createPublicKey(pem).export({ format: "jwk" }) as {
        kty: string;
        crv?: string;
        x?: string;
        y?: string;
      }),
      kid,
      use: "sig",
      alg: "ES256"
    }))
  };
}

/** The key history (kid → public PEM) from a published key set, for verifyRecord. */
export function keyHistoryFromSet(set: JwkSet): KeyHistory {
  return Object.fromEntries(
    set.keys.map((k) => {
      const { kid, use: _use, alg: _alg, ...jwk } = k;
      void _use;
      void _alg;
      return [
        kid,
        createPublicKey({ key: jwk, format: "jwk" })
          .export({ type: "spki", format: "pem" })
          .toString()
      ];
    })
  );
}

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

export type SigningKey = { kid: string; privateKeyPem: string };
export type KeyHistory = Record<string, string>;

const b64url = (data: Buffer | string) =>
  Buffer.from(data).toString("base64url");

export function contentHash(data: Buffer): string {
  return `sha512-${createHash("sha512").update(data).digest("base64url")}`;
}

export function signVcon(vcon: Vcon, key: SigningKey): SignedVcon {
  const header = b64url(
    JSON.stringify({ alg: "ES256", typ: "vcon+jws", kid: key.kid })
  );
  const payload = b64url(JSON.stringify(vcon));
  const signature = cryptoSign("sha256", Buffer.from(`${header}.${payload}`), {
    key: createPrivateKey(key.privateKeyPem),
    dsaEncoding: "ieee-p1363"
  });
  return {
    payload,
    signatures: [
      {
        protected: header,
        signature: b64url(signature),
        // draft-04 5.2.2 also asks for x5c or x5u (a certificate chain); see build-log.md.
        header: { kid: key.kid, uuid: vcon.uuid }
      }
    ]
  };
}

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
